const db = require('../db/connection');

/**
 * Inserts a completed workout summary row.
 * @param {object} data
 * @returns {Promise<object>} inserted row
 */
async function insertCompletedWorkout(data) {
  const { rows } = await db.query(
    `INSERT INTO completed_workout (
      athlete_id, planned_workout_id, executed_at, fit_s3_key,
      duration_s, distance_m, avg_heart_rate_bpm, max_heart_rate_bpm,
      avg_pace_sec_per_km, avg_cadence_spm, total_ascent_m, training_load,
      total_calories, aerobic_training_effect, anaerobic_training_effect,
      workout_rpe, workout_feel, avg_power_w, max_power_w, avg_form_power_w,
      avg_vertical_oscillation_mm, avg_stance_time_ms, avg_step_length_mm,
      avg_vertical_ratio, status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
    ) RETURNING *`,
    [
      data.athlete_id,
      data.planned_workout_id ?? null,
      data.executed_at,
      data.fit_s3_key,
      data.duration_s,
      data.distance_m,
      data.avg_heart_rate_bpm,
      data.max_heart_rate_bpm,
      data.avg_pace_sec_per_km,
      data.avg_cadence_spm,
      data.total_ascent_m,
      data.training_load,
      data.total_calories,
      data.aerobic_training_effect,
      data.anaerobic_training_effect,
      data.workout_rpe,
      data.workout_feel,
      data.avg_power_w,
      data.max_power_w,
      data.avg_form_power_w,
      data.avg_vertical_oscillation_mm,
      data.avg_stance_time_ms,
      data.avg_step_length_mm,
      data.avg_vertical_ratio,
      data.status ?? 'completed',
    ]
  );
  return rows[0];
}

/**
 * Bulk-inserts laps for a completed workout.
 * @param {number} completedWorkoutId
 * @param {object[]} laps
 */
async function insertLaps(completedWorkoutId, laps) {
  if (!laps || laps.length === 0) return;

  const values = [];
  const params = [];
  let p = 1;

  for (const lap of laps) {
    values.push(
      `($${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++},$${p++})`
    );
    params.push(
      completedWorkoutId,
      lap.lap_number,
      lap.start_time,
      lap.total_distance_m,
      lap.duration_s,
      lap.avg_speed_km_h,
      lap.total_calories,
      lap.avg_heart_rate_bpm,
      lap.max_heart_rate_bpm,
      lap.avg_cadence_spm,
      lap.avg_power_w,
      lap.avg_form_power_w,
      lap.total_ascent_m,
      lap.avg_vertical_oscillation_mm,
      lap.avg_stance_time_ms,
      lap.intensity,
      lap.lap_trigger
    );
  }

  await db.query(
    `INSERT INTO completed_workout_lap (
      completed_workout_id, lap_number, start_time,
      total_distance_m, duration_s, avg_speed_km_h, total_calories,
      avg_heart_rate_bpm, max_heart_rate_bpm, avg_cadence_spm,
      avg_power_w, avg_form_power_w, total_ascent_m,
      avg_vertical_oscillation_mm, avg_stance_time_ms,
      intensity, lap_trigger
    ) VALUES ${values.join(', ')}`,
    params
  );
}

/**
 * Saves AI or coach feedback for a completed workout.
 * @param {object} data - { completed_workout_id, trainer_id?, feedback, source }
 * @returns {Promise<object>} inserted row
 */
async function insertFeedback(data) {
  const { rows } = await db.query(
    `INSERT INTO workout_feedback (completed_workout_id, trainer_id, source, feedback)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.completed_workout_id, data.trainer_id ?? null, data.source ?? 'ai', data.feedback]
  );
  return rows[0];
}

/**
 * Finds a planned workout for an athlete on a given date.
 * Used to match an uploaded .FIT to its planned session.
 * @param {number} athleteId
 * @param {string} date - ISO date string YYYY-MM-DD
 * @returns {Promise<object|null>}
 */
async function findPlannedWorkoutByDate(athleteId, date) {
  const { rows } = await db.query(
    `SELECT pw.*
     FROM planned_workout pw
     JOIN workout_plan wp ON pw.workout_plan_id = wp.workout_plan_id
     WHERE wp.athlete_id = $1
       AND pw.scheduled_date = $2
     LIMIT 1`,
    [athleteId, date]
  );
  return rows[0] ?? null;
}

/**
 * Lists completed workouts for an athlete, newest first.
 * @param {number} athleteId
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function getCompletedWorkoutsByAthlete(athleteId, limit = 20) {
  const { rows } = await db.query(
    `SELECT cw.*, wf.feedback, wf.source AS feedback_source
     FROM completed_workout cw
     LEFT JOIN workout_feedback wf ON wf.completed_workout_id = cw.completed_workout_id
                                   AND wf.source = 'ai'
     WHERE cw.athlete_id = $1
     ORDER BY cw.executed_at DESC
     LIMIT $2`,
    [athleteId, limit]
  );
  return rows;
}

/**
 * Returns a single completed workout with its laps and most recent feedback.
 * @param {number} completedWorkoutId
 * @returns {Promise<object|null>}
 */
async function getWorkoutById(completedWorkoutId) {
  const { rows } = await db.query(
    `SELECT cw.*,
            a.first_name, a.last_name,
            wf.feedback, wf.source AS feedback_source, wf.created_at AS feedback_at
     FROM completed_workout cw
     JOIN athlete a ON a.athlete_id = cw.athlete_id
     LEFT JOIN workout_feedback wf ON wf.completed_workout_id = cw.completed_workout_id
     WHERE cw.completed_workout_id = $1
     ORDER BY wf.created_at DESC
     LIMIT 1`,
    [completedWorkoutId]
  );
  if (!rows[0]) return null;

  const { rows: laps } = await db.query(
    `SELECT * FROM completed_workout_lap WHERE completed_workout_id = $1 ORDER BY lap_number`,
    [completedWorkoutId]
  );

  return { ...rows[0], laps };
}

module.exports = {
  insertCompletedWorkout,
  insertLaps,
  insertFeedback,
  findPlannedWorkoutByDate,
  getCompletedWorkoutsByAthlete,
  getWorkoutById,
};
