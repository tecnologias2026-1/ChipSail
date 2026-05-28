// server.js  –  ChipSail Backend (Node.js sin frameworks)
// Endpoints:
//   POST   /api/auth/register
//   POST   /api/auth/login
//   GET    /api/users
//   PUT    /api/users/:id
//   DELETE /api/users/:id

const http = require('http');

const { register, login } = require('./routes/auth');
const { getUsers, updateUser, deleteUser } = require('./routes/users');
const { getFavoritos, addFavorito, deleteFavorito } = require('./routes/favoritos');

const PORT = process.env.PORT || 3000;

// ─── CORS helper ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function setCors(res, origin) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN === '*' ? (origin || '*') : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age',       '86400');
}

// ─── Router ───────────────────────────────────────────────────────────────────
function router(req, res) {
  const origin = req.headers['origin'];
  setCors(res, origin);

  // Preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { method, url } = req;

  // Normalizar URL (quitar query string)
  const path = url.split('?')[0];

  // ── Ruta raíz (health check) ─────────────────────────────────────────────
  if (path === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'ChipSail API v1.0 🚀', status: 'ok' }));
    return;
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  if (path === '/api/auth/register' && method === 'POST') return register(req, res);
  if (path === '/api/auth/login'    && method === 'POST') return login(req, res);

  // ── Favoritos ─────────────────────────────────────────────────────────────
  if (path === '/api/favoritos' && method === 'GET')    return getFavoritos(req, res);
  if (path === '/api/favoritos' && method === 'POST')   return addFavorito(req, res);
  const favMatch = path.match(/^\/api\/favoritos\/(.+)$/);
  if (favMatch && method === 'DELETE') return deleteFavorito(req, res, favMatch[1]);

  // ── Users ─────────────────────────────────────────────────────────────────
  if (path === '/api/users' && method === 'GET') return getUsers(req, res);

  // /api/users/:id
  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch) {
    const id = parseInt(userMatch[1], 10);
    if (method === 'PUT')    return updateUser(req, res, id);
    if (method === 'DELETE') return deleteUser(req, res, id);
  }

  // ── 404 ────────────────────────────────────────────────────────────────────
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: `Ruta no encontrada: ${method} ${path}` }));
}

// ─── Servidor ─────────────────────────────────────────────────────────────────
const server = http.createServer(router);

server.listen(PORT, () => {
  console.log(`✅  ChipSail API corriendo en http://localhost:${PORT}`);
});
