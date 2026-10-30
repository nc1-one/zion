"use client";

import React from "react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { PRICE_REGIONS } from "@/lib/quotes";

// One time-zone setting for every price on the page; the assessment uses it too.
export function useRegion() {
  const { answers, setAnswer } = useAssessment();
  return [answers.region ?? "manila", (id: (typeof PRICE_REGIONS)[number]["id"]) => setAnswer("region", id)] as const;
}

export function RegionSelect({ id }: { id: string }) {
  const [region, setRegion] = useRegion();
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-3 text-[0.8rem] text-mist">
      Your time zone
      <select
        id={id}
        value={region}
        onChange={(e) => setRegion(e.target.value as (typeof PRICE_REGIONS)[number]["id"])}
        className="h-8 pl-2.5 pr-7 rounded-lg bg-night ring-1 ring-rule text-[0.82rem] text-ink cursor-pointer outline-none focus-visible:ring-gold"
      >
        {PRICE_REGIONS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}
