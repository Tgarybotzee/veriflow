// app/admin/login/page.tsx
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { getAdminOverviewMetrics } from './actions'
import AdminPageClient from './page-client'

export default async function AdminPage() {
  // Safely retrieve the session – returns null if anything goes wrong.
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  // Fetch metrics; wrap in try/catch so a DB error doesn't crash the page.
  let initialData = null
  let errorMessage: string | null = null
  try {
    initialData = await getAdminOverviewMetrics()
  } catch (err) {
    console.error('[AdminPage] Failed to load metrics:', err)
    errorMessage = 'Unable to load dashboard data. Please try again later.'
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        {errorMessage}
      </div>
    )
  }

  return <AdminPageClient initialData={initialData} />
}
