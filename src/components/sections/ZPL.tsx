"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Pause, Play, ShieldCheck } from "lucide-react";
import { PHASES, type PhaseKey } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";
import { RevealHeading } from "@/components/ui/motion";

const PHASE_DETAILS: Record<PhaseKey, { desc: string; duration: string; receive: string[]; role: string; gate: string }> = {
  discover: {
    desc: "We learn your mission, your people, and your goals, and agree on what success looks like before any code is written.",
    duration: "Typically 1–2 weeks",
    receive: ["Requirements brief", "Success metrics", "Signed-off scope"],
    role: "Two working sessions with your team, plus access to the tools you use today.",
    gate: "Scope and success metrics signed off",
  },
  architect: {
    desc: "We design the screens and the system behind them. You approve both before the build starts.",
    duration: "Typically 2–3 weeks",
    receive: ["Clickable prototype", "Design system", "Architecture plan"],
    role: "Review the designs and approve them, with two rounds of revisions included.",
    gate: "Designs and architecture approved",
  },
  build: {
    desc: "We build in weekly sprints and show you working software at the end of every week.",
    duration: "Typically 4–10 weeks",
    receive: ["Working staging site", "Weekly demos", "Progress notes"],
    role: "A 30-minute review each week, and quick answers when questions come up.",
    gate: "Feature-complete on staging",
  },
  test: {
    desc: "We test on real devices, check accessibility, speed, and security, and fix what we find before launch.",
    duration: "Typically 1–2 weeks",
    receive: ["Test report", "Accessibility and speed checks", "Security review"],
    role: "Try it yourself (user acceptance testing) and tell us what feels wrong.",
    gate: "Passes our QA checklist and your sign-off",
  },
  launch: {
    desc: "We deploy, set up monitoring, and train your team, then stay on for support after launch.",
    duration: "Typically 1–2 weeks",
    receive: ["Live system with monitoring", "Training and guides", "30 days of support"],
    role: "Join a training session so your team can run it with confidence.",
    gate: "Live, monitored, and your team trained",
  },
};

export function ZPL() {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const phase = PHASES[active];
  const detail = PHASE_DETAILS[phase.key];
  const atEnd = active === PHASES.length - 1;

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (atEnd) setRunning(false);
      else setActive((i) => i + 1);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [running, active, atEnd]);

  const select = (i: number) => {
    setActive(i);
    setRunning(false);
  };

  const toggleRun = () => {
    if (running) return setRunning(false);
    if (atEnd) setActive(0);
    setRunning(true);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + PHASES.length) % PHASES.length;
    select(next);
    document.getElementById(`zpl-tab-${PHASES[next].key}`)?.focus();
  };

  return (
    <section id="process" className="bg-night text-ink py-20 md:py-28 px-5 md:px-10 border-y border-rule">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-16 items-end">
          <RevealHeading text="The Zion Production Line™" className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold" />
          <p className="text-[1rem] leading-[1.7] text-graphite max-w-[36rem]">
            Every project runs through the same five phases, each ending in a quality gate you sign off on. Every scope the
            Zion Agent drafts follows them, so you know what happens next and what you receive at each step.
          </p>
        </div>

        {/* The line */}
        <div className="mt-14 md:mt-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="annot text-mist">Select a phase</div>
            <button
              type="button"
              onClick={toggleRun}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rule text-[0.85rem] font-semibold hover:border-gold hover:text-gold-bright transition-colors cursor-pointer"
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
              {running ? "Pause" : atEnd ? "Run it again" : "Run the line"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-6 h-[3px] -translate-y-1/2 bg-rule rounded-full" aria-hidden />
            <motion.div
              className="absolute left-[10%] top-6 h-[3px] -translate-y-1/2 bg-gold rounded-full"
              animate={{ width: `${(active / (PHASES.length - 1)) * 80}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden
            />
            <div role="tablist" aria-label="Zion Production Line phases" className="relative grid grid-cols-5" onKeyDown={onKey}>
              {PHASES.map((p, i) => {
                const state = i < active ? "done" : i === active ? "active" : "upcoming";
                return (
                  <button
                    key={p.key}
                    id={`zpl-tab-${p.key}`}
                    type="button"
                    role="tab"
                    aria-selected={state === "active"}
                    aria-controls="zpl-panel"
                    tabIndex={state === "active" ? 0 : -1}
                    onClick={() => select(i)}
                    className="group flex flex-col items-center gap-3 px-1 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-display text-[1.15rem] font-semibold transition-all",
                        state === "active" && "bg-gold text-paper ring-[6px] ring-gold/20 scale-110",
                        state === "done" && "bg-night border-2 border-gold text-gold-bright",
                        state === "upcoming" && "bg-night border-2 border-rule text-graphite group-hover:border-graphite",
                      )}
                    >
                      {state === "done" ? <Check size={18} strokeWidth={2.5} /> : p.numeral}
                    </span>
                    <span
                      className={cn(
                        "hidden sm:block text-center text-[0.85rem] leading-tight transition-colors",
                        state === "active" ? "text-ink font-semibold" : "text-graphite group-hover:text-ink",
                      )}
                    >
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={phase.key}
              id="zpl-panel"
              role="tabpanel"
              aria-labelledby={`zpl-tab-${phase.key}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-px bg-rule border border-rule rounded-[14px] overflow-hidden"
            >
              <div className="bg-sheet p-7 md:p-9">
                <div className="annot text-gold-bright">
                  Phase {phase.numeral} · {detail.duration}
                </div>
                <h3 className="mt-3 font-display text-[2rem] leading-[1.1] font-semibold">{phase.name}</h3>
                <p className="mt-3 text-[0.98rem] leading-[1.7] text-ink-soft">{detail.desc}</p>
                <div className="mt-6 annot text-mist">Your role</div>
                <p className="mt-1.5 text-[0.92rem] leading-[1.6] text-ink-soft">{detail.role}</p>
              </div>
              <div className="bg-sheet p-7 md:p-9 flex flex-col">
                <div className="annot text-mist">You receive</div>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {detail.receive.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[0.95rem]">
                      <Check size={17} strokeWidth={2.5} className="text-gold-bright shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-gold-wash border border-gold/40">
                  <ShieldCheck size={19} className="text-gold-bright shrink-0 mt-0.5" />
                  <div>
                    <div className="annot text-gold-bright">Quality gate</div>
                    <p className="mt-1 text-[0.9rem] text-ink">{detail.gate}</p>
                  </div>
                </div>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => select(Math.max(0, active - 1))}
                    disabled={active === 0}
                    className="inline-flex items-center gap-1.5 text-[0.85rem] text-graphite hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowLeft size={15} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => select(Math.min(PHASES.length - 1, active + 1))}
                    disabled={atEnd}
                    className="inline-flex items-center gap-1.5 text-[0.85rem] text-graphite hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
