"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronLeft, ChevronRight, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- App state: screen stack, navigation, toasts -------------------------------

export interface ProtoNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface StackEntry {
  screen: string;
  id?: string;
  label?: string;
}

// Each prototype keeps a stack of screens so visitors can open a record, go
// deeper, and come back, like a real app.
export function useProtoApp(home: string) {
  const [stack, setStack] = useState<StackEntry[]>([{ screen: home }]);
  const [dir, setDir] = useState(1);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const top = stack[stack.length - 1];

  // Stable callbacks so effects that depend on them don't restart each render.
  const open = useCallback((screen: string, id?: string, label?: string) => {
    setDir(1);
    setStack((s) => [...s, { screen, id, label }]);
  }, []);
  const section = useCallback((screen: string) => {
    setDir(1);
    setStack([{ screen }]);
  }, []);
  const back = useCallback(() => {
    setDir(-1);
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);
  const notify = useCallback((text: string) => setToast((t) => ({ key: (t?.key ?? 0) + 1, text })), []);
  const clearToast = useCallback(() => setToast(null), []);

  return {
    screen: top.screen,
    id: top.id,
    stack,
    dir,
    // Open a detail screen on top of the current one.
    open,
    // Jump to a top-level section from the sidebar.
    section,
    back,
    notify,
    toast,
    clearToast,
  };
}

export type ProtoAppState = ReturnType<typeof useProtoApp>;

// ---- App shell -------------------------------------------------------------------

// Screens slide forward when opened and back when closed.
const SLIDE = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export function ProtoApp({
  app,
  name,
  user,
  nav,
  alerts = 0,
  children,
}: {
  app: ProtoAppState;
  name: string;
  user: string;
  nav: ProtoNavItem[];
  alerts?: number;
  children: React.ReactNode;
}) {
  const root = nav.find((n) => n.id === app.stack[0].screen);
  const crumbs = [root?.label ?? "", ...app.stack.slice(1).map((s) => s.label ?? "")];
  const initials = user
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  useEffect(() => {
    if (!app.toast) return;
    const timer = window.setTimeout(app.clearToast, 2600);
    return () => window.clearTimeout(timer);
  }, [app.toast, app.clearToast]);

  return (
    <div className="relative rounded-[14px] border border-rule bg-night overflow-hidden flex flex-col h-[640px]">
      {/* title bar */}
      <div className="flex items-center justify-between gap-3 px-4 h-12 border-b border-rule bg-sheet shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Image src="/logo.png" alt="" width={22} height={22} className="w-[22px] h-[22px] object-contain shrink-0" />
          <span className="text-[0.85rem] font-semibold text-ink truncate">{name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="relative text-graphite" aria-label={`${alerts} alerts`}>
            <Bell size={16} />
            {alerts > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-gold text-paper text-[0.6rem] font-bold flex items-center justify-center">
                {alerts}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <Avatar name={user} size={26} />
            <span className="hidden md:inline text-[0.78rem] text-ink-soft">{user}</span>
            <span className="sr-only">{initials}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-rows-1 sm:grid-cols-[11.5rem_minmax(0,1fr)]">
        {/* sidebar */}
        <nav aria-label={`${name} prototype`} className="flex sm:flex-col gap-0.5 p-2 sm:p-3 border-b sm:border-b-0 sm:border-r border-rule overflow-x-auto sm:overflow-visible bg-night">
          {nav.map((item) => {
            const on = item.id === app.stack[0].screen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => app.section(item.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 shrink-0 px-3 py-2 rounded-lg text-[0.82rem] text-left transition-colors cursor-pointer",
                  on ? "text-gold-bright font-semibold" : "text-graphite hover:text-ink",
                )}
              >
                {on && (
                  <motion.span
                    layoutId={`${name}-nav`}
                    className="absolute inset-0 rounded-lg bg-gold-wash border border-gold/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon size={15} strokeWidth={1.8} className="relative" />
                <span className="relative flex-1">{item.label}</span>
                {item.badge ? <span className="relative font-mono text-[0.65rem] text-gold-bright">{item.badge}</span> : null}
              </button>
            );
          })}
        </nav>

        {/* main */}
        <div className="flex flex-col min-h-0 bg-paper">
          <div className="flex items-center gap-1.5 h-10 px-4 border-b border-rule shrink-0 text-[0.75rem]">
            {app.stack.length > 1 && (
              <button
                type="button"
                onClick={app.back}
                className="flex items-center gap-0.5 mr-2 pr-2.5 border-r border-rule text-gold-bright hover:text-ink cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
            {crumbs.map((c, i) => (
              <React.Fragment key={`${c}-${i}`}>
                {i > 0 && <ChevronRight size={12} className="text-mist shrink-0" />}
                <span className={cn("truncate", i === crumbs.length - 1 ? "text-ink font-medium" : "text-mist")}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false} custom={app.dir}>
              <motion.div
                key={app.stack.map((s) => `${s.screen}:${s.id ?? ""}`).join("/")}
                custom={app.dir}
                variants={SLIDE}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 sm:p-5"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {app.toast && (
          <motion.div
            key={app.toast.key}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-4 right-4 z-30 max-w-[18rem] px-4 py-2.5 rounded-lg bg-raised border border-gold/40 text-[0.8rem] text-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)]"
          >
            {app.toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Overlays ----------------------------------------------------------------------

// A dialog that stays inside the prototype window.
export function ProtoModal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes; focus moves into the dialog and returns when it closes.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("input, select, textarea, button:not([aria-label='Close'])");
    (first ?? panel)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 bg-night/80 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-md bg-sheet border border-rule rounded-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-rule">
              <span className="text-[0.92rem] font-semibold text-ink">{title}</span>
              <button type="button" onClick={onClose} aria-label="Close" className="text-graphite hover:text-ink cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">{children}</div>
            {footer && <div className="px-4 py-3 border-t border-rule flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Building blocks ----------------------------------------------------------------

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h4 className="font-display text-[1.45rem] leading-tight font-semibold text-ink">{title}</h4>
        {subtitle && <p className="text-[0.78rem] text-graphite mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex gap-2">{action}</div>}
    </div>
  );
}

// Kept for compatibility with simple screens.
export const ProtoTitle = ({ title, action }: { title: string; action?: React.ReactNode }) => <ScreenHeader title={title} action={action} />;

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-sheet border border-rule rounded-lg", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-3.5 h-10 border-b border-rule">
          <span className="text-[0.8rem] font-semibold text-ink">{title}</span>
          {action}
        </div>
      )}
      <div className="p-3.5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="bg-sheet border border-rule rounded-lg p-3">
      <div className="text-[0.72rem] font-medium text-graphite">{label}</div>
      <div className="font-display text-[1.6rem] leading-tight font-semibold text-ink mt-0.5 tabular-nums">{value}</div>
      {sub && <div className={cn("text-[0.7rem] mt-0.5", tone === "good" ? "text-[#8FD3AE]" : tone === "bad" ? "text-danger" : "text-mist")}>{sub}</div>}
    </div>
  );
}

// Vertical bars that grow in when shown.
export function Bars({ data, format = (n: number) => String(n), height = "h-32" }: { data: { label: string; value: number }[]; format?: (n: number) => string; height?: string }) {
  const max = Math.max(...data.map((d) => d.value));
  // Scale from just below the smallest value so the trend is visible.
  const floor = Math.min(...data.map((d) => d.value)) * 0.8;
  return (
    <div>
      <div className={cn("flex items-end gap-2", height)}>
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="font-mono text-[0.6rem] text-graphite tabular-nums">{format(d.value)}</span>
            <motion.div
              className={cn("w-full rounded-t-[3px]", i === data.length - 1 ? "bg-gold" : "bg-gold/35")}
              initial={{ height: 0 }}
              animate={{ height: `${((d.value - floor) / (max - floor || 1)) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center font-mono text-[0.6rem] text-mist">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cn("h-1.5 rounded-full bg-rule overflow-hidden", className)}>
      <motion.div
        className="h-full bg-gold rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// Status shown as a colored dot and plain text, not a pill.
export function Status({ tone, children }: { tone: "good" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const color = { good: "bg-[#8FD3AE]", warn: "bg-gold", bad: "bg-danger", muted: "bg-mist" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-soft whitespace-nowrap">
      <span className={cn("w-1.5 h-1.5 rounded-full", color)} aria-hidden />
      {children}
    </span>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tone = name.length % 3 === 0 ? "bg-gold-wash text-gold-bright" : name.length % 3 === 1 ? "bg-raised text-ink" : "bg-trace-wash text-trace";
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-semibold shrink-0 border border-rule", tone)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  align?: "right";
  hideOnMobile?: boolean;
}

// List table with clickable rows that open a detail screen.
export function Table<T>({ columns, rows, rowKey, onRowClick, empty = "Nothing here yet." }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; onRowClick?: (row: T) => void; empty?: string }) {
  return (
    <div className="bg-sheet border border-rule rounded-lg overflow-hidden">
      <table className="w-full text-left text-[0.8rem]">
        <thead>
          <tr className="border-b border-rule">
            {columns.map((c) => (
              <th key={c.key} className={cn("px-3 py-2 text-[0.7rem] font-medium text-mist", c.align === "right" && "text-right", c.hideOnMobile && "hidden md:table-cell")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      // Only the row itself opens; keys on buttons inside the row keep their own behavior.
                      if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
                      e.preventDefault();
                      onRowClick(row);
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={cn("border-b border-rule-soft last:border-0 transition-colors", onRowClick && "cursor-pointer hover:bg-raised focus-visible:bg-raised")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-2.5 text-ink-soft align-middle", c.align === "right" && "text-right", c.hideOnMobile && "hidden md:table-cell")}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-graphite">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Segmented control with a sliding highlight.
export function Segmented<T extends string>({ id, options, value, onChange }: { id: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-0.5 rounded-lg border border-rule bg-night">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={o.id === value}
          className={cn("relative px-2.5 py-1 text-[0.72rem] rounded-md cursor-pointer", o.id === value ? "text-paper font-semibold" : "text-graphite hover:text-ink")}
        >
          {o.id === value && <motion.span layoutId={`${id}-seg`} className="absolute inset-0 rounded-md bg-gold" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function KeyValues({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-[0.8rem]">
      {items.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-mist">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export const textareaClass =
  "w-full min-h-[5rem] px-3 py-2 rounded-lg bg-paper border border-rule text-[0.82rem] text-ink placeholder:text-mist outline-none focus:border-gold transition-colors resize-y";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className={cn("relative w-9 h-5 rounded-full border transition-colors cursor-pointer shrink-0", on ? "bg-gold border-gold" : "bg-night border-rule")}
    >
      <motion.span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full", on ? "bg-paper" : "bg-mist")} animate={{ left: on ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
    </button>
  );
}

export const inputClass =
  "w-full h-9 px-3 rounded-lg bg-paper border border-rule text-[0.82rem] text-ink placeholder:text-mist outline-none focus:border-gold transition-colors";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.75rem] font-medium text-graphite">{label}</span>
      {children}
    </label>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-paper text-[0.78rem] font-semibold hover:bg-gold-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

export function SmallButton({ children, onClick, disabled, label }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rule text-[0.72rem] font-medium text-ink hover:border-gold hover:text-gold-bright disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
