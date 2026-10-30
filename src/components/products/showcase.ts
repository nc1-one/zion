import type { StackEntry } from "./drive";
import type { Product } from "@/lib/quotes";

// One step of a product's guided tour. A cursor plays it out on the live demo:
// it clicks the sidebar section, opens a record if needed, then points at (and
// optionally clicks) each action in turn.
export interface TourStep {
  title: string;
  short: string; // chapter label under the progress bar
  detail: string;
  screen?: string; // sidebar section to start from
  open?: { text: string; stack: StackEntry[] }; // record to open; stack is the fallback
  actions?: { text: string; click?: boolean }[];
  phone?: boolean; // ends on the mobile app
}

export interface Showcase {
  accent: string;
  host: string;
  mobile: string; // what the phone shows
  tour: TourStep[];
}

export const SHOWCASE: Record<Product["id"], Showcase> = {
  "church-os": {
    accent: "#3446A8",
    host: "churchos.zionsystems.dev",
    mobile: "Member app",
    tour: [
      { title: "Sunday at a glance", short: "Overview", detail: "Attendance, giving, and new guests on one screen.", screen: "dashboard", actions: [{ text: "Attendance, last eight Sundays" }] },
      { title: "Catch who's drifting", short: "Drifting", detail: "Members away four weeks surface here. Assign a call.", screen: "dashboard", actions: [{ text: "Assign", click: true }] },
      { title: "Everyone in one list", short: "People", detail: "Households, ministries, and status. Filter in one click.", screen: "people", actions: [{ text: "Drifting", click: true }] },
      {
        title: "One record per person",
        short: "Record",
        detail: "Giving, notes, and history together. Text them from here.",
        screen: "people",
        open: { text: "Paolo Garcia", stack: [{ screen: "people" }, { screen: "person", id: "p4", label: "Paolo Garcia" }] },
        actions: [{ text: "Text", click: true }],
      },
      { title: "Giving that reconciles", short: "Giving", detail: "GCash, Maya, card, and bank in one ledger.", screen: "giving", actions: [{ text: "2026", click: true }] },
      { title: "Members give by phone", short: "Mobile", detail: "Give, register, and check in from the member app.", phone: true },
    ],
  },
  pipeline: {
    accent: "#0F766E",
    host: "pipeline.zionsystems.dev",
    mobile: "Care team app",
    tour: [
      { title: "Every guest, every stage", short: "Board", detail: "From first visit to serving, on one board.", screen: "board", actions: [{ text: "Liza Mendoza" }] },
      {
        title: "AI suggests the next step",
        short: "AI draft",
        detail: "It reads the history and drafts a message.",
        screen: "board",
        open: { text: "Liza Mendoza", stack: [{ screen: "board" }, { screen: "person", id: "p1", label: "Liza Mendoza" }] },
        actions: [{ text: "Suggested next step" }],
      },
      {
        title: "You approve, it sends",
        short: "Send",
        detail: "Nothing goes out without a person approving it.",
        screen: "board",
        open: { text: "Liza Mendoza", stack: [{ screen: "board" }, { screen: "person", id: "p1", label: "Liza Mendoza" }] },
        actions: [{ text: "Approve and send", click: true }],
      },
      { title: "Every follow-up has an owner", short: "Follow-ups", detail: "Overdue ones rise to the top.", screen: "followups", actions: [{ text: "Overdue", click: true }, { text: "Mark done", click: true }] },
      { title: "See where people stall", short: "Insights", detail: "Conversion by stage, with a summary for pastors.", screen: "insights", actions: [{ text: "Draft summary", click: true }] },
      { title: "Follow up from anywhere", short: "Mobile", detail: "Care leaders send approved texts from their phone.", phone: true },
    ],
  },
  sermon: {
    accent: "#9F1239",
    host: "sermons.zionsystems.dev",
    mobile: "Sunday notes",
    tour: [
      { title: "This Sunday", short: "Sunday", detail: "Who's preaching, what's ready, what's missing.", screen: "week", actions: [{ text: "Ready by Friday" }] },
      { title: "Write in one place", short: "Outline", detail: "Outline, Scripture, and illustrations together.", screen: "week", actions: [{ text: "Edit outline", click: true }] },
      {
        title: "One outline, three outputs",
        short: "Slides",
        detail: "Slides, handout, and guide come from the same outline.",
        screen: "week",
        open: { text: "Edit outline", stack: [{ screen: "week" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
        actions: [{ text: "Slides", click: true }, { text: "Handout", click: true }],
      },
      {
        title: "Questions for small groups",
        short: "Guide",
        detail: "AI drafts discussion questions. The pastor edits.",
        screen: "week",
        open: { text: "Edit outline", stack: [{ screen: "week" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
        actions: [{ text: "Group guide", click: true }, { text: "Draft questions", click: true }],
      },
      { title: "Preaching calendar", short: "Plan", detail: "Open Sundays and unassigned weeks flagged.", screen: "plan", actions: [{ text: "Plan this Sunday" }] },
      { title: "Notes on every phone", short: "Mobile", detail: "The congregation fills in the blanks as you preach.", phone: true },
    ],
  },
  "bible-study": {
    accent: "#4D7C0F",
    host: "groups.zionsystems.dev",
    mobile: "Leader app",
    tour: [
      { title: "Every group's health", short: "Health", detail: "Healthy, slipping, or needs care. At a glance.", screen: "dashboard", actions: [{ text: "Needs care and slipping" }] },
      {
        title: "Spot a group slipping",
        short: "Group",
        detail: "Attendance down four weeks. The leader's notes say why.",
        screen: "groups",
        open: { text: "Ortigas Night Shift", stack: [{ screen: "groups" }, { screen: "group", id: "g8", label: "Ortigas Night Shift" }] },
        actions: [{ text: "Attendance, last six weeks" }],
      },
      {
        title: "Reach the leader",
        short: "Message",
        detail: "One click to check in with them.",
        screen: "groups",
        open: { text: "Ortigas Night Shift", stack: [{ screen: "groups" }, { screen: "group", id: "g8", label: "Ortigas Night Shift" }] },
        actions: [{ text: "Message leader", click: true }],
      },
      { title: "Place new people fast", short: "Finder", detail: "Matched by area, day, and life stage.", screen: "finder", actions: [{ text: "Place in group", click: true }] },
      { title: "One-minute check-ins", short: "Check-ins", detail: "Leaders get a link on meeting day.", screen: "checkins", actions: [{ text: "Check in" }] },
      { title: "Leaders check in by phone", short: "Mobile", detail: "Attendance and prayer requests in under a minute.", phone: true },
    ],
  },
  hris: {
    accent: "#6D28D9",
    host: "hris.zionsystems.dev",
    mobile: "Staff app",
    tour: [
      { title: "Your team at a glance", short: "Overview", detail: "Payroll dates, leave, and expiring documents.", screen: "dashboard", actions: [{ text: "Needs attention" }] },
      { title: "Leave without the texts", short: "Leave", detail: "Requests, balances, and approvals in one place.", screen: "leave", actions: [{ text: "Approve", click: true }] },
      { title: "Payroll, computed", short: "Payroll", detail: "SSS, PhilHealth, Pag-IBIG, and tax done for you.", screen: "payroll", actions: [{ text: "Review and approve", click: true }, { text: "Approve pay run", click: true }] },
      {
        title: "201 files, organized",
        short: "Staff",
        detail: "Contracts, IDs, and clearances, with expiry alerts.",
        screen: "directory",
        open: { text: "Andrea Flores", stack: [{ screen: "directory" }, { screen: "profile", id: "s2", label: "Andrea Flores" }] },
        actions: [{ text: "Documents" }],
      },
      { title: "Ready on day one", short: "Onboarding", detail: "Every new hire gets the same checklist.", screen: "onboarding" },
      { title: "Payslips on their phone", short: "Mobile", detail: "Staff check pay and request leave themselves.", phone: true },
    ],
  },
  hubspot: {
    accent: "#C2410C",
    host: "hope-ph.zionsystems.dev",
    mobile: "Donation page",
    tour: [
      { title: "Giving at a glance", short: "Dashboard", detail: "A live board report. No exports.", screen: "dashboard", actions: [{ text: "New donors", click: true }, { text: "Board report, October" }] },
      {
        title: "One record per donor",
        short: "Donor",
        detail: "Three inboxes and a spreadsheet, merged.",
        screen: "contacts",
        open: { text: "Ramon Lim", stack: [{ screen: "contacts" }, { screen: "contact", id: "c2", label: "Ramon Lim" }] },
        actions: [{ text: "Activity" }],
      },
      { title: "Track every ask", short: "Pipeline", detail: "Major gifts from prospect to given.", screen: "pipeline", actions: [{ text: "2027 scholarship fund" }] },
      {
        title: "Campaigns that test themselves",
        short: "Campaigns",
        detail: "Two subject lines. The better one wins.",
        screen: "campaigns",
        open: { text: "October field report", stack: [{ screen: "campaigns" }, { screen: "campaign", id: "k1", label: "October field report" }] },
        actions: [{ text: "Subject line test" }],
      },
      { title: "Follow-up on autopilot", short: "Automations", detail: "Thank-yous, reminders, and win-backs.", screen: "automations", actions: [{ text: "Year-end appeal follow-up" }] },
      { title: "Give from any phone", short: "Mobile", detail: "GCash or card. The gift lands in HubSpot.", phone: true },
    ],
  },
  erp: {
    accent: "#0369A1",
    host: "erp.zionsystems.dev",
    mobile: "Driver app",
    tour: [
      { title: "The business at a glance", short: "Dashboard", detail: "Sales, stock alerts, and unpaid invoices.", screen: "dashboard", actions: [{ text: "Needs attention" }] },
      {
        title: "Stock across branches",
        short: "Stock",
        detail: "Reorder alerts before you run out.",
        screen: "inventory",
        open: { text: "Deformed bar 12mm × 6m", stack: [{ screen: "inventory" }, { screen: "item", id: "i3", label: "Deformed bar 12mm × 6m" }] },
        actions: [{ text: "Stock by branch" }],
      },
      {
        title: "Orders to delivery",
        short: "Orders",
        detail: "Ship it, and the invoice sends itself.",
        screen: "orders",
        open: { text: "SO-2418", stack: [{ screen: "orders" }, { screen: "order", id: "SO-2418", label: "SO-2418" }] },
        actions: [{ text: "Mark shipped", click: true }],
      },
      { title: "Collect on time", short: "Invoices", detail: "Reminders go out before and after due dates.", screen: "invoices", actions: [{ text: "Remind", click: true }] },
      { title: "Month-end in a day", short: "Reports", detail: "Revenue, margins, and the close checklist.", screen: "reports", actions: [{ text: "Revenue vs expenses" }] },
      { title: "Deliveries by phone", short: "Mobile", detail: "Drivers confirm drop-offs with a signature.", phone: true },
    ],
  },
};
