const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const userModel = require('../models/userModel');

/**
 * POST /api/auth/register
 * Body: { first_name, last_name, document, email, password }
 */
async function register(req, res) {
  try {
    const { first_name, last_name, document, email, password } = req.body;

    if (!first_name || !last_name || !document || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const trainer = await userModel.createTrainer({ first_name, last_name, document, email, password_hash });

    const token = signToken(trainer);
    return res.status(201).json({ token, trainer: safeTrainer(trainer) });
  } catch (err) {
    console.error('Error en register:', err);
    return res.status(500).json({ error: 'Error al registrar entrenador' });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const trainer = await userModel.findByEmail(email);
    if (!trainer) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, trainer.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken(trainer);
    return res.json({ token, trainer: safeTrainer(trainer) });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

/**
 * GET /api/auth/me
 * Returns the current trainer's profile (no password).
 */
async function getProfile(req, res) {
  try {
    const trainer = await userModel.findById(req.trainer.trainer_id);
    if (!trainer) return res.status(404).json({ error: 'Entrenador no encontrado' });
    return res.json(safeTrainer(trainer));
  } catch (err) {
    console.error('Error en getProfile:', err);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

/**
 * PATCH /api/auth/me
 * Body: { first_name, last_name, email }
 */
async function updateProfile(req, res) {
  try {
    const { first_name, last_name, email } = req.body;
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Nombre y correo son requeridos' });
    }

    const updated = await userModel.updateTrainer(req.trainer.trainer_id, { first_name, last_name, email });
    if (!updated) return res.status(404).json({ error: 'Entrenador no encontrado' });

    return res.json(safeTrainer(updated));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El correo ya está en uso' });
    }
    console.error('Error en updateProfile:', err);
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

/**
 * PATCH /api/auth/me/password
 * Body: { current_password, new_password }
 */
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const trainer = await userModel.findById(req.trainer.trainer_id);
    if (!trainer) return res.status(404).json({ error: 'Entrenador no encontrado' });

    const valid = await bcrypt.compare(current_password, trainer.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const password_hash = await bcrypt.hash(new_password, 10);
    await userModel.updatePassword(req.trainer.trainer_id, password_hash);

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en changePassword:', err);
    return res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
}

function signToken(trainer) {
  return jwt.sign(
    { trainer_id: trainer.trainer_id, email: trainer.email, role: trainer.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeTrainer(trainer) {
  const { password_hash, ...rest } = trainer;
  return rest;
}

module.exports = { register, login, getProfile, updateProfile, changePassword };
