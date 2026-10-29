"use client";

import React from "react";
import { motion } from "framer-motion";
import { Code, Monitor, Settings, Shield, Users, Zap, type LucideIcon } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { SERVICES } from "@/lib/assessment/services";
import type { ServiceId } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ServiceId, LucideIcon> = {
  software: Code,
  design: Monitor,
  infrastructure: Zap,
  consulting: Settings,
  managed: Users,
  security: Shield,
};

export function Offerings() {
  const { proposal } = useAssessment();
  const inScope = new Set(proposal?.recommendedServices ?? []);
  const ordered = proposal ? [...SERVICES].sort((a, b) => Number(inScope.has(b.id)) - Number(inScope.has(a.id))) : SERVICES;

  return (
    <section id="offerings" className="py-20 md:py-28 px-5 md:px-10 border-t border-rule">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-16 mb-12">
          <div>
            <div className="annot text-gold-deep mb-4">{proposal ? "In your scope" : "What we offer"}</div>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink">
              {proposal ? "The Zion teams behind your build." : "Technology that serves the mission."}
            </h2>
          </div>
          <p className="text-[1rem] leading-[1.7] text-graphite lg:pt-9 max-w-[36rem]">
            {proposal
              ? `Your scope draws on ${inScope.size} of our ${SERVICES.length} offerings, marked below. The same team stays with you from discovery through launch.`
              : "From concept to deployment and beyond, we build, maintain, and scale the systems that power Kingdom-oriented organizations. Run the assessment above to see which of these your project needs."}
          </p>
        </div>

        <motion.ul layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-rule">
          {ordered.map((svc, idx) => {
            const Icon = ICONS[svc.id];
            const marked = inScope.has(svc.id);
            return (
              <motion.li
                layout
                key={svc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative p-7 md:p-8 border-r border-b border-rule transition-colors duration-500",
                  marked ? "bg-gold-wash" : "bg-sheet",
                  proposal && !marked && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <Icon size={22} strokeWidth={1.6} className={marked ? "text-gold-deep" : "text-ink"} />
                  {marked && (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.2 + idx * 0.08 }}
                      className="annot text-gold-deep border border-gold/60 rounded-full px-2.5 py-1 bg-sheet"
                    >
                      In your scope
                    </motion.span>
                  )}
                </div>
                <h3 className="font-display text-[1.45rem] leading-tight font-semibold text-ink mb-2.5">{svc.title}</h3>
                <p className="text-[0.88rem] leading-[1.65] text-graphite">{svc.desc}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
