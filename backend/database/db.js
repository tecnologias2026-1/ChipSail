// database/db.js
// Base de datos local con SQLite (usando el módulo nativo de Node.js 22+)
// Sin MySQL, sin compilación, sin configuración externa.

const path = require('path');
const fs   = require('fs');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'chipsail.db');

let _db;

function getDB() {
  if (!_db) {
    const { DatabaseSync } = require('node:sqlite');
    _db = new DatabaseSync(DB_FILE);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec('PRAGMA foreign_keys = ON');
    // Siempre asegurar las tablas (IF NOT EXISTS es idempotente)
    initSchema(_db);
  }
  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      username   TEXT     NOT NULL UNIQUE,
      email      TEXT     NOT NULL UNIQUE,
      password   TEXT     NOT NULL,
      created_at DATETIME NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
    CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);

    CREATE TABLE IF NOT EXISTS favoritos (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      fav_id     TEXT     NOT NULL,
      vendor     TEXT     NOT NULL DEFAULT '',
      name       TEXT     NOT NULL DEFAULT '',
      desc       TEXT     NOT NULL DEFAULT '',
      price      REAL     NOT NULL DEFAULT 0,
      stars      INTEGER  NOT NULL DEFAULT 0,
      count      INTEGER  NOT NULL DEFAULT 0,
      img        TEXT     NOT NULL DEFAULT '',
      url        TEXT     NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, fav_id)
    );
    CREATE INDEX IF NOT EXISTS idx_fav_user ON favoritos (user_id);
  `);
  console.log('✅  Schema de usuarios y favoritos creado.');
}

async function query(sql, params = []) {
  const db      = getDB();
  const trimmed = sql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT')) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  }

  if (trimmed.startsWith('INSERT')) {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return { insertId: info.lastInsertRowid, affectedRows: info.changes };
  }

  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { affectedRows: info.changes };
}

module.exports = { query };
