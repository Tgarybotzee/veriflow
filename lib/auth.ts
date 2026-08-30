import { sql, ensureInit } from './db/init';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const ADMIN_COOKIE_NAME = 'veriflow_admin_token';

await ensureInit();

export type AdminUser = {
  id: number;
  email: string;
  role: string;
  created_at?: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function authenticateAdmin(email: string, password: string) {
  const rows = await sql`SELECT id, email, role, password_hash FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`;
  const row = rows[0] as any;
  if (!row) return null;
  const ok = await verifyPassword(password, row.password_hash as string);
  if (!ok) return null;
  return { id: row.id as number, email: row.email as string, role: row.role as string } as AdminUser;
}

export async function createSession(userId: number) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sql`INSERT INTO admin_sessions (id, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt.toISOString()})`;
  return { token, expiresAt };
}

export async function verifySession(token?: string | null) {
  if (!token) return null;
  const rows = await sql`
    SELECT s.id, s.expires_at, u.id as user_id, u.email, u.role
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.id = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `;
  const r = rows[0] as any;
  if (!r) return null;
  return { sessionId: r.id as string, expires_at: r.expires_at as string, user: { id: r.user_id as number, email: r.email as string, role: r.role as string } };
}

export async function deleteSession(token?: string | null) {
  if (!token) return;
  await sql`DELETE FROM admin_sessions WHERE id = ${token}`;
}

// Helpers to set/clear cookie in Server Actions or server components
export function setAuthCookie(token: string, expiresAt: Date) {
  const jar = cookies();
  jar.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearAuthCookie() {
  const jar = cookies();
  // cookies().delete is available in new Next APIs
  try {
    jar.delete(ADMIN_COOKIE_NAME);
  } catch (e) {
    // fallback: set expired cookie
    jar.set({ name: ADMIN_COOKIE_NAME, value: '', httpOnly: true, path: '/', expires: new Date(0) });
  }
}

export function getCookieFromHeader(cookieHeader?: string | null) {
  if (!cookieHeader) return null;
  const entries = cookieHeader.split(';').map((p) => p.trim());
  for (const kv of entries) {
    const [k, ...rest] = kv.split('=');
    if (k === ADMIN_COOKIE_NAME) return rest.join('=');
  }
  return null;
}

export async function getAdminSession() {
  const jar = await cookies()
  const result = await verifySession(jar.get(ADMIN_COOKIE_NAME)?.value)
  return result?.user ?? null
}

export { ADMIN_COOKIE_NAME };
