-- ══════════════════════════════════════════════════
--  ChipSail – Base de Datos
--  Motor: MySQL / MariaDB
-- ══════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS chipsail
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chipsail;

-- ──────────────────────────────────────────────────
--  Tabla: users
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT          NOT NULL AUTO_INCREMENT,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(120) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para búsquedas rápidas de login
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email    ON users (email);

-- ──────────────────────────────────────────────────
--  Tabla: favoritos
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoritos (
  id         INT          NOT NULL AUTO_INCREMENT,
  user_id    INT          NOT NULL,
  fav_id     VARCHAR(512) NOT NULL,
  vendor     VARCHAR(50)  NOT NULL DEFAULT '',
  name       VARCHAR(255) NOT NULL DEFAULT '',
  desc       TEXT         NOT NULL DEFAULT '',
  price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  stars      TINYINT      NOT NULL DEFAULT 0,
  count      INT          NOT NULL DEFAULT 0,
  img        TEXT         NOT NULL DEFAULT '',
  url        TEXT         NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_fav (user_id, fav_id(200)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_favoritos_user ON favoritos (user_id);
