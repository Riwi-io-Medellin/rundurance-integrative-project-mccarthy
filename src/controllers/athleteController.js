const { findAllByTrainer, findById, createAthlete, updateAthlete, deactivateAthlete } = require('../models/athleteModel');
const { createTrainer } = require('../models/userModel');

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

async function getAll(req, res) {

  try {
    const trainerId = req.trainer.trainer_id;

    const athletes = await findAllByTrainer(trainerId);

    res.json(athletes);

  } catch (error) {
    console.error(error);
    // Log the error for debugging
    res.status(500).json({
      error: 'Error al obtener atletas',
      details: error.message,
    });

  }

}


// TODO 2: Create function getOne(req, res)

async function getOne (req, res) {      
  try {
    const athleteId = parseInt(req.params.id, 10);

    if (Number.isNaN(athleteId)) {
      return res.status(400).json({ error: 'ID de atleta inválido' });
    }

    const athlete = await findById(athleteId);

    if (!athlete){
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    res.json(athlete);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error al obtener atleta',
      details: error.message,
    });    
  }
}

// TODO 3: Create function create(req, res)
async function create(req, res) {
  try {
    const { first_name, last_name, document, email, birth_date } = req.body;

    if (!first_name || !last_name || !document || !email) {
      return res.status(400).json({
        error: 'first_name, last_name, document y email son obligatorios',
      });
    }

    const trainerId = req.trainer.trainer_id;

    const athleteData = {
      trainer_id: trainerId,
      first_name,
      last_name,
      document,
      email,
      birth_date: birth_date || null,
    };

    const athlete = await createAthlete(athleteData);
    res.status(201).json(athlete);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email o documento ya existe' });
    }
    res.status(500).json({
      error: 'Error al crear atleta',
      details: error.message,
    });
  }
}

// TODO 4: Create function update(req, res)

async function create (req, res) {

  try {
    
    const { first_name, last_name, document, email, birth_date } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !document || !email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const trainer_id = req.trainer.trainer_id;

    const newAthlete = await createAthlete({ trainer_id, first_name, last_name, document, email, birth_date });

    res.status(201).json(newAthlete); 
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({ error: 'Documento o email ya existe' });
    }

    res.status(500).json({
      error: 'Error al crear atleta',
      details: error.message,
    });
  }
}

// TODO 4: Create function update(req, res)
// - Endpoint: PUT /api/athletes/:id
// - Get athleteId from req.params.id
// - Extract updated fields from req.body
// - Call athleteModel.update(athleteId, data)
// - Return res.json(updated)

async function update (req, res) {
  
  try {
    
    const athleteId = parseInt(req.params.id, 10);

    if (Number.isNaN(athleteId)) {
      return res.status(400).json({ error: 'ID de atleta inválido' });
    }

    const { first_name, last_name, document, email, birth_date } = req.body;

    if (!first_name || !last_name || !document || !email) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    } 
    const updatedAthlete = await updateAthlete(athleteId, { first_name, last_name, document, email, birth_date });
    
    if (!updatedAthlete) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }
    res.json(updatedAthlete);
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Documento o email ya existe',
      });
    }

    res.status(500).json({
      error: 'Error al actualizar atleta',
      details: error.message,
    });
  }
}


// TODO 5: Create function deactivate(req, res)
// - Endpoint: DELETE /api/athletes/:id
// - Get athleteId from req.params.id
// - Call athleteModel.deactivate(athleteId)
// - Return res.json({ message: 'Atleta desactivado' })

async function deactivate (req, res) {
  
  try {
    
    const athleteId = parseInt(req.params.id, 10);

    if (Number.isNaN(athleteId)) {
      return res.status(400).json({ error: 'ID de atleta inválido' });
    }

    const deactivatedAthlete = await deactivateAthlete(athleteId);

    if (!deactivatedAthlete) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    res.json({ message: 'Atleta desactivado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error al desactivar atleta',
      details: error.message,
    }); 
  }

}


module.exports = {
  // Export your functions here as you create them:
   getAll,
   getOne,
   create,
   update,
   deactivate,
};
