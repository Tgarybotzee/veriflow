'use client'

import { useState } from 'react'
import { loginAdmin } from '../actions'

export default function AdminLoginPage() {
  const [error, setError] = useState('')
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6"><form action={async (formData) => { try { await loginAdmin(formData) } catch { setError('Invalid credentials') } }} className="flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-8 text-slate-950 shadow-2xl"><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-600">Signal Console</p><h1 className="mt-2 text-3xl font-bold">Admin sign in</h1><p className="mt-2 text-sm text-slate-500">Use your configured admin credentials.</p></div><label className="flex flex-col gap-2 text-sm font-semibold">Email<input name="email" type="email" required className="rounded-md border p-3" /></label><label className="flex flex-col gap-2 text-sm font-semibold">Password<input name="password" type="password" required className="rounded-md border p-3" /></label>{error && <p className="text-sm text-red-600">{error}</p>}<button className="rounded-md bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700">Sign in</button></form></main>
}
