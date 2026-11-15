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
  BellRing,
  Command as CommandIcon,
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
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
  ClipboardCheck,
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
const POLL_MS = 3000
const FRESH_WINDOW_MS = 5 * 60 * 1000

// ─── Types ──────────────────────────────────────────────────────────────────
type Device = { client_id: string; mobNo: string; battery: string | number; status: boolean }
type OtpMessage = { id: string; sender: string; message: string; dateTime: string }
type FetchState = 'idle' | 'loading' | 'success' | 'error'

// ─── Plans ──────────────────────────────────────────────────────────────────
const PANEL_PLANS = [
  {
    id: 'starter', name: 'Starter', price: 50, duration: '24 hours', tagline: 'Test the waters',
    features: ['1 private number', 'OTP inbox access', 'Instant activation', '24h validity'],
    icon: Zap, accent: 'from-sky-500/20 to-cyan-400/5', ring: 'ring-sky-400/30', text: 'text-sky-300', popular: false,
  },
  {
    id: 'pro', name: 'Pro', price: 99, duration: '7 days', tagline: 'Most chosen plan',
    features: ['3 private numbers', 'OTP inbox + full logs', 'Priority support', '7-day validity'],
    icon: Crown, accent: 'from-fuchsia-500/25 to-purple-400/5', ring: 'ring-fuchsia-400/40', text: 'text-fuchsia-300', popular: true,
  },
  {
    id: 'elite', name: 'Elite', price: 199, duration: '30 days', tagline: 'For power users',
    features: ['Unlimited numbers', 'API access included', 'Dedicated support', '30-day validity'],
    icon: Gem, accent: 'from-amber-500/20 to-yellow-400/5', ring: 'ring-amber-400/30', text: 'text-amber-300', popular: false,
  },
]

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes drift{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(5%,-4%,0) scale(1.15)}}
@keyframes ring{from{stroke-dashoffset:0}to{stroke-dashoffset:100}}
@keyframes bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes slideIn{from{opacity:0;transform:translateY(-16px) scale(.97)}to{opacity:1;transform:none}}
@keyframes flash{0%{box-shadow:0 0 0 0 rgba(34,211,238,.7)}100%{box-shadow:0 0 0 18px rgba(34,211,238,0)}}
@keyframes sheen{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.a-drift{animation:drift 22s ease-in-out infinite}
.a-slide{animation:slideIn .5s cubic-bezier(.2,.9,.3,1) both}
.a-flash{animation:flash 1.4s ease-out 2}
.a-rise{animation:rise .6s cubic-bezier(.2,.8,.3,1) both}
.sheen-text{background:linear-gradient(90deg,#67e8f9,#e879f9,#fde68a,#67e8f9);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 6s linear infinite}
.spot{position:relative}
.spot::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;
  background:radial-gradient(320px circle at var(--x,50%) var(--y,50%),rgba(34,211,238,.16),transparent 60%)}
.spot:hover::before{opacity:1}
.scroll::-webkit-scrollbar{width:6px;height:6px}
.scroll::-webkit-scrollbar-thumb{background:rgba(148,163,184,.25);border-radius:99px}
@media (prefers-reduced-motion:reduce){.a-drift,.a-slide,.a-flash,.a-rise,.sheen-text{animation:none}}
`

// ─── Helpers ────────────────────────────────────────────────────────────────
function BatteryGlyph({ level }: { level: number }) {
  if (Number.isNaN(level)) return <Battery className="h-3.5 w-3.5 text-slate-400" />
  if (level > 60) return <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
  if (level >= 20) return <Battery className="h-3.5 w-3.5 text-amber-400" />
  return <BatteryLow className="h-3.5 w-3.5 text-rose-400" />
}

const parseDate = (v: string) => {
  const d = new Date(v.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function formatTime(v: string) {
  const d = parseDate(v)
  return d
    ? d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : v
}

function timeAgo(v: string, now: number) {
  const d = parseDate(v)
  if (!d) return ''
  const s = Math.max(0, Math.floor((now - d.getTime()) / 1000))
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const extractOtp = (v: string) => v.match(/\b\d{4,8}\b/)?.[0]

const spotMove = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
}

async function copyText(text: string, label = 'OTP copied') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(label, { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> })
  } catch {
    toast.error('Copy failed. Long-press the code to copy it.')
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.32)
    setTimeout(() => ctx.close(), 500)
  } catch {}
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
        on ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-white/[0.03] text-slate-400'
      }`}
    >
      <span className={`relative h-3.5 w-6 rounded-full transition ${on ? 'bg-cyan-400/80' : 'bg-white/15'}`}>
        <span
          className={`absolute top-[2px] h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${
            on ? 'left-[13px]' : 'left-[2px]'
          }`}
        />
      </span>
      {label}
    </button>
  )
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => copyText(text)}
      aria-label="Copy OTP"
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 active:scale-95"
    >
      <Copy className="h-3.5 w-3.5" />
      Copy
    </button>
  )
}

// ─── Pricing modal ──────────────────────────────────────────────────────────
function PricingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-white/10 bg-[#0a0f1c] p-0 text-slate-100 shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(600px 300px at 50% -10%, rgba(168,85,247,0.2), transparent 60%),radial-gradient(400px 200px at 90% 10%, rgba(34,211,238,0.12), transparent 60%)',
          }}
        />
        <DialogHeader className="relative border-b border-white/5 px-6 pb-5 pt-6 text-left">
          <DialogTitle className="text-xl font-semibold">Get a private number panel</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            A dedicated OTP inbox starting at ₹50. Message us on Telegram to activate.
          </DialogDescription>
        </DialogHeader>
        <div className="relative grid gap-4 p-6 md:grid-cols-3">
          {PANEL_PLANS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.id}
                onMouseMove={spotMove}
                className={`spot relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br ${p.accent} p-5 ring-1 ${p.ring} transition hover:-translate-y-1`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-lg">
                    Most popular
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ${p.text}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.tagline}</p>
                  </div>
                </div>
                <div className="mb-4 flex items-end gap-1">
                  <span className="text-3xl font-bold tracking-tight">₹{p.price}</span>
                  <span className="mb-1 text-xs text-slate-500">/ {p.duration}</span>
                </div>
                <ul className="mb-5 flex-1 space-y-2 text-xs text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${p.text}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold ring-1 ring-inset ring-white/10 transition hover:bg-white/20 ${p.text}`}
                >
                  <Send className="h-3.5 w-3.5" />
                  Buy on Telegram
                </a>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Command palette ────────────────────────────────────────────────────────
type Cmd = { id: string; label: string; hint?: string; icon: React.ReactNode; run: () => void }

function CommandPalette({ open, onOpenChange, commands }: { open: boolean; onOpenChange: (v: boolean) => void; commands: Cmd[] }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const list = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [commands, q],
  )
  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
    }
  }, [open])
  useEffect(() => setIdx(0), [q])

  const run = (c?: Cmd) => {
    if (!c) return
    onOpenChange(false)
    c.run()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[25%] max-w-lg overflow-hidden border-white/10 bg-[#0a0f1c]/95 p-0 text-slate-100 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Search actions and devices</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-white/10 px-4">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIdx((i) => Math.min(i + 1, list.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIdx((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') run(list[idx])
            }}
            placeholder="Type a command or device…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>
        <ul className="scroll max-h-72 overflow-y-auto p-2">
          {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No results</li>}
          {list.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseEnter={() => setIdx(i)}
                onClick={() => run(c)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  i === idx ? 'bg-cyan-400/10 text-cyan-100' : 'text-slate-300'
                }`}
              >
                <span className="text-slate-400">{c.icon}</span>
                <span className="flex-1">{c.label}</span>
                {c.hint && <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{c.hint}</kbd>}
              </button>
            </li>
          ))}
        </ul>
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
  const [sound, setSound] = useState(true)
  const [autoCopy, setAutoCopy] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [senderFilter, setSenderFilter] = useState('all')
  const [freshIds, setFreshIds] = useState<string[]>([])
  const [now, setNow] = useState(() => Date.now())

  const abortRef = useRef<AbortController | null>(null)
  const seenRef = useRef<Set<string> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const soundRef = useRef(sound)
  const autoCopyRef = useRef(autoCopy)
  soundRef.current = sound
  autoCopyRef.current = autoCopy

  const selectedDevice = useMemo(() => devices.find((d) => d.client_id === selectedId), [devices, selectedId])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(dbCode.trim()), 400)
    return () => clearTimeout(t)
  }, [dbCode])

  // ── fetch devices
  const fetchDevices = useCallback(
    async (signal?: AbortSignal) => {
      if (!debouncedCode) return
      setDeviceState('loading')
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/${encodeURIComponent(debouncedCode)}/devices`, {
          signal,
          cache: 'no-store',
        })
        if (!res.ok)
          throw new Error(res.status === 404 ? 'Database code not found.' : `Unable to load devices (${res.status}).`)
        const payload = await res.json()
        const active: Device[] = Array.isArray(payload.devices) ? payload.devices.filter((d: Device) => d.status) : []
        setDevices(active)
        setSelectedId((cur) => (active.some((d) => d.client_id === cur) ? cur : active[0]?.client_id ?? ''))
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

  // ── fetch messages (+ new OTP detection)
  const fetchMessages = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedDevice) {
        setMessages([])
        setMessageState('idle')
        return
      }
      setMessageState((s) => (s === 'success' ? s : 'loading'))
      try {
        const res = await fetch(
          `${API_BASE}/api/${encodeURIComponent(debouncedCode)}/messages/${encodeURIComponent(selectedDevice.client_id)}`,
          { signal, cache: 'no-store' },
        )
        if (!res.ok) throw new Error(`Unable to load messages (${res.status}).`)
        const payload = await res.json()
        const list: OtpMessage[] = Array.isArray(payload.messages) ? payload.messages : []

        if (seenRef.current === null) {
          seenRef.current = new Set(list.map((m) => m.id))
        } else {
          const seen = seenRef.current
          const added = list.filter((m) => !seen.has(m.id))
          if (added.length) {
            added.forEach((m) => seen.add(m.id))
            setFreshIds((f) => [...added.map((m) => m.id), ...f].slice(0, 20))
            const top = added[0]
            const code = extractOtp(top.message)
            if (soundRef.current) beep()
            if (code && autoCopyRef.current) navigator.clipboard.writeText(code).catch(() => {})
            toast(`New OTP from ${top.sender}`, {
              description: code ? `Code ${code}${autoCopyRef.current ? ' (copied)' : ''}` : top.message.slice(0, 60),
              icon: <BellRing className="h-4 w-4 text-cyan-300" />,
            })
          }
        }
        setMessages(list)
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

  // reset when device / code changes
  useEffect(() => {
    seenRef.current = null
    setMessageState('idle')
    setMessages([])
    setFreshIds([])
    setSenderFilter('all')
    setSearch('')
  }, [selectedId, debouncedCode])

  useEffect(() => {
    const c = new AbortController()
    fetchMessages(c.signal)
    return () => c.abort()
  }, [fetchMessages])

  useEffect(() => {
    if (!autoRefresh || !selectedDevice) return
    const id = window.setInterval(() => {
      if (!document.hidden) fetchMessages()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [autoRefresh, selectedDevice, fetchMessages])

  // tab title shows latest OTP
  const latest = messages[0]
  const latestOtp = latest ? extractOtp(latest.message) : undefined
  useEffect(() => {
    document.title = latestOtp ? `${latestOtp} · Signal Console` : 'Signal Console'
  }, [latestOtp])

  const busy = deviceState === 'loading' || messageState === 'loading'
  const refreshAll = useCallback(() => {
    fetchDevices()
    if (selectedDevice) fetchMessages()
  }, [fetchDevices, fetchMessages, selectedDevice])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
        return
      }
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key.toLowerCase() === 'r') refreshAll()
      else if (e.key.toLowerCase() === 'c' && latestOtp) copyText(latestOtp)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [refreshAll, latestOtp])

  // cursor glow
  const onRootMove = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--mx', `${e.clientX}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY}px`)
  }

  // derived
  const senders = useMemo(() => Array.from(new Set(messages.map((m) => m.sender))), [messages])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return messages.filter(
      (m) =>
        (senderFilter === 'all' || m.sender === senderFilter) &&
        (!q || m.sender.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)),
    )
  }, [messages, search, senderFilter])

  const avgBattery = useMemo(() => {
    const vals = devices.map((d) => Number(d.battery)).filter((n) => !Number.isNaN(n))
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }, [devices])

  const latestDate = latest ? parseDate(latest.dateTime) : null
  const age = latestDate ? now - latestDate.getTime() : null
  const isFresh = age !== null && age >= 0 && age < FRESH_WINDOW_MS

  const commands: Cmd[] = useMemo(
    () => [
      { id: 'refresh', label: 'Refresh now', hint: 'R', icon: <RefreshCw className="h-4 w-4" />, run: refreshAll },
      {
        id: 'copy',
        label: 'Copy latest OTP',
        hint: 'C',
        icon: <Copy className="h-4 w-4" />,
        run: () => (latestOtp ? copyText(latestOtp) : toast.error('No OTP to copy yet')),
      },
      { id: 'auto', label: `${autoRefresh ? 'Pause' : 'Resume'} live updates`, icon: <Activity className="h-4 w-4" />, run: () => setAutoRefresh((v) => !v) },
      { id: 'sound', label: `Turn sound ${sound ? 'off' : 'on'}`, icon: sound ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />, run: () => setSound((v) => !v) },
      { id: 'autocopy', label: `Auto-copy new OTPs: ${autoCopy ? 'turn off' : 'turn on'}`, icon: <ClipboardCheck className="h-4 w-4" />, run: () => setAutoCopy((v) => !v) },
      { id: 'plans', label: 'View private panel plans', icon: <Crown className="h-4 w-4" />, run: () => setPricingOpen(true) },
      { id: 'tg', label: 'Open Telegram channel', icon: <Send className="h-4 w-4" />, run: () => window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer') },
      ...devices.map((d) => ({
        id: `dev-${d.client_id}`,
        label: `Switch to ${d.mobNo}`,
        icon: <Smartphone className="h-4 w-4" />,
        run: () => setSelectedId(d.client_id),
      })),
    ],
    [refreshAll, latestOtp, autoRefresh, sound, autoCopy, devices],
  )

  return (
    <div onMouseMove={onRootMove} className="relative min-h-screen overflow-hidden bg-[#060912] text-slate-100">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="a-drift absolute -left-[10%] -top-[20%] h-[65vh] w-[65vw] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(34,211,238,.25), transparent 65%)' }} />
        <div className="a-drift absolute -right-[10%] top-[5%] h-[55vh] w-[50vw] rounded-full blur-[120px]" style={{ background: 'radial-gradient(circle, rgba(168,85,247,.24), transparent 65%)', animationDelay: '-7s' }} />
        <div className="a-drift absolute bottom-[-25%] left-[25%] h-[50vh] w-[55vw] rounded-full blur-[130px]" style={{ background: 'radial-gradient(circle, rgba(16,185,129,.16), transparent 65%)', animationDelay: '-13s' }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 72%)',
          }}
        />
      </div>
      {/* cursor glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 hidden md:block"
        style={{ background: 'radial-gradient(420px circle at var(--mx,50%) var(--my,30%), rgba(56,189,248,.08), transparent 60%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="a-rise mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/20 ring-1 ring-white/15 backdrop-blur">
              <Radio className="h-5 w-5 text-cyan-300" />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_3px_rgba(52,211,153,.65)]" />
            </div>
            <div>
              <h1 className="sheen-text text-xl font-bold tracking-tight">Signal Console</h1>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-300">
                <Send className="h-3 w-3" />
                Join @bagga_tools
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200 sm:inline-flex"
            >
              <CommandIcon className="h-3.5 w-3.5" />
              Quick actions
              <kbd className="rounded border border-white/10 px-1.5 font-mono text-[10px]">Ctrl K</kbd>
            </button>
            <input
              value={dbCode}
              onChange={(e) => setDbCode(e.target.value)}
              placeholder="DB code"
              aria-label="Database code"
              className="h-10 w-28 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm outline-none backdrop-blur transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
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
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 px-4 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(217,70,239,.6)] transition hover:shadow-[0_0_30px_-4px_rgba(217,70,239,.85)]"
            >
              <Sparkles className="h-4 w-4" />
              Get panel
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">₹50+</span>
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="a-rise mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ animationDelay: '80ms' }}>
          {[
            { label: 'Active devices', value: devices.length, icon: MonitorSmartphone, tone: 'text-cyan-300' },
            { label: 'Messages', value: messages.length, icon: MessageSquareText, tone: 'text-fuchsia-300' },
            { label: 'Avg battery', value: avgBattery === null ? '--' : `${avgBattery}%`, icon: BatteryCharging, tone: 'text-emerald-300' },
            { label: 'Last OTP', value: latest ? timeAgo(latest.dateTime, now) || '--' : '--', icon: Clock3, tone: 'text-amber-300' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} onMouseMove={spotMove} className="spot overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  {s.label}
                  <Icon className={`h-4 w-4 ${s.tone}`} />
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{s.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <aside className="a-rise space-y-4" style={{ animationDelay: '140ms' }}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold">Devices</h2>
                </div>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                  {devices.length} active
                </span>
              </div>
              <div className="scroll max-h-[50vh] overflow-y-auto">
                {deviceState === 'loading' && (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
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
                    {devices.map((d) => {
                      const battery = Number(d.battery)
                      const selected = d.client_id === selectedId
                      return (
                        <li key={d.client_id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(d.client_id)}
                            aria-pressed={selected}
                            className={`group relative flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                              selected ? 'bg-gradient-to-r from-cyan-400/15 to-transparent' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            {selected && <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_14px_1px_rgba(34,211,238,.85)]" />}
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition ${selected ? 'bg-cyan-400/20 text-cyan-200 ring-cyan-400/40' : 'bg-white/5 text-slate-400 ring-white/10'}`}>
                              <Smartphone className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{d.mobNo}</p>
                              <p className="truncate font-mono text-[11px] text-slate-500">{d.client_id}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <BatteryGlyph level={battery} />
                              <span className="tabular-nums">{Number.isNaN(battery) ? '--' : `${battery}%`}</span>
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
                <Wifi className={`h-3 w-3 ${deviceState === 'error' ? 'text-rose-400' : 'text-emerald-400'}`} />
                {deviceState === 'error' ? 'API offline' : 'API online'}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                {autoRefresh ? `${POLL_MS / 1000}s polling` : 'paused'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPricingOpen(true)}
              onMouseMove={spotMove}
              className="spot block w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-purple-500/10 to-cyan-500/10 p-4 text-left transition hover:border-fuchsia-400/30"
            >
              <div className="mb-1 flex items-center gap-2">
                <Star className="h-4 w-4 text-fuchsia-300" />
                <span className="text-sm font-semibold">Private number panel</span>
              </div>
              <p className="text-xs text-slate-400">
                Your own OTP inbox from just <span className="font-semibold text-cyan-300">₹50</span>.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-fuchsia-300">
                See plans <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          </aside>

          {/* Main */}
          <section className="a-rise space-y-4" style={{ animationDelay: '200ms' }}>
            {/* Hero: latest OTP */}
            {selectedDevice && latest && latestOtp && (
              <div onMouseMove={spotMove} className="spot relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/[0.09] via-white/[0.02] to-fuchsia-500/[0.07] p-5 backdrop-blur-xl sm:p-6">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    Latest code from <span className="font-semibold text-white">{latest.sender}</span>
                    <span className="text-slate-500">{timeAgo(latest.dateTime, now)}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isFresh ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                    {isFresh ? 'Fresh' : 'Older than 5 min'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyText(latestOtp)}
                  aria-label={`Copy code ${latestOtp}`}
                  className="group mt-4 flex flex-wrap items-center gap-2 text-left"
                >
                  {latestOtp.split('').map((digit, i) => (
                    <span
                      key={`${latest.id}-${i}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="a-slide flex h-14 w-11 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 font-mono text-3xl font-bold text-cyan-50 shadow-[0_0_28px_-8px_rgba(34,211,238,.9)] transition group-hover:-translate-y-0.5 sm:h-16 sm:w-12"
                    >
                      {digit}
                    </span>
                  ))}
                  <span className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition group-hover:border-cyan-400/40 group-hover:text-cyan-200">
                    <Copy className="h-3.5 w-3.5" /> Tap to copy
                  </span>
                </button>

                {isFresh && age !== null && (
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      key={latest.id}
                      className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                      style={{ animation: `bar ${Math.max(1, (FRESH_WINDOW_MS - age) / 1000)}s linear forwards` }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

              <div className="flex flex-col gap-3 border-b border-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {selectedDevice ? (
                      <>
                        <Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />
                        <span className="truncate">{selectedDevice.mobNo}</span>
                      </>
                    ) : (
                      'Select a device'
                    )}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {selectedDevice ? `Incoming auth messages for ${selectedDevice.client_id}` : 'Choose an active endpoint from the list.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedDevice && autoRefresh && (
                    <span className="relative flex h-7 w-7 items-center justify-center" title="Next refresh">
                      <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
                        <circle
                          key={lastUpdated?.getTime() ?? 0}
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="3"
                          strokeLinecap="round"
                          pathLength={100}
                          strokeDasharray="100"
                          style={{ animation: `ring ${POLL_MS / 1000}s linear forwards` }}
                        />
                      </svg>
                      <Zap className="absolute h-3 w-3 text-cyan-300" />
                    </span>
                  )}
                  <Switch on={autoRefresh} onChange={setAutoRefresh} label="Live" />
                  <Switch on={sound} onChange={setSound} label="Sound" />
                  <Switch on={autoCopy} onChange={setAutoCopy} label="Auto-copy" />
                </div>
              </div>

              {selectedDevice && (
                <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search messages…  ( / )"
                      aria-label="Search messages"
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                  {senders.length > 1 && (
                    <div className="scroll flex gap-2 overflow-x-auto pb-1">
                      {['all', ...senders].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSenderFilter(s)}
                          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                            senderFilter === s
                              ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100'
                              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {s === 'all' ? 'All senders' : s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="h-3 w-3" />
                      {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for data'}
                    </span>
                    <span className="tabular-nums">
                      {filtered.length}
                      {filtered.length !== messages.length ? ` of ${messages.length}` : ''} {messages.length === 1 ? 'message' : 'messages'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-5">
                {messageState === 'loading' && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
                    ))}
                  </div>
                )}

                {messageState === 'error' && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                    <div className="mb-1 flex items-center gap-2 font-medium">
                      <CircleAlert className="h-4 w-4" /> Messages unavailable
                    </div>
                    <p className="text-xs text-rose-200/80">{error}</p>
                    <button type="button" onClick={() => fetchMessages()} className="mt-3 rounded-md border border-rose-400/40 px-3 py-1 text-xs text-rose-100 hover:bg-rose-500/20">
                      Try again
                    </button>
                  </div>
                )}

                {!selectedDevice && messageState !== 'loading' && (
                  <div className="py-16 text-center">
                    <MonitorSmartphone className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No device selected</p>
                    <p className="mt-1 text-xs text-slate-500">Pick a device on the left to see its OTPs.</p>
                  </div>
                )}

                {selectedDevice && messageState === 'success' && messages.length === 0 && (
                  <div className="py-16 text-center">
                    <MessageSquareText className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No messages yet</p>
                    <p className="mt-1 text-xs text-slate-500">New OTPs show up here automatically.</p>
                  </div>
                )}

                {selectedDevice && messageState === 'success' && messages.length > 0 && filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-400">No messages match your search.</div>
                )}

                {selectedDevice && messageState === 'success' && filtered.length > 0 && (
                  <ul className="space-y-3">
                    {filtered.map((item) => {
                      const otp = extractOtp(item.message)
                      const cleaned = otp ? item.message.replace(otp, '').replace(/\s+/g, ' ').trim() : item.message
                      const isNew = freshIds.includes(item.id)
                      return (
                        <li
                          key={item.id}
                          onMouseMove={spotMove}
                          className={`spot group overflow-hidden rounded-xl border bg-gradient-to-br from-white/[0.045] to-white/[0.01] p-4 transition ${
                            isNew ? 'a-slide a-flash border-cyan-400/50' : 'border-white/10 hover:border-cyan-400/30'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-400/10 text-[10px] font-bold uppercase text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                                {item.sender.slice(0, 2)}
                              </div>
                              <span className="truncate text-sm font-semibold">{item.sender}</span>
                            </div>
                            {isNew ? (
                              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">New</span>
                            ) : (
                              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">OTP</span>
                            )}
                          </div>

                          {cleaned && <p className="mb-2 break-words text-sm text-slate-400">{cleaned}</p>}

                          {otp && (
                            <button
                              type="button"
                              onClick={() => copyText(otp)}
                              aria-label={`Copy code ${otp}`}
                              className="mb-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-mono text-xl font-bold tracking-[0.2em] text-cyan-200 shadow-[0_0_24px_-6px_rgba(34,211,238,.6)] transition hover:bg-cyan-400/20 active:scale-95"
                            >
                              {otp}
                            </button>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="h-3 w-3" />
                              {formatTime(item.dateTime)} · {timeAgo(item.dateTime, now)}
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
              <span className="hidden items-center gap-3 sm:flex">
                <span><kbd className="font-mono">R</kbd> refresh</span>
                <span><kbd className="font-mono">C</kbd> copy latest</span>
                <span><kbd className="font-mono">/</kbd> search</span>
              </span>
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
        className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_8px_30px_-4px_rgba(14,165,233,.7)] transition hover:scale-105"
      >
        <Send className="h-6 w-6 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-sky-400/30" />
      </a>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} commands={commands} />

      <Toaster
        theme="dark"
        position="bottom-left"
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
