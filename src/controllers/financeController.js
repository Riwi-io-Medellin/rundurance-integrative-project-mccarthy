const financeModel = require('../models/financeModel');

async function getAll(req, res) {
  try {
    await financeModel.updateOverduePayments();
    const payments = await financeModel.findAllByTrainer(req.trainer.trainer_id);
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pagos', details: error.message });
  }
}

async function create(req, res) {
  try {
    const { athlete_id, amount, due_date } = req.body;
    if (!athlete_id || !amount || !due_date) {
      return res.status(400).json({ error: 'athlete_id, amount y due_date son requeridos' });
    }
    const payment = await financeModel.createPayment({
      athlete_id,
      trainer_id: req.trainer.trainer_id,
      amount,
      due_date,
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
}

async function markPaid(req, res) {
  try {
    const payment = await financeModel.markPaid(req.params.id, req.trainer.trainer_id);
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al marcar pago' });
  }
}

module.exports = { getAll, create, markPaid };
