import type { BuildTypeId } from "./questions";
import type { ServiceId } from "./types";

export const SERVICE_GROUPS = [
  { id: "build", label: "Build", blurb: "Design and develop what your mission needs." },
  { id: "run", label: "Run", blurb: "Keep it secure, reliable, and supported." },
  { id: "grow", label: "Grow", blurb: "Reach more people and plan what's next." },
] as const;

export type ServiceGroupId = (typeof SERVICE_GROUPS)[number]["id"];

export interface Service {
  id: ServiceId;
  group: ServiceGroupId;
  title: string;
  tagline?: string;
  desc: string;
  includes: string[];
  bestFor: string;
  // What the assessment should preselect when a visitor scopes this offering.
  buildType?: BuildTypeId;
}

// Zion's offerings. Shown in the Offerings section and referenced by the
// agent when it recommends which teams a scope needs.
export const SERVICES: Service[] = [
  {
    id: "software",
    group: "build",
    title: "Custom Software",
    desc: "Web apps, mobile apps, and internal systems.",
    includes: ["Web apps and member portals", "iOS and Android apps", "Online giving, booking, and payments", "Integrations with the tools you already use"],
    bestFor: "Ministries and businesses that have outgrown spreadsheets and off-the-shelf plugins.",
    buildType: "webapp",
  },
  {
    id: "design",
    group: "build",
    title: "UI/UX & Product Design",
    desc: "Websites and apps people find easy to use.",
    includes: ["Websites and landing pages", "Brand-aligned design systems", "Wireframes and clickable prototypes", "Accessibility reviews"],
    bestFor: "Churches and organizations whose website no longer reflects who they are.",
    buildType: "redesign",
  },
  {
    id: "infrastructure",
    group: "run",
    title: "Infrastructure & DevOps",
    desc: "Hosting, deployments, and backups that stay up.",
    includes: ["Cloud hosting and migrations", "Automated deployments and backups", "Uptime and performance monitoring", "Hosting cost reviews"],
    bestFor: "Teams running important systems on fragile or expensive hosting.",
    buildType: "itsupport",
  },
  {
    id: "managed",
    group: "run",
    title: "Managed IT Services",
    tagline: "No need to build an IT team. We'll be your IT team.",
    desc: "A monthly plan for your staff's day-to-day IT.",
    includes: ["Helpdesk for staff", "Devices and accounts", "Backups and security", "Monthly report"],
    bestFor: "Churches, ministries, and small businesses that need IT handled but can't justify hiring an IT person.",
    buildType: "itsupport",
  },
  {
    id: "security",
    group: "run",
    title: "Cybersecurity",
    desc: "Audits, testing, and protection for your data.",
    includes: ["Security audits and penetration tests", "Data protection and privacy compliance", "Access control and two-factor rollout", "Incident response planning"],
    bestFor: "Anyone handling donor, member, or customer data.",
    buildType: "itsupport",
  },
  {
    id: "marketing",
    group: "grow",
    title: "Digital Marketing",
    desc: "Search, social, and email that reach more people.",
    includes: ["SEO and local search", "Social media content and calendars", "Email newsletters and automation", "Paid campaigns with clear reporting"],
    bestFor: "Faith-driven businesses and ministries ready to grow their reach.",
    buildType: "marketing",
  },
  {
    id: "consulting",
    group: "grow",
    title: "Technology Consulting",
    desc: "Honest advice before big technology decisions.",
    includes: ["Technology roadmaps", "System audits and vendor selection", "Digital transformation planning", "Fractional CTO guidance"],
    bestFor: "Leaders facing a big technology decision who want an honest second opinion.",
  },
];

export const serviceTitle = (id: ServiceId) => SERVICES.find((s) => s.id === id)?.title ?? id;
