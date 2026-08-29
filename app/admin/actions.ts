'use server'

import { neon } from '@neondatabase/serverless'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clearAdminSession, getAdminSession, loginAdmin as authenticate } from '@/lib/auth'
import { initDatabase } from '@/lib/db/init'

function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Database is not configured')
  return neon(databaseUrl)
}
async function guard() { await initDatabase(); const session = await getAdminSession(); if (!session) throw new Error('Unauthorized'); return session }
function text(form: FormData, key: string, max = 2000) { const value = String(form.get(key) ?? '').trim(); if (value.length > max) throw new Error(`${key} is too long`); return value }

export async function loginAdmin(formData: FormData) { const email = text(formData, 'email', 320); const password = String(formData.get('password') ?? ''); if (!email || password.length < 8) throw new Error('Enter a valid email and password'); await authenticate(email, password); redirect('/admin') }
export async function logoutAdmin() { await clearAdminSession(); redirect('/admin/login') }
export async function getAdminOverviewMetrics() { const session = await guard(); const [campaigns, stats, logs] = await Promise.all([getSql()`SELECT count(*)::int AS total, count(*) FILTER (WHERE is_active)::int AS active FROM popup_campaigns`, getSql()`SELECT COALESCE(sum(impressions),0)::int AS impressions, COALESCE(sum(clicks),0)::int AS clicks FROM popup_campaigns`, getSql()`SELECT id, admin_email, action, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20`]); return { session, campaigns: campaigns[0], stats: stats[0], logs } }
export async function savePopupCampaign(formData: FormData) { const session = await guard(); const title = text(formData, 'title', 140); const message = text(formData, 'message', 4000); if (!title || !message) throw new Error('Title and message are required'); const imageUrl = text(formData, 'imageUrl', 2000) || null; const ctaText = text(formData, 'ctaText', 80) || null; const ctaLink = text(formData, 'ctaLink', 2000) || null; const active = formData.get('isActive') === 'on'; await getSql()`INSERT INTO popup_campaigns (title,message,image_url,cta_text,cta_link,is_active) VALUES (${title},${message},${imageUrl},${ctaText},${ctaLink},${active})`; await getSql()`INSERT INTO audit_logs (admin_email,action,details) VALUES (${session.email},'popup_campaign_created',${JSON.stringify({ title })}::jsonb)`; revalidatePath('/admin') }
export async function toggleCampaignStatus(id: number, isActive: boolean) { const session = await guard(); await getSql()`UPDATE popup_campaigns SET is_active=${isActive}, updated_at=NOW() WHERE id=${id}`; await getSql()`INSERT INTO audit_logs (admin_email,action,details) VALUES (${session.email},'popup_campaign_toggled',${JSON.stringify({ id, isActive })}::jsonb)`; revalidatePath('/admin') }
export async function updateSiteContent(section: 'header_config' | 'footer_config', data: unknown) { const session = await guard(); const value = JSON.stringify(data); await getSql()`INSERT INTO site_settings (key,value) VALUES (${section},${value}::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`; await getSql()`INSERT INTO audit_logs (admin_email,action,details) VALUES (${session.email},'site_content_updated',${JSON.stringify({ section })}::jsonb)`; revalidatePath('/admin') }
export async function getAuditLogs(limit = 20) { await guard(); return getSql()`SELECT id,admin_email,action,details,created_at FROM audit_logs ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 100)}` }
