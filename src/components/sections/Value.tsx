"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { RevealHeading } from "@/components/ui/motion";

const ROWS = [
  { label: "Pricing", them: "Per seat, per add-on", us: "By size, modules you pick" },
  { label: "Team", them: "Overseas vendor", us: "Manila, your time zone" },
  { label: "Support", them: "Ticket queue", us: "The team that built it" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Value() {
  const tableRef = useRef<HTMLDivElement>(null);
  const inView = useInView(tableRef, { once: true, margin: "-120px" });

  return (
    <section id="why" className="py-24 md:py-32 px-5 md:px-10 bg-paper border-y border-rule">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-14 lg:gap-20 items-start">
        <div>
          <RevealHeading text="Good tech shouldn't cost a fortune." className="heading-section text-ink" />
          <p className="mt-6 text-[1.1rem] leading-[1.6] text-graphite max-w-[28rem]">
            Technology is for good, and for the Kingdom. We price it that way.
          </p>
        </div>

        <div ref={tableRef} role="table" aria-label="Zion compared with typical commercial software" className="text-[0.95rem]">
          <div role="row" className="grid grid-cols-[5.5rem_1fr_1fr] sm:grid-cols-[7rem_1fr_1fr] gap-x-4 pb-3 text-[0.82rem]">
            <span role="columnheader" />
            <span role="columnheader" className="text-mist">
              Typical software
            </span>
            <span role="columnheader" className="font-semibold text-gold-bright">
              Zion
            </span>
          </div>
          {ROWS.map((row, i) => (
            <motion.div
              key={row.label}
              role="row"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="grid grid-cols-[5.5rem_1fr_1fr] sm:grid-cols-[7rem_1fr_1fr] gap-x-4 py-4 border-t border-rule"
            >
              <span role="rowheader" className="text-[0.82rem] text-mist pt-0.5">
                {row.label}
              </span>
              <span role="cell" className="text-graphite">
                {row.them}
              </span>
              <span role="cell" className="text-ink font-medium">
                {row.us}
              </span>
            </motion.div>
          ))}

          {/* The bottom line */}
          <div role="row" className="grid grid-cols-[5.5rem_1fr_1fr] sm:grid-cols-[7rem_1fr_1fr] gap-x-4 pt-5 pb-1 border-t border-ink/40 items-center">
            <span role="rowheader" className="text-[0.82rem] text-mist">
              Cost
            </span>
            <span role="cell" className="block">
              <motion.span
                className="block h-3 rounded-full bg-raised origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: inView ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
              />
            </span>
            <span role="cell" className="flex items-center gap-3">
              <motion.span
                className="block h-3 w-[55%] rounded-full bg-gold origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: inView ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              />
              <span className="text-[0.82rem] font-semibold text-gold-bright whitespace-nowrap">45% less</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
