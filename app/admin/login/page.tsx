// app/admin/login/page.tsx
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import LoginForm from './login-form'

export default async function AdminLoginPage() {
  // If already logged in, go straight to the dashboard.
  const session = await getAdminSession().catch(() => null)
  if (session) {
    redirect('/admin')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <LoginForm />
    </main>
  )
}
