const db = require('../db/connection');

async function findAllByTrainer(trainerId) {
  const { rows } = await db.query(
    `SELECT p.*, a.first_name, a.last_name
     FROM payment p
     JOIN athlete a ON p.athlete_id = a.athlete_id
     WHERE p.trainer_id = $1
     ORDER BY p.due_date DESC`,
    [trainerId]
  );
  return rows;
}

async function updateOverduePayments() {
  const { rowCount } = await db.query(
    `UPDATE payment
     SET status = 'vencido', updated_at = NOW()
     WHERE status = 'pendiente'
       AND paid_at IS NULL
       AND due_date < NOW() - INTERVAL '5 days'`
  );
  return rowCount;
}

async function createPayment({ athlete_id, trainer_id, amount, due_date }) {
  const { rows } = await db.query(
    `INSERT INTO payment (athlete_id, trainer_id, amount, due_date, status)
     VALUES ($1, $2, $3, $4, 'pendiente')
     RETURNING *`,
    [athlete_id, trainer_id, amount, due_date]
  );
  return rows[0];
}

async function markPaid(paymentId, trainerId) {
  const { rows } = await db.query(
    `UPDATE payment
     SET status = 'pagado', paid_at = NOW(), updated_at = NOW()
     WHERE payment_id = $1 AND trainer_id = $2
     RETURNING *`,
    [paymentId, trainerId]
  );
  return rows[0];
}

module.exports = {
  findAllByTrainer,
  updateOverduePayments,
  createPayment,
  markPaid,
};
