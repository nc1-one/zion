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
  id: "church-os" | "bible-study" | "hubspot" | "erp";
  name: string;
  short: string;
  pitch: string;
  forWho: string;
  modules: ProductModule[];
  scale: { label: string; options: { id: string; label: string; factor: number }[] };
  note?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "church-os",
    name: "Church Operating System",
    short: "People, giving, events, and volunteers in one place.",
    pitch:
      "One system for the whole church office: a member directory with households, online and recurring giving, event registration with check-in, and volunteer scheduling.",
    forWho: "local churches and multi-site congregations",
    modules: [
      { id: "people", label: "People and households", hours: 80, included: true },
      { id: "giving", label: "Online and recurring giving", hours: 40 },
      { id: "events", label: "Events and check-in", hours: 40 },
      { id: "volunteers", label: "Volunteer scheduling", hours: 30 },
      { id: "media", label: "Sermon and media library", hours: 20 },
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
    id: "bible-study",
    name: "Bible Study Group Management",
    short: "Groups, attendance, reading plans, and leader check-ins.",
    pitch:
      "Keep every small group connected: group rosters, weekly attendance, shared reading plans, and a quick check-in for leaders so pastors see which groups need care.",
    forWho: "churches and campus ministries running small groups",
    modules: [
      { id: "groups", label: "Groups and members", hours: 60, included: true },
      { id: "attendance", label: "Attendance tracking", hours: 20 },
      { id: "plans", label: "Reading plans and discussion guides", hours: 30 },
      { id: "checkins", label: "Leader check-ins and dashboards", hours: 25 },
      { id: "prayer", label: "Prayer requests", hours: 15 },
      { id: "messages", label: "Group messaging and reminders", hours: 30 },
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
    id: "hubspot",
    name: "HubSpot for NGOs and Faith-Driven Businesses",
    short: "We set up HubSpot around your donors or customers.",
    pitch:
      "A HubSpot implementation shaped to how you work: donor or sales pipelines, clean contact records, email campaigns with automation, website forms, and dashboards your board can read.",
    forWho: "NGOs, ministries, and faith-driven businesses using or moving to HubSpot",
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
    note: "HubSpot subscription fees are separate and paid to HubSpot. The preview is Zion's illustration, not HubSpot's own screens.",
  },
  {
    id: "erp",
    name: "ERP for Small and Medium Businesses",
    short: "Inventory, orders, invoices, and reports for SMEs.",
    pitch:
      "Run the business from one system: stock levels with reorder alerts, sales and purchase orders, invoicing that syncs to your accounting, and reports that show where the money goes.",
    forWho: "growing SMEs, retailers, and distributors",
    modules: [
      { id: "inventory", label: "Inventory and products", hours: 120, included: true },
      { id: "sales", label: "Sales orders", hours: 60 },
      { id: "purchasing", label: "Purchasing and suppliers", hours: 50 },
      { id: "invoicing", label: "Invoicing and accounting sync", hours: 60 },
      { id: "hr", label: "HR and payroll basics", hours: 80 },
      { id: "reports", label: "Reports and dashboards", hours: 40 },
      { id: "branches", label: "Multiple branches or warehouses", hours: 50 },
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

// ---- Managed IT (monthly) ----------------------------------------------------

export const MANAGED_IT_OPTIONS = [
  { id: "onsite", label: "On-site visits in Metro Manila", hours: 4 },
  { id: "afterhours", label: "After-hours and weekend support", hours: 6 },
] as const;

export function managedItEstimate(staff: number, options: string[]) {
  const base = Math.max(6, Math.round(4 + staff * 0.6));
  const helpdesk = Math.round(base * 0.5);
  const devices = Math.round(base * 0.25);
  const security = Math.max(1, base - helpdesk - devices - 1);
  const lines = [
    { label: "Helpdesk and user support", hours: helpdesk },
    { label: "Devices, accounts, and licenses", hours: devices },
    { label: "Backups, updates, and security monitoring", hours: security },
    { label: "Monthly report and planning call", hours: 1 },
    ...MANAGED_IT_OPTIONS.filter((o) => options.includes(o.id)).map((o) => ({ label: o.label, hours: o.hours })),
  ].map((l) => ({ ...l, cost: l.hours * HOURLY_RATE }));
  const totalHours = lines.reduce((sum, l) => sum + l.hours, 0);
  return { lines, totalHours, totalCost: totalHours * HOURLY_RATE };
}

export function managedItQuote(staff: number, options: string[]): Quote {
  return {
    ...managedItEstimate(staff, options),
    ref: makeRef(),
    createdAt: new Date().toISOString(),
    title: `Managed IT for ${staff} ${staff === 1 ? "person" : "people"}`,
    cadence: "monthly",
    options: MANAGED_IT_OPTIONS.filter((o) => options.includes(o.id)).map((o) => o.label),
    hourlyRate: HOURLY_RATE,
    note: "Monthly plan at Zion's hourly rate. A Zion team member confirms what's covered with you before it starts.",
  };
}
