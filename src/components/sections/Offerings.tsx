"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { ManagedIT } from "./ManagedIT";
import { SERVICE_GROUPS, SERVICES, type Service } from "@/lib/assessment/services";
import { RevealHeading } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

export function Offerings() {
  const { proposal, preset } = useAssessment();
  const inScope = new Set(proposal?.recommendedServices ?? []);

  const scope = (svc: Service) =>
    preset(svc.buildType ? { buildTypes: [svc.buildType] } : {}, `Started a scope with ${svc.title}. Add your website.`);

  return (
    <section id="offerings" className="py-24 md:py-32 px-5 md:px-10 bg-paper border-y border-rule">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <RevealHeading text="Services" className="heading-section text-ink" />
          <p className="text-[1.05rem] text-graphite">
            {proposal ? `Your scope uses ${inScope.size} of these.` : "Build it, run it, grow it. One team."}
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-12">
          {SERVICE_GROUPS.map((group) => (
            <div key={group.id} className="grid grid-cols-1 md:grid-cols-[9rem_minmax(0,1fr)] gap-x-8 gap-y-3">
              <h3 className="text-[0.82rem] font-medium text-mist pt-5">{group.label}</h3>
              <ul className="border-t border-rule">
                {SERVICES.filter((s) => s.group === group.id).map((svc, i) => {
                  const picked = inScope.has(svc.id);
                  return (
                    <motion.li
                      key={svc.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="group border-b border-rule"
                    >
                      <button
                        type="button"
                        onClick={() => scope(svc)}
                        className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto] gap-x-8 gap-y-1.5 items-baseline py-5 text-left cursor-pointer"
                      >
                        <span>
                          <span className="flex items-center gap-2.5 text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">
                            {svc.title}
                            {picked && <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-label="In your scope" />}
                          </span>
                        </span>
                        <span className="text-[0.9rem] leading-relaxed text-graphite">{svc.includes.join(" · ")}</span>
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-[0.85rem] font-medium transition-[color,transform] lg:translate-x-0 group-hover:translate-x-0.5",
                            picked ? "text-gold-bright" : "text-graphite group-hover:text-gold-bright",
                          )}
                        >
                          {picked ? "In your scope" : "Scope this"} <ArrowRight size={14} />
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <ManagedIT />
      </div>
    </section>
  );
}
