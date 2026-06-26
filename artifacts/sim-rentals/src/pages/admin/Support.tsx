import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  LifeBuoy, CheckCircle2, Clock, XCircle, AlertCircle, User, Search, ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketMessage {
  id: string; senderRole: string; senderName: string; message: string; createdAt: string;
}

interface AdminTicket {
  id: string; userId: string; userEmail: string; userName: string; subject: string;
  category: string; priority: string; message: string; status: string;
  adminReply: string | null; messages: TicketMessage[]; createdAt: string; updatedAt: string;
}

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

async function fetchAdminTickets(): Promise<AdminTicket[]> {
  const res = await fetch(`${BASE}/api/admin/support`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load tickets");
  const data = await res.json() as { tickets: AdminTicket[] };
  return data.tickets;
}

const statusMap: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  open:        { label: "Open",        cls: "text-amber-400 border-amber-500/20 bg-amber-500/10",       icon: Clock },
  in_progress: { label: "In Progress", cls: "text-blue-400 border-blue-500/20 bg-blue-500/10",          icon: Clock },
  resolved:    { label: "Resolved",    cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: CheckCircle2 },
  closed:      { label: "Closed",      cls: "text-slate-500 border-white/10 bg-white/[0.03]",           icon: XCircle },
};

function TicketRow({ ticket }: { ticket: AdminTicket }) {
  const [, setLocation] = useLocation();
  const st = statusMap[ticket.status] ?? statusMap.open;
  const StIcon = st.icon;
  const hasUserReplies = ticket.messages.some(m => m.senderRole === "user");
  const lastMsg = ticket.messages.at(-1);

  return (
    <button
      onClick={() => setLocation(`/admin/support/conversation/${ticket.id}`)}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors border-b border-white/[0.04] last:border-0 group"
    >
      <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-white/[0.12] transition-colors">
        <User className="h-4 w-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-white truncate">{ticket.subject}</span>
          {hasUserReplies && <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 animate-pulse" />}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="truncate">{ticket.userName}</span>
          <span className="text-slate-700">·</span>
          <span className="capitalize">{ticket.category}</span>
          <span className="text-slate-700">·</span>
          <span>{format(new Date(ticket.createdAt), "MMM d")}</span>
        </div>
        {lastMsg && (
          <p className="text-[11px] text-slate-600 truncate mt-0.5">
            {lastMsg.senderRole === "admin" ? "You: " : `${lastMsg.senderName}: `}{lastMsg.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${st.cls}`}>
          <StIcon className="h-2.5 w-2.5" /> {st.label}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
}

export default function AdminSupport() {
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: fetchAdminTickets,
    refetchInterval: 15_000,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const all = tickets ?? [];
  const filtered = all.filter(t => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.userName.toLowerCase().includes(q) || t.userEmail.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const filterOpts = [
    { key: "all",         label: "All",         count: all.length },
    { key: "open",        label: "Open",         count: all.filter(t => t.status === "open").length },
    { key: "in_progress", label: "In Progress",  count: all.filter(t => t.status === "in_progress").length },
    { key: "resolved",    label: "Resolved",     count: all.filter(t => t.status === "resolved").length },
    { key: "closed",      label: "Closed",       count: all.filter(t => t.status === "closed").length },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">

      <div>
        <h1 className="font-display text-[22px] font-bold text-white tracking-tight">Support</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage user support tickets. Click a ticket to open the full chat.</p>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
          <input
            placeholder="Search tickets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-[12px] text-white placeholder:text-slate-700 outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
          {filterOpts.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                statusFilter === key ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label} {count > 0 && <span className={`ml-0.5 text-[10px] ${statusFilter === key ? "text-blue-100/70" : "text-slate-700"}`}>{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-white/[0.04]">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="h-9 w-9 rounded-xl bg-white/[0.04] shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40 bg-white/[0.04]" />
                  <Skeleton className="h-2.5 w-28 bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertCircle className="h-7 w-7 text-red-400 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">Could not load tickets.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <LifeBuoy className="h-7 w-7 text-slate-700 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">No tickets found.</p>
          </div>
        ) : (
          filtered.map(ticket => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>

    </div>
  );
}
