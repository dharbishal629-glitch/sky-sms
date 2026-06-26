import { useEffect, useRef, useState } from "react";
import { UserPlus, Wallet, Smartphone, MessageSquare, Check } from "lucide-react";

const PALETTE: Record<string, { accent: string; bg: string; text: string; border: string }> = {
  blue:    { accent: "bg-blue-500",    bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  violet:  { accent: "bg-violet-500",  bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20" },
  sky:     { accent: "bg-sky-400",     bg: "bg-sky-400/10",     text: "text-sky-400",     border: "border-sky-400/20" },
  emerald: { accent: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

function SignUpMockup() {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const email = "you@example.com";
  useEffect(() => {
    let i = 0;
    setTyped("");
    setDone(false);
    const t = setInterval(() => {
      if (i < email.length) { setTyped(email.slice(0, i + 1)); i++; }
      else { setDone(true); clearInterval(t); }
    }, 60);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#070c1a] p-4 w-full select-none">
      <div className="text-[10px] font-bold text-white mb-3 text-center">Sign in to SKY SMS</div>
      <div className="h-8 rounded-xl border border-white/[0.1] bg-white/[0.03] flex items-center px-3 mb-2.5">
        <span className="text-[10.5px] text-slate-400 font-mono">{typed}<span className={`inline-block w-0.5 h-2.5 bg-blue-400 ml-0.5 ${done ? "opacity-0" : "animate-pulse"}`} /></span>
      </div>
      <div className={`h-7 rounded-xl text-[10.5px] font-bold flex items-center justify-center transition-all duration-500 ${done ? "bg-blue-600 text-white" : "bg-white/[0.05] text-slate-600"}`}>
        {done ? <><Check className="h-3 w-3 mr-1" />Continue</> : "Continue →"}
      </div>
      <div className="mt-2.5 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 text-[9.5px] text-slate-500">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </div>
      </div>
    </div>
  );
}

function WalletMockup() {
  const [amount, setAmount] = useState(0);
  const target = 10;
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += 0.25;
      if (v >= target) { setAmount(target); clearInterval(t); }
      else setAmount(v);
    }, 30);
    return () => clearInterval(t);
  }, []);
  const pct = Math.min(100, (amount / target) * 100);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#070c1a] p-4 w-full select-none">
      <div className="text-[9.5px] text-slate-500 mb-1">Current Balance</div>
      <div className="text-[22px] font-black text-white mb-3 font-mono tabular-nums">${amount.toFixed(2)}</div>
      <div className="h-1.5 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-100" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {["BTC", "ETH", "USDT"].map((c, i) => (
          <div key={c} className={`rounded-xl border p-2 text-center ${i === 2 ? "border-violet-500/30 bg-violet-500/10" : "border-white/[0.06] bg-white/[0.02]"}`}>
            <div className="text-[9px] font-bold text-slate-400">{c}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RentMockup() {
  const [step, setStep] = useState(0);
  const countries = ["🇷🇺 Russia", "🇬🇧 UK", "🇺🇸 USA"];
  const [country, setCountry] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => { setCountry(c => (c + 1) % countries.length); setStep(3); }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#070c1a] p-4 w-full select-none">
      <div className="text-[9.5px] text-slate-500 mb-2.5">Pick your setup</div>
      <div className={`h-7 rounded-xl border mb-2 flex items-center px-3 transition-all duration-300 ${step >= 1 ? "border-sky-500/30 bg-sky-500/10" : "border-white/[0.06] bg-white/[0.03]"}`}>
        <span className="text-[10.5px] font-semibold">{step >= 1 ? "📱 Telegram" : <span className="text-slate-600">Select service…</span>}</span>
      </div>
      <div className={`h-7 rounded-xl border mb-3 flex items-center px-3 transition-all duration-300 ${step >= 2 ? "border-sky-500/30 bg-sky-500/10" : "border-white/[0.06] bg-white/[0.03]"}`}>
        <span className="text-[10.5px] font-semibold">{step >= 2 ? countries[country] : <span className="text-slate-600">Select country…</span>}</span>
      </div>
      <div className={`h-8 rounded-xl text-[10.5px] font-bold flex items-center justify-center transition-all duration-500 ${step >= 2 ? "bg-sky-500 text-white shadow-[0_0_16px_rgba(56,189,248,0.3)]" : "bg-white/[0.05] text-slate-600"}`}>
        {step >= 3 ? "✓ Number rented!" : "Rent number →"}
      </div>
    </div>
  );
}

function SmsMockup() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = "847291";
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 700);
    return () => clearTimeout(t);
  }, []);
  const handleCopy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#070c1a] p-4 w-full select-none">
      <div className="text-[9.5px] text-slate-500 mb-2.5">Incoming SMS</div>
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2.5 mb-3">
        <div className="text-[9px] text-slate-600 mb-1">+1 234 567 8901</div>
        <div className={`text-[10.5px] text-slate-300 transition-all duration-500 ${show ? "opacity-100" : "opacity-0"}`}>
          Your Telegram code: <span className="font-black text-white font-mono">{code}</span>
        </div>
      </div>
      {show ? (
        <button onClick={handleCopy} className={`w-full h-7 rounded-xl text-[10.5px] font-bold transition-all duration-300 ${copied ? "bg-emerald-500 text-white" : "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25"}`}>
          {copied ? "✓ Copied!" : `Copy ${code}`}
        </button>
      ) : (
        <div className="h-7 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
      )}
    </div>
  );
}

const STEPS = [
  { number: "01", icon: UserPlus,     title: "Create account",   desc: "Sign in with Google — no verification required.", color: "blue",    mockup: <SignUpMockup /> },
  { number: "02", icon: Wallet,       title: "Add credits",      desc: "Top up with Bitcoin, USDT, ETH, or 30+ other coins.", color: "violet", mockup: <WalletMockup /> },
  { number: "03", icon: Smartphone,   title: "Rent a number",    desc: "Pick a service and country. Get a real number instantly.", color: "sky",   mockup: <RentMockup /> },
  { number: "04", icon: MessageSquare, title: "Receive your code", desc: "SMS code appears on the dashboard. Copy and verify.", color: "emerald", mockup: <SmsMockup /> },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
            How It Works
          </div>
          <h2 className="text-[2.2rem] sm:text-[2.8rem] font-black text-white tracking-tight leading-tight">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">minutes</span>
          </h2>
          <p className="mt-4 text-[15px] text-slate-400 max-w-md mx-auto">
            No apps to install, no contracts to sign. Four simple steps and you're done.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STEPS.map((step) => {
            const p = PALETTE[step.color];
            return (
              <div key={step.number} className={`rounded-2xl border ${p.border} bg-white/[0.02] p-5 flex flex-col gap-4`}>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${p.bg} ${p.border}`}>
                    <step.icon className={`h-4 w-4 ${p.text}`} />
                  </div>
                  <div>
                    <div className={`text-[10px] font-black tracking-widest uppercase mb-0.5 ${p.text}`}>{step.number}</div>
                    <div className="text-[13.5px] font-bold text-white">{step.title}</div>
                  </div>
                </div>
                <p className="text-[12.5px] text-slate-400 leading-relaxed">{step.desc}</p>
                <div className="rounded-xl overflow-hidden">
                  {step.mockup}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
