const express    = require('express');
const auth       = require('../middleware/auth');
const controller = require('../controllers/financeController');

const router = express.Router();

// GET /api/finances — List all payments for the logged-in coach
router.get('/', auth, controller.getAll);

<<<<<<< develop
// POST /api/finances — Create a new payment record
router.post('/', auth, controller.create);
=======
// TODO 1: GET /api/finances — List all payments for the logged-in coach
router.get('/', auth, controller.getAll);
>>>>>>> main

// PATCH /api/finances/:id/pay — Mark a payment as paid
router.patch('/:id/pay', auth, controller.markPaid);

<<<<<<< develop
// GET /api/finances/summary/monthly — 6-month revenue aggregation
router.get('/summary/monthly', auth, controller.getMonthlySummary);
=======
// TODO 3: POST /api/finances — Create a new payment record
router.post('/', auth, controller.create);

// TODO 4: PUT /api/finances/:id/pay — Mark a payment as paid
// router.put('/:id/pay', auth, controller.markPaid);
>>>>>>> main

module.exports = router;
