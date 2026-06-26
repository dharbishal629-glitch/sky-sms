import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "sky-sms-cookies-accepted";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "0");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9998] md:left-auto md:right-5 md:bottom-5 md:w-[360px]"
      style={{ animation: "cookie-enter 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <div className="rounded-2xl border border-amber-900/20 bg-[#0d1117] shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(212,168,67,0.06)] overflow-hidden">
        <div className="inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

        <div className="p-4">
          <div className="flex items-start gap-3 mb-3.5">
            <div className="h-8 w-8 rounded-xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-[14px]">We use cookies</div>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                We use essential cookies to keep you logged in and improve your experience.
                No tracking or advertising cookies.
              </p>
            </div>
            <button
              onClick={decline}
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/[0.05] transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={decline}
              className="flex-1 h-8 rounded-xl border border-white/[0.08] text-[12.5px] font-semibold text-slate-500 hover:text-slate-300 hover:border-white/[0.14] transition-all"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="flex-1 h-8 rounded-xl bg-amber-500 text-[12.5px] font-bold text-slate-900 hover:bg-amber-400 transition-all active:scale-[0.98]"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
