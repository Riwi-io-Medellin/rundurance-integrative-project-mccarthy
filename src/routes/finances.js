const express    = require('express');
const auth       = require('../middleware/auth');
const controller = require('../controllers/financeController');

const router = express.Router();

// GET /api/finances — List all payments for the logged-in coach
router.get('/', auth, controller.getAll);

// POST /api/finances — Create a new payment record
router.post('/', auth, controller.create);

// PATCH /api/finances/:id/pay — Mark a payment as paid
router.patch('/:id/pay', auth, controller.markPaid);

// GET /api/finances/summary/monthly — 6-month revenue aggregation
router.get('/summary/monthly', auth, controller.getMonthlySummary);

module.exports = router;
