import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityLinks } from "@/hooks/useCommunityLinks";
import {
  LayoutDashboard, Phone, History, CreditCard, Settings, Shield, Users,
  Activity, SlidersHorizontal, LogOut, Menu, X, LifeBuoy, Tag, Bell,
  Check, Info, AlertCircle, Code2, Bitcoin, Search, Plus, ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkySmsLogo } from "@/components/SkySmsLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchPalette } from "@/components/SearchPalette";
import { useLanguage, LANGUAGES, type LangCode } from "@/hooks/useLanguage";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

const mainNavItems = [
  { href: "/dashboard", labelKey: "dashboard",   icon: LayoutDashboard },
  { href: "/rent",      labelKey: "rentNumber",   icon: Phone },
  { href: "/rentals",   labelKey: "myRentals",    icon: History },
  { href: "/payments",  labelKey: "plansBilling", icon: CreditCard },
  { href: "/referral",  labelKey: "referrals",    icon: Tag },
  { href: "/api-docs",  labelKey: "apiDocs",      icon: Code2 },
];

const bottomNavItems = [
  { href: "/settings", labelKey: "settings", icon: Settings },
  { href: "/support",  labelKey: "support",  icon: LifeBuoy, badge: true },
];

const adminItems = [
  { href: "/admin",                 labelKey: "admin",  icon: Shield,           label: "Overview"     },
  { href: "/admin/services",        labelKey: null,     icon: SlidersHorizontal,label: "Services"     },
  { href: "/admin/transactions",    labelKey: null,     icon: Activity,         label: "Transactions" },
  { href: "/admin/users",           labelKey: null,     icon: Users,            label: "Users"        },
  { href: "/admin/coupons",         labelKey: null,     icon: Tag,              label: "Coupons"      },
  { href: "/admin/notifications",   labelKey: null,     icon: Bell,             label: "Announcements"},
  { href: "/admin/support",         labelKey: null,     icon: LifeBuoy,         label: "Support"      },
  { href: "/admin/gateways",        labelKey: null,     icon: Bitcoin,          label: "Gateways"     },
  { href: "/admin/status",          labelKey: null,     icon: Activity,         label: "Status Page"  },
];

interface Notification {
  id: number; title: string; message: string; type: string; read: boolean; createdAt: string;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/notifications`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[] };
        setNotifications(data.notifications ?? []);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); const i = setInterval(fetchNotifications, 60_000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const markRead = async (id: number) => {
    try { await fetch(`${BASE}/api/notifications/${id}/read`, { method: "POST", credentials: "include" }); setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); } catch { }
  };
  const markAllRead = async () => {
    try { await fetch(`${BASE}/api/notifications/read-all`, { method: "POST", credentials: "include" }); setNotifications(p => p.map(n => ({ ...n, read: true }))); } catch { }
  };

  const typeIcon = (type: string) => {
    if (type === "success") return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    if (type === "warning") return <AlertCircle className="h-3.5 w-3.5 text-amber-400" />;
    return <Info className="h-3.5 w-3.5 text-sky-400" />;
  };
  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(!open)} className="relative h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-150" title="Notifications">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-sky-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#0d1117] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[12px] font-bold text-white">Notifications</span>
            {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold transition-colors">Mark all read</button>}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 space-y-3">{[0,1,2].map(i => (<div key={i} className="flex gap-3"><Skeleton className="h-7 w-7 rounded-lg bg-white/[0.04] shrink-0" /><div className="flex-1 space-y-1.5"><Skeleton className="h-2.5 w-28 bg-white/[0.04]" /><Skeleton className="h-2 w-40 bg-white/[0.03]" /></div></div>))}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center"><Bell className="h-7 w-7 text-slate-700 mx-auto mb-2" /><p className="text-[12px] text-slate-600">No notifications yet</p></div>
            ) : (
              notifications.map(n => (
                <button key={n.id} onClick={() => markRead(n.id)} className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/[0.03] transition-colors ${!n.read ? "bg-sky-500/[0.03]" : ""}`}>
                  <div className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center mt-0.5 ${!n.read ? "bg-sky-500/12 border border-sky-500/20" : "bg-white/[0.04] border border-white/[0.06]"}`}>{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[12px] font-semibold text-white truncate">{n.title}</span>{!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-700 mt-1 block">{timeAgo(n.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageDropdown() {
  const { lang, setLang, current } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 h-9 px-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[12px] text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
      >
        <span className="text-base leading-none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))", transform: "perspective(80px) rotateX(8deg)", display: "inline-block" }}>{current.flag}</span>
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 right-0 rounded-xl border border-white/[0.08] bg-[#0d1117] shadow-2xl z-50 overflow-hidden py-1">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code as LangCode); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors ${lang === l.code ? "text-white bg-white/[0.06]" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}
            >
              <span className="text-base leading-none" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))", transform: "perspective(80px) rotateX(6deg)", display: "inline-block" }}>{l.flag}</span>
              <span className="flex-1 text-left font-medium">{l.label}</span>
              <span className="text-[10.5px] text-slate-600">{l.nativeName}</span>
              {lang === l.code && <Check className="h-3 w-3 text-sky-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ href, label, icon: Icon, active, onClick, badge }: {
  href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void; badge?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <Link href={href}>
      <span
        onClick={onClick}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer select-none ${
          active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        <Icon className={`h-[15px] w-[15px] shrink-0 transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span className="flex-1 leading-none">{label}</span>
        {badge && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            {t("online")}
          </span>
        )}
      </span>
    </Link>
  );
}

function SidebarContent({ onNav, onSearch }: { onNav?: () => void; onSearch?: () => void }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe();
  const { logout } = useAuth();
  const { discord, telegram } = useCommunityLinks();
  const { t } = useLanguage();
  const hasCommunity = discord || telegram;
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between shrink-0">
        <Link href="/dashboard">
          <span className="flex items-center gap-2.5 cursor-pointer" onClick={onNav}>
            <SkySmsLogo size="md" />
          </span>
        </Link>
        {!onNav && <NotificationBell />}
      </div>

      {/* Search bar */}
      <div className="px-3 mb-3 shrink-0">
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 h-9 px-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-500 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-150 cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[12px] flex-1 text-left">{t("search")}</span>
          <kbd className="hidden sm:flex h-5 items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 text-[9px] font-mono text-slate-600">⌘K</kbd>
        </button>
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto px-3 pb-1 space-y-0.5 min-h-0">
        {mainNavItems.map(item => {
          const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href + "/"));
          return <NavItem key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} active={active} onClick={onNav} />;
        })}

        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <div className="mb-1.5 px-3 text-[9.5px] font-bold text-slate-700 uppercase tracking-[0.22em]">{t("admin")}</div>
            {adminItems.map(item => {
              const active = location === item.href || (item.href !== "/admin" && location.startsWith(item.href + "/"));
              return <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={active} onClick={onNav} />;
            })}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="px-3 pt-2 pb-1 border-t border-white/[0.05] space-y-0.5 shrink-0">
        {bottomNavItems.map(item => {
          const active = location === item.href;
          return <NavItem key={item.href} href={item.href} label={t(item.labelKey)} icon={item.icon} active={active} onClick={onNav} badge={item.badge} />;
        })}
      </div>

      {/* Community links */}
      {hasCommunity && (
        <div className="px-3 pb-2 flex gap-2 shrink-0">
          {discord && (
            <a href={discord} target="_blank" rel="noopener noreferrer" onClick={onNav}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-indigo-400/15 bg-indigo-400/5 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-400/10 transition-all duration-150">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.01.043.025.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Discord
            </a>
          )}
          {telegram && (
            <a href={telegram} target="_blank" rel="noopener noreferrer" onClick={onNav}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-sky-400/15 bg-sky-400/5 text-[11px] font-semibold text-sky-400 hover:bg-sky-400/10 transition-all duration-150">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
          )}
        </div>
      )}

      {/* Language */}
      <div className="px-3 pb-2 shrink-0">
        <LanguageDropdown />
      </div>

      {/* Add funds button */}
      <div className="px-3 pb-3 shrink-0">
        <Link href="/payments">
          <span onClick={onNav} className="flex items-center gap-2 w-full h-11 px-4 rounded-xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/[0.08] text-[13px] font-bold text-white transition-all cursor-pointer" data-testid="link-buy-credits">
            <Plus className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t("addFunds")}</span>
            {isLoading ? (
              <Skeleton className="h-4 w-12 bg-white/[0.08]" />
            ) : (
              <span className="text-slate-400 font-semibold" data-testid="text-user-credits">
                ${(user?.credits ?? 0).toFixed(2)}
              </span>
            )}
          </span>
        </Link>
      </div>

      {/* User profile */}
      <div className="px-3 pb-4 border-t border-white/[0.05] pt-3 shrink-0">
        {isLoading ? (
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="h-8 w-8 rounded-full bg-white/[0.04] shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20 bg-white/[0.04]" />
              <Skeleton className="h-2.5 w-28 bg-white/[0.03]" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-2.5 px-1">
            <Avatar className="h-8 w-8 border border-white/[0.1] shrink-0">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-[11px] font-bold bg-white/[0.08] text-white">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-white truncate" data-testid="text-username">{user.name}</div>
              <div className="text-[10.5px] text-slate-600 truncate">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.08] transition-all duration-150"
              data-testid="button-signout"
              title={t("signOut")}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: user } = useGetMe();

  const openSidebar = () => { setClosing(false); setMobileOpen(true); };
  const closeSidebar = () => { setClosing(true); setTimeout(() => { setMobileOpen(false); setClosing(false); }, 260); };

  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="app-shell min-h-screen flex">
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col fixed inset-y-0 left-0 z-30 border-r border-white/[0.05] bg-[#0d1117]">
        <SidebarContent onSearch={() => setSearchOpen(true)} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm ${closing ? "overlay-fade-out" : "overlay-fade-in"}`} onClick={closeSidebar} />
          <aside className={`relative z-50 w-[260px] flex flex-col h-full bg-[#0d1117] border-r border-white/[0.06] shadow-2xl ${closing ? "sidebar-slide-out" : "sidebar-slide-in"}`}>
            <button onClick={closeSidebar} className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-150 z-10">
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNav={closeSidebar} onSearch={() => { closeSidebar(); setSearchOpen(true); }} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col md:pl-[240px]">

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14 border-b border-white/[0.05] bg-[#0d1117]/95 backdrop-blur-sm">
          <button onClick={openSidebar} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-150 active:scale-95 shrink-0">
            <Menu className="h-[18px] w-[18px]" />
          </button>
          <Link href="/dashboard">
            <span className="flex items-center gap-2 cursor-pointer"><SkySmsLogo size="sm" /></span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            {user && <span className="text-[13px] font-bold text-white">${user.credits.toFixed(2)}</span>}
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 min-w-0 p-5 md:p-8 w-full max-w-screen-xl mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
