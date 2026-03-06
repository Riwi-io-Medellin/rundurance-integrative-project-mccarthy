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

module.exports = { findByEmail, createTrainer };
