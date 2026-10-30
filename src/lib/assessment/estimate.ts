// Server-side estimating: effort guide, fallback estimator, and turning effort
// into a priced proposal at Zion's internal rate for the client's region.

import { randomBytes } from "node:crypto";
import type { BuildTypeId, FeatureId, TimelineId, WorkRegionId } from "./questions";
import { BUILD_TYPES, FEATURES, labelOf } from "./questions";
import { rateFor } from "./pricing";
import { surveyNotes } from "./survey";
import type { Answers, PhaseKey, Proposal, ScanResult, ServiceId } from "./types";
import { PHASES, PHASE_KEYS } from "./types";

// Build-phase effort for each kind of project and feature, in hours.
export const BUILD_HOURS: Record<BuildTypeId, number> = {
  website: 40,
  redesign: 45,
  webapp: 140,
  mobile: 170,
  integration: 90,
  itsupport: 35,
  marketing: 50,
};

export const FEATURE_HOURS: Record<FeatureId, number> = {
  giving: 24,
  events: 24,
  accounts: 32,
  content: 16,
  multilang: 20,
  payments: 36,
  integrations: 32,
  reporting: 36,
};

const AUDIENCE_FACTOR: Record<Answers["audience"], number> = { small: 1, medium: 1.05, large: 1.15, xlarge: 1.3 };
const CONTENT_FACTOR: Record<Answers["content"], number> = { ready: 1, partial: 1.1, scratch: 1.2 };

// Hours per week the team can put into one engagement, by requested timeline.
const WEEKLY_CAPACITY: Record<TimelineId, number> = { asap: 40, quarter: 30, half: 22, flexible: 22 };

const BUILD_SERVICES: Record<BuildTypeId, ServiceId[]> = {
  website: ["design", "software"],
  redesign: ["design", "software"],
  webapp: ["software", "design", "infrastructure"],
  mobile: ["software", "design"],
  integration: ["software", "consulting", "infrastructure"],
  itsupport: ["managed", "security", "infrastructure"],
  marketing: ["marketing", "design"],
};

// Effort guide handed to the agent so its estimates stay in the same range as
// the fallback estimator.
export function effortGuide(): string {
  const builds = BUILD_TYPES.map((b) => `- ${b.label}: ~${BUILD_HOURS[b.id]} h of build work`).join("\n");
  const features = FEATURES.map((f) => `- ${f.label}: +${FEATURE_HOURS[f.id]} h`).join("\n");
  return `Build-phase effort (core implementation only):
${builds}

Feature add-ons:
${features}

Other phases, as a share of build effort: Discover & Define ~8% (min 8 h), Architect & Blueprint ~18% (min 12 h), Test & Refine ~15% (min 8 h), Launch & Sustain ~8% (min 6 h).
Adjust up to ~15% for larger audiences (10k+ monthly) and ~10–20% when content or branding must be created. Adjust for anything specific you see on their site (for example, a large existing site to migrate).
Team capacity per week: ~40 h if they need it ASAP, ~30 h for 1–3 months, ~22 h when the timeline is 3–6 months or flexible.`;
}

// ---- Draft (with hours) -> Proposal (with costs) ----------------------------

export interface DraftDeliverable {
  name: string;
  description: string;
  hours: number;
}

export interface DraftPhase {
  key: PhaseKey;
  objective: string;
  weeks: number;
  deliverables: DraftDeliverable[];
}

export interface Draft {
  projectTitle: string;
  summary: string;
  siteFindings: string[];
  phases: DraftPhase[];
  assumptions: string[];
  recommendedServices: ServiceId[];
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// Internally a proposal carries hours; the browser gets costs only.
type PublicPhase = Proposal["phases"][number];
type InternalPhase = Omit<PublicPhase, "deliverables"> & {
  hours: number;
  deliverables: (PublicPhase["deliverables"][number] & { hours: number })[];
};
export type InternalProposal = Omit<Proposal, "phases"> & { phases: InternalPhase[]; totalHours: number };

// Assumptions the server always adds, whatever the agent wrote: when Zion
// works, and the limits of an automated estimate.
const REGION_ASSUMPTION: Record<WorkRegionId, string> = {
  manila: "Zion works Manila business hours (GMT+8). Meetings are scheduled in that window.",
  australia: "Zion covers Australian and New Zealand business hours, with a named lead for your meetings.",
  americas: "Zion covers your North or South American business hours, with a named lead for your meetings.",
  uk: "Zion covers UK and European business hours, with a named lead for your meetings.",
};
const ESTIMATE_GUARDRAIL = "This is an estimate, valid for 30 days and confirmed after a discovery call. Changes after sign-off are re-estimated.";

// Prices are shown in round numbers so they never reveal the effort behind them.
const roundPrice = (usd: number) => Math.max(50, Math.round(usd / 50) * 50);

// What the browser receives: phase and total prices only. Deliverable prices
// and hours stay on the server.
export function publicProposal(p: InternalProposal): Proposal {
  const copy: Partial<InternalProposal> = { ...p };
  delete copy.totalHours;
  return {
    ...(copy as Omit<InternalProposal, "totalHours">),
    phases: p.phases.map((ph) => ({
      key: ph.key,
      name: ph.name,
      objective: ph.objective,
      startWeek: ph.startWeek,
      weeks: ph.weeks,
      cost: ph.cost,
      deliverables: ph.deliverables.map((d) => ({ name: d.name, description: d.description, cost: 0 })),
    })),
  };
}

export function finalizeProposal(
  draft: Draft,
  answers: Answers,
  scan: ScanResult | null,
  source: Proposal["source"],
): InternalProposal {
  const capacity = WEEKLY_CAPACITY[answers.timeline];
  const rate = rateFor(answers.region);

  // Keep one entry per ZPL phase, in ZPL order.
  const byKey = new Map<PhaseKey, DraftPhase>();
  for (const phase of draft.phases) {
    if (!byKey.has(phase.key) && phase.deliverables.length > 0) byKey.set(phase.key, phase);
  }

  let week = 1;
  let totalCost = 0;
  const phases: InternalProposal["phases"] = [];

  for (const key of PHASE_KEYS) {
    const phase = byKey.get(key);
    if (!phase) continue;

    const deliverables = phase.deliverables.slice(0, 6).map((d) => {
      const hours = Math.round(clamp(Number.isFinite(d.hours) ? d.hours : 0, 1, 400));
      return {
        name: d.name.slice(0, 120),
        description: d.description.slice(0, 400),
        cost: hours * rate,
        hours,
      };
    });
    const hours = deliverables.reduce((sum, d) => sum + d.hours, 0);
    const minWeeks = Math.ceil(hours / capacity);
    const weeks = clamp(Math.round(phase.weeks) || minWeeks, Math.max(1, minWeeks), 26);
    const cost = roundPrice(hours * rate);

    phases.push({
      key,
      name: PHASES.find((p) => p.key === key)!.name,
      objective: phase.objective.slice(0, 400),
      startWeek: week,
      weeks,
      cost,
      hours,
      deliverables,
    });
    week += weeks;
    totalCost += cost;
  }

  return {
    ref: `ZA-${randomBytes(3).toString("hex").toUpperCase()}`,
    createdAt: new Date().toISOString(),
    source,
    website: scan?.finalUrl ?? scan?.url,
    projectTitle: draft.projectTitle.slice(0, 140),
    summary: draft.summary.slice(0, 1200),
    siteFindings: draft.siteFindings.slice(0, 6).map((f) => f.slice(0, 300)),
    phases,
    totalWeeks: Math.max(1, week - 1),
    totalHours: phases.reduce((sum, p) => sum + p.hours, 0),
    totalCost,
    assumptions: [
      ...new Set([...draft.assumptions.slice(0, 4).map((a) => a.slice(0, 300)), REGION_ASSUMPTION[answers.region], ESTIMATE_GUARDRAIL]),
    ],
    recommendedServices: [...new Set(draft.recommendedServices)].slice(0, 7),
    answers,
  };
}

// ---- Fallback estimator -------------------------------------------------------
// Used when the agent is not configured or fails, so visitors always get a scope.

export function estimatorDraft(answers: Answers, scan: ScanResult | null): Draft {
  const factor = AUDIENCE_FACTOR[answers.audience] * CONTENT_FACTOR[answers.content];
  const hasSite = Boolean(scan?.ok);
  const builds = answers.buildTypes;
  const productBuild = builds.some((b) => b === "webapp" || b === "mobile" || b === "integration");
  const siteBuild = builds.some((b) => b === "website" || b === "redesign");

  const buildDeliverables: DraftDeliverable[] = [
    ...builds.map((b) => ({
      name: labelOf(BUILD_TYPES, b).replace(/^An? /, "").replace(/^\w/, (c) => c.toUpperCase()),
      description: BUILD_DESCRIPTIONS[b],
      hours: BUILD_HOURS[b] * factor,
    })),
    ...answers.features.map((f) => ({
      name: labelOf(FEATURES, f),
      description: FEATURE_DESCRIPTIONS[f],
      hours: FEATURE_HOURS[f] * factor,
    })),
  ];
  if (answers.content !== "ready") {
    buildDeliverables.push({
      name: answers.content === "scratch" ? "Brand and content kit" : "Content support",
      description:
        answers.content === "scratch"
          ? "Logo refinement, colour and type system, and first-draft copy for key pages."
          : "Copy editing and gap-filling for the pages you have, plus imagery selection.",
      hours: answers.content === "scratch" ? 30 : 15,
    });
  }

  const buildHours = buildDeliverables.reduce((sum, d) => sum + d.hours, 0);
  const share = (pct: number, min: number) => Math.max(min, buildHours * pct);

  const discover: DraftDeliverable[] = [
    {
      name: "Discovery workshop and requirements brief",
      description: "A working session with your team to agree goals, audiences, and must-haves, written up as a signed-off brief.",
      hours: share(hasSite ? 0.05 : 0.08, 6),
    },
  ];
  if (hasSite) {
    discover.push({
      name: "Current site audit",
      description: "Review of your existing site's content, performance, accessibility, and what should carry over.",
      hours: share(0.03, 4),
    });
  }

  const architectTotal = share(0.18, 12);
  const architect: DraftDeliverable[] = [];
  if (siteBuild) {
    architect.push({
      name: "Sitemap and content structure",
      description: "Page inventory, navigation, and content model so every page has a job.",
      hours: architectTotal * (productBuild ? 0.2 : 0.35),
    });
  }
  if (productBuild) {
    architect.push({
      name: "System architecture and data model",
      description: "Technology choices, data model, and integration plan, reviewed with you before build starts.",
      hours: architectTotal * (siteBuild ? 0.3 : 0.4),
    });
  }
  architect.push({
    name: "Wireframes and visual design",
    description: "Key screens designed and prototyped, with two rounds of revisions.",
    hours: architectTotal * (siteBuild && productBuild ? 0.5 : siteBuild ? 0.65 : 0.6),
  });

  const handlesSensitiveData = answers.features.some((f) => f === "giving" || f === "payments" || f === "accounts");
  const testTotal = share(0.15, 8);
  const test: DraftDeliverable[] = [
    {
      name: "QA, accessibility, and performance testing",
      description: "Cross-device testing, accessibility checks, and speed tuning against an agreed checklist.",
      hours: testTotal * (handlesSensitiveData ? 0.7 : 1),
    },
  ];
  if (handlesSensitiveData) {
    test.push({
      name: "Security review",
      description: "Review of logins, payments, and data handling before anything goes live.",
      hours: testTotal * 0.3,
    });
  }

  const launchTotal = share(0.08, 6);
  const launch: DraftDeliverable[] = [
    {
      name: "Deployment and launch",
      description: "Production setup, domain and analytics configuration, and a supervised go-live.",
      hours: launchTotal * 0.5,
    },
    {
      name: "Team training and handover",
      description: "Walkthrough and short guides so your team can run it day to day.",
      hours: launchTotal * 0.25,
    },
    {
      name: "30 days of post-launch support",
      description: "Fixes and small adjustments in the first month after launch.",
      hours: launchTotal * 0.25,
    },
  ];

  const services = new Set<ServiceId>(builds.flatMap((b) => BUILD_SERVICES[b]));
  if (handlesSensitiveData) services.add("security");

  const capacity = WEEKLY_CAPACITY[answers.timeline];
  const weeksFor = (items: DraftDeliverable[]) =>
    Math.max(1, Math.ceil(items.reduce((sum, d) => sum + d.hours, 0) / capacity));

  const titleName = scan?.title?.split(/[|\-–—:·]/)[0]?.trim();
  const hostName = scan?.finalUrl ? new URL(scan.finalUrl).hostname.replace(/^www\./, "").split(".")[0] : undefined;
  const name = titleName && titleName.length <= 32 ? titleName : hostName?.replace(/^\w/, (c) => c.toUpperCase());
  const projectTitle = `${name ? `${name}: ` : ""}${builds.map((b) => SHORT_BUILD_NAMES[b]).join(" + ")}`;

  return {
    projectTitle,
    summary: `A ${builds.map((b) => SHORT_BUILD_NAMES[b].toLowerCase()).join(" and ")} delivered through the five phases of the Zion Production Line${
      answers.features.length ? `, including ${answers.features.map((f) => labelOf(FEATURES, f).toLowerCase()).join(", ")}` : ""
    }.${answers.goal ? ` It is shaped around your goal: "${answers.goal.slice(0, 240)}".` : ""}`,
    siteFindings: scan?.ok ? surveyNotes(scan) : [],
    phases: [
      { key: "discover", objective: "Agree what success looks like and lock the scope.", weeks: weeksFor(discover), deliverables: discover },
      { key: "architect", objective: "Design the structure and screens before any build work starts.", weeks: weeksFor(architect), deliverables: architect },
      { key: "build", objective: "Build in weekly sprints you can review as they land.", weeks: weeksFor(buildDeliverables), deliverables: buildDeliverables },
      { key: "test", objective: "Make sure everything works for every visitor before launch.", weeks: weeksFor(test), deliverables: test },
      { key: "launch", objective: "Go live smoothly and leave your team confident to run it.", weeks: weeksFor(launch), deliverables: launch },
    ],
    assumptions: [
      "Your team can join a weekly review and give feedback within two business days.",
      "Third-party fees (hosting, domains, payment processing, app stores) are not included.",
      answers.content === "ready"
        ? "Final copy and images are supplied by your team before the build phase."
        : "Content support covers key pages; large content migrations are scoped separately.",
    ],
    recommendedServices: [...services],
  };
}

const SHORT_BUILD_NAMES: Record<BuildTypeId, string> = {
  website: "New website",
  redesign: "Website redesign",
  webapp: "Web portal",
  mobile: "Mobile app",
  integration: "Systems integration",
  itsupport: "IT support",
  marketing: "Marketing launch",
};

const BUILD_DESCRIPTIONS: Record<BuildTypeId, string> = {
  website: "Responsive site built on an editable CMS, with your key pages and contact paths.",
  redesign: "Rebuilt site with a refreshed design and structure, migrating the content worth keeping.",
  webapp: "Secure web portal with role-based access and an admin area for your team.",
  mobile: "iOS and Android app from a shared codebase, including app store submission.",
  integration: "Connections between your existing systems so data flows without re-typing.",
  itsupport: "Infrastructure review, hardening, and an ongoing support setup for your team.",
  marketing: "Search and social setup, an email newsletter, and a first campaign with tracking in place.",
};

const FEATURE_DESCRIPTIONS: Record<FeatureId, string> = {
  giving: "One-time and recurring giving with receipts, connected to your payment provider.",
  events: "Event pages with registration, capacity limits, and confirmation emails.",
  accounts: "Sign-up, login, and member profiles with password reset.",
  content: "Editable blog, sermon, or news sections your team can update without a developer.",
  multilang: "Language switcher and translated page structure for each supported language.",
  payments: "Checkout and order handling connected to your payment provider.",
  integrations: "Connections to the tools you already use, such as email, CRM, or spreadsheets.",
  reporting: "Dashboards that turn your data into the numbers your board asks for.",
};
