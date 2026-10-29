import { HOURLY_RATE } from "./assessment/pricing";
import type { Quote } from "./assessment/types";

// ---- Digital products --------------------------------------------------------

export interface ProductModule {
  id: string;
  label: string;
  hours: number;
  included?: boolean; // part of every implementation, can't be removed
}

export interface Product {
  id: "church-os" | "pipeline" | "sermon" | "bible-study" | "hris" | "hubspot" | "erp";
  group: "church" | "org";
  name: string;
  // The problem visitors recognise, used to pick a product.
  hook: string;
  pains: { pain: string; fix: string }[];
  modules: ProductModule[];
  scale: { label: string; options: { id: string; label: string; factor: number }[] };
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
    name: "Church Operating System",
    hook: "Member records live in spreadsheets and phones.",
    pains: [
      { pain: "Five spreadsheets, no single list", fix: "One record per person and household" },
      { pain: "Giving reconciled by hand on Mondays", fix: "Online giving that reconciles itself" },
      { pain: "Nobody notices who stopped coming", fix: "Drifting members flagged weekly" },
    ],
    modules: [
      { id: "people", label: "People and households", hours: 80, included: true },
      { id: "giving", label: "Online and recurring giving", hours: 40 },
      { id: "events", label: "Events and check-in", hours: 40 },
      { id: "volunteers", label: "Volunteer scheduling", hours: 30 },
      { id: "app", label: "Member mobile app", hours: 120 },
      { id: "migration", label: "Move data from spreadsheets", hours: 16 },
    ],
    scale: {
      label: "Congregation size",
      options: [
        { id: "s", label: "Under 200", factor: 1 },
        { id: "m", label: "200 – 1,000", factor: 1.1 },
        { id: "l", label: "1,000 – 5,000", factor: 1.25 },
        { id: "xl", label: "Over 5,000", factor: 1.45 },
      ],
    },
  },
  {
    id: "pipeline",
    group: "church",
    name: "AI Church Pipeline",
    hook: "First-time guests visit once and disappear.",
    pains: [
      { pain: "A welcome card, then silence", fix: "Every guest on a clear next step" },
      { pain: "Follow-up depends on who remembers", fix: "AI drafts the message and assigns it" },
      { pain: "No idea where people stall", fix: "See each stage, guest to leader" },
    ],
    modules: [
      { id: "stages", label: "Pipeline stages and people", hours: 70, included: true },
      { id: "capture", label: "Guest forms and QR cards", hours: 20 },
      { id: "ai", label: "AI next-step suggestions", hours: 60 },
      { id: "messages", label: "Automated texts and emails", hours: 40 },
      { id: "dashboards", label: "Stage dashboards", hours: 25 },
      { id: "sync", label: "Connect to Church OS", hours: 30 },
    ],
    scale: {
      label: "Weekly attendance",
      options: [
        { id: "s", label: "Under 300", factor: 1 },
        { id: "m", label: "300 – 1,000", factor: 1.15 },
        { id: "l", label: "Over 1,000", factor: 1.3 },
      ],
    },
    note: "AI suggestions in the prototype are sample text. In production, your team reviews every message before it sends.",
  },
  {
    id: "sermon",
    group: "church",
    name: "Sermon Maker",
    hook: "Slides and handouts get made late on Saturday.",
    pains: [
      { pain: "Notes scattered across apps", fix: "One workspace per series" },
      { pain: "Slides, handout, and guide made separately", fix: "One outline, three outputs" },
      { pain: "Past sermons hard to find", fix: "Searchable sermon library" },
    ],
    modules: [
      { id: "workspace", label: "Series and outline workspace", hours: 70, included: true },
      { id: "library", label: "Scripture and notes library", hours: 30 },
      { id: "slides", label: "Slide export", hours: 35 },
      { id: "guides", label: "Handouts and group guides", hours: 30 },
      { id: "ai", label: "AI summaries and questions", hours: 45 },
      { id: "archive", label: "Sermon archive and search", hours: 25 },
    ],
    scale: {
      label: "Preaching team",
      options: [
        { id: "s", label: "1 – 2 people", factor: 1 },
        { id: "m", label: "3 – 5 people", factor: 1.1 },
        { id: "l", label: "6 or more", factor: 1.2 },
      ],
    },
    note: "The pastor writes the sermon. AI only drafts summaries and discussion questions for review.",
  },
  {
    id: "bible-study",
    group: "church",
    name: "Bible Study Groups",
    hook: "You hear a group is struggling after the leader quits.",
    pains: [
      { pain: "Group health is invisible", fix: "Health score for every group" },
      { pain: "Attendance lost in group chats", fix: "One-minute leader check-ins" },
      { pain: "New people wait weeks for a group", fix: "Placement by area and schedule" },
    ],
    modules: [
      { id: "groups", label: "Groups and members", hours: 60, included: true },
      { id: "attendance", label: "Attendance tracking", hours: 20 },
      { id: "plans", label: "Reading plans and guides", hours: 30 },
      { id: "checkins", label: "Leader check-ins", hours: 25 },
      { id: "placement", label: "Group finder and placement", hours: 30 },
      { id: "messages", label: "Group messaging", hours: 30 },
    ],
    scale: {
      label: "Number of groups",
      options: [
        { id: "s", label: "Up to 10", factor: 1 },
        { id: "m", label: "11 – 50", factor: 1.1 },
        { id: "l", label: "51 – 200", factor: 1.2 },
        { id: "xl", label: "Over 200", factor: 1.35 },
      ],
    },
  },
  {
    id: "hris",
    group: "church",
    name: "Church HRIS",
    hook: "Payroll and leave are tracked by hand.",
    pains: [
      { pain: "Staff files in folders and email", fix: "One profile per staff member" },
      { pain: "SSS, PhilHealth, Pag-IBIG by spreadsheet", fix: "Payroll with contributions computed" },
      { pain: "Leave requests by text message", fix: "Requests, approvals, and balances" },
    ],
    modules: [
      { id: "profiles", label: "Staff profiles and documents", hours: 60, included: true },
      { id: "payroll", label: "Payroll and contributions", hours: 70 },
      { id: "leave", label: "Leave and attendance", hours: 40 },
      { id: "onboarding", label: "Onboarding checklists", hours: 20 },
      { id: "volunteers", label: "Volunteer records", hours: 25 },
      { id: "portal", label: "Staff self-service portal", hours: 50 },
    ],
    scale: {
      label: "Staff",
      options: [
        { id: "s", label: "Up to 15", factor: 1 },
        { id: "m", label: "16 – 50", factor: 1.15 },
        { id: "l", label: "Over 50", factor: 1.3 },
      ],
    },
    note: "Contribution amounts in the prototype are samples. Production uses current SSS, PhilHealth, and Pag-IBIG tables.",
  },
  {
    id: "hubspot",
    group: "org",
    name: "HubSpot for NGOs",
    hook: "Donor history is spread across inboxes.",
    pains: [
      { pain: "Donors in a spreadsheet and three inboxes", fix: "One clean contact record" },
      { pain: "The same appeal sent to everyone", fix: "Segmented, automated campaigns" },
      { pain: "Board reports take a week", fix: "Live dashboards" },
    ],
    modules: [
      { id: "setup", label: "CRM setup and data import", hours: 30, included: true },
      { id: "pipelines", label: "Donor or sales pipelines", hours: 20 },
      { id: "email", label: "Email marketing and automation", hours: 30 },
      { id: "forms", label: "Website forms and tracking", hours: 16 },
      { id: "reports", label: "Reporting dashboards", hours: 16 },
      { id: "training", label: "Team training", hours: 8 },
    ],
    scale: {
      label: "Contacts",
      options: [
        { id: "s", label: "Under 5,000", factor: 1 },
        { id: "m", label: "5,000 – 25,000", factor: 1.15 },
        { id: "l", label: "Over 25,000", factor: 1.35 },
      ],
    },
    note: "HubSpot subscription fees are separate. The prototype is Zion's illustration, not HubSpot's screens.",
  },
  {
    id: "erp",
    group: "org",
    name: "SME ERP",
    hook: "You learn you're out of stock from a customer.",
    pains: [
      { pain: "Stockouts found by customers", fix: "Reorder alerts before you run out" },
      { pain: "Invoices chased from memory", fix: "Automatic payment reminders" },
      { pain: "Month-end takes a week", fix: "Reports ready on the 1st" },
    ],
    modules: [
      { id: "inventory", label: "Inventory and products", hours: 120, included: true },
      { id: "sales", label: "Sales orders", hours: 60 },
      { id: "purchasing", label: "Purchasing and suppliers", hours: 50 },
      { id: "invoicing", label: "Invoicing and accounting sync", hours: 60 },
      { id: "hr", label: "HR and payroll basics", hours: 80 },
      { id: "reports", label: "Reports and dashboards", hours: 40 },
      { id: "branches", label: "Multiple branches", hours: 50 },
    ],
    scale: {
      label: "People using it",
      options: [
        { id: "s", label: "Up to 10", factor: 1 },
        { id: "m", label: "11 – 50", factor: 1.15 },
        { id: "l", label: "Over 50", factor: 1.3 },
      ],
    },
  },
];

function makeRef() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return `ZQ-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

const WEEKLY_CAPACITY = 30;

// Pure estimate for live totals; productQuote adds a reference when the visitor sends it.
export function productEstimate(product: Product, selected: string[], scaleId: string) {
  const scale = product.scale.options.find((o) => o.id === scaleId) ?? product.scale.options[0];
  const lines = product.modules
    .filter((m) => m.included || selected.includes(m.id))
    .map((m) => {
      const hours = Math.round(m.hours * scale.factor);
      return { label: m.label, hours, cost: hours * HOURLY_RATE };
    });
  const totalHours = lines.reduce((sum, l) => sum + l.hours, 0);
  return {
    scale,
    lines,
    totalHours,
    totalCost: totalHours * HOURLY_RATE,
    weeks: Math.max(3, Math.ceil(totalHours / WEEKLY_CAPACITY) + 1),
  };
}

export function productQuote(product: Product, selected: string[], scaleId: string): Quote {
  const { scale, ...estimate } = productEstimate(product, selected, scaleId);
  return {
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    title: product.name,
    cadence: "one-time",
    options: [`${product.scale.label}: ${scale.label}`],
    hourlyRate: HOURLY_RATE,
    note: product.note,
    ...estimate,
  };
}

// ---- Managed IT (monthly plan) ---------------------------------------------
// Priced from organization size, the services chosen, and the contract term.
// Visitors see monthly and contract totals only; effort stays internal.

export const IT_SIZES = [
  { id: "xs", label: "1 – 10", staff: 8 },
  { id: "s", label: "11 – 25", staff: 18 },
  { id: "m", label: "26 – 50", staff: 38 },
  { id: "l", label: "51 – 100", staff: 75 },
  { id: "xl", label: "100+", staff: 120 },
] as const;

export const IT_SERVICES = [
  { id: "helpdesk", label: "Helpdesk for your staff", base: 2, perStaff: 0.25 },
  { id: "devices", label: "Devices and accounts", base: 1, perStaff: 0.15 },
  { id: "workspace", label: "Microsoft 365 or Google Workspace", base: 1, perStaff: 0.05 },
  { id: "security", label: "Backups and security monitoring", base: 2, perStaff: 0.08 },
  { id: "network", label: "Network and Wi-Fi", base: 2, perStaff: 0.03 },
  { id: "onsite", label: "On-site visits (Metro Manila)", base: 4, perStaff: 0 },
  { id: "afterhours", label: "After-hours support", base: 6, perStaff: 0 },
] as const;

// Longer commitments cost less per month.
export const IT_TERMS = [
  { id: "6m", label: "6 months", months: 6, discount: 0 },
  { id: "12m", label: "12 months", months: 12, discount: 0.05 },
  { id: "annual", label: "Yearly, paid upfront", months: 12, discount: 0.1 },
] as const;

export type ItSizeId = (typeof IT_SIZES)[number]["id"];
export type ItServiceId = (typeof IT_SERVICES)[number]["id"];
export type ItTermId = (typeof IT_TERMS)[number]["id"];

export function managedItEstimate(sizeId: ItSizeId, services: ItServiceId[], termId: ItTermId) {
  const size = IT_SIZES.find((s) => s.id === sizeId)!;
  const term = IT_TERMS.find((t) => t.id === termId)!;
  const lines = [
    ...IT_SERVICES.filter((sv) => services.includes(sv.id)).map((sv) => ({
      label: sv.label,
      hours: Math.round(sv.base + sv.perStaff * size.staff),
    })),
    { label: "Monthly report and planning call", hours: 1 },
  ].map((l) => ({ ...l, cost: Math.round(l.hours * HOURLY_RATE * (1 - term.discount)) }));
  const totalHours = lines.reduce((sum, l) => sum + l.hours, 0);
  const monthly = lines.reduce((sum, l) => sum + l.cost, 0);
  const listMonthly = totalHours * HOURLY_RATE;
  return {
    size,
    term,
    lines,
    totalHours,
    monthly,
    contractTotal: monthly * term.months,
    savings: (listMonthly - monthly) * term.months,
  };
}

export function managedItQuote(sizeId: ItSizeId, services: ItServiceId[], termId: ItTermId): Quote {
  const { size, term, lines, totalHours, monthly, contractTotal } = managedItEstimate(sizeId, services, termId);
  return {
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    title: `Managed IT for ${size.label} people`,
    cadence: "monthly",
    lines,
    options: lines.map((l) => l.label),
    totalHours,
    totalCost: monthly,
    hourlyRate: HOURLY_RATE,
    term: term.label,
    contractTotal,
    note: "A Zion team member confirms what's covered before the plan starts.",
  };
}
