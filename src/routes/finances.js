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

router.get('/', auth, controller.getAll);
router.get('/athlete/:athleteId', auth, controller.getByAthlete);
router.post('/', auth, controller.create);
router.put('/:id/pay', auth, controller.markPaid);

module.exports = router;
