"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { Button } from "@/components/ui/Button";
import { CountUp, Reveal } from "@/components/ui/motion";
import { money } from "@/lib/assessment/format";
import {
  DEV_TEAM,
  IT_SERVICES,
  IT_SIZES,
  IT_TERMS,
  managedItEstimate,
  managedItQuote,
  type DevTeamId,
  type ItServiceId,
  type ItSizeId,
  type ItTermId,
} from "@/lib/quotes";
import { cn } from "@/lib/utils";

// "Your IT team": a monthly plan priced from size, services, and term.
export function ManagedIT() {
  const { sendQuote } = useAssessment();
  const [size, setSize] = useState<ItSizeId>("s");
  const [services, setServices] = useState<ItServiceId[]>(["helpdesk", "devices", "workspace", "security"]);
  const [dev, setDev] = useState<DevTeamId>("none");
  const [term, setTerm] = useState<ItTermId>("12m");
  const estimate = managedItEstimate(size, services, dev, term);

  const toggle = (id: ItServiceId) => setServices((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <Reveal className="mt-16 rounded-[16px] border border-gold/40 overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <div className="bg-gold-wash p-7 md:p-10">
        <div className="annot text-gold-bright">Managed IT</div>
        <h3 className="mt-2 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.08] font-semibold text-ink">
          No need to build an IT team. We&apos;ll be your IT team.
        </h3>
        <p className="mt-3 text-[0.95rem] text-ink-soft">And your dev team, when you need one.</p>

        <div className="mt-8 annot text-graphite">How many people work with you?</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {IT_SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={size === s.id}
              onClick={() => setSize(s.id)}
              className={cn(
                "relative px-3.5 py-2 rounded-lg border text-[0.85rem] transition-colors cursor-pointer",
                size === s.id ? "border-gold text-paper font-semibold" : "border-rule text-ink-soft hover:border-graphite",
              )}
            >
              {size === s.id && <motion.span layoutId="it-size" className="absolute inset-0 rounded-lg bg-gold" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 annot text-graphite">What do you need covered?</div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {IT_SERVICES.map((sv) => {
            const on = services.includes(sv.id);
            return (
              <button
                key={sv.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(sv.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-[0.85rem] transition-colors cursor-pointer",
                  on ? "border-gold bg-night/40 text-ink" : "border-rule text-ink-soft hover:border-graphite",
                )}
              >
                <span
                  className={cn("w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors", on ? "bg-gold border-gold text-paper" : "border-mist")}
                  aria-hidden
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {sv.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-sheet p-7 md:p-10 lg:border-l border-t lg:border-t-0 border-gold/40 flex flex-col">
        <div className="annot text-graphite">Developers, as needed</div>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {DEV_TEAM.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={dev === d.id}
              onClick={() => setDev(d.id)}
              className={cn(
                "flex items-baseline justify-between gap-3 px-3.5 py-2 rounded-lg border text-left transition-colors cursor-pointer",
                dev === d.id ? "border-gold bg-gold-wash" : "border-rule hover:border-graphite",
              )}
            >
              <span className={cn("text-[0.86rem]", dev === d.id ? "text-ink font-medium" : "text-ink-soft")}>{d.label}</span>
              <span className="text-[0.75rem] text-mist">{d.detail}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 annot text-graphite">Contract</div>
        <div className="mt-2 flex flex-col gap-1.5">
          {IT_TERMS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={term === t.id}
              onClick={() => setTerm(t.id)}
              className={cn(
                "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-[0.88rem] transition-colors cursor-pointer",
                term === t.id ? "border-gold bg-gold-wash text-ink" : "border-rule text-ink-soft hover:border-graphite",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-7" aria-live="polite">
          <div className="font-display text-[2.8rem] leading-none font-semibold text-ink">
            <CountUp value={estimate.monthly} format={money} />
            <span className="text-[1rem] font-body font-normal text-graphite"> / month</span>
          </div>
          <div className="mt-2 text-[0.85rem] text-graphite">
            {money(estimate.contractTotal)} for {estimate.term.months} months
          </div>
          <Button className="mt-6 w-full justify-center" disabled={services.length === 0 && dev === "none"} onClick={() => sendQuote(managedItQuote(size, services, dev, term))}>
            Request this plan <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Reveal>
  );
}
