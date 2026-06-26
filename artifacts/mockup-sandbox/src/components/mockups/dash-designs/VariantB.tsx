export function VariantB() {
  return (
    <div className="min-h-screen flex" style={{ background: "#03060f", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 256, background: "#050a19", borderRight: "1px solid rgba(59,130,246,0.12)", flexShrink: 0 }} className="flex flex-col">

        {/* Logo */}
        <div style={{ padding: "22px 18px 18px" }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "#1d4ed8",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(59,130,246,0.35)"
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}>SKY SMS</div>
          </div>
        </div>

        {/* Balance Card */}
        <div style={{ margin: "0 12px 14px", borderRadius: 12, padding: "16px 16px", border: "1px solid rgba(59,130,246,0.2)", background: "rgba(59,130,246,0.06)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -16, right: -16, width: 70, height: 70, borderRadius: "50%", background: "rgba(59,130,246,0.12)", filter: "blur(20px)" }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(59,130,246,0.7)", letterSpacing: "0.18em", marginBottom: 8 }}>BALANCE</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>$24.50</div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#60a5fa", fontWeight: 600, cursor: "pointer" }}>+ Add funds</div>
        </div>

        {/* CTA */}
        <div style={{ padding: "0 12px 14px" }}>
          <button style={{
            width: "100%", height: 40, borderRadius: 9, border: "none",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
            letterSpacing: "-0.01em"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            Rent a Number
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 8px", overflow: "hidden" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", letterSpacing: "0.2em", padding: "0 8px 8px" }}>MENU</div>
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
              display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
              borderRadius: 8, marginBottom: 2, cursor: "pointer",
              background: item.active ? "rgba(59,130,246,0.12)" : "transparent",
              borderLeft: item.active ? "2px solid #3b82f6" : "2px solid transparent",
              color: item.active ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 13, fontWeight: item.active ? 600 : 500,
            }}>
              {item.label}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>J</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>John Doe</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>john@example.com</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "40px 44px", overflow: "auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1.05, margin: 0 }}>
            Welcome back,{" "}
            <span style={{ color: "#3b82f6" }}>John.</span>
          </h1>
          <p style={{ marginTop: 10, color: "rgba(255,255,255,0.35)", fontSize: 15, fontWeight: 400 }}>Your SMS rentals dashboard.</p>
        </div>

        {/* Stats — horizontal row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Balance", value: "$24.50", sub: "→ Add funds", accent: "#3b82f6" },
            { label: "Active Rentals", value: "2", sub: "Live now", accent: "#3b82f6", pulse: true },
            { label: "Completed", value: "47", sub: "All time", accent: "#3b82f6" },
            { label: "SMS Received", value: "31", sub: "Codes captured", accent: "#3b82f6" },
          ].map((s) => (
            <div key={s.label} style={{
              borderRadius: 14, padding: "22px 20px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              transition: "border-color 0.15s"
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>{s.value}</div>
                {s.pulse && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6" }} />}
              </div>
              <div style={{ fontSize: 11, color: s.accent, fontWeight: 600, marginTop: 8 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Rentals table */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Recent Rentals</div>
            <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, cursor: "pointer" }}>View all →</div>
          </div>
          {/* table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px", padding: "8px 24px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(255,255,255,0.015)" }}>
            <span>Service</span><span>Number</span><span>Status</span><span style={{ textAlign: "right" }}>Time</span>
          </div>
          {[
            { svc: "Telegram", num: "+1 (555) 234-7890", status: "Active", sc: "#3b82f6", time: "2:34" },
            { svc: "WhatsApp", num: "+44 7700 900123", status: "SMS Received", sc: "#22c55e", time: "7:12" },
            { svc: "Google", num: "+1 (555) 187-2345", status: "Completed", sc: "rgba(255,255,255,0.3)", time: "Jun 18" },
            { svc: "Discord", num: "+49 1512 3456789", status: "Expired", sc: "rgba(255,255,255,0.2)", time: "Jun 17" },
          ].map((r) => (
            <div key={r.num} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px", padding: "13px 24px", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.svc}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{r.num}</div>
              <div><span style={{ fontSize: 10, fontWeight: 700, color: r.sc, border: `1px solid ${r.sc}30`, background: `${r.sc}12`, padding: "2px 8px", borderRadius: 999 }}>{r.status}</span></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "right", fontFamily: "monospace" }}>{r.time}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Rent Now", sub: "Get a number instantly" },
            { label: "Add Funds", sub: "Top up your balance" },
            { label: "History", sub: "View all past rentals" },
            { label: "Support", sub: "Chat with the team" },
          ].map((a, i) => (
            <div key={a.label} style={{ borderRadius: 12, padding: "16px 18px", cursor: "pointer", border: i === 0 ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.07)", background: i === 0 ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.025)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: i === 0 ? "#60a5fa" : "rgba(255,255,255,0.3)" }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
