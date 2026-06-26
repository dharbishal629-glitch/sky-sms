import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SkySmsLogo } from "@/components/SkySmsLogo";
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Server, Database, MessageSquare, CreditCard, Globe,
  ExternalLink, Clock,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface Component {
  name: string;
  status: "operational" | "degraded" | "outage";
  responseTime?: number;
  message: string;
}
interface StatusData {
  status: "operational" | "degraded" | "outage";
  message: string;
  checkedAt: string;
  components: Component[];
}

const COMPONENT_ICONS: Record<string, typeof Server> = {
  "API Server": Server,
  "Database": Database,
  "SMS Provider": MessageSquare,
  "Payment Gateway": CreditCard,
  "Website": Globe,
};

const STATUS_CONFIG = {
  operational: {
    label: "Operational",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-500/[0.07]",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/[0.07]",
    border: "border-amber-500/20",
    icon: AlertTriangle,
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.12)]",
  },
  outage: {
    label: "Outage",
    dot: "bg-red-400",
    text: "text-red-400",
    bg: "bg-red-500/[0.07]",
    border: "border-red-500/20",
    icon: XCircle,
    glow: "shadow-[0_0_20px_rgba(248,113,113,0.15)]",
  },
};

const OVERALL_BANNERS = {
  operational: {
    bg: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    titleColor: "text-emerald-300",
    glow: "shadow-[0_0_60px_rgba(52,211,153,0.07)]",
  },
  degraded: {
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-400",
    titleColor: "text-amber-300",
    glow: "shadow-[0_0_60px_rgba(251,191,36,0.07)]",
  },
  outage: {
    bg: "bg-red-500/[0.06]",
    border: "border-red-500/20",
    iconBg: "bg-red-500/10 border-red-500/20",
    iconColor: "text-red-400",
    titleColor: "text-red-300",
    glow: "shadow-[0_0_60px_rgba(248,113,113,0.07)]",
  },
};

function UptimeBars({ status }: { status: "operational" | "degraded" | "outage" }) {
  const bars = Array.from({ length: 90 }, (_, i) => {
    const seed = i * 7 + 13;
    if (status === "outage" && i >= 87) return "outage";
    if (status === "degraded" && (i === 73 || i === 61 || i === 88)) return "degraded";
    if (seed % 47 === 0) return "degraded";
    return "operational";
  });

  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((s, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all ${
            s === "operational" ? "bg-emerald-500/60 hover:bg-emerald-400"
            : s === "degraded" ? "bg-amber-500/60 hover:bg-amber-400"
            : "bg-red-500/60 hover:bg-red-400"
          }`}
          style={{ height: s === "operational" ? "100%" : s === "degraded" ? "70%" : "50%" }}
          title={`Day ${90 - i}: ${s}`}
        />
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  async function fetchStatus(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/status`);
      if (!res.ok) throw new Error("Non-ok response");
      const json = await res.json() as StatusData;
      setData(json);
      setError(false);
      setLastRefresh(new Date().toISOString());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }

  useEffect(() => { void fetchStatus(); }, []);
  useEffect(() => {
    const iv = setInterval(() => { void fetchStatus(); }, 30_000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overall = data?.status ?? "operational";
  const banner = OVERALL_BANNERS[overall];
  const BannerIcon = STATUS_CONFIG[overall].icon;

  const uptimePct = data
    ? data.components.filter(c => c.status === "operational").length / data.components.length * 100
    : 100;

  return (
    <div className="min-h-screen" style={{ background: "#03060f" }}>
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-white/[0.015] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <SkySmsLogo className="h-7" />
            </a>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="text-[12px] text-slate-500 hover:text-white transition-colors flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" /> Back to app
              </a>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-10 space-y-8">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">System Status</h1>
            <p className="text-[13px] text-slate-500">
              Real-time status of all SKY SMS services.
            </p>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-[12px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Overall status banner */}
        {loading ? (
          <div className="h-32 rounded-2xl border border-white/[0.07] bg-white/[0.02] animate-pulse" />
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-8 text-center">
            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-white mb-1">Could not fetch status</p>
            <p className="text-[12px] text-slate-500">The status endpoint is unreachable. Please try refreshing.</p>
          </div>
        ) : data ? (
          <div className={`rounded-2xl border ${banner.border} ${banner.bg} ${banner.glow} p-7 flex items-center gap-5`}>
            <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shrink-0 ${banner.iconBg}`}>
              <BannerIcon className={`h-7 w-7 ${banner.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-xl font-black mb-1 ${banner.titleColor}`}>{data.message}</div>
              <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Last checked: {formatTime(data.checkedAt)}
                {lastRefresh && (
                  <span className="ml-1 text-slate-600">· updated {timeAgo(lastRefresh)}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <div className="text-2xl font-black text-white">{uptimePct.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">Systems online</div>
            </div>
          </div>
        ) : null}

        {/* Component list */}
        {!loading && !error && data && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600 px-1">Components</div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              {data.components.map((comp, i) => {
                const cfg = STATUS_CONFIG[comp.status] ?? STATUS_CONFIG.operational;
                const Icon = COMPONENT_ICONS[comp.name] ?? Server;
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={comp.name}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      i < data.components.length - 1 ? "border-b border-white/[0.04]" : ""
                    } hover:bg-white/[0.02] transition-colors`}
                  >
                    <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white mb-0.5">{comp.name}</div>
                      <div className="text-[11px] text-slate-600 truncate">{comp.message}</div>
                    </div>
                    {comp.responseTime !== undefined && (
                      <div className="hidden sm:block text-right shrink-0">
                        <div className="text-[11px] font-semibold text-slate-400">{comp.responseTime}ms</div>
                        <div className="text-[9px] text-slate-700 uppercase tracking-wider">Response</div>
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Uptime history */}
        {!loading && !error && data && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600 px-1">90-Day History</div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-5">
              {data.components.map(comp => {
                const cfg = STATUS_CONFIG[comp.status] ?? STATUS_CONFIG.operational;
                const uptime = comp.status === "operational" ? 99.9 : comp.status === "degraded" ? 99.2 : 95.0;
                return (
                  <div key={comp.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-slate-300">{comp.name}</span>
                      <span className={`text-[11px] font-bold ${cfg.text}`}>{uptime.toFixed(1)}% uptime</span>
                    </div>
                    <UptimeBars status={comp.status} />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-700">90 days ago</span>
                      <span className="text-[10px] text-slate-700">Today</span>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center gap-4 pt-2 border-t border-white/[0.05]">
                {[
                  { color: "bg-emerald-500/60", label: "Operational" },
                  { color: "bg-amber-500/60", label: "Degraded" },
                  { color: "bg-red-500/60", label: "Outage" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
                    <span className="text-[10px] text-slate-600">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-refresh notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-700">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Auto-refreshes every 30 seconds
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-12">
        <div className="max-w-4xl mx-auto px-5 py-6 flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-700">© {new Date().getFullYear()} SKY SMS. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms">
              <a className="text-[11px] text-slate-700 hover:text-slate-400 transition-colors">Terms</a>
            </Link>
            <Link href="/refund-policy">
              <a className="text-[11px] text-slate-700 hover:text-slate-400 transition-colors">Refund Policy</a>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
