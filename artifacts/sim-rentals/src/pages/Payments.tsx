import { useState } from "react";
import { useListPayments, useGetMe } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Clock, XCircle,
  Loader2, CreditCard, ChevronDown, Wallet
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

const PACKAGES = [
  { amount: 5,  label: "$5" },
  { amount: 10, label: "$10", popular: true },
  { amount: 25, label: "$25" },
  { amount: 50, label: "$50" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="h-2.5 w-2.5" /> Paid
    </span>
  );
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
      <Clock className="h-2.5 w-2.5" /> Processing
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="h-2.5 w-2.5" /> Failed
    </span>
  );
}

function PaymentRow({ payment }: { payment: any }) {
  const [open, setOpen] = useState(false);

  const providerLogo: Record<string, string> = {
    BTC: "https://assets.coincap.io/assets/icons/btc@2x.png",
    ETH: "https://assets.coincap.io/assets/icons/eth@2x.png",
    USDT: "https://assets.coincap.io/assets/icons/usdt@2x.png",
    SOL: "https://assets.coincap.io/assets/icons/sol@2x.png",
    LTC: "https://assets.coincap.io/assets/icons/ltc@2x.png",
    BNB: "https://assets.coincap.io/assets/icons/bnb@2x.png",
    XRP: "https://assets.coincap.io/assets/icons/xrp@2x.png",
    MATIC: "https://assets.coincap.io/assets/icons/matic@2x.png",
    DOGE: "https://assets.coincap.io/assets/icons/doge@2x.png",
  };
  const logo = providerLogo[payment.currency?.toUpperCase?.()];

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        {logo ? (
          <img src={logo} alt={payment.currency} className="h-8 w-8 rounded-full shrink-0 bg-white/[0.04]" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
        ) : (
          <div className="h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
            <CreditCard className="h-3.5 w-3.5 text-slate-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[14px] font-bold text-white">${payment.amount.toFixed(2)}</span>
            <StatusBadge status={payment.status} />
          </div>
          <p className="text-[11px] text-slate-500">
            {format(new Date(payment.createdAt), "MMM d, yyyy · h:mm a")}
            {payment.currency && ` · ${payment.currency}`}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-600 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-72" : "max-h-0"}`}>
        <div className="px-4 pb-4 pt-1">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] divide-y divide-white/[0.04] text-[12px]">
            {[
              { label: "Transaction ID", value: <span className="font-mono text-[10.5px] text-slate-400 select-all break-all">{payment.id}</span> },
              { label: "Amount",         value: <span className="font-bold text-white">${payment.amount.toFixed(2)}</span> },
              { label: "Currency",       value: <span className="text-slate-300">{payment.currency ?? "—"}</span> },
              { label: "Status",         value: <StatusBadge status={payment.status} /> },
              { label: "Date",           value: <span className="text-slate-300">{format(new Date(payment.createdAt), "MMM d, yyyy 'at' h:mm a")}</span> },
              ...(payment.couponCode ? [{ label: "Coupon", value: <span className="font-mono text-emerald-400">{payment.couponCode}</span> }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between px-3.5 py-2.5 gap-3">
                <span className="text-slate-600 shrink-0 mt-0.5">{label}</span>
                <div className="text-right min-w-0 flex-1">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: user } = useGetMe();
  const { data: paymentsData, isLoading: paymentsLoading } = useListPayments();

  const [customAmount, setCustomAmount] = useState("");
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  const payments = paymentsData?.payments ?? [];
  const filtered = filter === "all" ? payments : payments.filter((p: any) => p.status === filter);
  const counts = {
    all: payments.length,
    paid: payments.filter((p: any) => p.status === "paid").length,
    pending: payments.filter((p: any) => p.status === "pending").length,
    failed: payments.filter((p: any) => p.status === "failed").length,
  };

  const startCheckout = async (amount: number) => {
    if (checkingOut) return;
    setCheckingOut(amount);
    try {
      const res = await fetch(`${API_URL}/api/payments/checkout-session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "USD" }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Failed to create session");
      setLocation(`/checkout/${data.id}`);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckingOut(null);
    }
  };

  const handleCustom = () => {
    const n = parseFloat(customAmount);
    if (!n || n < 0.5 || n > 1000) {
      toast({ title: "Invalid amount", description: "Enter an amount between $0.50 and $1,000.", variant: "destructive" });
      return;
    }
    startCheckout(Number(n.toFixed(2)));
  };

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: "all",     label: t("filterAll") },
    { key: "paid",    label: t("paid") },
    { key: "pending", label: t("pending") },
    { key: "failed",  label: t("failed") },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5 page-enter">

      {/* Header */}
      <div>
        <h1 className="font-display text-[22px] font-bold text-white tracking-tight">{t("topUpBalance")}</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Add funds to your SKY SMS account.</p>
      </div>

      {/* Top-up card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Amount input */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-2">Top-up amount</p>
            <div className="flex items-center gap-0 rounded-xl border border-white/[0.1] bg-white/[0.03] overflow-hidden focus-within:border-sky-500/40 transition-all">
              <span className="h-12 flex items-center px-4 text-[16px] font-bold text-slate-400 border-r border-white/[0.07] bg-white/[0.02] shrink-0">$</span>
              <input
                type="number"
                min="0.5"
                max="1000"
                step="0.01"
                placeholder="10.00"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCustom()}
                className="flex-1 h-12 bg-transparent px-4 text-[16px] font-bold text-white placeholder:text-slate-700 outline-none"
              />
              <button
                onClick={handleCustom}
                disabled={!customAmount || !!checkingOut}
                className="h-12 w-12 flex items-center justify-center bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {checkingOut && customAmount ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] px-4 py-3">
            <div className="h-8 w-8 rounded-lg border border-white/[0.07] bg-white/[0.04] flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[12.5px] text-slate-400">Your balance will be credited instantly after payment.</p>
          </div>

          <p className="text-[11px] text-slate-600">Minimum top-up is $0.50</p>
        </div>

        {/* Quick packages */}
        <div className="px-5 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-2">Quick select</p>
          <div className="grid grid-cols-4 gap-2">
            {PACKAGES.map(({ amount, popular }) => (
              <button
                key={amount}
                onClick={() => startCheckout(amount)}
                disabled={checkingOut === amount}
                className={`relative h-11 rounded-xl border text-[13px] font-bold transition-all active:scale-[0.97] ${
                  popular
                    ? "border-sky-500/40 bg-sky-500/[0.1] text-sky-300 hover:bg-sky-500/[0.18]"
                    : "border-white/[0.08] bg-white/[0.03] text-white hover:border-white/[0.16] hover:bg-white/[0.06]"
                }`}
              >
                {checkingOut === amount ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                ) : (
                  <>${amount}</>
                )}
                {popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase bg-sky-500 text-white rounded-full px-1.5 py-0 leading-4">
                    Popular
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-white">Payment History</h2>
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  filter === key
                    ? "bg-white/[0.1] text-white"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={`ml-1 text-[10px] ${filter === key ? "text-slate-400" : "text-slate-700"}`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {paymentsLoading ? (
            <div className="divide-y divide-white/[0.04]">
              {[0,1,2].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-4">
                  <Skeleton className="h-8 w-8 rounded-full bg-white/[0.04] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24 bg-white/[0.04]" />
                    <Skeleton className="h-2.5 w-36 bg-white/[0.03]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <CreditCard className="h-8 w-8 text-slate-700 mx-auto mb-3" />
              <p className="text-[13px] text-slate-500">No payments yet</p>
              <p className="text-[11px] text-slate-700 mt-1">Your payment history will appear here.</p>
            </div>
          ) : (
            filtered.map((payment: any) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-slate-600 leading-relaxed">
        Payments are processed via crypto (OxaPay). Unused balance stays in your account.{" "}
        <a href="/refund-policy" className="text-slate-500 hover:text-white transition-colors underline underline-offset-2">
          Refund Policy
        </a>
      </p>

    </div>
  );
}
