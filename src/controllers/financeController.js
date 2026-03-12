const financeModel = require('../models/financeModel');

// =============================================================================
// FINANCE CONTROLLER — TODO LIST
// =============================================================================
// This file handles HTTP requests for payment/billing operations.
// Look at authController.js and workoutController.js for examples.
//
// REMEMBER: req.trainer.trainer_id gives you the logged-in coach's ID.
// =============================================================================

async function getAll(req, res) {
  try {
    await financeModel.updateOverduePayments();
    const payments = await financeModel.findAllByTrainer(req.trainer.trainer_id);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pagos', details: err.message });
  }
}

async function getByAthlete(req, res) {
  try {
    const payments = await financeModel.findByAthlete(req.params.athleteId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pagos del atleta', details: err.message });
  }
}

async function create(req, res) {
  const { athlete_id, amount, due_date, notes } = req.body;
  if (!athlete_id || !amount || !due_date) {
    return res.status(400).json({ error: 'athlete_id, amount y due_date son requeridos' });
  }
  try {
    const payment = await financeModel.create({
      athlete_id,
      trainer_id: req.trainer.trainer_id,
      amount,
      due_date,
      notes,
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear pago', details: err.message });
  }
}

async function markPaid(req, res) {
  try {
    const updated = await financeModel.markAsPaid(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al marcar pago', details: err.message });
  }
}

module.exports = { getAll, getByAthlete, create, markPaid };
