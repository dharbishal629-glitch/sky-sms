import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type RevealVariant = "up" | "left" | "right" | "scale";

const variantClass: Record<RevealVariant, string> = {
  up: "reveal",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
};

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function Reveal({ children, variant = "up", delay = 0, className = "", as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hard fallback: always show content within 500ms regardless of observer
    const fallback = setTimeout(() => setInView(true), 500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          clearTimeout(fallback);
          observer.unobserve(el);
        }
      },
      { threshold: 0.01, rootMargin: "60px 0px 0px 0px" },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${variantClass[variant]} ${inView ? "in-view" : ""} ${className}`}
      style={{ ...style, minWidth: 0, width: "100%", boxSizing: "border-box" }}
    >
      {children}
    </Tag>
  );
}
