// app/admin/page.tsx
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { getAdminOverviewMetrics } from './actions'
import AdminPageClient from './page-client'

export default async function AdminPage() {
  // Safely check the session – returns null on any error.
  const session = await getAdminSession().catch((err) => {
    console.error('[AdminPage] getAdminSession failed:', err)
    return null
  })

  if (!session) {
    redirect('/admin/login')
  }

  // Fetch metrics with a try/catch so a DB failure doesn't crash the page.
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
      <main className="flex h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-lg font-semibold text-red-600">
            Dashboard unavailable
          </h1>
          <p className="text-sm text-slate-600">{errorMessage}</p>
          <a
            href="/admin"
            className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </a>
        </div>
      </main>
    )
  }

  return <AdminPageClient initialData={initialData} />
}
