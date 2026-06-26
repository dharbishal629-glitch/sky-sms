import { useListAdminTransactions } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowDownRight, ArrowUpRight, X, Receipt, TrendingUp, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

type Tx = {
  id: string;
  type: string;
  userEmail: string;
  userId?: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
};

type TxFilter = "all" | "deposit" | "rental" | "adjustment" | "pending" | "failed";

const statusCls = (status: string) =>
  status === "completed" || status === "paid"
    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
    : status === "pending"
    ? "text-blue-400 border-blue-500/20 bg-blue-500/10"
    : "text-red-400 border-red-500/20 bg-red-500/10";

function TxModal({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const isDeposit = tx.type === "deposit" || tx.type === "credit_purchase";

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Transaction ID", value: <span className="font-mono text-[11px] break-all text-slate-400 select-all">{tx.id}</span> },
    { label: "Type",   value: <span className="capitalize text-white font-semibold">{tx.type.replace(/_/g, " ")}</span> },
    { label: "Status", value: <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCls(tx.status)}`}>{tx.status}</span> },
    { label: "Amount", value: <span className={`font-mono font-bold text-[16px] ${isDeposit ? "text-emerald-400" : "text-white"}`}>{isDeposit ? "+" : ""}${tx.amount.toFixed(2)}</span> },
    { label: "User",   value: <span className="text-slate-300 break-all text-[12px]">{tx.userEmail}</span> },
    ...(tx.userId ? [{ label: "User ID", value: <span className="font-mono text-[10.5px] text-slate-600 break-all select-all">{tx.userId}</span> }] : []),
    { label: "Date",   value: <span className="text-slate-300 text-[12px]">{format(new Date(tx.createdAt), "MMM d, yyyy · HH:mm:ss")}</span> },
    ...(tx.description ? [{ label: "Note", value: <span className="text-slate-500 text-[12px]">{tx.description}</span> }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#070c1a] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-px ${isDeposit ? "bg-emerald-500/30" : "bg-blue-500/30"}`} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isDeposit ? "bg-emerald-400/10 border border-emerald-400/20 text-emerald-400" : "bg-blue-400/10 border border-blue-400/20 text-blue-400"}`}>
              {isDeposit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>
            <div>
              <div className="font-bold text-white text-[14px] capitalize">{tx.type.replace(/_/g, " ")}</div>
              <div className="text-[11px] text-slate-600 font-mono">{tx.id.slice(0, 16)}…</div>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-0.5">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-[12px] text-slate-600 shrink-0 w-28">{label}</span>
              <div className="text-right text-[12.5px] min-w-0 flex-1">{value}</div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-full rounded-xl border border-white/[0.07] text-[12.5px] font-semibold text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTransactions() {
  const { data, isLoading, error } = useListAdminTransactions();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tx | null>(null);
  const [filter, setFilter] = useState<TxFilter>("all");

  const allTx = (data?.transactions ?? []) as Tx[];

  const stats = useMemo(() => {
    const deposits = allTx.filter(t => t.type === "deposit" || t.type === "credit_purchase");
    const revenue = deposits.filter(t => t.status === "paid" || t.status === "completed").reduce((s, t) => s + t.amount, 0);
    const pending = allTx.filter(t => t.status === "pending").length;
    const failed = allTx.filter(t => t.status === "failed").length;
    return { total: allTx.length, revenue, pending, failed };
  }, [allTx]);

  const filtered = useMemo(() => {
    return allTx.filter(tx => {
      const matchSearch = !search ||
        tx.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        tx.id.toLowerCase().includes(search.toLowerCase()) ||
        tx.type.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "all"        ? true :
        filter === "deposit"    ? (tx.type === "deposit" || tx.type === "credit_purchase") :
        filter === "rental"     ? tx.type === "rental" :
        filter === "adjustment" ? tx.type === "credit_adjustment" :
        filter === "pending"    ? tx.status === "pending" :
        filter === "failed"     ? tx.status === "failed" : true;

      return matchSearch && matchFilter;
    });
  }, [allTx, search, filter]);

  const filterTabs: Array<{ key: TxFilter; label: string; count: number }> = [
    { key: "all",        label: "All",         count: allTx.length },
    { key: "deposit",    label: "Deposits",     count: allTx.filter(t => t.type === "deposit" || t.type === "credit_purchase").length },
    { key: "rental",     label: "Rentals",      count: allTx.filter(t => t.type === "rental").length },
    { key: "adjustment", label: "Adjustments",  count: allTx.filter(t => t.type === "credit_adjustment").length },
    { key: "pending",    label: "Pending",      count: allTx.filter(t => t.status === "pending").length },
    { key: "failed",     label: "Failed",       count: allTx.filter(t => t.status === "failed").length },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 page-enter">
      {selected && <TxModal tx={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div>
        <h1 className="font-display text-[22px] font-bold text-white tracking-tight">Transactions</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Platform-wide payment and credit activity.</p>
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Txns",    value: String(stats.total),          color: "text-white" },
            { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, color: "text-emerald-400" },
            { label: "Pending",       value: String(stats.pending),         color: "text-blue-400" },
            { label: "Failed",        value: String(stats.failed),          color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <div className={`text-[18px] font-black ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
        <input
          placeholder="Search by email, transaction ID, or type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {filterTabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-semibold transition-all ${
              filter === key
                ? "bg-blue-600 border-blue-500/50 text-white"
                : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:border-white/[0.12]"
            }`}
          >
            <Filter className="h-3 w-3" />
            {label}
            {count > 0 && (
              <span className={`text-[10px] rounded-full px-1.5 py-0 font-bold ${filter === key ? "bg-blue-500/40 text-blue-100" : "bg-white/[0.06] text-slate-600"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <Skeleton className="h-9 w-9 rounded-xl bg-white/[0.04] shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28 bg-white/[0.04]" />
                <Skeleton className="h-2.5 w-40 bg-white/[0.03]" />
              </div>
              <Skeleton className="h-4 w-14 bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-2xl border border-white/[0.06]">
          <Receipt className="h-7 w-7 text-slate-700 mx-auto mb-2" />
          <p className="text-[13px] text-slate-500">Failed to load transactions.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <TrendingUp className="h-7 w-7 text-slate-700 mx-auto mb-2" />
              <p className="text-[13px] text-slate-600">No transactions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map(tx => {
                const isCredit = tx.type === "deposit" || tx.type === "credit_purchase";
                const isPending = tx.status === "pending";
                const isFailed = tx.status === "failed";
                return (
                  <button
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCredit
                        ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                        : "bg-blue-400/10 border-blue-400/20 text-blue-400"
                    }`}>
                      {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[13px] font-semibold text-white capitalize">{tx.type.replace(/_/g, " ")}</span>
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-bold ${statusCls(tx.status)}`}>{tx.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{tx.userEmail}</p>
                      <p className="text-[10.5px] text-slate-700 mt-0.5">{format(new Date(tx.createdAt), "MMM d, yyyy · HH:mm")}</p>
                    </div>
                    <div className={`font-mono font-bold text-[14px] shrink-0 ${
                      isFailed ? "text-red-400/60 line-through" :
                      isPending ? "text-blue-400" :
                      isCredit ? "text-emerald-400" : "text-white"
                    }`}>
                      {isCredit ? "+" : ""}${tx.amount.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
