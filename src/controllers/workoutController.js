const { parseFit }            = require('../services/fitParser');
const { uploadFitFile }       = require('../services/s3');
const { triggerFeedback }     = require('../services/n8n');
const workoutModel            = require('../models/workoutModel');
const db                      = require('../db/connection');

/**
 * POST /api/workouts/upload
 * Multipart form-data: field "fit" = .FIT binary file, field "athlete_id" = number
 *
 * Flow:
 *  1. Parse .FIT buffer → { summary, laps }
 *  2. Upload raw .FIT to S3
 *  3. Match to a planned workout by date (if any)
 *  4. Insert completed_workout row
 *  5. Insert completed_workout_lap rows
 *  6. Fire-and-forget n8n webhook
 *  7. Respond 201
 */
async function upload(req, res) {
  try {
    // Accept any field name — grab the first uploaded file
    const file = req.files?.[0];
    if (!file) {
      return res.status(400).json({ error: 'Archivo .FIT requerido' });
    }

    const athleteId = parseInt(req.body.athlete_id, 10);
    if (!athleteId) {
      return res.status(400).json({ error: 'athlete_id requerido' });
    }

    // 1. Parse .FIT
    let summary, laps;
    try {
      ({ summary, laps } = await parseFit(file.buffer));
    } catch (parseErr) {
      return res.status(400).json({ error: 'El archivo no es un .FIT válido. Asegúrate de subir un archivo binario de Garmin.' });
    }

    // 2. Upload to S3
    const fitS3Key = await uploadFitFile(file.buffer, athleteId, file.originalname);

    // 3. Match to planned workout
    const executedDate = summary.executed_at
      ? new Date(summary.executed_at).toISOString().slice(0, 10)
      : null;

    const plannedWorkout = executedDate
      ? await workoutModel.findPlannedWorkoutByDate(athleteId, executedDate)
      : null;

    // 4. Insert completed workout
    const completed = await workoutModel.insertCompletedWorkout({
      ...summary,
      athlete_id:         athleteId,
      planned_workout_id: plannedWorkout?.planned_workout_id ?? null,
      fit_s3_key:         fitS3Key,
    });

    // 5. Insert laps
    await workoutModel.insertLaps(completed.completed_workout_id, laps);

    // 6. Fire-and-forget n8n feedback
    const athlete = await getAthleteContext(athleteId);
    triggerFeedback(athlete, summary, laps, fitS3Key, completed.completed_workout_id, plannedWorkout);

    // 7. Respond
    return res.status(201).json({
      completed_workout_id: completed.completed_workout_id,
      laps_saved:           laps.length,
      matched_plan:         plannedWorkout?.name ?? null,
      message:              'Sesión subida correctamente',
    });
  } catch (err) {
    console.error('Error en upload:', err);
    return res.status(500).json({ error: 'Error al procesar la sesión', detail: err.message });
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
    const limit = parseInt(req.query.limit, 10) || 20;

    const workouts = await workoutModel.getCompletedWorkoutsByAthlete(athleteId, limit);
    return res.json(workouts);
  } catch (err) {
    console.error('Error en getByAthlete:', err);
    return res.status(500).json({ error: 'Error al obtener sesiones' });
  }
}

// Fetches basic athlete context for the n8n payload
async function getAthleteContext(athleteId) {
  const { rows } = await db.query(
    `SELECT first_name, last_name FROM athlete WHERE athlete_id = $1`,
    [athleteId]
  );
  const a = rows[0];
  return a
    ? { name: `${a.first_name} ${a.last_name}`, weight_kg: null, height_cm: null }
    : { name: 'Atleta', weight_kg: null, height_cm: null };
}

module.exports = { upload, saveFeedback, getByAthlete };
