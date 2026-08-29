import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import { getAdminOverviewMetrics } from './actions'
import AdminPageClient from './page-client'

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  // Fetch real data from your database using the action v0 created
  const initialData = await getAdminOverviewMetrics()

  return <AdminPageClient initialData={initialData} sessionEmail={session.email} />
}
