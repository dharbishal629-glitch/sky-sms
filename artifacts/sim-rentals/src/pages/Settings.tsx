import { useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogOut, FileText, RefreshCw, Shield,
  ExternalLink, Key, Plus, Trash2, Copy, Check, AlertTriangle,
  Gift, ChevronRight, Mail
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Reveal } from "@/components/Reveal";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface ApiKey { id: string; name: string; prefix: string; lastUsedAt: string | null; createdAt: string; }

function ApiKeysSection() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/keys`, { credentials: "include" });
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch {
      toast({ title: "Failed to load API keys", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/keys`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRevealedKey({ id: data.id, key: data.key });
      setNewName("");
      setShowForm(false);
      await fetchKeys();
      toast({ title: "API key created", description: "Save it now — it won't be shown again." });
    } catch (err) {
      toast({ title: "Failed to create key", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/keys/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (revealedKey?.id === id) setRevealedKey(null);
      toast({ title: "Key revoked" });
    } catch {
      toast({ title: "Failed to revoke key", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const atLimit = keys.length >= 3;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
            <Key className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-white">API Keys</div>
            <div className="text-[11px] text-slate-600">{keys.length}/3 keys</div>
          </div>
        </div>
        {!showForm && !atLimit && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-white/[0.09] bg-white/[0.04] text-[12px] font-semibold text-white hover:bg-white/[0.07] transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New Key
          </button>
        )}
      </div>

      <div className="p-5 space-y-3">
        {revealedKey && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10.5px] font-bold text-amber-500 uppercase tracking-wider">
                Copy now — won't be shown again
              </span>
              <button
                onClick={() => copyKey(revealedKey.key)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="bg-[#0b0e14] px-4 py-3.5 rounded-xl border border-white/[0.1] overflow-x-auto font-mono text-[12px] text-emerald-400 leading-relaxed whitespace-pre">
              {revealedKey.key}
            </pre>
            <button onClick={() => setRevealedKey(null)} className="mt-2 text-[11px] text-slate-600 hover:text-slate-400 transition-colors">
              I've saved it — dismiss
            </button>
          </div>
        )}

        {showForm && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
            <div className="text-[13px] font-semibold text-white">Name your key</div>
            <input
              type="text"
              placeholder="e.g. Production Bot, Testing Script"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
              maxLength={64}
              className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-white/[0.18] transition-all"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createKey}
                disabled={creating || !newName.trim()}
                className="h-9 px-5 rounded-xl bg-white text-[13px] font-semibold text-[#0d1117] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? "Generating…" : "Generate"}
              </button>
              <button
                onClick={() => { setShowForm(false); setNewName(""); }}
                className="h-9 px-4 rounded-xl border border-white/[0.08] text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.03]" />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-7">
            <Key className="h-8 w-8 text-slate-700 mx-auto mb-2.5" />
            <p className="text-[13px] text-slate-500">No API keys yet</p>
            <p className="text-[12px] text-slate-700 mt-1">Generate a key to access the API.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.05] bg-white/[0.015]">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white">{k.name}</div>
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    <code className="text-[11px] text-slate-600 font-mono">{k.prefix}…</code>
                    <span className="text-[11px] text-slate-700">
                      {k.lastUsedAt ? `Used ${format(new Date(k.lastUsedAt), "MMM d, yyyy")}` : "Never used"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => revokeKey(k.id)}
                  disabled={deletingId === k.id}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-400/[0.08] transition-all shrink-0 disabled:opacity-40"
                  title="Revoke key"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500/60 shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-slate-600 leading-relaxed">
            API keys grant full account access. Keep them secret.
          </p>
        </div>
      </div>
    </section>
  );
}


export default function Settings() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      <Reveal variant="up">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Settings</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage your account and preferences.</p>
        </div>
      </Reveal>

      {/* Profile */}
      <Reveal variant="up" delay={40}>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="p-5">
            {userLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full bg-white/[0.04]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40 bg-white/[0.04]" />
                  <Skeleton className="h-4 w-32 bg-white/[0.03]" />
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-white/[0.09] shrink-0">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-lg bg-white/[0.06] text-white font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[16px] font-bold text-white truncate">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="text-[9px] font-bold text-slate-400 border border-white/[0.1] rounded-full px-2 py-0.5 uppercase">Admin</span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-0.5 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[13px] font-bold text-white">${user.credits.toFixed(2)}</span>
                    <span className="text-[12px] text-slate-600">balance</span>
                    <Link href="/payments">
                      <span className="text-[12px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer font-medium flex items-center gap-0.5">
                        Add funds <ChevronRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </Reveal>

      {/* Email */}
      <Reveal variant="up" delay={50}>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">Email Address</div>
                <div className="text-[11px] text-slate-600">Your primary email</div>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {userLoading ? (
              <Skeleton className="h-4 w-48 bg-white/[0.04]" />
            ) : (
              <>
                <div>
                  <p className="text-[11px] text-slate-600 mb-1">Current email</p>
                  <p className="text-[14px] font-semibold text-white">{user?.email ?? "—"}</p>
                </div>
              </>
            )}
          </div>
        </section>
      </Reveal>

      {/* Referral */}
      <Reveal variant="up" delay={70}>
        <section className="rounded-2xl border border-amber-500/10 bg-white/[0.015] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] flex items-center justify-center shrink-0">
                <Gift className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">Referral Program</div>
                <div className="text-[11px] text-slate-600">Earn $0.50 per referral</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded-full px-2.5 py-0.5 shrink-0">$0.50</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-[12.5px] text-slate-500 leading-relaxed mb-4">
              Invite friends and earn $0.50 credit for every person who signs up through your link.
            </p>
            <Link href="/referral">
              <span className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-[12.5px] font-semibold text-amber-400 hover:bg-amber-500/12 transition-all cursor-pointer">
                View Referral Dashboard
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </section>
      </Reveal>

      {/* API Keys */}
      <Reveal variant="up" delay={80}>
        <ApiKeysSection />
      </Reveal>

      {/* Legal */}
      <Reveal variant="up" delay={90}>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
            <div className="h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-white">Legal</div>
              <div className="text-[11px] text-slate-600">Policies & terms</div>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              { href: "/terms",         icon: FileText,  label: "Terms of Service" },
              { href: "/refund-policy", icon: RefreshCw, label: "Refund Policy" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                  <item.icon className="h-4 w-4 text-slate-600" />
                  <span className="flex-1 text-[13px] font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Sign Out */}
      <Reveal variant="up" delay={100}>
        <div className="pb-2">
          <button
            onClick={logout}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-red-500/15 bg-red-500/[0.04] text-[13px] font-medium text-red-400 hover:bg-red-500/[0.09] hover:text-red-300 transition-all"
            data-testid="button-settings-signout"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </Reveal>

    </div>
  );
}
