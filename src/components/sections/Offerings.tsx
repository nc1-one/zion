"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Code, Megaphone, Monitor, Settings, Shield, Users, Zap, type LucideIcon } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { Button } from "@/components/ui/Button";
import { ManagedIT } from "./ManagedIT";
import { SERVICE_GROUPS, SERVICES } from "@/lib/assessment/services";
import type { ServiceId } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";
import { RevealHeading } from "@/components/ui/motion";

const ICONS: Record<ServiceId, LucideIcon> = {
  software: Code,
  design: Monitor,
  infrastructure: Zap,
  managed: Users,
  security: Shield,
  marketing: Megaphone,
  consulting: Settings,
};

export function Offerings() {
  const { proposal, preset } = useAssessment();
  const inScope = new Set(proposal?.recommendedServices ?? []);
  const [picked, setPicked] = useState<ServiceId | null>(null);
  const selectedId = picked ?? proposal?.recommendedServices[0] ?? "software";
  const selected = SERVICES.find((s) => s.id === selectedId)!;
  const SelectedIcon = ICONS[selected.id];

  const scopeThis = () =>
    preset(
      selected.buildType ? { buildTypes: [selected.buildType] } : {},
      `Started a scope with ${selected.title}. Add your website.`,
    );

  const onListKey = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const next = SERVICES[(index + delta + SERVICES.length) % SERVICES.length];
    setPicked(next.id);
    document.getElementById(`offering-tab-${next.id}`)?.focus();
  };

  return (
    <section id="offerings" className="py-20 md:py-28 px-5 md:px-10 bg-sheet border-y border-rule">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-16 mb-12">
          <div>
            {proposal && <div className="annot text-gold-deep mb-4">In your scope</div>}
            <RevealHeading key={proposal ? "scope" : "all"} text={proposal ? "Services in your scope" : "Services"} className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
          </div>
          {proposal && <p className="text-[1rem] leading-[1.7] text-graphite lg:pt-9 max-w-[36rem]">Your scope uses {inScope.size} of these.</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-16 items-start">
          {/* Offering list, grouped */}
          <div role="tablist" aria-orientation="vertical" aria-label="Zion offerings" className="flex flex-col gap-6">
            {SERVICE_GROUPS.map((group) => (
              <div key={group.id}>
                <div className="font-display text-[1.35rem] font-semibold text-ink mb-2">{group.label}</div>
                <div className="flex flex-col border-t border-rule">
                  {SERVICES.filter((s) => s.group === group.id).map((svc) => {
                    const Icon = ICONS[svc.id];
                    const active = svc.id === selected.id;
                    const index = SERVICES.indexOf(svc);
                    return (
                      <motion.button
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        key={svc.id}
                        id={`offering-tab-${svc.id}`}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls="offering-panel"
                        tabIndex={active ? 0 : -1}
                        onClick={() => setPicked(svc.id)}
                        onKeyDown={(e) => onListKey(e, index)}
                        className={cn(
                          "group relative flex items-center gap-3.5 w-full text-left px-3 py-3.5 border-b border-rule transition-colors cursor-pointer",
                          !active && "hover:bg-paper/60",
                        )}
                      >
                        {active && (
                          <motion.span layoutId="offering-active" className="absolute inset-0 bg-paper border-l-[3px] border-gold" transition={{ type: "spring", stiffness: 420, damping: 38 }} aria-hidden />
                        )}
                        <Icon size={19} strokeWidth={1.7} className={cn("relative", active ? "text-gold-bright" : "text-graphite")} />
                        <span className={cn("relative flex-1 text-[0.98rem]", active ? "font-semibold text-ink" : "font-medium text-ink-soft")}>
                          {svc.title}
                        </span>
                        {inScope.has(svc.id) && (
                          <span className="annot text-gold-deep">In scope</span>
                        )}
                        <ArrowRight
                          size={16}
                          className={cn("transition-[opacity,transform]", active ? "opacity-100 text-ink" : "opacity-0 -translate-x-1 group-hover:opacity-60")}
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:sticky lg:top-[calc(var(--nav-height)+2rem)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                id="offering-panel"
                role="tabpanel"
                aria-labelledby={`offering-tab-${selected.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "rounded-[14px] border p-7 md:p-9",
                  inScope.has(selected.id) ? "bg-gold-wash border-gold" : "bg-paper border-rule",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="w-12 h-12 rounded-xl bg-gold-wash border border-gold/40 flex items-center justify-center">
                    <SelectedIcon size={22} strokeWidth={1.7} className="text-gold-bright" />
                  </span>
                  <span className="annot text-graphite pt-1">
                    {SERVICE_GROUPS.find((g) => g.id === selected.group)!.label}
                    {inScope.has(selected.id) && <span className="text-gold-deep"> · In your scope</span>}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-[2rem] leading-[1.1] font-semibold text-ink">{selected.title}</h3>
                <p className="mt-3 text-[0.98rem] leading-[1.7] text-ink-soft">{selected.desc}</p>

                <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {selected.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[0.9rem] leading-[1.45] text-ink">
                      <Check size={16} strokeWidth={2.5} className="text-gold-deep shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button onClick={scopeThis} className="mt-7">
                  Scope this <ArrowRight size={16} />
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ManagedIT />
      </div>
    </section>
  );
}
