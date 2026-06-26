import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const DURATION = 5000;

interface ToastItemProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  onDismiss: (id: string) => void;
}

function ToastItem({ id, title, description, variant = "default", onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number>(0);

  // touch swipe
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 340);
  }, [id, onDismiss]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dismiss]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
    cancelAnimationFrame(rafRef.current);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    setSwipeX(touchDeltaX.current);
  };
  const onTouchEnd = () => {
    setSwiping(false);
    if (Math.abs(touchDeltaX.current) > 80) {
      dismiss();
    } else {
      setSwipeX(0);
      startTime.current = Date.now() - ((100 - progress) / 100) * DURATION;
      const tick = () => {
        const elapsed = Date.now() - startTime.current;
        const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
        setProgress(pct);
        if (pct > 0) rafRef.current = requestAnimationFrame(tick);
        else dismiss();
      };
      rafRef.current = requestAnimationFrame(tick);
    }
    touchDeltaX.current = 0;
  };

  const isError = variant === "destructive";
  const Icon = isError ? AlertCircle : title?.toString?.()?.toLowerCase?.().includes("warn") ? Info : CheckCircle2;
  const accentColor = isError ? "#f87171" : "#34d399";
  const bgBorder = isError ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.12)";
  const iconBg = isError ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.08)";
  const opacity = Math.max(0.3, 1 - Math.abs(swipeX) / 200);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: exiting
          ? "translateX(120%) scale(0.92)"
          : swiping
          ? `translateX(${swipeX}px) rotate(${swipeX * 0.03}deg)`
          : "translateX(0) scale(1)",
        opacity: exiting ? 0 : opacity,
        transition: swiping ? "none" : exiting ? "transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.32s ease" : "transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease",
        animation: exiting ? "none" : "toast-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
        touchAction: "pan-y",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
        position: "relative",
        overflow: "hidden",
        borderRadius: 14,
        border: `1px solid ${bgBorder}`,
        background: "rgba(8,10,20,0.97)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        minWidth: 300,
        maxWidth: 380,
        width: "calc(100vw - 32px)",
      }}
    >
      {/* content */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 14px 14px 14px" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: iconBg, border: `1px solid ${isError ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.15)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color={accentColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{title}</div>
          )}
          {description && (
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>{description}</div>
          )}
        </div>
        <button
          onClick={dismiss}
          style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 6,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#475569", cursor: "pointer", transition: "color .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
        >
          <X size={12} />
        </button>
      </div>

      {/* live progress line */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "rgba(255,255,255,0.04)",
      }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
          borderRadius: "0 2px 2px 0",
          transition: "width 0.1s linear",
          boxShadow: `0 0 8px ${accentColor}60`,
        }} />
      </div>

      {/* swipe hint fades */}
      {swiping && Math.abs(swipeX) > 20 && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 14,
          background: `linear-gradient(${swipeX > 0 ? "to right" : "to left"}, rgba(255,255,255,0.03), transparent)`,
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const visibleToasts = toasts.filter((t) => t.open !== false);

  if (visibleToasts.length === 0) return null;

  return createPortal(
    <div style={{
      position: "fixed",
      top: 16,
      right: 16,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "flex-end",
      pointerEvents: "none",
    }}>
      {visibleToasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem
            id={t.id}
            title={t.title}
            description={t.description}
            variant={t.variant}
            onDismiss={dismiss}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}
