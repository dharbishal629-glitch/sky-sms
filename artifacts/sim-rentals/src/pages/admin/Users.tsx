import { useListAdminUsers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Copy, Check, Shield, User, Ban, CheckCircle2, X, AlertTriangle,
  Mail, Loader2, Minus, Globe, Calendar, DollarSign, Phone, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  credits: number;
  rentals: number;
  role: string;
  status: string;
  createdAt?: string;
  suspensionReason?: string;
  lastSeenIp?: string;
};

function SuspendModal({
  user, onClose, onConfirm,
}: {
  user: { id: string; name: string; email: string; status: string };
  onClose: () => void;
  onConfirm: (status: string, reason: string) => Promise<void>;
}) {
  const isSuspended = user.status !== "active";
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try { await onConfirm(isSuspended ? "active" : "suspended", reason); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#070c1a] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-px ${isSuspended ? "bg-emerald-500/40" : "bg-red-500/40"}`} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${isSuspended ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                {isSuspended ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Ban className="h-4 w-4 text-red-400" />}
              </div>
              <div>
                <div className="font-bold text-white text-[14.5px]">{isSuspended ? "Reactivate Account" : "Suspend Account"}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">{user.name} · {user.email}</div>
              </div>
            </div>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] transition-all">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
            {isSuspended
              ? `This will allow ${user.name} to log in and use the platform again.`
              : `Suspending ${user.name} will immediately block their access. They will see your reason when trying to log in.`}
          </p>
          {!isSuspended && (
            <div className="mb-4">
              <label className="block text-[11.5px] font-semibold text-slate-500 mb-2">Reason <span className="text-slate-700">(optional)</span></label>
              <input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Suspicious activity, policy violation…"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-red-500/30 transition-all"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-[13px] font-semibold text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 h-10 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-50 ${isSuspended ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600/80 hover:bg-red-600"}`}
            >
              {loading ? "…" : isSuspended ? "Reactivate" : "Suspend User"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserProfileModal({
  user, onClose, onSuspend, onCreditUpdate, onRoleChange,
}: {
  user: AdminUser;
  onClose: () => void;
  onSuspend: () => void;
  onCreditUpdate: (amount: number) => Promise<void>;
  onRoleChange: (role: "admin" | "user") => Promise<void>;
}) {
  const [creditInput, setCreditInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [lienInput, setLienInput] = useState("");
  const [savingLien, setSavingLien] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleLien = async () => {
    const amount = Number(lienInput);
    if (!Number.isFinite(amount) || amount < 0) {
      toast({ title: "Invalid lien amount", description: "Enter 0 or greater.", variant: "destructive" });
      return;
    }
    setSavingLien(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/lien`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lienAmount: amount }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setLienInput("");
      toast({ title: "Lien updated", description: `Lien set to $${amount.toFixed(2)} — deducted on next top-up.` });
    } catch (err: unknown) {
      toast({ title: "Failed to set lien", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSavingLien(false); }
  };

  const handleCredit = async () => {
    const amount = Number(creditInput);
    if (!Number.isFinite(amount) || amount === 0) {
      toast({ title: "Enter a credit amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try { await onCreditUpdate(amount); setCreditInput(""); }
    finally { setSaving(false); }
  };

  const handleRole = async () => {
    setRoleLoading(true);
    try { await onRoleChange(user.role === "admin" ? "user" : "admin"); }
    finally { setRoleLoading(false); }
  };

  const isSuspended = user.status !== "active";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[min(384px,calc(100vw-16px))] rounded-2xl border border-white/[0.08] bg-[#070c1a] shadow-2xl max-h-[86vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-px bg-blue-500/30 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] sticky top-0 bg-[#070c1a] z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-black text-[15px] uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-white text-[14px]">{user.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${isSuspended ? "text-red-400 border-red-500/20 bg-red-500/10" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"}`}>{user.status}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${user.role === "admin" ? "text-blue-400 border-blue-500/20 bg-blue-500/10" : "text-slate-500 border-white/10 bg-white/[0.04]"}`}>{user.role}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] transition-all shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Balance",  value: `$${user.credits.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400" },
              { label: "Rentals",  value: String(user.rentals),          icon: Phone,      color: "text-blue-400" },
              { label: "Joined",   value: user.createdAt ? format(new Date(user.createdAt), "MMM d") : "—", icon: Calendar, color: "text-slate-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <Icon className={`h-3.5 w-3.5 mx-auto mb-1.5 ${color}`} />
                <div className="text-[15px] font-bold text-white">{value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Info rows */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <Mail className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="text-[12.5px] text-slate-400 truncate flex-1">{user.email}</span>
              <button onClick={() => copyText(user.email, "email")} className="h-6 w-6 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-400 transition-colors shrink-0">
                {copiedField === "email" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <User className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="text-[11px] text-slate-500 font-mono truncate flex-1 select-all">{user.id}</span>
              <button onClick={() => copyText(user.id, "id")} className="h-6 w-6 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-400 transition-colors shrink-0">
                {copiedField === "id" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            {user.lastSeenIp && (
              <div className="flex items-center gap-3 px-3.5 py-2.5">
                <Globe className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span className="text-[12px] text-slate-400 font-mono flex-1">{user.lastSeenIp}</span>
                <button onClick={() => copyText(user.lastSeenIp!, "ip")} className="h-6 w-6 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-400 transition-colors shrink-0">
                  {copiedField === "ip" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            {isSuspended && user.suspensionReason && (
              <div className="flex items-start gap-3 px-3.5 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-[12px] text-red-300">{user.suspensionReason}</span>
              </div>
            )}
          </div>

          {/* Credit adjustment */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1.5">
              <DollarSign className="h-3 w-3 text-emerald-500" /> Adjust Credits
            </label>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" placeholder="+10 or -5"
                value={creditInput}
                onChange={e => setCreditInput(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white text-right placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all"
                onKeyDown={e => e.key === "Enter" && handleCredit()}
              />
              <button onClick={handleCredit} disabled={saving} className="h-9 px-4 rounded-xl bg-blue-600 text-[12.5px] font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
              </button>
            </div>
          </div>

          {/* Silent Lien */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Minus className="h-3 w-3 text-red-400" /> Silent Lien
              <span className="text-[10px] text-slate-700 font-normal">(deducted from next top-up)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[12px] pointer-events-none">$</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={lienInput}
                  onChange={e => setLienInput(e.target.value)}
                  className="w-full h-9 pl-6 pr-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-red-500/30 transition-all"
                  onKeyDown={e => e.key === "Enter" && handleLien()}
                />
              </div>
              <button onClick={handleLien} disabled={savingLien} className="h-9 px-4 rounded-xl bg-red-600/60 border border-red-500/25 text-[12.5px] font-bold text-white hover:bg-red-600/80 transition-all disabled:opacity-50 flex items-center gap-1.5">
                {savingLien ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-0.5">
            <button onClick={handleRole} disabled={roleLoading} className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] text-[12.5px] font-semibold text-blue-400 hover:bg-blue-500/[0.1] transition-all disabled:opacity-50">
              {user.role === "admin" ? <User className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
              {roleLoading ? "…" : user.role === "admin" ? "Demote" : "Make Admin"}
            </button>
            <button onClick={onSuspend} className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-semibold transition-all ${isSuspended ? "border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/[0.1]" : "border border-red-500/20 bg-red-500/[0.06] text-red-400 hover:bg-red-500/[0.1]"}`}>
              {isSuspended ? <><CheckCircle2 className="h-3.5 w-3.5" /> Restore</> : <><Ban className="h-3.5 w-3.5" /> Suspend</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | "active" | "suspended" | "admin";

export default function AdminUsers() {
  const { data, isLoading, error, refetch } = useListAdminUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [, setLocation] = useLocation();
  const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suspendModal, setSuspendModal] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "User ID copied", duration: 2000 });
  };

  const addCredits = async (userId: string, amount?: number) => {
    const amt = amount ?? Number(creditDrafts[userId]);
    if (!Number.isFinite(amt) || amt === 0) {
      toast({ title: "Enter a credit amount", description: "Use positive to add, negative to remove.", variant: "destructive" });
      return;
    }
    setSavingUser(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/credits`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
      setCreditDrafts(c => ({ ...c, [userId]: "" }));
      await refetch();
      toast({ title: "Credits updated", description: `${amt > 0 ? "Added" : "Removed"} $${Math.abs(amt).toFixed(2)} credits.` });
    } catch (err) {
      toast({ title: "Failed to update credits", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSavingUser(null); }
  };

  const changeRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
      await refetch();
      toast({ title: "Role updated", description: `Role changed to ${newRole}.` });
    } catch (err) {
      toast({ title: "Failed to update role", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    }
  };

  const changeStatus = async (userId: string, status: string, reason: string) => {
    const res = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    const result = await res.json().catch(() => null);
    if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
    await refetch();
    toast({
      title: status === "active" ? "Account reactivated" : "Account suspended",
      description: status === "active" ? "User can now log in." : `Suspended${reason ? `: ${reason}` : ""}.`,
    });
  };

  const allUsers = (data?.users ?? []) as AdminUser[];

  const counts = {
    all: allUsers.length,
    active: allUsers.filter(u => u.status === "active" && u.role !== "admin").length,
    suspended: allUsers.filter(u => u.status !== "active").length,
    admin: allUsers.filter(u => u.role === "admin").length,
  };

  const filtered = allUsers.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.lastSeenIp && u.lastSeenIp.includes(search));
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? u.status === "active" :
      filter === "suspended" ? u.status !== "active" :
      filter === "admin" ? u.role === "admin" : true;
    return matchSearch && matchFilter;
  });

  const filterTabs: Array<{ key: Filter; label: string }> = [
    { key: "all",       label: "All" },
    { key: "active",    label: "Active" },
    { key: "suspended", label: "Suspended" },
    { key: "admin",     label: "Admins" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 page-enter">
      {suspendModal && (
        <SuspendModal
          user={suspendModal}
          onClose={() => setSuspendModal(null)}
          onConfirm={async (status, reason) => { await changeStatus(suspendModal.id, status, reason); setSuspendModal(null); }}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-[22px] font-bold text-white tracking-tight">Users</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Manage accounts, credits, roles, and view IP addresses.</p>
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total",     value: counts.all,       color: "text-white" },
            { label: "Active",    value: counts.active,    color: "text-emerald-400" },
            { label: "Suspended", value: counts.suspended, color: "text-red-400" },
            { label: "Admins",    value: counts.admin,     color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
              <div className={`text-[20px] font-black ${color}`}>{value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
          <input
            placeholder="Search by name, email, or IP…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5 h-10 shrink-0">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                filter === key ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1 text-[10px] ${filter === key ? "text-blue-100/70" : "text-slate-700"}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <Skeleton className="h-10 w-10 rounded-xl bg-white/[0.04] shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28 bg-white/[0.04]" />
                <Skeleton className="h-2.5 w-48 bg-white/[0.03]" />
              </div>
              <Skeleton className="h-7 w-16 rounded-lg bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-2xl border border-white/[0.06]">
          <p className="text-[13px] text-slate-500">Failed to load users.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-14 text-center text-[13px] text-slate-600">No users found.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filtered.map(user => {
                const isSuspended = user.status !== "active";
                return (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group">
                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center text-[13px] font-black shrink-0 uppercase transition-colors ${isSuspended ? "bg-red-500/10 border-red-500/15 text-red-400" : user.role === "admin" ? "bg-blue-500/10 border-blue-500/15 text-blue-400" : "bg-white/[0.05] border-white/[0.08] text-slate-400"}`}>
                      {user.name.charAt(0)}
                    </div>

                    {/* Name/email */}
                    <button onClick={() => setLocation(`/admin/users/${user.id}`)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-[13.5px] truncate">{user.name}</span>
                        {user.role === "admin" && (
                          <span className="inline-flex items-center text-[9.5px] font-bold px-1.5 py-0 rounded-full border text-blue-400 border-blue-500/20 bg-blue-500/10">Admin</span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center text-[9.5px] font-bold px-1.5 py-0 rounded-full border text-red-400 border-red-500/20 bg-red-500/10">Suspended</span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-slate-600 truncate mt-0.5">{user.email}</p>
                      {user.lastSeenIp && (
                        <p className="text-[10.5px] text-slate-700 font-mono mt-0.5 flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5" />{user.lastSeenIp}
                        </p>
                      )}
                    </button>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[13px] font-bold font-mono text-white">${user.credits.toFixed(2)}</div>
                        <div className="text-[10.5px] text-slate-600">credits</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-bold text-white">{user.rentals}</div>
                        <div className="text-[10.5px] text-slate-600">rentals</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={e => copyId(user.id, e)} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-300 hover:bg-white/[0.05] transition-all" title="Copy user ID">
                        {copiedId === user.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>

                      <div className="hidden md:flex items-center gap-1.5">
                        <input
                          type="number" step="0.01" placeholder="+10"
                          value={creditDrafts[user.id] ?? ""}
                          onChange={e => setCreditDrafts(c => ({ ...c, [user.id]: e.target.value }))}
                          className="h-7 w-16 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 text-[12px] text-white text-right placeholder:text-slate-700 outline-none focus:border-blue-500/30 transition-all"
                          onKeyDown={e => e.key === "Enter" && addCredits(user.id)}
                        />
                        <button onClick={() => addCredits(user.id)} disabled={savingUser === user.id} className="h-7 px-2.5 rounded-lg bg-blue-500/15 border border-blue-500/20 text-[11.5px] font-bold text-blue-400 hover:bg-blue-500/25 transition-all disabled:opacity-50">
                          {savingUser === user.id ? "…" : "Add"}
                        </button>
                      </div>

                      <button onClick={() => setLocation(`/admin/users/${user.id}`)} className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11.5px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-1">
                        View <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
