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
  BadgeCheck,
  BellRing,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Command as CommandIcon,
  Copy,
  Crown,
  Focus,
  Gem,
  Inbox,
  LayoutGrid,
  MessageSquareText,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  SkipForward,
  Sparkles,
  Star,
  Trash2,
  User,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
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
const ADMIN_USERNAME = '@bagga_tools'
const TELEGRAM_URL = 'https://t.me/bagga_tools'
const POLL_MS = 3000
const FRESH_WINDOW_MS = 5 * 60 * 1000
const TG_POPUP_DELAY_MS = 4000
const TG_POPUP_COOLDOWN_MS = 24 * 60 * 60 * 1000
const MAX_READ_CACHE = 3000
const LS = {
  prefs: 'sc:prefs',
  used: 'sc:used',
  read: 'sc:read',
  tg: 'sc:tg',
  devPrefix: 'sc:dev:',
}

// ─── Types ──────────────────────────────────────────────────────────────────
type Device = { client_id: string; mobNo: string; battery: string | number; status: boolean }
type OtpMessage = { id: string; sender: string; message: string; dateTime: string }
type FetchState = 'idle' | 'loading' | 'success' | 'error'
type Prefs = { dbCode: string; autoRefresh: boolean; sound: boolean; autoCopy: boolean; mono: boolean }
type UsedEntry = { mobNo: string; first: number; last: number; opens: number }
type DeviceFilter = 'all' | 'new' | 'used'

const DEFAULT_PREFS: Prefs = { dbCode: '101', autoRefresh: true, sound: true, autoCopy: false, mono: false }

// ─── Plans ──────────────────────────────────────────────────────────────────
const PANEL_PLANS = [
  {
    id: 'starter', name: 'Starter', price: 50, duration: '29 days', tagline: 'Perfect to test the waters',
    features: ['10+ numbers', 'OTP inbox access', 'Instant activation', '29-day validity'],
    icon: Zap, accent: 'from-sky-500/20 to-cyan-400/5', ring: 'ring-sky-400/30', text: 'text-sky-300', popular: false,
  },
  {
    id: 'pro', name: 'Pro', price: 99, duration: '29 days', tagline: 'Most chosen plan',
    features: ['25+ private numbers', 'OTP inbox + full logs', 'Priority support', '29-day validity'],
    icon: Crown, accent: 'from-fuchsia-500/25 to-purple-400/5', ring: 'ring-fuchsia-400/40', text: 'text-fuchsia-300', popular: true,
  },
  {
    id: 'elite', name: 'Elite', price: 199, duration: '30 days', tagline: 'For power users',
    features: ['50+ numbers', 'API access included', 'Dedicated support', '30-day validity'],
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
@keyframes swap{from{opacity:0;transform:translateX(24px) scale(.98)}to{opacity:1;transform:none}}
@keyframes stamp{from{opacity:0;transform:rotate(-14deg) scale(1.6)}to{opacity:1;transform:rotate(-14deg) scale(1)}}
.a-drift{animation:drift 22s ease-in-out infinite}
.a-slide{animation:slideIn .5s cubic-bezier(.2,.9,.3,1) both}
.a-flash{animation:flash 1.4s ease-out 2}
.a-rise{animation:rise .6s cubic-bezier(.2,.8,.3,1) both}
.a-swap{animation:swap .35s cubic-bezier(.2,.9,.3,1) both}
.sheen-text{background:linear-gradient(90deg,#67e8f9,#e879f9,#fde68a,#67e8f9);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 6s linear infinite}
.spot{position:relative}
.spot::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;
  background:radial-gradient(320px circle at var(--x,50%) var(--y,50%),rgba(34,211,238,.16),transparent 60%)}
.spot:hover::before{opacity:1}
.stamp{position:absolute;right:14px;top:50%;margin-top:-18px;transform:rotate(-14deg);pointer-events:none;
  border:2px solid rgba(52,211,153,.55);color:rgba(52,211,153,.6);border-radius:8px;padding:2px 10px;
  font-weight:800;letter-spacing:.25em;font-size:15px;background:rgba(52,211,153,.05);animation:stamp .35s cubic-bezier(.2,.9,.3,1) both;
  user-select:none}
.stamp-lg{font-size:22px;padding:4px 14px;margin-top:-24px}
.scroll::-webkit-scrollbar{width:6px;height:6px}
.scroll::-webkit-scrollbar-thumb{background:rgba(148,163,184,.25);border-radius:99px}
@media (prefers-reduced-motion:reduce){.a-drift,.a-slide,.a-flash,.a-rise,.a-swap,.sheen-text,.stamp{animation:none}}
`

// ─── Helpers ────────────────────────────────────────────────────────────────
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setValue((v) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? { ...v, ...JSON.parse(raw) } : JSON.parse(raw)))
    } catch {}
    setReady(true)
  }, [key])
  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value, ready])
  return [value, setValue, ready] as const
}

const dk = (code: string, id: string) => `${code}:${id}`
const mk = (code: string, deviceId: string, msgId: string) => `${code}:${deviceId}:${msgId}`

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
  return d ? d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : v
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

async function copyText(text: string, label = 'Copied'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(label, { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> })
    return true
  } catch {
    toast.error('Copy failed. Long-press the code to copy it.')
    return false
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
        <span className={`absolute top-[2px] h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${on ? 'left-[13px]' : 'left-[2px]'}`} />
      </span>
      {label}
    </button>
  )
}

function CopyButton({ onClick, label = 'Copy' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Copy"
      className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 active:scale-95"
    >
      <Copy className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

// ─── Admin contact chip ─────────────────────────────────────────────────────
function AdminChip({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-xs ${className}`}>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-2 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
        title="Contact admin on Telegram"
      >
        <User className="h-3.5 w-3.5 text-cyan-300" />
        <span className="text-slate-500">Admin</span>
        <span className="font-semibold">{ADMIN_USERNAME}</span>
      </a>
      <button
        type="button"
        onClick={() => copyText(ADMIN_USERNAME, 'Username copied')}
        aria-label="Copy admin username"
        className="border-l border-white/10 px-2 py-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-200"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
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
            A dedicated OTP inbox starting at ₹50. Message the admin on Telegram to activate.
          </DialogDescription>
        </DialogHeader>
        <div className="relative grid gap-4 p-6 pb-3 md:grid-cols-3">
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
                  Buy from {ADMIN_USERNAME}
                </a>
              </div>
            )
          })}
        </div>
        <div className="relative flex flex-col items-center justify-between gap-3 border-t border-white/5 px-6 py-4 sm:flex-row">
          <p className="text-xs text-slate-400">Send your plan name to the admin and your panel is activated instantly.</p>
          <AdminChip />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Telegram popup ─────────────────────────────────────────────────────────
function TelegramPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm overflow-hidden border-white/10 bg-[#0a0f1c] p-0 text-slate-100 shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(360px 200px at 50% -10%, rgba(14,165,233,.28), transparent 65%)' }}
        />
        <div className="relative px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-[0_10px_40px_-8px_rgba(14,165,233,.8)]">
            <Send className="h-7 w-7 text-white" />
          </div>
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-xl font-semibold">Join our Telegram</DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              Get updates, new number drops and fast support straight from the admin.
            </DialogDescription>
          </DialogHeader>
          <ul className="mx-auto mt-4 max-w-[16rem] space-y-1.5 text-left text-xs text-slate-300">
            {['Instant service updates', 'Private panel offers', 'Direct admin support'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-300" />
                {t}
              </li>
            ))}
          </ul>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_-6px_rgba(14,165,233,.7)] transition hover:brightness-110 active:scale-[.98]"
          >
            <Send className="h-4 w-4" />
            Join {ADMIN_USERNAME}
          </a>
          <button type="button" onClick={onClose} className="mt-2 w-full rounded-lg py-2 text-xs text-slate-500 transition hover:text-slate-300">
            Maybe later
          </button>
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
  const list = useMemo(() => commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())), [commands, q])
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

// ─── Message card (shared by list + mono) ───────────────────────────────────
function MessageCard({
  item, read, isNew, now, big, onCopy, onMarkRead,
}: {
  item: OtpMessage
  read: boolean
  isNew: boolean
  now: number
  big?: boolean
  onCopy: (m: OtpMessage, text: string) => void
  onMarkRead: (m: OtpMessage) => void
}) {
  const otp = extractOtp(item.message)
  const cleaned = otp ? item.message.replace(otp, '').replace(/\s+/g, ' ').trim() : item.message
  return (
    <li
      onMouseMove={spotMove}
      className={`spot group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white/[0.045] to-white/[0.01] p-4 transition-all duration-300 ${
        isNew ? 'a-slide a-flash border-cyan-400/50' : 'border-white/10 hover:border-cyan-400/30'
      } ${read ? 'opacity-70' : ''} ${big ? 'sm:p-5' : ''}`}
    >
      {read && <span className={`stamp ${big ? 'stamp-lg' : ''}`}>READ</span>}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-400/10 text-[10px] font-bold uppercase text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
            {item.sender.slice(0, 2)}
          </div>
          <span className="truncate text-sm font-semibold">{item.sender}</span>
        </div>
        {isNew ? (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">New</span>
        ) : !read ? (
          <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">Unread</span>
        ) : null}
      </div>

      {cleaned && <p className="mb-2 line-clamp-3 break-words text-sm text-slate-400">{cleaned}</p>}

      {otp && (
        <button
          type="button"
          onClick={() => onCopy(item, otp)}
          aria-label={`Copy code ${otp}`}
          className={`mb-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-mono font-bold tracking-[0.2em] text-cyan-200 shadow-[0_0_24px_-6px_rgba(34,211,238,.6)] transition hover:bg-cyan-400/20 active:scale-95 ${
            big ? 'text-3xl' : 'text-xl'
          }`}
        >
          {otp}
        </button>
      )}

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock3 className="h-3 w-3" />
          {formatTime(item.dateTime)} · {timeAgo(item.dateTime, now)}
        </span>
        <div className="flex items-center gap-1.5">
          {!read && (
            <button
              type="button"
              onClick={() => onMarkRead(item)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              <Check className="h-3 w-3" /> Read
            </button>
          )}
          <CopyButton onClick={() => onCopy(item, otp ?? item.message)} />
        </div>
      </div>
    </li>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function HomePage() {
  // persisted state
  const [prefs, setPrefs, prefsReady] = usePersisted<Prefs>(LS.prefs, DEFAULT_PREFS)
  const [usedMap, setUsedMap, usedReady] = usePersisted<Record<string, UsedEntry>>(LS.used, {})
  const [readMap, setReadMap] = usePersisted<Record<string, number>>(LS.read, {})
  const setPref = useCallback(<K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v })), [setPrefs])
  const { dbCode, autoRefresh, sound, autoCopy, mono } = prefs

  // runtime state
  const [debouncedCode, setDebouncedCode] = useState(DEFAULT_PREFS.dbCode)
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [messages, setMessages] = useState<OtpMessage[]>([])
  const [deviceState, setDeviceState] = useState<FetchState>('idle')
  const [messageState, setMessageState] = useState<FetchState>('idle')
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [tgOpen, setTgOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [senderFilter, setSenderFilter] = useState('all')
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all')
  const [freshIds, setFreshIds] = useState<string[]>([])
  const [now, setNow] = useState(() => Date.now())

  const abortRef = useRef<AbortController | null>(null)
  const seenRef = useRef<Set<string> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const devicesRef = useRef<Device[]>([])
  const soundRef = useRef(sound)
  const autoCopyRef = useRef(autoCopy)
  soundRef.current = sound
  autoCopyRef.current = autoCopy
  devicesRef.current = devices

  const selectedDevice = useMemo(() => devices.find((d) => d.client_id === selectedId), [devices, selectedId])

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // debounce db code (apply instantly once prefs are loaded)
  useEffect(() => {
    if (prefsReady) setDebouncedCode(prefs.dbCode.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsReady])
  useEffect(() => {
    if (!prefsReady) return
    const t = setTimeout(() => setDebouncedCode(dbCode.trim()), 400)
    return () => clearTimeout(t)
  }, [dbCode, prefsReady])

  // telegram popup (first visit, then once every 24h)
  useEffect(() => {
    if (!prefsReady) return
    let last = 0
    try {
      last = Number(localStorage.getItem(LS.tg) || 0)
    } catch {}
    if (Date.now() - last < TG_POPUP_COOLDOWN_MS) return
    const t = setTimeout(() => setTgOpen(true), TG_POPUP_DELAY_MS)
    return () => clearTimeout(t)
  }, [prefsReady])
  const closeTg = useCallback(() => {
    setTgOpen(false)
    try {
      localStorage.setItem(LS.tg, String(Date.now()))
    } catch {}
  }, [])

  // ── read / used helpers
  const isRead = useCallback(
    (m: OtpMessage) => !!readMap[mk(debouncedCode, selectedId, m.id)],
    [readMap, debouncedCode, selectedId],
  )
  const markRead = useCallback(
    (m: OtpMessage) => {
      const k = mk(debouncedCode, selectedId, m.id)
      setReadMap((r) => {
        if (r[k]) return r
        const n = { ...r, [k]: Date.now() }
        const keys = Object.keys(n)
        if (keys.length > MAX_READ_CACHE) {
          keys.sort((a, b) => n[a] - n[b]).slice(0, keys.length - MAX_READ_CACHE).forEach((x) => delete n[x])
        }
        return n
      })
    },
    [debouncedCode, selectedId, setReadMap],
  )
  const markAllRead = useCallback(
    (list: OtpMessage[]) => {
      setReadMap((r) => {
        const n = { ...r }
        list.forEach((m) => (n[mk(debouncedCode, selectedId, m.id)] ??= Date.now()))
        return n
      })
      toast.success('Marked all as read')
    },
    [debouncedCode, selectedId, setReadMap],
  )
  const handleCopy = useCallback(
    async (m: OtpMessage, text: string) => {
      if (await copyText(text, 'OTP copied')) markRead(m)
    },
    [markRead],
  )
  const isUsed = useCallback((d: Device) => !!usedMap[dk(debouncedCode, d.client_id)], [usedMap, debouncedCode])

  // record "opened" numbers
  useEffect(() => {
    if (!usedReady || !selectedDevice) return
    const k = dk(debouncedCode, selectedDevice.client_id)
    const t = Date.now()
    setUsedMap((u) => ({
      ...u,
      [k]: { mobNo: selectedDevice.mobNo, first: u[k]?.first ?? t, last: t, opens: (u[k]?.opens ?? 0) + 1 },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice?.client_id, debouncedCode, usedReady])

  // ── load cached devices instantly when the code changes
  useEffect(() => {
    if (!prefsReady || !debouncedCode) return
    let cached: Device[] | null = null
    try {
      const raw = localStorage.getItem(LS.devPrefix + debouncedCode)
      if (raw) cached = JSON.parse(raw)
    } catch {}
    if (cached && cached.length) {
      setDevices(cached)
      setSelectedId((cur) => (cached!.some((d) => d.client_id === cur) ? cur : cached![0].client_id))
      setDeviceState('success')
    } else {
      setDevices([])
      setSelectedId('')
      setDeviceState('idle')
    }
  }, [debouncedCode, prefsReady])

  // ── fetch devices (stale-while-revalidate)
  const fetchDevices = useCallback(
    async (signal?: AbortSignal) => {
      if (!debouncedCode || !prefsReady) return
      setDeviceState((s) => (s === 'success' ? s : 'loading'))
      setError('')
      try {
        const res = await fetch(`${API_BASE}/api/${encodeURIComponent(debouncedCode)}/devices`, { signal, cache: 'no-store' })
        if (!res.ok) throw new Error(res.status === 404 ? 'Database code not found.' : `Unable to load devices (${res.status}).`)
        const payload = await res.json()
        const active: Device[] = Array.isArray(payload.devices) ? payload.devices.filter((d: Device) => d.status) : []
        setDevices(active)
        setSelectedId((cur) => (active.some((d) => d.client_id === cur) ? cur : active[0]?.client_id ?? ''))
        setDeviceState('success')
        setOffline(false)
        setLastUpdated(new Date())
        try {
          localStorage.setItem(LS.devPrefix + debouncedCode, JSON.stringify(active))
        } catch {}
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return
        const msg = (cause as Error).message || 'Could not connect to the API.'
        if (devicesRef.current.length > 0 && msg !== 'Database code not found.') {
          setOffline(true) // keep showing cached numbers
        } else {
          setDevices([])
          setSelectedId('')
          setMessages([])
          setDeviceState('error')
          setError(msg)
        }
      }
    },
    [debouncedCode, prefsReady],
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
        setOffline(false)
        setLastUpdated(new Date())
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return
        setError((cause as Error).message || 'Could not load messages.')
        // keep what is on screen if we already had data, just flag reconnecting
        setMessageState((s) => {
          if (s === 'success') {
            setOffline(true)
            return s
          }
          return 'error'
        })
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

  // next number (prefers numbers not opened yet)
  const nextNumber = useCallback(() => {
    if (devices.length < 2) {
      toast('Only one number available')
      return
    }
    const i = Math.max(0, devices.findIndex((d) => d.client_id === selectedId))
    const order = [...devices.slice(i + 1), ...devices.slice(0, i)]
    const target = order.find((d) => !usedMap[dk(debouncedCode, d.client_id)]) ?? order[0]
    if (target) setSelectedId(target.client_id)
  }, [devices, selectedId, usedMap, debouncedCode])

  const clearCache = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sc:') && k !== LS.prefs)
        .forEach((k) => localStorage.removeItem(k))
    } catch {}
    setUsedMap({})
    setReadMap({})
    toast.success('Local cache cleared')
  }, [setUsedMap, setReadMap])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
        return
      }
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (k === 'r') refreshAll()
      else if (k === 'm') setPref('mono', !mono)
      else if (k === 'n') nextNumber()
      else if (k === 'c' && latestOtp) copyText(latestOtp, 'OTP copied').then((ok) => ok && latest && markRead(latest))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [refreshAll, latestOtp, latest, markRead, mono, nextNumber, setPref])

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

  const unreadCount = useMemo(() => messages.filter((m) => !isRead(m)).length, [messages, isRead])
  const usedCount = useMemo(() => devices.filter(isUsed).length, [devices, isUsed])
  const visibleDevices = useMemo(
    () => devices.filter((d) => (deviceFilter === 'all' ? true : deviceFilter === 'used' ? isUsed(d) : !isUsed(d))),
    [devices, deviceFilter, isUsed],
  )

  const avgBattery = useMemo(() => {
    const vals = devices.map((d) => Number(d.battery)).filter((n) => !Number.isNaN(n))
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }, [devices])

  const latestDate = latest ? parseDate(latest.dateTime) : null
  const age = latestDate ? now - latestDate.getTime() : null
  const isFresh = age !== null && age >= 0 && age < FRESH_WINDOW_MS
  const selectedIndex = devices.findIndex((d) => d.client_id === selectedId)

  const commands: Cmd[] = useMemo(
    () => [
      { id: 'refresh', label: 'Refresh now', hint: 'R', icon: <RefreshCw className="h-4 w-4" />, run: refreshAll },
      {
        id: 'copy', label: 'Copy latest OTP', hint: 'C', icon: <Copy className="h-4 w-4" />,
        run: () => (latestOtp ? copyText(latestOtp, 'OTP copied') : toast.error('No OTP to copy yet')),
      },
      { id: 'mono', label: mono ? 'Exit mono mode' : 'Enter mono mode', hint: 'M', icon: mono ? <LayoutGrid className="h-4 w-4" /> : <Focus className="h-4 w-4" />, run: () => setPref('mono', !mono) },
      { id: 'next', label: 'Next number', hint: 'N', icon: <SkipForward className="h-4 w-4" />, run: nextNumber },
      { id: 'readall', label: 'Mark all messages as read', icon: <Check className="h-4 w-4" />, run: () => markAllRead(messages) },
      { id: 'auto', label: `${autoRefresh ? 'Pause' : 'Resume'} live updates`, icon: <Activity className="h-4 w-4" />, run: () => setPref('autoRefresh', !autoRefresh) },
      { id: 'sound', label: `Turn sound ${sound ? 'off' : 'on'}`, icon: sound ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />, run: () => setPref('sound', !sound) },
      { id: 'autocopy', label: `Auto-copy new OTPs: ${autoCopy ? 'turn off' : 'turn on'}`, icon: <ClipboardCheck className="h-4 w-4" />, run: () => setPref('autoCopy', !autoCopy) },
      { id: 'plans', label: 'View private panel plans', icon: <Crown className="h-4 w-4" />, run: () => setPricingOpen(true) },
      { id: 'admin', label: `Contact admin ${ADMIN_USERNAME}`, icon: <User className="h-4 w-4" />, run: () => window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer') },
      { id: 'tg', label: 'Open Telegram channel', icon: <Send className="h-4 w-4" />, run: () => window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer') },
      { id: 'clear', label: 'Clear local cache (used numbers & read OTPs)', icon: <Trash2 className="h-4 w-4" />, run: clearCache },
      ...devices.map((d) => ({
        id: `dev-${d.client_id}`,
        label: `Switch to ${d.mobNo}${isUsed(d) ? ' (used)' : ''}`,
        icon: <Smartphone className="h-4 w-4" />,
        run: () => setSelectedId(d.client_id),
      })),
    ],
    [refreshAll, latestOtp, mono, autoRefresh, sound, autoCopy, devices, messages, nextNumber, markAllRead, clearCache, isUsed, setPref],
  )

  // ─── Sub-views ────────────────────────────────────────────────────────────
  const errorBox = (title: string) => (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
      <div className="mb-1 flex items-center gap-2 font-medium">
        <CircleAlert className="h-4 w-4" /> {title}
      </div>
      <p className="text-xs text-rose-200/80">{error}</p>
      <button type="button" onClick={refreshAll} className="mt-3 rounded-md border border-rose-400/40 px-3 py-1 text-xs text-rose-100 hover:bg-rose-500/20">
        Try again
      </button>
    </div>
  )

  const monoView = (
    <section className="a-rise mx-auto w-full max-w-xl space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        {!selectedDevice ? (
          deviceState === 'error' ? (
            errorBox('Connection failed')
          ) : deviceState === 'loading' ? (
            <div className="h-56 animate-pulse rounded-2xl bg-white/[0.04]" />
          ) : (
            <div className="py-14 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No active devices</p>
              <p className="mt-1 text-xs text-slate-500">Check the DB code above.</p>
            </div>
          )
        ) : (
          <div key={selectedDevice.client_id} className="a-swap">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-widest text-slate-500">
                  Number {selectedIndex + 1} of {devices.length}
                </p>
                <h2 className="mt-1 flex items-center gap-2 truncate text-2xl font-bold tracking-tight">
                  <Smartphone className="h-5 w-5 shrink-0 text-cyan-300" />
                  <button type="button" onClick={() => copyText(selectedDevice.mobNo, 'Number copied')} className="truncate transition hover:text-cyan-200" title="Tap to copy number">
                    {selectedDevice.mobNo}
                  </button>
                </h2>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">{selectedDevice.client_id}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <BatteryGlyph level={Number(selectedDevice.battery)} />
                  {Number.isNaN(Number(selectedDevice.battery)) ? '--' : `${selectedDevice.battery}%`}
                </span>
                {isUsed(selectedDevice) && usedMap[dk(debouncedCode, selectedDevice.client_id)]?.opens > 1 && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Used before</span>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${autoRefresh ? 'animate-ping' : ''}`} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {autoRefresh ? 'Listening for OTPs' : 'Live updates paused'}
              </span>
              <span>Latest 2 OTPs</span>
            </div>

            <div className="mt-3">
              {messageState === 'loading' && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              )}
              {messageState === 'error' && errorBox('Messages unavailable')}
              {messageState === 'success' && messages.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                  <MessageSquareText className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">Waiting for an OTP…</p>
                  <p className="mt-1 text-xs text-slate-500">Request the code now. It shows up here automatically.</p>
                </div>
              )}
              {messageState === 'success' && messages.length > 0 && (
                <ul className="space-y-3">
                  {messages.slice(0, 2).map((m) => (
                    <MessageCard key={m.id} item={m} read={isRead(m)} isNew={freshIds.includes(m.id)} now={now} big onCopy={handleCopy} onMarkRead={markRead} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={nextNumber}
          disabled={devices.length < 2}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(34,211,238,.6)] transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
        >
          <SkipForward className="h-4 w-4" />
          New number
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{Math.max(0, devices.length - usedCount)} fresh</span>
        </button>
        <button
          type="button"
          onClick={() => setPref('mono', false)}
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Full view</span>
        </button>
      </div>
    </section>
  )

  const fullView = (
    <>
      {/* Stats */}
      <div className="a-rise mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" style={{ animationDelay: '80ms' }}>
        {[
          { label: 'Active devices', value: devices.length, sub: `${usedCount} used`, icon: MonitorSmartphone, tone: 'text-cyan-300' },
          { label: 'Messages', value: messages.length, sub: `${unreadCount} unread`, icon: MessageSquareText, tone: 'text-fuchsia-300' },
          { label: 'Avg battery', value: avgBattery === null ? '--' : `${avgBattery}%`, sub: '', icon: BatteryCharging, tone: 'text-emerald-300' },
          { label: 'Last OTP', value: latest ? timeAgo(latest.dateTime, now) || '--' : '--', sub: '', icon: Clock3, tone: 'text-amber-300' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} onMouseMove={spotMove} className="spot overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition hover:border-white/20">
              <div className="flex items-center justify-between text-xs text-slate-400">
                {s.label}
                <Icon className={`h-4 w-4 ${s.tone}`} />
              </div>
              <p className="mt-2 flex items-baseline gap-2 text-2xl font-semibold tabular-nums tracking-tight">
                {s.value}
                {s.sub && <span className="text-[11px] font-normal text-slate-500">{s.sub}</span>}
              </p>
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
            {devices.length > 0 && (
              <div className="flex gap-1.5 border-b border-white/5 px-3 py-2">
                {(['all', 'new', 'used'] as DeviceFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDeviceFilter(f)}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize transition ${
                      deviceFilter === f ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f === 'new' ? `Unused (${devices.length - usedCount})` : f === 'used' ? `Used (${usedCount})` : 'All'}
                  </button>
                ))}
              </div>
            )}
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
              {deviceState === 'success' && devices.length > 0 && visibleDevices.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-500">Nothing in this filter.</p>
              )}
              {deviceState === 'success' && visibleDevices.length > 0 && (
                <ul className="divide-y divide-white/5">
                  {visibleDevices.map((d) => {
                    const battery = Number(d.battery)
                    const selected = d.client_id === selectedId
                    const used = isUsed(d)
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
                            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                              {d.mobNo}
                              {used && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 text-[9px] font-semibold text-amber-300">Used</span>}
                            </p>
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
              {deviceState === 'error' || offline ? <WifiOff className="h-3 w-3 text-rose-400" /> : <Wifi className="h-3 w-3 text-emerald-400" />}
              {deviceState === 'error' ? 'API offline' : offline ? 'Reconnecting…' : 'API online'}
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

          <AdminChip className="w-full justify-between [&>a]:flex-1" />
        </aside>

        {/* Main */}
        <section className="a-rise space-y-4" style={{ animationDelay: '200ms' }}>
          {/* Hero: latest OTP */}
          {selectedDevice && latest && latestOtp && (
            <div onMouseMove={spotMove} className={`spot relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/[0.09] via-white/[0.02] to-fuchsia-500/[0.07] p-5 backdrop-blur-xl sm:p-6 ${isRead(latest) ? 'opacity-80' : ''}`}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              {isRead(latest) && <span className="stamp stamp-lg" style={{ right: 24 }}>READ</span>}
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
                onClick={() => handleCopy(latest, latestOtp)}
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
                        cx="18" cy="18" r="15.9" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round"
                        pathLength={100} strokeDasharray="100"
                        style={{ animation: `ring ${POLL_MS / 1000}s linear forwards` }}
                      />
                    </svg>
                    <Zap className="absolute h-3 w-3 text-cyan-300" />
                  </span>
                )}
                <Switch on={autoRefresh} onChange={(v) => setPref('autoRefresh', v)} label="Live" />
                <Switch on={sound} onChange={(v) => setPref('sound', v)} label="Sound" />
                <Switch on={autoCopy} onChange={(v) => setPref('autoCopy', v)} label="Auto-copy" />
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
                          senderFilter === s ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
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
                  <span className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button type="button" onClick={() => markAllRead(messages)} className="inline-flex items-center gap-1 text-emerald-300/80 transition hover:text-emerald-300">
                        <Check className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                    <span className="tabular-nums">
                      {filtered.length}
                      {filtered.length !== messages.length ? ` of ${messages.length}` : ''} {messages.length === 1 ? 'message' : 'messages'}
                    </span>
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

              {messageState === 'error' && errorBox('Messages unavailable')}

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
                  {filtered.map((item) => (
                    <MessageCard key={item.id} item={item} read={isRead(item)} isNew={freshIds.includes(item.id)} now={now} onCopy={handleCopy} onMarkRead={markRead} />
                  ))}
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
              <span><kbd className="font-mono">M</kbd> mono</span>
              <span><kbd className="font-mono">N</kbd> next</span>
              <span><kbd className="font-mono">/</kbd> search</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Secure channel
            </span>
          </footer>
        </section>
      </div>
    </>
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
                Join {ADMIN_USERNAME}
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AdminChip className="hidden xl:inline-flex" />
            <button
              type="button"
              onClick={() => setPref('mono', !mono)}
              aria-pressed={mono}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${
                mono ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_-6px_rgba(34,211,238,.7)]' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200'
              }`}
            >
              {mono ? <LayoutGrid className="h-4 w-4" /> : <Focus className="h-4 w-4" />}
              {mono ? 'Full view' : 'Mono mode'}
            </button>
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200 md:inline-flex"
            >
              <CommandIcon className="h-3.5 w-3.5" />
              Quick actions
              <kbd className="rounded border border-white/10 px-1.5 font-mono text-[10px]">Ctrl K</kbd>
            </button>
            <input
              value={dbCode}
              onChange={(e) => setPref('dbCode', e.target.value)}
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

        {mono ? monoView : fullView}
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
      <TelegramPopup open={tgOpen && !pricingOpen && !cmdOpen} onClose={closeTg} />

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
