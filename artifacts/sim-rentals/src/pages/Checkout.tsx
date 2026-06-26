import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, AlertCircle, Tag, CheckCircle2, X, Lock,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface CheckoutSession {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface CouponInfo {
  code: string;
  type: "percentage" | "fixed";
  value: number;
}

const COINS = [
  { coin: "BTC",  label: "Bitcoin",  logo: "https://assets.coincap.io/assets/icons/btc@2x.png" },
  { coin: "ETH",  label: "Ethereum", logo: "https://assets.coincap.io/assets/icons/eth@2x.png" },
  { coin: "USDT", label: "Tether",   logo: "https://assets.coincap.io/assets/icons/usdt@2x.png" },
  { coin: "SOL",  label: "Solana",   logo: "https://assets.coincap.io/assets/icons/sol@2x.png" },
  { coin: "LTC",  label: "Litecoin", logo: "https://assets.coincap.io/assets/icons/ltc@2x.png" },
  { coin: "BNB",  label: "BNB",      logo: "https://assets.coincap.io/assets/icons/bnb@2x.png" },
  { coin: "XRP",  label: "XRP",      logo: "https://assets.coincap.io/assets/icons/xrp@2x.png" },
  { coin: "DOGE", label: "Doge",     logo: "https://assets.coincap.io/assets/icons/doge@2x.png" },
];

export default function Checkout() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [paying, setPaying] = useState(false);

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useQuery<CheckoutSession>({
    queryKey: ["checkout-session", sessionId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/payments/checkout-session/${sessionId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Checkout session not found or expired.");
      }
      return res.json() as Promise<CheckoutSession>;
    },
    retry: false,
  });

  const amount = session?.amount ?? 0;
  const discount = coupon
    ? coupon.type === "percentage"
      ? Number((amount * (coupon.value / 100)).toFixed(2))
      : Math.min(coupon.value, amount)
    : 0;
  const charged = Number(Math.max(amount - discount, 0.01).toFixed(2));

  const validateCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponValidating(true);
    setCouponError(null);
    setCoupon(null);
    try {
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as CouponInfo & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid coupon code.");
      setCoupon(data);
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally { setCouponValidating(false); }
  };

  const handlePay = async () => {
    if (!session || paying) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/checkout`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: session.amount, currency: session.currency, couponCode: coupon?.code ?? null, coin: selectedCoin ?? undefined }),
      });
      const data = await res.json() as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Failed to create payment.");
      window.open(data.checkoutUrl, "_blank");
      toast({ title: "Opening payment", description: `Redirecting to OxaPay for $${charged.toFixed(2)}.` });
      setTimeout(() => setLocation("/payments"), 1200);
    } catch (err: unknown) {
      toast({ title: "Payment failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally { setPaying(false); }
  };

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-7 w-7 text-sky-400 animate-spin" />
        <p className="text-[13px] text-slate-500">Loading checkout…</p>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-[16px] font-bold text-white mb-2">Checkout Expired</h2>
        <p className="text-[13px] text-slate-500 mb-6">
          {sessionError instanceof Error ? sessionError.message : "This checkout link is invalid or expired."}
        </p>
        <button onClick={() => setLocation("/payments")} className="h-11 px-6 rounded-xl bg-white text-[13px] font-bold text-[#0d1117] hover:bg-white/90 transition-all">
          Back to Payments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-10 page-enter">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/payments")} className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] transition-all">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-[16px] font-bold text-white">Top up balance</h1>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Secure checkout via OxaPay
          </p>
        </div>
      </div>

      {/* Order summary */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <span className="text-[13px] font-semibold text-white">Order Summary</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-400">Top-up amount</span>
            <span className="text-[15px] font-bold text-white">${amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-slate-400">Credits you receive</span>
            <span className="text-[13px] font-semibold text-emerald-400">+${amount.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-emerald-400 flex items-center gap-1.5"><Tag className="h-3 w-3" /> Coupon discount</span>
              <span className="text-[13px] font-bold text-emerald-400">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[13px] font-bold text-white">You pay</span>
            <div className="flex items-center gap-2">
              {discount > 0 && <span className="text-[12px] text-slate-600 line-through">${amount.toFixed(2)}</span>}
              <span className="text-[24px] font-black text-white">${charged.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[12px] font-semibold text-slate-400">Coupon Code</span>
          <span className="text-[11px] text-slate-700 ml-1">optional</span>
        </div>
        {coupon ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-mono font-bold text-emerald-300 text-[13px]">{coupon.code}</span>
              <span className="text-[11px] text-emerald-500 ml-2">
                {coupon.type === "percentage" ? `${coupon.value}% off` : `$${coupon.value.toFixed(2)} off`}
              </span>
            </div>
            <button onClick={() => { setCoupon(null); setCouponInput(""); setCouponError(null); }} className="text-slate-600 hover:text-red-400 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                onKeyDown={e => e.key === "Enter" && validateCoupon()}
                className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] font-mono text-white placeholder:text-slate-700 outline-none focus:border-white/[0.18] transition-all"
              />
              <button onClick={validateCoupon} disabled={!couponInput.trim() || couponValidating} className="h-10 px-4 rounded-xl border border-white/[0.09] bg-white/[0.04] text-[12px] font-semibold text-white hover:bg-white/[0.08] transition-all disabled:opacity-40 flex items-center gap-2 shrink-0">
                {couponValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
              </button>
            </div>
            {couponError && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-400">
                <AlertCircle className="h-3 w-3 shrink-0" /> {couponError}
              </div>
            )}
          </>
        )}
      </div>

      {/* Coin Selector */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-semibold text-slate-400">Preferred Coin</span>
          <span className="text-[11px] text-slate-700">optional</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {COINS.map(({ coin, label, logo }) => (
            <button
              key={coin}
              onClick={() => setSelectedCoin(prev => prev === coin ? null : coin)}
              className={`rounded-xl border py-2.5 px-2 flex flex-col items-center gap-1.5 transition-all text-center ${
                selectedCoin === coin
                  ? "border-sky-500/40 bg-sky-500/10"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
              }`}
            >
              <img src={logo} alt={coin} className="h-6 w-6 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <span className={`text-[10px] font-bold ${selectedCoin === coin ? "text-sky-400" : "text-slate-400"}`}>{coin}</span>
              <span className="text-[9px] text-slate-700 truncate w-full">{label}</span>
            </button>
          ))}
        </div>
        {selectedCoin && (
          <div className="mt-2 text-[11px] text-sky-400/80 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> Paying with {selectedCoin} — OxaPay will show the exact amount
          </div>
        )}
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full h-13 py-3.5 rounded-2xl bg-white text-[15px] font-black text-[#0d1117] hover:bg-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
      >
        {paying ? (
          <><Loader2 className="h-5 w-5 animate-spin text-[#0d1117]" /> Processing…</>
        ) : (
          <>Pay ${charged.toFixed(2)}</>
        )}
      </button>

      <p className="text-center text-[11px] text-slate-700 leading-relaxed">
        You'll be redirected to OxaPay to complete payment.
        Once confirmed, your ${amount.toFixed(2)} balance updates instantly.
      </p>
    </div>
  );
}
