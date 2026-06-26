export function VariantA() {
  return (
    <div className="min-h-screen flex" style={{ background: "#040711", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 260, background: "#060b18", borderRight: "1px solid rgba(245,158,11,0.1)", flexShrink: 0 }} className="flex flex-col">

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px" }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(245,158,11,0.15)"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>SKY SMS</div>
              <div style={{ fontSize: 10, color: "rgba(245,158,11,0.5)", fontWeight: 600, letterSpacing: "0.12em", marginTop: 2 }}>PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div style={{ margin: "0 14px 16px", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(245,158,11,0.18)", background: "linear-gradient(135deg, rgba(245,158,11,0.07), rgba(245,158,11,0.02))", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(245,158,11,0.06)", filter: "blur(20px)" }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,158,11,0.5)", letterSpacing: "0.18em", marginBottom: 8 }}>YOUR BALANCE</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>$24.50</div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b", fontWeight: 600, cursor: "pointer" }}>
            Add funds <span>→</span>
          </div>
        </div>

        {/* Rent CTA */}
        <div style={{ padding: "0 14px 14px" }}>
          <button style={{
            width: "100%", height: 40, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#0a0a0a", fontSize: 13, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            letterSpacing: "-0.01em"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Rent a Number
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 10px", overflow: "hidden" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.18)", letterSpacing: "0.2em", padding: "0 8px 8px" }}>NAVIGATION</div>
          {[
            { icon: "⊞", label: "Dashboard", active: true },
            { icon: "☎", label: "Rent Number", active: false },
            { icon: "◷", label: "My Rentals", active: false },
            { icon: "💳", label: "Payments", active: false },
            { icon: "⎇", label: "Referral", active: false },
            { icon: "⌥", label: "API", active: false },
            { icon: "❓", label: "Support", active: false },
            { icon: "⚙", label: "Settings", active: false },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
              borderRadius: 9, marginBottom: 2, cursor: "pointer",
              background: item.active ? "linear-gradient(90deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))" : "transparent",
              border: `1px solid ${item.active ? "rgba(245,158,11,0.2)" : "transparent"}`,
              color: item.active ? "#fff" : "rgba(255,255,255,0.38)",
              fontSize: 13, fontWeight: item.active ? 600 : 500,
              transition: "all 0.15s"
            }}>
              <span style={{ fontSize: 14, color: item.active ? "#f59e0b" : "rgba(255,255,255,0.2)", width: 16, textAlign: "center" }}>{item.icon}</span>
              {item.label}
              {item.active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", opacity: 0.8 }} />}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.1))", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>J</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>John Doe</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>john@example.com</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "36px 40px", overflow: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "rgba(245,158,11,0.6)", fontWeight: 700, letterSpacing: "0.16em", marginBottom: 8 }}>GOOD MORNING</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1, margin: 0 }}>
            Welcome back, <span style={{ background: "linear-gradient(135deg, #ffd875, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>John</span>
          </h1>
          <p style={{ marginTop: 8, color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Here's what's happening with your account today.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Balance", value: "$24.50", sub: "Add funds →", color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
            { label: "Active", value: "2", sub: "Live now", color: "#34d399", glow: "rgba(52,211,153,0.1)", pulse: true },
            { label: "Completed", value: "47", sub: "Total done", color: "#60a5fa", glow: "rgba(96,165,250,0.1)" },
            { label: "SMS", value: "31", sub: "Codes captured", color: "#a78bfa", glow: "rgba(167,139,250,0.1)" },
          ].map((stat) => (
            <div key={stat.label} style={{
              borderRadius: 14, padding: "20px 20px 18px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative", overflow: "hidden", cursor: "pointer"
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: stat.glow, filter: "blur(24px)" }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.18em", marginBottom: 12 }}>{stat.label.toUpperCase()}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>{stat.value}</div>
                {stat.pulse && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />}
              </div>
              <div style={{ fontSize: 11, color: stat.color, fontWeight: 600 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent Rentals */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Recent Rentals</div>
            <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, cursor: "pointer" }}>View all →</div>
          </div>
          {[
            { svc: "Telegram", num: "+1 (555) 234-7890", status: "Active", statusColor: "#34d399", statusBg: "rgba(52,211,153,0.1)", country: "United States", time: "2:34" },
            { svc: "WhatsApp", num: "+44 7700 900123", status: "SMS ✓", statusColor: "#34d399", statusBg: "rgba(52,211,153,0.1)", country: "United Kingdom", time: "7:12" },
            { svc: "Google", num: "+1 (555) 187-2345", status: "Completed", statusColor: "rgba(255,255,255,0.4)", statusBg: "rgba(255,255,255,0.06)", country: "Canada", time: "Jun 18" },
            { svc: "Discord", num: "+49 1512 3456789", status: "Expired", statusColor: "rgba(255,255,255,0.25)", statusBg: "rgba(255,255,255,0.04)", country: "Germany", time: "Jun 18" },
          ].map((r) => (
            <div key={r.num} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 22px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {r.svc === "Telegram" ? "✈" : r.svc === "WhatsApp" ? "💬" : r.svc === "Google" ? "G" : "🎮"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.svc}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{r.num} · {r.country}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.statusColor, background: r.statusBg, padding: "3px 9px", borderRadius: 999 }}>{r.status}</span>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{r.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Rent Now", sub: "Get a number", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
            { label: "Add Funds", sub: "Top up balance", color: "#34d399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.18)" },
            { label: "My Rentals", sub: "View history", color: "#60a5fa", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.18)" },
            { label: "Support", sub: "Get help", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)" },
          ].map((a) => (
            <div key={a.label} style={{ borderRadius: 13, border: `1px solid ${a.border}`, background: a.bg, padding: "16px 18px", cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: a.color }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
