import { useId } from "react";

export function SkySmsLogoMark({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `smsChevGrad_${uid}`;
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="60%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M4 5L13.5 14L4 23" stroke={`url(#${gradId})`} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 5L22.5 14L13 23" stroke={`url(#${gradId})`} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SkySmsLogo({
  size = "md",
  textClassName = "text-white",
}: {
  size?: "xs" | "sm" | "md" | "lg";
  textClassName?: string;
}) {
  const sizes = {
    xs: { mark: "h-4 w-4", text: "text-[12px]", gap: "gap-1.5" },
    sm: { mark: "h-5 w-5", text: "text-[13px]", gap: "gap-1.5" },
    md: { mark: "h-6 w-6", text: "text-[15px]", gap: "gap-2" },
    lg: { mark: "h-8 w-8", text: "text-[20px]", gap: "gap-2.5" },
  }[size];

  return (
    <span className={`flex items-center ${sizes.gap}`}>
      <SkySmsLogoMark className={`${sizes.mark} shrink-0`} />
      <span className={`font-display font-black tracking-tight leading-none ${sizes.text} ${textClassName}`}>
        SKY SMS
      </span>
    </span>
  );
}
