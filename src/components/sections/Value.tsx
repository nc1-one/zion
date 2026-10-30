"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CountUp, RevealHeading } from "@/components/ui/motion";

const POINTS = [
  { title: "Costs less", desc: "A lean team and modern tools keep the bill small." },
  { title: "Tech for good", desc: "For churches, nonprofits, schools, and faith-driven businesses." },
  { title: "Pro-Kingdom", desc: "Built to help you reach, disciple, and serve." },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Value() {
  const chartRef = useRef<HTMLDivElement>(null);
  const inView = useInView(chartRef, { once: true, margin: "-120px" });

  return (
    <section id="why" className="py-20 md:py-28 px-5 md:px-10 bg-paper border-y border-rule">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-12 lg:gap-16 items-center">
          <div>
            <RevealHeading
              text="Good tech shouldn't cost a fortune."
              className="font-display text-[clamp(2.4rem,4.6vw,3.6rem)] leading-[1.04] font-semibold text-ink"
            />
            <p className="mt-5 text-[1.05rem] leading-[1.6] text-ink-soft max-w-[30rem]">
              Software for the Kingdom, priced for the mission.
            </p>
          </div>

          {/* Signature: what you'd pay elsewhere vs. with Zion */}
          <div ref={chartRef} className="rounded-[16px] border border-rule bg-sheet p-6 md:p-8">
            <div className="flex items-end justify-between gap-6">
              <div className="font-display text-[clamp(4rem,9vw,6.5rem)] leading-[0.85] font-semibold text-gold-bright">
                <CountUp value={inView ? 45 : 0} />%
              </div>
              <p className="pb-1 text-right text-[0.95rem] leading-snug text-ink-soft max-w-[14rem]">
                less than the usual commercial software
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-5">
              <div>
                <div className="text-[0.82rem] text-graphite mb-2">Typical commercial software</div>
                <motion.div
                  className="h-9 rounded-md bg-raised border border-rule origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: inView ? 1 : 0 }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              </div>
              <div>
                <div className="text-[0.82rem] text-ink font-medium mb-2">Zion</div>
                <div className="relative h-9">
                  <motion.div
                    className="absolute inset-y-0 left-0 w-[55%] rounded-md bg-gold origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: inView ? 1 : 0 }}
                    transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-[55%] right-0 ml-1.5 rounded-md border border-dashed border-gold/60 flex items-center justify-center text-[0.8rem] font-semibold text-gold-bright"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    You keep 45%
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
          {POINTS.map((point, i) => (
            <motion.li
              key={point.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="pt-5 border-t border-gold/50"
            >
              <h3 className="font-display text-[1.5rem] font-semibold text-ink">{point.title}</h3>
              <p className="mt-1.5 text-[0.92rem] leading-[1.6] text-graphite">{point.desc}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
