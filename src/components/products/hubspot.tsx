"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Columns3, FileText, HandCoins, LayoutDashboard, Mail, Phone, Plus, Search, Send, Share2, UserPlus, Users, Workflow, type LucideIcon } from "lucide-react";
import { Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

const peso = (n: number) => `₱${n.toLocaleString()}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return m && d ? `${MONTHS[m - 1]} ${d}` : iso;
};

type Lifecycle = "Subscriber" | "Volunteer" | "Donor" | "Monthly partner" | "Major donor";
type Segment = "Monthly partners" | "Major donors" | "Lapsed donors" | "Volunteers" | "Church partners" | "New subscribers";
type ActivityKind = "Email" | "Gift" | "Call" | "Meeting" | "Form";
const STAGES = ["Prospect", "Cultivating", "Asked", "Pledged", "Given"] as const;
type Stage = (typeof STAGES)[number];

interface Contact { id: string; name: string; email: string; phone: string; city: string; lifecycle: Lifecycle; segment: Segment; owner: string; givenYtd: number; lastActivity: string; sources: string[] }
interface Activity { id: string; contactId: string; kind: ActivityKind; text: string; date: string }
interface Deal { id: string; name: string; contactId: string; amount: number; stage: Stage; close: string; purpose: string }
interface Flow { id: string; name: string; trigger: string; steps: string[]; on: boolean; enrolled: number }
interface Campaign { id: string; name: string; segment: Segment; date: string; status: "Sent" | "Scheduled" | "Draft"; subject: string; sent: number; open: number; click: number; raised: number; test?: { a: string; b: string; aOpen: number; bOpen: number } }

// Ids for records created in the prototype. Only called from event handlers.
let seq = 100;
const nextId = (prefix: string) => `${prefix}${++seq}`;

const SEGMENTS: { id: Segment; size: number; rule: string; stage: Lifecycle }[] = [
  { id: "Monthly partners", size: 612, rule: "Has an active recurring gift", stage: "Monthly partner" },
  { id: "Major donors", size: 48, rule: "Gave ₱50,000 or more in the last 24 months", stage: "Major donor" },
  { id: "Lapsed donors", size: 1430, rule: "Gave before, nothing in the last 12 months", stage: "Donor" },
  { id: "Volunteers", size: 386, rule: "Signed up through a volunteer form", stage: "Volunteer" },
  { id: "Church partners", size: 74, rule: "Organization type is church", stage: "Donor" },
  { id: "New subscribers", size: 920, rule: "Joined the email list in the last 90 days, no gift yet", stage: "Subscriber" },
];
const seg = (id: Segment) => SEGMENTS.find((s) => s.id === id)!;

const CONTACTS: Contact[] = [
  { id: "c1", name: "Ana Reyes", email: "ana.reyes@gmail.com", phone: "0917 555 0142", city: "Makati", lifecycle: "Major donor", segment: "Major donors", owner: "Tess Villanueva", givenYtd: 250000, lastActivity: "Meeting, Oct 27", sources: ["Donor spreadsheet 2024", "info@ inbox", "Founder's Gmail"] },
  { id: "c2", name: "Ramon Lim", email: "ramon@limfoundation.ph", phone: "0918 555 0193", city: "San Juan", lifecycle: "Major donor", segment: "Major donors", owner: "Tess Villanueva", givenYtd: 500000, lastActivity: "Email opened, Oct 28", sources: ["Donor spreadsheet 2024", "Tess's Outlook"] },
  { id: "c3", name: "Joy Dela Cruz", email: "joydc@yahoo.com", phone: "0927 555 0110", city: "Quezon City", lifecycle: "Monthly partner", segment: "Monthly partners", owner: "Miguel Torres", givenYtd: 15000, lastActivity: "Gift, Oct 15", sources: ["GCash export", "Website form"] },
  { id: "c4", name: "Liza Mendoza", email: "liza.mendoza@gmail.com", phone: "0906 555 0128", city: "Pasig", lifecycle: "Donor", segment: "Lapsed donors", owner: "Miguel Torres", givenYtd: 0, lastActivity: "Email opened, Oct 22", sources: ["Donor spreadsheet 2024", "info@ inbox"] },
  { id: "c5", name: "Carlo Bautista", email: "carlo.b@outlook.com", phone: "0945 555 0136", city: "Marikina", lifecycle: "Volunteer", segment: "Volunteers", owner: "Miguel Torres", givenYtd: 0, lastActivity: "Form, Oct 20", sources: ["Volunteer form"] },
  { id: "c6", name: "Grace Navarro", email: "grace.navarro@gmail.com", phone: "0919 555 0105", city: "Taguig", lifecycle: "Monthly partner", segment: "Monthly partners", owner: "Miguel Torres", givenYtd: 12000, lastActivity: "Gift, Oct 15", sources: ["Card processor", "info@ inbox"] },
  { id: "c7", name: "Pastor Jun Ramos", email: "jun@newlifemandaluyong.org", phone: "0917 555 0161", city: "Mandaluyong", lifecycle: "Donor", segment: "Church partners", owner: "Tess Villanueva", givenYtd: 120000, lastActivity: "Call, Oct 24", sources: ["Donor spreadsheet 2024", "Founder's Gmail", "info@ inbox"] },
  { id: "c8", name: "Mark Santos", email: "marksantos@gmail.com", phone: "0995 555 0177", city: "Parañaque", lifecycle: "Subscriber", segment: "New subscribers", owner: "Miguel Torres", givenYtd: 0, lastActivity: "Form, Oct 26", sources: ["Website form"] },
  { id: "c9", name: "Rina Castillo", email: "rina.castillo@gmail.com", phone: "0928 555 0187", city: "Las Piñas", lifecycle: "Donor", segment: "Lapsed donors", owner: "Miguel Torres", givenYtd: 0, lastActivity: "Gift, Dec 2025", sources: ["Donor spreadsheet 2024"] },
  { id: "c10", name: "Paolo Garcia", email: "paolo@garciatrading.ph", phone: "0917 555 0119", city: "Mandaluyong", lifecycle: "Donor", segment: "Major donors", owner: "Tess Villanueva", givenYtd: 75000, lastActivity: "Meeting, Oct 9", sources: ["Tess's Outlook", "Event sign-up sheet"] },
];

const ACTIVITIES: Activity[] = [
  { id: "a1", contactId: "c2", kind: "Email", text: "Opened: Proposal for 2027 scholarships", date: "Oct 28" },
  { id: "a2", contactId: "c1", kind: "Meeting", text: "Site visit to the Tondo learning center", date: "Oct 27" },
  { id: "a3", contactId: "c8", kind: "Form", text: "Signed up for the newsletter on hopeph.org", date: "Oct 26" },
  { id: "a4", contactId: "c7", kind: "Call", text: "Confirmed church will match Christmas feeding gifts", date: "Oct 24" },
  { id: "a5", contactId: "c4", kind: "Email", text: "Opened: We miss you", date: "Oct 22" },
  { id: "a6", contactId: "c1", kind: "Email", text: "Opened: October field report", date: "Oct 21" },
  { id: "a7", contactId: "c5", kind: "Form", text: "Signed up: Nov 15 outreach in Payatas", date: "Oct 20" },
  { id: "a8", contactId: "c3", kind: "Gift", text: "₱1,500 monthly gift · GCash", date: "Oct 15" },
  { id: "a9", contactId: "c6", kind: "Gift", text: "₱1,200 monthly gift · Card", date: "Oct 15" },
  { id: "a10", contactId: "c2", kind: "Meeting", text: "Lunch in Greenhills, discussed 2027 pledge", date: "Oct 14" },
  { id: "a11", contactId: "c10", kind: "Meeting", text: "Coffee in Ortigas, interested in typhoon relief", date: "Oct 9" },
  { id: "a12", contactId: "c1", kind: "Call", text: "Thank-you call after September gift", date: "Oct 2" },
  { id: "a13", contactId: "c1", kind: "Gift", text: "₱100,000 to scholarship fund · Bank transfer", date: "Sep 30" },
  { id: "a14", contactId: "c9", kind: "Gift", text: "₱5,000 to Christmas appeal · GCash", date: "Dec 2025" },
];

const DEALS: Deal[] = [
  { id: "d1", name: "2027 scholarship fund", contactId: "c2", amount: 1200000, stage: "Asked", close: "Dec 15", purpose: "Scholarships for 40 students" },
  { id: "d2", name: "Learning center roof", contactId: "c1", amount: 350000, stage: "Cultivating", close: "Jan 30", purpose: "Tondo learning center repairs" },
  { id: "d3", name: "Christmas feeding program", contactId: "c7", amount: 180000, stage: "Pledged", close: "Nov 30", purpose: "Meals for 600 children" },
  { id: "d4", name: "Typhoon relief match", contactId: "c10", amount: 150000, stage: "Prospect", close: "Feb 28", purpose: "Relief packs, matched 1:1" },
  { id: "d5", name: "Clinic equipment", contactId: "c6", amount: 90000, stage: "Prospect", close: "Mar 15", purpose: "Payatas health clinic" },
  { id: "d6", name: "Mobile library van", contactId: "c2", amount: 600000, stage: "Cultivating", close: "Mar 31", purpose: "Books for six barangays" },
  { id: "d7", name: "September scholarship gift", contactId: "c1", amount: 100000, stage: "Given", close: "Sep 30", purpose: "Scholarships" },
];

const CAMPAIGNS: Campaign[] = [
  { id: "k1", name: "October field report", segment: "Monthly partners", date: "Oct 21", status: "Sent", subject: "Maria read her first book this month", sent: 612, open: 58, click: 14, raised: 86500, test: { a: "Your October field report", b: "Maria read her first book this month", aOpen: 44, bOpen: 61 } },
  { id: "k2", name: "We miss you", segment: "Lapsed donors", date: "Oct 22", status: "Sent", subject: "{first name}, 12 scholars are waiting", sent: 1430, open: 37, click: 6, raised: 64000, test: { a: "It has been a while", b: "{first name}, 12 scholars are waiting", aOpen: 29, bOpen: 39 } },
  { id: "k3", name: "Volunteer call: Payatas outreach", segment: "Volunteers", date: "Oct 14", status: "Sent", subject: "We need 30 hands on Nov 15", sent: 386, open: 64, click: 22, raised: 0 },
  { id: "k4", name: "Year-end appeal: partners", segment: "Monthly partners", date: "Nov 18", status: "Scheduled", subject: "One more month of school for Jomar", sent: 0, open: 0, click: 0, raised: 0 },
  { id: "k5", name: "Year-end appeal: churches", segment: "Church partners", date: "Nov 20", status: "Draft", subject: "Will your church sponsor a classroom?", sent: 0, open: 0, click: 0, raised: 0 },
];

const FLOWS: Flow[] = [
  { id: "f1", name: "Year-end appeal follow-up", trigger: "Opened the year-end appeal, no gift after 5 days", steps: ["Wait 5 days", "Send reminder email", "No gift: call task for owner", "Gift: thank-you email"], on: true, enrolled: 214 },
  { id: "f2", name: "New donor welcome", trigger: "First gift received", steps: ["Send receipt", "Welcome email from the director", "Wait 14 days", "Send a scholar's story"], on: true, enrolled: 96 },
  { id: "f3", name: "Lapsed donor win-back", trigger: "No gift in 12 months", steps: ["Move to Lapsed donors", "Send We miss you", "Wait 10 days", "Create call task"], on: true, enrolled: 1430 },
  { id: "f4", name: "Expiring card", trigger: "Monthly partner's card expires in 30 days", steps: ["Email update link", "Wait 7 days", "Send SMS reminder", "Task for owner"], on: false, enrolled: 18 },
];

const GIVING = [612000, 548000, 701000, 655000, 690000, 1240000, 742000, 788000, 905000, 931000];
const NEW_DONORS = [42, 38, 51, 47, 55, 49, 61, 58, 72, 84];
const ICON: Record<ActivityKind, LucideIcon> = { Email: Mail, Gift: HandCoins, Call: Phone, Meeting: CalendarDays, Form: FileText };
const NEXT: Record<Stage, string> = {
  Prospect: "Research giving history and ask for an introduction",
  Cultivating: "Invite to a site visit before making the ask",
  Asked: "Follow up on the proposal before the close date",
  Pledged: "Send the pledge letter and payment schedule",
  Given: "Send an impact report in 90 days",
};

type ContactFilter = "all" | "donors" | "major" | "volunteers" | "lapsed";
const inFilter = (c: Contact, f: ContactFilter) =>
  f === "all" ||
  (f === "donors" && ["Donor", "Monthly partner", "Major donor"].includes(c.lifecycle)) ||
  (f === "major" && c.lifecycle === "Major donor") ||
  (f === "volunteers" && c.lifecycle === "Volunteer") ||
  (f === "lapsed" && c.segment === "Lapsed donors");
const lifeTone = (c: Contact) => (c.segment === "Lapsed donors" ? "bad" : c.lifecycle === "Major donor" || c.lifecycle === "Monthly partner" ? "good" : c.lifecycle === "Donor" ? "warn" : "muted");

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn("relative w-9 h-5 rounded-full border transition-colors cursor-pointer shrink-0", on ? "bg-gold border-gold" : "bg-night border-rule")}>
      <motion.span className={cn("absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full", on ? "bg-paper" : "bg-mist")} animate={{ x: on ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 34 }} />
    </button>
  );
}

export function HubSpotPrototype() {
  const app = useProtoApp("dashboard");
  const [contacts, setContacts] = useState(CONTACTS);
  const [acts, setActs] = useState(ACTIVITIES);
  const [deals, setDeals] = useState(DEALS);
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [flows, setFlows] = useState(FLOWS);
  const [extra, setExtra] = useState(0);

  const [chart, setChart] = useState<"giving" | "donors">("giving");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [campOpen, setCampOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", segment: "New subscribers" as Segment });
  const [call, setCall] = useState({ outcome: "Connected", notes: "", follow: "In 1 week" });
  const [camp, setCamp] = useState({ name: "", segment: "Lapsed donors" as Segment, date: "2026-11-25", subject: "" });

  const contact = (id?: string) => contacts.find((c) => c.id === id);
  const sentCampaigns = campaigns.filter((c) => c.status === "Sent" && c.open > 0);
  const avgOpen = Math.round(sentCampaigns.reduce((s, c) => s + c.open, 0) / Math.max(1, sentCampaigns.length));
  const openPipeline = deals.filter((d) => d.stage !== "Given").reduce((s, d) => s + d.amount, 0);
  const visible = contacts.filter((c) => inFilter(c, filter) && `${c.name} ${c.email} ${c.city} ${c.segment}`.toLowerCase().includes(query.toLowerCase()));

  const logActivity = (contactId: string, kind: ActivityKind, text: string) => {
    setActs((list) => [{ id: nextId("a"), contactId, kind, text, date: "Today" }, ...list]);
    setContacts((list) => list.map((c) => (c.id === contactId ? { ...c, lastActivity: `${kind}, today` } : c)));
  };

  const setStage = (deal: Deal, stage: Stage) => {
    if (deal.stage === stage) return;
    setDeals((list) => list.map((d) => (d.id === deal.id ? { ...d, stage } : d)));
    const delta = stage === "Given" ? deal.amount : deal.stage === "Given" ? -deal.amount : 0;
    if (delta) {
      setExtra((x) => x + delta);
      setContacts((list) => list.map((c) => (c.id === deal.contactId ? { ...c, givenYtd: c.givenYtd + delta } : c)));
    }
    if (stage === "Given") {
      logActivity(deal.contactId, "Gift", `${peso(deal.amount)} received · ${deal.name}`);
      app.notify(`${deal.name} marked given. Thank-you email queued.`);
    } else app.notify(`${deal.name} moved to ${stage}`);
  };

  const addContact = () => {
    const email = draft.email.trim().toLowerCase();
    const existing = contacts.find((c) => c.email.toLowerCase() === email);
    setAddOpen(false);
    setDraft({ name: "", email: "", segment: "New subscribers" });
    if (existing) {
      app.open("contact", existing.id, existing.name);
      app.notify(`${email} is already on file. Opened ${existing.name} instead of making a duplicate.`);
      return;
    }
    const id = nextId("c");
    setContacts((list) => [{ id, name: draft.name.trim(), email, phone: "Not set", city: "Metro Manila", lifecycle: seg(draft.segment).stage, segment: draft.segment, owner: "Tess Villanueva", givenYtd: 0, lastActivity: "Created, today", sources: ["Added by Tess"] }, ...list]);
    app.notify(`${draft.name.trim()} added. Checked against ${(4802 + contacts.length).toLocaleString()} contacts, no duplicate.`);
  };

  const logCall = (c: Contact) => {
    logActivity(c.id, "Call", `${call.outcome}${call.notes.trim() ? `: ${call.notes.trim()}` : ""}`);
    setCallOpen(false);
    setCall({ outcome: "Connected", notes: "", follow: "In 1 week" });
    app.notify(`Call logged on ${c.name.split(" ")[0]}'s record${call.follow !== "None" ? `. Follow-up task set ${call.follow.toLowerCase()}.` : ""}`);
  };

  const addCampaign = () => {
    const date = fmtDate(camp.date);
    setCampaigns((list) => [{ id: nextId("k"), name: camp.name.trim(), segment: camp.segment, date, status: "Scheduled", subject: camp.subject.trim() || camp.name.trim(), sent: 0, open: 0, click: 0, raised: 0 }, ...list]);
    setCampOpen(false);
    setCamp({ name: "", segment: "Lapsed donors", date: "2026-11-25", subject: "" });
    app.notify(`${camp.name.trim()} scheduled for ${date} to ${seg(camp.segment).size.toLocaleString()} contacts in ${camp.segment}`);
  };

  const updateCampaign = (id: string, patch: Partial<Campaign>) => setCampaigns((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "pipeline", label: "Pipeline", icon: Columns3, badge: deals.filter((d) => d.stage !== "Given").length },
    { id: "campaigns", label: "Campaigns", icon: Mail, badge: campaigns.filter((c) => c.status !== "Sent").length },
    { id: "automations", label: "Automations", icon: Workflow },
  ];

  const c = contact(app.id);
  const deal = deals.find((d) => d.id === app.id);
  const k = campaigns.find((x) => x.id === app.id);

  return (
    <ProtoApp app={app} name="HubSpot setup · Hope Philippines Foundation" user="Tess Villanueva" nav={nav} alerts={deals.filter((d) => d.stage === "Asked").length + 2}>
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader
            title="Dashboard"
            subtitle="Thursday, October 29 · Zion's illustration of a HubSpot setup"
            action={<SmallButton onClick={() => app.notify("Board link copied. The numbers stay live, no export needed.")}><Share2 size={12} /> Share with board</SmallButton>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Giving, year to date" value={peso(GIVING.reduce((s, n) => s + n, 0) + extra)} sub="+14% vs 2025" tone="good" />
            <Stat label="Donor retention" value="71%" sub="Up from 58% before setup" tone="good" />
            <Stat label="Active recurring donors" value={seg("Monthly partners").size.toLocaleString()} sub="+38 this quarter" />
            <Stat label="Average open rate" value={`${avgOpen}%`} sub="Segmented sends" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3">
            <Panel title="2026 by month" action={<Segmented id="hs-chart" value={chart} onChange={setChart} options={[{ id: "giving", label: "Giving" }, { id: "donors", label: "New donors" }]} />}>
              <Bars
                key={chart}
                format={chart === "giving" ? (n) => `${Math.round(n / 1000)}k` : String}
                data={(chart === "giving" ? GIVING.map((v, i) => (i === GIVING.length - 1 ? v + extra : v)) : NEW_DONORS).map((value, i) => ({ label: MONTHS[i], value }))}
              />
            </Panel>
            <Panel title="Campaign performance">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {campaigns.filter((x) => x.status === "Sent").map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => app.open("campaign", x.id, x.name)} className="w-full text-left py-2 cursor-pointer group">
                      <span className="flex justify-between gap-2 text-[0.8rem]">
                        <span className="text-ink group-hover:text-gold-bright truncate">{x.name}</span>
                        <span className="font-mono text-[0.7rem] text-graphite shrink-0">{x.open}% open</span>
                      </span>
                      <Meter value={x.open} max={100} className="mt-1.5" />
                      <span className="block text-[0.68rem] text-mist mt-1">{x.segment} · {x.raised ? `${peso(x.raised)} raised` : `${x.click}% clicked`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Board report, October" className="lg:col-span-2" action={<Status tone="good">Live · synced 2 min ago</Status>}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[0.8rem]">
                {[
                  ["Raised in October", peso(GIVING[9] + extra)],
                  ["Open pipeline", peso(openPipeline)],
                  ["Proposals out", String(deals.filter((d) => d.stage === "Asked").length)],
                  ["New donors", String(NEW_DONORS[9])],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-mist text-[0.72rem]">{label}</div>
                    <div className="font-mono text-ink mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "contacts" && (
        <>
          <ScreenHeader
            title="Contacts"
            subtitle={`${(4802 + contacts.length).toLocaleString()} contacts · 1,284 duplicates merged at import`}
            action={<PrimaryButton onClick={() => setAddOpen(true)}><UserPlus size={14} /> Add contact</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
              <Search size={14} className="text-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, city, segment" aria-label="Search contacts" className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
            </label>
            <Segmented id="hs-contacts" value={filter} onChange={setFilter} options={[{ id: "all", label: "All" }, { id: "donors", label: "Donors" }, { id: "major", label: "Major" }, { id: "volunteers", label: "Volunteers" }, { id: "lapsed", label: "Lapsed" }]} />
          </div>
          <Table
            rows={visible}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("contact", r.id, r.name)}
            empty="No contacts match."
            columns={[
              { key: "name", label: "Name", render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={24} /><span className="min-w-0"><span className="block text-ink truncate">{r.name}</span><span className="block text-[0.68rem] text-mist truncate">{r.email}</span></span></span> },
              { key: "stage", label: "Lifecycle stage", render: (r) => <Status tone={lifeTone(r)}>{r.segment === "Lapsed donors" ? "Lapsed donor" : r.lifecycle}</Status> },
              { key: "segment", label: "Segment", render: (r) => r.segment, hideOnMobile: true },
              { key: "last", label: "Last activity", render: (r) => r.lastActivity, hideOnMobile: true },
            ]}
          />
        </>
      )}

      {app.screen === "contact" && c && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Avatar name={c.name} size={48} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-[1.5rem] leading-tight font-semibold text-ink">{c.name}</h4>
              <span className="flex flex-wrap items-center gap-x-2">
                <Status tone={lifeTone(c)}>{c.segment === "Lapsed donors" ? "Lapsed donor" : c.lifecycle}</Status>
                <span className="text-[0.72rem] text-mist">{c.email}</span>
              </span>
            </div>
            <SmallButton onClick={() => setCallOpen(true)}><Phone size={12} /> Log a call</SmallButton>
            <SmallButton
              onClick={() => {
                logActivity(c.id, "Email", "Sent: Personal note from Tess");
                app.notify(`Email sent to ${c.email} and logged on the timeline`);
              }}
            >
              <Mail size={12} /> Email
            </SmallButton>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Properties">
              <KeyValues
                items={[
                  ["Email", c.email],
                  ["Phone", c.phone],
                  ["City", c.city],
                  ["Owner", c.owner],
                  ["Given this year", <span key="g" className="font-mono">{peso(c.givenYtd)}</span>],
                  [
                    "Segment",
                    <select
                      key="s"
                      aria-label="Segment"
                      value={c.segment}
                      onChange={(e) => {
                        const s = e.target.value as Segment;
                        setContacts((list) => list.map((x) => (x.id === c.id ? { ...x, segment: s, lifecycle: seg(s).stage } : x)));
                        app.notify(`${c.name.split(" ")[0]} moved to ${s}. Campaigns and workflows follow.`);
                      }}
                      className="h-7 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer"
                    >
                      {SEGMENTS.map((s) => <option key={s.id}>{s.id}</option>)}
                    </select>,
                  ],
                ]}
              />
              <p className="mt-3 pt-3 border-t border-rule-soft text-[0.7rem] text-mist">One record, merged from {c.sources.join(", ")}.</p>
            </Panel>
            <Panel title="Deals">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {deals.filter((d) => d.contactId === c.id).map((d) => (
                  <li key={d.id}>
                    <button type="button" onClick={() => app.open("deal", d.id, d.name)} className="w-full flex items-center justify-between gap-2 py-2 text-left cursor-pointer group">
                      <span className="min-w-0">
                        <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{d.name}</span>
                        <span className="block text-[0.68rem] text-mist">{d.stage} · close {d.close}</span>
                      </span>
                      <span className="font-mono text-[0.75rem] text-ink-soft">{peso(d.amount)}</span>
                    </button>
                  </li>
                ))}
                {deals.every((d) => d.contactId !== c.id) && <li className="py-2 text-[0.8rem] text-graphite">No deals yet.</li>}
              </ul>
            </Panel>
            <Panel title="Activity" className="lg:col-span-2">
              <ol className="relative flex flex-col gap-3 before:absolute before:left-[13px] before:top-1 before:bottom-1 before:w-px before:bg-rule">
                {acts.filter((a) => a.contactId === c.id).map((a) => {
                  const Icon = ICON[a.kind];
                  return (
                    <li key={a.id} className="relative flex gap-3">
                      <span className="relative w-7 h-7 rounded-full bg-raised border border-rule flex items-center justify-center text-gold-bright shrink-0"><Icon size={13} /></span>
                      <span className="flex-1 min-w-0 pt-0.5">
                        <span className="block text-[0.8rem] text-ink">{a.text}</span>
                        <span className="block text-[0.68rem] text-mist">{a.kind} · {a.date}</span>
                      </span>
                    </li>
                  );
                })}
                {acts.every((a) => a.contactId !== c.id) && <li className="pl-10 text-[0.8rem] text-graphite">No activity yet.</li>}
              </ol>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "pipeline" && (
        <>
          <ScreenHeader title="Major gifts" subtitle={`${peso(openPipeline)} open across ${deals.filter((d) => d.stage !== "Given").length} deals`} />
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="grid grid-cols-5 gap-2 min-w-[46rem]">
              {STAGES.map((stage, si) => {
                const inStage = deals.filter((d) => d.stage === stage);
                return (
                  <div key={stage} className="bg-sheet border border-rule rounded-lg p-2 min-h-[20rem]">
                    <div className="flex justify-between items-baseline px-1 mb-2">
                      <span className="text-[0.75rem] font-semibold text-ink">{stage}</span>
                      <span className="font-mono text-[0.62rem] text-mist">{peso(inStage.reduce((s, d) => s + d.amount, 0))}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {inStage.map((d) => (
                        <div key={d.id} className="bg-raised border border-rule rounded-md p-2 hover:border-gold/60 transition-colors">
                          <button type="button" onClick={() => app.open("deal", d.id, d.name)} className="block w-full text-left cursor-pointer">
                            <span className="block text-[0.74rem] font-medium text-ink leading-tight">{d.name}</span>
                            <span className="block text-[0.65rem] text-mist mt-0.5">{contact(d.contactId)?.name}</span>
                          </button>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="font-mono text-[0.62rem] text-graphite">{peso(d.amount)}</span>
                            {si < STAGES.length - 1 && (
                              <button type="button" onClick={() => setStage(d, STAGES[si + 1])} aria-label={`Move ${d.name} to ${STAGES[si + 1]}`} className="flex items-center text-[0.62rem] text-gold-bright hover:text-ink cursor-pointer">
                                Move <ChevronRight size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {app.screen === "deal" && deal && (
        <>
          <ScreenHeader title={deal.name} subtitle={`${peso(deal.amount)} · expected ${deal.close}`} />
          <Panel title="Stage" className="mb-3">
            <div className="grid grid-cols-5 gap-1">
              {STAGES.map((s, i) => {
                const reached = STAGES.indexOf(deal.stage) >= i;
                return (
                  <button key={s} type="button" aria-pressed={deal.stage === s} onClick={() => setStage(deal, s)} className="text-left cursor-pointer group">
                    <span className={cn("block h-1.5 rounded-full transition-colors", reached ? "bg-gold" : "bg-rule group-hover:bg-gold/40")} />
                    <span className={cn("block mt-1.5 text-[0.7rem]", deal.stage === s ? "text-gold-bright font-semibold" : "text-graphite")}>{s}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Details">
              <KeyValues
                items={[
                  ["Donor", <button key="d" type="button" onClick={() => app.open("contact", deal.contactId, contact(deal.contactId)?.name)} className="text-gold-bright hover:text-ink cursor-pointer">{contact(deal.contactId)?.name}</button>],
                  ["Amount", <span key="a" className="font-mono">{peso(deal.amount)}</span>],
                  ["Purpose", deal.purpose],
                  ["Expected close", deal.close],
                  ["Owner", contact(deal.contactId)?.owner ?? "Tess Villanueva"],
                ]}
              />
            </Panel>
            <Panel title="Next step">
              <p className="text-[0.8rem] text-ink-soft mb-3">{NEXT[deal.stage]}</p>
              <SmallButton onClick={() => app.notify(`Task added for ${contact(deal.contactId)?.owner.split(" ")[0]}, due Monday`)}><Plus size={12} /> Create task</SmallButton>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "campaigns" && (
        <>
          <ScreenHeader title="Campaigns" subtitle="Each send goes to one segment, not the whole list" action={<PrimaryButton onClick={() => setCampOpen(true)}><Plus size={14} /> New campaign</PrimaryButton>} />
          <Table
            rows={campaigns}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("campaign", r.id, r.name)}
            columns={[
              { key: "name", label: "Campaign", render: (r) => <span className="text-ink">{r.name}</span> },
              { key: "segment", label: "Segment", render: (r) => r.segment, hideOnMobile: true },
              { key: "status", label: "Status", render: (r) => <Status tone={r.status === "Sent" ? "good" : r.status === "Scheduled" ? "warn" : "muted"}>{r.status} · {r.date}</Status> },
              { key: "sent", label: "Sent", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono">{r.sent ? r.sent.toLocaleString() : "0"}</span> },
              { key: "open", label: "Open", align: "right", render: (r) => (r.status === "Sent" ? <span className="font-mono text-ink">{r.open}%</span> : <span className="text-mist">Not yet</span>) },
              { key: "click", label: "Click", align: "right", hideOnMobile: true, render: (r) => (r.status === "Sent" ? <span className="font-mono">{r.click}%</span> : <span className="text-mist">Not yet</span>) },
            ]}
          />
        </>
      )}

      {app.screen === "campaign" && k && (
        <>
          <ScreenHeader
            title={k.name}
            subtitle={`${k.segment} · ${k.status === "Sent" ? "Sent" : k.status === "Scheduled" ? "Scheduled for" : "Draft for"} ${k.date}`}
            action={
              k.status !== "Sent" && (
                <>
                  <SmallButton onClick={() => app.notify("Test sent to tess@hopeph.org")}>Send test</SmallButton>
                  {k.status === "Draft" ? (
                    <PrimaryButton onClick={() => { updateCampaign(k.id, { status: "Scheduled" }); app.notify(`${k.name} scheduled for ${k.date}`); }}>Schedule</PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={() => { updateCampaign(k.id, { status: "Sent", date: "Oct 29", sent: seg(k.segment).size }); app.notify(`Sending to ${seg(k.segment).size.toLocaleString()} contacts. Results update live.`); }}><Send size={13} /> Send now</PrimaryButton>
                  )}
                </>
              )
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Recipients" value={(k.sent || seg(k.segment).size).toLocaleString()} sub={k.sent ? "Delivered" : "In segment today"} />
            <Stat label="Opened" value={`${k.open}%`} sub={k.open > 40 ? "Above 40% list average" : undefined} tone="good" />
            <Stat label="Clicked" value={`${k.click}%`} />
            <Stat label="Raised" value={peso(k.raised)} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Audience">
              <KeyValues items={[["Segment", k.segment], ["Rule", seg(k.segment).rule], ["Contacts", seg(k.segment).size.toLocaleString()], ["Subject", k.subject]]} />
              <p className="mt-3 text-[0.7rem] text-mist">Other segments get their own version of this appeal.</p>
            </Panel>
            <Panel title="Subject line test">
              {k.test ? (
                <div className="flex flex-col gap-3">
                  {(["a", "b"] as const).map((v) => {
                    const rate = v === "a" ? k.test!.aOpen : k.test!.bOpen;
                    const win = rate === Math.max(k.test!.aOpen, k.test!.bOpen);
                    return (
                      <div key={v}>
                        <div className="flex justify-between gap-2 text-[0.78rem]">
                          <span className="text-ink-soft min-w-0"><span className="font-mono text-mist mr-1.5">{v.toUpperCase()}</span>{v === "a" ? k.test!.a : k.test!.b}</span>
                          <span className="font-mono text-ink shrink-0">{rate}%</span>
                        </div>
                        <Meter value={rate} max={100} className="mt-1.5" />
                        {win && <div className="mt-1.5"><Status tone="good">Winner · sent to the remaining 80%</Status></div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[0.8rem] text-graphite">No test on this send. 20% of the segment gets each version when a second subject line is added.</p>
              )}
            </Panel>
          </div>
        </>
      )}

      {app.screen === "automations" && (
        <>
          <ScreenHeader title="Automations" subtitle={`${flows.filter((f) => f.on).length} of ${flows.length} running · ${flows.filter((f) => f.on).reduce((s, f) => s + f.enrolled, 0).toLocaleString()} contacts enrolled`} />
          <div className="flex flex-col gap-2.5">
            {flows.map((f) => (
              <Panel
                key={f.id}
                title={f.name}
                action={
                  <span className="flex items-center gap-2.5">
                    <Status tone={f.on ? "good" : "muted"}>{f.on ? "On" : "Paused"}</Status>
                    <Toggle
                      on={f.on}
                      label={`${f.name} on or off`}
                      onChange={() => {
                        setFlows((list) => list.map((x) => (x.id === f.id ? { ...x, on: !x.on } : x)));
                        app.notify(`${f.name} ${f.on ? "paused. Enrolled contacts finish their current step." : "turned on"}`);
                      }}
                    />
                  </span>
                }
              >
                <p className="text-[0.75rem] text-graphite mb-2.5">When: {f.trigger} · {f.enrolled.toLocaleString()} enrolled</p>
                <ol className="flex flex-wrap items-center gap-1.5">
                  {f.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-1.5">
                      {i > 0 && <ChevronRight size={12} className="text-mist" aria-hidden />}
                      <span className={cn("px-2 py-1 rounded-md border text-[0.72rem]", f.on ? "border-rule bg-raised text-ink-soft" : "border-rule-soft text-mist")}>
                        <span className="font-mono text-gold-bright mr-1">{i + 1}</span>
                        {s}
                      </span>
                    </li>
                  ))}
                </ol>
              </Panel>
            ))}
          </div>
        </>
      )}

      <ProtoModal open={addOpen} title="Add contact" onClose={() => setAddOpen(false)} footer={<PrimaryButton onClick={addContact} disabled={!draft.name.trim() || !draft.email.includes("@")}>Add contact</PrimaryButton>}>
        <Field label="Full name">
          <input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Maria Santos" />
        </Field>
        <Field label="Email">
          <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClass} placeholder="maria@gmail.com" />
        </Field>
        <Field label="Segment">
          <select value={draft.segment} onChange={(e) => setDraft({ ...draft, segment: e.target.value as Segment })} className={inputClass}>
            {SEGMENTS.map((s) => <option key={s.id}>{s.id}</option>)}
          </select>
        </Field>
        <p className="text-[0.7rem] text-mist">Emails already on file open the existing record.</p>
      </ProtoModal>

      <ProtoModal open={callOpen && !!c} title={`Log a call${c ? ` with ${c.name}` : ""}`} onClose={() => setCallOpen(false)} footer={c && <PrimaryButton onClick={() => logCall(c)}>Save to timeline</PrimaryButton>}>
        <Field label="Outcome">
          <select value={call.outcome} onChange={(e) => setCall({ ...call, outcome: e.target.value })} className={inputClass}>
            <option>Connected</option>
            <option>Left voicemail</option>
            <option>No answer</option>
          </select>
        </Field>
        <Field label="Notes">
          <textarea value={call.notes} onChange={(e) => setCall({ ...call, notes: e.target.value })} rows={3} className={cn(inputClass, "h-auto py-2 resize-none")} placeholder="Asked about the 2027 scholars list" />
        </Field>
        <Field label="Follow-up task">
          <select value={call.follow} onChange={(e) => setCall({ ...call, follow: e.target.value })} className={inputClass}>
            <option>None</option>
            <option>In 1 week</option>
            <option>In 2 weeks</option>
          </select>
        </Field>
      </ProtoModal>

      <ProtoModal open={campOpen} title="New campaign" onClose={() => setCampOpen(false)} footer={<PrimaryButton onClick={addCampaign} disabled={!camp.name.trim() || !camp.date}>Schedule campaign</PrimaryButton>}>
        <Field label="Campaign name">
          <input autoFocus value={camp.name} onChange={(e) => setCamp({ ...camp, name: e.target.value })} className={inputClass} placeholder="Year-end appeal: lapsed donors" />
        </Field>
        <Field label="Segment">
          <select value={camp.segment} onChange={(e) => setCamp({ ...camp, segment: e.target.value as Segment })} className={inputClass}>
            {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.id} ({s.size.toLocaleString()})</option>)}
          </select>
        </Field>
        <Field label="Subject line">
          <input value={camp.subject} onChange={(e) => setCamp({ ...camp, subject: e.target.value })} className={inputClass} placeholder="One more month of school for Jomar" />
        </Field>
        <Field label="Send date">
          <input type="date" value={camp.date} onChange={(e) => setCamp({ ...camp, date: e.target.value })} className={inputClass} />
        </Field>
      </ProtoModal>
    </ProtoApp>
  );
}
