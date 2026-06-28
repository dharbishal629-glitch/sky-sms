import { useGetDashboard, useGetMe } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, AlertCircle, ChevronRight, Plus, Clock, ArrowRight } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

function svcIcon(domain: string) {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
}

const serviceIcons: Record<string, string> = {
  Telegram: svcIcon("telegram.org"),
  WhatsApp: svcIcon("web.whatsapp.com"),
  Google: svcIcon("google.com"),
  Instagram: svcIcon("instagram.com"),
  Facebook: svcIcon("facebook.com"),
  "X / Twitter": svcIcon("x.com"),
  Discord: svcIcon("discord.com"),
  Amazon: svcIcon("amazon.com"),
  TikTok: svcIcon("tiktok.com"),
  Microsoft: svcIcon("microsoft.com"),
  Snapchat: svcIcon("snapchat.com"),
  LinkedIn: svcIcon("linkedin.com"),
};

function ActiveTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, differenceInSeconds(new Date(expiresAt), new Date())));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const urgent = timeLeft < 120;
  return (
    <span className={`font-mono text-[11px] font-bold tabular-nums ${urgent ? "text-rose-400" : "text-sky-400"}`}>
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

const statusMap: Record<string, { label: string; dot: string }> = {
  active:       { label: "Active",    dot: "bg-emerald-400" },
  completed:    { label: "Done",      dot: "bg-slate-500" },
  sms_received: { label: "SMS ✓",     dot: "bg-emerald-400" },
  cancelled:    { label: "Cancelled", dot: "bg-slate-600" },
  expired:      { label: "Expired",   dot: "bg-slate-600" },
};

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboard();
  const { data: user } = useGetMe();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 page-enter">
        <div className="space-y-1">
          <Skeleton className="h-7 w-52 bg-white/[0.05]" />
          <Skeleton className="h-4 w-40 bg-white/[0.03]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-white/[0.06] p-5 space-y-3">
              <Skeleton className="h-3 w-16 bg-white/[0.04]" />
              <Skeleton className="h-8 w-20 bg-white/[0.04]" />
              <Skeleton className="h-3 w-24 bg-white/[0.03]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
        <p className="text-[13px] text-slate-500">Could not load dashboard.</p>
      </div>
    );
  }

  const stats = [
    { label: t("balance"),        value: `$${(data?.balance ?? 0).toFixed(2)}`, sub: data?.balance === 0 ? t("addFunds") : "Available",  link: "/payments" },
    { label: t("filterActive"),   value: String(data?.activeRentals ?? 0),       sub: t("activeRentals"),                                 link: "/rentals" },
    { label: "Completed",         value: String(data?.totalRentals ?? 0),         sub: "total rentals",                                    link: "/rentals" },
    { label: "SMS",               value: String(data?.smsReceived ?? 0),           sub: t("smsReceived"),                                   link: "/rentals" },
  ];

  const rentals = data?.recentRentals ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-7 page-enter">

      {/* Header */}
      <div>
        <h1 className="font-display text-[22px] font-bold text-white tracking-tight">
          {t("welcomeBack")}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-[13px] text-slate-500 mt-0.5">{t("recentActivity")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, sub, link }) => (
          <Link key={label} href={link}>
            <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-2">{label}</p>
              <p className="font-display text-[28px] font-black text-white leading-none tracking-tight">{value}</p>
              <p className="text-[11px] text-slate-600 mt-1.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Rentals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-white">{t("recentActivity")}</h2>
          <Link href="/rentals">
            <span className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-white transition-colors cursor-pointer font-medium">
              {t("viewAllRentals")} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {rentals.length === 0 ? (
            <div className="py-14 text-center">
              <div className="h-11 w-11 rounded-xl border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                <Phone className="h-5 w-5 text-slate-700" />
              </div>
              <p className="text-[13px] text-slate-400 font-medium mb-1">{t("noActiveRentals")}</p>
              <p className="text-[12px] text-slate-700">Rent your first number to get started.</p>
              <Link href="/rent">
                <span className="inline-flex items-center gap-1.5 mt-4 text-[12px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer font-semibold">
                  <ArrowRight className="h-3 w-3" /> {t("getRentNow")}
                </span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {rentals.map((rental: any) => {
                const st = statusMap[rental.status] ?? { label: rental.status, dot: "bg-slate-600" };
                const icon = serviceIcons[rental.serviceName];
                return (
                  <Link key={rental.id} href="/rentals">
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.025] transition-colors cursor-pointer">
                      {icon ? (
                        <img src={icon} alt="" className="h-7 w-7 rounded-full object-cover shrink-0 bg-white/[0.05]" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="h-7 w-7 rounded-full border border-white/[0.08] flex items-center justify-center shrink-0">
                          <Phone className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-white truncate">{rental.serviceName}</span>
                          <span className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot} shrink-0`} />
                            <span className="text-[10px] text-slate-500">{st.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-500 truncate">{rental.phoneNumber}</span>
                          <span className="text-[11px] text-slate-700">·</span>
                          <span className="text-[11px] text-slate-600">{rental.countryName}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[12px] font-bold text-white">${rental.price.toFixed(2)}</span>
                        {rental.status === "active" && <ActiveTimer expiresAt={rental.expiresAt} />}
                        {rental.status !== "active" && (
                          <span className="text-[10px] text-slate-700">
                            {format(new Date(rental.createdAt), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/rent">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-200 cursor-pointer group">
            <div className="h-9 w-9 rounded-xl border border-white/[0.1] bg-white/[0.05] flex items-center justify-center shrink-0 group-hover:border-sky-500/30 group-hover:bg-sky-500/[0.1] transition-all">
              <Phone className="h-4 w-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">{t("rentNumber")}</p>
              <p className="text-[11px] text-slate-600">Get a virtual SIM</p>
            </div>
          </div>
        </Link>
        <Link href="/payments">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-200 cursor-pointer group">
            <div className="h-9 w-9 rounded-xl border border-white/[0.1] bg-white/[0.05] flex items-center justify-center shrink-0 group-hover:border-sky-500/30 group-hover:bg-sky-500/[0.1] transition-all">
              <Plus className="h-4 w-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">{t("addFunds")}</p>
              <p className="text-[11px] text-slate-600">{t("topUp")}</p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
