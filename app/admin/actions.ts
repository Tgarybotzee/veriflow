'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql as db } from '@/lib/db/init'
import { authenticateAdmin, createSession, verifySession, deleteSession, setAuthCookie, clearAuthCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

const API_BASE = 'https://apifb-ten.vercel.app'
const DEFAULT_DB_CODE = '101'

async function guardFromTokenHeader(cookieHeader?: string | null) {
  // authenticate using session token in cookie header
  const token = cookieHeader || null
  const result = await verifySession(token)
  if (!result) throw new Error('Unauthorized')
  return result.user
}

async function guard() {
  // server-side guard using cookies()
  const jar = cookies()
  const token = jar.get('veriflow_admin_token')?.value || null
  const result = await verifySession(token)
  if (!result) throw new Error('Unauthorized')
  return result.user
}

function text(form: FormData, key: string, max = 2000) {
  const value = String(form.get(key) ?? '').trim()
  if (value.length > max) throw new Error(`${key} is too long`)
  return value
}

async function fetchLiveData() {
  const code = process.env.VERIFLOW_DB_CODE || DEFAULT_DB_CODE
  const response = await fetch(`${API_BASE}/api/${encodeURIComponent(code)}/devices`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`External live API unavailable (${response.status})`)
  const payload = await response.json()
  const devices = Array.isArray(payload.devices) ? payload.devices : []
  const messages = await Promise.all(
    devices.map(async (device: { client_id: string }) => {
      try {
        const result = await fetch(`${API_BASE}/api/${encodeURIComponent(code)}/messages/${encodeURIComponent(device.client_id)}`, { cache: 'no-store' })
        const body = await result.json()
        return Array.isArray(body.messages) ? body.messages : []
      } catch {
        return []
      }
    })
  )
  return { code, devices, messages: messages.flat() }
}

// Server Action: loginAdmin - used by /admin/login form
export async function loginAdmin(formData: FormData) {
  const email = text(formData, 'email', 320)
  const password = String(formData.get('password') ?? '')
  if (!email || password.length < 8) throw new Error('Enter a valid email and password')

  const user = await authenticateAdmin(email, password)
  if (!user) throw new Error('Invalid credentials')

  const { token, expiresAt } = await createSession(user.id)
  setAuthCookie(token, expiresAt)
  await db`INSERT INTO audit_logs (admin_email, action, details) VALUES (${user.email}, 'login', ${JSON.stringify({ ip: 'server' })}::jsonb)`

  // Redirect to admin dashboard
  redirect('/admin')
}

// Server Action: logoutAdmin
export async function logoutAdmin() {
  const jar = cookies()
  const token = jar.get('veriflow_admin_token')?.value || null
  await deleteSession(token)
  clearAuthCookie()
  revalidatePath('/admin')
  redirect('/admin/login')
}

// Server Action: getAdminOverviewMetrics
export async function getAdminOverviewMetrics() {
  // Guard by using cookie server-side; if used from middleware, it may pass cookie header via fetch to API route that uses guardFromTokenHeader
  let admin: any
  try {
    admin = await guard()
  } catch (err) {
    throw new Error('Unauthorized')
  }

  // gather metrics
  const [adminCountRows, campaignsRows, statsRows, logsRows] = await Promise.all([
    db`SELECT COUNT(*)::int AS total_users FROM admin_users`,
    db`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active) ::int AS active FROM popup_campaigns`,
    db`SELECT COALESCE(SUM(impressions),0)::int AS impressions, COALESCE(SUM(clicks),0)::int AS clicks FROM popup_campaigns`,
    db`SELECT id, admin_email, action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20`,
  ])

  let live = { code: process.env.VERIFLOW_DB_CODE || DEFAULT_DB_CODE, devices: [], messages: [], error: null }
  try {
    live = await fetchLiveData()
  } catch (e: any) {
    live = { ...live, error: e instanceof Error ? e.message : String(e) }
  }

  return {
    admin: { email: admin.email, role: admin.role },
    total_monitored_devices_or_users: adminCountRows[0].total_users as number,
    campaigns: campaignsRows[0],
    stats: statsRows[0],
    logs: logsRows,
    live,
  }
}

// Server Action: savePopupCampaign
export async function savePopupCampaign(formData: FormData) {
  const admin = await guard()
  const idVal = formData.get('id')
  const id = idVal ? Number(idVal) : null
  const title = text(formData, 'title', 140)
  const message = text(formData, 'message', 4000)
  if (!title || !message) throw new Error('Title and message are required')
  const image_url = text(formData, 'imageUrl', 2000) || null
  const cta_text = text(formData, 'ctaText', 80) || null
  const cta_link = text(formData, 'ctaLink', 2000) || null
  const is_active = formData.get('isActive') === 'on' || formData.get('isActive') === 'true'

  if (id) {
    await db`UPDATE popup_campaigns SET title=${title}, message=${message}, image_url=${image_url}, cta_text=${cta_text}, cta_link=${cta_link}, is_active=${is_active}, updated_at=NOW() WHERE id=${id}`
    await db`INSERT INTO audit_logs (admin_email, action, details) VALUES (${admin.email}, 'popup_campaign_updated', ${JSON.stringify({ id, title })}::jsonb)`
  } else {
    const inserted = await db`INSERT INTO popup_campaigns (title, message, image_url, cta_text, cta_link, is_active) VALUES (${title}, ${message}, ${image_url}, ${cta_text}, ${cta_link}, ${is_active}) RETURNING id`
    await db`INSERT INTO audit_logs (admin_email, action, details) VALUES (${admin.email}, 'popup_campaign_created', ${JSON.stringify({ id: inserted[0].id, title })}::jsonb)`
  }

  revalidatePath('/admin')
}

// Server Action: toggleCampaignStatus
export async function toggleCampaignStatus(id: number, isActive: boolean) {
  const admin = await guard()
  await db`UPDATE popup_campaigns SET is_active=${isActive}, updated_at=NOW() WHERE id=${id}`
  await db`INSERT INTO audit_logs (admin_email, action, details) VALUES (${admin.email}, 'popup_campaign_toggled', ${JSON.stringify({ id, isActive })}::jsonb)`
  revalidatePath('/admin')
}

// Server Action: updateSiteContent
export async function updateSiteContent(section: 'header_config' | 'footer_config', data: unknown) {
  const admin = await guard()
  const value = JSON.stringify(data)
  await db`INSERT INTO site_settings (key, value) VALUES (${section}, ${value}::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
  await db`INSERT INTO audit_logs (admin_email, action, details) VALUES (${admin.email}, 'site_content_updated', ${JSON.stringify({ section })}::jsonb)`
  revalidatePath('/admin')
}

// Server Action: getAuditLogs
export async function getAuditLogs(limit = 20) {
  await guard()
  const rows = await db`SELECT id, admin_email, action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 100)}`
  return rows
}
