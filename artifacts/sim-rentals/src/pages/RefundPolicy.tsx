import { AlertTriangle, CheckCircle2, XCircle, ChevronRight, RefreshCw, Clock } from "lucide-react";
import { SkySmsLogo } from "@/components/SkySmsLogo";
import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";

const autoRefundCases = [
  {
    icon: Clock,
    title: "Window Expired — No SMS",
    desc: "If the 20-minute activation window expires and no SMS was delivered to your rented number, a full refund is automatically credited to your balance."
  },
  {
    icon: RefreshCw,
    title: "Cancelled Before Window Closes",
    desc: "If you cancel an active rental before the 20-minute window expires and no SMS was received, the full rental cost is instantly returned to your balance."
  },
];

const noRefundCases = [
  "Payments processed for adding funds to your account balance",
  "Rentals where an SMS was successfully delivered",
  "Voluntary account closures or terminations due to policy violations",
  "Cryptocurrency transactions that have been confirmed on-chain",
  "Funds spent on rentals that were not cancelled within the active window",
];

const faqs = [
  {
    q: "How long do refunds take?",
    a: "Automatic refunds to your account balance are instant — they appear immediately after the rental is cancelled or the window expires. There is no waiting period."
  },
  {
    q: "Can I get a refund if the number didn't work?",
    a: "If the number expired without receiving an SMS, you are automatically refunded. If you received an SMS but the code was rejected by the platform, this is outside our control and no refund is issued."
  },
  {
    q: "What happens to my balance if I stop using the service?",
    a: "Your balance remains in your account indefinitely. We do not expire or remove unused balances. However, once funds are added, they cannot be cashed out."
  },
  {
    q: "Are crypto payments refundable?",
    a: "No. Cryptocurrency payments are irreversible by nature. Once a top-up payment is confirmed on-chain and credited to your account, it cannot be reversed or refunded under any circumstances."
  },
  {
    q: "What if I'm charged incorrectly?",
    a: "If you believe there's been a billing error, contact our support team within 7 days of the transaction with details. We will investigate and resolve legitimate disputes."
  },
];

export default function RefundPolicy() {
  return (
    <div className="min-h-screen premium-shell text-white">
      <header className="sticky top-4 z-50 mx-auto flex max-w-6xl justify-center px-4">
        <div className="glass-card flex h-14 w-full items-center justify-between rounded-full px-5 neon-border">
          <Link href="/">
            <span className="flex items-center gap-2 font-black text-base cursor-pointer">
              <SkySmsLogo size="sm" />
            </span>
          </Link>
          <Link href="/">
            <span className="text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
              ← Back to Home
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <Reveal variant="up">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-5 w-fit rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
              Legal
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white mb-4">Refund Policy</h1>
            <p className="text-slate-400 text-sm">Last updated: April 2026</p>
          </div>
        </Reveal>

        {/* Critical Notice */}
        <Reveal variant="up" delay={60}>
          <div className="glass-card rounded-2xl p-6 mb-8 border border-red-400/30 bg-red-400/[0.05]">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-400/15 border border-red-300/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="font-black text-white text-lg mb-2">No Refunds on Payments</div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  <strong className="text-white">Once a payment has been processed for adding funds to your account, no refund is provided under any circumstances.</strong> Cryptocurrency transactions are irreversible by nature. Please ensure you intend to use the service before making any payment.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Auto Refund Cases */}
        <Reveal variant="up" delay={80}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-8 rounded-xl bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white">When You Get an Automatic Refund</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {autoRefundCases.map((item, i) => (
                <Reveal key={i} variant="up" delay={i * 60}>
                  <div className="glass-card rounded-2xl p-5 border border-emerald-400/15 bg-emerald-400/[0.04] h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-white text-sm">{item.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* No Refund Cases */}
        <Reveal variant="up" delay={120}>
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-8 w-8 rounded-xl bg-red-400/15 border border-red-300/20 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <h2 className="text-xl font-black text-white">No Refunds For</h2>
            </div>
            <ul className="space-y-3">
              {noRefundCases.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                  <XCircle className="h-4 w-4 text-red-400/70 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* How it works */}
        <Reveal variant="up" delay={140}>
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-black text-white mb-5">How Automatic Refunds Work</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Rent a number", desc: "Pay from your account balance to activate a number for 20 minutes." },
                { step: "2", title: "Wait for SMS or cancel", desc: "If no SMS arrives and you cancel, or the window expires — the refund triggers automatically." },
                { step: "3", title: "Balance restored instantly", desc: "The exact amount you paid for that rental is returned to your account balance with no delay." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="h-8 w-8 rounded-full bg-amber-400/15 border border-amber-300/20 flex items-center justify-center shrink-0 font-black text-amber-400 text-sm">
                    {item.step}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal variant="up" delay={160}>
          <div className="mb-8">
            <h2 className="text-xl font-black text-white mb-5">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="glass-card rounded-2xl p-5">
                  <h3 className="font-bold text-white text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal variant="up" delay={180}>
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Have a question not covered here? Contact our support team from your account dashboard.
            </p>
            <Link href="/terms">
              <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold hover:text-amber-300 transition-colors cursor-pointer">
                View Terms of Service <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </Reveal>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center text-xs text-slate-700">
          © {new Date().getFullYear()} SKY SMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
