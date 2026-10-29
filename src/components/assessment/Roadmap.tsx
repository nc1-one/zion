"use client";

import { motion } from "framer-motion";
import type { PhasePlan } from "@/lib/assessment/types";
import { PHASES } from "@/lib/assessment/types";
import { weeksLabel } from "@/lib/assessment/format";
import { cn } from "@/lib/utils";

const ROW = "h-10";

// Phases drawn as circuit traces, like the logo: each phase is a gold segment
// with pads at both ends, and a vertical trace carries it into the next phase.
export function Roadmap({ phases, totalWeeks }: { phases: PhasePlan[]; totalWeeks: number }) {
  const pct = (week: number) => `${((week - 1) / totalWeeks) * 100}%`;
  const tickEvery = totalWeeks <= 12 ? 1 : totalWeeks <= 24 ? 2 : 4;
  const ticks = Array.from({ length: totalWeeks + 1 }, (_, i) => i + 1).filter(
    (w) => (w - 1) % tickEvery === 0 || w === totalWeeks + 1,
  );

  return (
    <div className="grid grid-cols-[6.75rem_1fr] sm:grid-cols-[10rem_1fr] gap-x-4">
      <div />
      <div className="relative h-5 mb-1" aria-hidden>
        {ticks.map((w) => (
          <span
            key={w}
            className="absolute -translate-x-1/2 font-mono text-[0.6rem] text-mist"
            style={{ left: pct(w) }}
          >
            {w <= totalWeeks ? `W${w}` : ""}
          </span>
        ))}
      </div>

      {phases.map((phase, i) => {
        const meta = PHASES.find((p) => p.key === phase.key)!;
        const end = phase.startWeek + phase.weeks;
        const isLast = i === phases.length - 1;
        return (
          <div key={phase.key} className="contents">
            <div className={cn(ROW, "flex items-center gap-2 min-w-0")}>
              <span className="font-display text-[1rem] font-semibold text-gold-deep w-5 shrink-0">{meta.numeral}</span>
              <span className="min-w-0">
                <span className="block text-[0.78rem] font-medium text-ink truncate">{phase.name}</span>
                <span className="block font-mono text-[0.6rem] text-mist">{weeksLabel(phase.weeks)}</span>
              </span>
            </div>
            <div className={cn(ROW, "relative")}>
              {/* week gridlines */}
              {ticks.map((w) => (
                <span key={w} className="absolute inset-y-0 w-px bg-rule-soft" style={{ left: pct(w) }} aria-hidden />
              ))}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-gold origin-left"
                style={{ left: pct(phase.startWeek), width: `${(phase.weeks / totalWeeks) * 100}%` }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.35, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden
              />
              <Pad left={pct(phase.startWeek)} delay={0.1 + i * 0.35} />
              <Pad left={pct(end)} delay={0.55 + i * 0.35} />
              {!isLast && (
                <motion.span
                  className="absolute top-1/2 w-[3px] -translate-x-1/2 bg-gold origin-top h-10"
                  style={{ left: pct(end) }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.25, delay: 0.6 + i * 0.35 }}
                  aria-hidden
                />
              )}
              <span className="sr-only">
                {phase.name}: week {phase.startWeek} to week {end - 1}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pad({ left, delay }: { left: string; delay: number }) {
  return (
    <motion.span
      className="absolute top-1/2 z-10 w-[11px] h-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold ring-[3px] ring-sheet"
      style={{ left }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2, delay }}
      aria-hidden
    />
  );
}

// Empty roadmap shown before the agent has drafted anything.
export function RoadmapPlaceholder({ drafting }: { drafting: boolean }) {
  return (
    <div className="grid grid-cols-[6.75rem_1fr] sm:grid-cols-[10rem_1fr] gap-x-4">
      {PHASES.map((p, i) => (
        <div key={p.key} className="contents">
          <div className={cn(ROW, "flex items-center gap-2")}>
            <span className="font-display text-[1rem] font-semibold text-mist w-5 shrink-0">{p.numeral}</span>
            <span className="text-[0.78rem] text-mist truncate">{p.name}</span>
          </div>
          <div className={cn(ROW, "relative")}>
            <span
              className="absolute top-1/2 h-px border-t border-dashed border-rule"
              style={{ left: `${i * 18}%`, width: `${22 + (i % 2) * 8}%` }}
            />
            {drafting && (
              <motion.span
                className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-gold rounded-full"
                style={{ left: `${i * 18}%` }}
                initial={{ width: "0%", opacity: 0.9 }}
                animate={{ width: [`0%`, `${22 + (i % 2) * 8}%`], opacity: [0.9, 0.9, 0.25] }}
                transition={{ duration: 1.6, delay: i * 0.3, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
