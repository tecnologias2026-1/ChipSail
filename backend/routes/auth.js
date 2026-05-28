// routes/auth.js
// Maneja: POST /api/auth/register  y  POST /api/auth/login

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../database/db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'chipsail_secret_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const SALT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type' : 'application/json',
    'Cache-Control': 'no-store',
  });
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

// ─── Validaciones ─────────────────────────────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister({ username, email, password }) {
  const errors = [];
  if (!username || !username.trim())        errors.push('username es obligatorio');
  if (username && username.trim().length < 3) errors.push('username debe tener al menos 3 caracteres');
  if (!email || !emailRegex.test(email))    errors.push('email inválido');
  if (!password)                            errors.push('password es obligatorio');
  if (password && password.length < 8)      errors.push('password debe tener mínimo 8 caracteres');
  if (password && !/[A-Z]/.test(password))  errors.push('password debe tener al menos una mayúscula');
  if (password && !/[a-z]/.test(password))  errors.push('password debe tener al menos una minúscula');
  if (password && !/[^A-Za-z0-9]/.test(password)) errors.push('password debe tener al menos un carácter especial');
  return errors;
}

function validateLogin({ username, password }) {
  const errors = [];
  if (!username || !username.trim()) errors.push('username es obligatorio');
  if (!password)                     errors.push('password es obligatorio');
  if (password && password.length < 8) errors.push('password debe tener mínimo 8 caracteres');
  return errors;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
async function register(req, res) {
  let body;
  try { body = await readBody(req); }
  catch { return sendJSON(res, 400, { error: 'JSON inválido en el cuerpo' }); }

  const { username = '', email = '', password = '' } = body;
  const errors = validateRegister({ username, email, password });
  if (errors.length) return sendJSON(res, 422, { errors });

  try {
    // Verificar duplicados
    const existing = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.toLowerCase().trim()]
    );
    if (existing.length) {
      return sendJSON(res, 409, { error: 'El username o email ya está registrado' });
    }

    // Hash de la contraseña
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar usuario
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hash]
    );

    // Generar token
    const token = jwt.sign(
      { id: result.insertId, username: username.trim(), email: email.toLowerCase().trim() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return sendJSON(res, 201, {
      message : 'Usuario registrado exitosamente',
      token,
      user    : { id: result.insertId, username: username.trim(), email: email.toLowerCase().trim() },
    });
  } catch (err) {
    console.error('[register]', err.message);
    return sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
async function login(req, res) {
  let body;
  try { body = await readBody(req); }
  catch { return sendJSON(res, 400, { error: 'JSON inválido en el cuerpo' }); }

  const { username = '', password = '' } = body;
  const errors = validateLogin({ username, password });
  if (errors.length) return sendJSON(res, 422, { errors });

  try {
    // Buscar por username o email
    const rows = await query(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [username.trim(), username.trim()]
    );

    if (!rows.length) {
      return sendJSON(res, 401, { error: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendJSON(res, 401, { error: 'Credenciales incorrectas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return sendJSON(res, 200, {
      message: 'Login exitoso',
      token,
      user   : { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('[login]', err.message);
    return sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

module.exports = { register, login };
