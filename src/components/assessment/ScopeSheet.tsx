"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAssessment } from "./AssessmentProvider";
import { Roadmap, RoadmapPlaceholder } from "./Roadmap";
import {
  AUDIENCE_SIZES,
  BUILD_TYPES,
  CONTENT_READINESS,
  FEATURES,
  ORG_TYPES,
  TIMELINES,
  labelOf,
} from "@/lib/assessment/questions";
import { surveyNotes } from "@/lib/assessment/survey";
import { formatDate, hostOf, money, weeksLabel } from "@/lib/assessment/format";
import { PHASES } from "@/lib/assessment/types";
import { serviceTitle } from "@/lib/assessment/services";
import { cn } from "@/lib/utils";

// The scope of work, drawn as a drafting sheet. It fills in live while the
// visitor answers, then becomes the agent's finished proposal.
export function ScopeSheet() {
  const { stage, website, scan, scanStatus, answers, proposal } = useAssessment();
  const host = hostOf(scan?.finalUrl ?? website);
  const done = stage === "done" && proposal;

  const brief: [string, string | null][] = [
    ["For", host ?? (stage === "intro" ? null : "No website yet")],
    ["Organization", answers.orgType ? labelOf(ORG_TYPES, answers.orgType) : null],
    ["Building", answers.buildTypes?.length ? answers.buildTypes.map((b) => labelOf(BUILD_TYPES, b)).join(", ") : null],
    ["Must-haves", answers.features?.length ? answers.features.map((f) => labelOf(FEATURES, f)).join(", ") : null],
    ["Audience", answers.audience ? labelOf(AUDIENCE_SIZES, answers.audience) : null],
    ["Content", answers.content ? labelOf(CONTENT_READINESS, answers.content) : null],
    ["Timeline", answers.timeline ? labelOf(TIMELINES, answers.timeline) : null],
  ];

  return (
    <article
      id="scope-sheet"
      aria-live="polite"
      aria-busy={stage === "drafting"}
      className="relative bg-sheet border border-rule rounded-[10px] shadow-[0_1px_0_rgba(19,32,44,0.04),0_30px_70px_-34px_rgba(19,32,44,0.35)]"
    >
      <header className="flex items-center justify-between gap-4 px-5 sm:px-7 py-3 border-b border-rule">
        <span className="annot text-graphite">Scope of work</span>
        <span className="flex items-center gap-2 annot text-mist">
          {stage === "drafting" && <span className="w-1.5 h-1.5 rounded-full bg-trace animate-pulse" aria-hidden />}
          {done ? proposal.ref : stage === "drafting" ? "Drafting" : stage === "intro" ? "Blank" : "In progress"}
        </span>
      </header>

      <div className="px-5 sm:px-7 pt-6 pb-7 flex flex-col gap-7">
        {/* Title */}
        <div>
          {done ? (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="font-display text-[1.75rem] sm:text-[2rem] leading-[1.1] font-semibold text-ink">
                {proposal.projectTitle}
              </h3>
              <p className="mt-3 text-[0.92rem] leading-[1.65] text-ink-soft">{proposal.summary}</p>
            </motion.div>
          ) : (
            <>
              <h3 className="font-display text-[1.75rem] sm:text-[2rem] leading-[1.1] font-semibold text-mist select-none">
                {host ? `Project for ${host}` : "Your project"}
              </h3>
              <p className="mt-3 text-[0.88rem] text-mist">
                {stage === "intro"
                  ? "The Zion Agent drafts your scope here as you answer."
                  : stage === "drafting"
                    ? "Turning your answers into a roadmap, deliverables, and cost…"
                    : "Your answers appear here as you go."}
              </p>
            </>
          )}
        </div>

        {/* Brief */}
        {done ? (
          <p className="annot text-graphite leading-[1.9] -mt-3">
            {[host, labelOf(ORG_TYPES, proposal.answers.orgType), labelOf(TIMELINES, proposal.answers.timeline)]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        ) : (
          <dl className="grid grid-cols-[6.75rem_1fr] sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-[0.82rem]">
            {brief.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt className="annot text-mist pt-[3px]">{label}</dt>
                <dd className="min-h-[1.25rem]">
                  <AnimatePresence mode="wait" initial={false}>
                    {value ? (
                      <motion.span
                        key={value}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="text-ink"
                      >
                        {value}
                      </motion.span>
                    ) : (
                      <span className="block h-px mt-[0.7rem] border-t border-dashed border-rule" />
                    )}
                  </AnimatePresence>
                </dd>
              </React.Fragment>
            ))}
          </dl>
        )}

        {/* Site survey */}
        <SheetSection label="Site survey">
          {done && proposal.siteFindings.length > 0 ? (
            <Notes notes={proposal.siteFindings} />
          ) : scanStatus === "scanning" ? (
            <p className="flex items-center gap-2 text-[0.85rem] text-trace">
              <span className="w-1.5 h-1.5 rounded-full bg-trace animate-pulse" aria-hidden />
              Reading {host}…
            </p>
          ) : scan?.ok ? (
            <Notes notes={surveyNotes(scan).length ? surveyNotes(scan) : ["Site read. No obvious issues on the home page."]} />
          ) : scan && !scan.ok ? (
            <p className="text-[0.85rem] text-graphite">
              {scan.error} The agent will scope from your answers instead.
            </p>
          ) : (
            <p className="text-[0.85rem] text-mist">
              {stage === "intro" ? "Share your website and the agent reads it first." : "No website to read. The agent will scope from your answers."}
            </p>
          )}
        </SheetSection>

        {/* Roadmap */}
        <SheetSection label="Roadmap" aside={done ? weeksLabel(proposal.totalWeeks) : undefined}>
          {done ? <Roadmap phases={proposal.phases} totalWeeks={proposal.totalWeeks} /> : <RoadmapPlaceholder drafting={stage === "drafting"} />}
        </SheetSection>

        {/* Deliverables */}
        <SheetSection label="Deliverables">
          {done ? (
            <div className="flex flex-col gap-5">
              {proposal.phases.map((phase) => (
                <div key={phase.key}>
                  <div className="flex items-baseline justify-between gap-3 pb-1.5 border-b border-rule">
                    <span className="text-[0.8rem] font-semibold text-ink">
                      <span className="font-display text-gold-deep mr-1.5">{PHASES.find((p) => p.key === phase.key)!.numeral}</span>
                      {phase.name}
                    </span>
                    <span className="font-mono text-[0.72rem] text-graphite">{money(phase.cost)}</span>
                  </div>
                  <ul>
                    {phase.deliverables.map((d) => (
                      <li key={d.name} className="flex justify-between gap-4 py-2.5 border-b border-rule-soft last:border-0">
                        <span className="min-w-0">
                          <span className="block text-[0.85rem] font-medium text-ink">{d.name}</span>
                          <span className="block text-[0.78rem] leading-[1.5] text-graphite mt-0.5">{d.description}</span>
                        </span>
                        <span className="font-mono text-[0.75rem] text-ink shrink-0 pt-0.5">{money(d.cost)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[0.85rem] text-mist">
              {stage === "drafting" ? "Listing what you'll receive in each phase…" : "Each phase's deliverables and cost will be listed here."}
            </p>
          )}
        </SheetSection>

        {done && (
          <SheetSection label="Assumptions">
            <ul className="flex flex-col gap-1.5">
              {proposal.assumptions.map((a) => (
                <li key={a} className="text-[0.8rem] leading-[1.55] text-graphite pl-4 relative before:absolute before:left-0 before:top-[0.6em] before:w-2 before:h-px before:bg-mist">
                  {a}
                </li>
              ))}
            </ul>
            {proposal.recommendedServices.length > 0 && (
              <p className="mt-3 text-[0.8rem] text-graphite">
                <span className="text-ink font-medium">Zion teams involved:</span>{" "}
                {proposal.recommendedServices.map(serviceTitle).join(", ")}
              </p>
            )}
          </SheetSection>
        )}
      </div>

      {/* Title block, as on a drawing sheet */}
      <footer className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_1.4fr] border-t border-rule text-left">
        <TitleCell label="Prepared by" value={done ? (proposal.source === "agent" ? "Zion Agent" : "Zion estimator") : "Zion Agent"} />
        <TitleCell label="Date" value={done ? formatDate(proposal.createdAt) : null} />
        <TitleCell label="Timeline" value={done ? weeksLabel(proposal.totalWeeks) : null} />
        <div className="col-span-2 sm:col-span-1 px-5 sm:px-6 py-3.5 border-t sm:border-t-0 sm:border-l border-rule bg-gold-wash/60">
          <div className="annot text-gold-deep">Estimated investment</div>
          <div className={cn("font-display text-[1.9rem] leading-none font-semibold mt-1", done ? "text-ink" : "text-mist")}>
            {done ? money(proposal.totalCost) : "$ —"}
          </div>
        </div>
      </footer>
    </article>
  );
}

function SheetSection({ label, aside, children }: { label: string; aside?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h4 className="annot text-graphite shrink-0">{label}</h4>
        <span className="h-px flex-1 bg-rule" aria-hidden />
        {aside && <span className="annot text-graphite shrink-0">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Notes({ notes }: { notes: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note, i) => (
        <motion.li
          key={note}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="relative pl-5 text-[0.85rem] leading-[1.5] text-trace"
        >
          <span className="absolute left-0 top-[0.5em] w-[7px] h-[7px] rounded-full border-[1.5px] border-trace" aria-hidden />
          {note}
        </motion.li>
      ))}
    </ul>
  );
}

function TitleCell({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="px-5 sm:px-6 py-3.5 border-rule [&:not(:first-child)]:border-l">
      <div className="annot text-mist">{label}</div>
      <div className={cn("text-[0.85rem] font-medium mt-1", value ? "text-ink" : "text-mist")}>{value ?? "—"}</div>
    </div>
  );
}
