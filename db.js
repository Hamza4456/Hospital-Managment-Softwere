/* =========================================================
   db.js — PostgreSQL pool + schema bootstrap
========================================================= */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => console.error('[pg] unexpected error', err));

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      slug        TEXT UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      email          TEXT NOT NULL,
      username       TEXT,
      phone          TEXT,
      phone_country  TEXT,
      password_hash  TEXT NOT NULL,
      role           TEXT NOT NULL DEFAULT 'patient',
      initials       TEXT,
      is_active      BOOLEAN NOT NULL DEFAULT TRUE,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (tenant_id, email)
    );
    CREATE INDEX IF NOT EXISTS idx_users_tenant   ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_email    ON users(LOWER(email));
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
  `);

  await pool.query(`
    INSERT INTO tenants (name, slug)
    VALUES ('MediCare Hospital', 'default')
    ON CONFLICT (slug) DO NOTHING;
  `);
}

module.exports = { pool, ensureSchema };