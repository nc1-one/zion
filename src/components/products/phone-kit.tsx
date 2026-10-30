"use client";

import React from "react";
import { motion } from "framer-motion";
import { BatteryFull, Check, ChevronLeft, Minus, Plus, Signal, Wifi, type LucideIcon } from "lucide-react";
import { brandStyle } from "@/lib/brand";
import { cn } from "@/lib/utils";

// Building blocks for the products' mobile apps, drawn in the light theme.

export function PhoneFrame({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div className="proto-light w-[272px] h-[572px] rounded-[44px] bg-[#0B0F14] p-[9px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08)]" style={brandStyle(accent)}>
      <div className="relative h-full rounded-[36px] bg-paper overflow-hidden flex flex-col text-left">
        <div className="relative h-10 px-6 flex items-center justify-between text-[0.68rem] font-semibold text-ink shrink-0">
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-2 w-[78px] h-[22px] rounded-full bg-[#0B0F14]" aria-hidden />
          <span className="flex items-center gap-1" aria-hidden>
            <Signal size={11} />
            <Wifi size={11} />
            <BatteryFull size={14} />
          </span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <div className="h-5 flex items-center justify-center shrink-0 bg-sheet" aria-hidden>
          <span className="w-24 h-1 rounded-full bg-ink/80" />
        </div>
      </div>
    </div>
  );
}

export function Header({ title, sub, onBack }: { title: string; sub?: string; onBack?: () => void }) {
  return (
    <div className="px-4 pt-1 pb-3 shrink-0">
      {onBack && (
        <button type="button" onClick={onBack} className="flex items-center gap-0.5 -ml-1 mb-1 text-[0.72rem] font-medium text-gold cursor-pointer">
          <ChevronLeft size={14} /> Back
        </button>
      )}
      <div className="text-[1.15rem] font-bold text-ink leading-tight">{title}</div>
      {sub && <div className="text-[0.7rem] text-mist mt-0.5">{sub}</div>}
    </div>
  );
}

export function Body({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">{children}</div>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 mb-1.5 text-[0.66rem] font-semibold text-graphite">{children}</div>;
}

export function Button({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-4 w-full h-10 rounded-xl bg-gold text-sheet text-[0.8rem] font-semibold cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, format = String }: { options: T[]; value: T; onChange: (v: T) => void; format?: (v: T) => string }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          className={cn(
            "h-8 rounded-lg border text-[0.7rem] font-medium transition-colors cursor-pointer",
            o === value ? "border-gold bg-gold-wash text-gold" : "border-rule bg-sheet text-ink-soft",
          )}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

export function Choice({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} className="w-full flex items-center justify-between px-3 h-8 text-[0.74rem] text-ink cursor-pointer">
          {o}
          <span className={cn("w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center", o === value ? "border-gold" : "border-rule")}>
            {o === value && <span className="w-2 h-2 rounded-full bg-gold" />}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Done({ title, lines, action, onDone }: { title: string; lines: string[]; action: string; onDone: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="pt-10 flex flex-col items-center text-center">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.1 }}
        className="w-14 h-14 rounded-full bg-gold text-sheet flex items-center justify-center"
      >
        <Check size={26} strokeWidth={3} />
      </motion.span>
      <div className="mt-4 text-[1rem] font-bold text-ink">{title}</div>
      {lines.map((l) => (
        <div key={l} className="mt-1 text-[0.72rem] text-graphite">
          {l}
        </div>
      ))}
      <button type="button" onClick={onDone} className="mt-6 text-[0.75rem] font-semibold text-gold cursor-pointer">
        {action}
      </button>
    </motion.div>
  );
}

export function TabBar({ items, active }: { items: [LucideIcon, string][]; active: number }) {
  return (
    <div className="h-12 shrink-0 border-t border-rule bg-sheet grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} aria-hidden>
      {items.map(([Icon, label], i) => (
        <span key={label} className={cn("flex flex-col items-center justify-center gap-0.5 text-[0.58rem] font-medium", i === active ? "text-gold" : "text-mist")}>
          <Icon size={16} strokeWidth={i === active ? 2.3 : 1.8} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-rule bg-sheet p-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-lg bg-raised text-ink flex items-center justify-center cursor-pointer" aria-label="Fewer">
        <Minus size={15} />
      </button>
      <span className="text-[1.2rem] font-bold text-ink tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 rounded-lg bg-raised text-ink flex items-center justify-center cursor-pointer" aria-label="More">
        <Plus size={15} />
      </button>
    </div>
  );
}
