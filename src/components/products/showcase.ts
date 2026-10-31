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

// A capability listed beside the demo. Picking it opens the screen that shows it.
export interface Feature {
  label: string;
  detail: string;
  stack: StackEntry[];
}

export interface Showcase {
  accent: string;
  mobile: string; // what the phone shows
  tour: TourStep[];
  features: Feature[];
}

// Every demo also runs on its own page, full window.
export const demoPath = (id: Product["id"]) => `/demo/${id}`;

export const SHOWCASE: Record<Product["id"], Showcase> = {
  "church-os": {
    accent: "#3446A8",
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
    features: [
      { label: "Full person timeline", detail: "Attendance, gifts, serving, notes, and follow-ups on one timeline.", stack: [{ screen: "people" }, { screen: "person", id: "p4", label: "Paolo Garcia" }] },
      { label: "Smart lists", detail: "Away, new-guest, and no-group lists update as records change.", stack: [{ screen: "people" }] },
      { label: "Text a smart list", detail: "Send SMS or email to any list, previewed by name.", stack: [{ screen: "messages" }] },
      { label: "One giving ledger", detail: "All payment methods in one ledger, with receipts and year-end statements.", stack: [{ screen: "giving" }] },
      { label: "Balanced offering batches", detail: "Two-person counts must balance before gifts post to the ledger.", stack: [{ screen: "giving" }, { screen: "batch", id: "b1", label: "Sunday 9 AM offering, Oct 25" }] },
      { label: "Pledge campaigns", detail: "Capital campaign pledges against gifts received, with progress per household.", stack: [{ screen: "giving" }] },
      { label: "Safe kids check-in", detail: "Allergy labels, pickup-code checks, and live room counts.", stack: [{ screen: "checkins" }] },
      { label: "Volunteer scheduling", detail: "Fill Sunday positions, see blocked-out dates, track who replied.", stack: [{ screen: "services" }] },
    ],
  },
  pipeline: {
    accent: "#0F766E",
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
    features: [
      { label: "Shared text inbox", detail: "Assign, close, and add internal notes to every guest text.", stack: [{ screen: "inbox" }] },
      { label: "AI-drafted replies", detail: "Drafts a reply from the guest's history. You approve before it sends.", stack: [{ screen: "inbox" }] },
      { label: "Next-step suggestions", detail: "Suggests the next follow-up from stage, household, and visits.", stack: [{ screen: "board" }, { screen: "person", id: "p1", label: "Liza Mendoza" }] },
      { label: "Household and timeline", detail: "Every text, call, and visit on one timeline, with the household.", stack: [{ screen: "people" }] },
      { label: "Drag-and-drop board", detail: "Move guests through five stages and see who has stalled.", stack: [{ screen: "board" }] },
      { label: "Visual workflow builder", detail: "Texts, emails, owner tasks, and branches on visits or replies.", stack: [{ screen: "workflows" }, { screen: "workflow", id: "f1", label: "New guest journey" }] },
      { label: "Connection card", detail: "Each card adds a guest, texts them, and creates a call task.", stack: [{ screen: "card" }] },
      { label: "Weekly pastor summary", detail: "Funnel and reply times, plus an AI weekly note you approve.", stack: [{ screen: "insights" }] },
    ],
  },
  sermon: {
    accent: "#9F1239",
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
    features: [
      { label: "Drag-and-drop outline", detail: "Move points, scripture, and stories; minutes total as you go.", stack: [{ screen: "sermons" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
      { label: "Scripture study panel", detail: "Look up a passage, browse cross-references, insert it in one click.", stack: [{ screen: "sermons" }, { screen: "sermon", id: "u4", label: "Working out what God works in" }] },
      { label: "Preaching mode", detail: "Large-type outline with a running clock and pace against plan.", stack: [{ screen: "week" }, { screen: "preach", id: "u4-preach", label: "Preaching mode" }] },
      { label: "Service order", detail: "Run sheet with song keys, people, and length against a target.", stack: [{ screen: "order" }] },
      { label: "Preacher calendar", detail: "Open Sundays, preacher assignments, and who is away.", stack: [{ screen: "plan" }] },
      { label: "Peer review", detail: "Another pastor comments on blocks; you reply and resolve.", stack: [{ screen: "review" }] },
      { label: "Illustration library", detail: "Tagged stories with last-used dates, ready to insert.", stack: [{ screen: "illustrations" }] },
      { label: "Outputs from one outline", detail: "Slides, handout, and group guide, each sent to its team.", stack: [{ screen: "export" }] },
    ],
  },
  "bible-study": {
    accent: "#4D7C0F",
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
    features: [
      { label: "Weekly overview", detail: "Attendance due, join requests, and groups needing care on one screen.", stack: [{ screen: "dashboard" }] },
      { label: "Group health scores", detail: "Scored from attendance, trend, and check-ins, with message and visit actions.", stack: [{ screen: "care" }] },
      { label: "Attendance from RSVPs", detail: "Pre-filled from RSVPs. Submitting updates the group's health score.", stack: [{ screen: "events" }, { screen: "event", id: "g7-w0", label: "Seniors' fellowship" }] },
      { label: "Rosters and roles", detail: "Leaders, co-leaders, and members. Add, remove, or change anyone's role.", stack: [{ screen: "groups" }, { screen: "group", id: "g1", label: "Makati Young Pros" }] },
      { label: "Public group finder", detail: "Visitors request a group online. You approve or decline.", stack: [{ screen: "finder" }] },
      { label: "Reading plans", detail: "Assign a plan to a group and track weekly progress.", stack: [{ screen: "plans" }] },
      { label: "Chat and announcements", detail: "Group chats and pinned announcements to every group, with optional SMS.", stack: [{ screen: "messages" }] },
      { label: "Leader pipeline", detail: "Apprentices to coaches: training, coach, and 1:1 dates with overdue flags.", stack: [{ screen: "leaders" }] },
    ],
  },
  hris: {
    accent: "#6D28D9",
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
    features: [
      { label: "Payroll variance checks", detail: "Flags anyone whose net pay moved over 5% before you approve.", stack: [{ screen: "payroll" }] },
      { label: "Payslips with every deduction", detail: "SSS, PhilHealth, Pag-IBIG, tax, and employer share on every payslip.", stack: [{ screen: "payroll" }, { screen: "payslip", id: "s3|oct-b", label: "Tess Aquino" }] },
      { label: "Government remittances", detail: "SSS, PhilHealth, Pag-IBIG, and BIR due dates and filing references.", stack: [{ screen: "remittances" }] },
      { label: "Holiday-aware leave", detail: "Leave skips weekends and Philippine holidays. Balances update on approval.", stack: [{ screen: "leave" }] },
      { label: "Time and overtime", detail: "Daily time records, lates, and overtime approvals that feed payroll.", stack: [{ screen: "time" }] },
      { label: "201 file alerts", detail: "Missing documents and expiring clearances flagged 30 days ahead.", stack: [{ screen: "directory" }] },
      { label: "Expense reimbursements", detail: "Staff submit receipts. Approved expenses join the next pay run.", stack: [{ screen: "expenses" }] },
      { label: "Volunteer clearances", detail: "Kids and youth volunteers stay on hold until trained and cleared.", stack: [{ screen: "onboarding" }] },
    ],
  },
  hubspot: {
    accent: "#334155",
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
    features: [
      { label: "Board dashboard", detail: "Giving, retention and campaign ROI in one page. No exports.", stack: [{ screen: "dashboard" }] },
      { label: "One record per donor", detail: "Gifts, deals, tickets, lists and every touch on one page.", stack: [{ screen: "contacts" }, { screen: "contact", id: "c2", label: "Ramon Lim" }] },
      { label: "Duplicate merging", detail: "Merge duplicate donors in one click. History stays on the record.", stack: [{ screen: "dashboard" }] },
      { label: "Self-updating lists", detail: "Lists follow rules and recount the moment a record changes.", stack: [{ screen: "lists" }] },
      { label: "Major gifts pipeline", detail: "Move gifts across five stages with a weighted forecast.", stack: [{ screen: "pipeline" }] },
      { label: "Forms feed the CRM", detail: "Submissions match or create contacts, join lists, start workflows.", stack: [{ screen: "campaigns" }, { screen: "form", id: "fm1", label: "Scholarship giving form" }] },
      { label: "Donor workflows", detail: "Welcome, win-back and onboarding steps run once a trigger fires.", stack: [{ screen: "automations" }] },
      { label: "Donor care inbox", detail: "Receipt, address and recurring-gift requests resolved from the donor's record.", stack: [{ screen: "inbox" }, { screen: "ticket", id: "tk1", label: "Receipt for my 2026 gifts" }] },
    ],
  },
  donors: {
    accent: "#B4234F",
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
    features: [
      { label: "Thank-you queue", detail: "Receipts and thank-yous for every unthanked gift at once.", stack: [{ screen: "gifts" }] },
      { label: "Donor timeline", detail: "Calls, visits, emails and gifts on one timeline per donor.", stack: [{ screen: "donors" }, { screen: "donor", id: "d1", label: "Ramon Lim" }] },
      { label: "Retention and LYBUNT", detail: "Retention rate, LYBUNT and SYBUNT lists, with one-click reach-out.", stack: [{ screen: "reports", id: "retention" }] },
      { label: "Personal impact reports", detail: "Each donor's gifts shown as meals, scholars and families served.", stack: [{ screen: "reports" }] },
      { label: "Peer-to-peer fundraising", detail: "Fundraiser leaderboards; nudge slow ones and invite new ones.", stack: [{ screen: "campaigns" }, { screen: "campaign", id: "c2", label: "Takbo para sa Iskolar 5K" }] },
      { label: "Program outcomes", detail: "Meals, scholars and families against targets, with cost per outcome.", stack: [{ screen: "programs" }] },
      { label: "Grant pipeline", detail: "Stages, checklists, deadlines and funder reports in one place.", stack: [{ screen: "grants" }] },
      { label: "Personalized email", detail: "Merge-field emails to any segment, with opens and gifts tracked.", stack: [{ screen: "comms" }] },
    ],
  },
  erp: {
    accent: "#0369A1",
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
    features: [
      { label: "Quote to cash", detail: "Confirm, deliver and invoice from one sales record.", stack: [{ screen: "sales" }, { screen: "sale", id: "SO-2418", label: "SO-2418" }] },
      { label: "Reordering rules", detail: "Forecast per branch turns low stock into supplier RFQs.", stack: [{ screen: "inventory" }, { screen: "item", id: "i5", label: "Latex paint, white 4L" }] },
      { label: "Dispatch and proof", detail: "Assign orders to trucks, send them out, collect signatures.", stack: [{ screen: "deliveries" }] },
      { label: "Counter sales", detail: "Ring up walk-ins with cash, GCash or card; stock updates.", stack: [{ screen: "pos" }] },
      { label: "Receivables aging", detail: "Aging buckets and one-click reminders for overdue invoices.", stack: [{ screen: "accounting" }] },
      { label: "Bill matching", detail: "Vendor bills tie back to the purchase order and receipt.", stack: [{ screen: "accounting" }, { screen: "bill", id: "BILL-0142", label: "BILL-0142" }] },
      { label: "Stock by branch", detail: "Live counts per branch, with transfers between Quezon City and Pasig.", stack: [{ screen: "inventory" }] },
      { label: "Month-end close", detail: "Close checklist, VAT summary and period lock for the accountant.", stack: [{ screen: "reports" }] },
    ],
  },
  store: {
    accent: "#7C4A1E",
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
    features: [
      { label: "Local courier fulfillment", detail: "Pick a courier, add tracking, and email the buyer.", stack: [{ screen: "orders" }, { screen: "order", id: "#1052", label: "#1052" }] },
      { label: "Cart recovery", detail: "Email shoppers who left before paying, one click each.", stack: [{ screen: "orders" }] },
      { label: "Wholesale draft orders", detail: "Send an invoice, then turn the paid draft into an order.", stack: [{ screen: "orders" }] },
      { label: "Variants and SEO", detail: "Sizes and grinds with compare-at prices, stock, and a search listing.", stack: [{ screen: "products" }, { screen: "product", id: "p2", label: "Sagada Heirloom Arabica" }] },
      { label: "Stock by location", detail: "Roastery and café stock, logged adjustments, low-stock alerts.", stack: [{ screen: "inventory" }] },
      { label: "Discount codes", detail: "Percent, fixed, free shipping, or buy X get Y, with limits.", stack: [{ screen: "discounts" }] },
      { label: "Coffee subscriptions", detail: "Skip, pause, resume, or retry a failed renewal in one click.", stack: [{ screen: "marketing" }] },
      { label: "Local payments and shipping", detail: "Payment methods, shipping rates, and free-shipping thresholds per zone.", stack: [{ screen: "settings" }] },
    ],
  },
};
