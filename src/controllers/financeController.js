const financeModel = require('../models/financeModel');

// =============================================================================
// FINANCE CONTROLLER — TODO LIST
// =============================================================================
// This file handles HTTP requests for payment/billing operations.
// Look at authController.js and workoutController.js for examples.
//
// REMEMBER: req.trainer.trainer_id gives you the logged-in coach's ID.
// =============================================================================

// TODO 1: Create function getAll(req, res)
// - Endpoint: GET /api/finances
// - FIRST: call financeModel.updateOverduePayments() to auto-transition overdue payments
// - THEN: call financeModel.findAllByTrainer(req.trainer.trainer_id)
// - Return res.json(payments)
// - Why update first? So the coach always sees current statuses.

// TODO 2: Create function getByAthlete(req, res)
// - Endpoint: GET /api/finances/athlete/:athleteId
// - Get athleteId from req.params.athleteId
// - Call financeModel.findByAthlete(athleteId)
// - Return res.json(payments)

// TODO 3: Create function create(req, res)
// - Endpoint: POST /api/finances
// - Extract { athlete_id, amount, due_date, notes } from req.body
// - Validate: athlete_id, amount, due_date are required (return 400 if missing)
// - Add trainer_id from req.trainer.trainer_id
// - Call financeModel.create(data)
// - Return res.status(201).json(payment)

// TODO 4: Create function markPaid(req, res)
// - Endpoint: PUT /api/finances/:id/pay
// - Get paymentId from req.params.id
// - Call financeModel.markAsPaid(paymentId)
// - Return res.json(updated)

async function getAll(req, res) {
  await financeModel.updateOverduePayments();
  const payments = await financeModel.findAllByTrainer(req.trainer.trainer_id);
  res.json(payments);
}

async function create(req, res) {
  const { athlete_id, amount, due_date, notes } = req.body;

  if (!athlete_id || !amount || !due_date) {
    return res.status(400).json({ error: 'athlete_id, amount y due_date son requeridos' });
  }

  const payment = await financeModel.create({
    athlete_id,
    trainer_id: req.trainer.trainer_id,
    amount,
    due_date,
    notes,
  });

  res.status(201).json(payment);
}

module.exports = {
  getAll,
  // getByAthlete,
  create,
  // markPaid,
};
