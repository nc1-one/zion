import type { PhasePlan } from "./types";

// The scope the hero shows before a visitor starts: a real estimator run for a
// mid-sized church (redesign with giving, events, and editable sermons), so
// its timeline and total match what the assessment gives for those answers.
export const SAMPLE_SCOPE = {
  title: "Church website with giving and events",
  summary: "A redesign for a mid-sized church. Members give and register online, and first-time guests find a service time fast.",
  brief: ["Local church", "1,000 – 10,000 visitors a month", "Starts in 1–3 months"],
  phases: [
    { key: "discover", name: "Discover & Define", startWeek: 1, weeks: 1 },
    { key: "architect", name: "Architect & Blueprint", startWeek: 2, weeks: 1 },
    { key: "build", name: "Build & Iterate", startWeek: 3, weeks: 5 },
    { key: "test", name: "Test & Refine", startWeek: 8, weeks: 1 },
    { key: "launch", name: "Launch & Sustain", startWeek: 9, weeks: 1 },
  ].map((p) => ({ ...p, objective: "", cost: 0, deliverables: [] })) as PhasePlan[],
  deliverables: ["Online giving", "Event registration", "Sermon and news pages", "Accessibility and speed testing", "Team training"],
  totalWeeks: 9,
  totalCost: 1680,
};
