// routes/favoritos.js
// GET    /api/favoritos          — lista favoritos del usuario autenticado
// POST   /api/favoritos          — agregar favorito
// DELETE /api/favoritos/:fav_id  — eliminar favorito por fav_id

const { query }         = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); }
      catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

// ─── GET /api/favoritos ───────────────────────────────────────────────────────
async function getFavoritos(req, res) {
  const user = authMiddleware(req, res);
  if (!user) return;

  try {
    const rows = await query(
      `SELECT fav_id, vendor, name, desc, price, stars, count, img, url, created_at
       FROM favoritos WHERE user_id = ? ORDER BY created_at DESC`,
      [user.id]
    );
    // Devolver como array de objetos producto con _favDate para compatibilidad frontend
    const favoritos = rows.map(r => ({
      _favId   : r.fav_id,
      _favDate : new Date(r.created_at).getTime(),
      vendor   : r.vendor,
      name     : r.name,
      desc     : r.desc,
      price    : r.price,
      stars    : r.stars,
      count    : r.count,
      img      : r.img,
      url      : r.url,
    }));
    sendJSON(res, 200, { favoritos });
  } catch (err) {
    console.error('[getFavoritos]', err.message);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

// ─── POST /api/favoritos ──────────────────────────────────────────────────────
async function addFavorito(req, res) {
  const user = authMiddleware(req, res);
  if (!user) return;

  let body;
  try { body = await readBody(req); }
  catch { return sendJSON(res, 400, { error: 'JSON inválido' }); }

  const { _favId, vendor = '', name = '', desc = '', price = 0, stars = 0, count = 0, img = '', url = '' } = body;
  if (!_favId) return sendJSON(res, 400, { error: 'fav_id es obligatorio' });

  try {
    await query(
      `INSERT OR IGNORE INTO favoritos (user_id, fav_id, vendor, name, desc, price, stars, count, img, url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, _favId, vendor, name, desc, Number(price)||0, Number(stars)||0, Number(count)||0, img, url]
    );
    sendJSON(res, 201, { message: 'Favorito guardado' });
  } catch (err) {
    console.error('[addFavorito]', err.message);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

// ─── DELETE /api/favoritos/:fav_id ────────────────────────────────────────────
async function deleteFavorito(req, res, favId) {
  const user = authMiddleware(req, res);
  if (!user) return;

  try {
    await query(
      'DELETE FROM favoritos WHERE user_id = ? AND fav_id = ?',
      [user.id, decodeURIComponent(favId)]
    );
    sendJSON(res, 200, { message: 'Favorito eliminado' });
  } catch (err) {
    console.error('[deleteFavorito]', err.message);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

module.exports = { getFavoritos, addFavorito, deleteFavorito };
