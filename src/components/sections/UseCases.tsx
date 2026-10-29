"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Pause, Play, RotateCcw } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { Button } from "@/components/ui/Button";
import type { Answers, PhaseKey } from "@/lib/assessment/types";
import { PHASES } from "@/lib/assessment/types";
import { cn } from "@/lib/utils";

interface Milestone {
  start: number;
  end: number;
  phase: PhaseKey;
  title: string;
  detail: string;
}

interface UseCase {
  id: string;
  tab: string;
  title: string;
  challenge: string;
  builds: string[];
  weeks: number;
  milestones: Milestone[];
  related: string[];
  preset: Partial<Answers>;
}

// Example engagements. Timelines are typical for this kind of project, not
// records of specific client work.
const USE_CASES: UseCase[] = [
  {
    id: "church",
    tab: "Local church",
    title: "Online giving and events for a growing church",
    challenge:
      "Giving happens by envelope, event sign-ups live in a spreadsheet, and last year's sermons are hard to find. The office spends Mondays catching up.",
    builds: ["Refreshed website with a sermon library", "Recurring online giving with receipts", "Event registration with reminders"],
    weeks: 8,
    milestones: [
      { start: 1, end: 1, phase: "discover", title: "Discovery with your staff", detail: "We map your ministries, your audiences, and the questions visitors ask most." },
      { start: 2, end: 3, phase: "architect", title: "Sitemap and design", detail: "A new page structure, the sermon library layout, and two rounds of design revisions." },
      { start: 4, end: 6, phase: "build", title: "Giving, events, and sermons", detail: "Recurring giving, event registration with reminders, and a sermon library your team can update." },
      { start: 7, end: 7, phase: "test", title: "Volunteer testing", detail: "Volunteers try every path on their phones, and we fix whatever trips them up." },
      { start: 8, end: 8, phase: "launch", title: "Launch Sunday", detail: "Go live, train your staff, and announce the new site from the pulpit." },
    ],
    related: ["Himala Every Day"],
    preset: { buildTypes: ["redesign"], orgType: "church", features: ["giving", "events", "content"], audience: "small", content: "partial", timeline: "quarter" },
  },
  {
    id: "ministry",
    tab: "Ministry or NGO",
    title: "A donor portal with impact reporting",
    challenge:
      "Donors ask what their gifts accomplished, and the answer takes a week of spreadsheets. Field teams report in three different formats.",
    builds: ["Donor accounts with recurring gifts", "Impact dashboards by program", "One reporting format for field teams"],
    weeks: 14,
    milestones: [
      { start: 1, end: 2, phase: "discover", title: "Program and donor mapping", detail: "Interviews with your team and key donors to define what the portal must answer." },
      { start: 3, end: 4, phase: "architect", title: "Data model and prototype", detail: "How programs, donors, and outcomes connect, shown in a clickable prototype." },
      { start: 5, end: 10, phase: "build", title: "Portal and dashboards", detail: "Donor accounts, recurring gifts, and impact dashboards, built in weekly sprints you review." },
      { start: 11, end: 12, phase: "test", title: "Security and data review", detail: "A penetration test, a privacy review, and reconciliation against your existing records." },
      { start: 13, end: 14, phase: "launch", title: "Rollout to donors", detail: "Staged invitations to donors, staff training, and 30 days of support." },
    ],
    related: ["eSTAR Foundation", "Jesus.Net Philippines"],
    preset: { buildTypes: ["webapp"], orgType: "ministry", features: ["giving", "accounts", "reporting"], audience: "medium", content: "ready", timeline: "half" },
  },
  {
    id: "business",
    tab: "Faith-driven business",
    title: "An online store and marketing launch",
    challenge:
      "Orders come in through chat, inventory lives on paper, and the brand's values don't come through online. Growth has stalled at word of mouth.",
    builds: ["Online store with payments", "Inventory and accounting sync", "Search, social, and email launch campaign"],
    weeks: 10,
    milestones: [
      { start: 1, end: 1, phase: "discover", title: "Brand and customer workshop", detail: "Who you serve, what sets you apart, and how your values should show up online." },
      { start: 2, end: 3, phase: "architect", title: "Store design and brand system", detail: "Product pages, the checkout flow, and a brand system for web and social." },
      { start: 4, end: 7, phase: "build", title: "Store, payments, and inventory sync", detail: "An online store with payments, connected to your inventory and accounting tools." },
      { start: 8, end: 8, phase: "test", title: "Checkout testing", detail: "Test orders across devices and payment methods before real customers arrive." },
      { start: 9, end: 10, phase: "launch", title: "Launch campaign", detail: "Search setup, a social calendar, and a launch email to your customer list." },
    ],
    related: ["Glassbox Philippines"],
    preset: { buildTypes: ["website", "marketing"], orgType: "business", features: ["payments", "integrations"], audience: "medium", content: "partial", timeline: "quarter" },
  },
  {
    id: "school",
    tab: "School or training org",
    title: "An enrollment and learning portal",
    challenge:
      "Applications arrive by email, tuition is tracked by hand, and students hunt through group chats for class materials.",
    builds: ["Online applications and tuition payments", "Student dashboard with class materials", "Admin view for registrars"],
    weeks: 12,
    milestones: [
      { start: 1, end: 1, phase: "discover", title: "Enrollment journey mapping", detail: "Every step from inquiry to first class, mapped with your registrar and teachers." },
      { start: 2, end: 3, phase: "architect", title: "Portal design", detail: "The student dashboard, class pages, and an admin view for your staff." },
      { start: 4, end: 9, phase: "build", title: "Enrollment, payments, and classes", detail: "Online applications, tuition payments, class schedules, and course materials." },
      { start: 10, end: 11, phase: "test", title: "Pilot with one cohort", detail: "A real cohort enrolls through the portal while we watch and refine." },
      { start: 12, end: 12, phase: "launch", title: "Full enrollment opens", detail: "Open to every student, train your staff, and hand over the guides." },
    ],
    related: [],
    preset: { buildTypes: ["webapp"], orgType: "school", features: ["accounts", "events", "content", "payments"], audience: "medium", content: "partial", timeline: "half" },
  },
];

const weekRange = (m: Milestone) => (m.start === m.end ? `Week ${m.start}` : `Weeks ${m.start}–${m.end}`);

export function UseCases() {
  const { preset } = useAssessment();
  const [caseId, setCaseId] = useState(USE_CASES[0].id);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const useCase = USE_CASES.find((u) => u.id === caseId)!;
  const milestone = useCase.milestones[active];
  const atEnd = active === useCase.milestones.length - 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (atEnd) setPlaying(false);
      else setActive((i) => i + 1);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [playing, active, atEnd]);

  const selectCase = (id: string) => {
    setCaseId(id);
    setActive(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (atEnd) setActive(0);
    setPlaying(true);
  };

  const progressEnd = `${(milestone.end / useCase.weeks) * 100}%`;
  const tickEvery = useCase.weeks <= 10 ? 1 : 2;

  return (
    <section id="use-cases" className="py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-16 mb-10">
          <div>
            <div className="annot text-gold-deep mb-4">Use cases</div>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink">
              See how a project unfolds, week by week.
            </h2>
          </div>
          <p className="text-[1rem] leading-[1.7] text-graphite lg:pt-9 max-w-[36rem]">
            Example engagements for the organizations we serve, from local churches to faith-driven businesses. Timelines are
            typical for each kind of project; the Zion Agent tailors yours.
          </p>
        </div>

        <div role="tablist" aria-label="Use cases" className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 md:mx-0 md:px-0 mb-5">
          {USE_CASES.map((u) => (
            <button
              key={u.id}
              type="button"
              role="tab"
              aria-selected={u.id === caseId}
              aria-controls="use-case-panel"
              onClick={() => selectCase(u.id)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full border text-[0.88rem] font-medium transition-colors cursor-pointer",
                u.id === caseId ? "bg-ink border-ink text-sheet" : "bg-sheet border-rule text-ink-soft hover:border-ink",
              )}
            >
              {u.tab}
            </button>
          ))}
        </div>

        <div id="use-case-panel" role="tabpanel" className="bg-sheet border border-rule rounded-[14px] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            {/* Story */}
            <AnimatePresence mode="wait">
              <motion.div
                key={useCase.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-7 md:p-9 border-b lg:border-b-0 lg:border-r border-rule"
              >
                <div className="annot text-graphite">Example engagement · {useCase.tab}</div>
                <h3 className="mt-3 font-display text-[1.9rem] leading-[1.1] font-semibold text-ink">{useCase.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-[1.65] text-ink-soft">{useCase.challenge}</p>

                <div className="mt-6 annot text-graphite">What Zion builds</div>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {useCase.builds.map((b) => (
                    <li key={b} className="flex gap-2.5 text-[0.92rem] text-ink">
                      <Check size={16} strokeWidth={2.5} className="text-gold-deep shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>

                {useCase.related.length > 0 && (
                  <p className="mt-6 text-[0.85rem] text-graphite">
                    Related work:{" "}
                    {useCase.related.map((r, i) => (
                      <React.Fragment key={r}>
                        {i > 0 && ", "}
                        <a href="#work" className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
                          {r}
                        </a>
                      </React.Fragment>
                    ))}
                  </p>
                )}

                <Button
                  className="mt-7"
                  onClick={() =>
                    preset(useCase.preset, `I've filled in answers for a project like "${useCase.title}". Add your website and adjust anything that's different for you.`)
                  }
                >
                  Scope something like this <ArrowRight size={16} />
                </Button>
              </motion.div>
            </AnimatePresence>

            {/* Timeline */}
            <div className="p-7 md:p-9 bg-paper/60">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="annot text-graphite">Typical timeline</div>
                  <div className="font-display text-[1.6rem] font-semibold text-ink leading-tight">{useCase.weeks} weeks</div>
                </div>
                <Button variant="ghost" onClick={togglePlay} aria-label={playing ? "Pause timeline" : "Play timeline"}>
                  {playing ? <Pause size={15} /> : atEnd ? <RotateCcw size={15} /> : <Play size={15} />}
                  {playing ? "Pause" : atEnd ? "Replay" : "Play"}
                </Button>
              </div>

              {/* Track: phases as a gold trace with a node per milestone */}
              <div className="relative mt-8 mb-6 h-16">
                <div className="absolute inset-x-0 top-5 h-[3px] -translate-y-1/2 rounded-full bg-rule" aria-hidden />
                <motion.div
                  className="absolute left-0 top-5 h-[3px] -translate-y-1/2 rounded-full bg-gold"
                  animate={{ width: progressEnd }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden
                />
                {useCase.milestones.map((m, i) => {
                  const center = `${((m.start - 1 + (m.end - m.start + 1) / 2) / useCase.weeks) * 100}%`;
                  const state = i < active ? "done" : i === active ? "active" : "upcoming";
                  const numeral = PHASES.find((p) => p.key === m.phase)!.numeral;
                  return (
                    <button
                      key={m.title}
                      type="button"
                      onClick={() => {
                        setActive(i);
                        setPlaying(false);
                      }}
                      aria-label={`${weekRange(m)}: ${m.title}`}
                      aria-current={state === "active" ? "step" : undefined}
                      className={cn(
                        "absolute top-5 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-display font-semibold transition-all cursor-pointer",
                        state === "active" && "w-10 h-10 text-[1rem] bg-ink text-gold-bright ring-4 ring-gold-wash",
                        state === "done" && "w-8 h-8 text-[0.85rem] bg-gold text-ink",
                        state === "upcoming" && "w-8 h-8 text-[0.85rem] bg-sheet border-2 border-rule text-graphite hover:border-ink",
                      )}
                      style={{ left: center }}
                    >
                      {numeral}
                    </button>
                  );
                })}
                {Array.from({ length: useCase.weeks }, (_, i) => i + 1)
                  .filter((w) => (w - 1) % tickEvery === 0)
                  .map((w) => (
                    <span
                      key={w}
                      className="absolute top-11 -translate-x-1/2 font-mono text-[0.62rem] text-mist"
                      style={{ left: `${((w - 0.5) / useCase.weeks) * 100}%` }}
                      aria-hidden
                    >
                      W{w}
                    </span>
                  ))}
              </div>

              {/* Milestone detail */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${useCase.id}-${active}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="bg-sheet border border-rule rounded-xl p-5"
                  aria-live="polite"
                >
                  <div className="annot text-gold-deep">
                    {weekRange(milestone)} · {PHASES.find((p) => p.key === milestone.phase)!.name}
                  </div>
                  <div className="mt-2 text-[1.05rem] font-semibold text-ink">{milestone.title}</div>
                  <p className="mt-1.5 text-[0.9rem] leading-[1.6] text-graphite">{milestone.detail}</p>
                </motion.div>
              </AnimatePresence>

              <ol className="mt-5 flex flex-col">
                {useCase.milestones.map((m, i) => (
                  <li key={m.title}>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(i);
                        setPlaying(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 py-2 text-left text-[0.85rem] border-b border-rule-soft last:border-0 cursor-pointer",
                        i === active ? "text-ink font-medium" : "text-graphite hover:text-ink",
                      )}
                    >
                      <span className="font-mono text-[0.7rem] w-16 shrink-0 text-mist">{weekRange(m).replace("Weeks ", "W").replace("Week ", "W")}</span>
                      {m.title}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
