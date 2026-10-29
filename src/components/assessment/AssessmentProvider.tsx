"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import type { Answers, Proposal, ScanResult } from "@/lib/assessment/types";

export type Stage = "intro" | "questions" | "drafting" | "done";
export type ScanStatus = "none" | "scanning" | "done";

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
  attachToContact: boolean;
}

interface AssessmentContextValue extends AssessmentState {
  start: (website: string | null) => void;
  setAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  goToStep: (step: number) => void;
  draft: (answers: Partial<Answers>) => Promise<void>;
  editAnswers: () => void;
  reset: () => void;
  setAttachToContact: (attach: boolean) => void;
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
  attachToContact: false,
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
      setState((s) => ({ ...s, stage: "done", proposal: data as Proposal, attachToContact: true }));
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
    setState(INITIAL);
  }, []);

  const setAttachToContact = useCallback((attach: boolean) => setState((s) => ({ ...s, attachToContact: attach })), []);

  const value = useMemo(
    () => ({ ...state, start, setAnswer, goToStep, draft, editAnswers, reset, setAttachToContact }),
    [state, start, setAnswer, goToStep, draft, editAnswers, reset, setAttachToContact],
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
