"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProtoTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

// App window used by every product prototype: Zion-branded title bar, side
// navigation, and an animated content area.
export function ProtoFrame({
  name,
  tabs,
  active,
  onTab,
  children,
}: {
  name: string;
  tabs: ProtoTab[];
  active: string;
  onTab: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-rule bg-night overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 h-11 border-b border-rule bg-sheet">
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/logo.png" alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />
          <span className="text-[0.82rem] font-semibold text-ink truncate">{name}</span>
        </div>
        <span className="annot text-mist shrink-0 hidden sm:inline">Prototype · sample data</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[10.5rem_minmax(0,1fr)] min-h-[440px]">
        <nav aria-label={`${name} prototype`} className="flex sm:flex-col gap-1 p-2 sm:p-3 border-b sm:border-b-0 sm:border-r border-rule overflow-x-auto">
          {tabs.map((tab) => {
            const on = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTab(tab.id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 shrink-0 px-3 py-2 rounded-lg text-[0.82rem] text-left transition-colors cursor-pointer",
                  on ? "bg-gold-wash text-gold-bright font-medium" : "text-graphite hover:text-ink hover:bg-sheet",
                )}
              >
                <tab.icon size={15} strokeWidth={1.8} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 sm:p-5 bg-paper min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function ProtoTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h4 className="font-display text-[1.35rem] font-semibold text-ink">{title}</h4>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-sheet border border-rule rounded-lg p-3">
      <div className="annot text-mist">{label}</div>
      <div className="font-display text-[1.6rem] leading-tight font-semibold text-ink mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[0.72rem] text-graphite mt-0.5">{sub}</div>}
    </div>
  );
}

// Vertical bars that grow in when shown.
export function Bars({ data, format = (n: number) => String(n) }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value));
  // Scale from just below the smallest value so the trend is visible.
  const floor = Math.min(...data.map((d) => d.value)) * 0.8;
  return (
    <div className="bg-sheet border border-rule rounded-lg p-3">
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="font-mono text-[0.6rem] text-graphite tabular-nums">{format(d.value)}</span>
            <motion.div
              className={cn("w-full rounded-t-[3px]", i === data.length - 1 ? "bg-gold" : "bg-gold/35")}
              initial={{ height: 0 }}
              animate={{ height: `${((d.value - floor) / (max - floor)) * 100}%` }}
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
  const color = { good: "bg-[#7FC8A0]", warn: "bg-gold", bad: "bg-danger", muted: "bg-mist" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-ink-soft whitespace-nowrap">
      <span className={cn("w-1.5 h-1.5 rounded-full", color)} aria-hidden />
      {children}
    </span>
  );
}

export function SmallButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 rounded-md border border-rule text-[0.72rem] font-medium text-ink hover:border-gold hover:text-gold-bright disabled:opacity-40 disabled:cursor-default transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
