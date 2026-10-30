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
      { title: "Sunday at a glance", short: "Overview", detail: "Attendance, giving, guests, and who needs a call.", screen: "dashboard", actions: [{ text: "Needs a call this week" }, { text: "Assign", click: true }] },
      {
        title: "One record per person",
        short: "Record",
        detail: "Household, custom fields, and a full timeline.",
        screen: "people",
        open: { text: "Paolo Garcia", stack: [{ screen: "people" }, { screen: "person", id: "p4", label: "Paolo Garcia" }] },
        actions: [{ text: "Timeline", click: true }, { text: "Add follow-up", click: true }, { text: "Save follow-up", click: true }],
      },
      { title: "Statements in one click", short: "Giving", detail: "Year-end statements to every giver at once.", screen: "giving", actions: [{ text: "Statements", click: true }, { text: "Send all statements", click: true }] },
      { title: "Safe kids check-in", short: "Check-in", detail: "Security codes, allergy labels, room headcounts.", screen: "checkins", actions: [{ text: "Reyes household", click: true }, { text: "Check in and print labels", click: true }] },
      { title: "Text a smart list", short: "Messages", detail: "Reach everyone away 4+ weeks, previewed by name.", screen: "messages", actions: [{ text: "Away 4+ weeks", click: true }, { text: "Missed you on Sunday", click: true }, { text: "Send SMS", click: true }] },
      { title: "Members give by phone", short: "Mobile", detail: "Give, register, and check in from the member app.", phone: true },
    ],
  },
  pipeline: {
    accent: "#0F766E",
    host: "pipeline.zionsystems.dev",
    mobile: "Care team app",
    tour: [
      { title: "One inbox for every text", short: "Inbox", detail: "Guest replies land in one shared, assigned inbox.", screen: "inbox", actions: [{ text: "Suggested reply" }, { text: "Approve and send", click: true }] },
      {
        title: "A six-week journey, built visually",
        short: "Workflows",
        detail: "Texts, emails, tasks, and a second-visit branch.",
        screen: "workflows",
        open: { text: "New guest journey", stack: [{ screen: "workflows" }, { screen: "workflow", id: "f1", label: "New guest journey" }] },
        actions: [{ text: "If visited twice" }, { text: "Send email: What to expect at Grace", click: true }, { text: "Draft with AI", click: true }],
      },
      { title: "Scan, fill, land in Guest", short: "Card", detail: "Each card adds a guest, a text, and a call task.", screen: "card", actions: [{ text: "Live preview" }, { text: "Send card", click: true }] },
      {
        title: "AI drafts the next step",
        short: "People",
        detail: "Full history and household. You approve, it sends.",
        screen: "board",
        open: { text: "Liza Mendoza", stack: [{ screen: "board" }, { screen: "person", id: "p1", label: "Liza Mendoza" }] },
        actions: [{ text: "Suggested next step" }, { text: "Approve and send", click: true }],
      },
      { title: "A weekly note for pastors", short: "Insights", detail: "Conversion, reply times, and an AI summary to approve.", screen: "insights", actions: [{ text: "Response times" }, { text: "Draft summary", click: true }] },
      { title: "Follow up from anywhere", short: "Mobile", detail: "Care leaders send approved texts from their phone.", phone: true },
    ],
  },
  sermon: {
    accent: "#9F1239",
    host: "sermons.zionsystems.dev",
    mobile: "Sunday notes",
    tour: [
      { title: "Sunday at a glance", short: "Sunday", detail: "What's ready, what's missing, and open comments.", screen: "week", actions: [{ text: "Ready by Friday" }] },
      {
        title: "Scripture in one click",
        short: "Outline",
        detail: "Look up a passage and drop it into the outline.",
        screen: "week",
        open: { text: "Edit outline", stack: [{ screen: "week" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
        actions: [{ text: "Study" }, { text: "Insert passage", click: true }],
      },
      {
        title: "Preach from the outline",
        short: "Preach",
        detail: "Large type, a running clock, and pace against plan.",
        screen: "week",
        open: { text: "Preach", stack: [{ screen: "week" }, { screen: "preach", id: "u4-preach", label: "Preaching mode" }] },
        actions: [{ text: "Start timer", click: true }, { text: "Next", click: true }],
      },
      {
        title: "One outline, every output",
        short: "Outputs",
        detail: "Slides, handout, and AI-drafted group questions.",
        screen: "week",
        open: { text: "Edit outline", stack: [{ screen: "week" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
        actions: [{ text: "Slides", click: true }, { text: "Handout", click: true }, { text: "Group guide", click: true }, { text: "Draft questions", click: true }],
      },
      { title: "Review with your team", short: "Review", detail: "Another pastor comments on the draft. You resolve.", screen: "review", actions: [{ text: "Resolve", click: true }] },
      { title: "Notes on every phone", short: "Mobile", detail: "The congregation fills in the blanks as you preach.", phone: true },
    ],
  },
  "bible-study": {
    accent: "#4D7C0F",
    host: "groups.zionsystems.dev",
    mobile: "Leader app",
    tour: [
      { title: "The week at a glance", short: "Overview", detail: "Attendance due, join requests, and care in one view.", screen: "dashboard", actions: [{ text: "Attendance due" }] },
      {
        title: "Rosters with roles",
        short: "Group",
        detail: "Leaders, co-leaders, and members. Add or remove anyone.",
        screen: "groups",
        open: { text: "Makati Young Pros", stack: [{ screen: "groups" }, { screen: "group", id: "g1", label: "Makati Young Pros" }] },
        actions: [{ text: "Members", click: true }, { text: "Add member" }],
      },
      { title: "Approve join requests", short: "Finder", detail: "Visitors find a group online. Leaders say yes.", screen: "finder", actions: [{ text: "Approve", click: true }] },
      {
        title: "Attendance after every meeting",
        short: "Attendance",
        detail: "Filled in from RSVPs. Group health updates on submit.",
        screen: "events",
        open: { text: "Seniors' fellowship", stack: [{ screen: "events" }, { screen: "event", id: "g7-w0", label: "Seniors' fellowship" }] },
        actions: [{ text: "Submit attendance", click: true }],
      },
      { title: "Care for struggling groups", short: "Health", detail: "Scored from attendance and check-ins. Act in one click.", screen: "care", actions: [{ text: "Schedule visit", click: true }, { text: "Save visit", click: true }] },
      { title: "Leaders check in by phone", short: "Mobile", detail: "Attendance and prayer requests in under a minute.", phone: true },
    ],
  },
  hris: {
    accent: "#6D28D9",
    host: "hris.zionsystems.dev",
    mobile: "Staff app",
    tour: [
      { title: "Your team at a glance", short: "Overview", detail: "Approvals, expiring documents, and pay dates.", screen: "dashboard", actions: [{ text: "Needs attention" }] },
      { title: "Payroll with variance checks", short: "Payroll", detail: "SSS, PhilHealth, Pag-IBIG, and tax, checked against last cutoff.", screen: "payroll", actions: [{ text: "Variance", click: true }, { text: "Review and approve", click: true }, { text: "Approve pay run", click: true }] },
      { title: "Remittances on time", short: "Remittances", detail: "Monthly SSS, PhilHealth, Pag-IBIG, and BIR due dates.", screen: "remittances", actions: [{ text: "Mark filed", click: true }, { text: "Save filing", click: true }] },
      { title: "Leave around holidays", short: "Leave", detail: "Team calendar with Philippine holidays built in.", screen: "leave", actions: [{ text: "Calendar", click: true }, { text: "Bonifacio Day" }] },
      {
        title: "201 files with expiry alerts",
        short: "Staff",
        detail: "Contracts, IDs, and clearances, with expiry alerts.",
        screen: "directory",
        open: { text: "Andrea Flores", stack: [{ screen: "directory" }, { screen: "profile", id: "s2", label: "Andrea Flores" }] },
        actions: [{ text: "201 file", click: true }],
      },
      { title: "Payslips on their phone", short: "Mobile", detail: "Staff check pay and request leave themselves.", phone: true },
    ],
  },
  hubspot: {
    accent: "#334155",
    host: "hope-ph.zionsystems.dev",
    mobile: "Donation page",
    tour: [
      { title: "The board report, live", short: "Dashboard", detail: "Giving, retention, and campaign ROI. No exports.", screen: "dashboard", actions: [{ text: "New donors", click: true }, { text: "Campaign ROI" }, { text: "Merge", click: true }] },
      {
        title: "One record per donor",
        short: "Contact",
        detail: "Company, deals, tickets, and lists on one page.",
        screen: "contacts",
        open: { text: "Ramon Lim", stack: [{ screen: "contacts" }, { screen: "contact", id: "c2", label: "Ramon Lim" }] },
        actions: [{ text: "Associations" }, { text: "Gifts", click: true }],
      },
      {
        title: "Move a major gift forward",
        short: "Deals",
        detail: "Stage, weighted forecast, and next steps per gift.",
        screen: "pipeline",
        open: { text: "2027 scholarship fund", stack: [{ screen: "pipeline" }, { screen: "deal", id: "d1", label: "2027 scholarship fund" }] },
        actions: [{ text: "Pledged", click: true }, { text: "Add", click: true }],
      },
      { title: "A page that fills the CRM", short: "Marketing", detail: "A gift on the page becomes a contact and a workflow.", screen: "campaigns", actions: [{ text: "Landing page", click: true }, { text: "Give ₱1,000 monthly", click: true }, { text: "Latest submissions" }] },
      {
        title: "Donor care in one inbox",
        short: "Donor care",
        detail: "Receipt requests answered from gift records.",
        screen: "inbox",
        open: { text: "Receipt for my 2026 gifts", stack: [{ screen: "inbox" }, { screen: "ticket", id: "tk1", label: "Receipt for my 2026 gifts" }] },
        actions: [{ text: "Conversation" }, { text: "Send receipt", click: true }],
      },
      { title: "Give from any phone", short: "Mobile", detail: "GCash or card. The gift lands in HubSpot.", phone: true },
    ],
  },
  donors: {
    accent: "#B4234F",
    host: "impact.zionsystems.dev",
    mobile: "Donor app",
    tour: [
      { title: "Who to thank today", short: "Overview", detail: "Retention, revenue against last year, and gifts to thank.", screen: "dashboard", actions: [{ text: "Donors to thank today" }, { text: "Call", click: true }] },
      {
        title: "Every touch on one timeline",
        short: "Donor",
        detail: "Engagement, household, soft credits, and every call.",
        screen: "donors",
        open: { text: "Ramon Lim", stack: [{ screen: "donors" }, { screen: "donor", id: "d1", label: "Ramon Lim" }] },
        actions: [{ text: "Timeline", click: true }, { text: "Log interaction", click: true }, { text: "Save to timeline", click: true }],
      },
      { title: "No gift goes unthanked", short: "Gifts", detail: "Find gifts awaiting thanks. Send them all at once.", screen: "gifts", actions: [{ text: "Needs thank-you", click: true }, { text: "Send all thank-yous", click: true }] },
      {
        title: "Supporters raise for you",
        short: "Peer-to-peer",
        detail: "Track every fundraiser page and invite new ones.",
        screen: "campaigns",
        open: { text: "Takbo para sa Iskolar 5K", stack: [{ screen: "campaigns" }, { screen: "campaign", id: "c2", label: "Takbo para sa Iskolar 5K" }] },
        actions: [{ text: "Fundraisers" }, { text: "Invite fundraiser", click: true }, { text: "Send invite", click: true }],
      },
      { title: "Gifts turned into outcomes", short: "Impact", detail: "A one-page report of meals, scholars, and families.", screen: "reports", actions: [{ text: "Where your gifts went" }, { text: "Send report", click: true }] },
      { title: "Donors see their impact", short: "Mobile", detail: "Impact to date, program updates, and give again.", phone: true },
    ],
  },
  erp: {
    accent: "#0369A1",
    host: "erp.zionsystems.dev",
    mobile: "Driver app",
    tour: [
      { title: "The business at a glance", short: "Dashboard", detail: "Sales, cash, and what needs attention today.", screen: "dashboard", actions: [{ text: "Needs attention" }] },
      {
        title: "Quotation to invoice",
        short: "Sales",
        detail: "Confirm, deliver, and invoice from one record.",
        screen: "sales",
        open: { text: "SO-2421", stack: [{ screen: "sales" }, { screen: "sale", id: "SO-2421", label: "SO-2421" }] },
        actions: [{ text: "Confirm order", click: true }, { text: "Validate delivery", click: true }],
      },
      { title: "Reorder before you run out", short: "Stock", detail: "Rules turn low forecasts into supplier RFQs.", screen: "inventory", actions: [{ text: "Reordering", click: true }, { text: "Create RFQs", click: true }] },
      { title: "Walk-in sales at the counter", short: "Counter", detail: "Ring up a walk-in, take GCash, and stock updates.", screen: "pos", actions: [{ text: "Portland cement 40kg", click: true }, { text: "GCash", click: true }, { text: "Complete sale", click: true }] },
      { title: "Know who owes what", short: "Invoicing", detail: "Aging buckets, payments, and a live P&L.", screen: "accounting", actions: [{ text: "Customer invoices", click: true }, { text: "Receivables aging" }, { text: "Profit and loss", click: true }] },
      { title: "Deliveries by phone", short: "Mobile", detail: "Drivers confirm drop-offs with a signature.", phone: true },
    ],
  },
  store: {
    accent: "#7C4A1E",
    host: "shop.zionsystems.dev",
    mobile: "Storefront",
    tour: [
      { title: "Store at a glance", short: "Home", detail: "Sales, sessions, and conversion with a live to-do list.", screen: "home", actions: [{ text: "To do" }, { text: "Top products" }] },
      {
        title: "Fulfill with a local courier",
        short: "Fulfill",
        detail: "Pick LBC, J&T, or Grab. Tracking goes to the buyer.",
        screen: "orders",
        open: { text: "#1052", stack: [{ screen: "orders" }, { screen: "order", id: "#1052", label: "#1052" }] },
        actions: [{ text: "Fulfill items", click: true }, { text: "J&T Express", click: true }, { text: "Mark as fulfilled", click: true }],
      },
      { title: "Win back abandoned carts", short: "Recovery", detail: "Email shoppers who left before paying.", screen: "orders", actions: [{ text: "Abandoned checkouts", click: true }, { text: "Send recovery email", click: true }] },
      {
        title: "Products with real variants",
        short: "Products",
        detail: "Variants, compare-at prices, stock by location, SEO.",
        screen: "products",
        open: { text: "Sagada Heirloom Arabica", stack: [{ screen: "products" }, { screen: "product", id: "p2", label: "Sagada Heirloom Arabica" }] },
        actions: [{ text: "Variants" }, { text: "Inventory by location" }, { text: "Search engine listing" }],
      },
      { title: "Coffee subscriptions", short: "Subscriptions", detail: "Monthly renewals. Retry a failed payment in one click.", screen: "marketing", actions: [{ text: "Subscriptions", click: true }, { text: "Retry payment", click: true }] },
      { title: "Shop from a phone", short: "Mobile", detail: "Pick size and grind, pay with GCash, get an order number.", phone: true },
    ],
  },
};
