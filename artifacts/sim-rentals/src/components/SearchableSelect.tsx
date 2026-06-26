import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
  meta?: string;
  icon?: string | null;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
};

interface DropdownPos {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

function IconDisplay({ icon }: { icon: string | null | undefined }) {
  if (!icon) return null;
  const isEmoji = icon.length <= 4 && !icon.startsWith("http");
  return isEmoji ? (
    <span className="text-base leading-none select-none">{icon}</span>
  ) : (
    <img src={icon} alt="" className="h-4 w-4 shrink-0 object-contain rounded-sm"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
  );
}

export function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  onChange,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0, maxHeight: 260 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const w = rect.width;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - w - 8));

    if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
      setPos({ top: rect.bottom + 4, left, width: w, maxHeight: Math.min(280, Math.max(120, spaceBelow)) });
    } else {
      setPos({ bottom: window.innerHeight - rect.top + 4, left, width: w, maxHeight: Math.min(280, Math.max(120, spaceAbove)) });
    }
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    calcPos();
    setOpen(true);
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 60);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const handleSelect = (optVal: string) => {
    onChange(optVal);
    handleClose();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!dropdownRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        handleClose();
      }
    };
    const onScroll = () => calcPos();
    const onResize = () => calcPos();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, calcPos, handleClose]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.searchText?.toLowerCase().includes(q))
    );
  }, [options, search]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "h-11 w-full flex items-center gap-2.5 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03]",
          "text-[13.5px] text-left transition-all duration-150",
          "hover:bg-white/[0.06] hover:border-white/[0.12]",
          "focus:outline-none focus:border-amber-500/30 focus:bg-amber-500/[0.02]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          open && "border-amber-500/30 bg-amber-500/[0.02]",
          triggerClassName
        )}
        aria-expanded={open}
      >
        {selected ? (
          <>
            <IconDisplay icon={selected.icon} />
            <span className="flex-1 truncate text-white font-medium">{selected.label}</span>
            {selected.meta && (
              <span className="text-[11.5px] text-amber-400/70 font-medium shrink-0">{selected.meta}</span>
            )}
          </>
        ) : (
          <span className="flex-1 text-slate-600 truncate">{placeholder}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-xl border border-white/[0.1] bg-[#0d1117] shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
          style={{
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
            animation: "dropdown-enter 0.15s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Search */}
          <div className="sticky top-0 bg-[#0d1117] border-b border-white/[0.06] px-3 py-2.5 flex items-center gap-2.5">
            <Search className="h-3.5 w-3.5 text-slate-600 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-slate-600 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight: (pos.maxHeight ?? 260) - 44 }}>
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-slate-600">{emptyText}</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-100",
                      "hover:bg-white/[0.05]",
                      isSelected && "bg-amber-500/[0.06]",
                      opt.disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Check className={cn("h-3.5 w-3.5 shrink-0 text-amber-400 transition-opacity", isSelected ? "opacity-100" : "opacity-0")} />
                    <IconDisplay icon={opt.icon} />
                    {!opt.icon && <span className="h-4 w-4 shrink-0 rounded-sm bg-white/[0.06]" />}
                    <span className={cn("flex-1 text-[13px] truncate min-w-0", isSelected ? "text-white font-semibold" : "text-slate-300")}>
                      {opt.label}
                    </span>
                    {opt.meta && (
                      <span className="text-[11.5px] text-amber-400/70 font-medium shrink-0">{opt.meta}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
