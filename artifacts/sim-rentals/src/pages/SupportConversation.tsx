import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Send, Loader2, Image as ImageIcon, X, CheckCircle2,
  XCircle, Clock, AlertCircle, Plus, Shield, Lock
} from "lucide-react";
import { format } from "date-fns";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

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

function compressImage(file: File, maxSizePx = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxSizePx || height > maxSizePx) {
          if (width > height) { height = Math.round((height * maxSizePx) / width); width = maxSizePx; }
          else { width = Math.round((width * maxSizePx) / height); height = maxSizePx; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  open:        { label: "Open",        cls: "text-sky-400 border-sky-500/25 bg-sky-500/10", icon: Clock },
  in_progress: { label: "In Progress", cls: "text-blue-400 border-blue-500/25 bg-blue-500/10", icon: AlertCircle },
  resolved:    { label: "Resolved",    cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: CheckCircle2 },
  closed:      { label: "Closed",      cls: "text-slate-500 border-white/10 bg-white/[0.04]", icon: XCircle },
};

export default function SupportConversation() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const ticketId = params?.id;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [ended, setEnded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    try {
      const res = await fetch(`${API_URL}/api/support/tickets/${ticketId}`, { credentials: "include" });
      if (!res.ok) { setError("Conversation not found."); return; }
      const data = await res.json() as { ticket: Ticket };
      setTicket(data.ticket);
      setEnded(["resolved", "closed"].includes(data.ticket.status));
    } catch {
      setError("Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { loadTicket(); }, [loadTicket]);

  useEffect(() => {
    const interval = setInterval(loadTicket, 5000);
    return () => clearInterval(interval);
  }, [loadTicket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Image too large", description: "Max 10MB", variant: "destructive" }); return; }
    try {
      const compressed = await compressImage(file);
      setPendingImage(compressed);
    } catch {
      toast({ title: "Failed to process image", variant: "destructive" });
    }
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!ticketId || (!message.trim() && !pendingImage) || sending || ended) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), imageData: pendingImage }),
      });
      const data = await res.json() as { ticket?: Ticket; error?: string; ended?: boolean };
      if (!res.ok) {
        if (data.ended) { setEnded(true); toast({ title: "Conversation ended", description: data.error }); return; }
        throw new Error(data.error || "Failed to send");
      }
      setMessage("");
      setPendingImage(null);
      if (data.ticket) setTicket(data.ticket);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p className="text-[12px] text-slate-600">Loading conversation…</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-[14px] text-slate-400 mb-4">{error || "Conversation not found."}</p>
        <button
          onClick={() => setLocation("/support")}
          className="h-10 px-5 rounded-xl bg-sky-500 text-[13px] font-bold text-white hover:bg-sky-400 transition-all"
          style={{ boxShadow: "0 4px 14px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.15)" }}
        >
          Back to Support
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;

  const messages = ticket.messages?.length
    ? ticket.messages
    : [{ id: `${ticket.id}-initial`, senderRole: "user", senderName: "You", message: ticket.message, imageUrl: null, createdAt: ticket.createdAt }];

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => setLocation("/support")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors shrink-0 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-[13px] font-medium hidden sm:inline">Back</span>
        </button>
        <div className="w-px h-5 bg-white/[0.08] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-white truncate">{ticket.subject}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${statusCfg.cls}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4 min-h-0">
        {messages.map((msg) => {
          const fromAdmin = msg.senderRole === "admin";
          return (
            <div key={msg.id} className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[78%]`}>
                {fromAdmin && (
                  <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                    <div className="h-5 w-5 rounded-full bg-slate-700/60 border border-slate-600/40 flex items-center justify-center">
                      <Shield className="h-2.5 w-2.5 text-slate-300" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wide">SKY SMS Support</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    fromAdmin
                      ? "bg-white/[0.04] border border-white/[0.07] rounded-tl-sm"
                      : "rounded-tr-sm"
                  }`}
                  style={!fromAdmin ? {
                    background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                    boxShadow: "0 4px 16px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
                  } : {
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)"
                  }}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="attachment"
                      className="max-w-full rounded-xl mb-2 max-h-60 object-cover cursor-pointer"
                      onClick={() => window.open(msg.imageUrl!, "_blank")}
                    />
                  )}
                  {msg.message && (
                    <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${fromAdmin ? "text-slate-200" : "text-white"}`}>
                      {msg.message}
                    </p>
                  )}
                </div>
                <div className={`text-[10px] text-slate-700 mt-1.5 ${fromAdmin ? "ml-1" : "text-right mr-1"}`}>
                  {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Ended Banner */}
      {ended && (
        <div className="shrink-0 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 mb-3"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">Conversation ended</div>
              <div className="text-[11px] text-slate-500">This ticket has been {ticket.status}. Open a new ticket if you need more help.</div>
            </div>
            <button
              onClick={() => setLocation("/support")}
              className="h-9 px-3.5 rounded-xl border border-sky-500/25 bg-sky-500/[0.08] text-[12px] font-semibold text-sky-400 hover:bg-sky-500/[0.15] transition-all flex items-center gap-1.5 shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(14,165,233,0.15), inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
              <Plus className="h-3.5 w-3.5" /> New ticket
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!ended && (
        <div className="shrink-0 border-t border-white/[0.06] pt-3">
          {pendingImage && (
            <div className="relative inline-block mb-2">
              <img src={pendingImage} alt="pending" className="h-16 w-16 rounded-xl object-cover border border-white/[0.1]" />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <button
              onClick={() => fileRef.current?.click()}
              className="h-10 w-10 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/[0.14] transition-all shrink-0"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              maxLength={3000}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-sky-500/35 transition-all resize-none leading-relaxed min-h-[40px] max-h-32"
              style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 128) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || (!message.trim() && !pendingImage)}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                boxShadow: "0 4px 14px rgba(14,165,233,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px rgba(14,165,233,0.3)"
              }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
