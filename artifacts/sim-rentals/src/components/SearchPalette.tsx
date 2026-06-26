import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import {
  Search, LayoutDashboard, Phone, History, CreditCard, Settings,
  LifeBuoy, Code2, Tag, Shield, SlidersHorizontal, Activity, Users,
  Bell, Bitcoin, X, ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const BASE_ITEMS = [
  { href: "/dashboard",   labelKey: "dashboard",   icon: LayoutDashboard,    group: "Navigation" },
  { href: "/rent",        labelKey: "rentNumber",   icon: Phone,              group: "Navigation" },
  { href: "/rentals",     labelKey: "myRentals",    icon: History,            group: "Navigation" },
  { href: "/payments",    labelKey: "plansBilling", icon: CreditCard,         group: "Navigation" },
  { href: "/referral",    labelKey: "referrals",    icon: Tag,                group: "Navigation" },
  { href: "/api-docs",    labelKey: "apiDocs",      icon: Code2,              group: "Navigation" },
  { href: "/support",     labelKey: "support",      icon: LifeBuoy,           group: "Navigation" },
  { href: "/settings",    labelKey: "settings",     icon: Settings,           group: "Navigation" },
];

const ADMIN_ITEMS = [
  { href: "/admin",                  labelKey: "admin",          icon: Shield,          label: "Overview",       group: "Admin" },
  { href: "/admin/services",         labelKey: null,             icon: SlidersHorizontal, label: "Services",     group: "Admin" },
  { href: "/admin/transactions",     labelKey: null,             icon: Activity,        label: "Transactions",   group: "Admin" },
  { href: "/admin/users",            labelKey: null,             icon: Users,           label: "Users",          group: "Admin" },
  { href: "/admin/coupons",          labelKey: null,             icon: Tag,             label: "Coupons",        group: "Admin" },
  { href: "/admin/notifications",    labelKey: null,             icon: Bell,            label: "Announcements",  group: "Admin" },
  { href: "/admin/support",          labelKey: null,             icon: LifeBuoy,        label: "Support",        group: "Admin" },
  { href: "/admin/gateways",         labelKey: null,             icon: Bitcoin,         label: "Gateways",       group: "Admin" },
];

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === "admin";

  const allItems = [
    ...BASE_ITEMS.map(item => ({ ...item, label: t(item.labelKey) })),
    ...(isAdmin ? ADMIN_ITEMS.map(item => ({ ...item, label: item.label })) : []),
  ];

  const filtered = query.trim()
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const grouped = filtered.reduce<Record<string, typeof allItems>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); open ? onClose() : void 0; }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const navigate = (href: string) => {
    setLocation(href);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div className="w-full max-w-lg mx-auto mt-[10vh] px-4" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 h-14 px-4 rounded-2xl border border-white/[0.12] bg-[#111827] shadow-2xl mb-3">
          <Search className="h-4 w-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages or commands…"
            className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-600 outline-none"
          />
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] transition-all shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117] shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 py-2 text-[9.5px] font-bold text-slate-700 uppercase tracking-[0.22em] border-b border-white/[0.04]">
                {group}
              </div>
              {items.map(item => (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className="h-8 w-8 rounded-lg border border-white/[0.07] bg-white/[0.03] flex items-center justify-center shrink-0 group-hover:border-white/[0.14] transition-colors">
                    <item.icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                  <span className="flex-1 text-[13px] font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <Search className="h-6 w-6 text-slate-700 mx-auto mb-2" />
              <p className="text-[12px] text-slate-600">No results for "{query}"</p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-700 mt-3">
          Press <kbd className="px-1.5 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] font-mono text-[10px] text-slate-500">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
