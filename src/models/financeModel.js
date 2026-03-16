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

/**
 * Returns monthly revenue aggregation for the last 6 months.
 * @param {number} trainerId
 * @returns {Promise<Array<{month: string, expected: string, collected: string}>>}
 */
async function getMonthlyRevenueSummary(trainerId) {
  const { rows } = await db.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', due_date), 'YYYY-MM')        AS month,
       SUM(amount)                                               AS expected,
       SUM(CASE WHEN status = 'pagado' THEN amount ELSE 0 END)  AS collected
     FROM payment
     WHERE trainer_id = $1
       AND due_date >= NOW() - INTERVAL '6 months'
     GROUP BY 1
     ORDER BY 1`,
    [trainerId]
  );
  return rows;
}

async function findAllByTrainer(trainerId) {
  const result = await db.query(
    `SELECT p.*, a.first_name, a.last_name
     FROM payment p
     JOIN athlete a ON p.athlete_id = a.athlete_id
     WHERE p.trainer_id = $1
     ORDER BY p.due_date DESC`,
    [trainerId]
  );
  return result.rows;
}

async function updateOverduePayments() {
  const result = await db.query(
    `UPDATE payment SET status = 'vencido', updated_at = NOW()
     WHERE status = 'pendiente'
       AND paid_at IS NULL
       AND due_date < NOW() - INTERVAL '5 days'`
  );
  return result.rowCount;
}

async function create(data) {
  const { athlete_id, trainer_id, amount, due_date, notes } = data;
  const result = await db.query(
    `INSERT INTO payment (athlete_id, trainer_id, amount, due_date, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [athlete_id, trainer_id, amount, due_date, notes]
  );
  return result.rows[0];
}

module.exports = {
  findAllByTrainer,
<<<<<<< develop
  updateOverduePayments,
  createPayment,
  markPaid,
  getMonthlyRevenueSummary,
=======
  // findByAthlete,
  create,
  // markAsPaid,
  updateOverduePayments,
>>>>>>> main
};
