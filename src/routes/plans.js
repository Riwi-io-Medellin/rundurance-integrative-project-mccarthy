const express = require('express');
const auth = require('../middleware/auth');
const controller = require('../controllers/planController');

const router = express.Router();

// GET /api/plans — all plans for trainer
router.get('/', auth, controller.getAll);

// GET /api/plans/athlete/:athleteId — plans for specific athlete (with planned_workouts)
router.get('/athlete/:athleteId', auth, controller.getByAthlete);

// GET /api/plans/:id — single plan with its planned workouts
router.get('/:id', auth, controller.getOne);

// POST /api/plans — create plan
router.post('/', auth, controller.create);

// PATCH /api/plans/:id — update plan
router.patch('/:id', auth, controller.update);

// DELETE /api/plans/:id — deactivate plan
router.delete('/:id', auth, controller.deactivate);

// POST /api/plans/:id/workouts — add planned workout to plan
router.post('/:id/workouts', auth, controller.addWorkout);

// PATCH /api/plans/:id/workouts/:workoutId — update planned workout
router.patch('/:id/workouts/:workoutId', auth, controller.updateWorkout);

// DELETE /api/plans/:id/workouts/:workoutId — delete planned workout
router.delete('/:id/workouts/:workoutId', auth, controller.removeWorkout);

module.exports = router;
