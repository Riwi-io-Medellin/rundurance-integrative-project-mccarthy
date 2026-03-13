const planModel = require('../models/planModel');
const { findById: findAthleteById } = require('../models/athleteModel');

// ── Workout Plan handlers ────────────────────────────────────────────────────

async function getAll(req, res) {
  try {
    const plans = await planModel.findAllByTrainer(req.trainer.trainer_id);
    res.json(plans);
  } catch (err) {
    console.error('Error en getAll plans:', err);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
}

async function getByAthlete(req, res) {
  try {
    const athleteId = parseInt(req.params.athleteId, 10);
    if (Number.isNaN(athleteId)) return res.status(400).json({ error: 'ID de atleta inválido' });

    const athlete = await findAthleteById(athleteId);
    if (!athlete) return res.status(404).json({ error: 'Atleta no encontrado' });
    if (athlete.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    const plans = await planModel.findByAthlete(athleteId);

    // Include planned_workouts for each plan
    const plansWithWorkouts = await Promise.all(
      plans.map(async (p) => ({
        ...p,
        planned_workouts: await planModel.getPlannedWorkoutsByPlan(p.workout_plan_id),
      }))
    );

    res.json(plansWithWorkouts);
  } catch (err) {
    console.error('Error en getByAthlete plans:', err);
    res.status(500).json({ error: 'Error al obtener planes del atleta' });
  }
}

async function getOne(req, res) {
  try {
    const planId = parseInt(req.params.id, 10);
    if (Number.isNaN(planId)) return res.status(400).json({ error: 'ID de plan inválido' });

    const plan = await planModel.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
    if (plan.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    const planned_workouts = await planModel.getPlannedWorkoutsByPlan(planId);
    res.json({ ...plan, planned_workouts });
  } catch (err) {
    console.error('Error en getOne plan:', err);
    res.status(500).json({ error: 'Error al obtener plan' });
  }
}

async function create(req, res) {
  try {
    const { athlete_id, name, description, start_date, end_date } = req.body;

    if (!athlete_id || !name || !start_date) {
      return res.status(400).json({ error: 'athlete_id, name y start_date son requeridos' });
    }

    const athlete = await findAthleteById(athlete_id);
    if (!athlete) return res.status(404).json({ error: 'Atleta no encontrado' });
    if (athlete.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    const plan = await planModel.createPlan({
      athlete_id,
      trainer_id: req.trainer.trainer_id,
      name,
      description,
      start_date,
      end_date,
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error('Error en create plan:', err);
    res.status(500).json({ error: 'Error al crear plan' });
  }
}

async function update(req, res) {
  try {
    const planId = parseInt(req.params.id, 10);
    if (Number.isNaN(planId)) return res.status(400).json({ error: 'ID de plan inválido' });

    const existing = await planModel.findById(planId);
    if (!existing) return res.status(404).json({ error: 'Plan no encontrado' });
    if (existing.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    const { name, description, start_date, end_date } = req.body;
    if (!name || !start_date) return res.status(400).json({ error: 'name y start_date son requeridos' });

    const updated = await planModel.updatePlan(planId, { name, description, start_date, end_date });
    res.json(updated);
  } catch (err) {
    console.error('Error en update plan:', err);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
}

async function deactivate(req, res) {
  try {
    const planId = parseInt(req.params.id, 10);
    if (Number.isNaN(planId)) return res.status(400).json({ error: 'ID de plan inválido' });

    const existing = await planModel.findById(planId);
    if (!existing) return res.status(404).json({ error: 'Plan no encontrado' });
    if (existing.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    await planModel.deactivatePlan(planId);
    res.json({ message: 'Plan desactivado' });
  } catch (err) {
    console.error('Error en deactivate plan:', err);
    res.status(500).json({ error: 'Error al desactivar plan' });
  }
}

// ── Planned Workout handlers ─────────────────────────────────────────────────

async function addWorkout(req, res) {
  try {
    const planId = parseInt(req.params.id, 10);
    if (Number.isNaN(planId)) return res.status(400).json({ error: 'ID de plan inválido' });

    const plan = await planModel.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
    if (plan.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    const { scheduled_date, name, description, planned_duration_s, planned_distance_m } = req.body;
    if (!scheduled_date) return res.status(400).json({ error: 'scheduled_date es requerido' });

    const workout = await planModel.addPlannedWorkout({
      workout_plan_id: planId,
      scheduled_date,
      name,
      description,
      planned_duration_s,
      planned_distance_m,
    });

    res.status(201).json(workout);
  } catch (err) {
    console.error('Error en addWorkout:', err);
    res.status(500).json({ error: 'Error al agregar sesión planificada' });
  }
}

async function updateWorkout(req, res) {
  try {
    const planId = parseInt(req.params.id, 10);
    const workoutId = parseInt(req.params.workoutId, 10);
    if (Number.isNaN(planId) || Number.isNaN(workoutId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const plan = await planModel.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
    if (plan.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    const { scheduled_date, name, description, planned_duration_s, planned_distance_m } = req.body;
    if (!scheduled_date) return res.status(400).json({ error: 'scheduled_date es requerido' });

    const updated = await planModel.updatePlannedWorkout(workoutId, {
      scheduled_date,
      name,
      description,
      planned_duration_s,
      planned_distance_m,
    });

    if (!updated) return res.status(404).json({ error: 'Sesión planificada no encontrada' });
    res.json(updated);
  } catch (err) {
    console.error('Error en updateWorkout:', err);
    res.status(500).json({ error: 'Error al actualizar sesión planificada' });
  }
}

async function removeWorkout(req, res) {
  try {
    const planId = parseInt(req.params.id, 10);
    const workoutId = parseInt(req.params.workoutId, 10);
    if (Number.isNaN(planId) || Number.isNaN(workoutId)) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const plan = await planModel.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' });
    if (plan.trainer_id !== req.trainer.trainer_id) return res.status(403).json({ error: 'No autorizado' });

    await planModel.deletePlannedWorkout(workoutId);
    res.json({ message: 'Sesión planificada eliminada' });
  } catch (err) {
    console.error('Error en removeWorkout:', err);
    res.status(500).json({ error: 'Error al eliminar sesión planificada' });
  }
}

module.exports = {
  getAll,
  getByAthlete,
  getOne,
  create,
  update,
  deactivate,
  addWorkout,
  updateWorkout,
  removeWorkout,
};
