const express    = require('express');
const auth       = require('../middleware/auth');
const controller = require('../controllers/financeController');

const router = express.Router();

// =============================================================================
// FINANCE ROUTES — TODO LIST
// =============================================================================
// Look at src/routes/auth.js and src/routes/workouts.js for examples.
// All finance routes need 'auth' middleware (only logged-in coaches can access).
// =============================================================================

// TODO 1: GET /api/finances — List all payments for the logged-in coach
// router.get('/', auth, controller.getAll);

// TODO 2: GET /api/finances/athlete/:athleteId — Payments for one athlete
// router.get('/athlete/:athleteId', auth, controller.getByAthlete);

// TODO 3: POST /api/finances — Create a new payment record
router.post('/', auth, controller.create);

// TODO 4: PUT /api/finances/:id/pay — Mark a payment as paid
// router.put('/:id/pay', auth, controller.markPaid);

module.exports = router;
