"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, FileDown, Loader2, RotateCcw, Send } from "lucide-react";
import { useAssessment } from "./AssessmentProvider";
import { ScopeSheet } from "./ScopeSheet";
import { Button } from "@/components/ui/Button";
import {
  AUDIENCE_SIZES,
  BUILD_TYPES,
  CONTENT_READINESS,
  FEATURES,
  ORG_TYPES,
  TIMELINES,
} from "@/lib/assessment/questions";
import type { Answers } from "@/lib/assessment/types";
import { money, weeksLabel } from "@/lib/assessment/format";
import { serviceTitle } from "@/lib/assessment/services";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string; hint?: string };
type Step =
  | { key: "buildTypes" | "features"; kind: "multi"; title: string; hint: string; options: readonly Option[]; optional?: boolean }
  | { key: "orgType" | "audience" | "content" | "timeline"; kind: "single"; title: string; hint?: string; options: readonly Option[] }
  | { key: "goal"; kind: "text"; title: string; hint: string };

const STEPS: Step[] = [
  { key: "buildTypes", kind: "multi", title: "What would you like to build?", hint: "Choose all that apply.", options: BUILD_TYPES },
  { key: "orgType", kind: "single", title: "What kind of organization are you?", options: ORG_TYPES },
  {
    key: "features",
    kind: "multi",
    title: "What does it need to do?",
    hint: "Choose any that matter. Skip this if you're not sure yet.",
    options: FEATURES,
    optional: true,
  },
  { key: "audience", kind: "single", title: "How many people will use it each month?", options: AUDIENCE_SIZES },
  { key: "content", kind: "single", title: "How ready are your brand and content?", options: CONTENT_READINESS },
  { key: "timeline", kind: "single", title: "When do you need it?", options: TIMELINES },
  {
    key: "goal",
    kind: "text",
    title: "What should this project achieve?",
    hint: "A sentence or two in your own words. Optional, but it helps the agent tailor your scope.",
  },
];

export function Assessment() {
  const { stage } = useAssessment();

  return (
    <section id="assessment" className="relative pt-[calc(var(--nav-height)+2.5rem)] md:pt-[calc(var(--nav-height)+4rem)] pb-20 md:pb-28 px-5 md:px-10 overflow-clip">
      <div className="drafting-grid absolute inset-0 pointer-events-none" aria-hidden />
      <div className="relative max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-10 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-[calc(var(--nav-height)+2.5rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {stage === "intro" && <IntroPanel />}
              {stage === "questions" && <QuestionPanel />}
              {stage === "drafting" && <DraftingPanel />}
              {stage === "done" && <DonePanel />}
            </motion.div>
          </AnimatePresence>
        </div>
        <ScopeSheet />
      </div>
    </section>
  );
}

function AgentMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 annot text-trace mb-6">
      <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden className="shrink-0">
        <path d="M1 7h7l3-5h5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 7l3 5h5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="2" r="1.8" fill="currentColor" />
        <circle cx="20" cy="12" r="1.8" fill="currentColor" />
      </svg>
      {children}
    </div>
  );
}

// ---- Intro -------------------------------------------------------------------

function IntroPanel() {
  const { start } = useAssessment();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!/^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/i.test(value)) {
      setError("Enter your website address, like yourchurch.org.");
      return;
    }
    start(value);
  };

  return (
    <div>
      <AgentMark>Zion Agent · Free scoping assessment</AgentMark>
      <h1 className="font-display text-[clamp(2.6rem,5.6vw,4.4rem)] leading-[1.02] font-semibold text-ink tracking-[-0.01em]">
        Know what to build <em className="text-gold-deep">before</em> you build it.
      </h1>
      <p className="mt-6 text-[1.05rem] leading-[1.7] text-ink-soft max-w-[34rem]">
        The Zion Agent reads your current website, asks seven quick questions, and drafts a roadmap, deliverables, timeline,
        and cost for your organization. It&apos;s free and takes about three minutes.
      </p>

      <form onSubmit={submit} className="mt-9 max-w-[34rem]" noValidate>
        <label htmlFor="site-url" className="annot text-graphite">
          Your current website
        </label>
        <div className="mt-2 flex flex-col sm:flex-row gap-2.5">
          <input
            id="site-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="yourchurch.org"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "site-url-error" : undefined}
            className="flex-1 min-w-0 h-12 px-4 bg-sheet border border-rule rounded-lg text-[0.95rem] text-ink placeholder:text-mist outline-none transition-[border-color,box-shadow] focus:border-trace focus:shadow-[0_0_0_3px_var(--color-trace-wash)]"
          />
          <Button type="submit" className="h-12 justify-center">
            Start assessment <ArrowRight size={16} />
          </Button>
        </div>
        {error && (
          <p id="site-url-error" className="mt-2 text-[0.82rem] text-[#A23B2C]">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => start(null)}
          className="mt-3 text-[0.85rem] text-graphite underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink transition-colors cursor-pointer"
        >
          We don&apos;t have a website yet
        </button>
      </form>

      <div className="mt-12 pt-6 border-t border-rule max-w-[34rem]">
        <div className="annot text-mist mb-3">Trusted by Kingdom organizations</div>
        <p className="font-display text-[1.05rem] text-graphite leading-[1.7]">
          Jesus.Net Philippines · Turn Vertical · HopeBegins · eSTAR Foundation · Glassbox PH
        </p>
      </div>
    </div>
  );
}

// ---- Questions ---------------------------------------------------------------

function QuestionPanel() {
  const { step, answers, setAnswer, goToStep, draft, reset, error } = useAssessment();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const answered =
    current.kind === "multi"
      ? (current.optional ?? false) || (answers[current.key]?.length ?? 0) > 0
      : current.kind === "single"
        ? Boolean(answers[current.key])
        : true;

  const next = () => {
    if (!answered) return;
    if (isLast) void draft(answers);
    else goToStep(step + 1);
  };

  const pickSingle = (key: Extract<Step, { kind: "single" }>["key"], id: string) => {
    setAnswer(key, id as Answers[typeof key]);
    window.setTimeout(() => goToStep(Math.min(step + 1, STEPS.length - 1)), 220);
  };

  const toggleMulti = (key: "buildTypes" | "features", id: string) => {
    const list = (answers[key] ?? []) as string[];
    const nextList = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    setAnswer(key, nextList as Answers[typeof key]);
  };

  return (
    <div>
      <AgentMark>
        Question {step + 1} of {STEPS.length}
      </AgentMark>
      <div className="flex gap-1.5 mb-7" aria-hidden>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            tabIndex={-1}
            onClick={() => i < step && goToStep(i)}
            className={cn(
              "h-[3px] flex-1 rounded-full transition-colors",
              i < step ? "bg-gold cursor-pointer" : i === step ? "bg-ink" : "bg-rule",
            )}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-6 px-4 py-3 rounded-lg bg-[#FBEAE7] text-[#8E2F22] text-[0.85rem]">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.fieldset
          key={current.key}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22 }}
        >
          <legend className="font-display text-[clamp(1.7rem,3vw,2.15rem)] leading-[1.12] font-semibold text-ink">
            {current.title}
          </legend>
          {"hint" in current && current.hint && <p className="mt-2 text-[0.9rem] text-graphite">{current.hint}</p>}

          <div className="mt-6">
            {current.kind === "text" ? (
              <textarea
                autoFocus
                value={answers.goal ?? ""}
                onChange={(e) => setAnswer("goal", e.target.value.slice(0, 800))}
                rows={4}
                placeholder="For example: let our members register for retreats online and give monthly without calling the office."
                className="w-full p-4 bg-sheet border border-rule rounded-lg text-[0.95rem] leading-[1.6] text-ink placeholder:text-mist outline-none resize-y transition-[border-color,box-shadow] focus:border-trace focus:shadow-[0_0_0_3px_var(--color-trace-wash)]"
              />
            ) : (
              <div className={cn("grid gap-2", current.options.length >= 6 && "sm:grid-cols-2")}>
                {current.options.map((option) => {
                  const selected =
                    current.kind === "multi"
                      ? ((answers[current.key] ?? []) as string[]).includes(option.id)
                      : answers[current.key] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        current.kind === "multi" ? toggleMulti(current.key, option.id) : pickSingle(current.key, option.id)
                      }
                      className={cn(
                        "group flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer",
                        selected ? "border-ink bg-sheet shadow-[inset_0_0_0_1px_var(--color-ink)]" : "border-rule bg-sheet/70 hover:border-graphite",
                      )}
                    >
                      <span
                        className={cn(
                          "w-[18px] h-[18px] shrink-0 flex items-center justify-center border transition-colors",
                          current.kind === "multi" ? "rounded-[4px]" : "rounded-full",
                          selected ? "bg-ink border-ink text-sheet" : "border-mist",
                        )}
                        aria-hidden
                      >
                        {selected && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9rem] leading-snug font-medium text-ink">{option.label}</span>
                        {option.hint && <span className="block text-[0.76rem] leading-snug text-graphite mt-0.5">{option.hint}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.fieldset>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => (step === 0 ? reset() : goToStep(step - 1))}>
          <ArrowLeft size={16} /> {step === 0 ? "Start over" : "Back"}
        </Button>
        {(current.kind !== "single" || answers[current.key]) && (
          <Button onClick={next} disabled={!answered}>
            {isLast ? "Draft my scope" : current.kind === "multi" && current.optional && !answers[current.key]?.length ? "Skip" : "Continue"}
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

// ---- Drafting ----------------------------------------------------------------

const DRAFT_STEPS = [
  "Reading your site survey",
  "Matching your goals to deliverables",
  "Sequencing the roadmap",
  "Estimating effort and cost",
];

function DraftingPanel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((i) => Math.min(i + 1, DRAFT_STEPS.length - 1)), 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div>
      <AgentMark>Zion Agent · Drafting</AgentMark>
      <h2 className="font-display text-[clamp(2rem,4vw,2.8rem)] leading-[1.08] font-semibold text-ink">
        Drafting your scope of work.
      </h2>
      <p className="mt-4 text-[0.95rem] text-graphite max-w-[30rem]">
        This usually takes under a minute. Your scope appears on the sheet when it&apos;s ready.
      </p>
      <ol className="mt-8 flex flex-col gap-3.5">
        {DRAFT_STEPS.map((label, i) => (
          <li key={label} className={cn("flex items-center gap-3 text-[0.92rem]", i <= active ? "text-ink" : "text-mist")}>
            <span className="w-5 h-5 flex items-center justify-center shrink-0" aria-hidden>
              {i < active ? (
                <Check size={16} className="text-gold-deep" strokeWidth={2.5} />
              ) : i === active ? (
                <Loader2 size={16} className="text-trace animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-rule" />
              )}
            </span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---- Done --------------------------------------------------------------------

function DonePanel() {
  const { proposal, editAnswers, reset, setAttachToContact } = useAssessment();
  if (!proposal) return null;

  const send = () => {
    setAttachToContact(true);
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <AgentMark>Scope ready · {proposal.ref}</AgentMark>
      <h2 className="font-display text-[clamp(2rem,4vw,2.8rem)] leading-[1.08] font-semibold text-ink">
        Here&apos;s what we&apos;d build together.
      </h2>
      <p className="mt-4 text-[0.95rem] leading-[1.65] text-graphite max-w-[32rem]">
        {proposal.source === "agent"
          ? "The Zion Agent drafted this from your answers and your site. Send it to us and a Zion team member will review it with you, usually within one business day."
          : "Drafted with Zion's standard estimator from your answers. Send it to us and a Zion team member will refine it with you, usually within one business day."}
      </p>

      <dl className="mt-7 grid grid-cols-2 max-w-[32rem] border border-rule rounded-lg bg-sheet">
        <div className="px-4 py-3">
          <dt className="annot text-mist">Estimated investment</dt>
          <dd className="font-display text-[1.7rem] font-semibold text-ink leading-tight mt-0.5">{money(proposal.totalCost)}</dd>
        </div>
        <div className="px-4 py-3 border-l border-rule">
          <dt className="annot text-mist">Timeline</dt>
          <dd className="font-display text-[1.7rem] font-semibold text-ink leading-tight mt-0.5">{weeksLabel(proposal.totalWeeks)}</dd>
        </div>
      </dl>

      <div className="mt-7 flex flex-wrap gap-2.5">
        <Button onClick={send}>
          Send this scope to Zion <Send size={15} />
        </Button>
        <Button variant="ghost" onClick={editAnswers}>
          Change my answers
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem]">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-graphite hover:text-ink cursor-pointer">
          <FileDown size={14} /> Save as PDF
        </button>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-graphite hover:text-ink cursor-pointer">
          <RotateCcw size={14} /> Start a new assessment
        </button>
      </div>

      {proposal.recommendedServices.length > 0 && (
        <div className="mt-10 pt-6 border-t border-rule max-w-[32rem]">
          <div className="annot text-mist mb-3">Zion offerings in your scope</div>
          <div className="flex flex-wrap gap-2">
            {proposal.recommendedServices.map((id) => (
              <a
                key={id}
                href="#offerings"
                className="px-3 py-1.5 rounded-full border border-gold/50 bg-gold-wash text-[0.8rem] text-gold-deep font-medium no-underline hover:border-gold-deep transition-colors"
              >
                {serviceTitle(id)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
