const db = require('../db/connection');

async function findAllByTrainer(trainerId) {
  const { rows } = await db.query(
    `SELECT * FROM athlete WHERE trainer_id = $1 AND is_active = TRUE ORDER BY first_name ASC`,
    [trainerId]
  );
  return rows;
}

async function findById(athleteId) {
  const { rows } = await db.query(
    `SELECT * FROM athlete WHERE athlete_id = $1`,
    [athleteId]
  );
  return rows[0] ?? null;
}

async function createAthlete(data) {
  const { trainer_id, first_name, last_name, document, email, birth_date, phone } = data;
  const { rows } = await db.query(
    `INSERT INTO athlete (trainer_id, first_name, last_name, document, email, birth_date, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [trainer_id, first_name, last_name, document, email, birth_date, phone ?? null]
  );
  return rows[0];
}

async function updateAthlete(athleteId, data) {
  const { first_name, last_name, document, email, birth_date, phone } = data;
  const { rows } = await db.query(
    `UPDATE athlete
     SET first_name=$1, last_name=$2, document=$3, email=$4, birth_date=$5, phone=$6, updated_at=NOW()
     WHERE athlete_id=$7 RETURNING *`,
    [first_name, last_name, document, email, birth_date, phone ?? null, athleteId]
  );
  return rows[0];
}

async function deactivateAthlete(athleteId) {
  const { rows } = await db.query(
    `UPDATE athlete SET is_active = FALSE, updated_at = NOW() WHERE athlete_id = $1 RETURNING *`,
    [athleteId]
  );
  return rows[0];
}

module.exports = {
  findAllByTrainer,
  findById,
  createAthlete,
  updateAthlete,
  deactivateAthlete,
};
