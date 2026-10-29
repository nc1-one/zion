"use client";

import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { Button } from "@/components/ui/Button";
import { CountUp, Reveal } from "@/components/ui/motion";
import { SERVICES } from "@/lib/assessment/services";
import { HOURLY_RATE } from "@/lib/assessment/pricing";
import { money } from "@/lib/assessment/format";
import { MANAGED_IT_OPTIONS, managedItEstimate, managedItQuote } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const managed = SERVICES.find((s) => s.id === "managed")!;

// "Your IT team": the managed IT plan with a live monthly estimate.
export function ManagedIT() {
  const { sendQuote } = useAssessment();
  const [staff, setStaff] = useState(15);
  const [options, setOptions] = useState<string[]>([]);
  const preview = managedItEstimate(staff, options);

  const toggle = (id: string) => setOptions((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  return (
    <Reveal className="mt-16 rounded-[14px] border border-gold/40 overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="bg-gold-wash p-7 md:p-10">
        <div className="annot text-gold-deep">{managed.title}</div>
        <h3 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.08] font-semibold text-ink">{managed.tagline}</h3>
        <p className="mt-4 text-[0.98rem] leading-[1.7] text-ink-soft max-w-[36rem]">{managed.desc}</p>
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
          {managed.includes.map((item) => (
            <li key={item} className="flex gap-2.5 text-[0.9rem] leading-[1.45] text-ink">
              <Check size={16} strokeWidth={2.5} className="text-gold shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-sheet p-7 md:p-10 lg:border-l border-t lg:border-t-0 border-gold/40 flex flex-col">
        <div className="annot text-mist">Monthly estimate</div>
        <label htmlFor="it-staff" className="mt-4 flex items-baseline justify-between gap-3 text-[0.92rem] text-ink">
          People who use IT at your organization
          <span className="font-display text-[1.6rem] font-semibold text-gold-bright tabular-nums">{staff}</span>
        </label>
        <input
          id="it-staff"
          type="range"
          min={1}
          max={100}
          value={staff}
          onChange={(e) => setStaff(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--color-gold)] cursor-pointer"
        />
        <div className="mt-1 flex justify-between font-mono text-[0.65rem] text-mist">
          <span>1</span>
          <span>100</span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {MANAGED_IT_OPTIONS.map((o) => {
            const on = options.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.id)}
                className={cn(
                  "flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-lg border text-[0.88rem] transition-colors cursor-pointer",
                  on ? "border-gold bg-gold-wash text-ink" : "border-rule text-ink-soft hover:border-graphite",
                )}
              >
                <span
                  className={cn(
                    "w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0",
                    on ? "bg-gold border-gold text-paper" : "border-mist",
                  )}
                  aria-hidden
                >
                  {on && <Check size={12} strokeWidth={3} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-5 border-t border-rule" aria-live="polite">
          <div className="font-display text-[2.4rem] leading-none font-semibold text-ink">
            <CountUp value={preview.totalCost} format={money} />
            <span className="text-[1rem] font-body font-normal text-graphite"> a month</span>
          </div>
          <div className="mt-2 font-mono text-[0.7rem] text-graphite">
            {preview.totalHours} hours a month × {money(HOURLY_RATE)}/hour
          </div>
        </div>

        <Button className="mt-6 self-start" onClick={() => sendQuote(managedItQuote(staff, options))}>
          Request this plan <ArrowRight size={16} />
        </Button>
      </div>
    </Reveal>
  );
}
