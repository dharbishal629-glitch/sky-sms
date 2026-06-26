import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bitcoin, Loader2, Plus, Trash2, X, Save, Eye, EyeOff,
  ShieldCheck, Key, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface CoinKey {
  coin: string;
  merchantKey: string;
  enabled: boolean;
  updatedAt: string;
}

interface IpBan {
  id: string;
  ipAddress: string;
  reason: string | null;
  bannedBy: string | null;
  createdAt: string;
}

const COIN_META: Record<string, { label: string; emoji: string; color: string }> = {
  BTC:  { label: "Bitcoin",  emoji: "₿", color: "text-orange-400" },
  LTC:  { label: "Litecoin", emoji: "Ł", color: "text-blue-400" },
  USDT: { label: "Tether",   emoji: "₮", color: "text-emerald-400" },
  SOL:  { label: "Solana",   emoji: "◎", color: "text-violet-400" },
  ETH:  { label: "Ethereum", emoji: "Ξ", color: "text-blue-300" },
  USDC: { label: "USD Coin", emoji: "$", color: "text-emerald-300" },
  TRX:  { label: "TRON",     emoji: "T", color: "text-red-400" },
  DOGE: { label: "Dogecoin", emoji: "Ð", color: "text-amber-400" },
  XMR:  { label: "Monero",   emoji: "ɱ", color: "text-orange-300" },
};
const ALL_COINS = Object.keys(COIN_META);

async function fetchCoinKeys(): Promise<CoinKey[]> {
  const res = await fetch(`${API_URL}/api/admin/coin-api-keys`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load coin API keys");
  const data = await res.json() as { keys: CoinKey[] };
  return data.keys;
}

async function fetchIpBans(): Promise<IpBan[]> {
  const res = await fetch(`${API_URL}/api/admin/ip-bans`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load IP bans");
  const data = await res.json() as { bans: IpBan[] };
  return data.bans;
}

function MaskedKey({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="font-mono text-[12px] text-slate-300 truncate">
        {show ? value : "•".repeat(Math.min(value.length, 24))}
      </span>
      <button
        onClick={() => setShow(v => !v)}
        className="shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function AdminPaymentGateways() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: coinKeys = [], isLoading: keysLoading } = useQuery({ queryKey: ["admin-coin-keys"], queryFn: fetchCoinKeys });
  const { data: ipBans = [], isLoading: bansLoading } = useQuery({ queryKey: ["admin-ip-bans"], queryFn: fetchIpBans });

  // Coin key form
  const [keyForm, setKeyForm] = useState({ coin: "BTC", merchantKey: "", enabled: true });
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // IP ban form
  const [banForm, setBanForm] = useState({ ipAddress: "", reason: "" });
  const [showBanForm, setShowBanForm] = useState(false);
  const [addingBan, setAddingBan] = useState(false);
  const [deletingBan, setDeletingBan] = useState<string | null>(null);

  const saveKey = async () => {
    if (!keyForm.merchantKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/coin-api-keys/${keyForm.coin}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantKey: keyForm.merchantKey, enabled: keyForm.enabled }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      qc.invalidateQueries({ queryKey: ["admin-coin-keys"] });
      setKeyForm({ coin: "BTC", merchantKey: "", enabled: true });
      setShowKeyForm(false);
      toast({ title: "API key saved", description: `${keyForm.coin} merchant key updated.` });
    } catch (err: any) {
      toast({ title: "Failed to save key", description: err.message, variant: "destructive" });
    } finally {
      setSavingKey(false);
    }
  };

  const deleteKey = async (coin: string) => {
    try {
      await fetch(`${API_URL}/api/admin/coin-api-keys/${coin}`, { method: "DELETE", credentials: "include" });
      qc.invalidateQueries({ queryKey: ["admin-coin-keys"] });
      toast({ title: `${coin} key removed` });
    } catch {
      toast({ title: "Failed to remove key", variant: "destructive" });
    }
  };

  const toggleKey = async (key: CoinKey) => {
    try {
      await fetch(`${API_URL}/api/admin/coin-api-keys/${key.coin}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantKey: key.merchantKey, enabled: !key.enabled }),
      });
      qc.invalidateQueries({ queryKey: ["admin-coin-keys"] });
    } catch {
      toast({ title: "Failed to toggle", variant: "destructive" });
    }
  };

  const addBan = async () => {
    if (!banForm.ipAddress.trim()) return;
    setAddingBan(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/ip-bans`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: banForm.ipAddress, reason: banForm.reason }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      qc.invalidateQueries({ queryKey: ["admin-ip-bans"] });
      setBanForm({ ipAddress: "", reason: "" });
      setShowBanForm(false);
      toast({ title: "IP banned", description: banForm.ipAddress });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setAddingBan(false);
    }
  };

  const removeBan = async (id: string) => {
    setDeletingBan(id);
    try {
      await fetch(`${API_URL}/api/admin/ip-bans/${id}`, { method: "DELETE", credentials: "include" });
      qc.invalidateQueries({ queryKey: ["admin-ip-bans"] });
      toast({ title: "IP unbanned" });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setDeletingBan(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-10">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-500 mb-1">Admin</p>
        <h1 className="text-xl font-bold text-white">Payment Gateways & Security</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">Per-coin OxaPay API keys and IP bans</p>
      </div>

      {/* ─── Coin API Keys ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400" />
            <h2 className="text-[14px] font-bold text-white">Per-Coin API Keys</h2>
          </div>
          <button
            onClick={() => setShowKeyForm(v => !v)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-bold transition-all ${
              showKeyForm
                ? "bg-white/[0.05] border border-white/[0.08] text-slate-400"
                : "bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            {showKeyForm ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Add Key</>}
          </button>
        </div>

        <p className="text-[12px] text-slate-600 mb-4">
          Assign per-coin OxaPay merchant keys. When a user selects a coin at checkout, its key is used. Falls back to the default env key.
        </p>

        {showKeyForm && (
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-5 mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coin</label>
                <select
                  value={keyForm.coin}
                  onChange={e => setKeyForm(f => ({ ...f, coin: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white outline-none focus:border-amber-500/40 appearance-none cursor-pointer"
                >
                  {ALL_COINS.map(c => <option key={c} value={c} className="bg-[#0d1120]">{c} — {COIN_META[c]?.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enabled</label>
                <button
                  type="button"
                  onClick={() => setKeyForm(f => ({ ...f, enabled: !f.enabled }))}
                  className={`w-full h-10 rounded-xl border flex items-center justify-center gap-2 text-[12px] font-semibold transition-all ${
                    keyForm.enabled
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {keyForm.enabled ? <><ToggleRight className="h-4 w-4" /> Active</> : <><ToggleLeft className="h-4 w-4" /> Disabled</>}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OxaPay Merchant Key</label>
              <input
                type="password"
                value={keyForm.merchantKey}
                onChange={e => setKeyForm(f => ({ ...f, merchantKey: e.target.value }))}
                placeholder="Paste your OxaPay merchant key…"
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 transition-all font-mono"
              />
            </div>
            <button
              onClick={saveKey}
              disabled={savingKey || !keyForm.merchantKey.trim()}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[13px] font-bold text-slate-900 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {savingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save {keyForm.coin} Key
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.02]">
          {keysLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          ) : coinKeys.length === 0 ? (
            <div className="py-12 text-center">
              <Key className="h-8 w-8 text-slate-800 mx-auto mb-2" />
              <p className="text-[13px] text-slate-600">No per-coin keys configured — using default OxaPay key.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {coinKeys.map(key => {
                const meta = COIN_META[key.coin] ?? { label: key.coin, emoji: key.coin[0], color: "text-slate-400" };
                return (
                  <div key={key.coin} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center shrink-0">
                      <span className={`text-[16px] font-black ${meta.color}`}>{meta.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-white">{key.coin}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          key.enabled
                            ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                            : "text-slate-500 border-white/[0.08] bg-white/[0.03]"
                        }`}>
                          <CheckCircle2 className="h-2 w-2" /> {key.enabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <MaskedKey value={key.merchantKey} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleKey(key)}
                        className="h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        {key.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteKey(key.coin)}
                        className="h-7 w-7 rounded-lg border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center text-red-400 hover:bg-red-500/[0.12] transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── IP Bans ───────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-red-400" />
            <h2 className="text-[14px] font-bold text-white">IP Bans</h2>
            {ipBans.length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                {ipBans.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowBanForm(v => !v)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-bold transition-all ${
              showBanForm
                ? "bg-white/[0.05] border border-white/[0.08] text-slate-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15"
            }`}
          >
            {showBanForm ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Plus className="h-3.5 w-3.5" /> Ban IP</>}
          </button>
        </div>

        {showBanForm && (
          <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-5 mb-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">IP Address</label>
              <input
                type="text"
                value={banForm.ipAddress}
                onChange={e => setBanForm(f => ({ ...f, ipAddress: e.target.value }))}
                placeholder="e.g. 192.168.1.1"
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-red-500/30 transition-all font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason <span className="text-slate-700">(optional)</span></label>
              <input
                type="text"
                value={banForm.reason}
                onChange={e => setBanForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Abuse, fraud, scraping…"
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-red-500/30 transition-all"
              />
            </div>
            <button
              onClick={addBan}
              disabled={addingBan || !banForm.ipAddress.trim()}
              className="h-10 px-6 rounded-xl bg-red-600 text-[13px] font-bold text-white hover:bg-red-500 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {addingBan ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
              Ban {banForm.ipAddress || "IP"}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.02]">
          {bansLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            </div>
          ) : ipBans.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="h-8 w-8 text-slate-800 mx-auto mb-2" />
              <p className="text-[13px] text-slate-600">No IP bans. The platform is open to all IPs.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {ipBans.map(ban => (
                <div key={ban.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="h-8 w-8 rounded-lg bg-red-500/[0.08] border border-red-500/15 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-white font-mono">{ban.ipAddress}</div>
                    {ban.reason && <div className="text-[11px] text-slate-600 truncate">{ban.reason}</div>}
                    {ban.bannedBy && <div className="text-[10px] text-slate-700">By {ban.bannedBy}</div>}
                  </div>
                  <button
                    onClick={() => removeBan(ban.id)}
                    disabled={deletingBan === ban.id}
                    className="h-7 w-7 rounded-lg border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center text-red-400 hover:bg-red-500/[0.12] transition-all disabled:opacity-40 shrink-0"
                  >
                    {deletingBan === ban.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
