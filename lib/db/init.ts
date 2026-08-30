import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be set in environment');
const sql = neon(databaseUrl);

let initialized = false;

export async function ensureInit() {
  if (initialized) return;
  const schemaPath = path.resolve(process.cwd(), 'lib/db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Use unsafe to run bundled schema; neon supports multi-statement execution with unsafe.
  await sql.unsafe(schema);

  // seed default master admin if no admin_users exist
  const existing = await sql`SELECT id FROM admin_users LIMIT 1`;
  if (existing.length === 0) {
    const defaultEmail = 'admin@veriflow.local';
    const defaultPassword = 'AdminSecurePassword2026!';
    const password_hash = await bcrypt.hash(defaultPassword, 12);
    await sql`INSERT INTO admin_users (email, password_hash, role) VALUES (${defaultEmail}, ${password_hash}, 'master')`;

    await sql`INSERT INTO audit_logs (admin_email, action, details) VALUES (${defaultEmail}, 'seed_master_admin', ${JSON.stringify({ seeded: true })}::jsonb)`;
    console.log('Seeded default admin user:', defaultEmail);
  }

  initialized = true;
}

export { sql };

// attempt to initialize at import time (harmless if DB unavailable during build)
ensureInit().catch((err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('DB initialization failed at import time:', err);
  }
});
