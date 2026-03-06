const db = require('../db/connection');

// =============================================================================
// ATHLETE MODEL — TODO LIST
// =============================================================================
// This file talks directly to the PostgreSQL database.
// Look at userModel.js and workoutModel.js for examples of how models work.
//
// HOW MODELS WORK (MVC pattern):
//   Route receives request → Controller processes it → Model queries the DB
//   The model ONLY does database queries. No req/res here — that's the controller's job.
//
// TABLE: athlete (see docs/database/schema.sql line 28)
//   Columns: athlete_id, trainer_id, first_name, last_name, document, email,
//            password_hash, birth_date, photo_s3_key, is_active, created_at, updated_at
//
// IMPORTANT: Always use parameterized queries ($1, $2...) to prevent SQL injection.
//            Look at userModel.js for the pattern to follow.
// =============================================================================

// TODO 1: Create function findAllByTrainer(trainerId)
// - Query: SELECT all athletes WHERE trainer_id = $1 AND is_active = TRUE
// - ORDER BY first_name ASC (alphabetical)
// - Return: array of athlete rows
// - Tip: Use db.query(...) and return rows (see userModel.findByEmail for pattern)


// Function to find all active athletes for a given trainer, ordered by first name
async function findAllByTrainer(trainerId) {
 // Query for all active athletes of a trainer, ordered by first name
  const text = `    
  SELECT * 
  FROM athlete
  WHERE trainer_id = $1 AND is_active = TRUE
  ORDER BY first_name ASC
  `;

  const param = [trainerId];

  const result = await db.query(text, param)

  return result.rows;
};

// TODO 2: Create function findById(athleteId)
// - Query: SELECT * FROM athlete WHERE athlete_id = $1
// - Return: single athlete object or null
// - Tip: return rows[0] ?? null

// TODO 3: Create function create(data)
// - Query: INSERT INTO athlete (trainer_id, first_name, last_name, document, email, birth_date)
//          VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
// - data comes from the controller: { trainer_id, first_name, last_name, document, email, birth_date }
// - Return: the inserted row
// - Tip: Look at userModel.createTrainer for the exact pattern

// TODO 4: Create function update(athleteId, data)
// - Query: UPDATE athlete SET first_name=$1, last_name=$2, document=$3, email=$4, birth_date=$5,
//          updated_at=NOW() WHERE athlete_id=$6 RETURNING *
// - Return: the updated row
// - Tip: Same pattern as create, but use UPDATE instead of INSERT

// TODO 5: Create function deactivate(athleteId)
// - Query: UPDATE athlete SET is_active = FALSE, updated_at = NOW() WHERE athlete_id = $1 RETURNING *
// - We don't DELETE rows — we set is_active = FALSE (this is called "soft delete")
// - Return: the updated row

module.exports = {
  // Export your functions here as you create them, for example:
  findAllByTrainer,
  // findById,
  // create,
  // update,
  // deactivate,
};
