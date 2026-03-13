function admin(req, res, next) {
  if (req.trainer.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

module.exports = admin;
