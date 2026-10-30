"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DriveContext, type StackEntry } from "./drive";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, ChevronLeft, ChevronRight, CornerDownLeft, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { brandStyle } from "@/lib/brand";

// ---- App state: screen stack, navigation, toasts -------------------------------

export interface ProtoNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export type { ProtoDrive, StackEntry } from "./drive";
export { ProtoDriveProvider } from "./drive";

export { brandStyle } from "@/lib/brand";

// Each prototype keeps a stack of screens so visitors can open a record, go
// deeper, and come back, like a real app.
export function useProtoApp(home: string) {
  const { target } = useContext(DriveContext);
  const [stack, setStack] = useState<StackEntry[]>(() => target?.stack ?? [{ screen: home }]);
  const [dir, setDir] = useState(1);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [seenTarget, setSeenTarget] = useState(target?.key);
  const top = stack[stack.length - 1];

  // A new tour step moves the app to that screen.
  if (target && target.key !== seenTarget) {
    setSeenTarget(target.key);
    setDir(1);
    setStack(target.stack);
  }

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

  return { screen: top.screen, id: top.id, stack, dir, open, section, back, notify, toast, clearToast };
}

export type ProtoAppState = ReturnType<typeof useProtoApp>;

// Slide-overs render into a layer over the whole app, not inside the scrolling
// screen, so they always open in view.
const ModalHost = createContext<HTMLElement | null>(null);

// ---- App shell -------------------------------------------------------------------

// Screens slide forward when opened and back when closed.
const SLIDE = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 20 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -20 }),
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
  name: string; // "Product · Organization"
  user: string;
  nav: ProtoNavItem[];
  alerts?: number;
  children: React.ReactNode;
}) {
  const [product, org] = name.split(" · ");
  const root = nav.find((n) => n.id === app.stack[0].screen);
  const crumbs = [root?.label ?? "", ...app.stack.slice(1).map((s) => s.label ?? "")];
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modalHost, setModalHost] = useState<HTMLDivElement | null>(null);
  const { brand, framed, onPath } = useContext(DriveContext);
  const top = app.stack[app.stack.length - 1];
  const path = `/${app.stack[0].screen}${app.stack.length > 1 ? `/${top.id ?? top.screen}` : ""}`;

  useEffect(() => {
    onPath?.(path);
  }, [path, onPath]);

  useEffect(() => {
    if (!app.toast) return;
    const timer = window.setTimeout(app.clearToast, 2800);
    return () => window.clearTimeout(timer);
  }, [app.toast, app.clearToast]);

  return (
    <div
      className={cn("proto-light relative bg-paper overflow-hidden flex flex-col h-[660px] text-left", !framed && "rounded-xl border border-rule")}
      style={brand ? brandStyle(brand.accent) : undefined}
    >
      {/* top bar */}
      <div className="flex items-center gap-3 px-3 sm:px-4 h-12 border-b border-rule bg-sheet shrink-0">
        <div className="flex items-center gap-2 min-w-0 sm:w-[10.5rem] shrink-0">
          <span className="w-6 h-6 rounded-md bg-gold text-sheet text-[0.7rem] font-bold flex items-center justify-center shrink-0" aria-hidden>
            {product.slice(0, 1)}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[0.8rem] font-semibold text-ink truncate">{product}</span>
            {org && <span className="block text-[0.66rem] text-mist truncate">{org}</span>}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 flex-1 max-w-[22rem] h-8 px-2.5 rounded-lg border border-rule bg-paper text-[0.78rem] text-mist hover:border-mist transition-colors cursor-pointer"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="font-mono text-[0.65rem] px-1.5 py-0.5 rounded border border-rule bg-sheet">⌘K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <button type="button" onClick={() => setPaletteOpen(true)} className="md:hidden text-graphite cursor-pointer" aria-label="Search">
            <Search size={16} />
          </button>
          <span className="relative text-graphite" aria-label={`${alerts} alerts`}>
            <Bell size={16} />
            {alerts > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-danger text-sheet text-[0.6rem] font-bold flex items-center justify-center">
                {alerts}
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <Avatar name={user} size={26} />
            <span className="hidden lg:inline text-[0.78rem] text-ink-soft">{user}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-rows-1 sm:grid-cols-[11.5rem_minmax(0,1fr)]">
        {/* sidebar */}
        <nav aria-label={`${product} navigation`} className="flex sm:flex-col gap-0.5 p-2 sm:p-2.5 border-b sm:border-b-0 sm:border-r border-rule overflow-x-auto sm:overflow-visible bg-night">
          {nav.map((item) => {
            const on = item.id === app.stack[0].screen;
            return (
              <button
                key={item.id}
                type="button"
                data-screen={item.id}
                onClick={() => app.section(item.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 shrink-0 px-2.5 py-1.5 rounded-md text-[0.8rem] text-left transition-colors cursor-pointer",
                  on ? "text-ink font-semibold" : "text-graphite hover:text-ink hover:bg-raised",
                )}
              >
                {on && <motion.span layoutId={`${product}-nav`} className="absolute inset-0 rounded-md bg-sheet border border-rule shadow-[0_1px_2px_rgba(16,24,40,0.06)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <item.icon size={15} strokeWidth={1.9} className={cn("relative", on ? "text-gold" : "")} />
                <span className="relative flex-1">{item.label}</span>
                {item.badge ? <span className="relative min-w-5 px-1.5 rounded-full bg-raised text-[0.66rem] font-medium text-graphite text-center">{item.badge}</span> : null}
              </button>
            );
          })}
          <div className="hidden sm:block mt-auto px-2.5 pt-3 text-[0.66rem] leading-relaxed text-mist border-t border-rule">
            Demo workspace · sample data
          </div>
        </nav>

        {/* main */}
        <div data-proto-main className="flex flex-col min-h-0 bg-paper">
          <div className="flex items-center gap-1.5 h-10 px-4 border-b border-rule bg-sheet shrink-0 text-[0.75rem]">
            {app.stack.length > 1 && (
              <button type="button" onClick={app.back} className="flex items-center gap-0.5 mr-1.5 pr-2.5 border-r border-rule text-graphite hover:text-ink cursor-pointer">
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
          <div data-proto-scroll className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false} custom={app.dir}>
              <motion.div
                key={app.stack.map((s) => `${s.screen}:${s.id ?? ""}`).join("/")}
                custom={app.dir}
                variants={SLIDE}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 sm:p-5"
              >
                <ModalHost.Provider value={modalHost}>{children}</ModalHost.Provider>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div ref={setModalHost} className="absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto" />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} nav={nav} onGo={(id) => app.section(id)} />

      <AnimatePresence>
        {app.toast && (
          <motion.div
            key={app.toast.key}
            role="status"
            initial={{ opacity: 0, y: 16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-4 left-1/2 z-40 flex items-center gap-2 max-w-[90%] px-3.5 py-2.5 rounded-lg bg-ink text-sheet text-[0.8rem] shadow-[0_12px_24px_-8px_rgba(16,24,40,0.35)]"
          >
            <CheckCircle2 size={15} className="text-[#47CD89] shrink-0" />
            {app.toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Jump to any section by typing, like ⌘K in real apps.
function CommandPalette({ open, onClose, nav, onGo }: { open: boolean; onClose: () => void; nav: ProtoNavItem[]; onGo: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const results = nav.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const go = (id: string) => {
    onGo(id);
    setQuery("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-30 bg-ink/20 flex justify-center pt-16 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-label="Search"
            className="w-full max-w-md h-fit bg-sheet rounded-xl border border-rule shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)] overflow-hidden"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (results[0]) go(results[0].id);
              }}
              className="flex items-center gap-2 px-3.5 h-11 border-b border-rule"
            >
              <Search size={15} className="text-mist" />
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Jump to…" aria-label="Jump to" className="flex-1 bg-transparent text-[0.85rem] text-ink placeholder:text-mist outline-none" />
              <kbd className="font-mono text-[0.62rem] text-mist">Esc</kbd>
            </form>
            <ul className="p-1.5 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button type="button" onClick={() => go(r.id)} className={cn("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[0.82rem] text-ink-soft text-left hover:bg-raised cursor-pointer", i === 0 && query && "bg-raised")}>
                    <r.icon size={15} className="text-mist" />
                    <span className="flex-1">{r.label}</span>
                    {i === 0 && query && <CornerDownLeft size={13} className="text-mist" />}
                  </button>
                </li>
              ))}
              {results.length === 0 && <li className="px-3 py-4 text-[0.8rem] text-mist">No matches.</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Overlays ----------------------------------------------------------------------

// Forms open in a panel that slides in from the right, like most business apps.
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

  // Escape closes; focus moves into the panel and returns when it closes.
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

  const host = useContext(ModalHost);
  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-20 bg-ink/25 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="h-full w-[min(25rem,92%)] bg-sheet border-l border-rule flex flex-col shadow-[-16px_0_32px_-16px_rgba(16,24,40,0.2)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-rule shrink-0">
              <span className="text-[0.9rem] font-semibold text-ink">{title}</span>
              <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-md flex items-center justify-center text-graphite hover:bg-raised cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">{children}</div>
            {footer && <div className="px-4 py-3 border-t border-rule flex justify-end gap-2 shrink-0 bg-paper">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return host ? createPortal(panel, host) : panel;
}

// ---- Building blocks ----------------------------------------------------------------

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h4 className="text-[1.2rem] leading-tight font-semibold text-ink tracking-[-0.01em]">{title}</h4>
        {subtitle && <p className="text-[0.78rem] text-mist mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex flex-wrap justify-end gap-2">{action}</div>}
    </div>
  );
}

// Kept for compatibility with simple screens.
export const ProtoTitle = ({ title, action }: { title: string; action?: React.ReactNode }) => <ScreenHeader title={title} action={action} />;

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-sheet border border-rule rounded-lg shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)}>
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
    <div className="bg-sheet border border-rule rounded-lg p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-[0.74rem] font-medium text-mist">{label}</div>
      <div className="text-[1.45rem] leading-tight font-semibold text-ink mt-1 tabular-nums tracking-[-0.01em]">{value}</div>
      {sub && <div className={cn("text-[0.72rem] mt-0.5", tone === "good" ? "text-good" : tone === "bad" ? "text-danger" : "text-mist")}>{sub}</div>}
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
          <div key={d.label} className="group flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="font-mono text-[0.62rem] text-mist tabular-nums">{format(d.value)}</span>
            <motion.div
              className={cn("w-full rounded-t-[3px] transition-colors", i === data.length - 1 ? "bg-gold" : "bg-gold/25 group-hover:bg-gold/45")}
              initial={{ height: 0 }}
              animate={{ height: `${((d.value - floor) / (max - floor || 1)) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1.5 border-t border-rule pt-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[0.62rem] text-mist">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <div className={cn("h-1.5 rounded-full bg-raised overflow-hidden", className)}>
      <motion.div
        className="h-full bg-gold rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// Status badge in the style of real business apps: tinted, compact, square-ish.
export function Status({ tone, children }: { tone: "good" | "warn" | "bad" | "muted"; children: React.ReactNode }) {
  const styles = {
    good: "bg-good/10 text-good",
    warn: "bg-warn/10 text-warn",
    bad: "bg-danger-wash text-danger",
    muted: "bg-raised text-graphite",
  }[tone];
  const dot = { good: "bg-good", warn: "bg-warn", bad: "bg-danger", muted: "bg-mist" }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[0.7rem] font-medium whitespace-nowrap", styles)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} aria-hidden />
      {children}
    </span>
  );
}

const AVATAR_TONES = [
  "bg-[#EFF8FF] text-[#175CD3]",
  "bg-[#ECFDF3] text-[#067647]",
  "bg-[#FEF6EE] text-[#B93815]",
  "bg-[#F4F3FF] text-[#5925DC]",
  "bg-[#FDF2FA] text-[#C11574]",
  "bg-[#F2F4F7] text-[#344054]",
];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-semibold shrink-0", AVATAR_TONES[hash % AVATAR_TONES.length])}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
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
    <div className="bg-sheet border border-rule rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <table className="w-full text-left text-[0.8rem]">
        <thead>
          <tr className="border-b border-rule bg-paper">
            {columns.map((c) => (
              <th key={c.key} className={cn("px-3 py-2 text-[0.7rem] font-medium text-mist", c.align === "right" && "text-right", c.hideOnMobile && "hidden md:table-cell")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={rowKey(row)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i, 10) * 0.025 }}
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
              className={cn("border-b border-rule-soft last:border-0 transition-colors", onRowClick && "cursor-pointer hover:bg-paper focus-visible:bg-paper")}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-2.5 text-ink-soft align-middle", c.align === "right" && "text-right", c.hideOnMobile && "hidden md:table-cell")}>
                  {c.render(row)}
                </td>
              ))}
            </motion.tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-mist">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {rows.length > 0 && (
        <div className="px-3 py-2 border-t border-rule bg-paper text-[0.7rem] text-mist">
          {rows.length} {rows.length === 1 ? "result" : "results"}
        </div>
      )}
    </div>
  );
}

// Segmented control: the selected option lifts onto a white chip.
export function Segmented<T extends string>({ id, options, value, onChange }: { id: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-0.5 rounded-lg bg-raised border border-rule">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={o.id === value}
          className={cn("relative px-2.5 py-1 text-[0.74rem] rounded-md cursor-pointer transition-colors", o.id === value ? "text-ink font-semibold" : "text-graphite hover:text-ink")}
        >
          {o.id === value && (
            <motion.span layoutId={`${id}-seg`} className="absolute inset-0 rounded-md bg-sheet shadow-[0_1px_2px_rgba(16,24,40,0.1)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function KeyValues({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[0.8rem]">
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
  "w-full min-h-[5rem] px-3 py-2 rounded-lg bg-sheet border border-rule text-[0.82rem] text-ink placeholder:text-mist outline-none focus:border-gold focus:shadow-[0_0_0_3px_var(--color-gold-wash)] transition-[border-color,box-shadow] resize-y";

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
      className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0", on ? "bg-gold" : "bg-rule")}
    >
      <motion.span className="absolute top-0.5 w-4 h-4 rounded-full bg-sheet shadow-[0_1px_2px_rgba(16,24,40,0.2)]" animate={{ left: on ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
    </button>
  );
}

export const inputClass =
  "w-full h-9 px-3 rounded-lg bg-sheet border border-rule text-[0.82rem] text-ink placeholder:text-mist outline-none focus:border-gold focus:shadow-[0_0_0_3px_var(--color-gold-wash)] transition-[border-color,box-shadow]";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.76rem] font-medium text-ink-soft">{label}</span>
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold text-sheet text-[0.78rem] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.1)] hover:brightness-110 active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed transition-[filter,transform] cursor-pointer"
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
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rule bg-sheet text-[0.74rem] font-medium text-ink-soft shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-paper hover:text-ink disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
