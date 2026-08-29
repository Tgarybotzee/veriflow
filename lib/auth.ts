import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { initDatabase } from '@/lib/db/init'
import { ADMIN_COOKIE } from '@/lib/auth-constants'

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Database is not configured')
  return neon(databaseUrl)
}

export async function loginAdmin(email: string, password: string) {
  await initDatabase()
  const sql = getSql()
  const rows = await sql`SELECT id, email, password_hash, role FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`
  const admin = rows[0]
  if (!admin || !(await bcrypt.compare(password, String(admin.password_hash)))) throw new Error('Invalid email or password')
  const token = randomUUID()
  await sql`INSERT INTO admin_sessions (id, user_id, expires_at) VALUES (${token}, ${admin.id}, NOW() + INTERVAL '7 days')`
  const jar = await cookies()
  jar.set(ADMIN_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return { email: admin.email, role: admin.role }
}

export async function getAdminSession() {
  await initDatabase()
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!token) return null
  const sql = getSql()
  const rows = await sql`SELECT u.id, u.email, u.role FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.id = ${token} AND s.expires_at > NOW() LIMIT 1`
  return rows[0] ?? null
}

export async function clearAdminSession() {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE)?.value
  if (token) {
    const sql = getSql()
    await sql`DELETE FROM admin_sessions WHERE id = ${token}`
  }
  jar.delete(ADMIN_COOKIE)
}
