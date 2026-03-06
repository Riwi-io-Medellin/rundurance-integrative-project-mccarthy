require('dotenv').config();

/**
 * Sends a compact workout summary to the n8n webhook.
 * n8n then forwards it to AI to generate personalized feedback,
 * and POSTs the result back to /api/workouts/:id/feedback.
 *
 * Fire-and-forget: errors are logged but do not fail the upload.
 *
 * @param {object} athlete       - { name, weight_kg, height_cm }
 * @param {object} summary       - parsed FIT session summary
 * @param {object[]} laps        - parsed FIT laps array
 * @param {string} fitS3Key      - S3 key of the raw .FIT file
 * @param {number} completedWorkoutId
 * @param {object|null} plannedWorkout - { name, description } or null
 */
async function triggerFeedback(athlete, summary, laps, fitS3Key, completedWorkoutId, plannedWorkout = null) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL no configurado — omitiendo feedback automático');
    return;
  }

  const payload = buildPayload(athlete, summary, laps, fitS3Key, completedWorkoutId, plannedWorkout);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`n8n webhook respondió con ${res.status}:`, await res.text());
    }
  } catch (err) {
    console.error('Error al conectar con n8n:', err.message);
  }
}

function buildPayload(athlete, summary, laps, fitS3Key, completedWorkoutId, plannedWorkout) {
  const durationMin = summary.duration_s ? Math.round(summary.duration_s / 60) : null;
  const distanceKm  = summary.distance_m ? Math.round(summary.distance_m / 10) / 100 : null;
  const paceFormatted = formatPace(summary.avg_pace_sec_per_km);

  return {
    completed_workout_id: completedWorkoutId,
    fit_s3_key: fitS3Key,
    athlete: {
      name:       athlete.name,
      weight_kg:  athlete.weight_kg ?? null,
      height_cm:  athlete.height_cm ?? null,
    },
    session: {
      date:                     summary.executed_at?.toISOString?.().slice(0, 10) ?? null,
      sport:                    'running',
      duration_min:             durationMin,
      distance_km:              distanceKm,
      avg_hr_bpm:               summary.avg_heart_rate_bpm,
      max_hr_bpm:               summary.max_heart_rate_bpm,
      avg_pace_min_per_km:      paceFormatted,
      avg_cadence_spm:          summary.avg_cadence_spm,
      avg_power_w:              summary.avg_power_w,
      total_calories:           summary.total_calories,
      training_load:            summary.training_load,
      aerobic_training_effect:  summary.aerobic_training_effect,
      workout_rpe:              summary.workout_rpe,
      total_ascent_m:           summary.total_ascent_m,
    },
    laps: laps.map((lap) => ({
      lap:            lap.lap_number,
      distance_km:    lap.total_distance_m ? Math.round(lap.total_distance_m / 10) / 100 : null,
      duration_s:     lap.duration_s,
      avg_hr_bpm:     lap.avg_heart_rate_bpm,
      avg_power_w:    lap.avg_power_w,
      avg_pace_min_per_km: formatPace(
        lap.avg_speed_km_h > 0 ? Math.round(3600 / lap.avg_speed_km_h) : null
      ),
    })),
    planned_workout: plannedWorkout
      ? { name: plannedWorkout.name, description: plannedWorkout.description }
      : null,
  };
}

// Converts seconds/km to "M:SS" string, e.g. 289 → "4:49"
function formatPace(secPerKm) {
  if (!secPerKm) return null;
  const min = Math.floor(secPerKm / 60);
  const sec = String(secPerKm % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

module.exports = { triggerFeedback };
