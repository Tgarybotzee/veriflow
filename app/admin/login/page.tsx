'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { loginAdmin } from '@/app/admin/actions'

export default function AdminLoginPage() {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(formData: FormData) { setPending(true); setError(''); try { await loginAdmin(formData) } catch (error) { setError(error instanceof Error ? error.message : 'Unable to sign in'); setPending(false) } }
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><form action={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-blue-700 text-white"><ShieldCheck /></div><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-700">Veriflow</p><h1 className="text-2xl font-bold text-slate-950">Admin sign in</h1></div></div><div className="flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">Email<input name="email" type="email" required autoComplete="username" className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="admin@example.com" /></label><label className="flex flex-col gap-2 text-sm font-semibold text-slate-800">Password<input name="password" type="password" required minLength={8} autoComplete="current-password" className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>{error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</p>}<button disabled={pending} className="h-11 rounded-lg bg-blue-700 font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in securely'}</button></div></form></main>
}
