"use client";

import React from "react";
import { motion } from "framer-motion";
import { PHASES } from "@/lib/assessment/types";

const PHASE_DESCRIPTIONS: Record<(typeof PHASES)[number]["key"], string> = {
  discover: "Deep-dive into your mission, stakeholders, and goals. We map the full vision before writing a single line of code.",
  architect: "System design, technology selection, and structural planning with full transparency and client sign-off.",
  build: "Sprint-based development with continuous feedback. You see progress every week, not just at the end.",
  test: "Rigorous QA, security review, and performance testing. Nothing passes the gate unless it meets the standard.",
  launch: "Deployment, monitoring, and ongoing support. We don't just hand off — we walk beside you post-launch.",
};

export function ZPL() {
  return (
    <section id="process" className="bg-ink text-sheet py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-12 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-[calc(var(--nav-height)+2.5rem)]">
          <div className="annot text-gold-bright mb-4">Our signature process</div>
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold">
            The Zion Production Line&trade;
          </h2>
          <p className="mt-5 text-[1rem] leading-[1.7] text-sheet/70 max-w-[32rem]">
            Our proprietary development methodology — the <strong className="text-gold-bright font-semibold">ZPL</strong> — is what
            sets us apart. A battle-tested, phase-gated operating framework that brings order, excellence, and accountability to
            every build. Every scope the Zion Agent drafts follows these five phases.
          </p>
          <blockquote className="mt-8 pl-5 border-l-2 border-gold max-w-[32rem]">
            <p className="font-display text-[1.2rem] italic leading-[1.5] text-sheet/90">
              Think of it as a production line where every station has a purpose, every handoff is intentional, and the final
              product reflects the standard of the Kingdom.
            </p>
          </blockquote>
          <dl className="mt-10 grid grid-cols-3 max-w-[32rem] border-t border-sheet/15">
            {[
              { val: "5", label: "Core phases" },
              { val: "98%", label: "On-time rate" },
              { val: "0", label: "Shortcuts" },
            ].map((m) => (
              <div key={m.label} className="pt-4 flex flex-col-reverse">
                <dt className="annot text-sheet/50 mt-2">{m.label}</dt>
                <dd className="font-display text-[2.2rem] font-semibold text-gold-bright leading-none">{m.val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ol className="relative">
          {/* the line that runs through every station */}
          <span className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-gold/40" aria-hidden />
          {PHASES.map((phase, idx) => (
            <motion.li
              key={phase.key}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex gap-6 py-6 border-b border-sheet/10 last:border-0"
            >
              <span className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-ink border-2 border-gold flex items-center justify-center font-display text-[1.05rem] font-semibold text-gold-bright">
                {phase.numeral}
              </span>
              <div className="pt-1.5">
                <h3 className="font-display text-[1.5rem] leading-tight font-semibold">{phase.name}</h3>
                <p className="mt-2 text-[0.92rem] leading-[1.65] text-sheet/65 max-w-[34rem]">{PHASE_DESCRIPTIONS[phase.key]}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
