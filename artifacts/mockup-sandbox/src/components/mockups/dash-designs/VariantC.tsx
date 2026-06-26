export function VariantC() {
  return (
    <div className="min-h-screen flex" style={{ background: "#020c0a", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 260, background: "#031209", borderRight: "1px solid rgba(6,214,160,0.1)", flexShrink: 0 }} className="flex flex-col">

        {/* Logo */}
        <div style={{ padding: "22px 18px 20px" }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(6,214,160,0.12)",
              border: "1px solid rgba(6,214,160,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(6,214,160,0.15)"
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#06d6a0" strokeWidth="2.3">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>SKY SMS</div>
              <div style={{ fontSize: 9, color: "#06d6a0", fontWeight: 600, letterSpacing: "0.15em", marginTop: 2, opacity: 0.7 }}>PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{ margin: "0 14px 16px", display: "flex", alignItems: "center", gap: 8, background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.2)", borderRadius: 999, padding: "7px 14px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#06d6a0" }} />
          <span style={{ fontSize: 11, color: "#06d6a0", fontWeight: 600 }}>2 active rentals</span>
        </div>

        {/* Balance */}
        <div style={{ margin: "0 14px 16px", borderRadius: 14, padding: "18px 18px", border: "1px solid rgba(6,214,160,0.15)", background: "linear-gradient(135deg, rgba(6,214,160,0.06), transparent)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(6,214,160,0.08)", filter: "blur(24px)" }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(6,214,160,0.5)", letterSpacing: "0.18em", marginBottom: 10 }}>YOUR BALANCE</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>$24.50</div>
          <div style={{ marginTop: 12, fontSize: 11, color: "#06d6a0", fontWeight: 600 }}>Top up →</div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 14px 16px" }}>
          <button style={{
            width: "100%", height: 42, borderRadius: 999, border: "none",
            background: "#06d6a0",
            color: "#031209", fontSize: 13, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 4px 24px rgba(6,214,160,0.25)",
            letterSpacing: "-0.01em"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Rent a Number
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 10px", overflow: "hidden" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em", padding: "0 8px 10px" }}>NAVIGATION</div>
          {[
            { label: "Dashboard", active: true },
            { label: "Rent Number", active: false },
            { label: "My Rentals", active: false },
            { label: "Payments", active: false },
            { label: "Referral", active: false },
            { label: "API", active: false },
            { label: "Support", active: false },
            { label: "Settings", active: false },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px",
              borderRadius: 10, marginBottom: 3, cursor: "pointer",
              background: item.active ? "rgba(6,214,160,0.1)" : "transparent",
              border: `1px solid ${item.active ? "rgba(6,214,160,0.2)" : "transparent"}`,
              color: item.active ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 13, fontWeight: item.active ? 600 : 500,
            }}>
              {item.label}
              {item.active && <span style={{ fontSize: 10, background: "rgba(6,214,160,0.15)", color: "#06d6a0", padding: "1px 7px", borderRadius: 999, fontWeight: 700 }}>Now</span>}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(6,214,160,0.15)", border: "1px solid rgba(6,214,160,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#06d6a0" }}>J</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>John Doe</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>john@example.com</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "36px 44px", overflow: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1.05, margin: 0 }}>
            Hey, John 👋
          </h1>
          <p style={{ marginTop: 10, color: "rgba(255,255,255,0.35)", fontSize: 15 }}>Here's your SMS rental overview.</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Balance", value: "$24.50", sub: "Top up", color: "#06d6a0", active: true },
            { label: "Active", value: "2", sub: "Live now", color: "#06d6a0", pulse: true, active: false },
            { label: "Completed", value: "47", sub: "Total", color: "rgba(255,255,255,0.4)", active: false },
            { label: "SMS", value: "31", sub: "Captured", color: "rgba(255,255,255,0.4)", active: false },
          ].map((s) => (
            <div key={s.label} style={{
              borderRadius: 14, padding: "20px 20px",
              background: s.active ? "rgba(6,214,160,0.07)" : "rgba(255,255,255,0.025)",
              border: s.active ? "1px solid rgba(6,214,160,0.2)" : "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer"
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
                {s.pulse && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#06d6a0" }} />}
              </div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Rentals */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Recent Rentals</div>
            <div style={{ fontSize: 12, color: "#06d6a0", fontWeight: 600, cursor: "pointer" }}>View all →</div>
          </div>
          {[
            { svc: "Telegram", num: "+1 (555) 234-7890", status: "Active", sc: "#06d6a0", bg: "rgba(6,214,160,0.1)", time: "2:34" },
            { svc: "WhatsApp", num: "+44 7700 900123", status: "SMS ✓", sc: "#06d6a0", bg: "rgba(6,214,160,0.1)", time: "7:12" },
            { svc: "Google", num: "+1 (555) 187-2345", status: "Done", sc: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", time: "Jun 18" },
            { svc: "Discord", num: "+49 1512 3456789", status: "Expired", sc: "rgba(255,255,255,0.2)", bg: "rgba(255,255,255,0.04)", time: "Jun 17" },
          ].map((r) => (
            <div key={r.num} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                {r.svc === "Telegram" ? "✈" : r.svc === "WhatsApp" ? "💬" : r.svc === "Google" ? "G" : "🎮"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.svc}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, fontFamily: "monospace" }}>{r.num}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: r.sc, background: r.bg, padding: "3px 10px", borderRadius: 999 }}>{r.status}</span>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{r.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Rent Now", sub: "Get a number", teal: true },
            { label: "Add Funds", sub: "Top up balance", teal: false },
            { label: "My Rentals", sub: "View history", teal: false },
            { label: "Support", sub: "Get help", teal: false },
          ].map((a) => (
            <div key={a.label} style={{
              borderRadius: 12, padding: "16px 18px", cursor: "pointer",
              border: a.teal ? "1px solid rgba(6,214,160,0.25)" : "1px solid rgba(255,255,255,0.07)",
              background: a.teal ? "rgba(6,214,160,0.08)" : "rgba(255,255,255,0.025)"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: a.teal ? "#06d6a0" : "rgba(255,255,255,0.3)" }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
