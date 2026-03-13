const { parseFit }            = require('../services/fitParser');
const { parseZwo }            = require('../services/zwoParser');
const { uploadFitFile, uploadParsedFit, uploadZwoForAthlete, getObjectBuffer } = require('../services/s3');
const { triggerFeedback }     = require('../services/n8n');
const workoutModel            = require('../models/workoutModel');
const { findById: findAthleteById } = require('../models/athleteModel');
const db                      = require('../db/connection');

/**
 * POST /api/workouts/upload
 * Multipart form-data:
 *   - field "fit"       = .FIT binary file (required)
 *   - field "zwo"       = .ZWO XML file    (optional)
 *   - field "athlete_id" = number          (required)
 *
 * Flow:
 *  1. Parse .FIT buffer → { summary, laps }
 *  2. Parse .ZWO buffer → zwoParsed (if provided)
 *  3. Upload raw .FIT + parsed JSON to S3
 *  4. Upload .ZWO to S3 (if provided)
 *  5. Match to a planned workout by date (if any)
 *  6. If planned workout matched + ZWO provided → update zwo_s3_key on planned_workout
 *  7. Insert completed_workout row
 *  8. Insert completed_workout_lap rows
 *  9. Fire-and-forget n8n webhook
 * 10. Respond 201
 */
async function upload(req, res) {
  try {
    const fitFile = req.files?.find(f => f.fieldname === 'fit') ?? req.files?.[0];
    if (!fitFile) {
      return res.status(400).json({ error: 'Archivo .FIT requerido' });
    }

    const athleteId = parseInt(req.body.athlete_id, 10);
    if (!athleteId) {
      return res.status(400).json({ error: 'athlete_id requerido' });
    }

    const ownerCheck = await findAthleteById(athleteId);
    if (!ownerCheck) return res.status(404).json({ error: 'Atleta no encontrado' });
    if (ownerCheck.trainer_id !== req.trainer.trainer_id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const zwoFile = req.files?.find(f => f.fieldname === 'zwo') ?? null;

    // 1. Parse .FIT (supports both .fit and .fit.gz)
    let summary, laps;
    try {
      ({ summary, laps } = await parseFit(fitFile.buffer));
    } catch (err) {
      return res.status(400).json({ error: err.message ?? 'El archivo no es un .FIT válido.' });
    }

    // 2. Parse .ZWO (optional)
    let zwoParsed = null;
    let zwoS3Key  = null;

    if (zwoFile) {
      try {
        zwoParsed = parseZwo(zwoFile.buffer);
      } catch {
        return res.status(400).json({ error: 'El archivo .ZWO no es válido.' });
      }
    }

    // 3. Upload raw .FIT + parsed JSON to S3 in parallel (+ ZWO if present)
    const uploadPromises = [
      uploadFitFile(fitFile.buffer, athleteId, fitFile.originalname),
      uploadParsedFit({ summary, laps }, athleteId, fitFile.originalname),
    ];
    if (zwoFile) {
      uploadPromises.push(uploadZwoForAthlete(zwoFile.buffer, athleteId, zwoFile.originalname));
    }

    const uploadResults = await Promise.all(uploadPromises);
    const fitS3Key = uploadResults[0];
    if (zwoFile) zwoS3Key = uploadResults[2];

    // 4. Match to planned workout by execution date
    const executedDate = summary.executed_at
      ? new Date(summary.executed_at).toISOString().slice(0, 10)
      : null;

    const plannedWorkout = executedDate
      ? await workoutModel.findPlannedWorkoutByDate(athleteId, executedDate)
      : null;

    // 5. If ZWO uploaded and planned workout matched → persist zwo_s3_key
    if (zwoS3Key && plannedWorkout) {
      await workoutModel.updatePlannedWorkoutZwoKey(plannedWorkout.planned_workout_id, zwoS3Key);
    }

    // 6. Insert completed workout
    const completed = await workoutModel.insertCompletedWorkout({
      ...summary,
      athlete_id:         athleteId,
      planned_workout_id: plannedWorkout?.planned_workout_id ?? null,
      fit_s3_key:         fitS3Key,
    });

    // 7. Insert laps
    await workoutModel.insertLaps(completed.completed_workout_id, laps);

    // 8. Fire-and-forget n8n feedback
    const athlete = await getAthleteContext(athleteId);
    const trainerId = parseInt(req.body.trainer_id, 10) || 1; 
    triggerFeedback(athlete, summary, laps, fitS3Key, completed.completed_workout_id, trainerId, plannedWorkout);

    // 9. Respond
    return res.status(201).json({
      completed_workout_id: completed.completed_workout_id,
      laps_saved:           laps.length,
      matched_plan:         plannedWorkout?.name ?? null,
      zwo_uploaded:         !!zwoS3Key,
      message:              'Sesión subida correctamente',
    });
  } catch (err) {
    console.error('Error en upload:', err);
    return res.status(500).json({ error: 'Error al procesar la sesión' });
  }
}

/**
 * POST /api/workouts/:id/feedback
 * Called by n8n after AI generates feedback.
 * Body: { feedback: string, source: 'ai' | 'coach' }
 */
async function saveFeedback(req, res) {
  try {
    const completedWorkoutId = parseInt(req.params.id, 10);
    const { feedback, source } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: 'feedback requerido' });
    }

    const row = await workoutModel.insertFeedback({
      completed_workout_id: completedWorkoutId,
      trainer_id:           req.body.trainer_id ?? null,
      feedback,
      source:               source ?? 'ai',
    });

    return res.status(201).json(row);
  } catch (err) {
    console.error('Error en saveFeedback:', err);
    return res.status(500).json({ error: 'Error al guardar el feedback' });
  }
}

/**
 * GET /api/workouts/athlete/:athleteId
 * Returns last N completed workouts with AI feedback for a given athlete.
 */
async function getByAthlete(req, res) {
  try {
    const athleteId = parseInt(req.params.athleteId, 10);

    const ownerCheck = await findAthleteById(athleteId);
    if (!ownerCheck) return res.status(404).json({ error: 'Atleta no encontrado' });
    if (ownerCheck.trainer_id !== req.trainer.trainer_id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const limit = parseInt(req.query.limit, 10) || 20;

    const workouts = await workoutModel.getCompletedWorkoutsByAthlete(athleteId, limit);
    return res.json(workouts);
  } catch (err) {
    console.error('Error en getByAthlete:', err);
    return res.status(500).json({ error: 'Error al obtener sesiones' });
  }
}

/**
 * GET /api/workouts/:id
 * Returns a single completed workout with its laps and feedback.
 */
async function getById(req, res) {
  try {
    const workout = await workoutModel.getWorkoutById(parseInt(req.params.id, 10));
    if (!workout) return res.status(404).json({ error: 'Sesión no encontrada' });
    return res.json(workout);
  } catch (err) {
    console.error('Error en getById:', err);
    return res.status(500).json({ error: 'Error al obtener sesión' });
  }
}

/**
 * GET /api/workouts/:id/analysis
 * Full combined payload: athlete + session metrics + laps + planned_workout + zwo_parsed + feedback.
 * Designed for n8n to consume.
 */
async function getAnalysis(req, res) {
  try {
    const workout = await workoutModel.getWorkoutById(parseInt(req.params.id, 10));
    if (!workout) return res.status(404).json({ error: 'Sesión no encontrada' });

    // Fetch linked planned workout (if any)
    let plannedWorkout = null;
    let zwoParsed     = null;

    if (workout.planned_workout_id) {
      plannedWorkout = await workoutModel.getPlannedWorkoutById(workout.planned_workout_id);

      if (plannedWorkout?.zwo_s3_key) {
        try {
          const zwoBuffer = await getObjectBuffer(plannedWorkout.zwo_s3_key);
          zwoParsed = parseZwo(zwoBuffer);
        } catch (err) {
          console.warn('No se pudo parsear el ZWO desde S3:', err.message);
        }
      }
    }

    const durationMin = workout.duration_s ? Math.round(workout.duration_s / 60) : null;
    const distanceKm  = workout.distance_m ? Math.round(workout.distance_m / 10) / 100 : null;

    return res.json({
      completed_workout_id: workout.completed_workout_id,
      athlete: {
        athlete_id: workout.athlete_id,
        name:       `${workout.first_name ?? ''} ${workout.last_name ?? ''}`.trim(),
        birth_date: workout.birth_date ?? null,
      },
      session: {
        date:                    workout.executed_at ? new Date(workout.executed_at).toISOString().slice(0, 10) : null,
        sport:                   'running',
        duration_min:            durationMin,
        distance_km:             distanceKm,
        avg_hr_bpm:              workout.avg_heart_rate_bpm,
        max_hr_bpm:              workout.max_heart_rate_bpm,
        avg_pace_sec_per_km:     workout.avg_pace_sec_per_km,
        avg_cadence_spm:         workout.avg_cadence_spm,
        avg_power_w:             workout.avg_power_w,
        total_calories:          workout.total_calories,
        training_load:           workout.training_load,
        aerobic_training_effect: workout.aerobic_training_effect,
        workout_rpe:             workout.workout_rpe,
        total_ascent_m:          workout.total_ascent_m,
      },
      laps: (workout.laps ?? []).map(l => ({
        lap:           l.lap_number,
        distance_km:   l.total_distance_m ? Math.round(l.total_distance_m / 10) / 100 : null,
        duration_s:    l.duration_s,
        avg_hr_bpm:    l.avg_heart_rate_bpm,
        avg_power_w:   l.avg_power_w,
        avg_speed_km_h: l.avg_speed_km_h,
      })),
      planned_workout: plannedWorkout
        ? {
            planned_workout_id: plannedWorkout.planned_workout_id,
            name:               plannedWorkout.name,
            description:        plannedWorkout.description,
            scheduled_date:     plannedWorkout.scheduled_date,
          }
        : null,
      zwo_parsed: zwoParsed,
      feedback:        workout.feedback        ?? null,
      feedback_source: workout.feedback_source ?? null,
    });
  } catch (err) {
    console.error('Error en getAnalysis:', err);
    return res.status(500).json({ error: 'Error al obtener análisis' });
  }
}

// Fetches basic athlete context for the n8n payload
async function getAthleteContext(athleteId) {
  const { rows } = await db.query(
    `SELECT first_name, last_name, birth_date FROM athlete WHERE athlete_id = $1`,
    [athleteId]
  );
  const a = rows[0];
  return a
    ? { name: `${a.first_name} ${a.last_name}`, weight_kg: null, height_cm: null, birth_date: a.birth_date ?? null }
    : { name: 'Atleta', weight_kg: null, height_cm: null, birth_date: null };
}

/**
 * GET /api/workouts/stats/trainer
 * Returns aggregate stats: sessions today + per-athlete weekly metrics.
 */
async function getTrainerStats(req, res) {
  try {
    const stats = await workoutModel.getTrainerAggregateStats(req.trainer.trainer_id);
    return res.json(stats);
  } catch (err) {
    console.error('Error en getTrainerStats:', err);
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

module.exports = { upload, saveFeedback, getByAthlete, getById, getAnalysis, getTrainerStats };
