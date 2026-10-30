import type { Quote } from "./assessment/types";

// Prices here are what visitors see. They are derived from Zion's internal
// effort estimates, which never ship to the browser.

// ---- Digital products --------------------------------------------------------

export interface ProductModule {
  id: string;
  label: string;
  setup: number; // one-time, USD
  monthly: number; // added to the subscription, USD
  included?: boolean; // part of every plan, can't be removed
}

export interface Product {
  id: "church-os" | "pipeline" | "sermon" | "bible-study" | "hris" | "hubspot" | "erp";
  group: "church" | "org";
  name: string;
  hook: string; // the problem visitors recognise
  integrations: string[];
  platforms: string;
  modules: ProductModule[];
  tiers: { label: string; options: { id: string; label: string; monthly: number; setupFactor: number }[] };
  note?: string;
}

export const PRODUCT_GROUPS = [
  { id: "church", label: "For churches" },
  { id: "org", label: "For NGOs and businesses" },
] as const;

export const PRODUCTS: Product[] = [
  {
    id: "church-os",
    group: "church",
    name: "Church OS",
    hook: "Member records scattered across spreadsheets.",
    integrations: ["GCash", "Maya", "PayMongo", "Google Workspace", "Mailchimp"],
    platforms: "Web, iOS, Android",
    modules: [
      { id: "people", label: "People and households", setup: 640, monthly: 0, included: true },
      { id: "giving", label: "Online giving", setup: 320, monthly: 10 },
      { id: "events", label: "Events and check-in", setup: 320, monthly: 10 },
      { id: "volunteers", label: "Volunteer scheduling", setup: 240, monthly: 9 },
      { id: "app", label: "Member mobile app", setup: 960, monthly: 25 },
      { id: "migration", label: "Data migration", setup: 130, monthly: 0 },
    ],
    tiers: {
      label: "Congregation size",
      options: [
        { id: "s", label: "Under 200", monthly: 29, setupFactor: 1 },
        { id: "m", label: "200 – 1,000", monthly: 59, setupFactor: 1.1 },
        { id: "l", label: "1,000 – 5,000", monthly: 119, setupFactor: 1.25 },
        { id: "xl", label: "Over 5,000", monthly: 249, setupFactor: 1.45 },
      ],
    },
  },
  {
    id: "pipeline",
    group: "church",
    name: "AI Church Pipeline",
    hook: "Guests visit once and disappear.",
    integrations: ["Church OS", "SMS", "Gmail", "Outlook", "Google Forms"],
    platforms: "Web, iOS, Android",
    modules: [
      { id: "stages", label: "Pipeline and people", setup: 560, monthly: 0, included: true },
      { id: "capture", label: "Guest cards and forms", setup: 160, monthly: 5 },
      { id: "ai", label: "AI suggestions", setup: 480, monthly: 20 },
      { id: "messages", label: "Automated texts and emails", setup: 320, monthly: 15 },
      { id: "dashboards", label: "Stage dashboards", setup: 200, monthly: 5 },
      { id: "sync", label: "Church OS sync", setup: 240, monthly: 0 },
    ],
    tiers: {
      label: "Weekly attendance",
      options: [
        { id: "s", label: "Under 300", monthly: 39, setupFactor: 1 },
        { id: "m", label: "300 – 1,000", monthly: 79, setupFactor: 1.15 },
        { id: "l", label: "Over 1,000", monthly: 159, setupFactor: 1.3 },
      ],
    },
    note: "Your team approves every AI message. SMS billed at cost.",
  },
  {
    id: "sermon",
    group: "church",
    name: "Sermon Maker",
    hook: "Slides and handouts made late on Saturday.",
    integrations: ["ProPresenter", "PowerPoint", "Keynote", "Google Drive", "YouTube"],
    platforms: "Web",
    modules: [
      { id: "workspace", label: "Series and outlines", setup: 560, monthly: 0, included: true },
      { id: "library", label: "Notes library", setup: 240, monthly: 5 },
      { id: "slides", label: "Slide export", setup: 280, monthly: 5 },
      { id: "guides", label: "Handouts and guides", setup: 240, monthly: 5 },
      { id: "ai", label: "AI summaries and questions", setup: 360, monthly: 15 },
      { id: "archive", label: "Sermon archive", setup: 200, monthly: 5 },
    ],
    tiers: {
      label: "Preaching team",
      options: [
        { id: "s", label: "1 – 2", monthly: 19, setupFactor: 1 },
        { id: "m", label: "3 – 5", monthly: 39, setupFactor: 1.1 },
        { id: "l", label: "6 or more", monthly: 69, setupFactor: 1.2 },
      ],
    },
    note: "The pastor writes. AI drafts summaries and questions.",
  },
  {
    id: "bible-study",
    group: "church",
    name: "Bible Study Groups",
    hook: "Struggling groups go unnoticed.",
    integrations: ["Church OS", "Viber", "SMS", "Google Calendar"],
    platforms: "Web, iOS, Android",
    modules: [
      { id: "groups", label: "Groups and members", setup: 480, monthly: 0, included: true },
      { id: "attendance", label: "Attendance", setup: 160, monthly: 5 },
      { id: "plans", label: "Reading plans", setup: 240, monthly: 5 },
      { id: "checkins", label: "Leader check-ins", setup: 200, monthly: 5 },
      { id: "placement", label: "Group finder", setup: 240, monthly: 9 },
      { id: "messages", label: "Announcements", setup: 240, monthly: 10 },
    ],
    tiers: {
      label: "Groups",
      options: [
        { id: "s", label: "Up to 10", monthly: 19, setupFactor: 1 },
        { id: "m", label: "11 – 50", monthly: 39, setupFactor: 1.1 },
        { id: "l", label: "51 – 200", monthly: 79, setupFactor: 1.2 },
        { id: "xl", label: "Over 200", monthly: 149, setupFactor: 1.35 },
      ],
    },
  },
  {
    id: "hris",
    group: "church",
    name: "Church HRIS",
    hook: "Payroll and leave tracked by hand.",
    integrations: ["Bank payroll files", "Google Workspace", "Xero", "QuickBooks"],
    platforms: "Web, iOS, Android",
    modules: [
      { id: "profiles", label: "Staff profiles", setup: 480, monthly: 0, included: true },
      { id: "payroll", label: "Payroll", setup: 560, monthly: 20 },
      { id: "leave", label: "Leave and attendance", setup: 320, monthly: 9 },
      { id: "onboarding", label: "Onboarding", setup: 160, monthly: 5 },
      { id: "volunteers", label: "Volunteer records", setup: 200, monthly: 5 },
      { id: "portal", label: "Staff self-service", setup: 400, monthly: 10 },
    ],
    tiers: {
      label: "Staff",
      options: [
        { id: "s", label: "Up to 15", monthly: 29, setupFactor: 1 },
        { id: "m", label: "16 – 50", monthly: 69, setupFactor: 1.15 },
        { id: "l", label: "Over 50", monthly: 149, setupFactor: 1.3 },
      ],
    },
    note: "Demo contributions are samples. Production uses current SSS, PhilHealth, and Pag-IBIG tables.",
  },
  {
    id: "hubspot",
    group: "org",
    name: "HubSpot for NGOs",
    hook: "Donor history spread across inboxes.",
    integrations: ["HubSpot", "GCash", "PayMongo", "WordPress", "Google Workspace"],
    platforms: "Your HubSpot account",
    modules: [
      { id: "setup", label: "CRM setup and import", setup: 240, monthly: 0, included: true },
      { id: "pipelines", label: "Donor pipelines", setup: 160, monthly: 0 },
      { id: "email", label: "Email and automation", setup: 240, monthly: 0 },
      { id: "forms", label: "Website forms", setup: 130, monthly: 0 },
      { id: "reports", label: "Dashboards", setup: 130, monthly: 0 },
      { id: "admin", label: "Monthly admin and reporting", setup: 0, monthly: 99 },
    ],
    tiers: {
      label: "Contacts",
      options: [
        { id: "s", label: "Under 5,000", monthly: 0, setupFactor: 1 },
        { id: "m", label: "5,000 – 25,000", monthly: 0, setupFactor: 1.15 },
        { id: "l", label: "Over 25,000", monthly: 0, setupFactor: 1.35 },
      ],
    },
    note: "HubSpot fees are paid to HubSpot. Demo screens are Zion's illustration.",
  },
  {
    id: "erp",
    group: "org",
    name: "SME ERP",
    hook: "Customers find your stockouts first.",
    integrations: ["Xero", "QuickBooks", "GCash", "Maya", "Barcode scanners"],
    platforms: "Web, Android (warehouse)",
    modules: [
      { id: "inventory", label: "Inventory", setup: 960, monthly: 0, included: true },
      { id: "sales", label: "Sales orders", setup: 480, monthly: 15 },
      { id: "purchasing", label: "Purchasing", setup: 400, monthly: 15 },
      { id: "invoicing", label: "Invoicing and sync", setup: 480, monthly: 20 },
      { id: "hr", label: "HR and payroll", setup: 640, monthly: 25 },
      { id: "reports", label: "Reports", setup: 320, monthly: 10 },
      { id: "branches", label: "Extra branches", setup: 400, monthly: 30 },
    ],
    tiers: {
      label: "Users",
      options: [
        { id: "s", label: "Up to 10", monthly: 79, setupFactor: 1 },
        { id: "m", label: "11 – 50", monthly: 149, setupFactor: 1.15 },
        { id: "l", label: "Over 50", monthly: 299, setupFactor: 1.3 },
      ],
    },
  },
];

function makeRef() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return `ZQ-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

const round = (n: number, step: number) => Math.round(n / step) * step;

// Pure estimate for live totals; productQuote adds a reference when sent.
export function productEstimate(product: Product, selected: string[], tierId: string) {
  const tier = product.tiers.options.find((o) => o.id === tierId) ?? product.tiers.options[0];
  const lines = product.modules
    .filter((m) => m.included || selected.includes(m.id))
    .map((m) => ({ label: m.label, oneTime: round(m.setup * tier.setupFactor, 10), monthly: m.monthly }));
  const setupTotal = round(lines.reduce((sum, l) => sum + l.oneTime, 0), 50);
  const monthlyTotal = tier.monthly + lines.reduce((sum, l) => sum + l.monthly, 0);
  return { tier, lines, setupTotal, monthlyTotal, weeks: Math.max(3, Math.ceil(setupTotal / 240) + 1) };
}

export function productQuote(product: Product, selected: string[], tierId: string): Quote {
  const { tier, lines, setupTotal, monthlyTotal, weeks } = productEstimate(product, selected, tierId);
  return {
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    kind: "product",
    title: product.name,
    lines: tier.monthly ? [{ label: `${product.tiers.label}: ${tier.label}`, oneTime: 0, monthly: tier.monthly }, ...lines] : lines,
    options: [`${product.tiers.label}: ${tier.label}`],
    setupTotal,
    monthlyTotal,
    weeks,
    note: product.note,
  };
}

// ---- Managed IT (monthly plan) ---------------------------------------------
// Priced from organization size, the services chosen, an optional dev team,
// and the contract term.

export const IT_SIZES = [
  { id: "xs", label: "1 – 10", staff: 8 },
  { id: "s", label: "11 – 25", staff: 18 },
  { id: "m", label: "26 – 50", staff: 38 },
  { id: "l", label: "51 – 100", staff: 75 },
  { id: "xl", label: "100+", staff: 120 },
] as const;

export const IT_SERVICES = [
  { id: "helpdesk", label: "Helpdesk for your staff", base: 16, perStaff: 2 },
  { id: "devices", label: "Devices and accounts", base: 8, perStaff: 1.2 },
  { id: "workspace", label: "Microsoft 365 or Google Workspace", base: 8, perStaff: 0.4 },
  { id: "security", label: "Backups and security", base: 16, perStaff: 0.64 },
  { id: "network", label: "Network and Wi-Fi", base: 16, perStaff: 0.24 },
  { id: "onsite", label: "On-site visits (Metro Manila)", base: 32, perStaff: 0 },
  { id: "afterhours", label: "After-hours support", base: 48, perStaff: 0 },
] as const;

// Developers on call, for websites, apps, and integrations as needed.
export const DEV_TEAM = [
  { id: "none", label: "No developers", detail: "", monthly: 0 },
  { id: "oncall", label: "On call", detail: "Small fixes and changes", monthly: 80 },
  { id: "part", label: "Part-time developer", detail: "Half-time, shared", monthly: 640 },
  { id: "dedicated", label: "Dedicated developer", detail: "Full time, your priorities", monthly: 1280 },
  { id: "team", label: "Dev team", detail: "Two developers and a lead", monthly: 3200 },
] as const;

// Longer commitments cost less per month.
export const IT_TERMS = [
  { id: "6m", label: "6 months", months: 6, discount: 0 },
  { id: "12m", label: "12 months", months: 12, discount: 0.05 },
  { id: "annual", label: "Yearly, paid upfront", months: 12, discount: 0.1 },
] as const;

export type ItSizeId = (typeof IT_SIZES)[number]["id"];
export type ItServiceId = (typeof IT_SERVICES)[number]["id"];
export type DevTeamId = (typeof DEV_TEAM)[number]["id"];
export type ItTermId = (typeof IT_TERMS)[number]["id"];

export function managedItEstimate(sizeId: ItSizeId, services: ItServiceId[], devId: DevTeamId, termId: ItTermId) {
  const size = IT_SIZES.find((s) => s.id === sizeId)!;
  const term = IT_TERMS.find((t) => t.id === termId)!;
  const dev = DEV_TEAM.find((d) => d.id === devId)!;
  const list = [
    ...IT_SERVICES.filter((sv) => services.includes(sv.id)).map((sv) => ({ label: sv.label, monthly: sv.base + sv.perStaff * size.staff })),
    ...(services.length ? [{ label: "Monthly report and planning call", monthly: 8 }] : []),
    ...(dev.monthly ? [{ label: `${dev.label} (${dev.detail.toLowerCase()})`, monthly: dev.monthly }] : []),
  ];
  const lines = list.map((l) => ({ label: l.label, oneTime: 0, monthly: Math.round(l.monthly * (1 - term.discount)) }));
  const monthly = lines.reduce((sum, l) => sum + l.monthly, 0);
  const listMonthly = Math.round(list.reduce((sum, l) => sum + l.monthly, 0));
  return { size, term, dev, lines, monthly, contractTotal: monthly * term.months, savings: Math.max(0, (listMonthly - monthly) * term.months) };
}

export function managedItQuote(sizeId: ItSizeId, services: ItServiceId[], devId: DevTeamId, termId: ItTermId): Quote {
  const { size, term, lines, monthly, contractTotal } = managedItEstimate(sizeId, services, devId, termId);
  return {
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    kind: "managed-it",
    title: `Managed IT for ${size.label} people`,
    lines,
    options: lines.map((l) => l.label),
    setupTotal: 0,
    monthlyTotal: monthly,
    term: term.label,
    contractTotal,
    note: "A Zion team member confirms what's covered before the plan starts.",
  };
}
