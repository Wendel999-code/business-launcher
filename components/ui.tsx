"use client";
import { ReactNode, useEffect, useRef } from "react";
import { X, ArrowUpRight, ChevronRight, Coffee } from "lucide-react";
import { motion } from "framer-motion";
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Coffee size={25} strokeWidth={1.5} />
      </span>
      <div>
        <strong>
          brew<span> coffee</span>
        </strong>
        <small>SALES & INVENTORY</small>
      </div>
    </div>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const text = String(children);
  const kind =
    /Healthy|Stock$|Received|Submitted|Active|Transfer In/.test(text) &&
    !text.includes("Out") &&
    !text.includes("Low")
      ? "green"
      : /Critical|Out of|Cancelled|Damaged|Wastage/.test(text)
        ? "red"
        : /Low|Pending/.test(text)
          ? "amber"
          : /Transit|Dispatched/.test(text)
            ? "blue"
            : "neutral";
  return (
    <span className={`badge ${kind}`}>
      <i />
      {children}
    </span>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function ViewLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ChevronRight size={14} />
    </button>
  );
}
export function Stat({
  label,
  value,
  change,
  caption,
  icon,
  warning = false,
  spark,
}: {
  label: string;
  value: string;
  change?: string;
  caption: string;
  icon: ReactNode;
  warning?: boolean;
  spark?: boolean;
}) {
  return (
    <motion.div
      className="stat"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${warning ? "warn" : ""}`}>{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        {spark && (
          <svg width="78" height="34" viewBox="0 0 78 34" aria-hidden="true">
            <path
              d="M1 29L10 23L17 26L25 14L34 18L42 8L50 13L57 5L66 8L77 1"
              fill="none"
              stroke="#66947d"
              strokeWidth="1.7"
            />
          </svg>
        )}
      </div>
      <div className="stat-foot">
        {change && (
          <span className={warning ? "warn-text" : "positive"}>
            {warning ? null : <ArrowUpRight size={12} />} {change}
          </span>
        )}
        <span>{caption}</span>
      </div>
    </motion.div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex="0"]',
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
