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

module.exports = { getAll };
