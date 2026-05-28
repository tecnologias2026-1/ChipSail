// routes/users.js
// Maneja: GET /api/users  PUT /api/users/:id  DELETE /api/users/:id

const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const SALT_ROUNDS = 12;

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

// ─── GET /api/users ────────────────────────────────────────────────────────────
async function getUsers(req, res) {
  const user = authMiddleware(req, res);
  if (!user) return;
  try {
    const rows = await query('SELECT id, username, email, created_at FROM users ORDER BY id');
    sendJSON(res, 200, { users: rows });
  } catch (err) {
    console.error('[getUsers]', err.message);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
async function updateUser(req, res, id) {
  const caller = authMiddleware(req, res);
  if (!caller) return;

  let body;
  try { body = await readBody(req); }
  catch { return sendJSON(res, 400, { error: 'JSON inválido' }); }

  const { username, email, password } = body;
  if (!username && !email && !password) {
    return sendJSON(res, 400, { error: 'Envía al menos un campo para actualizar' });
  }

  try {
    const existing = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing.length) return sendJSON(res, 404, { error: 'Usuario no encontrado' });

    const fields = [];
    const values = [];

    if (username) { fields.push('username = ?'); values.push(username.trim()); }
    if (email)    { fields.push('email = ?');    values.push(email.toLowerCase().trim()); }
    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push('password = ?');
      values.push(hash);
    }

    values.push(id);
    await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await query('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
    sendJSON(res, 200, { message: 'Usuario actualizado', user: updated[0] });
  } catch (err) {
    // SQLite lanza SQLITE_CONSTRAINT cuando hay UNIQUE violation
    if (err.code === 'SQLITE_CONSTRAINT' || err.code === 'ER_DUP_ENTRY') {
      return sendJSON(res, 409, { error: 'Username o email ya en uso' });
    }
    console.error('[updateUser]', err.message);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
async function deleteUser(req, res, id) {
  const caller = authMiddleware(req, res);
  if (!caller) return;

  try {
    const existing = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing.length) return sendJSON(res, 404, { error: 'Usuario no encontrado' });

    await query('DELETE FROM users WHERE id = ?', [id]);
    sendJSON(res, 200, { message: 'Usuario eliminado' });
  } catch (err) {
    console.error('[deleteUser]', err.message);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

module.exports = { getUsers, updateUser, deleteUser };
