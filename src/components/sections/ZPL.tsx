"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Pause, Play, ShieldCheck } from "lucide-react";
import { PHASES, type PhaseKey } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";

const PHASE_DETAILS: Record<PhaseKey, { desc: string; duration: string; receive: string[]; role: string; gate: string }> = {
  discover: {
    desc: "Deep-dive into your mission, stakeholders, and goals. We map the full vision before writing a single line of code.",
    duration: "Typically 1–2 weeks",
    receive: ["Requirements brief", "Success metrics", "Signed-off scope"],
    role: "Two working sessions with your team, plus access to the tools you use today.",
    gate: "Scope and success metrics signed off",
  },
  architect: {
    desc: "System design, technology selection, and structural planning with full transparency and client sign-off.",
    duration: "Typically 2–3 weeks",
    receive: ["Clickable prototype", "Design system", "Architecture plan"],
    role: "Review the designs and approve them, with two rounds of revisions included.",
    gate: "Designs and architecture approved",
  },
  build: {
    desc: "Sprint-based development with continuous feedback. You see progress every week, not just at the end.",
    duration: "Typically 4–10 weeks",
    receive: ["Working staging site", "Weekly demos", "Progress notes"],
    role: "A 30-minute review each week, and quick answers when questions come up.",
    gate: "Feature-complete on staging",
  },
  test: {
    desc: "Rigorous QA, security review, and performance testing. Nothing passes the gate unless it meets the standard.",
    duration: "Typically 1–2 weeks",
    receive: ["Test report", "Accessibility and speed checks", "Security review"],
    role: "Try it yourself (user acceptance testing) and tell us what feels wrong.",
    gate: "Passes our QA checklist and your sign-off",
  },
  launch: {
    desc: "Deployment, monitoring, and ongoing support. We don't just hand off — we walk beside you post-launch.",
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
    <section id="process" className="bg-ink text-sheet py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-10 lg:gap-16 items-end">
          <div>
            <div className="annot text-gold-bright mb-4">Our signature process</div>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold">The Zion Production Line&trade;</h2>
            <p className="mt-5 text-[1rem] leading-[1.7] text-sheet/80 max-w-[34rem]">
              Our proprietary development methodology — the <strong className="text-gold-bright font-semibold">ZPL</strong> — is what
              sets us apart. A battle-tested, phase-gated operating framework that brings order, excellence, and accountability to
              every build. Every scope the Zion Agent drafts follows these five phases.
            </p>
          </div>
          <div>
            <blockquote className="pl-5 border-l-2 border-gold">
              <p className="font-display text-[1.2rem] italic leading-[1.5] text-sheet/90">
                Think of it as a production line where every station has a purpose, every handoff is intentional, and the final
                product reflects the standard of the Kingdom.
              </p>
            </blockquote>
            <dl className="mt-8 grid grid-cols-3 border-t border-sheet/20">
              {[
                { val: "5", label: "Core phases" },
                { val: "98%", label: "On-time rate" },
                { val: "0", label: "Shortcuts" },
              ].map((m) => (
                <div key={m.label} className="pt-4 flex flex-col-reverse">
                  <dt className="annot text-sheet/70 mt-2">{m.label}</dt>
                  <dd className="font-display text-[2.2rem] font-semibold text-gold-bright leading-none">{m.val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* The line */}
        <div className="mt-14 md:mt-16">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="annot text-sheet/70">Select a station</div>
            <button
              type="button"
              onClick={toggleRun}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-sheet/30 text-[0.85rem] font-semibold hover:border-gold-bright hover:text-gold-bright transition-colors cursor-pointer"
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
              {running ? "Pause" : atEnd ? "Run it again" : "Run the line"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-6 h-[3px] -translate-y-1/2 bg-sheet/15 rounded-full" aria-hidden />
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
                        state === "active" && "bg-gold text-ink ring-[6px] ring-gold/25 scale-110",
                        state === "done" && "bg-ink border-2 border-gold text-gold-bright",
                        state === "upcoming" && "bg-ink border-2 border-sheet/30 text-sheet/80 group-hover:border-sheet/70",
                      )}
                    >
                      {state === "done" ? <Check size={18} strokeWidth={2.5} /> : p.numeral}
                    </span>
                    <span
                      className={cn(
                        "hidden sm:block text-center text-[0.85rem] leading-tight transition-colors",
                        state === "active" ? "text-sheet font-semibold" : "text-sheet/70 group-hover:text-sheet",
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
              className="mt-10 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-px bg-sheet/15 border border-sheet/15 rounded-[14px] overflow-hidden"
            >
              <div className="bg-ink-soft p-7 md:p-9">
                <div className="annot text-gold-bright">
                  Phase {phase.numeral} · {detail.duration}
                </div>
                <h3 className="mt-3 font-display text-[2rem] leading-[1.1] font-semibold">{phase.name}</h3>
                <p className="mt-3 text-[0.98rem] leading-[1.7] text-sheet/85">{detail.desc}</p>
                <div className="mt-6 annot text-sheet/70">Your role</div>
                <p className="mt-1.5 text-[0.92rem] leading-[1.6] text-sheet/85">{detail.role}</p>
              </div>
              <div className="bg-ink-soft p-7 md:p-9 flex flex-col">
                <div className="annot text-sheet/70">You receive</div>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {detail.receive.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[0.95rem]">
                      <Check size={17} strokeWidth={2.5} className="text-gold-bright shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-gold/12 border border-gold/40">
                  <ShieldCheck size={19} className="text-gold-bright shrink-0 mt-0.5" />
                  <div>
                    <div className="annot text-gold-bright">Quality gate</div>
                    <p className="mt-1 text-[0.9rem] text-sheet">{detail.gate}</p>
                  </div>
                </div>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => select(Math.max(0, active - 1))}
                    disabled={active === 0}
                    className="inline-flex items-center gap-1.5 text-[0.85rem] text-sheet/80 hover:text-sheet disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowLeft size={15} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => select(Math.min(PHASES.length - 1, active + 1))}
                    disabled={atEnd}
                    className="inline-flex items-center gap-1.5 text-[0.85rem] text-sheet/80 hover:text-sheet disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
