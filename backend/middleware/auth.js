// middleware/auth.js
// Middleware que verifica el JWT en el header Authorization

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'chipsail_secret_dev';

function authMiddleware(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Token requerido' }));
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // { id, username, email }
  } catch {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Token inválido o expirado' }));
    return null;
  }
}

module.exports = { authMiddleware };
