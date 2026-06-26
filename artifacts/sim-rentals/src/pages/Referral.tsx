import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Gift, Users2, Link2, ChevronRight, Share2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "@/components/Reveal";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalBonus: number;
  creditedCount: number;
  bonusAmount: number;
  minDepositAmount: number;
  referrals: { id: number; referredName: string; bonusAmount: number; credited: boolean; createdAt: string }[];
}

function CopyLinkBlock({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: ".65rem", fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Your Referral Link
        </span>
        <button
          onClick={copy}
          style={{
            marginLeft: "auto", flexShrink: 0,
            display: "flex", alignItems: "center", gap: 4,
            fontSize: ".72rem", fontWeight: 600,
            color: copied ? "#38bdf8" : "#9ca3af",
            background: "none", border: "none", cursor: "pointer",
            padding: "2px 6px", borderRadius: 6, transition: "color .15s",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{
        background: "#0b0e14",
        padding: "14px 18px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.11)",
        marginBottom: 10,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: ".82rem",
        lineHeight: 1.6,
        color: "#38bdf8",
        whiteSpace: "pre",
      }}>
        {url}
      </pre>
    </div>
  );
}

export default function Referral() {
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/referrals`, { credentials: "include" });
      if (res.ok) setData(await res.json() as ReferralData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const applyReferralCode = async () => {
    if (!applyCode.trim()) return;
    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/api/referrals/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: applyCode.trim() }),
      });
      const result = await res.json() as { success?: boolean; bonusAmount?: number; requiresDeposit?: boolean; minDepositAmount?: number; error?: string };
      if (!res.ok) {
        toast({ title: result.error ?? "Failed to apply code", variant: "destructive" });
      } else if (result.requiresDeposit && result.minDepositAmount) {
        toast({
          title: "Referral code applied!",
          description: `Deposit at least $${result.minDepositAmount.toFixed(2)} to unlock your $${(result.bonusAmount ?? 0).toFixed(2)} bonus.`,
        });
        setApplyCode("");
        await fetchReferrals();
      } else {
        toast({ title: "Referral applied!", description: `You both earned $${(result.bonusAmount ?? 0).toFixed(2)} credit.` });
        setApplyCode("");
        await fetchReferrals();
      }
    } catch {
      toast({ title: "Failed to apply referral code", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const referralUrl = data ? `${window.location.origin}/?ref=${data.referralCode}` : "";
  const bonus = data?.bonusAmount ?? 0.5;
  const minDeposit = data?.minDepositAmount ?? 0;
  const hasMinDeposit = minDeposit > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">

      <Reveal variant="up">
        <div>
          <h1 className="text-xl font-semibold text-white">Referral Program</h1>
          <p className="text-slate-500 mt-1.5 text-[14px]">
            Invite friends and earn ${bonus.toFixed(2)} credit for every referral.
            {hasMinDeposit && ` Reward unlocks after your friend deposits $${minDeposit.toFixed(2)}.`}
          </p>
        </div>
      </Reveal>

      {/* Stats banner */}
      <Reveal variant="up" delay={40}>
        <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.04] overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-sky-900/10">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Gift className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-white">
                Earn ${loading ? "..." : bonus.toFixed(2)} per referral
              </div>
              <div className="text-[12px] text-slate-500 mt-0.5">
                {hasMinDeposit
                  ? `Bonus credited once your friend deposits $${minDeposit.toFixed(2)} or more`
                  : "Both you and your friend get the bonus instantly when they sign up"}
              </div>
            </div>
            <span className="ml-auto text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/15 rounded-full px-3 py-1 shrink-0">
              ${loading ? "..." : bonus.toFixed(2)} each
            </span>
          </div>

          {loading ? (
            <div className="p-5 grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl bg-white/[0.04]" />)}
            </div>
          ) : data && (
            <div className="grid grid-cols-3">
              {[
                { label: "Total referrals", value: data.totalReferrals, icon: Users2, color: "text-sky-400" },
                { label: "Total earned",    value: `$${data.totalBonus.toFixed(2)}`, icon: Gift, color: "text-emerald-400" },
                { label: "Credited",        value: data.creditedCount, icon: Check, color: "text-slate-300" },
              ].map((s, i) => (
                <div key={s.label} className={`flex flex-col items-center gap-2 py-5 px-4 ${i < 2 ? "border-r border-sky-900/10" : ""}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <div className={`text-[22px] font-bold ${s.color} leading-none`}>{s.value}</div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold text-center">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* Deposit requirement notice */}
      {!loading && hasMinDeposit && (
        <Reveal variant="up" delay={55}>
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-sky-500/15 bg-sky-500/[0.04]">
            <AlertCircle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-semibold text-white mb-0.5">How to claim your reward</div>
              <div className="text-[12px] text-slate-400 leading-relaxed">
                After your friend signs up using your referral link, they must make a deposit of at least{" "}
                <span className="text-sky-300 font-semibold">${minDeposit.toFixed(2)}</span> to unlock the bonus.
                Once their deposit is confirmed, <span className="text-sky-300 font-semibold">${bonus.toFixed(2)}</span> credit is automatically added to both accounts — no manual action needed.
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Your referral link */}
      <Reveal variant="up" delay={80}>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.05]">
            <Link2 className="h-4 w-4 text-sky-400" />
            <span className="font-semibold text-white text-[14px]">Your Referral Link</span>
          </div>
          <div className="p-5 space-y-3">
            {loading ? (
              <Skeleton className="h-20 w-full rounded-xl bg-white/[0.04]" />
            ) : data ? (
              <>
                <CopyLinkBlock url={referralUrl} />
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: "Join SKY SMS",
                          text: `Rent phone numbers instantly for SMS verification. Use my referral link and we both get $${bonus.toFixed(2)} credit!`,
                          url: referralUrl,
                        });
                      } catch {
                        // user cancelled or not supported
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      height: 44,
                      borderRadius: 14,
                      border: "1px solid rgba(56,189,248,0.25)",
                      background: "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 55%, #0284c7 100%)",
                      boxShadow: "0 4px 0 0 #075985, 0 6px 20px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                      transition: "transform .1s, box-shadow .1s",
                    }}
                    onMouseDown={e => { e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 2px 0 0 #075985, 0 4px 12px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.25)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 0 0 #075985, 0 6px 20px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.25)"; }}
                  >
                    <Share2 style={{ width: 16, height: 16 }} />
                    Share via WhatsApp, Telegram, or SMS
                  </button>
                )}
              </>
            ) : (
              <p className="text-[13px] text-slate-500 text-center py-4">Could not load referral data</p>
            )}
          </div>
        </section>
      </Reveal>

      {/* Apply a code */}
      <Reveal variant="up" delay={110}>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.05]">
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-white text-[14px]">Have a Referral Code?</span>
          </div>
          <div className="p-5">
            <p className="text-[12.5px] text-slate-500 mb-3 leading-relaxed">
              Enter a friend's referral code below.
              {hasMinDeposit
                ? ` You'll both receive $${bonus.toFixed(2)} credit once you deposit at least $${minDeposit.toFixed(2)}.`
                : ` You'll both receive $${bonus.toFixed(2)} credit instantly.`}
            </p>
            <div className="flex gap-2">
              <input
                value={applyCode}
                onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                placeholder="SKY-XXXXXX"
                className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] font-mono text-white placeholder-slate-700 focus:outline-none focus:border-sky-500/35 transition-all"
                onKeyDown={(e) => e.key === "Enter" && applyReferralCode()}
                maxLength={12}
              />
              <button
                onClick={applyReferralCode}
                disabled={applying || !applyCode.trim()}
                style={{
                  height: 40,
                  padding: "0 20px",
                  borderRadius: 12,
                  background: "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 55%, #0284c7 100%)",
                  boxShadow: "0 3px 0 0 #075985, 0 4px 14px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: applying || !applyCode.trim() ? "not-allowed" : "pointer",
                  opacity: applying || !applyCode.trim() ? 0.45 : 1,
                  transition: "all .1s",
                  flexShrink: 0,
                }}
              >
                {applying ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Referral history */}
      {!loading && data && data.referrals.length > 0 && (
        <Reveal variant="up" delay={140}>
          <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.05]">
              <Users2 className="h-4 w-4 text-slate-400" />
              <span className="font-semibold text-white text-[14px]">Your Referrals</span>
              <span className="ml-auto text-[11px] text-slate-600">{data.referrals.length} total</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {data.referrals.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-6 py-4">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-sky-500/10 border border-sky-500/15 flex items-center justify-center">
                    <span className="text-[13px] font-bold text-sky-400">{r.referredName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white">{r.referredName}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{format(new Date(r.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[13px] font-bold text-emerald-400">+${r.bonusAmount.toFixed(2)}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.credited ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-sky-500/10 text-sky-400 border border-sky-500/15"}`}>
                      {r.credited ? "Credited" : hasMinDeposit ? "Awaiting deposit" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* How it works */}
      <Reveal variant="up" delay={170}>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/[0.05]">
            <Gift className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-white text-[14px]">How It Works</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { n: "01", t: "Share your link", d: "Copy your unique referral link and share it with friends, on social media, or anywhere you like." },
              { n: "02", t: "Friend signs up", d: "Your friend creates a free account using your referral link — no purchase needed yet." },
              {
                n: "03",
                t: hasMinDeposit ? "Friend makes a deposit" : "Both get credited",
                d: hasMinDeposit
                  ? `Your friend must deposit at least $${minDeposit.toFixed(2)}. The reward is then automatically credited to both accounts — no claiming needed.`
                  : `Once your friend signs up with your link, you both automatically receive $${bonus.toFixed(2)} credit.`,
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-4 items-start p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <div className="text-[2rem] font-bold leading-none select-none shrink-0 font-mono w-10"
                  style={{ color: "rgba(14,165,233,0.18)" }}
                >{step.n}</div>
                <div>
                  <div className="text-[13.5px] font-bold text-white mb-1">{step.t}</div>
                  <div className="text-[12px] text-slate-500 leading-relaxed">{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
