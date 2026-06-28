import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  LifeBuoy, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, Plus, X, Send, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";

interface TicketMessage {
  id: string;
  senderRole: string;
  senderName: string;
  message: string;
  imageUrl: string | null;
  createdAt: string;
}
interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: string;
  adminReply: string | null;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API_URL}/api/support/tickets`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load tickets");
  const data = await res.json() as { tickets: Ticket[] };
  return data.tickets;
}

async function createTicket(body: { subject: string; category: string; priority: string; message: string }): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/support/tickets`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { ticket?: Ticket; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to submit ticket");
  return data.ticket!;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open:        { label: "Open",        cls: "text-sky-400 bg-sky-500/10 border-sky-500/20",          icon: Clock },
  in_progress: { label: "In Progress", cls: "text-blue-400 bg-blue-400/10 border-blue-400/20",       icon: AlertCircle },
  resolved:    { label: "Resolved",    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  closed:      { label: "Closed",      cls: "text-slate-500 bg-white/[0.04] border-white/[0.08]",    icon: XCircle },
};

function hasUnread(ticket: Ticket): boolean {
  const msgs = ticket.messages;
  if (!msgs?.length) return false;
  return msgs[msgs.length - 1].senderRole === "admin";
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const [, setLocation] = useLocation();
  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;
  const unread = hasUnread(ticket);
  const lastMessage = ticket.messages?.[ticket.messages.length - 1];
  const isEnded = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <button
      onClick={() => setLocation(`/support/conversation/${ticket.id}`)}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] transition-colors text-left group"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
        unread ? "bg-sky-500/10 border-sky-500/20" : "bg-white/[0.03] border-white/[0.07]"
      }`}>
        {isEnded ? (
          <XCircle className="h-4.5 w-4.5 text-slate-500" />
        ) : unread ? (
          <MessageSquare className="h-4.5 w-4.5 text-sky-400" />
        ) : (
          <MessageSquare className="h-4.5 w-4.5 text-slate-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[13px] font-semibold truncate ${unread ? "text-white" : "text-slate-300"}`}>
            {ticket.subject}
          </span>
          {unread && (
            <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0 animate-pulse" />
          )}
        </div>
        <div className="text-[11px] text-slate-600 truncate">
          {lastMessage ? (
            <span className={lastMessage.senderRole === "admin" ? "text-sky-400/70" : ""}>
              {lastMessage.senderRole === "admin" ? "Support: " : "You: "}
              {lastMessage.imageUrl && !lastMessage.message ? "📷 Image" : lastMessage.message.slice(0, 60)}
            </span>
          ) : ticket.message.slice(0, 60)}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${statusCfg.cls}`}>
          <StatusIcon className="h-2 w-2" />
          {statusCfg.label}
        </span>
        <span className="text-[10px] text-slate-700">
          {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
    </button>
  );
}

export default function Support() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: fetchTickets,
    refetchInterval: 10_000,
  });

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      setSubject(""); setMessage(""); setShowForm(false);
      setLocation(`/support/conversation/${ticket.id}`);
    },
    onError: (err: Error) => toast({ title: "Could not submit", description: err.message, variant: "destructive" }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    mutation.mutate({ subject, category: "Billing", priority: "medium", message });
  }

  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const unreadCount = tickets.filter(t => hasUnread(t)).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-500 mb-1">Help Center</p>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            {t("supportTitle")}
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {tickets.length === 0
              ? "Submit a ticket and we'll respond within 24 hours."
              : `${tickets.length} conversation${tickets.length !== 1 ? "s" : ""} · ${openCount} open`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`shrink-0 flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
            showForm
              ? "bg-white/[0.06] border border-white/[0.1] text-slate-400 hover:text-white"
              : "text-white"
          }`}
          style={!showForm ? {
            background: "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 55%, #0284c7 100%)",
            boxShadow: "0 3px 0 0 #075985, 0 6px 16px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.2)"
          } : {}}
        >
          {showForm ? <><X className="h-3.5 w-3.5" /> {t("cancel")}</> : <><Plus className="h-3.5 w-3.5" /> {t("newTicket")}</>}
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <LifeBuoy className="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-white">Open a support ticket</div>
              <div className="text-[11px] text-slate-500">We'll get back to you within 24 hours.</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("ticketSubject")}</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Balance not updated after payment"
              maxLength={200}
              required
              className="w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/[0.08] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("ticketMessage")}</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue in detail…"
              rows={5}
              maxLength={2000}
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/[0.08] transition-all resize-none leading-relaxed"
            />
            <div className="text-right text-[10px] text-slate-700">{message.length}/2000</div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !subject.trim() || !message.trim()}
            className="w-full h-11 rounded-xl text-[13px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(180deg, #38bdf8 0%, #0ea5e9 55%, #0284c7 100%)",
              boxShadow: "0 3px 0 0 #075985, 0 6px 16px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
            }}
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> {t("submitTicket")}</>}
          </button>
        </form>
      )}

      {/* Info Cards (when no tickets and form not showing) */}
      {!showForm && tickets.length === 0 && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Clock, title: "Response time", desc: "We reply within 24 hours on business days." },
            { icon: MessageSquare, title: "Image support", desc: "Attach screenshots to your messages for faster help." },
            { icon: CheckCircle2, title: "Refund policy", desc: "Rental credits are refunded automatically if no SMS is received." },
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="h-8 w-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center mb-3">
                <item.icon className="h-4 w-4 text-sky-400/80" />
              </div>
              <div className="text-[12px] font-bold text-white mb-1">{item.title}</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket List */}
      <div>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />)}
          </div>
        )}

        {!isLoading && tickets.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Your conversations ({tickets.length})
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {tickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}
            </div>
          </div>
        )}

        {!isLoading && tickets.length === 0 && !showForm && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] py-14 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-sky-500/[0.07] border border-sky-500/12 flex items-center justify-center">
              <LifeBuoy className="h-6 w-6 text-sky-400/50" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white mb-1">No support tickets yet</p>
              <p className="text-[12px] text-slate-600">Open a ticket and our team will get back to you.</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-[12px] font-bold text-white transition-all"
              style={{
                background: "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)",
                boxShadow: "0 3px 0 0 #075985, 0 6px 14px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Open first ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
