import { BookOpen, Boxes, Church, HeartHandshake, IdCard, NotebookPen, Route, type LucideIcon } from "lucide-react";
import type { StackEntry } from "./ProtoKit";
import type { Product } from "@/lib/quotes";

export interface TourStep {
  title: string;
  detail: string;
  stack?: StackEntry[]; // where the web app goes; omitted steps keep the current screen
  phone?: boolean; // show the mobile app for this step
}

export interface Showcase {
  accent: string;
  icon: LucideIcon;
  host: string;
  mobile?: string; // what the phone shows
  tour: TourStep[];
}

// How each product presents itself: brand, address, and the guided tour.
export const SHOWCASE: Record<Product["id"], Showcase> = {
  "church-os": {
    accent: "#3446A8",
    icon: Church,
    host: "churchos.zionsystems.dev",
    mobile: "Member app",
    tour: [
      { title: "Sunday at a glance", detail: "Attendance, giving, and new guests on one screen.", stack: [{ screen: "dashboard" }] },
      { title: "Everyone in one list", detail: "Households, ministries, and status. Search or filter.", stack: [{ screen: "people" }] },
      { title: "Catch who's drifting", detail: "Paolo has been away six weeks. Assign a call.", stack: [{ screen: "people" }, { screen: "person", id: "p4", label: "Paolo Garcia" }] },
      { title: "Giving that reconciles", detail: "GCash, Maya, card, and bank in one ledger.", stack: [{ screen: "giving" }] },
      { title: "Fill Sunday roles", detail: "Open slots show up. Assign in one click.", stack: [{ screen: "volunteers" }] },
      { title: "Members give by phone", detail: "Give, register, and check in from the member app.", phone: true },
    ],
  },
  pipeline: {
    accent: "#0F766E",
    icon: Route,
    host: "pipeline.zionsystems.dev",
    mobile: "Care team app",
    tour: [
      { title: "Every guest, every stage", detail: "From first visit to serving, on one board.", stack: [{ screen: "board" }] },
      { title: "The whole story", detail: "Visits, texts, and calls for each guest.", stack: [{ screen: "board" }, { screen: "person", id: "p1", label: "Liza Mendoza" }] },
      { title: "AI drafts the follow-up", detail: "Suggested next steps. Your team approves.", stack: [{ screen: "followups" }] },
      { title: "QR guest cards", detail: "Guests scan in the lobby. No paper cards.", stack: [{ screen: "card" }] },
      { title: "See where people stall", detail: "Conversion by stage, month over month.", stack: [{ screen: "insights" }] },
      { title: "Follow up from anywhere", detail: "Care leaders send approved texts from their phone.", phone: true },
    ],
  },
  sermon: {
    accent: "#9F1239",
    icon: NotebookPen,
    host: "sermons.zionsystems.dev",
    mobile: "Sunday notes",
    tour: [
      { title: "This Sunday", detail: "Who's preaching, what's ready, what's missing.", stack: [{ screen: "week" }] },
      { title: "Write in one place", detail: "Outline, Scripture, and illustrations together.", stack: [{ screen: "week" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
      { title: "Plan the series", detail: "Every week of Philippians, mapped.", stack: [{ screen: "series" }, { screen: "series-detail", id: "phil", label: "Unshaken: Philippians" }] },
      { title: "Preaching calendar", detail: "Open Sundays and unassigned weeks flagged.", stack: [{ screen: "plan" }] },
      { title: "One outline, three outputs", detail: "Slides, handout, and small-group guide.", stack: [{ screen: "export" }] },
      { title: "Notes on every phone", detail: "The congregation fills in the blanks as you preach.", phone: true },
    ],
  },
  "bible-study": {
    accent: "#4D7C0F",
    icon: BookOpen,
    host: "groups.zionsystems.dev",
    mobile: "Leader app",
    tour: [
      { title: "Every group's health", detail: "Healthy, slipping, or needs care. At a glance.", stack: [{ screen: "dashboard" }] },
      { title: "Spot a group slipping", detail: "Attendance down four weeks. Leader notes explain why.", stack: [{ screen: "groups" }, { screen: "group", id: "g8", label: "Ortigas Night Shift" }] },
      { title: "One-minute check-ins", detail: "Leaders report attendance and prayer needs.", stack: [{ screen: "checkins" }] },
      { title: "Place new people fast", detail: "Matched by area, day, and life stage.", stack: [{ screen: "finder" }] },
      { title: "Reading plans", detail: "Every group on the same passage, or its own.", stack: [{ screen: "plans" }] },
      { title: "Leaders check in by phone", detail: "Attendance and prayer requests in under a minute.", phone: true },
    ],
  },
  hris: {
    accent: "#6D28D9",
    icon: IdCard,
    host: "hris.zionsystems.dev",
    mobile: "Staff app",
    tour: [
      { title: "Your team at a glance", detail: "Payroll dates, leave, and expiring documents.", stack: [{ screen: "dashboard" }] },
      { title: "201 files, organized", detail: "Contracts, IDs, and clearances per person.", stack: [{ screen: "directory" }, { screen: "profile", id: "s2", label: "Andrea Flores" }] },
      { title: "Payroll, computed", detail: "SSS, PhilHealth, Pag-IBIG, and tax done for you.", stack: [{ screen: "payroll" }] },
      { title: "Leave without texts", detail: "Requests, approvals, and balances in one place.", stack: [{ screen: "leave" }] },
      { title: "Onboarding checklists", detail: "New hires ready on day one.", stack: [{ screen: "onboarding" }] },
      { title: "Payslips on their phone", detail: "Staff check pay and request leave themselves.", phone: true },
    ],
  },
  hubspot: {
    accent: "#C2410C",
    icon: HeartHandshake,
    host: "hope-ph.zionsystems.dev",
    mobile: "Donation page",
    tour: [
      { title: "Giving at a glance", detail: "Monthly giving, new donors, and retention.", stack: [{ screen: "dashboard" }] },
      { title: "One record per donor", detail: "Three inboxes and a spreadsheet, merged.", stack: [{ screen: "contacts" }, { screen: "contact", id: "c2", label: "Ramon Lim" }] },
      { title: "Track every ask", detail: "Major gifts from prospect to given.", stack: [{ screen: "pipeline" }] },
      { title: "Campaigns that test", detail: "Subject lines A/B tested. The winner sends.", stack: [{ screen: "campaigns" }, { screen: "campaign", id: "k1", label: "October field report" }] },
      { title: "Follow-up on autopilot", detail: "Thank-yous, reminders, and win-backs.", stack: [{ screen: "automations" }] },
      { title: "Give from any phone", detail: "GCash or card. The gift lands in HubSpot.", phone: true },
    ],
  },
  erp: {
    accent: "#0369A1",
    icon: Boxes,
    host: "erp.zionsystems.dev",
    mobile: "Driver app",
    tour: [
      { title: "The business at a glance", detail: "Sales, stock alerts, and unpaid invoices.", stack: [{ screen: "dashboard" }] },
      { title: "Stock across branches", detail: "12mm bars are low. Reorder before you run out.", stack: [{ screen: "inventory" }, { screen: "item", id: "i3", label: "Deformed bar 12mm × 6m" }] },
      { title: "Orders to delivery", detail: "Every order from quote to proof of delivery.", stack: [{ screen: "orders" }] },
      { title: "Purchasing", detail: "Purchase orders and supplier lead times.", stack: [{ screen: "purchasing" }] },
      { title: "Collect on time", detail: "Reminders go out before and after due dates.", stack: [{ screen: "invoices" }] },
      { title: "Deliveries by phone", detail: "Drivers confirm drop-offs. Invoices send themselves.", phone: true },
    ],
  },
};
