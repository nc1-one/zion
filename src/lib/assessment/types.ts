import { z } from "zod";
import {
  AUDIENCE_SIZES,
  BUILD_TYPES,
  CONTENT_READINESS,
  FEATURES,
  ORG_TYPES,
  TIMELINES,
  WORK_REGIONS,
  idsOf,
} from "./questions";

// ---- Zion offerings and ZPL phases ---------------------------------------

export const SERVICE_IDS = ["software", "design", "infrastructure", "managed", "security", "marketing", "consulting"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export const PHASES = [
  { key: "discover", numeral: "I", name: "Discover & Define" },
  { key: "architect", numeral: "II", name: "Architect & Blueprint" },
  { key: "build", numeral: "III", name: "Build & Iterate" },
  { key: "test", numeral: "IV", name: "Test & Refine" },
  { key: "launch", numeral: "V", name: "Launch & Sustain" },
] as const;
export const PHASE_KEYS = PHASES.map((p) => p.key) as unknown as ["discover", "architect", "build", "test", "launch"];
export type PhaseKey = (typeof PHASE_KEYS)[number];

// ---- Assessment input -----------------------------------------------------

export const AnswersSchema = z.object({
  buildTypes: z.array(z.enum(idsOf(BUILD_TYPES))).min(1).max(7),
  orgType: z.enum(idsOf(ORG_TYPES)),
  features: z.array(z.enum(idsOf(FEATURES))).max(8),
  audience: z.enum(idsOf(AUDIENCE_SIZES)),
  content: z.enum(idsOf(CONTENT_READINESS)),
  timeline: z.enum(idsOf(TIMELINES)),
  region: z.enum(idsOf(WORK_REGIONS)).default("manila"),
  goal: z.string().trim().max(800),
});
export type Answers = z.infer<typeof AnswersSchema>;

export const ScanResultSchema = z.object({
  ok: z.boolean(),
  url: z.string().max(500),
  finalUrl: z.string().max(500).optional(),
  error: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(400).optional(),
  platform: z.string().max(60).optional(),
  https: z.boolean().optional(),
  mobileViewport: z.boolean().optional(),
  responseMs: z.number().optional(),
  pageWeightKb: z.number().optional(),
  internalLinks: z.number().optional(),
  images: z.number().optional(),
  imagesMissingAlt: z.number().optional(),
  hasForms: z.boolean().optional(),
  hasGiving: z.boolean().optional(),
  hasOpenGraph: z.boolean().optional(),
  headings: z.array(z.string().max(160)).max(12).optional(),
  textExcerpt: z.string().max(3000).optional(),
});
export type ScanResult = z.infer<typeof ScanResultSchema>;

export const AssessRequestSchema = z.object({
  answers: AnswersSchema,
  scan: ScanResultSchema.nullable(),
});
export type AssessRequest = z.infer<typeof AssessRequestSchema>;

// ---- Proposal returned to the browser --------------------------------------
// Costs only. Effort and the hourly rate stay on the server.

export const DeliverableSchema = z.object({
  name: z.string().max(120),
  description: z.string().max(400),
  cost: z.number().nonnegative(),
});

export const PhasePlanSchema = z.object({
  key: z.enum(PHASE_KEYS),
  name: z.string().max(60),
  objective: z.string().max(400),
  startWeek: z.number().int().min(1),
  weeks: z.number().int().min(1),
  cost: z.number().nonnegative(),
  deliverables: z.array(DeliverableSchema).max(8),
});

export const ProposalSchema = z.object({
  ref: z.string().max(20),
  createdAt: z.string().max(40),
  source: z.enum(["agent", "estimator"]),
  website: z.string().max(500).optional(),
  projectTitle: z.string().max(140),
  summary: z.string().max(1200),
  siteFindings: z.array(z.string().max(300)).max(6),
  phases: z.array(PhasePlanSchema).min(1).max(5),
  totalWeeks: z.number().int().min(1),
  totalCost: z.number().nonnegative(),
  assumptions: z.array(z.string().max(300)).max(6),
  recommendedServices: z.array(z.enum(SERVICE_IDS)).max(7),
  answers: AnswersSchema,
});
export type Proposal = z.infer<typeof ProposalSchema>;

// ---- Quick quotes (digital products, managed IT) ----------------------------
// Prices only: one-time setup and/or a monthly amount per line.

export const QuoteSchema = z.object({
  ref: z.string().max(20),
  createdAt: z.string().max(40),
  kind: z.enum(["product", "managed-it"]),
  title: z.string().max(140),
  lines: z
    .array(z.object({ label: z.string().max(120), oneTime: z.number().nonnegative(), monthly: z.number().nonnegative() }))
    .min(1)
    .max(16),
  options: z.array(z.string().max(120)).max(8),
  setupTotal: z.number().nonnegative(),
  monthlyTotal: z.number().nonnegative(),
  weeks: z.number().int().min(1).optional(),
  term: z.string().max(40).optional(),
  contractTotal: z.number().nonnegative().optional(),
  region: z.enum(idsOf(WORK_REGIONS)).optional(),
  note: z.string().max(300).optional(),
});
export type Quote = z.infer<typeof QuoteSchema>;
export type PhasePlan = z.infer<typeof PhasePlanSchema>;
