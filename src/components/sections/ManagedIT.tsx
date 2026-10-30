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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.82rem] font-medium text-mist mb-2.5">{children}</div>;
}

// "Your IT team": a monthly plan priced from size, services, developers, and term.
export function ManagedIT() {
  const { sendQuote } = useAssessment();
  const [size, setSize] = useState<ItSizeId>("s");
  const [services, setServices] = useState<ItServiceId[]>(["helpdesk", "devices", "workspace", "security"]);
  const [dev, setDev] = useState<DevTeamId>("none");
  const [term, setTerm] = useState<ItTermId>("12m");
  const estimate = managedItEstimate(size, services, dev, term);

  const toggle = (id: ItServiceId) => setServices((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <Reveal className="mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h3 className="font-display text-[clamp(1.9rem,3.2vw,2.6rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-ink">
            No IT team? We&apos;ll be your IT team.
          </h3>
          <p className="mt-3 text-[1.02rem] text-graphite">And your dev team, when you need one.</p>
        </div>
        <span className="text-[0.82rem] text-mist">Managed IT · monthly plan</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] rounded-[20px] ring-1 ring-rule overflow-hidden">
        <div className="bg-night p-6 md:p-8 flex flex-col gap-8">
          <div>
            <Label>People on your team</Label>
            <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-sheet ring-1 ring-rule">
              {IT_SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={size === s.id}
                  onClick={() => setSize(s.id)}
                  className={cn("relative px-3.5 py-1.5 rounded-lg text-[0.85rem] transition-colors cursor-pointer", size === s.id ? "text-night font-semibold" : "text-graphite hover:text-ink")}
                >
                  {size === s.id && <motion.span layoutId="it-size" className="absolute inset-0 rounded-lg bg-ink" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
                  <span className="relative">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>What we cover</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {IT_SERVICES.map((sv) => {
                const on = services.includes(sv.id);
                return (
                  <button
                    key={sv.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(sv.id)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-[0.88rem] ring-1 transition-[box-shadow,color] cursor-pointer",
                      on ? "ring-gold/70 bg-sheet text-ink" : "ring-rule text-graphite hover:text-ink hover:ring-mist",
                    )}
                  >
                    <span className={cn("w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 transition-colors", on ? "bg-gold text-night" : "ring-1 ring-inset ring-mist")} aria-hidden>
                      {on && <Check size={12} strokeWidth={3} />}
                    </span>
                    {sv.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Developers, as needed</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {DEV_TEAM.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={dev === d.id}
                  onClick={() => setDev(d.id)}
                  className={cn(
                    "px-3.5 py-3 rounded-xl text-left ring-1 transition-[box-shadow,color] cursor-pointer",
                    dev === d.id ? "ring-gold/70 bg-sheet" : "ring-rule hover:ring-mist",
                  )}
                >
                  <span className={cn("block text-[0.88rem]", dev === d.id ? "text-ink font-medium" : "text-graphite")}>{d.label}</span>
                  {d.detail && <span className="block mt-0.5 text-[0.75rem] text-mist">{d.detail}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-sheet p-6 md:p-8 border-t lg:border-t-0 lg:border-l border-rule flex flex-col">
          <Label>Contract</Label>
          <div className="flex flex-col gap-1.5">
            {IT_TERMS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={term === t.id}
                onClick={() => setTerm(t.id)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-[0.88rem] ring-1 transition-[box-shadow,color] cursor-pointer",
                  term === t.id ? "ring-gold/70 text-ink" : "ring-rule text-graphite hover:text-ink hover:ring-mist",
                )}
              >
                {t.label}
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center", term === t.id ? "ring-[1.5px] ring-gold" : "ring-1 ring-mist")}>
                  {term === t.id && <span className="w-2 h-2 rounded-full bg-gold" />}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-10" aria-live="polite">
            <div className="font-display text-[2.8rem] leading-none font-semibold tracking-[-0.04em] text-ink">
              <CountUp value={estimate.monthly} format={money} />
              <span className="text-[1rem] font-body font-normal tracking-normal text-graphite"> / month</span>
            </div>
            <div className="mt-2 text-[0.85rem] text-graphite">
              {money(estimate.contractTotal)} for {estimate.term.months} months
            </div>
            <Button className="mt-6 w-full justify-center" disabled={services.length === 0 && dev === "none"} onClick={() => sendQuote(managedItQuote(size, services, dev, term))}>
              Request this plan <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
