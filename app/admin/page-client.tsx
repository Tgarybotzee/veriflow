'use client'

import { useState } from 'react'
import { Activity, BarChart3, ChevronRight, FileText, Globe2, LayoutDashboard, LockKeyhole, Megaphone, Menu, Save, Settings2, ShieldCheck, Users, X, LogOut } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { savePopupCampaign, updateSiteContent, logoutAdmin } from './actions'

type Section = 'overview' | 'popups' | 'users' | 'traffic' | 'logs' | 'layout'

const nav: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'popups', label: 'Popup campaigns', icon: Megaphone },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'traffic', label: 'Traffic & analytics', icon: BarChart3 },
  { id: 'logs', label: 'Activity logs', icon: FileText },
  { id: 'layout', label: 'Header & footer', icon: Settings2 },
]

export default function AdminPageClient({ initialData, sessionEmail }: { initialData: any, sessionEmail: string }) {
  const [section, setSection] = useState<Section>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </Button>
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Signal Console</p>
            <p className="font-semibold text-sm">Admin control center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-slate-500 sm:inline-block">{sessionEmail}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            View monitor <ChevronRight className="ml-1 size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => logoutAdmin()}>
            <LogOut className="size-4 text-slate-600" />
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className={`${mobileOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-16 z-10 flex-col border-b border-slate-200 bg-white p-4 shadow-xl lg:static lg:flex lg:min-h-[calc(100vh-4rem)] lg:w-64 lg:border-b-0 lg:border-r lg:p-5 lg:shadow-none`}>
          <nav className="flex flex-col gap-1">
            {nav.map(({ id, label, icon: Icon }) => (
              <button 
                key={id} 
                onClick={() => { setSection(id); setMobileOpen(false) }} 
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${section === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
              >
                <Icon className="size-4" />{label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-7">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{nav.find((item) => item.id === section)?.label}</h1>
          </div>
          {section === 'overview' && <Overview data={initialData} />}
          {section === 'popups' && <PopupEditor />}
          {section === 'users' && <UsersPanel />}
          {section === 'traffic' && <TrafficPanel />}
          {section === 'logs' && <LogsPanel logs={initialData.logs} />}
          {section === 'layout' && <LayoutPanel />}
        </section>
      </div>
    </main>
  )
}

function Overview({ data }: { data: any }) { 
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">Total Campaigns</CardDescription>
            <Megaphone className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.campaigns.total}</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">Active Campaigns</CardDescription>
            <Activity className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.campaigns.active}</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">Impressions</CardDescription>
            <Globe2 className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.stats.impressions}</p></CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="font-medium text-slate-600">Clicks</CardDescription>
            <BarChart3 className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.stats.clicks}</p></CardContent>
        </Card>
      </div>
    </>
  ) 
}

function PopupEditor() { 
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    try {
      await savePopupCampaign(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert("Failed to save campaign")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm max-w-3xl">
      <CardHeader>
        <CardTitle>Create popup campaign</CardTitle>
        <CardDescription>Deploy a new notification to your users.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-semibold">Campaign title
            <Input name="title" required placeholder="Join our Telegram community" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">Message
            <Textarea name="message" required className="min-h-28" placeholder="Get updates, support, and exclusive alerts." />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">External image URL
            <Input name="imageUrl" type="url" placeholder="https://example.com/banner.jpg" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold">Primary button label
              <Input name="ctaText" placeholder="Join Telegram" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">Primary button URL
              <Input name="ctaLink" type="url" placeholder="https://t.me/yourchannel" />
            </label>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <input type="checkbox" name="isActive" id="isActive" className="size-4 accent-blue-600" defaultChecked />
            <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Publish immediately</label>
          </div>
          <Button disabled={pending} type="submit" className="w-fit bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 size-4" /> {pending ? 'Saving...' : 'Save campaign'}
          </Button>
          {saved && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 mt-4"><AlertTitle>Campaign Saved</AlertTitle><AlertDescription>Your campaign has been successfully written to the database.</AlertDescription></Alert>}
        </form>
      </CardContent>
    </Card>
  ) 
}

function LogsPanel({ logs }: { logs: any[] }) { 
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Activity logs</CardTitle>
        <CardDescription>Immutable audit trail for sensitive actions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {logs.length === 0 && <p className="text-sm text-slate-500">No logs found in the database.</p>}
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
            <div className="flex items-center gap-3">
              <FileText className="size-4 text-blue-600" />
              <span className="font-medium text-sm">{log.action}</span>
            </div>
            <span className="text-xs text-slate-500">{log.admin_email} &middot; {new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  ) 
}

function LayoutPanel() { 
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const data = { brand: formData.get('brand'), announcement: formData.get('announcement') }
    await updateSiteContent('header_config', data)
    setSaved(true)
    setPending(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Card className="border-slate-200 shadow-sm max-w-2xl">
      <CardHeader>
        <CardTitle>Header manager</CardTitle>
        <CardDescription>Control navigation copy and primary links.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold">Brand label
            <Input name="brand" defaultValue="Signal Console" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">Announcement bar
            <Textarea name="announcement" defaultValue="Service status: all systems operational" />
          </label>
          <Button disabled={pending} type="submit" className="w-fit bg-blue-600 hover:bg-blue-700">
            <Save className="mr-2 size-4" /> Save Configuration
          </Button>
          {saved && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 mt-2"><AlertTitle>Saved</AlertTitle><AlertDescription>Settings updated in database.</AlertDescription></Alert>}
        </form>
      </CardContent>
    </Card>
  ) 
}

// Stubs for currently unimplemented database tables
function UsersPanel() { return <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Users table logic pending backend implementation.</p></CardContent></Card> }
function TrafficPanel() { return <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Traffic table logic pending backend implementation.</p></CardContent></Card> }
