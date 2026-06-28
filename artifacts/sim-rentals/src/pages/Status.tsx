import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { SkySmsLogo } from "@/components/SkySmsLogo";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface Component { name: string; status: "operational" | "degraded" | "outage" }
interface Incident {
  id: string; title: string; body: string; status: string;
  components: string[]; created_at: string; resolved_at: string | null;
  updates: Array<{ id: string; body: string; status: string; created_at: string }>;
}
interface MetricDay { day: string; avg_ms: number; max_ms: number }
interface StatusData {
  status: "operational" | "degraded" | "outage";
  message: string; checkedAt: string; components: Component[];
}

const BANNER = {
  operational: { bg: "#1b9e3e", text: "All Systems Operational" },
  degraded:    { bg: "#c27c0e", text: "Degraded Performance"   },
  outage:      { bg: "#b42a2a", text: "Major Outage"           },
};

const STATUS_COLOR = {
  operational: "#1b9e3e",
  degraded:    "#c27c0e",
  outage:      "#b42a2a",
};

const INC_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified:    "Identified",
  monitoring:    "Monitoring",
  resolved:      "Resolved",
  update:        "Update",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// Generate 90 uptime bars. Incidents may mark specific days as degraded.
function UptimeBars({
  status, incidents, component,
}: { status: string; incidents: Incident[]; component: string }) {
  const now = Date.now();
  const DAY = 86_400_000;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; label: string; s: string } | null>(null);

  const bars = Array.from({ length: 90 }, (_, i) => {
    const dayStart = now - (89 - i) * DAY;
    const dayEnd   = dayStart + DAY;
    // Check if any incident overlaps this day for this component
    const hit = incidents.find(inc => {
      if (inc.components.length && !inc.components.includes(component)) return false;
      const created = new Date(inc.created_at).getTime();
      const resolved = inc.resolved_at ? new Date(inc.resolved_at).getTime() : now;
      return created < dayEnd && resolved > dayStart;
    });
    const s = hit
      ? (hit.status === "identified" ? "outage" : "degraded")
      : (i === 89 ? status : "operational");
    const date = new Date(dayStart);
    const label = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    return { s, label };
  });

  const upCount = bars.filter(b => b.s === "operational").length;
  const uptimePct = ((upCount / 90) * 100).toFixed(2);

  return (
    <div className="relative">
      <div className="flex items-end gap-[2px] h-7">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex-1 cursor-default"
            style={{
              height: "100%",
              backgroundColor:
                bar.s === "operational" ? "#1b9e3e" :
                bar.s === "degraded"    ? "#c27c0e" : "#b42a2a",
              borderRadius: 1,
              opacity: 0.85,
            }}
            onMouseEnter={e => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const parent = (e.target as HTMLElement).closest(".uptime-wrap")!.getBoundingClientRect();
              setTooltip({ x: rect.left - parent.left + rect.width / 2, label: bar.label, s: bar.s });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {tooltip && (
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: tooltip.x,
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            padding: "6px 10px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>{tooltip.label}</div>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: tooltip.s === "operational" ? "#1b9e3e" : tooltip.s === "degraded" ? "#c27c0e" : "#b42a2a",
          }}>
            {tooltip.s === "operational" ? "No downtime recorded." : tooltip.s === "degraded" ? "Degraded performance." : "Outage recorded."}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#666" }}>
        <span>90 days ago</span>
        <span style={{ color: STATUS_COLOR[status as keyof typeof STATUS_COLOR] ?? "#1b9e3e" }}>
          {uptimePct}% uptime
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}

// Simple SVG line chart
function ResponseChart({ metrics, period }: { metrics: MetricDay[]; period: "day" | "week" | "month" }) {
  const data = period === "day"
    ? metrics.slice(-1)
    : period === "week"
    ? metrics.slice(-7)
    : metrics;

  const latest = metrics[metrics.length - 1];
  const latestMs = latest?.avg_ms ?? 0;

  if (data.length < 2) {
    return (
      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#555" }}>Not enough data yet. Check back after more status checks.</span>
      </div>
    );
  }

  const vals = data.map(d => d.avg_ms);
  const maxV = Math.max(...vals, 1);
  const W = 600; const H = 80;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - (v / maxV) * H * 0.85;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const labels = data.map(d => fmtShort(d.day));
  const step = Math.max(1, Math.floor(labels.length / 5));
  const shownLabels = labels.map((l, i) => (i % step === 0 || i === labels.length - 1) ? l : "");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>API Response Time</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{latestMs} ms</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80, overflow: "visible" }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" points={pts} />
        <polygon
          fill="url(#chartGrad)"
          points={`0,${H} ${pts} ${W},${H}`}
        />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {shownLabels.map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: "#555", minWidth: 0, textAlign: "center" }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// Group incidents by date label for past incidents section
function groupIncidentsByDate(incidents: Incident[]) {
  const map: Record<string, Incident[]> = {};
  incidents.forEach(inc => {
    const d = new Date(inc.created_at).toDateString();
    if (!map[d]) map[d] = [];
    map[d].push(inc);
  });
  return map;
}

export default function StatusPage() {
  const [data, setData]         = useState<StatusData | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics]   = useState<MetricDay[]>([]);
  const [loading, setLoading]   = useState(true);
  const [checking, setChecking] = useState(false);
  const [secsLeft, setSecsLeft] = useState(30);
  const [period, setPeriod]     = useState<"day" | "week" | "month">("week");
  const lastLoadRef = useRef<number>(Date.now());

  async function load() {
    setChecking(true);
    try {
      const [sRes, iRes, mRes] = await Promise.all([
        fetch(`${API_URL}/api/status`),
        fetch(`${API_URL}/api/status/incidents`),
        fetch(`${API_URL}/api/status/metrics`),
      ]);
      if (sRes.ok) setData(await sRes.json() as StatusData);
      if (iRes.ok) { const j = await iRes.json() as { incidents: Incident[] }; setIncidents(j.incidents ?? []); }
      if (mRes.ok) { const j = await mRes.json() as { metrics: MetricDay[] }; setMetrics(j.metrics ?? []); }
    } finally {
      setChecking(false);
      setLoading(false);
      lastLoadRef.current = Date.now();
      setSecsLeft(30);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { const iv = setInterval(() => void load(), 30_000); return () => clearInterval(iv); }, []);

  // Countdown ticks every second
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastLoadRef.current) / 1000);
      setSecsLeft(Math.max(0, 30 - elapsed));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const overall = data?.status ?? "operational";
  const banner  = BANNER[overall];

  // Past 14 days for the incidents section
  const pastDays: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    pastDays.push(d.toDateString());
  }
  const incByDate = groupIncidentsByDate(incidents);

  const s: React.CSSProperties = {
    fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
    background: "#03060f",
    color: "#e2e8f0",
    minHeight: "100vh",
  };

  return (
    <div style={s}>
      {/* Banner */}
      <div style={{ background: banner.bg, padding: "14px 20px", textAlign: "center" }}>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{banner.text}</span>
      </div>

      {/* Nav */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, background: "rgba(255,255,255,0.015)",
      }}>
        <Link href="/">
          <a style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <SkySmsLogo size="sm" />
          </a>
        </Link>
        <Link href="/">
          <a style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>← Back to app</a>
        </Link>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 20px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>SKY SMS Status</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            {checking ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#38bdf8" }}>
                <span style={{
                  display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                  background: "#38bdf8", animation: "pulse 1s ease-in-out infinite",
                }} />
                Checking…
              </span>
            ) : data ? (
              <span style={{ fontSize: 11, color: "#475569" }}>
                Last checked: {fmt(data.checkedAt)}
              </span>
            ) : null}
            {!checking && (
              <span style={{ fontSize: 11, color: "#334155" }}>
                · Next check in {secsLeft}s
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#475569", fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            {/* Components / uptime bars */}
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
              Uptime over the past 90 days.
            </p>
            <div style={{
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 36,
            }}>
              {(data?.components ?? []).map((comp, i) => (
                <div
                  key={comp.name}
                  className="uptime-wrap"
                  style={{
                    padding: "16px 20px",
                    borderBottom: i < (data?.components.length ?? 0) - 1
                      ? "1px solid rgba(255,255,255,0.07)"
                      : "none",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{comp.name}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: STATUS_COLOR[comp.status] ?? "#1b9e3e",
                    }}>
                      {comp.status === "operational" ? "Operational"
                        : comp.status === "degraded" ? "Degraded Performance"
                        : "Major Outage"}
                    </span>
                  </div>
                  <UptimeBars status={comp.status} incidents={incidents} component={comp.name} />
                </div>
              ))}
            </div>

            {/* System Metrics */}
            <div style={{ marginBottom: 36 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase" }}>
                  System Metrics
                </span>
                <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: 2 }}>
                  {(["day", "week", "month"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      style={{
                        padding: "3px 12px", borderRadius: 4, fontSize: 12, border: "none", cursor: "pointer",
                        background: period === p ? "rgba(255,255,255,0.12)" : "transparent",
                        color: period === p ? "#e2e8f0" : "#64748b",
                        fontWeight: period === p ? 600 : 400,
                        transition: "all 0.15s",
                      }}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 8, padding: "16px 20px",
              }}>
                <ResponseChart metrics={metrics} period={period} />
              </div>
            </div>

            {/* Past Incidents */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase" }}>
                Past Incidents
              </span>

              {[...pastDays].reverse().map(dayStr => {
                const dayIncidents = incByDate[dayStr] ?? [];
                const dateLabel = fmtDate(new Date(dayStr).toISOString());
                return (
                  <div key={dayStr} style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                      {dateLabel}
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 10 }} />
                    {dayIncidents.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                        {dayStr === new Date().toDateString() ? "No incidents reported today." : "No incidents reported."}
                      </p>
                    ) : dayIncidents.map(inc => (
                      <div key={inc.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: inc.status === "resolved" ? "#1b9e3e"
                              : inc.status === "identified" ? "#b42a2a" : "#c27c0e",
                            textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>
                            {INC_LABELS[inc.status] ?? inc.status}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{inc.title}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px" }}>{inc.body}</p>
                        {inc.components.length > 0 && (
                          <p style={{ fontSize: 11, color: "#475569", margin: "0 0 4px" }}>
                            Affected: {inc.components.join(", ")}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>{fmt(inc.created_at)}</p>
                        {inc.updates.length > 0 && (
                          <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
                            {inc.updates.map(u => (
                              <div key={u.id} style={{ marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                  {INC_LABELS[u.status] ?? u.status}
                                </span>
                                <span style={{ fontSize: 11, color: "#475569", marginLeft: 6 }}>{fmt(u.created_at)}</span>
                                <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>{u.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 780, margin: "0 auto",
      }}>
        <span style={{ fontSize: 11, color: "#334155" }}>© {new Date().getFullYear()} SKY SMS</span>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/terms"><a style={{ fontSize: 11, color: "#334155", textDecoration: "none" }}>Terms</a></Link>
          <Link href="/refund-policy"><a style={{ fontSize: 11, color: "#334155", textDecoration: "none" }}>Refund Policy</a></Link>
        </div>
      </div>
    </div>
  );
}
