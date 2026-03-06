const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.trainer = {
      trainer_id: payload.trainer_id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = auth;
