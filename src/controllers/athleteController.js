const athleteModel = require('../models/athleteModel');

// =============================================================================
// ATHLETE CONTROLLER — TODO LIST
// =============================================================================
// This file handles HTTP requests and responses for athlete operations.
// Look at authController.js for the pattern to follow.
//
// HOW CONTROLLERS WORK (MVC pattern):
//   1. Extract data from req (req.body, req.params, req.query, req.trainer)
//   2. Validate the input (return 400 if something is missing)
//   3. Call the model function to talk to the database
//   4. Return the result as JSON with the right status code
//   5. Wrap everything in try/catch (return 500 if something breaks)
//
// IMPORTANT: req.trainer is set by the auth middleware. It has:
//   { trainer_id, email, role }
//   This tells you WHICH coach is making the request.
// =============================================================================

// TODO 1: Create function getAll(req, res)
// - Endpoint: GET /api/athletes
// - Get trainer_id from req.trainer.trainer_id (the logged-in coach)
// - Call athleteModel.findAllByTrainer(trainerId)
// - Return res.json(athletes) with the list
// - On error: return res.status(500).json({ error: 'Error al obtener atletas' })

// TODO 2: Create function getOne(req, res)
// - Endpoint: GET /api/athletes/:id
// - Get athleteId from req.params.id (use parseInt)
// - Call athleteModel.findById(athleteId)
// - If not found: return res.status(404).json({ error: 'Atleta no encontrado' })
// - Return res.json(athlete)

// TODO 3: Create function create(req, res)
// - Endpoint: POST /api/athletes
// - Extract { first_name, last_name, document, email, birth_date } from req.body
// - Validate: first_name, last_name, document, email are required (return 400 if missing)
// - Add trainer_id from req.trainer.trainer_id to the data
// - Call athleteModel.create(data)
// - Return res.status(201).json(athlete)
// - On error: if duplicate email/document, return 409. Otherwise 500.
//   Tip: PostgreSQL duplicate errors have code '23505'

// TODO 4: Create function update(req, res)
// - Endpoint: PUT /api/athletes/:id
// - Get athleteId from req.params.id
// - Extract updated fields from req.body
// - Call athleteModel.update(athleteId, data)
// - Return res.json(updated)

// TODO 5: Create function deactivate(req, res)
// - Endpoint: DELETE /api/athletes/:id
// - Get athleteId from req.params.id
// - Call athleteModel.deactivate(athleteId)
// - Return res.json({ message: 'Atleta desactivado' })

module.exports = {
  // Export your functions here as you create them:
  // getAll,
  // getOne,
  // create,
  // update,
  // deactivate,
};
