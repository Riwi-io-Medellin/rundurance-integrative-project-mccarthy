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

module.exports = {
  findAllByTrainer,
  updateOverduePayments,
};
