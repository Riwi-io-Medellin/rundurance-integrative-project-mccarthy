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

module.exports = { register, login };
