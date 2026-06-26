import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Trash2, Users, User, Info, CheckCircle2, AlertCircle, Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface Notification {
  id: number;
  userId: string | null;
  userName: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeOptions = [
  { value: "info",    label: "Info",    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "success", label: "Success", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "warning", label: "Warning", color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
];

function typeIcon(type: string, className = "h-4 w-4") {
  if (type === "success") return <CheckCircle2 className={`${className} text-emerald-400`} />;
  if (type === "warning") return <AlertCircle className={`${className} text-orange-400`} />;
  return <Info className={`${className} text-amber-400`} />;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    userId: "",
    link: "",
  });

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/notifications`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[] };
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const sendNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/notifications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
          userId: form.userId.trim() || null,
          link: form.link.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      toast({ title: "Notification sent successfully" });
      setForm({ title: "", message: "", type: "info", userId: "", link: "" });
      setShowForm(false);
      fetchNotifications();
    } catch {
      toast({ title: "Failed to send notification", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Broadcast messages to all users or specific users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[13px] font-semibold text-slate-900 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "New notification"}
        </button>
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="rounded-2xl border border-amber-900/20 bg-amber-500/[0.03] p-6 space-y-4">
          <h3 className="text-[14px] font-bold text-white">Compose notification</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Notification title..."
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
              <div className="flex gap-2">
                {typeOptions.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`flex-1 h-10 rounded-xl border text-[12px] font-semibold transition-all ${
                      form.type === t.value ? `${t.bg} ${t.color}` : "border-white/[0.06] bg-white/[0.02] text-slate-500 hover:border-white/[0.1]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Notification message..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] transition-all resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <Users className="inline h-3 w-3 mr-1" />Target user ID (empty = all users)
              </label>
              <input
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder="Leave blank to broadcast to all..."
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link (optional)</label>
              <input
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                placeholder="/payments or https://..."
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={sendNotification}
              disabled={sending}
              className="flex items-center gap-2 h-9 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[13px] font-semibold text-slate-900 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : "Send notification"}
            </button>
            <p className="text-[11px] text-slate-600">
              {form.userId ? "Sending to 1 user" : "Broadcasting to all users"}
            </p>
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.05]">
          <Bell className="h-4 w-4 text-amber-400" />
          <span className="text-[14px] font-bold text-white">Notification history</span>
          <span className="ml-auto text-[12px] text-slate-600">{notifications.length} total</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[0,1,2].map((i) => (
              <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-white/[0.04]" />
                  <div className="h-2.5 w-56 rounded bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="h-8 w-8 text-slate-700 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-slate-500">No notifications sent yet</p>
            <p className="text-[12px] text-slate-700 mt-1">Send your first notification above</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map((n) => (
              <div key={n.id} className="px-5 py-4 flex gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] flex items-center justify-center mt-0.5">
                  {typeIcon(n.type, "h-4 w-4")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-white">{n.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeOptions.find((t) => t.value === n.type)?.bg ?? "bg-white/[0.05] border-white/[0.08]"} ${typeOptions.find((t) => t.value === n.type)?.color ?? "text-slate-400"}`}>
                      {n.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      {n.userId ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {n.userId ? n.userName : "All users"}
                    </div>
                    <span className="text-[11px] text-slate-700">
                      {format(new Date(n.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
