'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Battery,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Inbox,
  Loader2,
  MessageSquareText,
  MonitorSmartphone,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  Wifi,
  Zap,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

const API_BASE = 'https://apifb-ten.vercel.app'

type Device = { client_id: string; mobNo: string; battery: string | number; status: boolean }
type OtpMessage = { id: string; sender: string; message: string; dateTime: string }

type FetchState = 'idle' | 'loading' | 'success' | 'error'

function batteryIcon(level: number) {
  if (level >= 80) return <BatteryCharging aria-hidden="true" className="text-emerald-400" />
  if (level >= 30) return <Battery aria-hidden="true" className="text-amber-400" />
  return <Battery aria-hidden="true" className="text-rose-400" />
}

function formatTime(value: string) {
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Page() {
  const [dbCode, setDbCode] = useState('101')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState<OtpMessage[]>([])
  const [deviceState, setDeviceState] = useState<FetchState>('idle')
  const [messageState, setMessageState] = useState<FetchState>('idle')
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const selectedDevice = useMemo(() => devices.find((device) => device.client_id === selectedId), [devices, selectedId])

  const fetchDevices = useCallback(async (signal?: AbortSignal) => {
    const code = dbCode.trim()
    if (!code) return
    setDeviceState('loading')
    setError('')
    try {
      const response = await fetch(`${API_BASE}/api/${encodeURIComponent(code)}/devices`, { signal, cache: 'no-store' })
      if (!response.ok) throw new Error(response.status === 404 ? 'Database code not found.' : `Unable to load devices (${response.status}).`)
      const payload = await response.json()
      const activeDevices = Array.isArray(payload.devices) ? payload.devices.filter((device: Device) => device.status) : []
      setDevices(activeDevices)
      setSelectedId((current) => activeDevices.some((device: Device) => device.client_id === current) ? current : activeDevices[0]?.client_id ?? '')
      setDeviceState('success')
      setLastUpdated(new Date())
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setDevices([]); setSelectedId(''); setMessages([]); setDeviceState('error'); setError((cause as Error).message || 'Could not connect to the API.')
    }
  }, [dbCode])

  const fetchMessages = useCallback(async (signal?: AbortSignal) => {
    if (!selectedDevice) { setMessages([]); setMessageState('idle'); return }
    setMessageState('loading')
    try {
      const response = await fetch(`${API_BASE}/api/${encodeURIComponent(dbCode.trim())}/messages/${encodeURIComponent(selectedDevice.client_id)}`, { signal, cache: 'no-store' })
      if (!response.ok) throw new Error(`Unable to load messages (${response.status}).`)
      const payload = await response.json()
      setMessages(Array.isArray(payload.messages) ? payload.messages : [])
      setMessageState('success'); setLastUpdated(new Date())
    } catch (cause) {
      if ((cause as Error).name === 'AbortError') return
      setMessages([]); setMessageState('error'); setError((cause as Error).message || 'Could not load messages.')
    }
  }, [dbCode, selectedDevice])

  useEffect(() => { const controller = new AbortController(); fetchDevices(controller.signal); return () => controller.abort() }, [fetchDevices])
  useEffect(() => { const controller = new AbortController(); fetchMessages(controller.signal); return () => controller.abort() }, [fetchMessages])
  useEffect(() => {
    if (!autoRefresh || !selectedDevice) return
    const interval = window.setInterval(() => fetchMessages(), 3000)
    return () => window.clearInterval(interval)
  }, [autoRefresh, selectedDevice, fetchMessages])

  const manualRefresh = () => { fetchDevices(); if (selectedDevice) fetchMessages() }
  const busy = deviceState === 'loading' || messageState === 'loading'

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10"><ShieldCheck aria-hidden="true" /></div>
            <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Signal Console</p><h1 className="text-lg font-semibold tracking-tight">OTP Monitor</h1></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Code2 aria-hidden="true" className="size-4" /><label htmlFor="db-code" className="whitespace-nowrap font-mono uppercase tracking-wider">Database code</label><Input id="db-code" value={dbCode} onChange={(event) => setDbCode(event.target.value)} className="h-9 w-full font-mono sm:w-28" aria-label="Database code" /></div>
            <Button variant="outline" size="sm" onClick={manualRefresh} disabled={busy}><RefreshCw aria-hidden="true" className={busy ? 'animate-spin' : ''} data-icon="inline-start" />Refresh</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
        <aside className="w-full border-b border-border/70 p-4 sm:p-6 lg:min-h-[calc(100vh-81px)] lg:w-[320px] lg:border-b-0 lg:border-r lg:p-6">
          <div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Connected endpoints</p><h2 className="mt-1 text-xl font-semibold">Devices</h2></div><Badge variant="secondary" className="font-mono">{devices.length} active</Badge></div>
          {deviceState === 'loading' ? <div className="flex flex-col gap-3">{[1,2,3].map((item) => <Skeleton key={item} className="h-[76px] rounded-xl" />)}</div> : deviceState === 'error' ? <Alert variant="destructive"><CircleAlert aria-hidden="true" /><AlertTitle>Connection failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : devices.length === 0 ? <Empty className="border border-dashed border-border/70 py-8"><EmptyHeader><EmptyMedia variant="icon"><MonitorSmartphone aria-hidden="true" /></EmptyMedia><EmptyTitle>No active devices</EmptyTitle><EmptyDescription>Check the database code or connect a device to begin monitoring.</EmptyDescription></EmptyHeader></Empty> : <div className="flex flex-col gap-2">{devices.map((device) => { const battery = Number(device.battery); const selected = device.client_id === selectedId; return <button key={device.client_id} onClick={() => setSelectedId(device.client_id)} className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? 'border-primary/60 bg-primary/10' : 'border-border/70 bg-card/40 hover:border-primary/30 hover:bg-accent'}`} aria-pressed={selected}><div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><Smartphone aria-hidden="true" /></div><div className="min-w-0 flex-1"><p className="truncate font-mono text-sm font-medium">{device.mobNo}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-400" />{device.client_id}</p></div><div className="flex items-center gap-1 text-xs font-medium">{batteryIcon(battery)}<span>{battery}%</span></div><ChevronRight aria-hidden="true" className={`size-4 text-muted-foreground transition-transform ${selected ? 'translate-x-0.5 text-primary' : 'opacity-0 group-hover:opacity-100'}`} /></button> })}</div>}
          <div className="mt-6 flex items-center gap-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground"><Wifi aria-hidden="true" className="size-3.5 text-emerald-400" /> API online <span className="ml-auto font-mono">3s polling</span></div>
        </aside>

        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Activity aria-hidden="true" className="size-4 text-primary" />Live message stream</div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{selectedDevice ? selectedDevice.mobNo : 'Select a device'}</h2><p className="mt-2 text-sm text-muted-foreground">{selectedDevice ? `Incoming authentication messages for ${selectedDevice.client_id}` : 'Choose an active endpoint from the device list.'}</p></div><div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card/60 px-4 py-3"><div><p className="text-sm font-medium">Auto-refresh</p><p className="text-xs text-muted-foreground">Poll every 3 seconds</p></div><Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} aria-label="Auto-refresh messages" /></div></div>
          <Separator />
          {selectedDevice && <div className="my-5 flex flex-wrap items-center gap-3"><Badge variant="outline" className="gap-1.5 font-mono"><span className="size-1.5 rounded-full bg-emerald-400" />LIVE</Badge><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="size-3.5" />{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Waiting for data'}</span><span className="text-xs text-muted-foreground">{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span></div>}
          {messageState === 'loading' ? <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map((item) => <Skeleton key={item} className="h-44 rounded-xl" />)}</div> : messageState === 'error' ? <Alert variant="destructive"><CircleAlert aria-hidden="true" /><AlertTitle>Message stream unavailable</AlertTitle><AlertDescription>{error}<Button variant="link" className="h-auto p-0 pl-1" onClick={() => fetchMessages()}>Try again</Button></AlertDescription></Alert> : !selectedDevice ? <Empty className="mt-10 border border-dashed border-border/70 py-16"><EmptyHeader><EmptyMedia variant="icon"><MessageSquareText aria-hidden="true" /></EmptyMedia><EmptyTitle>No device selected</EmptyTitle><EmptyDescription>Select a device to view incoming OTP messages.</EmptyDescription></EmptyHeader></Empty> : messages.length === 0 ? <Empty className="mt-10 border border-dashed border-border/70 py-16"><EmptyHeader><EmptyMedia variant="icon"><Inbox aria-hidden="true" /></EmptyMedia><EmptyTitle>No messages yet</EmptyTitle><EmptyDescription>This device has not received any OTP messages.</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => fetchMessages()}><RefreshCw aria-hidden="true" data-icon="inline-start" />Check again</Button></EmptyContent></Empty> : <div className="grid gap-4 md:grid-cols-2">{messages.map((item) => <Card key={item.id} className="border-border/70 bg-card/70 shadow-none transition-colors hover:border-primary/30"><CardHeader className="flex-row items-start justify-between gap-3 pb-3"><div className="flex min-w-0 items-center gap-2"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Zap aria-hidden="true" className="size-4" /></div><CardTitle className="truncate text-base">{item.sender}</CardTitle></div><Badge variant="outline" className="shrink-0 font-mono text-[10px]">OTP</Badge></CardHeader><CardContent><p className="rounded-lg border border-primary/15 bg-primary/5 p-4 font-mono text-sm font-semibold leading-relaxed text-primary-foreground/90">{item.message}</p><div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="size-3.5" />{formatTime(item.dateTime)}</div></CardContent></Card>)}</div>}
          <footer className="mt-8 flex items-center gap-2 text-[11px] text-muted-foreground"><Server aria-hidden="true" className="size-3.5" />Connected to {API_BASE.replace('https://', '')}<span className="ml-auto flex items-center gap-1"><CheckCircle2 aria-hidden="true" className="size-3.5 text-emerald-400" />Secure channel</span></footer>
        </section>
      </div>
    </main>
  )
}
