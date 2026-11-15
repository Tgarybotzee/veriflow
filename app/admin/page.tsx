// app/admin/page.tsx
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import AdminPageClient from './page-client';

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  // If your client component needs the session or user data, you can pass it here.
  // return <AdminPageClient user={session.user} />;
  return <AdminPageClient />;
}
