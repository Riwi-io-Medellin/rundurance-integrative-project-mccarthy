const db = require('../db/connection');

// ── Workout Plan CRUD ────────────────────────────────────────────────────────

async function createPlan({ athlete_id, trainer_id, name, description, start_date, end_date }) {
  const { rows } = await db.query(
    `INSERT INTO workout_plan (athlete_id, trainer_id, name, description, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [athlete_id, trainer_id, name, description || null, start_date, end_date || null]
  );
  return rows[0];
}

async function findAllByTrainer(trainerId) {
  const { rows } = await db.query(
    `SELECT wp.*, a.first_name, a.last_name
     FROM workout_plan wp
     JOIN athlete a ON wp.athlete_id = a.athlete_id
     WHERE wp.trainer_id = $1 AND wp.is_active = TRUE
     ORDER BY wp.start_date DESC`,
    [trainerId]
  );
  return rows;
}

async function findById(planId) {
  const { rows } = await db.query(
    `SELECT * FROM workout_plan WHERE workout_plan_id = $1`,
    [planId]
  );
  return rows[0] || null;
}

async function findByAthlete(athleteId) {
  const { rows } = await db.query(
    `SELECT * FROM workout_plan WHERE athlete_id = $1 AND is_active = TRUE ORDER BY start_date DESC`,
    [athleteId]
  );
  return rows;
}

async function updatePlan(planId, { name, description, start_date, end_date }) {
  const { rows } = await db.query(
    `UPDATE workout_plan
     SET name = $1, description = $2, start_date = $3, end_date = $4, updated_at = NOW()
     WHERE workout_plan_id = $5
     RETURNING *`,
    [name, description || null, start_date, end_date || null, planId]
  );
  return rows[0] || null;
}

async function deactivatePlan(planId) {
  const { rows } = await db.query(
    `UPDATE workout_plan SET is_active = FALSE, updated_at = NOW() WHERE workout_plan_id = $1 RETURNING *`,
    [planId]
  );
  return rows[0] || null;
}

// ── Planned Workout CRUD ─────────────────────────────────────────────────────

async function addPlannedWorkout({ workout_plan_id, scheduled_date, name, description, planned_duration_s, planned_distance_m }) {
  const { rows } = await db.query(
    `INSERT INTO planned_workout (workout_plan_id, scheduled_date, name, description, planned_duration_s, planned_distance_m)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [workout_plan_id, scheduled_date, name || null, description || null, planned_duration_s || null, planned_distance_m || null]
  );
  return rows[0];
}

async function getPlannedWorkoutsByPlan(planId) {
  const { rows } = await db.query(
    `SELECT * FROM planned_workout WHERE workout_plan_id = $1 ORDER BY scheduled_date ASC`,
    [planId]
  );
  return rows;
}

async function updatePlannedWorkout(plannedWorkoutId, { scheduled_date, name, description, planned_duration_s, planned_distance_m }) {
  const { rows } = await db.query(
    `UPDATE planned_workout
     SET scheduled_date = $1, name = $2, description = $3, planned_duration_s = $4, planned_distance_m = $5, updated_at = NOW()
     WHERE planned_workout_id = $6
     RETURNING *`,
    [scheduled_date, name || null, description || null, planned_duration_s || null, planned_distance_m || null, plannedWorkoutId]
  );
  return rows[0] || null;
}

async function deletePlannedWorkout(plannedWorkoutId) {
  await db.query(`DELETE FROM planned_workout WHERE planned_workout_id = $1`, [plannedWorkoutId]);
}

module.exports = {
  createPlan,
  findAllByTrainer,
  findById,
  findByAthlete,
  updatePlan,
  deactivatePlan,
  addPlannedWorkout,
  getPlannedWorkoutsByPlan,
  updatePlannedWorkout,
  deletePlannedWorkout,
};
