import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

let initialized: Promise<void> | undefined

export function initDatabase() {
  if (!initialized) initialized = (async () => {
    const sql = neon(process.env.DATABASE_URL!)
    await sql`CREATE TABLE IF NOT EXISTS admin_users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMP NOT NULL DEFAULT NOW())`
    await sql`CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, user_id INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at TIMESTAMP NOT NULL)`
    await sql`CREATE TABLE IF NOT EXISTS popup_campaigns (id SERIAL PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL, image_url TEXT, cta_text TEXT, cta_link TEXT, is_active BOOLEAN NOT NULL DEFAULT FALSE, impressions INT NOT NULL DEFAULT 0, clicks INT NOT NULL DEFAULT 0, updated_at TIMESTAMP NOT NULL DEFAULT NOW())`
    await sql`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT NOW())`
    await sql`CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, admin_email TEXT NOT NULL, action TEXT NOT NULL, details JSONB, created_at TIMESTAMP NOT NULL DEFAULT NOW())`
    await sql`CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx ON admin_sessions (expires_at)`
    await sql`CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC)`
    const email = process.env.ADMIN_INITIAL_EMAIL ?? 'admin@veriflow.local'
    const password = process.env.ADMIN_INITIAL_PASSWORD
    if (password) {
      const hash = await bcrypt.hash(password, 12)
      await sql`INSERT INTO admin_users (email, password_hash, role) VALUES (${email}, ${hash}, 'admin') ON CONFLICT (email) DO NOTHING`
    }
  })()
  return initialized
}
