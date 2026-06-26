import { useState, useEffect } from "react";
import { useGetAdminOverview } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Phone, CreditCard, Activity, CheckCircle2, AlertCircle, Link2, Save,
  MessageCircle, Gift, ToggleLeft, ToggleRight, DollarSign, TrendingUp, TrendingDown,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCommunityLinks } from "@/hooks/useCommunityLinks";
import { useToast } from "@/hooks/use-toast";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

function ReferralSettingsCard() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [bonusAmount, setBonusAmount] = useState("0.50");
  const [minDepositAmount, setMinDepositAmount] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/referral-settings`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setEnabled(d.enabled);
        setBonusAmount(Number(d.bonusAmount).toFixed(2));
        setMinDepositAmount(Number(d.minDepositAmount ?? 0).toFixed(2));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    const amt = parseFloat(bonusAmount);
    const minDep = parseFloat(minDepositAmount);
    if (isNaN(amt) || amt < 0 || amt > 100) {
      toast({ title: "Invalid bonus amount", variant: "destructive" }); return;
    }
    if (isNaN(minDep) || minDep < 0) {
      toast({ title: "Invalid minimum deposit amount", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/referral-settings`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, bonusAmount: amt, minDepositAmount: minDep }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Referral settings saved", description: `Program ${enabled ? "enabled" : "disabled"}, $${amt.toFixed(2)} bonus per referral.` });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Gift className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <div className="font-bold text-white text-[14px]">Referral Program</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bonus amounts and deposit requirements</div>
        </div>
        <div className="ml-auto">
          <button onClick={() => setEnabled(e => !e)} className="transition-colors">
            {enabled
              ? <ToggleRight className="h-8 w-8 text-amber-400" />
              : <ToggleLeft className="h-8 w-8 text-slate-600" />}
          </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-xl bg-white/[0.04]" />
            <Skeleton className="h-10 rounded-xl bg-white/[0.04]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">Bonus per referral</label>
                <div className="flex items-center gap-2 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                  <span className="text-slate-500 text-[13px]">$</span>
                  <input
                    type="number" min="0" max="100" step="0.01"
                    value={bonusAmount}
                    onChange={e => setBonusAmount(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-600"
                    placeholder="0.50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500">Min deposit to unlock</label>
                <div className="flex items-center gap-2 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3">
                  <span className="text-slate-500 text-[13px]">$</span>
                  <input
                    type="number" min="0" max="10000" step="0.01"
                    value={minDepositAmount}
                    onChange={e => setMinDepositAmount(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-600"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl border text-[12px] ${enabled ? "border-amber-500/20 bg-amber-500/[0.05] text-amber-300" : "border-white/[0.06] bg-white/[0.02] text-slate-600"}`}>
              {enabled ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Shield className="h-3.5 w-3.5 shrink-0" />}
              {enabled ? "Users can share codes and earn bonuses" : "Referral codes are currently disabled for all users"}
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-500/15 border border-amber-500/25 text-[12.5px] font-semibold text-amber-300 hover:bg-amber-500/25 transition-all disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function maskProviderName(name: string): string {
  return name === "Hero SMS" ? "SKY SMS" : name;
}

export default function AdminOverview() {
  const { data, isLoading, error } = useGetAdminOverview();
  const { discord, telegram, setDiscord, setTelegram } = useCommunityLinks();
  const { toast } = useToast();
  const [discordDraft, setDiscordDraft] = useState(discord);
  const [telegramDraft, setTelegramDraft] = useState(telegram);
  const [saving, setSaving] = useState(false);

  const saveLinks = () => {
    setSaving(true);
    setDiscord(discordDraft.trim());
    setTelegram(telegramDraft.trim());
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Community links saved", description: "Invite links updated and visible to all users." });
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2 bg-white/[0.05]" />
          <Skeleton className="h-4 w-60 bg-white/[0.04]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/[0.04]" />)}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-52 w-full rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-52 w-full rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <div className="h-14 w-14 rounded-2xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Failed to load overview</h2>
        <p className="text-slate-500 mt-1.5 text-sm">Please refresh the page.</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: `$${data.revenue.toFixed(2)}`,
      sub: "Lifetime payments",
      icon: CreditCard,
      iconCls: "bg-emerald-400/10 border-emerald-400/20 text-emerald-400",
      valueCls: "text-emerald-400",
      trend: TrendingUp,
      trendCls: "text-emerald-500",
    },
    {
      label: "Total Users",
      value: String(data.totalUsers),
      sub: "Registered accounts",
      icon: Users,
      iconCls: "bg-blue-400/10 border-blue-400/20 text-blue-400",
      valueCls: "text-white",
      trend: TrendingUp,
      trendCls: "text-blue-500",
    },
    {
      label: "Active Rentals",
      value: String(data.activeRentals),
      sub: "Currently processing",
      icon: Phone,
      iconCls: "bg-violet-400/10 border-violet-400/20 text-violet-400",
      valueCls: "text-white",
      trend: data.activeRentals > 0 ? TrendingUp : TrendingDown,
      trendCls: data.activeRentals > 0 ? "text-violet-500" : "text-slate-700",
    },
    {
      label: "Pending Payments",
      value: String(data.pendingPayments),
      sub: "Awaiting confirmation",
      icon: Activity,
      iconCls: "bg-amber-400/10 border-amber-400/20 text-amber-400",
      valueCls: data.pendingPayments > 0 ? "text-amber-400" : "text-white",
      trend: data.pendingPayments > 0 ? TrendingUp : TrendingDown,
      trendCls: data.pendingPayments > 0 ? "text-amber-500" : "text-slate-700",
    },
  ];

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white tracking-tight">Admin Overview</h1>
        <p className="text-slate-500 mt-1 text-[13px]">Platform metrics and configuration.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 relative overflow-hidden group hover:border-white/[0.12] transition-colors">
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(59,130,246,0.04) 0%, transparent 70%)" }} />
            <div className="flex items-start justify-between mb-4">
              <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${stat.iconCls}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <stat.trend className={`h-3.5 w-3.5 ${stat.trendCls}`} />
            </div>
            <div className={`text-[2rem] font-black leading-none mb-1 ${stat.valueCls}`}>{stat.value}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</div>
            <p className="text-[11px] text-slate-600 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Referral settings */}
      <ReferralSettingsCard />

      {/* Provider status + Community links */}
      <div className="grid gap-5 md:grid-cols-2">

        {/* Provider status */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-white text-[14px]">Provider Status</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Upstream SMS provider health</div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {data.providerStatuses.map(provider => (
              <div key={provider.name} className="flex items-start justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-colors">
                <div className="flex items-start gap-3">
                  {provider.mode === "live" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-[13px] text-white">{maskProviderName(provider.name)}</div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{provider.message}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 font-bold ${provider.mode === "live" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                  {provider.mode}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Community links */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Link2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="font-bold text-white text-[14px]">Community Links</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Appear as buttons in the user sidebar</div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Discord */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400">
                <MessageCircle className="h-3 w-3 text-indigo-400" />
                Discord Invite Link
              </label>
              <input
                type="url"
                placeholder="https://discord.gg/your-invite"
                value={discordDraft}
                onChange={e => setDiscordDraft(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
              />
            </div>
            {/* Telegram */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400">
                <MessageCircle className="h-3 w-3 text-sky-400" />
                Telegram Invite Link
              </label>
              <input
                type="url"
                placeholder="https://t.me/your-channel"
                value={telegramDraft}
                onChange={e => setTelegramDraft(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/40 transition-all"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={saveLinks}
                disabled={saving}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-500/15 border border-blue-500/25 text-[12.5px] font-semibold text-blue-300 hover:bg-blue-500/25 transition-all disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save Links"}
              </button>
              {(discord || telegram) && (
                <div className="flex gap-2">
                  {discord && (
                    <a href={discord} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-300 border border-indigo-400/20 bg-indigo-400/8 rounded-full px-3 py-1 hover:bg-indigo-400/15 transition-colors font-medium">
                      Discord ✓
                    </a>
                  )}
                  {telegram && (
                    <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-[11px] text-sky-300 border border-sky-400/20 bg-sky-400/[0.08] rounded-full px-3 py-1 hover:bg-sky-400/15 transition-colors font-medium">
                      Telegram ✓
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
