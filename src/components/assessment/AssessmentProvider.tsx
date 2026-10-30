"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import type { Answers, Proposal, Quote, ScanResult } from "@/lib/assessment/types";

export type Stage = "intro" | "questions" | "drafting" | "done";
export type ScanStatus = "none" | "scanning" | "done";
export type Attachment = "scope" | "quote" | null;

export const EMPTY_ANSWERS: Partial<Answers> = { buildTypes: [], features: [], goal: "" };

interface AssessmentState {
  stage: Stage;
  step: number;
  website: string | null;
  scan: ScanResult | null;
  scanStatus: ScanStatus;
  answers: Partial<Answers>;
  proposal: Proposal | null;
  error: string | null;
  // What the contact form sends along: the drafted scope or a quick quote.
  attachment: Attachment;
  quote: Quote | null;
  // Details the Zion Agent collected, for the contact form to fill in.
  contactDraft: ContactDraft | null;
}

export interface ContactDraft {
  id: number;
  fullName?: string;
  email?: string;
  organizationType?: string;
  referredBy?: string;
  message?: string;
}

interface AssessmentContextValue extends AssessmentState {
  start: (website: string | null) => void;
  setAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  goToStep: (step: number) => void;
  draft: (answers: Partial<Answers>) => Promise<void>;
  editAnswers: () => void;
  reset: () => void;
  setAttachment: (attachment: Attachment) => void;
  sendQuote: (quote: Quote) => void;
  preset: (answers: Partial<Answers>) => void;
  prefillContact: (draft: Omit<ContactDraft, "id">) => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

const INITIAL: AssessmentState = {
  stage: "intro",
  step: 0,
  website: null,
  scan: null,
  scanStatus: "none",
  answers: EMPTY_ANSWERS,
  proposal: null,
  error: null,
  attachment: null,
  quote: null,
  contactDraft: null,
};

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AssessmentState>(INITIAL);
  const scanPromise = useRef<Promise<ScanResult | null> | null>(null);
  const runId = useRef(0);

  const start = useCallback((website: string | null) => {
    const id = ++runId.current;
    setState((s) => ({
      ...s,
      stage: "questions",
      step: 0,
      website,
      scan: null,
      scanStatus: website ? "scanning" : "none",
      proposal: null,
      error: null,
    }));

    scanPromise.current = website
      ? fetch("/api/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: website }),
        })
          .then(async (res) => {
            const data = await res.json();
            return res.ok ? (data as ScanResult) : { ok: false, url: website, error: data.error ?? "We couldn't reach that site." };
          })
          .catch(() => ({ ok: false, url: website, error: "We couldn't reach that site." }))
          .then((scan) => {
            if (runId.current === id) setState((s) => ({ ...s, scan, scanStatus: "done" }));
            return scan;
          })
      : Promise.resolve(null);
  }, []);

  const setAnswer = useCallback(<K extends keyof Answers>(key: K, value: Answers[K]) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));
  }, []);

  const goToStep = useCallback((step: number) => setState((s) => ({ ...s, step, error: null })), []);

  const draft = useCallback(async (answers: Partial<Answers>) => {
    const id = runId.current;
    setState((s) => ({ ...s, stage: "drafting", error: null }));
    try {
      const scan = await (scanPromise.current ?? Promise.resolve(null));
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers, scan }),
      });
      const data = await res.json();
      if (runId.current !== id) return;
      if (!res.ok) throw new Error(data.error ?? "The agent couldn't draft your scope.");
      setState((s) => ({ ...s, stage: "done", proposal: data as Proposal, attachment: "scope" }));
    } catch (error) {
      if (runId.current !== id) return;
      setState((s) => ({
        ...s,
        stage: "questions",
        error: error instanceof Error ? error.message : "The agent couldn't draft your scope. Try again.",
      }));
    }
  }, []);

  const editAnswers = useCallback(() => setState((s) => ({ ...s, stage: "questions", step: 0, error: null })), []);

  const reset = useCallback(() => {
    runId.current++;
    scanPromise.current = null;
    setState((s) => ({ ...INITIAL, quote: s.quote, attachment: s.quote ? "quote" : null, answers: { ...EMPTY_ANSWERS, region: s.answers.region } }));
  }, []);

  const setAttachment = useCallback((attachment: Attachment) => setState((s) => ({ ...s, attachment })), []);

  // Attach a quick quote to the contact form and take the visitor there.
  const sendQuote = useCallback((quote: Quote) => {
    setState((s) => ({
      ...s,
      quote,
      attachment: "quote",
    }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fill in the contact form (from the Zion Agent) and take the visitor there.
  const prefillContact = useCallback((draft: Omit<ContactDraft, "id">) => {
    setState((s) => ({ ...s, contactDraft: { ...draft, id: (s.contactDraft?.id ?? 0) + 1 } }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Start a fresh assessment with some answers filled in (from Services).
  const preset = useCallback((answers: Partial<Answers>) => {
    runId.current++;
    scanPromise.current = null;
    setState((s) => ({
      ...INITIAL,
      quote: s.quote,
      attachment: s.quote ? "quote" : null,
      answers: { ...EMPTY_ANSWERS, region: s.answers.region, ...answers },
    }));
    document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => document.getElementById("site-url")?.focus({ preventScroll: true }), 600);
  }, []);

  const value = useMemo(
    () => ({ ...state, start, setAnswer, goToStep, draft, editAnswers, reset, setAttachment, sendQuote, preset, prefillContact }),
    [state, start, setAnswer, goToStep, draft, editAnswers, reset, setAttachment, sendQuote, preset, prefillContact],
  );

  return (
    <AssessmentContext.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}
