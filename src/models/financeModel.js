const db = require('../db/connection');

// =============================================================================
// FINANCE MODEL — TODO LIST
// =============================================================================
// This file handles database queries for payments.
// Look at userModel.js for simple examples, workoutModel.js for advanced ones.
//
// TABLE: payment (see docs/database/schema.sql line 219)
//   Columns: payment_id, athlete_id, trainer_id, amount, due_date, paid_at,
//            status ('pendiente','pagado','vencido'), notes, created_at, updated_at
//
// BUSINESS RULE — Payment grace period:
//   - Days 0-5 after due_date without paid_at → status stays 'pendiente'
//   - After 5 days past due_date without paid_at → status becomes 'vencido'
// =============================================================================

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

async function findByAthlete(athleteId) {
  const result = await db.query(
    `SELECT * FROM payment WHERE athlete_id = $1 ORDER BY due_date DESC`,
    [athleteId]
  );
  return result.rows;
}

async function create(data) {
  const { athlete_id, trainer_id, amount, due_date, notes } = data;
  const result = await db.query(
    `INSERT INTO payment (athlete_id, trainer_id, amount, due_date, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [athlete_id, trainer_id, amount, due_date, notes]
  );
  return result.rows[0];
}

async function markAsPaid(paymentId) {
  const result = await db.query(
    `UPDATE payment SET status = 'pagado', paid_at = NOW(), updated_at = NOW()
     WHERE payment_id = $1 RETURNING *`,
    [paymentId]
  );
  return result.rows[0];
}

// updateOverduePayments()
// - This runs the 5-day grace period logic:
//   UPDATE payment SET status = 'vencido', updated_at = NOW()
//   WHERE status = 'pendiente'
//     AND paid_at IS NULL
//     AND due_date < NOW() - INTERVAL '5 days'
// - Return: the count of updated rows
// - Tip: This could be called periodically or on each finance page load

async function updateOverduePayments() {
  const result = await db.query(
    `UPDATE payment
     SET status = 'vencido', updated_at = NOW()
     WHERE status = 'pendiente'
       AND paid_at IS NULL
       AND due_date < NOW() - INTERVAL '5 days'`
  );
  return result.rowCount;
}

module.exports = {
  findAllByTrainer,
  findByAthlete,
  create,
  markAsPaid,
  updateOverduePayments,
};
