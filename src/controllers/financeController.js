const financeModel = require('../models/financeModel');

async function getAll(req, res) {
  try {
    await financeModel.updateOverduePayments();
    const payments = await financeModel.findAllByTrainer(req.trainer.trainer_id);
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pagos' });
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

async function getMonthlySummary(req, res) {
  try {
    const rows = await financeModel.getMonthlyRevenueSummary(req.trainer.trainer_id);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener resumen mensual' });
  }
}

<<<<<<< develop
module.exports = { getAll, create, markPaid, getMonthlySummary };
=======
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
>>>>>>> main
