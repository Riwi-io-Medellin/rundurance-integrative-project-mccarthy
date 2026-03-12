const db = require('../db/connection');

async function findByEmail(email) {
  const { rows } = await db.query(
    'SELECT * FROM trainer WHERE email = $1 AND is_active = TRUE',
    [email]
  );
  return rows[0] ?? null;
}

async function createTrainer(data) {
  const { rows } = await db.query(
    `INSERT INTO trainer (first_name, last_name, document, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.first_name, data.last_name, data.document, data.email, data.password_hash, data.role ?? 'coach']
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await db.query(
    'SELECT * FROM trainer WHERE trainer_id = $1 AND is_active = TRUE',
    [id]
  );
  return rows[0] ?? null;
}

async function updateTrainer(id, { first_name, last_name, email, phone }) {
  const { rows } = await db.query(
    `UPDATE trainer
        SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = NOW()
      WHERE trainer_id = $5 AND is_active = TRUE
      RETURNING *`,
    [first_name, last_name, email, phone ?? null, id]
  );
  return rows[0] ?? null;
}

async function updatePassword(id, password_hash) {
  await db.query(
    `UPDATE trainer SET password_hash = $1, updated_at = NOW()
      WHERE trainer_id = $2 AND is_active = TRUE`,
    [password_hash, id]
  );
}

module.exports = { findByEmail, createTrainer, findById, updateTrainer, updatePassword };
