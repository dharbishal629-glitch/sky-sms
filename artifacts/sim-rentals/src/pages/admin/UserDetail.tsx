import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Copy, Check, Shield, User, Ban, CheckCircle2, X, AlertTriangle,
  Mail, Loader2, Minus, Globe, Calendar, DollarSign, Phone,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

type AdminUser = {
  id: string; name: string; email: string; credits: number; rentals: number;
  role: string; status: string; createdAt?: string; suspensionReason?: string; lastSeenIp?: string;
};

function SuspendModal({ user, onClose, onConfirm }: {
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
              : `Suspending ${user.name} will immediately block their access.`}
          </p>
          {!isSuspended && (
            <div className="mb-4">
              <label className="block text-[11.5px] font-semibold text-slate-500 mb-2">Reason <span className="text-slate-700">(optional)</span></label>
              <input
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Suspicious activity, policy violation…"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-red-500/30 transition-all"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-[13px] font-semibold text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all">Cancel</button>
            <button
              onClick={handleSubmit} disabled={loading}
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

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [creditInput, setCreditInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [lienInput, setLienInput] = useState("");
  const [savingLien, setSavingLien] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [suspendModal, setSuspendModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<AdminUser>({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("User not found");
      const data = await res.json() as { user: AdminUser };
      return data.user;
    },
    enabled: !!id,
  });

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const addCredits = async () => {
    const amount = Number(creditInput);
    if (!Number.isFinite(amount) || amount === 0) {
      toast({ title: "Enter a credit amount", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/credits`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
      setCreditInput("");
      await refetch();
      toast({ title: "Credits updated", description: `${amount > 0 ? "Added" : "Removed"} $${Math.abs(amount).toFixed(2)} credits.` });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const changeRole = async () => {
    if (!data) return;
    setRoleLoading(true);
    try {
      const newRole = data.role === "admin" ? "user" : "admin";
      const res = await fetch(`${API_URL}/api/admin/users/${id}/role`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
      await refetch();
      toast({ title: "Role updated", description: `Role changed to ${newRole}.` });
    } catch (err) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setRoleLoading(false); }
  };

  const handleLien = async () => {
    const amount = Number(lienInput);
    if (!Number.isFinite(amount) || amount < 0) {
      toast({ title: "Invalid lien amount", description: "Enter 0 or greater.", variant: "destructive" }); return;
    }
    setSavingLien(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/lien`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lienAmount: amount }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setLienInput("");
      toast({ title: "Lien updated", description: `Lien set to $${amount.toFixed(2)}.` });
    } catch (err) {
      toast({ title: "Failed to set lien", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSavingLien(false); }
  };

  const changeStatus = async (status: string, reason: string) => {
    const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
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

  const isSuspended = data?.status !== "active";

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      {suspendModal && data && (
        <SuspendModal
          user={data}
          onClose={() => setSuspendModal(false)}
          onConfirm={async (status, reason) => { await changeStatus(status, reason); setSuspendModal(false); }}
        />
      )}

      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/admin/users")}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-[22px] font-bold text-white tracking-tight">User Detail</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage this account's credits, role, and status.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl bg-white/[0.04]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-white/[0.04]" />
                <Skeleton className="h-3 w-48 bg-white/[0.03]" />
              </div>
            </div>
          </div>
        </div>
      ) : error || !data ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-[13px] text-slate-400">User not found or could not be loaded.</p>
          <button onClick={() => setLocation("/admin/users")} className="mt-4 text-[12px] text-sky-400 hover:text-sky-300 transition-colors">
            ← Back to Users
          </button>
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117] overflow-hidden">
            <div className="h-px bg-blue-500/30" />
            <div className="p-5 flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 font-black text-[22px] uppercase">
                {data.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-white text-[18px]">{data.name}</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isSuspended ? "text-red-400 border-red-500/20 bg-red-500/10" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"}`}>{data.status}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${data.role === "admin" ? "text-blue-400 border-blue-500/20 bg-blue-500/10" : "text-slate-500 border-white/10 bg-white/[0.04]"}`}>{data.role}</span>
                </div>
                <p className="text-[13px] text-slate-500 mt-1">{data.email}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Balance",  value: `$${data.credits.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400" },
              { label: "Rentals",  value: String(data.rentals),          icon: Phone,      color: "text-blue-400" },
              { label: "Joined",   value: data.createdAt ? format(new Date(data.createdAt), "MMM d, yyyy") : "—", icon: Calendar, color: "text-slate-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-2 ${color}`} />
                <div className="text-[17px] font-bold text-white">{value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Info rows */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
            <div className="flex items-center gap-2.5 px-4 py-3">
              <Mail className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="text-[13px] text-slate-300 flex-1">{data.email}</span>
              <button onClick={() => copyText(data.email, "email")} className="h-6 w-6 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-400 transition-colors">
                {copiedField === "email" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <User className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              <span className="text-[11px] text-slate-500 font-mono flex-1 select-all break-all">{data.id}</span>
              <button onClick={() => copyText(data.id, "id")} className="h-6 w-6 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-400 transition-colors shrink-0">
                {copiedField === "id" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            {data.lastSeenIp && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Globe className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span className="text-[13px] text-slate-300 font-mono flex-1">{data.lastSeenIp}</span>
                <button onClick={() => copyText(data.lastSeenIp!, "ip")} className="h-6 w-6 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-400 transition-colors">
                  {copiedField === "ip" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            )}
            {isSuspended && data.suspensionReason && (
              <div className="flex items-start gap-3 px-4 py-3">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-[13px] text-red-300">{data.suspensionReason}</span>
              </div>
            )}
          </div>

          {/* Credit adjustment */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <label className="text-[12px] font-semibold text-slate-400 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Adjust Credits
            </label>
            <div className="flex gap-2">
              <input
                type="number" step="0.01" placeholder="+10 or -5"
                value={creditInput} onChange={e => setCreditInput(e.target.value)}
                className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white text-right placeholder:text-slate-600 outline-none focus:border-blue-500/30 transition-all"
                onKeyDown={e => e.key === "Enter" && addCredits()}
              />
              <button onClick={addCredits} disabled={saving} className="h-10 px-5 rounded-xl bg-blue-600 text-[13px] font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center gap-2" style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.4)", transform: "translateY(0)", transition: "all 0.15s" }}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
              </button>
            </div>
          </div>

          {/* Silent Lien */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <label className="text-[12px] font-semibold text-slate-400 flex items-center gap-2">
              <Minus className="h-3.5 w-3.5 text-red-400" /> Silent Lien
              <span className="text-[10.5px] text-slate-700 font-normal">(deducted from next top-up)</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[12px] pointer-events-none">$</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={lienInput} onChange={e => setLienInput(e.target.value)}
                  className="w-full h-10 pl-6 pr-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-red-500/30 transition-all"
                  onKeyDown={e => e.key === "Enter" && handleLien()}
                />
              </div>
              <button onClick={handleLien} disabled={savingLien} className="h-10 px-5 rounded-xl bg-red-600/60 border border-red-500/25 text-[13px] font-bold text-white hover:bg-red-600/80 transition-all disabled:opacity-50 flex items-center gap-1.5" style={{ boxShadow: "0 4px 12px rgba(220,38,38,0.3)" }}>
                {savingLien ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set Lien"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={changeRole} disabled={roleLoading}
              className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] text-[13px] font-semibold text-blue-400 hover:bg-blue-500/[0.12] transition-all disabled:opacity-50"
              style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.15)" }}
            >
              {data.role === "admin" ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {roleLoading ? "…" : data.role === "admin" ? "Demote to User" : "Make Admin"}
            </button>
            <button
              onClick={() => setSuspendModal(true)}
              className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-[13px] font-semibold transition-all ${isSuspended ? "border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/[0.12]" : "border border-red-500/20 bg-red-500/[0.06] text-red-400 hover:bg-red-500/[0.12]"}`}
              style={{ boxShadow: isSuspended ? "0 4px 14px rgba(16,185,129,0.15)" : "0 4px 14px rgba(239,68,68,0.15)" }}
            >
              {isSuspended ? <><CheckCircle2 className="h-4 w-4" /> Reactivate</> : <><Ban className="h-4 w-4" /> Suspend</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
