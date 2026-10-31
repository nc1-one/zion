"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock, Columns3, FileText, GitBranch, HandCoins, Inbox, LayoutDashboard, ListChecks, ListFilter, Mail, MapPin, Megaphone, Pencil, Phone, Plus, Receipt, Search, Send, Share2, Smartphone, StickyNote, UserPlus, Users, Workflow, X, type LucideIcon } from "lucide-react";
import { ProtoHeading, Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, Toggle, inputClass, textareaClass, useProtoApp, type ProtoAlert, type ProtoSearchItem } from "./ProtoKit";
import { cn } from "@/lib/utils";

// Zion's illustration of a HubSpot CRM set up for an NGO. Sample data only.

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return m && d ? `${MONTHS[m - 1]} ${d}` : iso;
};
const TODAY = "2026-10-29";
const DUE_OPTIONS: [string, string][] = [[TODAY, "Today"], ["2026-10-30", "Tomorrow"], ["2026-11-02", "Monday, Nov 2"], ["2026-11-06", "Friday, Nov 6"]];
const dueLabel = (iso: string) => (iso === TODAY ? "Today" : iso === "2026-10-30" ? "Tomorrow" : fmtDate(iso));
const ME = "Tess Villanueva";
const OWNERS = [ME, "Miguel Torres", "Bea Santiago", "Rico Fernandez"];
const first = (name: string) => name.replace(/^Pastor /, "").split(" ")[0];
const HIDDEN = 4784; // workspace contacts beyond the sample rows shown here
const METRO = ["Makati", "San Juan", "Quezon City", "Pasig", "Marikina", "Taguig", "Mandaluyong", "Parañaque", "Las Piñas", "Manila"];

type Lifecycle = "Subscriber" | "Volunteer" | "Donor" | "Monthly partner" | "Major donor" | "Lapsed donor";
const LIFECYCLES: Lifecycle[] = ["Subscriber", "Volunteer", "Donor", "Monthly partner", "Major donor", "Lapsed donor"];
type Method = "GCash" | "Maya" | "Bank transfer" | "Card" | "None";
type CompanyType = "Church" | "Corporate partner" | "Foundation";
type ActivityKind = "Email" | "Gift" | "Call" | "Meeting" | "Form" | "Note";
const STAGES = ["Prospect", "Cultivating", "Asked", "Pledged", "Given"] as const;
type Stage = (typeof STAGES)[number];
type TaskKind = "Call" | "Email" | "To-do";
type StepKind = "delay" | "email" | "branch" | "task" | "property" | "sms";
type TicketStatus = "New" | "In progress" | "Waiting on donor" | "Closed";
const TICKET_STATUSES: TicketStatus[] = ["New", "In progress", "Waiting on donor", "Closed"];
type Category = "Receipt request" | "Address change" | "Gift question" | "Recurring change" | "Volunteer question";

interface Contact { id: string; name: string; email: string; phone: string; city: string; address: string; lifecycle: Lifecycle; companyId?: string; role?: string; owner: string; givenYtd: number; givenLife: number; method: Method; joined: string; engaged: boolean; lastActivity: string; sources: string[] }
interface Company { id: string; name: string; type: CompanyType; city: string; domain: string; owner: string; since: string; givenYtd: number; note: string }
interface Activity { id: string; contactId: string; kind: ActivityKind; text: string; date: string }
interface Deal { id: string; name: string; contactId: string; companyId?: string; amount: number; stage: Stage; close: string; purpose: string; owner: string; history: string[] }
interface Task { id: string; title: string; kind: TaskKind; contactId?: string; dealId?: string; due: string; owner: string; done: boolean }
interface Meeting { id: string; title: string; contactId: string; when: string; where: string; done: boolean }
interface Condition { id: string; label: string; pool: number; test: (c: Contact, type?: CompanyType) => boolean }
interface DonorList { id: string; name: string; kind: "Active" | "Static"; rules: string[]; members: string[]; hidden: number; owner: string }
interface Campaign { id: string; name: string; listId: string; date: string; time: string; status: "Sent" | "Scheduled" | "Draft"; subject: string; sent: number; open: number; click: number; raised: number; cost: number; test?: { a: string; b: string; aOpen: number; bOpen: number } }
interface WebForm { id: string; name: string; where: string; fields: string[]; views: number; base: number; listId?: string; flowId?: string; ticket?: boolean; notify: boolean }
interface Submission { id: string; formId: string; name: string; detail: string; date: string; contactId?: string }
interface Step { kind: StepKind; text: string; now: number; yes?: string; no?: string }
interface Flow { id: string; name: string; trigger: string; steps: Step[]; on: boolean; enrolled: number; goal: string; goalRate: number }
interface Message { from: "donor" | "team"; author: string; text: string; when: string }
interface Ticket { id: string; subject: string; contactId: string; category: Category; channel: "Email" | "Web form" | "Chat" | "Phone"; status: TicketStatus; owner: string; opened: string; messages: Message[]; newAddress?: string }
interface Dupe { id: string; keepId: string; name: string; email: string; source: string; reason: string }

// Ids for records created in the prototype. Only called from event handlers.
let seq = 100;
const nextId = (prefix: string) => `${prefix}${++seq}`;

function patchIn<T extends { id: string }>(set: React.Dispatch<React.SetStateAction<T[]>>, id: string, patch: Partial<T>) { set((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x))); }

// ---- Sample data ---------------------------------------------------------------------

const COMPANIES: Company[] = [
  { id: "co1", name: "New Life Christian Fellowship", type: "Church", city: "Mandaluyong", domain: "newlifemandaluyong.org", owner: ME, since: "2019", givenYtd: 120000, note: "Matches Christmas feeding gifts every year." },
  { id: "co2", name: "Victory Hills Baptist Church", type: "Church", city: "Antipolo", domain: "victoryhills.ph", owner: "Rico Fernandez", since: "2021", givenYtd: 45000, note: "Youth group volunteers in Payatas each month." },
  { id: "co3", name: "Grace Community Church Cebu", type: "Church", city: "Cebu City", domain: "gracecebu.org", owner: "Rico Fernandez", since: "2022", givenYtd: 60000, note: "Missions Sunday offering goes to scholarships." },
  { id: "co4", name: "Cornerstone Church Davao", type: "Church", city: "Davao City", domain: "cornerstonedavao.org", owner: "Rico Fernandez", since: "2024", givenYtd: 25000, note: "Asked about a Mindanao learning center." },
  { id: "co5", name: "Lim Family Foundation", type: "Foundation", city: "San Juan", domain: "limfoundation.ph", owner: ME, since: "2018", givenYtd: 500000, note: "Funds scholarships. Board meets each March." },
  { id: "co6", name: "Pag-asa Educational Trust", type: "Foundation", city: "Makati", domain: "pagasatrust.org", owner: ME, since: "2023", givenYtd: 300000, note: "Grant cycle opens in January. Needs audited reports." },
  { id: "co7", name: "Garcia Trading Corp.", type: "Corporate partner", city: "Mandaluyong", domain: "garciatrading.ph", owner: ME, since: "2025", givenYtd: 75000, note: "Wants employee volunteer days." },
  { id: "co8", name: "Kalinga Savings Bank", type: "Corporate partner", city: "Pasig", domain: "kalingabank.ph", owner: "Rico Fernandez", since: "2020", givenYtd: 200000, note: "CSR budget is set every November." },
  { id: "co9", name: "Malinis Foods Inc.", type: "Corporate partner", city: "Makati", domain: "malinisfoods.com", owner: "Rico Fernandez", since: "2024", givenYtd: 90000, note: "Donates rice for the feeding program." },
  { id: "co10", name: "Lakbay Logistics", type: "Corporate partner", city: "Parañaque", domain: "lakbaylogistics.ph", owner: "Miguel Torres", since: "2025", givenYtd: 0, note: "Lends trucks for typhoon relief, in kind." },
];

const CONTACTS: Contact[] = [
  { id: "c1", name: "Ana Reyes", email: "ana.reyes@gmail.com", phone: "0917 555 0142", city: "Makati", address: "12 Jupiter St, Bel-Air, Makati", lifecycle: "Major donor", owner: ME, givenYtd: 250000, givenLife: 640000, method: "Bank transfer", joined: "2019-03-02", engaged: true, lastActivity: "Meeting, Oct 27", sources: ["Donor spreadsheet 2024", "info@ inbox", "Founder's Gmail"] },
  { id: "c2", name: "Ramon Lim", email: "ramon@limfoundation.ph", phone: "0918 555 0193", city: "San Juan", address: "45 Wilson St, Greenhills, San Juan", lifecycle: "Major donor", companyId: "co5", role: "Chair", owner: ME, givenYtd: 500000, givenLife: 2150000, method: "Bank transfer", joined: "2018-06-11", engaged: true, lastActivity: "Email opened, Oct 28", sources: ["Donor spreadsheet 2024", "Tess's Outlook"] },
  { id: "c3", name: "Joy Dela Cruz", email: "joydc@yahoo.com", phone: "0927 555 0110", city: "Quezon City", address: "8 Maginhawa St, Teachers Village, Quezon City", lifecycle: "Monthly partner", owner: "Miguel Torres", givenYtd: 15000, givenLife: 42000, method: "GCash", joined: "2024-01-20", engaged: true, lastActivity: "Gift, Oct 15", sources: ["GCash export", "Website form"] },
  { id: "c4", name: "Liza Mendoza", email: "liza.mendoza@gmail.com", phone: "0906 555 0128", city: "Taguig", address: "Unit 9C, McKinley Hill, Taguig", lifecycle: "Lapsed donor", owner: "Miguel Torres", givenYtd: 0, givenLife: 18000, method: "Card", joined: "2022-09-14", engaged: true, lastActivity: "Email opened, Oct 22", sources: ["Donor spreadsheet 2024", "info@ inbox"] },
  { id: "c5", name: "Carlo Bautista", email: "carlo.b@outlook.com", phone: "0945 555 0136", city: "Marikina", address: "3 Bayan-Bayanan Ave, Marikina", lifecycle: "Volunteer", owner: "Bea Santiago", givenYtd: 0, givenLife: 0, method: "None", joined: "2026-09-02", engaged: true, lastActivity: "Form, Oct 20", sources: ["Volunteer form"] },
  { id: "c6", name: "Grace Navarro", email: "grace.navarro@gmail.com", phone: "0919 555 0105", city: "Taguig", address: "Unit 14B, 5th Ave, BGC, Taguig", lifecycle: "Monthly partner", owner: "Miguel Torres", givenYtd: 12000, givenLife: 30000, method: "Card", joined: "2024-05-03", engaged: false, lastActivity: "Gift, Oct 15", sources: ["Card processor", "info@ inbox"] },
  { id: "c7", name: "Pastor Jun Ramos", email: "jun@newlifemandaluyong.org", phone: "0917 555 0161", city: "Mandaluyong", address: "88 Boni Ave, Mandaluyong", lifecycle: "Donor", companyId: "co1", role: "Senior pastor", owner: ME, givenYtd: 20000, givenLife: 85000, method: "Bank transfer", joined: "2019-02-10", engaged: true, lastActivity: "Call, Oct 24", sources: ["Donor spreadsheet 2024", "Founder's Gmail", "info@ inbox"] },
  { id: "c8", name: "Mark Santos", email: "marksantos@gmail.com", phone: "0995 555 0177", city: "Parañaque", address: "17 Aguirre Ave, BF Homes, Parañaque", lifecycle: "Subscriber", owner: "Miguel Torres", givenYtd: 0, givenLife: 0, method: "None", joined: "2026-10-26", engaged: true, lastActivity: "Form, Oct 26", sources: ["Website form"] },
  { id: "c9", name: "Rina Castillo", email: "rina.castillo@gmail.com", phone: "0928 555 0187", city: "Las Piñas", address: "5 Alabang-Zapote Rd, Las Piñas", lifecycle: "Lapsed donor", owner: "Miguel Torres", givenYtd: 0, givenLife: 9000, method: "GCash", joined: "2023-11-30", engaged: false, lastActivity: "Gift, Dec 2025", sources: ["Donor spreadsheet 2024"] },
  { id: "c10", name: "Paolo Garcia", email: "paolo@garciatrading.ph", phone: "0917 555 0119", city: "Mandaluyong", address: "Garcia Trading, Shaw Blvd, Mandaluyong", lifecycle: "Major donor", companyId: "co7", role: "President", owner: ME, givenYtd: 75000, givenLife: 75000, method: "Bank transfer", joined: "2025-08-19", engaged: true, lastActivity: "Meeting, Oct 9", sources: ["Tess's Outlook", "Gala sign-up sheet"] },
  { id: "c11", name: "Teresa Ocampo", email: "teresa@gracecebu.org", phone: "0932 555 0144", city: "Cebu City", address: "Grace Community Church, Banilad, Cebu City", lifecycle: "Donor", companyId: "co3", role: "Missions coordinator", owner: "Rico Fernandez", givenYtd: 8000, givenLife: 26000, method: "Maya", joined: "2022-04-08", engaged: true, lastActivity: "Email opened, Oct 21", sources: ["info@ inbox"] },
  { id: "c12", name: "Dennis Aquino", email: "dennis.aquino@kalingabank.ph", phone: "0917 555 0150", city: "Pasig", address: "Kalinga Savings Bank, Ortigas Center, Pasig", lifecycle: "Donor", companyId: "co8", role: "CSR manager", owner: "Rico Fernandez", givenYtd: 5000, givenLife: 15000, method: "Card", joined: "2020-07-01", engaged: true, lastActivity: "Meeting, Oct 16", sources: ["Rico's Outlook", "Gala sign-up sheet"] },
  { id: "c13", name: "Maricel Tan", email: "maricel.tan@malinisfoods.com", phone: "0918 555 0166", city: "Makati", address: "Malinis Foods, Paseo de Roxas, Makati", lifecycle: "Donor", companyId: "co9", role: "Head of CSR", owner: "Rico Fernandez", givenYtd: 10000, givenLife: 10000, method: "GCash", joined: "2024-02-12", engaged: false, lastActivity: "Call, Oct 13", sources: ["Rico's Outlook"] },
  { id: "c14", name: "Pastor Noel Villareal", email: "noel@victoryhills.ph", phone: "0920 555 0171", city: "Antipolo", address: "Victory Hills Baptist, Sumulong Hwy, Antipolo", lifecycle: "Donor", companyId: "co2", role: "Lead pastor", owner: "Rico Fernandez", givenYtd: 6000, givenLife: 24000, method: "GCash", joined: "2021-03-15", engaged: true, lastActivity: "Email opened, Oct 19", sources: ["Founder's Gmail"] },
  { id: "c15", name: "Bea Lopez", email: "bea.lopez@gmail.com", phone: "0939 555 0182", city: "Davao City", address: "14 Juna Ave, Matina, Davao City", lifecycle: "Monthly partner", companyId: "co4", role: "Member", owner: "Miguel Torres", givenYtd: 10000, givenLife: 14000, method: "Maya", joined: "2025-06-01", engaged: true, lastActivity: "Gift, Oct 15", sources: ["Website form"] },
  { id: "c16", name: "Joel Pascual", email: "joel@pagasatrust.org", phone: "0917 555 0124", city: "Makati", address: "Pag-asa Educational Trust, Legazpi Village, Makati", lifecycle: "Major donor", companyId: "co6", role: "Program officer", owner: ME, givenYtd: 300000, givenLife: 600000, method: "Bank transfer", joined: "2023-01-09", engaged: true, lastActivity: "Email, Oct 23", sources: ["Tess's Outlook"] },
  { id: "c17", name: "Kristine Uy", email: "kristine.uy@gmail.com", phone: "0916 555 0139", city: "Quezon City", address: "22 Scout Tuason, Quezon City", lifecycle: "Subscriber", owner: "Miguel Torres", givenYtd: 0, givenLife: 0, method: "None", joined: "2026-10-12", engaged: true, lastActivity: "Form, Oct 12", sources: ["Landing page form"] },
  { id: "c18", name: "Arnel Domingo", email: "arnel@lakbaylogistics.ph", phone: "0918 555 0108", city: "Parañaque", address: "Lakbay Logistics, Sucat Rd, Parañaque", lifecycle: "Volunteer", companyId: "co10", role: "Operations head", owner: "Bea Santiago", givenYtd: 0, givenLife: 0, method: "None", joined: "2025-11-20", engaged: false, lastActivity: "Call, Oct 8", sources: ["Rico's Outlook"] },
];

const ACTIVITIES: Activity[] = [
  { id: "a1", contactId: "c2", kind: "Email", text: "Opened: Proposal for 2027 scholarships", date: "Oct 28" },
  { id: "a2", contactId: "c1", kind: "Meeting", text: "Site visit to the Tondo learning center", date: "Oct 27" },
  { id: "a3", contactId: "c8", kind: "Form", text: "Newsletter sign-up on hopeph.org", date: "Oct 26" },
  { id: "a4", contactId: "c7", kind: "Call", text: "Church will match Christmas feeding gifts", date: "Oct 24" },
  { id: "a5", contactId: "c16", kind: "Email", text: "Sent: Q3 impact report and audited financials", date: "Oct 23" },
  { id: "a6", contactId: "c4", kind: "Email", text: "Opened: We miss you", date: "Oct 22" },
  { id: "a7", contactId: "c11", kind: "Email", text: "Opened: October field report", date: "Oct 21" },
  { id: "a8", contactId: "c1", kind: "Email", text: "Opened: October field report", date: "Oct 21" },
  { id: "a9", contactId: "c5", kind: "Form", text: "Volunteer sign-up: Nov 15 Payatas outreach", date: "Oct 20" },
  { id: "a10", contactId: "c14", kind: "Email", text: "Opened: Will your church sponsor a classroom?", date: "Oct 19" },
  { id: "a11", contactId: "c12", kind: "Meeting", text: "CSR planning at the Ortigas office", date: "Oct 16" },
  { id: "a12", contactId: "c3", kind: "Gift", text: "₱1,500 monthly gift · GCash", date: "Oct 15" },
  { id: "a13", contactId: "c6", kind: "Gift", text: "₱1,200 monthly gift · Card", date: "Oct 15" },
  { id: "a14", contactId: "c15", kind: "Gift", text: "₱1,000 monthly gift · Maya", date: "Oct 15" },
  { id: "a15", contactId: "c2", kind: "Meeting", text: "Lunch in Greenhills, discussed the 2027 pledge", date: "Oct 14" },
  { id: "a16", contactId: "c13", kind: "Call", text: "Confirmed 200 sacks of rice for December", date: "Oct 13" },
  { id: "a17", contactId: "c17", kind: "Form", text: "Scholars page: asked for updates", date: "Oct 12" },
  { id: "a18", contactId: "c10", kind: "Meeting", text: "Coffee in Ortigas, interested in typhoon relief", date: "Oct 9" },
  { id: "a19", contactId: "c18", kind: "Call", text: "Offered two trucks for relief runs", date: "Oct 8" },
  { id: "a20", contactId: "c1", kind: "Call", text: "Thank-you call after the September gift", date: "Oct 2" },
  { id: "a21", contactId: "c2", kind: "Gift", text: "₱500,000 to the scholarship fund · Bank transfer", date: "Sep 30" },
  { id: "a22", contactId: "c1", kind: "Gift", text: "₱100,000 to the scholarship fund · Bank transfer", date: "Sep 30" },
  { id: "a23", contactId: "c16", kind: "Gift", text: "₱300,000 grant for learning centers · Bank transfer", date: "Jul 15" },
  { id: "a24", contactId: "c7", kind: "Gift", text: "₱20,000 to the feeding program · Bank transfer", date: "Jun 2" },
  { id: "a25", contactId: "c9", kind: "Gift", text: "₱5,000 to the Christmas appeal · GCash", date: "Dec 2025" },
  { id: "a26", contactId: "c4", kind: "Gift", text: "₱6,000 to the scholarship fund · Card", date: "Aug 2025" },
];

const PROB: Record<Stage, number> = { Prospect: 10, Cultivating: 25, Asked: 50, Pledged: 90, Given: 100 };
const NEXT: Record<Stage, string> = {
  Prospect: "Research giving history and ask for an introduction",
  Cultivating: "Invite to a site visit before making the ask",
  Asked: "Follow up on the proposal before the close date",
  Pledged: "Send the pledge letter and payment schedule",
  Given: "Send an impact report in 90 days",
};

const DEALS: Deal[] = [
  { id: "d1", name: "2027 scholarship fund", contactId: "c2", companyId: "co5", amount: 1200000, stage: "Asked", close: "Dec 15", purpose: "Scholarships for 40 students", owner: ME, history: ["Prospect · Jun 3", "Cultivating · Aug 12", "Asked · Oct 14"] },
  { id: "d2", name: "Learning center roof", contactId: "c1", amount: 350000, stage: "Cultivating", close: "Jan 30", purpose: "Tondo learning center repairs", owner: ME, history: ["Prospect · Sep 2", "Cultivating · Oct 27"] },
  { id: "d3", name: "Christmas feeding program", contactId: "c7", companyId: "co1", amount: 180000, stage: "Pledged", close: "Nov 30", purpose: "Meals for 600 children", owner: ME, history: ["Asked · Oct 5", "Pledged · Oct 24"] },
  { id: "d4", name: "Typhoon relief match", contactId: "c10", companyId: "co7", amount: 150000, stage: "Prospect", close: "Feb 28", purpose: "Relief packs, matched 1:1", owner: ME, history: ["Prospect · Oct 9"] },
  { id: "d5", name: "2027 CSR partnership", contactId: "c12", companyId: "co8", amount: 400000, stage: "Cultivating", close: "Nov 27", purpose: "Teacher training in four schools", owner: "Rico Fernandez", history: ["Prospect · Aug 20", "Cultivating · Oct 16"] },
  { id: "d6", name: "Mobile library van", contactId: "c2", companyId: "co5", amount: 600000, stage: "Prospect", close: "Mar 31", purpose: "Books for six barangays", owner: ME, history: ["Prospect · Oct 14"] },
  { id: "d7", name: "Learning center grant renewal", contactId: "c16", companyId: "co6", amount: 350000, stage: "Asked", close: "Jan 15", purpose: "Two learning centers in 2027", owner: ME, history: ["Cultivating · Sep 1", "Asked · Oct 23"] },
  { id: "d8", name: "Rice for Christmas meals", contactId: "c13", companyId: "co9", amount: 120000, stage: "Pledged", close: "Dec 5", purpose: "200 sacks, in kind", owner: "Rico Fernandez", history: ["Asked · Sep 28", "Pledged · Oct 13"] },
  { id: "d9", name: "Cebu reading room", contactId: "c11", companyId: "co3", amount: 90000, stage: "Prospect", close: "Apr 30", purpose: "One reading room in Banilad", owner: "Rico Fernandez", history: ["Prospect · Oct 21"] },
  { id: "d10", name: "2026 scholarship pledge", contactId: "c2", companyId: "co5", amount: 500000, stage: "Given", close: "Sep 30", purpose: "Scholarships for 18 students", owner: ME, history: ["Pledged · Mar 12", "Given · Sep 30"] },
  { id: "d11", name: "September scholarship gift", contactId: "c1", amount: 100000, stage: "Given", close: "Sep 30", purpose: "Scholarships", owner: ME, history: ["Asked · Aug 4", "Given · Sep 30"] },
];

const TASKS: Task[] = [
  { id: "t1", title: "Follow up on the scholarship proposal", kind: "Call", contactId: "c2", dealId: "d1", due: TODAY, owner: ME, done: false },
  { id: "t2", title: "Send the roof estimate from the contractor", kind: "Email", contactId: "c1", dealId: "d2", due: TODAY, owner: ME, done: false },
  { id: "t3", title: "Thank Pastor Jun for the match", kind: "Call", contactId: "c7", due: "2026-10-28", owner: ME, done: false },
  { id: "t4", title: "Send pledge letter and schedule", kind: "Email", contactId: "c7", dealId: "d3", due: "2026-10-27", owner: ME, done: false },
  { id: "t5", title: "Win-back call", kind: "Call", contactId: "c4", due: TODAY, owner: "Miguel Torres", done: false },
  { id: "t6", title: "Welcome call to new volunteer", kind: "Call", contactId: "c5", due: "2026-10-30", owner: "Bea Santiago", done: false },
  { id: "t7", title: "Prepare audited report for the grant", kind: "To-do", contactId: "c16", dealId: "d7", due: "2026-11-02", owner: ME, done: false },
  { id: "t8", title: "Confirm rice delivery date", kind: "Call", contactId: "c13", dealId: "d8", due: "2026-11-03", owner: "Rico Fernandez", done: false },
  { id: "t9", title: "Send the CSR proposal deck", kind: "Email", contactId: "c12", dealId: "d5", due: "2026-10-30", owner: "Rico Fernandez", done: false },
  { id: "t10", title: "Book relief trucks for November", kind: "To-do", contactId: "c18", due: "2026-11-05", owner: "Miguel Torres", done: false },
  { id: "t11", title: "Log site visit notes", kind: "To-do", contactId: "c1", due: "2026-10-27", owner: ME, done: true },
  { id: "t12", title: "Send October field report to the board", kind: "Email", contactId: "c2", due: "2026-10-26", owner: ME, done: true },
];
const TASK_ICON: Record<TaskKind, LucideIcon> = { Call: Phone, Email: Mail, "To-do": ListChecks };

const MEETINGS: Meeting[] = [
  { id: "m1", title: "Scholarship proposal review", contactId: "c2", when: "Today, 2:00 PM", where: "Lim Family Foundation, Greenhills", done: false },
  { id: "m2", title: "Roof walk-through with contractor", contactId: "c1", when: "Fri, Oct 30, 10:00 AM", where: "Tondo learning center", done: false },
  { id: "m3", title: "CSR budget planning", contactId: "c12", when: "Tue, Nov 3, 3:00 PM", where: "Video call", done: false },
  { id: "m4", title: "Relief logistics check-in", contactId: "c18", when: "Thu, Nov 5, 9:00 AM", where: "Lakbay depot, Parañaque", done: false },
];

// List rules. `pool` is how many of the workspace's other contacts match.
const CONDITIONS: Condition[] = [
  { id: "recurring", label: "Has an active recurring gift", pool: 608, test: (c) => c.lifecycle === "Monthly partner" },
  { id: "major", label: "Lifetime giving is ₱50,000 or more", pool: 43, test: (c) => c.givenLife >= 50000 },
  { id: "lapsed", label: "No gift in the last 12 months", pool: 1426, test: (c) => c.lifecycle === "Lapsed donor" },
  { id: "gave", label: "Gave this year", pool: 1890, test: (c) => c.givenYtd > 0 },
  { id: "never", label: "Has never given", pool: 1702, test: (c) => c.givenLife === 0 },
  { id: "volunteer", label: "Lifecycle stage is Volunteer", pool: 382, test: (c) => c.lifecycle === "Volunteer" },
  { id: "new", label: "Joined in the last 90 days", pool: 912, test: (c) => c.joined >= "2026-08-01" },
  { id: "engaged", label: "Opened an email in the last 30 days", pool: 2210, test: (c) => c.engaged },
  { id: "church", label: "Company type is Church", pool: 198, test: (_c, t) => t === "Church" },
  { id: "partner", label: "Company is a corporate partner or foundation", pool: 86, test: (_c, t) => t === "Corporate partner" || t === "Foundation" },
  { id: "ewallet", label: "Usually gives by GCash or Maya", pool: 1340, test: (c) => c.method === "GCash" || c.method === "Maya" },
  { id: "metro", label: "City is in Metro Manila", pool: 3580, test: (c) => METRO.includes(c.city) },
];
const cond = (id: string) => CONDITIONS.find((c) => c.id === id)!;
// Matching rules are combined with AND; the hidden part of the count is estimated.
const estimate = (rules: string[]) => Math.round(rules.reduce((n, r) => (n * cond(r).pool) / HIDDEN, HIDDEN));

const LISTS: DonorList[] = [
  { id: "l1", name: "Monthly partners", kind: "Active", rules: ["recurring"], members: [], hidden: 0, owner: "Miguel Torres" },
  { id: "l2", name: "Major donors", kind: "Active", rules: ["major"], members: [], hidden: 0, owner: ME },
  { id: "l3", name: "Lapsed donors", kind: "Active", rules: ["lapsed"], members: [], hidden: 0, owner: "Miguel Torres" },
  { id: "l4", name: "Engaged lapsed donors", kind: "Active", rules: ["lapsed", "engaged"], members: [], hidden: 0, owner: "Miguel Torres" },
  { id: "l5", name: "Volunteers", kind: "Active", rules: ["volunteer"], members: [], hidden: 0, owner: "Bea Santiago" },
  { id: "l6", name: "Church partners", kind: "Active", rules: ["church"], members: [], hidden: 0, owner: "Rico Fernandez" },
  { id: "l7", name: "New subscribers", kind: "Active", rules: ["new", "never"], members: [], hidden: 0, owner: "Miguel Torres" },
  { id: "l8", name: "E-wallet givers", kind: "Active", rules: ["ewallet", "gave"], members: [], hidden: 0, owner: "Miguel Torres" },
  { id: "l9", name: "Gala 2026 guests", kind: "Static", rules: [], members: ["c1", "c2", "c10", "c12", "c16"], hidden: 181, owner: ME },
  { id: "l10", name: "Board and advisors", kind: "Static", rules: [], members: ["c1", "c2"], hidden: 7, owner: ME },
];

const CAMPAIGNS: Campaign[] = [
  { id: "k1", name: "October field report", listId: "l1", date: "Oct 21", time: "7:00 PM", status: "Sent", subject: "Maria read her first book this month", sent: 611, open: 58, click: 14, raised: 86500, cost: 4500, test: { a: "Your October field report", b: "Maria read her first book this month", aOpen: 44, bOpen: 61 } },
  { id: "k2", name: "We miss you", listId: "l4", date: "Oct 22", time: "6:30 PM", status: "Sent", subject: "{first name}, 12 scholars are waiting", sent: 660, open: 41, click: 9, raised: 64000, cost: 3000, test: { a: "It has been a while", b: "{first name}, 12 scholars are waiting", aOpen: 29, bOpen: 43 } },
  { id: "k3", name: "Church classroom appeal", listId: "l6", date: "Oct 19", time: "9:00 AM", status: "Sent", subject: "Will your church sponsor a classroom?", sent: 201, open: 52, click: 17, raised: 145000, cost: 6000 },
  { id: "k4", name: "Volunteer call: Payatas outreach", listId: "l5", date: "Oct 14", time: "12:00 PM", status: "Sent", subject: "We need 30 hands on Nov 15", sent: 384, open: 64, click: 22, raised: 0, cost: 1500 },
  { id: "k5", name: "September scholar stories", listId: "l1", date: "Sep 23", time: "7:00 PM", status: "Sent", subject: "Three scholars, one classroom", sent: 598, open: 54, click: 12, raised: 71200, cost: 4500 },
  { id: "k6", name: "Year-end appeal: partners", listId: "l1", date: "Nov 18", time: "7:00 PM", status: "Scheduled", subject: "One more month of school for Jomar", sent: 0, open: 0, click: 0, raised: 0, cost: 0, test: { a: "One more month of school for Jomar", b: "Jomar's teacher wrote to you", aOpen: 0, bOpen: 0 } },
  { id: "k7", name: "Year-end appeal: churches", listId: "l6", date: "Nov 20", time: "9:00 AM", status: "Draft", subject: "Will your church sponsor a classroom in 2027?", sent: 0, open: 0, click: 0, raised: 0, cost: 0 },
  { id: "k8", name: "Giving Tuesday", listId: "l8", date: "Dec 1", time: "8:00 AM", status: "Draft", subject: "Today, ₱500 buys a term of books", sent: 0, open: 0, click: 0, raised: 0, cost: 0 },
];

const FORMS: WebForm[] = [
  { id: "fm1", name: "Scholarship giving form", where: "hopeph.org/scholars", fields: ["Full name", "Email", "Amount", "Monthly or once", "Payment method"], views: 3412, base: 236, listId: "l1", flowId: "f2", notify: true },
  { id: "fm2", name: "Volunteer sign-up", where: "hopeph.org/volunteer", fields: ["Full name", "Email", "Mobile number", "Church or company", "Outreach date"], views: 1180, base: 142, listId: "l5", flowId: "f5", notify: true },
  { id: "fm3", name: "Newsletter sign-up", where: "Site footer, every page", fields: ["First name", "Email"], views: 9620, base: 388, listId: "l7", notify: false },
  { id: "fm4", name: "Receipt request", where: "hopeph.org/receipts", fields: ["Full name", "Email", "Gift date", "Amount", "Name on receipt"], views: 410, base: 57, flowId: "f6", ticket: true, notify: true },
  { id: "fm5", name: "Church partnership inquiry", where: "hopeph.org/churches", fields: ["Church name", "Pastor or contact", "Email", "City", "How you'd like to help"], views: 640, base: 31, listId: "l6", notify: true },
];

const SUBMISSIONS: Submission[] = [
  { id: "s1", formId: "fm4", name: "Grace Navarro", detail: "All 2026 monthly gifts", date: "Oct 29", contactId: "c6" },
  { id: "s2", formId: "fm3", name: "Mark Santos", detail: "Newsletter", date: "Oct 26", contactId: "c8" },
  { id: "s3", formId: "fm2", name: "Carlo Bautista", detail: "Nov 15 · Payatas", date: "Oct 20", contactId: "c5" },
  { id: "s4", formId: "fm5", name: "Pastor Noel Villareal", detail: "Sponsor a classroom", date: "Oct 19", contactId: "c14" },
  { id: "s5", formId: "fm1", name: "Bea Lopez", detail: "₱1,000 monthly · Maya", date: "Oct 15", contactId: "c15" },
  { id: "s6", formId: "fm1", name: "Kristine Uy", detail: "No gift yet · asked for updates", date: "Oct 12", contactId: "c17" },
  { id: "s7", formId: "fm2", name: "Arnel Domingo", detail: "Relief runs · trucks", date: "Oct 8", contactId: "c18" },
  { id: "s8", formId: "fm1", name: "Joy Dela Cruz", detail: "₱1,500 monthly · GCash", date: "Oct 3", contactId: "c3" },
  { id: "s9", formId: "fm4", name: "Pastor Jun Ramos", detail: "Church feeding gift, June", date: "Oct 28", contactId: "c7" },
];
const VISITORS: [string, string][] = [["Jerome Salazar", "jerome.salazar@gmail.com"], ["Celine Aquino", "celine.aquino@yahoo.com"], ["Joy Dela Cruz", "joydc@yahoo.com"], ["Victor Manalo", "vmanalo@gmail.com"]];

const FLOWS: Flow[] = [
  { id: "f1", name: "Year-end appeal follow-up", trigger: "Opened the year-end appeal, no gift after 5 days", on: true, enrolled: 214, goal: "Gave within 30 days", goalRate: 31, steps: [{ kind: "delay", text: "Wait 5 days", now: 61 }, { kind: "email", text: "Send: A note from Jomar's teacher", now: 0 }, { kind: "branch", text: "Gave since enrolling?", now: 0, yes: "Thank-you email, then leave", no: "Call task for the contact owner" }, { kind: "task", text: "Owner calls within 3 days", now: 23 }] },
  { id: "f2", name: "New donor welcome", trigger: "Scholarship giving form submitted", on: true, enrolled: 96, goal: "Second gift within 60 days", goalRate: 46, steps: [{ kind: "email", text: "Send receipt and thank-you", now: 0 }, { kind: "property", text: "Set lifecycle stage to Donor", now: 0 }, { kind: "delay", text: "Wait 14 days", now: 18 }, { kind: "email", text: "Send: Meet the scholar you support", now: 0 }, { kind: "delay", text: "Wait 30 days", now: 7 }, { kind: "sms", text: "Text: Your impact this month", now: 0 }] },
  { id: "f3", name: "Lapsed donor win-back", trigger: "Joins the list Lapsed donors", on: true, enrolled: 1426, goal: "Gave again", goalRate: 9, steps: [{ kind: "email", text: "Send: We miss you", now: 0 }, { kind: "delay", text: "Wait 10 days", now: 212 }, { kind: "branch", text: "Opened the email?", now: 0, yes: "Call task for the owner", no: "Wait 30 days, then send an SMS" }] },
  { id: "f4", name: "Expiring card", trigger: "Monthly partner's card expires in 30 days", on: false, enrolled: 18, goal: "Card updated", goalRate: 72, steps: [{ kind: "email", text: "Send: Update your card", now: 0 }, { kind: "delay", text: "Wait 7 days", now: 0 }, { kind: "sms", text: "Text: Your gift link", now: 0 }, { kind: "task", text: "Owner calls the partner", now: 0 }] },
  { id: "f5", name: "Volunteer onboarding", trigger: "Volunteer sign-up submitted", on: true, enrolled: 142, goal: "Came to a first outreach", goalRate: 64, steps: [{ kind: "email", text: "Send: Welcome and outreach dates", now: 0 }, { kind: "task", text: "Bea makes a welcome call", now: 6 }, { kind: "delay", text: "Until 2 days before the outreach", now: 31 }, { kind: "sms", text: "Text: See you Saturday", now: 0 }] },
  { id: "f6", name: "Receipt requests to donor care", trigger: "Receipt request form submitted", on: true, enrolled: 58, goal: "Closed within 1 day", goalRate: 91, steps: [{ kind: "property", text: "Create a ticket in Donor care", now: 0 }, { kind: "task", text: "Assign to Bea Santiago", now: 0 }, { kind: "email", text: "Auto-reply: Your receipt is on the way", now: 0 }] },
];
const TEMPLATES: Omit<Flow, "id" | "on" | "enrolled" | "goalRate">[] = [
  { name: "First-gift anniversary", trigger: "One year since the first gift", goal: "Gave again within 30 days", steps: [{ kind: "email", text: "Send: One year of school, thanks to you", now: 0 }, { kind: "delay", text: "Wait 7 days", now: 0 }, { kind: "task", text: "Owner sends a handwritten card", now: 0 }] },
  { name: "Event follow-up", trigger: "Checked in at an event", goal: "Gave within 30 days", steps: [{ kind: "email", text: "Send: Thank you for coming", now: 0 }, { kind: "delay", text: "Wait 3 days", now: 0 }, { kind: "branch", text: "Gave at the event?", now: 0, yes: "Send the receipt", no: "Send a scholar story" }] },
  { name: "Monthly partner upgrade", trigger: "Monthly partner for 12 months", goal: "Raised the monthly gift", steps: [{ kind: "email", text: "Send: What your year made possible", now: 0 }, { kind: "delay", text: "Wait 5 days", now: 0 }, { kind: "sms", text: "Text: Would you add ₱200 a month?", now: 0 }] },
];
const STEP_ICON: Record<StepKind, LucideIcon> = { delay: Clock, email: Mail, branch: GitBranch, task: ListChecks, property: Pencil, sms: Smartphone };
const STEP_LABEL: Record<StepKind, string> = { delay: "Delay", email: "Send email", branch: "If/then branch", task: "Create task", property: "Update record", sms: "Send SMS" };

const TICKETS: Ticket[] = [
  { id: "tk1", subject: "Receipt for my 2026 gifts", contactId: "c6", category: "Receipt request", channel: "Web form", status: "New", owner: "", opened: "Today, 8:42 AM", messages: [{ from: "donor", author: "Grace Navarro", text: "Hi! Could I get one receipt for all my monthly gifts this year? My company needs it for my tax deduction.", when: "8:42 AM" }] },
  { id: "tk2", subject: "New address for mailed updates", contactId: "c3", category: "Address change", channel: "Email", status: "New", owner: "", opened: "Today, 7:15 AM", newAddress: "Blk 4 Lot 9, Mahogany St, Bacoor, Cavite", messages: [{ from: "donor", author: "Joy Dela Cruz", text: "We moved to Bacoor last week. Please send the Christmas card and scholar letters to Blk 4 Lot 9, Mahogany St, Bacoor, Cavite.", when: "7:15 AM" }] },
  { id: "tk3", subject: "Gift shows the wrong payment method", contactId: "c15", category: "Gift question", channel: "Chat", status: "In progress", owner: "Bea Santiago", opened: "Yesterday, 4:30 PM", messages: [{ from: "donor", author: "Bea Lopez", text: "I gave ₱1,000 by Maya on Oct 15, but my thank-you email says GCash.", when: "Yesterday, 4:30 PM" }, { from: "team", author: "Bea Santiago", text: "Thanks for telling us! Checking the payment records now.", when: "Yesterday, 4:41 PM" }] },
  { id: "tk4", subject: "Restart my monthly gift", contactId: "c9", category: "Recurring change", channel: "Email", status: "New", owner: "", opened: "Yesterday, 9:02 PM", messages: [{ from: "donor", author: "Rina Castillo", text: "I stopped giving last year when I changed jobs. Can I start again at ₱500 a month by GCash?", when: "Yesterday, 9:02 PM" }] },
  { id: "tk5", subject: "Receipt for the church's feeding gift", contactId: "c7", category: "Receipt request", channel: "Email", status: "In progress", owner: "Bea Santiago", opened: "Oct 28, 11:05 AM", messages: [{ from: "donor", author: "Pastor Jun Ramos", text: "Our treasurer needs a receipt for the June feeding program gift, addressed to the church.", when: "Oct 28, 11:05 AM" }] },
  { id: "tk6", subject: "Can our youth group join on Nov 15?", contactId: "c14", category: "Volunteer question", channel: "Email", status: "Waiting on donor", owner: "Miguel Torres", opened: "Oct 27, 3:20 PM", messages: [{ from: "donor", author: "Pastor Noel Villareal", text: "We have 12 youth who want to help at the Payatas outreach. Is there room?", when: "Oct 27, 3:20 PM" }, { from: "team", author: "Miguel Torres", text: "Yes! Can you send the names so we can plan meals and transport?", when: "Oct 27, 4:02 PM" }] },
  { id: "tk7", subject: "Moved to Taguig", contactId: "c4", category: "Address change", channel: "Phone", status: "Closed", owner: "Bea Santiago", opened: "Oct 21, 10:10 AM", messages: [{ from: "donor", author: "Liza Mendoza", text: "Called to update her address to McKinley Hill, Taguig.", when: "Oct 21, 10:10 AM" }, { from: "team", author: "Bea Santiago", text: "Updated on the record. Thanks, Liza!", when: "Oct 21, 10:14 AM" }] },
  { id: "tk8", subject: "Charged twice in September", contactId: "c12", category: "Gift question", channel: "Email", status: "Closed", owner: "Bea Santiago", opened: "Oct 2, 9:30 AM", messages: [{ from: "donor", author: "Dennis Aquino", text: "My card shows two ₱2,500 charges on Sep 15.", when: "Oct 2, 9:30 AM" }, { from: "team", author: "Bea Santiago", text: "Sorry about that. The second charge was refunded today.", when: "Oct 2, 1:15 PM" }] },
];

const DUPES: Dupe[] = [
  { id: "x1", keepId: "c1", name: "Ana M. Reyes", email: "anareyes.mkt@yahoo.com", source: "Gala sign-up sheet", reason: "Same phone number" },
  { id: "x2", keepId: "c7", name: "Jun Ramos", email: "pastorjun.ramos@gmail.com", source: "Christmas 2025 sign-up sheet", reason: "Same name and church" },
  { id: "x3", keepId: "c12", name: "Dennis Aquino", email: "daquino@kalingabank.ph", source: "Event check-in", reason: "Same name and company" },
  { id: "x4", keepId: "c3", name: "Joy DelaCruz", email: "joydc@yahoo.com", source: "Card processor", reason: "Same email" },
];

const GIVING = [612000, 548000, 701000, 655000, 690000, 1240000, 742000, 788000, 905000, 931000];
const NEW_DONORS = [42, 38, 51, 47, 55, 49, 61, 58, 72, 84];
const RETENTION = [["2021", 49], ["2022", 52], ["2023", 55], ["2024", 58], ["2025", 66], ["2026", 71]] as const;

const ICON: Record<ActivityKind, LucideIcon> = { Email: Mail, Gift: HandCoins, Call: Phone, Meeting: CalendarDays, Form: FileText, Note: StickyNote };
type ContactFilter = "all" | "major" | "monthly" | "lapsed" | "volunteers";
const inFilter = (c: Contact, f: ContactFilter) =>
  f === "all" || (f === "major" && c.lifecycle === "Major donor") || (f === "monthly" && c.lifecycle === "Monthly partner") || (f === "lapsed" && c.lifecycle === "Lapsed donor") || (f === "volunteers" && c.lifecycle === "Volunteer");
const lifeTone = (l: Lifecycle) => (l === "Lapsed donor" ? "bad" : l === "Major donor" || l === "Monthly partner" ? "good" : l === "Donor" ? "warn" : "muted");
const ticketTone = (s: TicketStatus) => (s === "New" ? "bad" : s === "In progress" ? "warn" : s === "Closed" ? "good" : "muted");
const campTone = (s: Campaign["status"]) => (s === "Sent" ? "good" : s === "Scheduled" ? "warn" : "muted");
const selectSm = "h-7 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer max-w-full";

// ---- Small local pieces ----------------------------------------------------------------

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
      <Search size={14} className="text-mist" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
    </label>
  );
}

function LinkText({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="text-gold-bright hover:underline cursor-pointer text-left"
    >{children}</button>
  );
}

function RowLink({ title, meta, right, onClick }: { title: string; meta?: string; right?: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full flex items-center justify-between gap-2 py-2 text-left cursor-pointer group">
        <span className="min-w-0">
          <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{title}</span>
          {meta && <span className="block text-[0.68rem] text-mist truncate">{meta}</span>}
        </span>
        {right && <span className="font-mono text-[0.74rem] text-ink-soft shrink-0">{right}</span>}
      </button>
    </li>
  );
}

const Rows = ({ children }: { children: React.ReactNode }) => <ul className="flex flex-col divide-y divide-rule-soft -my-1">{children}</ul>;
const Empty = ({ children }: { children: React.ReactNode }) => <li className="py-2 text-[0.78rem] text-graphite">{children}</li>;
const Label = ({ children }: { children: React.ReactNode }) => <div className="text-[0.68rem] font-medium text-mist mb-1 mt-3 first:mt-0">{children}</div>;

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("px-2.5 py-1 rounded-md border text-[0.74rem] cursor-pointer transition-colors", on ? "border-gold bg-gold-wash text-gold font-semibold" : "border-rule bg-sheet text-graphite hover:text-ink")}
    >{children}</button>
  );
}

function Timeline({ items, who }: { items: Activity[]; who?: (a: Activity) => string | undefined }) {
  return (
    <ol className="relative flex flex-col gap-3 before:absolute before:left-[13px] before:top-1 before:bottom-1 before:w-px before:bg-rule">
      {items.map((a) => {
        const Icon = ICON[a.kind];
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className="relative w-7 h-7 rounded-full bg-sheet border border-rule flex items-center justify-center text-gold shrink-0"><Icon size={13} /></span>
            <span className="flex-1 min-w-0 pt-0.5">
              <span className="block text-[0.8rem] text-ink">{a.text}</span>
              <span className="block text-[0.68rem] text-mist">{[a.kind, who?.(a), a.date].filter(Boolean).join(" · ")}</span>
            </span>
          </li>
        );
      })}
      {items.length === 0 && <li className="pl-10 text-[0.8rem] text-graphite">Nothing logged yet.</li>}
    </ol>
  );
}

function FlowNode({ icon: Icon, kind, text, note, accent }: { icon: LucideIcon; kind: string; text: string; note?: string; accent?: boolean }) {
  return (
    <div className={cn("w-full rounded-lg border px-3 py-2.5 flex items-start gap-2.5 bg-sheet", accent ? "border-gold/50" : "border-rule")}>
      <span className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", accent ? "bg-gold text-sheet" : "bg-gold-wash text-gold")}><Icon size={14} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[0.66rem] font-medium text-mist">{kind}</span>
        <span className="block text-[0.8rem] text-ink">{text}</span>
      </span>
      {note && <span className="text-[0.68rem] text-graphite shrink-0 pt-0.5">{note}</span>}
    </div>
  );
}

function FlowChart({ flow }: { flow: Flow }) {
  const link = <li aria-hidden className="w-px h-5 bg-mist/40" />;
  return (
    <ol className="flex flex-col items-center max-w-lg mx-auto">
      <li className="w-full"><FlowNode icon={Workflow} kind="Enrollment trigger" text={flow.trigger} note={`${flow.enrolled.toLocaleString()} enrolled`} accent /></li>
      {flow.steps.map((s, i) => (
        <React.Fragment key={`${s.text}-${i}`}>
          {link}
          <li className="w-full">
            <FlowNode icon={STEP_ICON[s.kind]} kind={`${i + 1} · ${STEP_LABEL[s.kind]}`} text={s.text} note={s.now ? `${s.now} here now` : undefined} />
            {s.kind === "branch" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[["Yes", s.yes], ["No", s.no]].map(([k, v]) => (
                  <div key={k} className="rounded-md border border-dashed border-rule bg-paper px-2.5 py-2">
                    <span className="block text-[0.64rem] font-semibold text-gold">{k}</span>
                    <span className="block text-[0.74rem] text-ink-soft">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </li>
        </React.Fragment>
      ))}
      {link}
      <li className="text-[0.7rem] text-mist">{`Goal: ${flow.goal}`}</li>
    </ol>
  );
}

// ---- Prototype -------------------------------------------------------------------------

type Modal = "contact" | "company" | "call" | "task" | "deal" | "list" | "rule" | "email" | "associate" | "flow";

export function HubSpotPrototype() {
  const app = useProtoApp("dashboard");
  const [contacts, setContacts] = useState(CONTACTS);
  const [companies, setCompanies] = useState(COMPANIES);
  const [acts, setActs] = useState(ACTIVITIES);
  const [deals, setDeals] = useState(DEALS);
  const [tasks, setTasks] = useState(TASKS);
  const [meetings, setMeetings] = useState(MEETINGS);
  const [lists, setLists] = useState(LISTS);
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [forms, setForms] = useState(FORMS);
  const [subs, setSubs] = useState(SUBMISSIONS);
  const [flows, setFlows] = useState(FLOWS);
  const [tickets, setTickets] = useState(TICKETS);
  const [dupes, setDupes] = useState(DUPES);
  const [merged, setMerged] = useState(1284);
  const [extra, setExtra] = useState(0); // gifts recorded in this session, counted in October
  const [pageRaised, setPageRaised] = useState(412000);
  const [visitor, setVisitor] = useState(0);

  const [chart, setChart] = useState<"giving" | "donors">("giving");
  const [taskView, setTaskView] = useState<"today" | "overdue" | "upcoming" | "done">("today");
  const [cQuery, setCQuery] = useState("");
  const [cFilter, setCFilter] = useState<ContactFilter>("all");
  const [coQuery, setCoQuery] = useState("");
  const [coFilter, setCoFilter] = useState<"all" | CompanyType>("all");
  const [listFilter, setListFilter] = useState<"all" | "Active" | "Static">("all");
  const [mine, setMine] = useState<"all" | "mine">("all");
  const [mTab, setMTab] = useState<"email" | "forms" | "landing">("email");
  const [tl, setTl] = useState<"all" | "gift" | "email" | "talk">("all");
  const [tkFilter, setTkFilter] = useState<"open" | "mine" | "unassigned" | "closed">("open");
  const [modal, setModal] = useState<Modal | null>(null);

  const [cDraft, setCDraft] = useState({ name: "", email: "", lifecycle: "Subscriber" as Lifecycle, companyId: "" });
  const [coDraft, setCoDraft] = useState({ name: "", type: "Church" as CompanyType, city: "", domain: "" });
  const [talk, setTalk] = useState({ contactId: "", meetingId: "", outcome: "Connected", notes: "", follow: "None" });
  const [tDraft, setTDraft] = useState({ title: "", kind: "Call" as TaskKind, contactId: "c1", dealId: "", due: TODAY });
  const [dDraft, setDDraft] = useState({ name: "", contactId: "c1", amount: "100000", stage: "Prospect" as Stage, close: "2027-01-29" });
  const [lDraft, setLDraft] = useState({ name: "", r1: "lapsed", r2: "" });
  const [rDraft, setRDraft] = useState("engaged");
  const [eDraft, setEDraft] = useState({ name: "", listId: "l3", subject: "", subjectB: "", date: "2026-11-25", time: "7:00 PM" });
  const [assoc, setAssoc] = useState({ contactId: "", companyId: "" });
  const [tpl, setTpl] = useState(0);
  const [lp, setLp] = useState({ name: VISITORS[0][0], email: VISITORS[0][1], amount: 1000, freq: "Monthly" as "Monthly" | "Once" });
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [nextStep, setNextStep] = useState("");

  // ---- Lookups and live numbers ----
  const contact = (id?: string) => contacts.find((x) => x.id === id);
  const company = (id?: string) => companies.find((x) => x.id === id);
  const listOf = (id?: string) => lists.find((x) => x.id === id);
  const flowOf = (id?: string) => flows.find((x) => x.id === id);
  const typeOf = (c: Contact) => company(c.companyId)?.type;
  const matches = (rules: string[], c: Contact) => rules.every((r) => cond(r).test(c, typeOf(c)));
  const membersOf = (l: DonorList) => contacts.filter((c) => (l.kind === "Static" ? l.members.includes(c.id) : matches(l.rules, c)));
  const countOf = (l?: DonorList) => (l ? (l.kind === "Static" ? l.hidden : estimate(l.rules)) + membersOf(l).length : 0);
  const preview = (rules: string[]) => estimate(rules) + contacts.filter((c) => matches(rules, c)).length;
  const rulesText = (l: DonorList) => (l.kind === "Static" ? "Added by hand or import" : l.rules.map((r) => cond(r).label).join(" and "));
  const usedIn = (l: DonorList) => [...campaigns.filter((k) => k.listId === l.id).map((k) => k.name), ...forms.filter((f) => f.listId === l.id).map((f) => f.name), ...(l.id === "l3" ? ["Lapsed donor win-back"] : [])];

  const openDeals = deals.filter((d) => d.stage !== "Given");
  const weighted = openDeals.reduce((s, d) => s + (d.amount * PROB[d.stage]) / 100, 0);
  const openTickets = tickets.filter((t) => t.status !== "Closed");
  const todo = tasks.filter((t) => !t.done);
  const dueToday = todo.filter((t) => t.due === TODAY);
  const overdue = todo.filter((t) => t.due < TODAY);
  const givingYtd = GIVING.reduce((s, n) => s + n, 0) + extra;
  const sentCampaigns = campaigns.filter((k) => k.status === "Sent");
  const formCount = (f: WebForm) => f.base + subs.filter((s) => s.formId === f.id).length;

  // ---- Actions ----
  const patchContact = (id: string, patch: Partial<Contact>) => patchIn(setContacts, id, patch);
  const logActivity = (contactId: string, kind: ActivityKind, text: string) => {
    setActs((l) => [{ id: nextId("a"), contactId, kind, text, date: "Today" }, ...l]);
    patchContact(contactId, { lastActivity: `${kind}, today` });
  };

  const toggleTask = (t: Task) => {
    patchIn(setTasks, t.id, { done: !t.done });
    if (!t.done && t.contactId) logActivity(t.contactId, t.kind === "To-do" ? "Note" : t.kind, `Task done: ${t.title}`);
    app.notify(t.done ? `Reopened: ${t.title}` : `Done: ${t.title}`);
  };

  const setStage = (d: Deal, stage: Stage) => {
    if (d.stage === stage) return;
    patchIn(setDeals, d.id, { stage, history: [...d.history, `${stage} · Today`] });
    const delta = stage === "Given" ? d.amount : d.stage === "Given" ? -d.amount : 0;
    if (delta) {
      setExtra((x) => x + delta);
      setContacts((l) => l.map((c) => (c.id === d.contactId ? { ...c, givenYtd: c.givenYtd + delta, givenLife: c.givenLife + delta } : c)));
    }
    if (stage === "Given") {
      logActivity(d.contactId, "Gift", `${peso(d.amount)} received · ${d.name}`);
      app.notify(`${d.name} marked given. Receipt and thank-you queued.`);
    } else app.notify(`${d.name} moved to ${stage}`);
  };

  const openTask = (contactId = "c1", dealId = "") => {
    setTDraft({ title: "", kind: "Call", contactId, dealId, due: TODAY });
    setModal("task");
  };
  const openTalk = (contactId: string, meetingId = "") => {
    setTalk({ contactId, meetingId, outcome: meetingId ? "Went well" : "Connected", notes: "", follow: "None" });
    setModal("call");
  };
  const openEmail = (listId = "l3") => {
    setEDraft({ name: "", listId, subject: "", subjectB: "", date: "2026-11-25", time: "7:00 PM" });
    setModal("email");
  };
  const openAssoc = (contactId: string, companyId: string) => {
    setAssoc({ contactId, companyId });
    setModal("associate");
  };

  const saveContact = () => {
    const email = cDraft.email.trim().toLowerCase();
    const name = cDraft.name.trim();
    const existing = contacts.find((x) => x.email === email);
    setModal(null);
    setCDraft({ name: "", email: "", lifecycle: "Subscriber", companyId: "" });
    if (existing) {
      app.open("contact", existing.id, existing.name);
      app.notify(`${email} is already on file. Opened ${existing.name} instead of making a duplicate.`);
      return;
    }
    const co = company(cDraft.companyId);
    setContacts((l) => [{ id: nextId("c"), name, email, phone: "Not set", city: co?.city ?? "Not set", address: "Not set", lifecycle: cDraft.lifecycle, companyId: co?.id, role: co ? "Contact" : undefined, owner: ME, givenYtd: 0, givenLife: 0, method: "None", joined: TODAY, engaged: false, lastActivity: "Created, today", sources: ["Added by Tess"] }, ...l]);
    app.notify(`${name} added. Checked ${(HIDDEN + contacts.length).toLocaleString()} records, no duplicate.`);
  };

  const saveCompany = () => {
    const id = nextId("co");
    const name = coDraft.name.trim();
    setCompanies((l) => [{ id, name, type: coDraft.type, city: coDraft.city.trim() || "Not set", domain: coDraft.domain.trim() || "Not set", owner: ME, since: "2026", givenYtd: 0, note: "Added today." }, ...l]);
    setModal(null);
    setCoDraft({ name: "", type: "Church", city: "", domain: "" });
    app.open("company", id, name);
    app.notify(`${name} added to companies`);
  };

  const saveTalk = () => {
    const c = contact(talk.contactId);
    if (!c) return;
    const m = meetings.find((x) => x.id === talk.meetingId);
    const kind = m ? "Meeting" : "Call";
    const notes = talk.notes.trim();
    logActivity(c.id, kind, `${m ? m.title : talk.outcome}${notes ? `: ${notes}` : m ? `, ${talk.outcome.toLowerCase()}` : ""}`);
    if (m) patchIn(setMeetings, m.id, { done: true });
    if (talk.follow !== "None") setTasks((l) => [{ id: nextId("t"), title: `Follow up with ${first(c.name)}`, kind: "Call", contactId: c.id, due: talk.follow === "Tomorrow" ? "2026-10-30" : "2026-11-05", owner: ME, done: false }, ...l]);
    setModal(null);
    app.notify(`${kind} logged on ${first(c.name)}'s timeline${talk.follow !== "None" ? `. Follow-up set for ${talk.follow.toLowerCase()}.` : ""}`);
  };

  const saveTask = () => {
    const label = DUE_OPTIONS.find((o) => o[0] === tDraft.due)?.[1] ?? fmtDate(tDraft.due);
    setTasks((l) => [{ id: nextId("t"), title: tDraft.title.trim(), kind: tDraft.kind, contactId: tDraft.contactId || undefined, dealId: tDraft.dealId || undefined, due: tDraft.due, owner: ME, done: false }, ...l]);
    setModal(null);
    app.notify(`Task created, due ${label === "Today" || label === "Tomorrow" ? label.toLowerCase() : label}`);
  };

  const addNextStep = (d: Deal) => {
    const title = nextStep.trim() || NEXT[d.stage];
    setTasks((l) => [{ id: nextId("t"), title, kind: "To-do", contactId: d.contactId, dealId: d.id, due: "2026-11-02", owner: d.owner, done: false }, ...l]);
    setNextStep("");
    app.notify(`Next step added for ${first(d.owner)}, due Monday, Nov 2`);
  };

  const saveDeal = () => {
    const c = contact(dDraft.contactId);
    const amount = Number(dDraft.amount) || 0;
    const name = dDraft.name.trim();
    if (!c) return;
    setDeals((l) => [...l, { id: nextId("d"), name, contactId: c.id, companyId: c.companyId, amount, stage: dDraft.stage, close: fmtDate(dDraft.close), purpose: name, owner: ME, history: [`${dDraft.stage} · Today`] }]);
    setModal(null);
    setDDraft({ name: "", contactId: "c1", amount: "100000", stage: "Prospect", close: "2027-01-29" });
    app.notify(`${name} added to ${dDraft.stage} · ${peso(amount)}`);
  };

  const saveList = () => {
    const rules = [...new Set([lDraft.r1, lDraft.r2].filter(Boolean))];
    const id = nextId("l");
    const name = lDraft.name.trim();
    setLists((l) => [...l, { id, name, kind: "Active", rules, members: [], hidden: 0, owner: ME }]);
    setModal(null);
    setLDraft({ name: "", r1: "lapsed", r2: "" });
    app.open("list", id, name);
    app.notify(`${name} created with ${preview(rules).toLocaleString()} contacts. It updates on its own.`);
  };

  const setRules = (l: DonorList, rules: string[], verb: string) => {
    patchIn(setLists, l.id, { rules });
    setModal(null);
    app.notify(`Rule ${verb}. ${l.name} now has ${preview(rules).toLocaleString()} contacts.`);
  };

  const saveEmail = () => {
    const l = listOf(eDraft.listId);
    const date = fmtDate(eDraft.date);
    const name = eDraft.name.trim();
    const subject = eDraft.subject.trim();
    const b = eDraft.subjectB.trim();
    setCampaigns((x) => [{ id: nextId("k"), name, listId: eDraft.listId, date, time: eDraft.time, status: "Scheduled", subject, sent: 0, open: 0, click: 0, raised: 0, cost: 0, test: b ? { a: subject, b, aOpen: 0, bOpen: 0 } : undefined }, ...x]);
    setModal(null);
    app.notify(`${name} scheduled for ${date}, ${eDraft.time} to ${countOf(l).toLocaleString()} contacts${b ? ". A/B test on." : ""}`);
  };

  const sendNow = (k: Campaign) => {
    const n = countOf(listOf(k.listId));
    patchIn(setCampaigns, k.id, { status: "Sent", date: "Oct 29", sent: n, open: 21, click: 4, test: k.test && { ...k.test, aOpen: 18, bOpen: 24 } });
    app.notify(`Sending to ${n.toLocaleString()} contacts. Results update live.`);
  };

  const duplicate = (k: Campaign) => {
    const id = nextId("k");
    const name = `${k.name} (copy)`;
    setCampaigns((x) => [{ ...k, id, name, status: "Draft", date: "Nov 30", sent: 0, open: 0, click: 0, raised: 0, cost: 0, test: k.test && { ...k.test, aOpen: 0, bOpen: 0 } }, ...x]);
    app.open("campaign", id, name);
    app.notify(`Draft created from ${k.name}`);
  };

  const submitLanding = () => {
    const name = lp.name.trim();
    const email = lp.email.trim().toLowerCase();
    const monthly = lp.freq === "Monthly";
    const existing = contacts.find((c) => c.email === email);
    const id = existing?.id ?? nextId("c");
    if (existing) {
      patchContact(existing.id, { lifecycle: monthly && existing.lifecycle !== "Major donor" ? "Monthly partner" : existing.lifecycle, givenYtd: existing.givenYtd + lp.amount, givenLife: existing.givenLife + lp.amount, method: "GCash" });
    } else {
      setContacts((l) => [{ id, name, email, phone: "Not set", city: "Quezon City", address: "Not set", lifecycle: monthly ? "Monthly partner" : "Donor", owner: "Miguel Torres", givenYtd: lp.amount, givenLife: lp.amount, method: "GCash", joined: TODAY, engaged: true, lastActivity: "Gift, today", sources: ["Landing page form"] }, ...l]);
    }
    setSubs((l) => [{ id: nextId("s"), formId: "fm1", name, detail: `${peso(lp.amount)} ${monthly ? "monthly" : "once"} · GCash`, date: "Today", contactId: id }, ...l]);
    logActivity(id, "Gift", `${peso(lp.amount)} ${monthly ? "monthly gift" : "gift"} from hopeph.org/scholars · GCash`);
    setExtra((x) => x + lp.amount);
    setPageRaised((x) => x + lp.amount);
    const nextVisitor = (visitor + 1) % VISITORS.length;
    setVisitor(nextVisitor);
    setLp({ name: VISITORS[nextVisitor][0], email: VISITORS[nextVisitor][1], amount: 1000, freq: "Monthly" });
    app.notify(`${first(name)} gave ${peso(lp.amount)}. ${existing ? "Matched the existing record" : "New contact created"}, welcome workflow started.`);
  };

  const merge = (ds: Dupe[]) => {
    const ids = ds.map((d) => d.id);
    setDupes((l) => l.filter((x) => !ids.includes(x.id)));
    setContacts((l) => l.map((c) => ({ ...c, sources: [...new Set([...c.sources, ...ds.filter((d) => d.keepId === c.id).map((d) => d.source)])] })));
    setMerged((m) => m + ds.length);
    app.notify(ds.length === 1 ? `${ds[0].name} merged into ${contact(ds[0].keepId)?.name}. History kept.` : `${ds.length} duplicates merged. History kept on each record.`);
  };

  const saveAssoc = () => {
    const c = contact(assoc.contactId);
    const co = company(assoc.companyId);
    if (!c || !co) return;
    patchContact(c.id, { companyId: co.id, role: c.role ?? "Contact" });
    logActivity(c.id, "Note", `Associated with ${co.name}`);
    setModal(null);
    app.notify(`${c.name} associated with ${co.name}`);
  };

  const toggleFlow = (f: Flow) => {
    patchIn(setFlows, f.id, { on: !f.on });
    app.notify(f.on ? `${f.name} turned off. Enrolled contacts finish their current step.` : `${f.name} turned on`);
  };
  const saveFlow = () => {
    const t = TEMPLATES[tpl];
    const id = nextId("f");
    setFlows((l) => [...l, { ...t, id, on: false, enrolled: 0, goalRate: 0 }]);
    setModal(null);
    app.open("workflow", id, t.name);
    app.notify(`${t.name} created. Review the steps, then turn it on.`);
  };

  const post = (tk: Ticket, text: string, status: TicketStatus) => patchIn(setTickets, tk.id, { messages: [...tk.messages, { from: "team", author: ME, text, when: "Just now" }], status, owner: tk.owner || ME });
  const sendReply = (tk: Ticket, c: Contact) => {
    const text = (replies[tk.id] ?? "").trim();
    if (!text) return;
    post(tk, text, "Waiting on donor");
    setReplies((r) => ({ ...r, [tk.id]: "" }));
    logActivity(c.id, "Email", `Donor care reply: ${tk.subject}`);
    app.notify(`Reply sent to ${c.email}`);
  };
  const ticketAction = (tk: Ticket, c: Contact): { icon: LucideIcon; text: string; label: string; run: () => void } | null => {
    if (tk.status === "Closed") return null;
    if (tk.category === "Receipt request")
      return {
        icon: Receipt,
        text: `${peso(c.givenYtd)} given this year. The receipt is built from gift records.`,
        label: "Send receipt",
        run: () => {
          post(tk, `Here is your official receipt for ${peso(c.givenYtd)} given in 2026 (OR-2026-1048). Salamat, ${first(c.name)}!`, "Closed");
          logActivity(c.id, "Email", "Sent: Official receipt for 2026 gifts");
          app.notify(`Receipt sent to ${c.email}. Ticket closed.`);
        },
      };
    if (tk.category === "Address change" && tk.newAddress)
      return {
        icon: MapPin,
        text: `${c.address} → ${tk.newAddress}`,
        label: "Update address",
        run: () => {
          patchContact(c.id, { address: tk.newAddress! });
          post(tk, `Done! We'll mail updates to ${tk.newAddress} from now on.`, "Closed");
          logActivity(c.id, "Note", "Mailing address updated from donor care");
          app.notify(`Address updated on ${first(c.name)}'s record. Ticket closed.`);
        },
      };
    if (tk.category === "Recurring change")
      return {
        icon: HandCoins,
        text: "Restart a ₱500 monthly gift by GCash, first charge Nov 15.",
        label: "Restart gift",
        run: () => {
          patchContact(c.id, { lifecycle: "Monthly partner", method: "GCash" });
          post(tk, "Your ₱500 monthly gift by GCash starts Nov 15. Welcome back!", "Closed");
          logActivity(c.id, "Gift", "Restarted ₱500 monthly gift · GCash");
          app.notify(`${first(c.name)} is a monthly partner again. Lists updated.`);
        },
      };
    return null;
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: ListChecks, badge: dueToday.length + overdue.length },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "lists", label: "Lists", icon: ListFilter },
    { id: "pipeline", label: "Deals", icon: Columns3, badge: openDeals.length },
    { id: "campaigns", label: "Marketing", icon: Megaphone },
    { id: "automations", label: "Workflows", icon: Workflow },
    { id: "inbox", label: "Donor care", icon: Inbox, badge: openTickets.length },
  ];

  // Current records for detail screens.
  const c = contact(app.id);
  const co = company(app.id);
  const l = listOf(app.id);
  const deal = deals.find((d) => d.id === app.id);
  const k = campaigns.find((x) => x.id === app.id);
  const fm = forms.find((x) => x.id === app.id);
  const fl = flowOf(app.id);
  const tk = tickets.find((x) => x.id === app.id);

  const taskRow = (t: Task) => {
    const tc = contact(t.contactId);
    const td = deals.find((d) => d.id === t.dealId);
    const late = !t.done && t.due < TODAY;
    const Icon = TASK_ICON[t.kind];
    return (
      <li key={t.id} className="flex items-start gap-2.5 px-3 py-2.5">
        <button type="button" role="checkbox" aria-checked={t.done} aria-label={`Complete ${t.title}`} onClick={() => toggleTask(t)} className="mt-0.5 text-mist hover:text-gold cursor-pointer">
          {t.done ? <CheckCircle2 size={16} className="text-good" /> : <Circle size={16} />}
        </button>
        <span className="flex-1 min-w-0">
          <span className={cn("block text-[0.8rem]", t.done ? "text-mist line-through" : "text-ink")}>{t.title}</span>
          <span className="flex flex-wrap items-center gap-x-1.5 text-[0.68rem] text-mist mt-0.5">
            <Icon size={11} aria-hidden />
            <span>{t.kind}</span>
            {tc && <LinkText onClick={() => app.open("contact", tc.id, tc.name)}>{tc.name}</LinkText>}
            {td && <LinkText onClick={() => app.open("deal", td.id, td.name)}>{td.name}</LinkText>}
            <span>{first(t.owner)}</span>
          </span>
        </span>
        <span className={cn("text-[0.7rem] shrink-0 pt-0.5", late ? "text-danger font-medium" : "text-graphite")}>{late ? `Overdue · ${fmtDate(t.due)}` : dueLabel(t.due)}</span>
      </li>
    );
  };

  // ---- Search (⌘K) and the bell ----
  // Every record with a detail screen, opened the way the app opens it: section first, then the record.
  const found = (hint: string, root: string, screen: string, id: string, label: string): ProtoSearchItem => ({ label, hint, stack: [{ screen: root }, { screen, id, label }] });
  const search: ProtoSearchItem[] = [
    ...contacts.map((x) => found("Contact", "contacts", "contact", x.id, x.name)),
    ...companies.map((x) => found("Company", "companies", "company", x.id, x.name)),
    ...deals.map((x) => found("Deal", "pipeline", "deal", x.id, x.name)),
    ...lists.map((x) => found("List", "lists", "list", x.id, x.name)),
    ...campaigns.map((x) => found("Campaign", "campaigns", "campaign", x.id, x.name)),
    ...forms.map((x) => found("Form", "campaigns", "form", x.id, x.name)),
    ...flows.map((x) => found("Workflow", "automations", "workflow", x.id, x.name)),
    ...tickets.map((x) => found("Ticket", "inbox", "ticket", x.id, x.subject)),
  ];

  // New tickets, then overdue tasks, oldest first. Same two things the bell has always counted.
  const inbox: ProtoAlert[] = [
    ...tickets
      .filter((t) => t.status === "New")
      .map((t) => ({
        text: `New ticket from ${contact(t.contactId)?.name ?? "a donor"}: ${t.subject}`,
        time: t.opened,
        stack: [{ screen: "inbox" }, { screen: "ticket", id: t.id, label: t.subject }],
      })),
    ...[...overdue]
      .sort((a, b) => a.due.localeCompare(b.due))
      .map((t) => {
        const tc = contact(t.contactId);
        return {
          text: `Overdue: ${t.title}`,
          time: tc ? `Due ${fmtDate(t.due)} · ${tc.name}` : `Due ${fmtDate(t.due)}`,
          stack: tc ? [{ screen: "contacts" }, { screen: "contact", id: tc.id, label: tc.name }] : [{ screen: "tasks" }],
        };
      }),
  ];

  return (
    <ProtoApp app={app} name="HubSpot setup · Hope Philippines Foundation" user={ME} nav={nav} inbox={inbox} search={search}>
      {/* ---- Dashboard ---- */}
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader
            title="Board dashboard"
            subtitle="Thursday, October 29 · Zion's illustration of a HubSpot setup"
            action={<SmallButton onClick={() => app.notify("Board link copied. Numbers stay live, no export needed.")}><Share2 size={12} /> Share with board</SmallButton>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Giving, year to date" value={peso(givingYtd)} sub="+14% vs 2025" tone="good" />
            <Stat label="Donor retention" value="71%" sub="Up from 58% before setup" tone="good" />
            <Stat label="Monthly partners" value={countOf(listOf("l1")).toLocaleString()} sub="Live from the list" />
            <Stat label="Weighted pipeline" value={peso(weighted)} sub={`${openDeals.length} open major gifts`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Giving by month" action={<Segmented id="hs-chart" value={chart} onChange={setChart} options={[{ id: "giving", label: "Giving" }, { id: "donors", label: "New donors" }]} />}>
              <Bars
                key={chart}
                format={chart === "giving" ? (n) => `${Math.round(n / 1000)}k` : String}
                data={(chart === "giving" ? GIVING.map((v, i) => (i === GIVING.length - 1 ? v + extra : v)) : NEW_DONORS).map((value, i) => ({ label: MONTHS[i], value }))}
              />
            </Panel>
            <Panel title="Donor retention" action={<span className="text-[0.68rem] text-mist">Gave again the next year</span>}>
              <Bars data={RETENTION.map(([label, value]) => ({ label, value }))} format={(n) => `${n}%`} />
              <p className="mt-2 text-[0.7rem] text-mist">Setup went live in March 2025. Thank-you and win-back workflows started that month.</p>
            </Panel>
            <Panel title="Campaign ROI">
              <table className="w-full text-[0.78rem]">
                <thead>
                  <tr className="text-[0.68rem] text-mist text-left">
                    <th className="font-medium pb-1.5">Campaign</th>
                    <th className="font-medium pb-1.5 text-right">Raised</th>
                    <th className="font-medium pb-1.5 text-right hidden md:table-cell">Cost</th>
                    <th className="font-medium pb-1.5 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {sentCampaigns.map((x) => (
                    <tr key={x.id} onClick={() => app.open("campaign", x.id, x.name)} className="border-t border-rule-soft cursor-pointer hover:bg-paper">
                      <td className="py-1.5 pr-2 text-ink">{x.name}</td>
                      <td className="py-1.5 text-right font-mono text-ink-soft">{peso(x.raised)}</td>
                      <td className="py-1.5 text-right font-mono text-mist hidden md:table-cell">{peso(x.cost)}</td>
                      <td className="py-1.5 text-right font-mono text-ink">{x.raised && x.cost ? `${(x.raised / x.cost).toFixed(1)}x` : <span className="text-mist">No ask</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 pt-2 border-t border-rule-soft text-[0.7rem] text-mist">
                {`${peso(sentCampaigns.reduce((s, x) => s + x.raised, 0))} raised on ${peso(sentCampaigns.reduce((s, x) => s + x.cost, 0))} spent on design and boosted posts`}
              </p>
            </Panel>
            <Panel title="Data cleanup" action={dupes.length > 1 && <SmallButton onClick={() => merge(dupes)}>Merge all</SmallButton>}>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[["Duplicates merged", merged.toLocaleString()], ["Phones fixed", "318"], ["Emails verified", "4,612"]].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-paper border border-rule-soft px-2.5 py-2">
                    <div className="text-[0.66rem] text-mist">{label}</div>
                    <div className="font-mono text-[0.92rem] text-ink mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              <Label>Possible duplicates</Label>
              <ul className="flex flex-col divide-y divide-rule-soft">
                {dupes.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 py-2">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.78rem] text-ink truncate">{`${d.name} → ${contact(d.keepId)?.name}`}</span>
                      <span className="block text-[0.66rem] text-mist truncate">{`${d.reason} · ${d.email} · from ${d.source}`}</span>
                    </span>
                    <SmallButton onClick={() => merge([d])}>Merge</SmallButton>
                  </li>
                ))}
                {dupes.length === 0 && <Empty>No duplicates left. New records are checked on entry.</Empty>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Tasks and meetings ---- */}
      {app.screen === "tasks" && (
        <>
          <ScreenHeader
            title="Tasks"
            subtitle={`${dueToday.length} due today · ${overdue.length} overdue · ${meetings.filter((m) => !m.done).length} meetings this week`}
            action={<PrimaryButton onClick={() => openTask()}><Plus size={14} /> Create task</PrimaryButton>}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
            <div>
              <div className="mb-3">
                <Segmented id="hs-tasks" value={taskView} onChange={setTaskView} options={[{ id: "today", label: "Due today" }, { id: "overdue", label: "Overdue" }, { id: "upcoming", label: "Upcoming" }, { id: "done", label: "Completed" }]} />
              </div>
              <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule-soft">
                {tasks
                  .filter((t) => (taskView === "done" ? t.done : !t.done && (taskView === "today" ? t.due === TODAY : taskView === "overdue" ? t.due < TODAY : t.due > TODAY)))
                  .sort((a, b) => a.due.localeCompare(b.due))
                  .map(taskRow)}
                {tasks.every((t) => (taskView === "done" ? !t.done : t.done || (taskView === "today" ? t.due !== TODAY : taskView === "overdue" ? t.due >= TODAY : t.due <= TODAY))) && (
                  <li className="px-3 py-6 text-center text-[0.8rem] text-mist">Nothing here. Nice work.</li>
                )}
              </ul>
            </div>
            <Panel title="Meetings">
              <Rows>
                {meetings.map((m) => {
                  const mc = contact(m.contactId);
                  return (
                    <li key={m.id} className="py-2.5 flex gap-2.5">
                      <span className="w-8 h-8 rounded-md bg-gold-wash text-gold flex items-center justify-center shrink-0"><CalendarDays size={14} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8rem] text-ink">{m.title}</span>
                        <span className="block text-[0.68rem] text-mist">{`${m.when} · ${m.where}`}</span>
                        <span className="flex flex-wrap items-center gap-2 mt-1.5 text-[0.72rem]">
                          {mc && <LinkText onClick={() => app.open("contact", mc.id, mc.name)}>{mc.name}</LinkText>}
                          {m.done ? <Status tone="good">Logged</Status> : <SmallButton onClick={() => openTalk(m.contactId, m.id)}>Log outcome</SmallButton>}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </Rows>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Contacts ---- */}
      {app.screen === "contacts" && (
        <>
          <ScreenHeader
            title="Contacts"
            subtitle={`${(HIDDEN + contacts.length).toLocaleString()} contacts · one record per donor`}
            action={<PrimaryButton onClick={() => setModal("contact")}><UserPlus size={14} /> Add contact</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={cQuery} onChange={setCQuery} placeholder="Search name, email, city, company" />
            <Segmented id="hs-contacts" value={cFilter} onChange={setCFilter} options={[{ id: "all", label: "All" }, { id: "major", label: "Major" }, { id: "monthly", label: "Monthly" }, { id: "lapsed", label: "Lapsed" }, { id: "volunteers", label: "Volunteers" }]} />
          </div>
          <Table
            rows={contacts.filter((x) => inFilter(x, cFilter) && `${x.name} ${x.email} ${x.city} ${company(x.companyId)?.name ?? ""}`.toLowerCase().includes(cQuery.toLowerCase()))}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("contact", r.id, r.name)}
            empty="No contacts match."
            columns={[
              {
                key: "name",
                label: "Name",
                render: (r) => (
                  <span className="flex items-center gap-2">
                    <Avatar name={r.name} size={24} />
                    <span className="min-w-0">
                      <span className="block text-ink truncate">{r.name}</span>
                      <span className="block text-[0.68rem] text-mist truncate">{r.email}</span>
                    </span>
                  </span>
                ),
              },
              { key: "stage", label: "Lifecycle stage", render: (r) => <Status tone={lifeTone(r.lifecycle)}>{r.lifecycle}</Status> },
              { key: "company", label: "Company", hideOnMobile: true, render: (r) => company(r.companyId)?.name ?? <span className="text-mist">Individual</span> },
              { key: "given", label: "Given this year", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono">{peso(r.givenYtd)}</span> },
              { key: "last", label: "Last activity", hideOnMobile: true, render: (r) => r.lastActivity },
            ]}
          />
        </>
      )}

      {app.screen === "contact" && c && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Avatar name={c.name} size={44} />
            <div className="flex-1 min-w-0">
              <ProtoHeading className="text-[1.25rem] leading-tight font-semibold text-ink tracking-[-0.01em]">{c.name}</ProtoHeading>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <Status tone={lifeTone(c.lifecycle)}>{c.lifecycle}</Status>
                {company(c.companyId) && <span className="text-[0.72rem] text-graphite">{`${c.role} · ${company(c.companyId)?.name}`}</span>}
                <span className="text-[0.72rem] text-mist">{c.email}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <SmallButton onClick={() => openTalk(c.id)}><Phone size={12} /> Log call</SmallButton>
              <SmallButton onClick={() => openTask(c.id)}><Plus size={12} /> Create task</SmallButton>
              <SmallButton
                onClick={() => {
                  logActivity(c.id, "Email", "Sent: A personal note from Tess");
                  app.notify(`Email sent to ${c.email} and logged on the timeline`);
                }}
              ><Mail size={12} /> Email</SmallButton>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Properties">
                <KeyValues
                  items={[
                    ["Phone", c.phone],
                    ["Mailing address", c.address],
                    [
                      "Lifecycle stage",
                      <select
                        key="lc"
                        aria-label="Lifecycle stage"
                        value={c.lifecycle}
                        onChange={(e) => {
                          patchContact(c.id, { lifecycle: e.target.value as Lifecycle });
                          app.notify(`${first(c.name)} is now ${e.target.value}. Lists and workflows follow.`);
                        }}
                        className={selectSm}
                      >{LIFECYCLES.map((s) => (<option key={s}>{s}</option>))}</select>,
                    ],
                    [
                      "Contact owner",
                      <select
                        key="ow"
                        aria-label="Contact owner"
                        value={c.owner}
                        onChange={(e) => {
                          const owner = e.target.value;
                          patchContact(c.id, { owner });
                          setTasks((list) => list.map((t) => (t.contactId === c.id && !t.done ? { ...t, owner } : t)));
                          app.notify(`${first(c.name)} assigned to ${owner}. Open tasks moved too.`);
                        }}
                        className={selectSm}
                      >{OWNERS.map((o) => (<option key={o}>{o}</option>))}</select>,
                    ],
                    ["Usual payment", c.method === "None" ? "No gifts yet" : c.method],
                    ["Given this year", <span key="g" className="font-mono">{peso(c.givenYtd)}</span>],
                    ["Lifetime giving", <span key="lt" className="font-mono">{peso(c.givenLife)}</span>],
                    ["Contact since", `${MONTHS[Number(c.joined.slice(5, 7)) - 1]} ${c.joined.slice(0, 4)}`],
                  ]}
                />
                <p className="mt-3 pt-3 border-t border-rule-soft text-[0.7rem] text-mist">{`One record, merged from ${c.sources.join(", ")}.`}</p>
              </Panel>
              <Panel title="Associations">
                <Label>Company</Label>
                {company(c.companyId) ? (
                  <Rows><RowLink title={company(c.companyId)!.name} meta={`${company(c.companyId)!.type} · ${c.role}`} onClick={() => app.open("company", c.companyId, company(c.companyId)?.name)} /></Rows>
                ) : (<SmallButton onClick={() => openAssoc(c.id, companies[0].id)}><Building2 size={12} /> Associate company</SmallButton>)}
                <Label>Deals</Label>
                <Rows>
                  {deals
                    .filter((d) => d.contactId === c.id)
                    .map((d) => (<RowLink key={d.id} title={d.name} meta={`${d.stage} · close ${d.close}`} right={peso(d.amount)} onClick={() => app.open("deal", d.id, d.name)} />))}
                  {deals.every((d) => d.contactId !== c.id) && <Empty>No deals yet.</Empty>}
                </Rows>
                <Label>Tickets</Label>
                <Rows>
                  {tickets
                    .filter((t) => t.contactId === c.id)
                    .map((t) => (<RowLink key={t.id} title={t.subject} meta={`${t.status} · ${t.category}`} onClick={() => app.open("ticket", t.id, t.subject)} />))}
                  {tickets.every((t) => t.contactId !== c.id) && <Empty>No tickets.</Empty>}
                </Rows>
                <Label>Lists</Label>
                <div className="flex flex-wrap gap-1.5">
                  {lists
                    .filter((x) => membersOf(x).some((m) => m.id === c.id))
                    .map((x) => (
                      <button key={x.id} type="button" onClick={() => app.open("list", x.id, x.name)} className="px-2 py-0.5 rounded-md bg-raised text-[0.7rem] text-ink-soft hover:text-ink cursor-pointer">{x.name}</button>
                    ))}
                </div>
              </Panel>
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Open tasks" action={<SmallButton onClick={() => openTask(c.id)}><Plus size={12} /> Add</SmallButton>}>
                <ul className="-m-3.5 divide-y divide-rule-soft">
                  {tasks.filter((t) => t.contactId === c.id && !t.done).map(taskRow)}
                  {tasks.every((t) => t.contactId !== c.id || t.done) && <li className="px-3 py-3 text-[0.78rem] text-graphite">No open tasks.</li>}
                </ul>
              </Panel>
              <Panel
                title="Activity timeline"
                action={<Segmented id="hs-tl" value={tl} onChange={setTl} options={[{ id: "all", label: "All" }, { id: "gift", label: "Gifts" }, { id: "email", label: "Emails" }, { id: "talk", label: "Calls" }]} />}
              >
                <Timeline items={acts.filter((a) => a.contactId === c.id && (tl === "all" || (tl === "gift" ? a.kind === "Gift" : tl === "email" ? a.kind === "Email" || a.kind === "Form" : ["Call", "Meeting", "Note"].includes(a.kind))))} />
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---- Companies ---- */}
      {app.screen === "companies" && (
        <>
          <ScreenHeader
            title="Companies"
            subtitle="Churches, corporate partners and foundations, each with its people and gifts"
            action={<PrimaryButton onClick={() => setModal("company")}><Plus size={14} /> Add company</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={coQuery} onChange={setCoQuery} placeholder="Search name, city, domain" />
            <Segmented id="hs-co" value={coFilter} onChange={setCoFilter} options={[{ id: "all", label: "All" }, { id: "Church", label: "Churches" }, { id: "Corporate partner", label: "Corporate" }, { id: "Foundation", label: "Foundations" }]} />
          </div>
          <Table
            rows={companies.filter((x) => (coFilter === "all" || x.type === coFilter) && `${x.name} ${x.city} ${x.domain}`.toLowerCase().includes(coQuery.toLowerCase()))}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("company", r.id, r.name)}
            empty="No companies match."
            columns={[
              {
                key: "name",
                label: "Company",
                render: (r) => (
                  <span className="min-w-0">
                    <span className="block text-ink truncate">{r.name}</span>
                    <span className="block text-[0.68rem] text-mist truncate">{r.domain}</span>
                  </span>
                ),
              },
              { key: "type", label: "Type", render: (r) => <Status tone="muted">{r.type}</Status> },
              { key: "city", label: "City", hideOnMobile: true, render: (r) => r.city },
              { key: "people", label: "Contacts", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono">{contacts.filter((x) => x.companyId === r.id).length}</span> },
              { key: "given", label: "Given this year", align: "right", render: (r) => <span className="font-mono">{peso(r.givenYtd)}</span> },
            ]}
          />
        </>
      )}

      {app.screen === "company" && co && (
        <>
          <ScreenHeader
            title={co.name}
            subtitle={`${co.type} · ${co.city} · ${co.domain}`}
            action={<SmallButton onClick={() => openAssoc((contacts.find((x) => !x.companyId) ?? contacts.find((x) => x.companyId !== co.id))?.id ?? "", co.id)}><UserPlus size={12} /> Associate contact</SmallButton>}
          />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Given this year" value={peso(co.givenYtd)} sub={`Partner since ${co.since}`} />
            <Stat label="Contacts" value={String(contacts.filter((x) => x.companyId === co.id).length)} />
            <Stat label="Open deals" value={peso(openDeals.filter((d) => d.companyId === co.id).reduce((s, d) => s + d.amount, 0))} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="About"><KeyValues items={[["Type", co.type], ["City", co.city], ["Domain", co.domain], ["Owner", co.owner], ["Partner since", co.since], ["Notes", co.note]]} /></Panel>
            <Panel title="People">
              <Rows>
                {contacts
                  .filter((x) => x.companyId === co.id)
                  .map((x) => (<RowLink key={x.id} title={x.name} meta={`${x.role ?? "Contact"} · ${x.lifecycle}`} right={peso(x.givenYtd)} onClick={() => app.open("contact", x.id, x.name)} />))}
                {contacts.every((x) => x.companyId !== co.id) && <Empty>No contacts yet. Associate one to see their activity here.</Empty>}
              </Rows>
              <Label>Deals</Label>
              <Rows>
                {deals
                  .filter((d) => d.companyId === co.id)
                  .map((d) => (<RowLink key={d.id} title={d.name} meta={`${d.stage} · close ${d.close}`} right={peso(d.amount)} onClick={() => app.open("deal", d.id, d.name)} />))}
                {deals.every((d) => d.companyId !== co.id) && <Empty>No deals yet.</Empty>}
              </Rows>
            </Panel>
            <Panel title="Activity timeline" className="lg:col-span-2"><Timeline items={acts.filter((a) => contact(a.contactId)?.companyId === co.id)} who={(a) => contact(a.contactId)?.name} /></Panel>
          </div>
        </>
      )}

      {/* ---- Lists ---- */}
      {app.screen === "lists" && (
        <>
          <ScreenHeader title="Lists" subtitle="Active lists update the moment a record changes" action={<PrimaryButton onClick={() => setModal("list")}><Plus size={14} /> Create list</PrimaryButton>} />
          <div className="mb-3"><Segmented id="hs-lists" value={listFilter} onChange={setListFilter} options={[{ id: "all", label: "All lists" }, { id: "Active", label: "Active" }, { id: "Static", label: "Static" }]} /></div>
          <Table
            rows={lists.filter((x) => listFilter === "all" || x.kind === listFilter)}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("list", r.id, r.name)}
            columns={[
              {
                key: "name",
                label: "List",
                render: (r) => (
                  <span className="min-w-0">
                    <span className="block text-ink">{r.name}</span>
                    <span className="block text-[0.68rem] text-mist">{rulesText(r)}</span>
                  </span>
                ),
              },
              { key: "kind", label: "Type", render: (r) => <Status tone={r.kind === "Active" ? "good" : "muted"}>{r.kind}</Status> },
              { key: "used", label: "Used in", hideOnMobile: true, render: (r) => (usedIn(r).length ? `${usedIn(r).length} ${usedIn(r).length === 1 ? "asset" : "assets"}` : <span className="text-mist">Not used</span>) },
              { key: "count", label: "Contacts", align: "right", render: (r) => <span className="font-mono text-ink">{countOf(r).toLocaleString()}</span> },
            ]}
          />
        </>
      )}

      {app.screen === "list" && l && (
        <>
          <ScreenHeader
            title={l.name}
            subtitle={`${l.kind} list · owned by ${l.owner}`}
            action={
              <>
                {l.kind === "Active" && (
                  <SmallButton
                    onClick={() => {
                      setRDraft(["metro", "ewallet", "engaged", ...CONDITIONS.map((x) => x.id)].find((id) => !l.rules.includes(id)) ?? "metro");
                      setModal("rule");
                    }}
                  ><Plus size={12} /> Add rule</SmallButton>
                )}
                <PrimaryButton onClick={() => openEmail(l.id)}><Mail size={13} /> Email this list</PrimaryButton>
              </>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3 mb-3">
            <Panel title="Rules" action={l.kind === "Active" ? <Status tone="good">Live count</Status> : <Status tone="muted">Static</Status>}>
              {l.kind === "Static" ? (<p className="text-[0.78rem] text-graphite">Members are added by hand or from an import, and stay until removed.</p>) : (
                <ul className="flex flex-col gap-1.5">
                  {l.rules.map((r, i) => (
                    <li key={r} className="flex items-center gap-2">
                      <span className="w-10 text-[0.64rem] font-semibold text-mist">{i === 0 ? "Where" : "And"}</span>
                      <span className="flex-1 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-rule bg-paper text-[0.78rem] text-ink-soft">
                        {cond(r).label}
                        <button
                          type="button"
                          aria-label={`Remove rule: ${cond(r).label}`}
                          disabled={l.rules.length === 1}
                          onClick={() => setRules(l, l.rules.filter((x) => x !== r), "removed")}
                          className="text-mist hover:text-danger disabled:opacity-30 disabled:cursor-default cursor-pointer"
                        ><X size={13} /></button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 pt-3 border-t border-rule-soft flex items-baseline gap-2">
                <span className="text-[1.4rem] font-semibold text-ink tabular-nums">{countOf(l).toLocaleString()}</span>
                <span className="text-[0.74rem] text-mist">contacts match right now</span>
              </div>
            </Panel>
            <Panel title="Used in">
              <Rows>
                {campaigns
                  .filter((x) => x.listId === l.id)
                  .map((x) => (<RowLink key={x.id} title={x.name} meta={`Email · ${x.status} ${x.date}`} onClick={() => app.open("campaign", x.id, x.name)} />))}
                {forms
                  .filter((f) => f.listId === l.id)
                  .map((f) => (<RowLink key={f.id} title={f.name} meta="Form · adds new contacts here" onClick={() => app.open("form", f.id, f.name)} />))}
                {l.id === "l3" && <RowLink title="Lapsed donor win-back" meta="Workflow · enrolls everyone who joins" onClick={() => app.open("workflow", "f3", "Lapsed donor win-back")} />}
                {usedIn(l).length === 0 && <Empty>Not used yet. Email it or enroll it in a workflow.</Empty>}
              </Rows>
            </Panel>
          </div>
          <Table
            rows={membersOf(l)}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("contact", r.id, r.name)}
            empty="No sample contacts match these rules."
            columns={[
              { key: "name", label: "Contact", render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={22} /><span className="text-ink">{r.name}</span></span> },
              { key: "stage", label: "Lifecycle stage", render: (r) => <Status tone={lifeTone(r.lifecycle)}>{r.lifecycle}</Status> },
              { key: "city", label: "City", hideOnMobile: true, render: (r) => r.city },
              { key: "given", label: "Given this year", align: "right", render: (r) => <span className="font-mono">{peso(r.givenYtd)}</span> },
            ]}
          />
        </>
      )}

      {/* ---- Deals ---- */}
      {app.screen === "pipeline" && (
        <>
          <ScreenHeader
            title="Major gifts"
            subtitle={`${peso(openDeals.reduce((s, d) => s + d.amount, 0))} open · ${peso(weighted)} weighted forecast`}
            action={<PrimaryButton onClick={() => setModal("deal")}><Plus size={14} /> Create deal</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <Segmented id="hs-owner" value={mine} onChange={setMine} options={[{ id: "all", label: "All owners" }, { id: "mine", label: "My deals" }]} />
            <span className="text-[0.7rem] text-mist">Arrows move a gift to the next or previous stage</span>
          </div>
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="grid grid-cols-5 gap-2 min-w-[50rem]">
              {STAGES.map((stage, si) => {
                const inStage = deals.filter((d) => d.stage === stage && (mine === "all" || d.owner === ME));
                return (
                  <div key={stage} className="bg-raised border border-rule rounded-lg p-2 min-h-[24rem]">
                    <div className="px-1 mb-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[0.75rem] font-semibold text-ink">{stage}</span>
                        <span className="text-[0.62rem] text-mist">{`${PROB[stage]}%`}</span>
                      </div>
                      <div className="font-mono text-[0.64rem] text-graphite mt-0.5">{`${peso(inStage.reduce((s, d) => s + d.amount, 0))} · ${inStage.length}`}</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {inStage.map((d) => (
                        <motion.div key={d.id} layout layoutId={`hs-deal-${d.id}`} transition={{ type: "spring", stiffness: 420, damping: 36 }} className="bg-sheet border border-rule rounded-md p-2 shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-gold/60 transition-colors">
                          <button type="button" onClick={() => app.open("deal", d.id, d.name)} className="block w-full text-left cursor-pointer">
                            <span className="block text-[0.74rem] font-medium text-ink leading-tight">{d.name}</span>
                            <span className="block text-[0.64rem] text-mist mt-0.5 truncate">{company(d.companyId)?.name ?? contact(d.contactId)?.name}</span>
                          </button>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="font-mono text-[0.64rem] text-ink-soft">{peso(d.amount)}</span>
                            <span className="text-[0.6rem] text-mist">{d.close}</span>
                          </div>
                          <div className="flex justify-between mt-1.5 pt-1.5 border-t border-rule-soft">
                            <button type="button" disabled={si === 0} onClick={() => setStage(d, STAGES[si - 1])} aria-label={`Move ${d.name} back to ${STAGES[Math.max(0, si - 1)]}`} className="w-6 h-5 rounded flex items-center justify-center text-graphite hover:bg-raised hover:text-ink disabled:opacity-25 disabled:cursor-default cursor-pointer">
                              <ChevronLeft size={13} />
                            </button>
                            <button type="button" disabled={si === STAGES.length - 1} onClick={() => setStage(d, STAGES[si + 1])} aria-label={`Move ${d.name} to ${STAGES[Math.min(STAGES.length - 1, si + 1)]}`} className="w-6 h-5 rounded flex items-center justify-center text-gold-bright hover:bg-raised hover:text-ink disabled:opacity-25 disabled:cursor-default cursor-pointer">
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </motion.div>
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
          <ScreenHeader
            title={deal.name}
            subtitle={`${peso(deal.amount)} · ${company(deal.companyId)?.name ?? contact(deal.contactId)?.name} · close ${deal.close}`}
            action={<SmallButton onClick={() => openTask(deal.contactId, deal.id)}><Plus size={12} /> Create task</SmallButton>}
          />
          <Panel title="Stage" className="mb-3" action={<span className="text-[0.7rem] text-mist">{`${PROB[deal.stage]}% likely · ${peso((deal.amount * PROB[deal.stage]) / 100)} weighted`}</span>}>
            <div className="grid grid-cols-5 gap-1">
              {STAGES.map((s, i) => (
                <button key={s} type="button" aria-pressed={deal.stage === s} onClick={() => setStage(deal, s)} className="text-left cursor-pointer group">
                  <span className={cn("block h-1.5 rounded-full transition-colors", STAGES.indexOf(deal.stage) >= i ? "bg-gold" : "bg-rule group-hover:bg-gold/40")} />
                  <span className={cn("block mt-1.5 text-[0.7rem]", deal.stage === s ? "text-gold-bright font-semibold" : "text-graphite")}>{s}</span>
                </button>
              ))}
            </div>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Next steps">
              <p className="text-[0.78rem] text-ink-soft mb-2.5">
                <span className="text-mist">Suggested: </span>
                {NEXT[deal.stage]}
              </p>
              <ul className="border border-rule-soft rounded-md divide-y divide-rule-soft mb-2.5">
                {tasks.filter((t) => t.dealId === deal.id).map(taskRow)}
                {tasks.every((t) => t.dealId !== deal.id) && <li className="px-3 py-2.5 text-[0.78rem] text-graphite">No steps yet.</li>}
              </ul>
              <form onSubmit={(e) => { e.preventDefault(); addNextStep(deal); }} className="flex gap-2">
                <input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Add a next step, or use the suggestion" aria-label="Next step" className={inputClass} />
                <PrimaryButton type="submit">Add</PrimaryButton>
              </form>
            </Panel>
            <Panel title="Details">
              <KeyValues
                items={[
                  ["Donor", <LinkText key="d" onClick={() => app.open("contact", deal.contactId, contact(deal.contactId)?.name)}>{contact(deal.contactId)?.name}</LinkText>],
                  ["Company", company(deal.companyId) ? <LinkText key="c" onClick={() => app.open("company", deal.companyId, company(deal.companyId)?.name)}>{company(deal.companyId)?.name}</LinkText> : "Individual gift"],
                  ["Amount", <span key="a" className="font-mono">{peso(deal.amount)}</span>],
                  ["Purpose", deal.purpose],
                  ["Expected close", deal.close],
                  ["Deal owner", deal.owner],
                ]}
              />
            </Panel>
            <Panel title="Stage history">
              <ol className="flex flex-col gap-2">
                {[...deal.history].reverse().map((h, i) => (
                  <li key={`${h}-${i}`} className="flex items-center gap-2 text-[0.78rem] text-ink-soft">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", i === 0 ? "bg-gold" : "bg-rule")} aria-hidden />
                    {h}
                  </li>
                ))}
              </ol>
            </Panel>
            <Panel title="Recent activity"><Timeline items={acts.filter((a) => a.contactId === deal.contactId).slice(0, 4)} /></Panel>
          </div>
        </>
      )}

      {/* ---- Marketing ---- */}
      {app.screen === "campaigns" && (
        <>
          <ScreenHeader
            title="Marketing"
            subtitle={{ email: "Every send goes to a list, never the whole database", forms: "Forms create or update contacts, never duplicates", landing: "hopeph.org/scholars · published Oct 1" }[mTab]}
            action={
              mTab === "email" ? (<PrimaryButton onClick={() => openEmail()}><Plus size={14} /> Create email</PrimaryButton>) : mTab === "landing" ? (
                <SmallButton onClick={() => app.notify("Link copied: hopeph.org/scholars")}><Share2 size={12} /> Copy link</SmallButton>
              ) : undefined
            }
          />
          <div className="mb-3"><Segmented id="hs-mkt" value={mTab} onChange={setMTab} options={[{ id: "email", label: "Email" }, { id: "forms", label: "Forms" }, { id: "landing", label: "Landing page" }]} /></div>
          {mTab === "email" && (
            <Table
              rows={campaigns}
              rowKey={(r) => r.id}
              onRowClick={(r) => app.open("campaign", r.id, r.name)}
              columns={[
                {
                  key: "name",
                  label: "Email",
                  render: (r) => (
                    <span className="min-w-0">
                      <span className="block text-ink">{r.name}</span>
                      <span className="block text-[0.68rem] text-mist truncate">{r.test ? `A/B · ${r.subject}` : r.subject}</span>
                    </span>
                  ),
                },
                { key: "list", label: "List", hideOnMobile: true, render: (r) => listOf(r.listId)?.name },
                { key: "status", label: "Status", render: (r) => <Status tone={campTone(r.status)}>{`${r.status} · ${r.date}`}</Status> },
                { key: "open", label: "Open", align: "right", render: (r) => (r.status === "Sent" ? <span className="font-mono text-ink">{`${r.open}%`}</span> : <span className="text-mist">Not yet</span>) },
                { key: "raised", label: "Raised", align: "right", hideOnMobile: true, render: (r) => (r.status === "Sent" ? <span className="font-mono">{peso(r.raised)}</span> : <span className="text-mist">Not yet</span>) },
              ]}
            />
          )}
          {mTab === "forms" && (
            <Table
              rows={forms}
              rowKey={(r) => r.id}
              onRowClick={(r) => app.open("form", r.id, r.name)}
              columns={[
                {
                  key: "name",
                  label: "Form",
                  render: (r) => (
                    <span className="min-w-0">
                      <span className="block text-ink">{r.name}</span>
                      <span className="block text-[0.68rem] text-mist">{r.where}</span>
                    </span>
                  ),
                },
                { key: "after", label: "After submit", hideOnMobile: true, render: (r) => (r.ticket ? "Opens a donor care ticket" : `Adds to ${listOf(r.listId)?.name}`) },
                { key: "subs", label: "Submissions", align: "right", render: (r) => <span className="font-mono">{formCount(r).toLocaleString()}</span> },
                { key: "rate", label: "Conversion", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono">{`${((formCount(r) / r.views) * 100).toFixed(1)}%`}</span> },
              ]}
            />
          )}
          {mTab === "landing" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3">
              <div className="bg-sheet border border-rule rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-center gap-2 px-3 h-8 border-b border-rule bg-paper">
                  <span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => (<span key={i} className="w-2 h-2 rounded-full bg-rule" />))}</span>
                  <span className="flex-1 text-center font-mono text-[0.66rem] text-mist">hopeph.org/scholars</span>
                </div>
                <div className="p-4">
                  <div className="h-20 rounded-md bg-gold-wash flex items-end p-2"><span className="text-[0.64rem] text-gold">Photo: scholars at the Tondo learning center</span></div>
                  <ProtoHeading sub className="mt-3 text-[1.05rem] font-semibold text-ink leading-snug">Send a child to school this year</ProtoHeading>
                  <p className="text-[0.76rem] text-graphite mt-1">₱1,000 a month covers a student&apos;s books, fees and a daily meal.</p>
                  <Meter value={pageRaised} max={600000} className="mt-3" />
                  <div className="flex justify-between text-[0.66rem] text-mist mt-1">
                    <span>{`${peso(pageRaised)} raised`}</span>
                    <span>Goal ₱600,000</span>
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); submitLanding(); }} className="mt-3 grid grid-cols-2 gap-2">
                    <input aria-label="Full name" value={lp.name} onChange={(e) => setLp({ ...lp, name: e.target.value })} placeholder="Full name" className={inputClass} />
                    <input aria-label="Email" type="email" value={lp.email} onChange={(e) => setLp({ ...lp, email: e.target.value })} placeholder="Email" className={inputClass} />
                    <div className="col-span-2 flex flex-wrap gap-1.5">
                      {[500, 1000, 2500, 5000].map((n) => (<Chip key={n} on={lp.amount === n} onClick={() => setLp({ ...lp, amount: n })}>{peso(n)}</Chip>))}
                      <span className="w-px bg-rule mx-1" aria-hidden />
                      {(["Monthly", "Once"] as const).map((f) => (<Chip key={f} on={lp.freq === f} onClick={() => setLp({ ...lp, freq: f })}>{f}</Chip>))}
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-3 mt-1">
                      <PrimaryButton type="submit" disabled={!lp.name.trim() || !lp.email.includes("@")}>{`Give ${peso(lp.amount)}${lp.freq === "Monthly" ? " monthly" : ""}`}</PrimaryButton>
                      <span className="text-[0.64rem] text-mist">GCash, Maya, card or bank transfer</span>
                    </div>
                  </form>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Panel title="Page performance">
                  <KeyValues
                    items={[
                      ["Views, 30 days", "3,412"],
                      ["Submissions", formCount(forms[0]).toLocaleString()],
                      ["Conversion rate", `${((formCount(forms[0]) / 3412) * 100).toFixed(1)}%`],
                      ["Raised on page", <span key="r" className="font-mono">{peso(pageRaised)}</span>],
                      ["After submit", "Monthly partners list, New donor welcome workflow"],
                    ]}
                  />
                </Panel>
                <Panel title="Latest submissions" action={<LinkText onClick={() => app.open("form", "fm1", forms[0].name)}>View all</LinkText>}>
                  <Rows>
                    {subs
                      .filter((s) => s.formId === "fm1")
                      .slice(0, 4)
                      .map((s) => (<RowLink key={s.id} title={s.name} meta={`${s.detail} · ${s.date}`} onClick={() => s.contactId && app.open("contact", s.contactId, s.name)} />))}
                  </Rows>
                </Panel>
              </div>
            </div>
          )}
        </>
      )}

      {app.screen === "campaign" && k && (
        <>
          <ScreenHeader
            title={k.name}
            subtitle={`${listOf(k.listId)?.name} · ${k.status === "Sent" ? "Sent" : k.status === "Scheduled" ? "Scheduled for" : "Draft for"} ${k.date}, ${k.time}`}
            action={
              k.status === "Sent" ? (<SmallButton onClick={() => duplicate(k)}>Duplicate</SmallButton>) : (
                <>
                  <SmallButton onClick={() => app.notify("Test sent to tess@hopeph.org")}>Send test</SmallButton>
                  {k.status === "Draft" ? (
                    <PrimaryButton
                      onClick={() => {
                        patchIn(setCampaigns, k.id, { status: "Scheduled" });
                        app.notify(`${k.name} scheduled for ${k.date}, ${k.time}`);
                      }}
                    ><Clock size={13} /> Schedule</PrimaryButton>
                  ) : (
                    <>
                      <SmallButton
                        onClick={() => {
                          patchIn(setCampaigns, k.id, { status: "Draft" });
                          app.notify(`${k.name} unscheduled. Saved as a draft.`);
                        }}
                      >Unschedule</SmallButton>
                      <PrimaryButton onClick={() => sendNow(k)}><Send size={13} /> Send now</PrimaryButton>
                    </>
                  )}
                </>
              )
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Recipients" value={(k.sent || countOf(listOf(k.listId))).toLocaleString()} sub={k.sent ? "Delivered" : "In the list today"} />
            <Stat label="Opened" value={`${k.open}%`} sub={k.open > 40 ? "Above the 40% list average" : undefined} tone="good" />
            <Stat label="Clicked" value={`${k.click}%`} />
            <Stat label="Raised" value={peso(k.raised)} sub={k.cost ? `${(k.raised / k.cost).toFixed(1)}x return` : undefined} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Audience and send">
              <KeyValues
                items={[
                  ["List", <LinkText key="l" onClick={() => app.open("list", k.listId, listOf(k.listId)?.name)}>{listOf(k.listId)?.name}</LinkText>],
                  ["Who", listOf(k.listId) ? rulesText(listOf(k.listId)!) : ""],
                  ["Contacts", countOf(listOf(k.listId)).toLocaleString()],
                  ["Send time", `${k.date}, ${k.time}, Manila time`],
                  ["Subject", k.subject],
                ]}
              />
              <p className="mt-3 text-[0.7rem] text-mist">Contacts on Board and advisors are left out. Each list gets its own version of an appeal.</p>
            </Panel>
            <Panel title="A/B subject test">
              {k.test ? (
                <div className="flex flex-col gap-3">
                  {(["a", "b"] as const).map((v) => {
                    const t = k.test!;
                    const rate = v === "a" ? t.aOpen : t.bOpen;
                    const win = k.status === "Sent" && rate === Math.max(t.aOpen, t.bOpen);
                    return (
                      <div key={v}>
                        <div className="flex justify-between gap-2 text-[0.78rem]">
                          <span className="text-ink-soft min-w-0">
                            <span className="font-mono text-mist mr-1.5">{v.toUpperCase()}</span>
                            {v === "a" ? t.a : t.b}
                          </span>
                          <span className="font-mono text-ink shrink-0">{k.status === "Sent" ? `${rate}%` : "Pending"}</span>
                        </div>
                        <Meter value={rate} max={100} className="mt-1.5" />
                        {win && (<div className="mt-1.5"><Status tone="good">Winner · sent to the remaining 80%</Status></div>)}
                      </div>
                    );
                  })}
                  <p className="text-[0.7rem] text-mist">10% of the list gets each version. The better open rate after 4 hours goes to everyone else.</p>
                </div>
              ) : (<p className="text-[0.8rem] text-graphite">No test on this send. Add a second subject line when creating an email to split-test it.</p>)}
            </Panel>
          </div>
        </>
      )}

      {app.screen === "form" && fm && (
        <>
          <ScreenHeader
            title={fm.name}
            subtitle={`Lives on ${fm.where} · ${fm.views.toLocaleString()} views in 30 days`}
            action={
              fm.id === "fm1" ? (
                <SmallButton
                  onClick={() => {
                    setMTab("landing");
                    app.section("campaigns");
                  }}
                >Preview page</SmallButton>
              ) : undefined
            }
          />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Submissions" value={formCount(fm).toLocaleString()} sub="Last 90 days" />
            <Stat label="Conversion rate" value={`${((formCount(fm) / fm.views) * 100).toFixed(1)}%`} />
            <Stat label="New contacts" value="62%" sub="The rest matched a record" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <Panel title="Fields">
              <div className="flex flex-col gap-2">
                {fm.fields.map((f) => (
                  <div key={f}>
                    <div className="text-[0.7rem] text-ink-soft mb-1">{f}</div>
                    <div className="h-7 rounded-md border border-rule bg-paper" />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="After submit">
              <KeyValues
                items={[
                  ["Matches on", "Email, then phone"],
                  ["Adds to list", listOf(fm.listId) ? <LinkText key="l" onClick={() => app.open("list", fm.listId, listOf(fm.listId)?.name)}>{listOf(fm.listId)?.name}</LinkText> : "None"],
                  ["Starts workflow", flowOf(fm.flowId) ? <LinkText key="f" onClick={() => app.open("workflow", fm.flowId, flowOf(fm.flowId)?.name)}>{flowOf(fm.flowId)?.name}</LinkText> : "None"],
                  ["Ticket", fm.ticket ? "Opens one in Donor care" : "No"],
                  [
                    "Notify owner",
                    <Toggle
                      key="n"
                      on={fm.notify}
                      label="Notify the contact owner"
                      onChange={(on) => {
                        patchIn(setForms, fm.id, { notify: on });
                        app.notify(on ? "Owners get an email for each submission" : "Owner emails turned off for this form");
                      }}
                    />,
                  ],
                ]}
              />
            </Panel>
          </div>
          <Table
            rows={subs.filter((s) => s.formId === fm.id)}
            rowKey={(r) => r.id}
            onRowClick={(r) => r.contactId && app.open("contact", r.contactId, r.name)}
            empty="No submissions in the demo yet."
            columns={[
              { key: "name", label: "Submitted by", render: (r) => <span className="text-ink">{r.name}</span> },
              { key: "detail", label: "Details", render: (r) => r.detail },
              { key: "date", label: "Date", align: "right", render: (r) => r.date },
            ]}
          />
        </>
      )}

      {/* ---- Workflows ---- */}
      {app.screen === "automations" && (
        <>
          <ScreenHeader
            title="Workflows"
            subtitle={`${flows.filter((f) => f.on).length} of ${flows.length} on · ${flows
              .filter((f) => f.on)
              .reduce((s, f) => s + f.enrolled, 0)
              .toLocaleString()} contacts enrolled`}
            action={<PrimaryButton onClick={() => setModal("flow")}><Plus size={14} /> Create workflow</PrimaryButton>}
          />
          <div className="flex flex-col gap-2.5">
            {flows.map((f) => (
              <div key={f.id} className="bg-sheet border border-rule rounded-lg p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => app.open("workflow", f.id, f.name)} className="flex-1 min-w-0 text-left cursor-pointer group">
                    <span className="block text-[0.85rem] font-semibold text-ink group-hover:text-gold-bright">{f.name}</span>
                    <span className="block text-[0.72rem] text-mist mt-0.5">{`When: ${f.trigger}`}</span>
                  </button>
                  <Status tone={f.on ? "good" : "muted"}>{f.on ? "On" : "Off"}</Status>
                  <Toggle on={f.on} onChange={() => toggleFlow(f)} label={`Turn ${f.name} ${f.on ? "off" : "on"}`} />
                </div>
                <ol className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {f.steps.map((s, i) => {
                    const Icon = STEP_ICON[s.kind];
                    return (
                      <li key={`${s.text}-${i}`} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight size={12} className="text-mist" aria-hidden />}
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[0.7rem]", f.on ? "border-rule bg-paper text-ink-soft" : "border-rule-soft text-mist")}>
                          <Icon size={11} className="text-gold" aria-hidden />
                          {s.text}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="flex flex-wrap gap-x-4 mt-2.5 text-[0.7rem] text-graphite">
                  <span>{`${f.enrolled.toLocaleString()} enrolled`}</span>
                  <span>{`${f.goalRate}% reached the goal: ${f.goal.toLowerCase()}`}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {app.screen === "workflow" && fl && (
        <>
          <ScreenHeader
            title={fl.name}
            subtitle={`When: ${fl.trigger}`}
            action={
              <span className="flex items-center gap-2.5">
                <SmallButton onClick={() => app.notify(`Test run with Joy Dela Cruz: all ${fl.steps.length} steps passed. Nothing was sent.`)}>Test with a contact</SmallButton>
                <Status tone={fl.on ? "good" : "muted"}>{fl.on ? "On" : "Off"}</Status>
                <Toggle on={fl.on} onChange={() => toggleFlow(fl)} label={`Turn ${fl.name} ${fl.on ? "off" : "on"}`} />
              </span>
            }
          />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Enrolled" value={fl.enrolled.toLocaleString()} sub="Since setup" />
            <Stat label="In progress" value={fl.steps.reduce((s, x) => s + x.now, 0).toLocaleString()} sub="Waiting on a step" />
            <Stat label="Reached goal" value={`${fl.goalRate}%`} sub={fl.goal} tone={fl.goalRate > 30 ? "good" : undefined} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
            <Panel title="Steps"><FlowChart flow={fl} /></Panel>
            <Panel title="Settings">
              <KeyValues items={[ ["Re-enrollment", "Off"], ["Left out", "Board and advisors"], ["Send window", "8 AM to 8 PM, weekdays"], ["Owner", "Miguel Torres"], ["Last edited", "Oct 20 by Tess"], ]} />
              <p className="mt-3 pt-3 border-t border-rule-soft text-[0.7rem] text-mist">Turning a workflow off lets enrolled contacts finish their current step. Nobody new joins.</p>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Donor care ---- */}
      {app.screen === "inbox" && (
        <>
          <ScreenHeader title="Donor care" subtitle={`${openTickets.length} open · ${tickets.filter((t) => t.status === "New").length} new · first reply in 1h 40m on average`} />
          <div className="mb-3">
            <Segmented id="hs-tk" value={tkFilter} onChange={setTkFilter} options={[{ id: "open", label: "Open" }, { id: "mine", label: "Mine" }, { id: "unassigned", label: "Unassigned" }, { id: "closed", label: "Closed" }]} />
          </div>
          <Table
            rows={tickets.filter((t) => (tkFilter === "closed" ? t.status === "Closed" : t.status !== "Closed" && (tkFilter === "open" || (tkFilter === "mine" && t.owner === ME) || (tkFilter === "unassigned" && !t.owner))))}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("ticket", r.id, r.subject)}
            empty="No tickets here."
            columns={[
              {
                key: "subject",
                label: "Ticket",
                render: (r) => (
                  <span className="min-w-0">
                    <span className="block text-ink">{r.subject}</span>
                    <span className="block text-[0.68rem] text-mist">{`${contact(r.contactId)?.name} · via ${r.channel}`}</span>
                  </span>
                ),
              },
              { key: "cat", label: "Category", hideOnMobile: true, render: (r) => r.category },
              { key: "status", label: "Status", render: (r) => <Status tone={ticketTone(r.status)}>{r.status}</Status> },
              { key: "owner", label: "Owner", hideOnMobile: true, render: (r) => r.owner || <span className="text-mist">Unassigned</span> },
              { key: "opened", label: "Opened", align: "right", hideOnMobile: true, render: (r) => r.opened },
            ]}
          />
        </>
      )}

      {app.screen === "ticket" &&
        tk &&
        contact(tk.contactId) &&
        (() => {
          const tc = contact(tk.contactId)!;
          const act = ticketAction(tk, tc);
          return (
            <>
              <ScreenHeader
                title={tk.subject}
                subtitle={`${tk.category} · via ${tk.channel} · opened ${tk.opened}`}
                action={
                  <SmallButton
                    onClick={() => {
                      patchIn(setTickets, tk.id, { status: tk.status === "Closed" ? "In progress" : "Closed", owner: tk.owner || ME });
                      app.notify(tk.status === "Closed" ? "Ticket reopened" : `Ticket closed. ${first(tc.name)} gets a short survey.`);
                    }}
                  >{tk.status === "Closed" ? "Reopen" : "Close ticket"}</SmallButton>
                }
              />
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
                <div className="flex flex-col gap-3">
                  {act && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-gold-wash px-3.5 py-3">
                      <act.icon size={16} className="text-gold shrink-0" />
                      <span className="flex-1 min-w-[12rem] text-[0.78rem] text-ink-soft">{act.text}</span>
                      <PrimaryButton onClick={act.run}>{act.label}</PrimaryButton>
                    </div>
                  )}
                  <Panel title="Conversation">
                    <ul className="flex flex-col gap-2.5">
                      {tk.messages.map((m, i) => (
                        <li key={i} className={cn("max-w-[85%] rounded-lg px-3 py-2 text-[0.78rem]", m.from === "donor" ? "self-start bg-raised text-ink-soft" : "self-end bg-gold-wash text-ink")}>
                          <span className="block">{m.text}</span>
                          <span className="block mt-1 text-[0.64rem] text-mist">{`${m.author} · ${m.when}`}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-rule-soft">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          ["Thank you", `Salamat, ${first(tc.name)}! We got your message and will take care of it today.`],
                          ["Receipt timing", "Receipts go out within one working day of the gift. Year-end receipts are ready by January 15."],
                          ["Gift received", `We received your gift. Your record shows ${peso(tc.givenYtd)} given this year.`],
                        ].map(([label, text]) => (<Chip key={label} on={false} onClick={() => setReplies((r) => ({ ...r, [tk.id]: text }))}>{label}</Chip>))}
                      </div>
                      <textarea value={replies[tk.id] ?? ""} onChange={(e) => setReplies((r) => ({ ...r, [tk.id]: e.target.value }))} placeholder={`Reply to ${first(tc.name)}`} aria-label="Reply" className={textareaClass} />
                      <div className="flex justify-end mt-2"><PrimaryButton disabled={!(replies[tk.id] ?? "").trim()} onClick={() => sendReply(tk, tc)}><Send size={13} /> Send reply</PrimaryButton></div>
                    </div>
                  </Panel>
                </div>
                <div className="flex flex-col gap-3">
                  <Panel title="Ticket">
                    <KeyValues
                      items={[
                        [
                          "Status",
                          <select
                            key="s"
                            aria-label="Ticket status"
                            value={tk.status}
                            onChange={(e) => {
                              patchIn(setTickets, tk.id, { status: e.target.value as TicketStatus });
                              app.notify(`Status set to ${e.target.value}`);
                            }}
                            className={selectSm}
                          >{TICKET_STATUSES.map((s) => (<option key={s}>{s}</option>))}</select>,
                        ],
                        [
                          "Owner",
                          <select
                            key="o"
                            aria-label="Ticket owner"
                            value={tk.owner}
                            onChange={(e) => {
                              patchIn(setTickets, tk.id, { owner: e.target.value, status: tk.status === "New" && e.target.value ? "In progress" : tk.status });
                              app.notify(e.target.value ? `Assigned to ${e.target.value}` : "Ticket unassigned");
                            }}
                            className={selectSm}
                          >
                            <option value="">Unassigned</option>
                            {OWNERS.map((o) => (<option key={o}>{o}</option>))}
                          </select>,
                        ],
                        ["Category", tk.category],
                        ["Channel", tk.channel],
                        ["First reply", tk.messages.some((m) => m.from === "team") ? "Done" : "Due within 4 hours"],
                      ]}
                    />
                  </Panel>
                  <Panel title="Donor">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar name={tc.name} size={32} />
                      <span className="min-w-0">
                        <LinkText onClick={() => app.open("contact", tc.id, tc.name)}>{tc.name}</LinkText>
                        <span className="block text-[0.68rem] text-mist">{tc.email}</span>
                      </span>
                    </div>
                    <KeyValues
                      items={[
                        ["Lifecycle", <Status key="l" tone={lifeTone(tc.lifecycle)}>{tc.lifecycle}</Status>],
                        ["Given this year", <span key="g" className="font-mono">{peso(tc.givenYtd)}</span>],
                        ["Usual payment", tc.method === "None" ? "No gifts yet" : tc.method],
                        ["Mailing address", tc.address],
                      ]}
                    />
                  </Panel>
                </div>
              </div>
            </>
          );
        })()}

      {/* ---- Slide-over forms ---- */}
      <ProtoModal
        open={modal === "contact"}
        title="New contact"
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={saveContact} disabled={!cDraft.name.trim() || !cDraft.email.includes("@")}>Add contact</PrimaryButton>}
      >
        <Field label="Full name"><input value={cDraft.name} onChange={(e) => setCDraft({ ...cDraft, name: e.target.value })} className={inputClass} placeholder="Maria Santos" /></Field>
        <Field label="Email"><input type="email" value={cDraft.email} onChange={(e) => setCDraft({ ...cDraft, email: e.target.value })} className={inputClass} placeholder="maria@gmail.com" /></Field>
        <Field label="Lifecycle stage">
          <select value={cDraft.lifecycle} onChange={(e) => setCDraft({ ...cDraft, lifecycle: e.target.value as Lifecycle })} className={inputClass}>{LIFECYCLES.map((s) => (<option key={s}>{s}</option>))}</select>
        </Field>
        <Field label="Company">
          <select value={cDraft.companyId} onChange={(e) => setCDraft({ ...cDraft, companyId: e.target.value })} className={inputClass}>
            <option value="">None, individual donor</option>
            {companies.map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}
          </select>
        </Field>
        <p className="text-[0.7rem] text-mist">An email already on file opens that record instead.</p>
      </ProtoModal>

      <ProtoModal open={modal === "company"} title="New company" onClose={() => setModal(null)} footer={<PrimaryButton onClick={saveCompany} disabled={!coDraft.name.trim()}>Add company</PrimaryButton>}>
        <Field label="Name"><input value={coDraft.name} onChange={(e) => setCoDraft({ ...coDraft, name: e.target.value })} className={inputClass} placeholder="Jesus Is Lord Fellowship Bulacan" /></Field>
        <Field label="Type">
          <select value={coDraft.type} onChange={(e) => setCoDraft({ ...coDraft, type: e.target.value as CompanyType })} className={inputClass}>
            <option>Church</option>
            <option>Corporate partner</option>
            <option>Foundation</option>
          </select>
        </Field>
        <Field label="City"><input value={coDraft.city} onChange={(e) => setCoDraft({ ...coDraft, city: e.target.value })} className={inputClass} placeholder="Malolos" /></Field>
        <Field label="Website domain"><input value={coDraft.domain} onChange={(e) => setCoDraft({ ...coDraft, domain: e.target.value })} className={inputClass} placeholder="church.ph" /></Field>
      </ProtoModal>

      <ProtoModal
        open={modal === "call"}
        title={talk.meetingId ? "Log meeting outcome" : `Log a call with ${contact(talk.contactId)?.name ?? ""}`}
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={saveTalk}>Save to timeline</PrimaryButton>}
      >
        <Field label="Outcome">
          <select value={talk.outcome} onChange={(e) => setTalk({ ...talk, outcome: e.target.value })} className={inputClass}>
            {(talk.meetingId ? ["Went well", "Needs a proposal", "Rescheduled"] : ["Connected", "Left voicemail", "No answer"]).map((o) => (<option key={o}>{o}</option>))}
          </select>
        </Field>
        <Field label="Notes"><textarea value={talk.notes} onChange={(e) => setTalk({ ...talk, notes: e.target.value })} className={textareaClass} placeholder="Asked about the 2027 scholars list" /></Field>
        <Field label="Follow-up task">
          <select value={talk.follow} onChange={(e) => setTalk({ ...talk, follow: e.target.value })} className={inputClass}>
            <option>None</option>
            <option>Tomorrow</option>
            <option>Next week</option>
          </select>
        </Field>
      </ProtoModal>

      <ProtoModal open={modal === "task"} title="New task" onClose={() => setModal(null)} footer={<PrimaryButton onClick={saveTask} disabled={!tDraft.title.trim()}>Create task</PrimaryButton>}>
        <Field label="Task"><input value={tDraft.title} onChange={(e) => setTDraft({ ...tDraft, title: e.target.value })} className={inputClass} placeholder="Send the scholar list" /></Field>
        <Field label="Type">
          <select value={tDraft.kind} onChange={(e) => setTDraft({ ...tDraft, kind: e.target.value as TaskKind })} className={inputClass}>
            <option>Call</option>
            <option>Email</option>
            <option>To-do</option>
          </select>
        </Field>
        <Field label="Contact">
          <select value={tDraft.contactId} onChange={(e) => setTDraft({ ...tDraft, contactId: e.target.value })} className={inputClass}>{contacts.map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}</select>
        </Field>
        <Field label="Due">
          <select value={tDraft.due} onChange={(e) => setTDraft({ ...tDraft, due: e.target.value })} className={inputClass}>{DUE_OPTIONS.map(([v, label]) => (<option key={v} value={v}>{label}</option>))}</select>
        </Field>
        {tDraft.dealId && <p className="text-[0.7rem] text-mist">{`Linked to the deal ${deals.find((d) => d.id === tDraft.dealId)?.name}.`}</p>}
      </ProtoModal>

      <ProtoModal open={modal === "deal"} title="New deal" onClose={() => setModal(null)} footer={<PrimaryButton onClick={saveDeal} disabled={!dDraft.name.trim() || !Number(dDraft.amount)}>Create deal</PrimaryButton>}>
        <Field label="Deal name"><input value={dDraft.name} onChange={(e) => setDDraft({ ...dDraft, name: e.target.value })} className={inputClass} placeholder="Payatas clinic equipment" /></Field>
        <Field label="Donor">
          <select value={dDraft.contactId} onChange={(e) => setDDraft({ ...dDraft, contactId: e.target.value })} className={inputClass}>
            {contacts.map((x) => (<option key={x.id} value={x.id}>{company(x.companyId) ? `${x.name}, ${company(x.companyId)?.name}` : x.name}</option>))}
          </select>
        </Field>
        <Field label="Amount (₱)"><input inputMode="numeric" value={dDraft.amount} onChange={(e) => setDDraft({ ...dDraft, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} /></Field>
        <Field label="Stage">
          <select value={dDraft.stage} onChange={(e) => setDDraft({ ...dDraft, stage: e.target.value as Stage })} className={inputClass}>{STAGES.slice(0, 4).map((s) => (<option key={s}>{s}</option>))}</select>
        </Field>
        <Field label="Expected close"><input type="date" value={dDraft.close} onChange={(e) => setDDraft({ ...dDraft, close: e.target.value })} className={inputClass} /></Field>
      </ProtoModal>

      <ProtoModal open={modal === "list"} title="New active list" onClose={() => setModal(null)} footer={<PrimaryButton onClick={saveList} disabled={!lDraft.name.trim()}>Create list</PrimaryButton>}>
        <Field label="List name"><input value={lDraft.name} onChange={(e) => setLDraft({ ...lDraft, name: e.target.value })} className={inputClass} placeholder="Lapsed donors who still read our emails" /></Field>
        <Field label="Where">
          <select value={lDraft.r1} onChange={(e) => setLDraft({ ...lDraft, r1: e.target.value })} className={inputClass}>{CONDITIONS.map((x) => (<option key={x.id} value={x.id}>{x.label}</option>))}</select>
        </Field>
        <Field label="And">
          <select value={lDraft.r2} onChange={(e) => setLDraft({ ...lDraft, r2: e.target.value })} className={inputClass}>
            <option value="">No second rule</option>
            {CONDITIONS.filter((x) => x.id !== lDraft.r1).map((x) => (<option key={x.id} value={x.id}>{x.label}</option>))}
          </select>
        </Field>
        <div className="rounded-lg border border-rule bg-paper px-3 py-2.5">
          <div className="text-[1.2rem] font-semibold text-ink tabular-nums">{preview([lDraft.r1, lDraft.r2].filter(Boolean)).toLocaleString()}</div>
          <div className="text-[0.72rem] text-mist">contacts match today. The list keeps itself up to date.</div>
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "rule" && !!l} title="Add a rule" onClose={() => setModal(null)} footer={l && <PrimaryButton onClick={() => setRules(l, [...l.rules, rDraft], "applied")}>Apply rule</PrimaryButton>}>
        <Field label="And">
          <select value={rDraft} onChange={(e) => setRDraft(e.target.value)} className={inputClass}>{CONDITIONS.filter((x) => !l?.rules.includes(x.id)).map((x) => (<option key={x.id} value={x.id}>{x.label}</option>))}</select>
        </Field>
        {l && (
          <div className="rounded-lg border border-rule bg-paper px-3 py-2.5">
            <div className="text-[0.72rem] text-mist">{`${l.name} goes from ${countOf(l).toLocaleString()} to`}</div>
            <div className="text-[1.2rem] font-semibold text-ink tabular-nums">{`${preview([...l.rules, rDraft]).toLocaleString()} contacts`}</div>
          </div>
        )}
      </ProtoModal>

      <ProtoModal
        open={modal === "email"}
        title="New email"
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={saveEmail} disabled={!eDraft.name.trim() || !eDraft.subject.trim() || !eDraft.date}>Schedule email</PrimaryButton>}
      >
        <Field label="Email name"><input value={eDraft.name} onChange={(e) => setEDraft({ ...eDraft, name: e.target.value })} className={inputClass} placeholder="Year-end appeal: lapsed donors" /></Field>
        <Field label="Send to list">
          <select value={eDraft.listId} onChange={(e) => setEDraft({ ...eDraft, listId: e.target.value })} className={inputClass}>
            {lists.map((x) => (<option key={x.id} value={x.id}>{`${x.name} (${countOf(x).toLocaleString()})`}</option>))}
          </select>
        </Field>
        <Field label="Subject line A"><input value={eDraft.subject} onChange={(e) => setEDraft({ ...eDraft, subject: e.target.value })} className={inputClass} placeholder="One more month of school for Jomar" /></Field>
        <Field label="Subject line B, optional"><input value={eDraft.subjectB} onChange={(e) => setEDraft({ ...eDraft, subjectB: e.target.value })} className={inputClass} placeholder="Add one to run an A/B test" /></Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Send date"><input type="date" value={eDraft.date} onChange={(e) => setEDraft({ ...eDraft, date: e.target.value })} className={inputClass} /></Field>
          <Field label="Time">
            <select value={eDraft.time} onChange={(e) => setEDraft({ ...eDraft, time: e.target.value })} className={inputClass}>{["8:00 AM", "12:00 PM", "6:30 PM", "7:00 PM"].map((t) => (<option key={t}>{t}</option>))}</select>
          </Field>
        </div>
        <p className="text-[0.7rem] text-mist">This list opens most on weekday evenings. Contacts who unsubscribed are skipped.</p>
      </ProtoModal>

      <ProtoModal
        open={modal === "associate"}
        title="Associate contact and company"
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={saveAssoc} disabled={!assoc.contactId || !assoc.companyId}>Associate</PrimaryButton>}
      >
        <Field label="Contact">
          <select value={assoc.contactId} onChange={(e) => setAssoc({ ...assoc, contactId: e.target.value })} className={inputClass}>
            {contacts.map((x) => (<option key={x.id} value={x.id}>{company(x.companyId) ? `${x.name} (now at ${company(x.companyId)?.name})` : x.name}</option>))}
          </select>
        </Field>
        <Field label="Company">
          <select value={assoc.companyId} onChange={(e) => setAssoc({ ...assoc, companyId: e.target.value })} className={inputClass}>{companies.map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}</select>
        </Field>
        <p className="text-[0.7rem] text-mist">Their gifts, emails and tickets show on the company timeline.</p>
      </ProtoModal>

      <ProtoModal open={modal === "flow"} title="New workflow" onClose={() => setModal(null)} footer={<PrimaryButton onClick={saveFlow}>Create workflow</PrimaryButton>}>
        <span className="text-[0.76rem] font-medium text-ink-soft">Start from a template</span>
        {TEMPLATES.map((t, i) => (
          <button
            key={t.name}
            type="button"
            aria-pressed={tpl === i}
            onClick={() => setTpl(i)}
            className={cn("text-left rounded-lg border px-3 py-2.5 cursor-pointer transition-colors", tpl === i ? "border-gold bg-gold-wash" : "border-rule bg-sheet hover:border-mist")}
          >
            <span className="block text-[0.82rem] font-semibold text-ink">{t.name}</span>
            <span className="block text-[0.7rem] text-mist mt-0.5">{`When: ${t.trigger} · ${t.steps.length} steps`}</span>
          </button>
        ))}
        <p className="text-[0.7rem] text-mist">New workflows start off, so you can review them first.</p>
      </ProtoModal>
    </ProtoApp>
  );
}
