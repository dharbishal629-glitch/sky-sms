import { useState } from "react";
import { Copy, Check } from "lucide-react";

const BASE = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}/api`
  : "/api";

const C = {
  bg:       "#050914",
  bg2:      "#0d1120",
  surface:  "#0a0e1a",
  panel:    "#0d1120",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.10)",
  textMid:  "#6b7280",
  text:     "#e2e8f0",
  code:     "#d1d5db",
  preBg:    "#060a18",
  sky:      "#38bdf8",
  skyDim:   "rgba(14,165,233,0.10)",
  skyBorder:"rgba(14,165,233,0.20)",
};

const NAV = [
  { id: "overview",  label: "Overview" },
  { id: "services",  label: "Services" },
  { id: "countries", label: "Countries" },
  { id: "rentals",   label: "Rentals" },
  { id: "account",   label: "Account" },
  { id: "errors",    label: "Error Codes" },
];

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text.replace(/\$BASE_URL/g, BASE));
        setOk(true);
        setTimeout(() => setOk(false), 2000);
      }}
      style={{
        marginLeft: "auto",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: ".72rem",
        fontWeight: 700,
        color: ok ? "#34d399" : C.textMid,
        background: ok ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${ok ? "rgba(52,211,153,0.25)" : C.borderHi}`,
        cursor: "pointer",
        padding: "3px 9px",
        borderRadius: 7,
        transition: "all .15s",
      }}
    >
      {ok ? <Check size={11} /> : <Copy size={11} />}
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function Block({ label, children, copyText }: { label: string; children: React.ReactNode; copyText?: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontSize: ".65rem", fontWeight: 800, color: C.textMid,
          textTransform: "uppercase" as const, letterSpacing: "0.12em",
        }}>
          {label}
        </span>
        {copyText !== undefined && <CopyBtn text={copyText} />}
      </div>
      <pre style={{
        background: C.preBg,
        padding: "14px 18px",
        borderRadius: 12,
        border: `1px solid ${C.borderHi}`,
        marginBottom: 10,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch" as const,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: ".82rem",
        lineHeight: 1.6,
        color: C.code,
        whiteSpace: "pre" as const,
      }}>
        {children}
      </pre>
    </div>
  );
}

const METHOD_STYLES: Record<string, { color: string; bg: string; shadow: string; border: string }> = {
  GET:    { color: "#38bdf8", bg: "linear-gradient(180deg,#0ea5e9 0%,#0284c7 100%)",   shadow: "0 3px 0 0 #075985, 0 4px 12px rgba(14,165,233,0.4), inset 0 1px 0 rgba(255,255,255,0.25)", border: "rgba(56,189,248,0.3)" },
  POST:   { color: "#34d399", bg: "linear-gradient(180deg,#10b981 0%,#059669 100%)",   shadow: "0 3px 0 0 #047857, 0 4px 12px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",  border: "rgba(52,211,153,0.3)" },
  DELETE: { color: "#f87171", bg: "linear-gradient(180deg,#ef4444 0%,#dc2626 100%)",   shadow: "0 3px 0 0 #991b1b, 0 4px 12px rgba(248,113,113,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",  border: "rgba(248,113,113,0.3)" },
  PATCH:  { color: "#fb923c", bg: "linear-gradient(180deg,#f97316 0%,#ea580c 100%)",   shadow: "0 3px 0 0 #9a3412, 0 4px 12px rgba(251,146,60,0.35),  inset 0 1px 0 rgba(255,255,255,0.2)",  border: "rgba(251,146,60,0.3)" },
};

function Method({ m }: { m: "GET"|"POST"|"DELETE"|"PATCH" }) {
  const s = METHOD_STYLES[m];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 12px",
      borderRadius: 8,
      fontSize: ".75rem",
      fontWeight: 800,
      fontFamily: "monospace",
      letterSpacing: ".06em",
      color: "#fff",
      background: s.bg,
      boxShadow: s.shadow,
      border: `1px solid ${s.border}`,
      flexShrink: 0,
      userSelect: "none" as const,
    }}>{m}</span>
  );
}

function Endpoint({
  method, path, note, payload, response, curl,
}: {
  method: "GET"|"POST"|"DELETE"|"PATCH";
  path: string;
  note: string;
  payload?: string;
  response: string;
  curl: string;
}) {
  return (
    <>
      <div style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: C.bg2,
        border: `1px solid ${C.borderHi}`,
        borderRadius: 12,
        padding: 14,
        margin: "12px 0",
        fontFamily: "'JetBrains Mono', monospace",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        whiteSpace: "nowrap",
      }}>
        <Method m={method} />
        <span style={{ fontSize: ".84rem", color: C.sky, fontFamily: "monospace" }}>{path}</span>
      </div>
      <div style={{ fontSize: ".88rem", color: C.textMid, margin: "8px 0 14px", lineHeight: 1.6 }}>{note}</div>
      <Block label="Payload" copyText={payload ?? "No request body."}>{payload ?? "No request body."}</Block>
      <Block label="Response" copyText={response}>{response}</Block>
      <Block label="cURL" copyText={curl}>{curl}</Block>
    </>
  );
}

const SECTIONS = [
  {
    id: "services", title: "Services",
    endpoints: [
      {
        method: "GET" as const,
        path: "/api/catalog/services",
        note: "Returns all available SMS services with pricing and categories.",
        response: JSON.stringify({ services: [{ code: "telegram", name: "Telegram", price: 0.15, category: "messaging" }] }, null, 2),
        curl: `curl "$BASE_URL/catalog/services" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
    ],
  },
  {
    id: "countries", title: "Countries",
    endpoints: [
      {
        method: "GET" as const,
        path: "/api/catalog/countries-for-service",
        note: "Returns available countries with live stock for a given service.",
        response: JSON.stringify({ countries: [{ code: "us", name: "United States", available: 4820, price: 0.15 }] }, null, 2),
        curl: `curl "$BASE_URL/catalog/countries-for-service?serviceCode=telegram" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
      {
        method: "GET" as const,
        path: "/api/catalog/availability",
        note: "Real-time availability and price for a service + country combination.",
        response: JSON.stringify({ available: 4820, price: 0.15, estimatedWait: "instant" }, null, 2),
        curl: `curl "$BASE_URL/catalog/availability?serviceCode=telegram&countryCode=us" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
    ],
  },
  {
    id: "rentals", title: "Rentals",
    endpoints: [
      {
        method: "POST" as const,
        path: "/api/rentals",
        note: "Create a rental. Deducts balance and allocates a phone number. Active for 20 minutes.",
        payload: JSON.stringify({ serviceCode: "telegram", countryCode: "us" }, null, 2),
        response: JSON.stringify({ id: "rnt_01J2K4P8", serviceName: "Telegram", phoneNumber: "14158675309", status: "active", price: 0.15, expiresAt: "2026-05-04T10:50:00Z" }, null, 2),
        curl: `curl -X POST "$BASE_URL/rentals" \\\n  -H "X-API-Key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"serviceCode":"telegram","countryCode":"us"}'`,
      },
      {
        method: "GET" as const,
        path: "/api/rentals",
        note: "List your rentals, paginated. Filter by status: active, expired, cancelled.",
        response: JSON.stringify({ rentals: [{ id: "rnt_01J2K4P8", serviceName: "Telegram", status: "active" }], total: 1 }, null, 2),
        curl: `curl "$BASE_URL/rentals?status=active&page=1" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
      {
        method: "GET" as const,
        path: "/api/rentals/:id",
        note: "Get a single rental with all received SMS messages.",
        response: JSON.stringify({ id: "rnt_01J2K4P8", status: "sms_received", messages: [{ body: "Your code: 481624", code: "481624" }] }, null, 2),
        curl: `curl "$BASE_URL/rentals/rnt_01J2K4P8" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
      {
        method: "POST" as const,
        path: "/api/rentals/:id/refresh",
        note: "Manually poll for new SMS messages on an active rental.",
        response: JSON.stringify({ id: "rnt_01J2K4P8", status: "active", messages: [] }, null, 2),
        curl: `curl -X POST "$BASE_URL/rentals/rnt_01J2K4P8/refresh" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
      {
        method: "POST" as const,
        path: "/api/rentals/:id/cancel",
        note: "Cancel an active rental. Full refund if cancelled within the free window.",
        response: JSON.stringify({ id: "rnt_01J2K4P8", status: "cancelled", refunded: true, refundAmount: 0.15 }, null, 2),
        curl: `curl -X POST "$BASE_URL/rentals/rnt_01J2K4P8/cancel" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
    ],
  },
  {
    id: "account", title: "Account",
    endpoints: [
      {
        method: "GET" as const,
        path: "/api/me",
        note: "Returns your account information, balance, and current role.",
        response: JSON.stringify({ id: "usr_01J2K4P8", name: "John Doe", email: "john@example.com", credits: 12.50, role: "user" }, null, 2),
        curl: `curl "$BASE_URL/me" \\\n  -H "X-API-Key: YOUR_KEY"`,
      },
    ],
  },
];

const ERROR_ROWS = [
  { code: "200", label: "OK",               color: "#34d399", desc: "Success." },
  { code: "400", label: "Bad Request",      color: "#fb923c", desc: "Missing or invalid parameters." },
  { code: "401", label: "Unauthorized",     color: "#f87171", desc: "Invalid or missing API key." },
  { code: "402", label: "Payment Required", color: "#fb923c", desc: "Insufficient balance." },
  { code: "404", label: "Not Found",        color: "#f87171", desc: "Resource does not exist." },
  { code: "409", label: "Conflict",         color: "#fb923c", desc: "No numbers available right now." },
  { code: "429", label: "Rate Limited",     color: "#fb923c", desc: "60 requests per minute limit exceeded." },
  { code: "500", label: "Server Error",     color: "#f87171", desc: "Internal error — contact support." },
];

export default function ApiDocs() {
  const [active, setActive] = useState("overview");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: "calc(100vh - 56px)", gap: 0 }}
      className="docs-app-grid"
    >
      {/* Sidebar */}
      <aside style={{
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        padding: "20px 14px",
        position: "sticky",
        top: 56,
        height: "calc(100vh - 56px)",
        overflowY: "auto",
      }}
        className="docs-sidebar"
      >
        <div style={{ fontSize: ".62rem", fontWeight: 800, color: C.textMid, textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 12, paddingLeft: 10 }}>
          Navigation
        </div>
        {NAV.map(n => (
          <a
            key={n.id}
            href={`#${n.id}`}
            onClick={() => setActive(n.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              color: active === n.id ? C.sky : C.textMid,
              background: active === n.id ? C.skyDim : "none",
              border: active === n.id ? `1px solid ${C.skyBorder}` : "1px solid transparent",
              textDecoration: "none",
              fontSize: ".84rem",
              fontWeight: active === n.id ? 700 : 400,
              marginBottom: 2,
              transition: "all .15s",
            }}
          >
            {active === n.id && (
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.sky, flexShrink: 0 }} />
            )}
            {n.label}
          </a>
        ))}
      </aside>

      {/* Main content */}
      <main style={{ padding: 34, overflowX: "hidden" }} className="docs-viewer">

        {/* Overview */}
        <section id="overview" style={{
          background: C.panel,
          border: `1px solid ${C.skyBorder}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 0 40px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at 50% -20%, rgba(14,165,233,0.08) 0%, transparent 65%)",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: ".65rem", fontWeight: 800, color: C.sky, textTransform: "uppercase", letterSpacing: ".18em", marginBottom: 10 }}>
              Public API
            </div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: C.text, margin: "0 0 10px", lineHeight: 1.15,
              background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              SKY SMS API
            </h1>
            <p style={{ fontSize: ".9rem", color: C.textMid, margin: "0 0 16px" }}>
              Full REST API for renting numbers, polling SMS, and managing your account. All responses are JSON.
            </p>
            <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none" }}>
              {[
                ["Number rental", "allocate temporary phone numbers instantly."],
                ["SMS polling", "receive verification codes in real time."],
                ["Service catalog", "list all supported apps and countries."],
                ["Account management", "balance and API key operations."],
              ].map(([bold, rest]) => (
                <li key={bold} style={{ fontSize: ".88rem", color: C.textMid, marginBottom: 6, display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.sky, flexShrink: 0, marginTop: 6 }} />
                  <span><span style={{ color: "#e2e8f0", fontWeight: 600 }}>{bold}</span>{" "}{rest}</span>
                </li>
              ))}
            </ul>
            <div style={{
              background: C.bg2,
              border: `1px solid ${C.borderHi}`,
              borderRadius: 12,
              padding: "14px 18px",
              fontSize: ".84rem",
              color: C.textMid,
              lineHeight: 1.7,
            }}>
              <strong style={{ color: C.text }}>Authentication:</strong> Every request requires an{" "}
              <code style={{ background: C.preBg, padding: "2px 7px", borderRadius: 5, fontFamily: "monospace", fontSize: ".8rem", color: C.sky }}>X-API-Key</code>{" "}
              header. Generate yours in <strong style={{ color: C.text }}>Settings → API Keys</strong>.
              <br />
              <strong style={{ color: C.text }}>Rate limit:</strong> 60 requests / minute. Exceeding returns{" "}
              <code style={{ background: C.preBg, padding: "2px 7px", borderRadius: 5, fontFamily: "monospace", fontSize: ".8rem", color: "#fb923c" }}>429</code>.
              <br />
              <strong style={{ color: C.text }}>Base URL:</strong>{" "}
              <code style={{ background: C.preBg, padding: "2px 7px", borderRadius: 5, fontFamily: "monospace", fontSize: ".8rem", color: C.sky }}>{BASE}</code>
            </div>
          </div>
        </section>

        {/* Endpoint sections */}
        {SECTIONS.map(sec => (
          <section key={sec.id} id={sec.id} style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 22,
            marginBottom: 20,
            boxShadow: "0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(180deg, #38bdf8, #2563eb)", display: "inline-block", flexShrink: 0 }} />
              {sec.title}
            </h2>
            {sec.endpoints.map((ep, i) => (
              <div key={i} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : "none", paddingTop: i > 0 ? 20 : 0, marginTop: i > 0 ? 20 : 0 }}>
                <Endpoint {...ep} />
              </div>
            ))}
          </section>
        ))}

        {/* Error codes */}
        <section id="errors" style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 22,
          marginBottom: 20,
          boxShadow: "0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(180deg, #38bdf8, #2563eb)", display: "inline-block", flexShrink: 0 }} />
            Error Codes
          </h2>
          <div style={{ borderRadius: 12, border: `1px solid ${C.borderHi}`, overflow: "hidden" }}>
            {ERROR_ROWS.map((row, i) => (
              <div key={row.code} style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "11px 16px",
                borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                background: i % 2 === 0 ? C.bg2 : C.surface,
              }}>
                <span style={{
                  fontFamily: "monospace", fontWeight: 800, fontSize: ".84rem",
                  color: "#fff",
                  background: `${row.color}22`,
                  border: `1px solid ${row.color}44`,
                  padding: "2px 8px",
                  borderRadius: 6,
                  minWidth: 44,
                  textAlign: "center" as const,
                  flexShrink: 0,
                }}>{row.code}</span>
                <span style={{ fontSize: ".84rem", fontWeight: 600, color: C.text, width: 130, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: ".82rem", color: C.textMid }}>{row.desc}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      <style>{`
        @media (max-width: 900px) {
          .docs-app-grid { grid-template-columns: 1fr !important; }
          .docs-sidebar { display: none !important; }
          .docs-viewer { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
