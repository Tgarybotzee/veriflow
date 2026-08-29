CREATE TABLE IF NOT EXISTS admin_users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, user_id INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at TIMESTAMP NOT NULL);
CREATE TABLE IF NOT EXISTS popup_campaigns (id SERIAL PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL, image_url TEXT, cta_text TEXT, cta_link TEXT, is_active BOOLEAN NOT NULL DEFAULT FALSE, impressions INT NOT NULL DEFAULT 0, clicks INT NOT NULL DEFAULT 0, updated_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, admin_email TEXT NOT NULL, action TEXT NOT NULL, details JSONB, created_at TIMESTAMP NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS admin_sessions_expires_idx ON admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);
