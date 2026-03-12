const {
  findAllByTrainer,
  findById,
  createAthlete,
  updateAthlete,
  deactivateAthlete
} = require("../models/athleteModel");

async function getAll(req, res) {
  try {
    const trainerId = req.trainer.trainer_id;

    const athletes = await findAllByTrainer(trainerId);

    res.json(athletes);
  } catch (error) {
    console.error(error);
    // Log the error for debugging
    res.status(500).json({
      error: "Error al obtener atletas",
      details: error.message,
    });
  }
}

async function getOne(req, res) {
  try {
    const athleteId = parseInt(req.params.id, 10);

    if (Number.isNaN(athleteId)) {
      return res.status(400).json({ error: "ID de atleta inválido" });
    }

    const athlete = await findById(athleteId);

    if (!athlete) {
      return res.status(404).json({ error: "Atleta no encontrado" });
    }

    res.json(athlete);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al obtener atleta",
      details: error.message,
    });
  }
}

async function create(req, res) {
  try {
    const { first_name, last_name, document, email, birth_date, phone } = req.body;

    if (!first_name || !last_name || !document || !email) {
      return res.status(400).json({
        error: "first_name, last_name, document y email son obligatorios",
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
      phone: phone || null,
    };

    const athlete = await createAthlete(athleteData);
    res.status(201).json(athlete);
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email o documento ya existe" });
    }
    res.status(500).json({
      error: "Error al crear atleta",
      details: error.message,
    });
  }
}

async function update(req, res) {
  try {
    const athleteId = parseInt(req.params.id, 10);

    if (Number.isNaN(athleteId)) {
      return res.status(400).json({ error: "ID de atleta inválido" });
    }

    const { first_name, last_name, document, email, birth_date, phone } = req.body;

    if (!first_name || !last_name || !document || !email) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    const updatedAthlete = await updateAthlete(athleteId, {
      first_name,
      last_name,
      document,
      email,
      birth_date,
      phone: phone || null,
    });

    if (!updatedAthlete) {
      return res.status(404).json({ error: "Atleta no encontrado" });
    }
    res.json(updatedAthlete);
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Documento o email ya existe",
      });
    }

    res.status(500).json({
      error: "Error al actualizar atleta",
      details: error.message,
    });
  }
}

async function deactivate(req, res) {
  
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
  getAll,
  getOne,
  create,
  update,
  deactivate,
};
