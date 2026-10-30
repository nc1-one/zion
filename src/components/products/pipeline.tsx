"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, BarChart3, Check, ChevronLeft, ChevronRight, Clock, Coffee, Copy, DoorOpen, Flag, GitBranch, IdCard, Inbox, Kanban, ListChecks, Mail, MessageSquare, Pause, Pencil, Phone, Play, Plus, Printer, QrCode, RefreshCw, Search, Send, Sparkles, StickyNote, UserPlus, Users, Workflow, Zap, type LucideIcon } from "lucide-react";
import { Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, Toggle, inputClass, textareaClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Types -------------------------------------------------------------------------

type Stage = "guest" | "returning" | "connected" | "group" | "serving";
type Campus = "Ortigas" | "Katipunan" | "BGC";
type TouchKind = "card" | "visit" | "text" | "reply" | "email" | "call" | "coffee" | "task" | "stage" | "note" | "group";
type TimelineFilter = "all" | "visits" | "messages" | "calls" | "tasks";
type From = "guest" | "team" | "flow" | "note";
type StepKind = "wait" | "text" | "email" | "task" | "stage" | "branch";
type Role = "Primary contact" | "Spouse" | "Child" | "Parent" | "Sibling" | "Other";
type Modal = null | "guest" | "touch" | "task" | "member" | "step" | "flow" | "enroll";

interface Touch { id: string; date: string; kind: TouchKind; text: string; by: string }
interface Person { id: string; name: string; phone: string; area: string; stage: Stage; days: number; quiet: number; owner: string; source: string; visits: number; household?: string; flow?: string; flowDay?: number; touches: Touch[] }
interface Member { name: string; role: Role; age?: number; personId?: string }
interface Household { name: string; members: Member[] }
interface Msg { id: string; from: From; by: string; text: string; time: string }
interface Conv { id: string; personId: string; assignee: string | null; open: boolean; unread: boolean; at: string; drafts: string[]; basis: string; reply?: string; msgs: Msg[] }
interface Task { id: string; personId: string; title: string; owner: string; due: number; done: boolean; source: string }
interface Step { id: string; kind: StepKind; here: number; days?: number; title?: string; body?: string; owner?: string; due?: number; stage?: Stage; cond?: string; yes?: Step[]; no?: Step[] }
interface Flow { id: string; name: string; trigger: string; on: boolean; completed: number; replied: number; steps: Step[] }
interface Submission { id: string; personId: string; when: string; visit: string; interests: string[]; prayer?: string }
interface StepDraft { flowId: string; list: string; index: number; isNew: boolean; step: Step; ai: boolean; round: number }

// ---- Reference data ----------------------------------------------------------------

const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "guest", label: "Guest", hint: "First visit" },
  { id: "returning", label: "Returning", hint: "Visited twice" },
  { id: "connected", label: "Connected", hint: "Had a real conversation" },
  { id: "group", label: "In a group", hint: "Joined a life group" },
  { id: "serving", label: "Serving", hint: "On a Sunday team" },
];
const stageIndex = (s: Stage) => STAGES.findIndex((x) => x.id === s);
const stageLabel = (s: Stage) => STAGES[stageIndex(s)]?.label ?? s;
const stageAt = (i: number): Stage | undefined => STAGES[i]?.id;

const ME = "Joel Navarro";
const TEAM = ["Joel Navarro", "Grace Villanueva", "Mark Santos", "Ana Reyes"];
const CAMPUSES: Campus[] = ["Ortigas", "Katipunan", "BGC"];
const SERVICES: Record<Campus, string> = { Ortigas: "9 AM and 11 AM", Katipunan: "10 AM", BGC: "10 AM and 5 PM" };
const GROUPS: Record<string, { name: string; when: string; leader: string; campus: Campus }> = {
  Pasig: { name: "Kapitolyo life group", when: "Thursdays, 7 PM", leader: "Grace Villanueva", campus: "Ortigas" },
  Mandaluyong: { name: "Shaw couples group", when: "Fridays, 7 PM", leader: "Joel Navarro", campus: "Ortigas" },
  "Quezon City": { name: "Teachers Village group", when: "Wednesdays, 7 PM", leader: "Mark Santos", campus: "Katipunan" },
  Marikina: { name: "Concepcion family group", when: "Saturdays, 4 PM", leader: "Ana Reyes", campus: "Katipunan" },
  Makati: { name: "Poblacion young pros", when: "Tuesdays, 7:30 PM", leader: "Ana Reyes", campus: "BGC" },
  Taguig: { name: "BGC group", when: "Thursdays, 7:30 PM", leader: "Mark Santos", campus: "BGC" },
};
const AREAS = Object.keys(GROUPS);
const CAMPUS_AREA: Record<Campus, string> = { Ortigas: "Pasig", Katipunan: "Quezon City", BGC: "Taguig" };
const campusOf = (area: string): Campus => GROUPS[area]?.campus ?? "Ortigas";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Today in the demo is Thursday, October 29, 2026.
const dayLabel = (offset: number) => {
  const d = new Date(2026, 9, 29 + offset);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
const first = (name: string) => name.split(" ")[0];
const last = (name: string) => name.split(" ").slice(-1)[0];
const lower = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const ago = (d: number) => (d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`);
const pct = (a: number, b: number) => Math.round((a / (b || 1)) * 100);
const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z ]/g, "").split(" ").join(".")}@example.com`;
const fillText = (text: string, firstName: string, owner: string) => text.split("{first}").join(firstName).split("{owner}").join(first(owner));
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

let seq = 0;
const t = (date: string, kind: TouchKind, text: string, by: string): Touch => ({ id: `t${++seq}`, date, kind, text, by });
const m = (from: From, by: string, text: string, time: string): Msg => ({ id: `m${++seq}`, from, by, text, time });

// ---- Sample people -----------------------------------------------------------------

const PEOPLE: Person[] = [
  { id: "p1", name: "Liza Mendoza", phone: "0906 555 0128", area: "Pasig", stage: "returning", days: 4, quiet: 0, owner: "Grace Villanueva", source: "Connection card", visits: 2, household: "h1", flow: "f1", flowDay: 11, touches: [
    t("Oct 18", "card", "Connection card at the 11 AM. Ticked: join a group.", "Liza Mendoza"),
    t("Oct 18", "visit", "First visit, 11 AM, with Rico and Bea.", "Welcome team"),
    t("Oct 18", "text", "Welcome text from New guest journey.", "Workflow"),
    t("Oct 19", "call", "Thank-you call. Asked about kids church for Bea.", "Grace Villanueva"),
    t("Oct 21", "email", "What to expect at Grace. Opened.", "Workflow"),
    t("Oct 25", "visit", "Second visit. Bea joined kids church, 9 AM.", "Welcome team"),
    t("Oct 25", "stage", "Visited twice. Moved to Returning.", "Workflow"),
    t("Oct 25", "text", "Asked how Bea found kids church.", "Grace Villanueva"),
    t("Today", "reply", "Asked if the 11 AM has a class for 8 year olds.", "Liza Mendoza"),
  ] },
  { id: "p2", name: "Carlo Bautista", phone: "0945 555 0136", area: "Quezon City", stage: "guest", days: 18, quiet: 16, owner: "Mark Santos", source: "QR card", visits: 1, flow: "f1", flowDay: 18, touches: [
    t("Oct 11", "card", "Scanned the QR card in the lobby, 10 AM.", "Carlo Bautista"),
    t("Oct 11", "visit", "First visit, 10 AM. Came alone.", "Welcome team"),
    t("Oct 11", "text", "Welcome text from New guest journey. No reply.", "Workflow"),
    t("Oct 13", "call", "Thank-you call. No answer, left a voice message.", "Mark Santos"),
    t("Oct 18", "text", "We missed you text from New guest journey. No reply.", "Workflow"),
  ] },
  { id: "p3", name: "Mia Fernandez", phone: "0917 555 0174", area: "Makati", stage: "guest", days: 4, quiet: 1, owner: "Ana Reyes", source: "Connection card", visits: 1, household: "h4", flow: "f1", flowDay: 4, touches: [
    t("Oct 25", "card", "Connection card at the 5 PM. Found us on Facebook.", "Mia Fernandez"),
    t("Oct 25", "visit", "First visit, 5 PM.", "Welcome team"),
    t("Oct 25", "text", "Welcome text from New guest journey.", "Workflow"),
    t("Yesterday", "reply", "Asked for BGC service times. Wants to bring her sister.", "Mia Fernandez"),
  ] },
  { id: "p4", name: "Jerome Tan", phone: "0918 555 0150", area: "Mandaluyong", stage: "guest", days: 4, quiet: 1, owner: "Joel Navarro", source: "Invited by Ben Ramos", visits: 1, household: "h2", flow: "f1", flowDay: 4, touches: [
    t("Oct 25", "visit", "First visit, 11 AM, with Kat and Ethan. Invited by Ben Ramos.", "Welcome team"),
    t("Oct 25", "text", "Welcome text from New guest journey.", "Workflow"),
    t("Oct 26", "text", "Thanked them for coming. Mentioned Ben.", "Joel Navarro"),
    t("Yesterday", "reply", "Coming back Sunday. Asked about parking.", "Jerome Tan"),
  ] },
  { id: "p5", name: "Joy Dela Cruz", phone: "0927 555 0110", area: "Quezon City", stage: "connected", days: 21, quiet: 2, owner: "Grace Villanueva", source: "Invited by Ana Reyes", visits: 6, flow: "f3", flowDay: 21, touches: [
    t("Sep 13", "visit", "First visit, 10 AM.", "Welcome team"),
    t("Sep 20", "coffee", "Coffee on Maginhawa St. Teacher, new to QC.", "Grace Villanueva"),
    t("Oct 8", "stage", "Moved to Connected.", "Grace Villanueva"),
    t("Oct 25", "text", "Sent Teachers Village group details.", "Grace Villanueva"),
    t("Tue", "reply", "Asked if the group meets on Nov 4, after Undas.", "Joy Dela Cruz"),
  ] },
  { id: "p6", name: "Patrick Lim", phone: "0917 555 0133", area: "Taguig", stage: "connected", days: 34, quiet: 15, owner: "Mark Santos", source: "Livestream form", visits: 4, flow: "f3", flowDay: 34, touches: [
    t("Aug 30", "visit", "First visit after a month of watching online.", "Welcome team"),
    t("Sep 13", "coffee", "Coffee at BGC. Works night shift at a BPO.", "Mark Santos"),
    t("Sep 25", "stage", "Moved to Connected.", "Mark Santos"),
    t("Oct 14", "text", "Sent BGC group details. No reply.", "Mark Santos"),
  ] },
  { id: "p7", name: "Andrea Pascual", phone: "0919 555 0182", area: "Marikina", stage: "connected", days: 11, quiet: 5, owner: "Ana Reyes", source: "Connection card", visits: 3, household: "h3", touches: [
    t("Oct 4", "card", "Connection card at the 10 AM. Ticked: talk to a pastor.", "Andrea Pascual"),
    t("Oct 4", "visit", "First visit with her husband Jun.", "Welcome team"),
    t("Oct 16", "coffee", "Merienda with Andrea and Jun in Marikina.", "Ana Reyes"),
    t("Oct 18", "stage", "Moved to Connected.", "Ana Reyes"),
    t("Oct 24", "reply", "Signed up for Couples Night, Nov 7.", "Andrea Pascual"),
  ] },
  { id: "p8", name: "Nina Robles", phone: "0995 555 0121", area: "Pasig", stage: "group", days: 40, quiet: 6, owner: "Joel Navarro", source: "Connection card", visits: 9, touches: [
    t("Aug 9", "visit", "First visit, 11 AM.", "Welcome team"),
    t("Sep 19", "group", "Joined Kapitolyo life group.", "Grace Villanueva"),
    t("Oct 23", "text", "Checked in after group night.", "Joel Navarro"),
  ] },
  { id: "p9", name: "Leo Aquino", phone: "0928 555 0166", area: "Quezon City", stage: "group", days: 63, quiet: 21, owner: "Mark Santos", source: "Invited by Mark Santos", visits: 10, touches: [
    t("Jul 5", "visit", "First visit, 10 AM.", "Welcome team"),
    t("Aug 27", "group", "Joined Teachers Village group.", "Mark Santos"),
    t("Oct 8", "note", "Missed the last three group nights.", "Mark Santos"),
  ] },
  { id: "p10", name: "Carmela Diaz", phone: "0906 555 0199", area: "Makati", stage: "group", days: 18, quiet: 2, owner: "Grace Villanueva", source: "QR card", visits: 7, touches: [
    t("Sep 6", "card", "Scanned the QR card at the 10 AM.", "Carmela Diaz"),
    t("Oct 11", "group", "Joined Poblacion young pros.", "Ana Reyes"),
    t("Oct 27", "text", "Thanked her for bringing Miguel.", "Grace Villanueva"),
  ] },
  { id: "p11", name: "Paolo Garcia", phone: "0995 555 0177", area: "Mandaluyong", stage: "serving", days: 120, quiet: 5, owner: "Joel Navarro", source: "Invited by a coworker", visits: 30, household: "h5", touches: [
    t("Mar 1", "group", "Joined Shaw couples group.", "Joel Navarro"),
    t("Jul 1", "stage", "Started on the livestream team.", "Joel Navarro"),
    t("Oct 24", "call", "Talked about his new night shift.", "Joel Navarro"),
  ] },
  { id: "p12", name: "Ella Soriano", phone: "0917 555 0108", area: "Taguig", stage: "serving", days: 75, quiet: 30, owner: "Ana Reyes", source: "Connection card", visits: 25, touches: [
    t("May 3", "group", "Joined BGC group.", "Mark Santos"),
    t("Aug 15", "stage", "Started on kids church, 10 AM.", "Ana Reyes"),
    t("Sep 29", "text", "Thanked her for covering two Sundays.", "Ana Reyes"),
  ] },
  { id: "p13", name: "Kristine Ocampo", phone: "0916 555 0141", area: "Quezon City", stage: "guest", days: 4, quiet: 0, owner: "Mark Santos", source: "Connection card", visits: 1, household: "h6", flow: "f1", flowDay: 4, touches: [
    t("Oct 25", "card", "Connection card at the 10 AM. Left a prayer request.", "Kristine Ocampo"),
    t("Oct 25", "visit", "First visit, 10 AM.", "Welcome team"),
    t("Oct 25", "text", "Welcome text from New guest journey.", "Workflow"),
    t("Today", "reply", "Asked for prayer for her mom, in the hospital in Cainta.", "Kristine Ocampo"),
  ] },
  { id: "p14", name: "Ramon Villareal", phone: "0917 555 0145", area: "Marikina", stage: "guest", days: 4, quiet: 0, owner: "Ana Reyes", source: "QR card", visits: 1, flow: "f1", flowDay: 4, touches: [
    t("Oct 25", "card", "Scanned the QR card at the 10 AM.", "Ramon Villareal"),
    t("Oct 25", "visit", "First visit, 10 AM.", "Welcome team"),
    t("Oct 25", "text", "Welcome text from New guest journey.", "Workflow"),
    t("Today", "reply", "Texted to check this is the church number.", "Ramon Villareal"),
  ] },
  { id: "p15", name: "Trisha Gonzales", phone: "0939 555 0113", area: "Pasig", stage: "returning", days: 11, quiet: 9, owner: "Joel Navarro", source: "Connection card", visits: 2, flow: "f1", flowDay: 18, touches: [
    t("Oct 11", "card", "Connection card at the 9 AM.", "Trisha Gonzales"),
    t("Oct 11", "visit", "First visit, 9 AM.", "Welcome team"),
    t("Oct 11", "reply", "Replied to the welcome text: Thanks! It was nice.", "Trisha Gonzales"),
    t("Oct 18", "visit", "Second visit, 9 AM.", "Welcome team"),
    t("Oct 18", "stage", "Visited twice. Moved to Returning.", "Workflow"),
    t("Oct 20", "call", "Short call. Busy with a new job.", "Joel Navarro"),
  ] },
  { id: "p16", name: "Miguel Castro", phone: "0920 555 0158", area: "Makati", stage: "returning", days: 4, quiet: 0, owner: "Ana Reyes", source: "Invited by Carmela Diaz", visits: 2, flow: "f2", flowDay: 4, touches: [
    t("Oct 18", "visit", "First visit, 10 AM, with Carmela Diaz.", "Welcome team"),
    t("Oct 25", "visit", "Second visit, 10 AM.", "Welcome team"),
    t("Oct 25", "stage", "Visited twice. Moved to Returning.", "Workflow"),
    t("Oct 25", "text", "Glad you came back with Carmela.", "Ana Reyes"),
    t("Today", "reply", "Asked how to sign up for baptism.", "Miguel Castro"),
  ] },
  { id: "p17", name: "Arvin Dizon", phone: "0947 555 0172", area: "Taguig", stage: "connected", days: 9, quiet: 1, owner: "Mark Santos", source: "Connection card", visits: 3, flow: "f3", flowDay: 9, touches: [
    t("Oct 4", "card", "Connection card at the 5 PM. Ticked: serve.", "Arvin Dizon"),
    t("Oct 11", "coffee", "Coffee after the 5 PM. Studies sound engineering.", "Mark Santos"),
    t("Oct 20", "stage", "Moved to Connected.", "Mark Santos"),
    t("Wed", "reply", "Wants to help with the media team.", "Arvin Dizon"),
  ] },
  { id: "p18", name: "Hazel Manalo", phone: "0915 555 0190", area: "Mandaluyong", stage: "serving", days: 52, quiet: 8, owner: "Grace Villanueva", source: "Invited by Nina Robles", visits: 22, touches: [
    t("Jun 7", "visit", "First visit with Nina Robles.", "Welcome team"),
    t("Jul 19", "group", "Joined Shaw couples group.", "Joel Navarro"),
    t("Sep 7", "stage", "Started on the welcome team, 9 AM.", "Grace Villanueva"),
    t("Oct 21", "note", "Moving to Antipolo in November.", "Grace Villanueva"),
  ] },
];

const HOUSEHOLDS: Record<string, Household> = {
  h1: { name: "Mendoza household", members: [{ name: "Liza Mendoza", role: "Primary contact", personId: "p1" }, { name: "Rico Mendoza", role: "Spouse" }, { name: "Bea Mendoza", role: "Child", age: 8 }] },
  h2: { name: "Tan household", members: [{ name: "Jerome Tan", role: "Primary contact", personId: "p4" }, { name: "Kat Tan", role: "Spouse" }, { name: "Ethan Tan", role: "Child", age: 5 }] },
  h3: { name: "Pascual household", members: [{ name: "Andrea Pascual", role: "Primary contact", personId: "p7" }, { name: "Jun Pascual", role: "Spouse" }] },
  h4: { name: "Fernandez household", members: [{ name: "Mia Fernandez", role: "Primary contact", personId: "p3" }, { name: "Sofia Fernandez", role: "Sibling" }] },
  h5: { name: "Garcia household", members: [{ name: "Paolo Garcia", role: "Primary contact", personId: "p11" }, { name: "Tess Garcia", role: "Spouse" }, { name: "Migo Garcia", role: "Child", age: 3 }] },
  h6: { name: "Ocampo household", members: [{ name: "Kristine Ocampo", role: "Primary contact", personId: "p13" }, { name: "Lorna Ocampo", role: "Parent" }] },
};

// ---- Shared inbox ------------------------------------------------------------------

const welcome = (f: string, o: string) => `Hi ${f}, this is ${o} from Grace Fellowship. Thank you for visiting today. Reply anytime if you have questions.`;

const CONVS: Conv[] = [
  { id: "c1", personId: "p1", assignee: "Grace Villanueva", open: true, unread: true, at: "8:14 AM", basis: "Household: Bea, 8 · Ortigas kids church schedule · last 4 messages", reply: "Yes please! Salamat po. See you Sunday.", drafts: [
    "Hi Liza! So glad Bea loved it. Yes, kids church runs at both services. Ages 8 to 11 meet in Room 3, so the 11 AM works too. Want me to tell Teacher Rina she's coming?",
    "Yes, there is! The 11 AM has a class for ages 8 to 11. Check Bea in at the kids desk 10 minutes before service and she'll be all set. See you Sunday!",
  ], msgs: [
    m("flow", "New guest journey", welcome("Liza", "Grace"), "Oct 18, 1:05 PM"),
    m("guest", "Liza Mendoza", "Salamat po! We enjoyed the service.", "Oct 18, 2:40 PM"),
    m("team", "Grace Villanueva", "So good to see you again on Sunday, Liza. How did Bea find kids church?", "Oct 25, 3:12 PM"),
    m("guest", "Liza Mendoza", "She loved it! Is there a class for 8 year olds at the 11 AM too, or only at 9?", "Today, 8:14 AM"),
  ] },
  { id: "c2", personId: "p13", assignee: null, open: true, unread: true, at: "7:52 AM", basis: "Prayer request · first visit Oct 25 · a pastor should own this", reply: "Her name is Lorna. A call would mean a lot. Thank you po.", drafts: [
    "Kristine, thank you for telling us. I'm so sorry about your mom. Our pastors are praying for her today. Would it help if Pastor Joel called you, or visited her?",
    "Thank you for trusting us with this, Kristine. We are praying for your mom and for you. What is her name, so we can pray for her by name?",
  ], msgs: [
    m("flow", "New guest journey", welcome("Kristine", "Mark"), "Oct 25, 12:10 PM"),
    m("guest", "Kristine Ocampo", "Thank you for the text. Could you pray for my mom? She was admitted to a hospital in Cainta last night.", "Today, 7:52 AM"),
  ] },
  { id: "c3", personId: "p14", assignee: null, open: true, unread: true, at: "7:40 AM", basis: "Connection card Oct 25 · Katipunan campus", reply: "Great, I'll be there with my brother.", drafts: [
    "Hi Ramon, yes, this is Grace Fellowship! Thank you for filling out the card. It was good to have you at Katipunan. Anything we can help with this week?",
    "Yes, it is! Thanks for visiting on Sunday, Ramon. Our 10 AM service is on again this week. Can we save you a seat?",
  ], msgs: [
    m("flow", "New guest journey", welcome("Ramon", "Ana"), "Oct 25, 12:15 PM"),
    m("guest", "Ramon Villareal", "Hello, is this Grace Fellowship? I filled out the card last Sunday at Katipunan.", "Today, 7:40 AM"),
  ] },
  { id: "c4", personId: "p16", assignee: "Ana Reyes", open: true, unread: true, at: "6:30 AM", basis: "BGC calendar: baptism class Nov 15, baptism Nov 22", reply: "Yes please, sign me up!", drafts: [
    "Good morning, Miguel! Yes, baptism is on Sunday, Nov 22 at BGC. There's a short class on Nov 15 after the 10 AM service. Want me to sign you up?",
    "Hi Miguel! So glad you're asking. Baptism class is Sunday, Nov 15 after the 10 AM, and baptism is Nov 22. I can save you a spot and send the details.",
  ], msgs: [
    m("team", "Ana Reyes", "Hi Miguel, glad you came back with Carmela! Let me know if you need anything.", "Oct 25, 4:02 PM"),
    m("guest", "Miguel Castro", "Good morning! How do I sign up for baptism? Carmela said there's one in November.", "Today, 6:30 AM"),
  ] },
  { id: "c5", personId: "p3", assignee: null, open: true, unread: true, at: "Yesterday", basis: "Household: Sofia, sister · BGC service times", reply: "We'll come at 5 PM. Thank you!", drafts: [
    "Hi Mia! We have services at 10 AM and 5 PM at BGC. Bring your sister, we'd love to meet her. Want me to save you two seats?",
    "Hi Mia, Sunday services at BGC are 10 AM and 5 PM. The 5 PM is a bit smaller if it's her first time. See you both!",
  ], msgs: [
    m("flow", "New guest journey", welcome("Mia", "Ana"), "Oct 25, 6:20 PM"),
    m("guest", "Mia Fernandez", "Hi! What time is the service at BGC this Sunday? I want to bring my sister.", "Yesterday, 9:30 PM"),
  ] },
  { id: "c6", personId: "p4", assignee: "Joel Navarro", open: true, unread: false, at: "Yesterday", basis: "Household: Kat, Ethan, 5 · Ortigas parking notes", reply: "Perfect, see you Pastor!", drafts: [
    "Hi Jerome! Yes, there's free parking behind the building on Sundays. Come 15 minutes early for the 11 AM. I'll meet the three of you at the kids desk.",
    "Great to hear! Parking is free at the back lot on Sundays. If it's full, the mall across the street opens at 10 AM. See you Sunday!",
  ], msgs: [
    m("team", "Joel Navarro", "Jerome, thanks for coming with Kat and Ethan! Ben told me a lot about you.", "Oct 26, 10:00 AM"),
    m("guest", "Jerome Tan", "Hi Pastor, we're coming back this Sunday. Is there parking near Ortigas?", "Yesterday, 6:05 PM"),
  ] },
  { id: "c7", personId: "p17", assignee: "Mark Santos", open: true, unread: false, at: "Wed", basis: "Interest: serving · media team lead is Paolo Garcia", reply: "Sunday works. Thanks Kuya Mark!", drafts: [
    "Arvin, that's great! The media team needs help with sound. Can you come at 9 AM this Sunday to meet Paolo and see the booth?",
    "Thanks for offering, Arvin! Sound experience is a big help. I'll introduce you to Paolo, who leads media. Is this Sunday before service okay?",
  ], msgs: [
    m("team", "Mark Santos", "Good to see you again at the 5 PM, Arvin!", "Oct 25, 7:30 PM"),
    m("guest", "Arvin Dizon", "I'd like to help with the media team. I've done sound for school events.", "Wed, 4:12 PM"),
  ] },
  { id: "c8", personId: "p5", assignee: "Grace Villanueva", open: true, unread: false, at: "Tue", basis: "Teachers Village group calendar", reply: "Thank you po! See you on the 11th.", drafts: [
    "Hi Joy! Yes, the group meets on Nov 4. No worries if you're still in Baguio. We'll save you a seat on the 11th. Safe trip!",
    "We're meeting on Nov 4, but enjoy Undas with your family. Mark will send you the notes. See you when you're back!",
  ], msgs: [
    m("team", "Grace Villanueva", "Hi Joy, here are the Teachers Village group details. Wednesdays, 7 PM at the Santos home.", "Oct 25, 5:00 PM"),
    m("guest", "Joy Dela Cruz", "Is the group meeting on Nov 4, after Undas? I might still be in Baguio.", "Tue, 8:41 PM"),
  ] },
  { id: "c9", personId: "p15", assignee: "Joel Navarro", open: true, unread: false, at: "Oct 20", basis: "No reply in 9 days · visited twice", reply: "Hi Pastor! Busy week, but I'll try to come to the lunch.", drafts: [], msgs: [
    m("flow", "New guest journey", welcome("Trisha", "Joel"), "Oct 11, 1:00 PM"),
    m("guest", "Trisha Gonzales", "Thanks! It was nice.", "Oct 11, 3:20 PM"),
    m("flow", "New guest journey", "So good to see you again, Trisha. Can I buy you coffee after service this Sunday?", "Oct 20, 9:00 AM"),
  ] },
  { id: "c10", personId: "p2", assignee: "Mark Santos", open: true, unread: false, at: "Oct 18", basis: "No reply to 2 workflow texts · first visit Oct 11", reply: "Hi Mark, sorry, busy month. Coffee sounds good.", drafts: [], msgs: [
    m("flow", "New guest journey", welcome("Carlo", "Mark"), "Oct 11, 12:30 PM"),
    m("flow", "New guest journey", "We missed you on Sunday, Carlo. Hope your week is going well. Anything we can pray about?", "Oct 18, 2:00 PM"),
  ] },
  { id: "c11", personId: "p7", assignee: "Ana Reyes", open: false, unread: false, at: "Oct 24", basis: "", drafts: [], msgs: [
    m("guest", "Andrea Pascual", "We'll be at Couples Night po!", "Oct 24, 7:15 PM"),
    m("team", "Ana Reyes", "See you both on Nov 7, Andrea!", "Oct 24, 7:30 PM"),
  ] },
];

const QUICK = [
  { label: "Service times", text: "Hi {first}! Sunday services: Ortigas 9 AM and 11 AM, Katipunan 10 AM, BGC 10 AM and 5 PM. See you there!" },
  { label: "Directions", text: "We're on Ortigas Ave in Pasig, beside the bank. Parking at the back is free on Sundays." },
  { label: "Kids church", text: "Kids church runs during every service for ages 3 to 11. Check in at the kids desk 10 minutes early." },
  { label: "Find a group", text: "We have life groups all over Metro Manila. Reply with your area and I'll send the one nearest you." },
  { label: "Prayer", text: "Thank you for trusting us with this, {first}. Our pastors are praying for you this week." },
];
const closingDrafts = (f: string) => [`Salamat, ${f}! See you on Sunday.`, `Thank you, ${f}. Text us anytime if you need anything.`];
const checkInDrafts = (f: string, o: string) => [`Hi ${f}, ${first(o)} here from Grace Fellowship. Just checking in. How has your week been?`, `Hi ${f}! We're having a Newcomers' lunch after the 11 AM on Nov 8. Would you like to come?`];

// ---- Tasks -------------------------------------------------------------------------

const TASKS: Task[] = [
  { id: "k1", personId: "p2", title: "Call Carlo. Two texts, no reply.", owner: "Mark Santos", due: -5, done: false, source: "New guest journey" },
  { id: "k2", personId: "p1", title: "Invite the Mendozas to Newcomers' lunch", owner: "Grace Villanueva", due: 0, done: false, source: "New guest journey" },
  { id: "k3", personId: "p9", title: "Ask Leo how group is going", owner: "Mark Santos", due: -1, done: false, source: "Manual" },
  { id: "k4", personId: "p6", title: "Introduce Patrick to the BGC group leader", owner: "Mark Santos", due: -3, done: false, source: "Group connection" },
  { id: "k5", personId: "p3", title: "Thank-you call to Mia", owner: "Ana Reyes", due: 1, done: false, source: "New guest journey" },
  { id: "k6", personId: "p12", title: "Thank Ella and offer a rest Sunday", owner: "Ana Reyes", due: -2, done: false, source: "Manual" },
  { id: "k7", personId: "p4", title: "Send kids church info to Jerome and Kat", owner: "Joel Navarro", due: 2, done: false, source: "Manual" },
  { id: "k8", personId: "p13", title: "Thank-you call to Kristine", owner: "Mark Santos", due: 1, done: false, source: "New guest journey" },
  { id: "k9", personId: "p14", title: "Thank-you call to Ramon", owner: "Ana Reyes", due: 1, done: false, source: "New guest journey" },
  { id: "k10", personId: "p15", title: "Personal call from a pastor", owner: "Joel Navarro", due: -1, done: false, source: "New guest journey" },
  { id: "k11", personId: "p16", title: "Send baptism class details to Miguel", owner: "Ana Reyes", due: 3, done: false, source: "Second-visit follow-up" },
  { id: "k12", personId: "p17", title: "Introduce Arvin to the media team lead", owner: "Mark Santos", due: 0, done: false, source: "Manual" },
  { id: "k13", personId: "p18", title: "Ask Hazel about a church near Antipolo", owner: "Grace Villanueva", due: -4, done: false, source: "Manual" },
  { id: "k14", personId: "p7", title: "Introduce the Pascuals to the Concepcion group", owner: "Ana Reyes", due: 4, done: false, source: "Group connection" },
  { id: "k15", personId: "p5", title: "Send Teachers Village details to Joy", owner: "Grace Villanueva", due: -4, done: true, source: "Group connection" },
  { id: "k16", personId: "p10", title: "Thank Carmela for bringing Miguel", owner: "Grace Villanueva", due: -2, done: true, source: "Manual" },
  { id: "k17", personId: "p7", title: "Save two seats for Couples Night", owner: "Ana Reyes", due: -5, done: true, source: "Manual" },
];

// ---- Workflows ---------------------------------------------------------------------

const TRIGGERS = ["Connection card submitted", "Guest visits twice", "Moved to Connected", "Moved to Serving", "No contact for 14 days"];
const STAGE_TRIGGER: Partial<Record<Stage, string>> = { returning: "Guest visits twice", connected: "Moved to Connected", serving: "Moved to Serving" };
const BRANCH_CONDS = ["Visited twice", "Replied to a text", "Joined a group", "Opened the email"];

const FLOWS: Flow[] = [
  { id: "f1", name: "New guest journey", trigger: "Connection card submitted", on: true, completed: 41, replied: 64, steps: [
    { id: "s1", kind: "text", here: 0, body: "Hi {first}, this is {owner} from Grace Fellowship. Thank you for visiting today. Reply anytime if you have questions." },
    { id: "s2", kind: "task", here: 3, title: "Thank-you call", owner: "owner", due: 2 },
    { id: "s3", kind: "wait", here: 2, days: 3 },
    { id: "s4", kind: "email", here: 0, title: "What to expect at Grace", body: "Service times, kids church, parking, and how to find a life group near you." },
    { id: "s5", kind: "wait", here: 3, days: 4 },
    { id: "s6", kind: "branch", here: 0, cond: "Visited twice", days: 14, yes: [
      { id: "s6y1", kind: "stage", here: 0, stage: "returning" },
      { id: "s6y2", kind: "text", here: 1, body: "So good to see you again, {first}. Can I buy you coffee after service this Sunday?" },
      { id: "s6y3", kind: "task", here: 2, title: "Invite to Newcomers' lunch", owner: "owner", due: 3 },
    ], no: [
      { id: "s6n1", kind: "wait", here: 2, days: 7 },
      { id: "s6n2", kind: "text", here: 0, body: "We missed you on Sunday, {first}. Hope your week is going well. Anything we can pray about?" },
      { id: "s6n3", kind: "task", here: 1, title: "Personal call from a pastor", owner: "Joel Navarro", due: 2 },
    ] },
    { id: "s7", kind: "wait", here: 2, days: 14 },
    { id: "s8", kind: "email", here: 0, title: "Find a group near you", body: "Life groups by area, with the leader's name and the night they meet." },
    { id: "s9", kind: "wait", here: 1, days: 14 },
    { id: "s10", kind: "task", here: 1, title: "Invite to a life group", owner: "owner", due: 3 },
    { id: "s11", kind: "wait", here: 0, days: 7 },
    { id: "s12", kind: "text", here: 0, body: "Hi {first}, it has been six weeks since your first visit. Thank you for being part of Grace. How can we help you take a next step?" },
  ] },
  { id: "f2", name: "Second-visit follow-up", trigger: "Guest visits twice", on: true, completed: 17, replied: 71, steps: [
    { id: "s21", kind: "text", here: 0, body: "Glad you came back, {first}! Can I buy you coffee after service this Sunday?" },
    { id: "s22", kind: "task", here: 2, title: "Invite to coffee", owner: "owner", due: 2 },
    { id: "s23", kind: "wait", here: 1, days: 7 },
    { id: "s24", kind: "branch", here: 0, cond: "Replied to a text", days: 7, yes: [{ id: "s24y1", kind: "stage", here: 0, stage: "connected" }], no: [{ id: "s24n1", kind: "task", here: 1, title: "Call and invite to lunch", owner: "owner", due: 1 }] },
  ] },
  { id: "f3", name: "Group connection", trigger: "Moved to Connected", on: true, completed: 22, replied: 58, steps: [
    { id: "s31", kind: "email", here: 0, title: "Groups near you", body: "The three life groups closest to you, with the night they meet and the leader's name." },
    { id: "s32", kind: "wait", here: 1, days: 3 },
    { id: "s33", kind: "task", here: 2, title: "Introduce to the group leader", owner: "owner", due: 2 },
    { id: "s34", kind: "wait", here: 1, days: 14 },
    { id: "s35", kind: "branch", here: 0, cond: "Joined a group", days: 21, yes: [{ id: "s35y1", kind: "stage", here: 0, stage: "group" }], no: [{ id: "s35n1", kind: "task", here: 1, title: "Ask what is in the way", owner: "owner", due: 2 }] },
  ] },
  { id: "f4", name: "Serving onboarding", trigger: "Moved to Serving", on: true, completed: 12, replied: 80, steps: [
    { id: "s41", kind: "text", here: 0, body: "Welcome to the team, {first}! {owner} will walk you through your first Sunday." },
    { id: "s42", kind: "task", here: 1, title: "Schedule a shadow Sunday", owner: "owner", due: 3 },
    { id: "s43", kind: "wait", here: 2, days: 30 },
    { id: "s44", kind: "task", here: 0, title: "One-month check-in", owner: "owner", due: 2 },
  ] },
  { id: "f5", name: "Re-engage stalled guests", trigger: "No contact for 14 days", on: false, completed: 0, replied: 0, steps: [
    { id: "s51", kind: "task", here: 0, title: "Personal call", owner: "owner", due: 1 },
    { id: "s52", kind: "wait", here: 0, days: 3 },
    { id: "s53", kind: "text", here: 0, body: "Hi {first}, we've been thinking of you at Grace. No pressure, just wanted to say hello. How are you?" },
  ] },
];

const STEP_META: Record<StepKind, { icon: LucideIcon; label: string }> = {
  wait: { icon: Clock, label: "Wait" },
  text: { icon: MessageSquare, label: "Send text" },
  email: { icon: Mail, label: "Send email" },
  task: { icon: ListChecks, label: "Create task for owner" },
  stage: { icon: Flag, label: "Move to stage" },
  branch: { icon: GitBranch, label: "Branch" },
};
const STEP_DEFAULTS: Record<StepKind, Omit<Step, "id" | "here">> = {
  wait: { kind: "wait", days: 3 },
  text: { kind: "text", body: "" },
  email: { kind: "email", title: "", body: "" },
  task: { kind: "task", title: "", owner: "owner", due: 2 },
  stage: { kind: "stage", stage: "connected" },
  branch: { kind: "branch", cond: BRANCH_CONDS[0], days: 14, yes: [], no: [] },
};
// Sample AI drafts for workflow steps, picked by what the step is about.
const STEP_AI = {
  text: [
    "Hi {first}, {owner} here from Grace Fellowship. We loved having you with us. Is there anything we can pray about this week?",
    "Hi {first}! It's {owner} from Grace. Just checking in. Would you like to grab coffee after service this Sunday?",
  ],
  expect: [
    "Hi {first}, here is what a Sunday at Grace looks like. Services run about 90 minutes. Kids church is open for ages 3 to 11, and parking at the back is free. If you have a question, just reply to this email. We would love to see you again.",
    "Hi {first}, thank you for visiting Grace. Next Sunday, come 10 minutes early and check the kids in at the kids desk. Someone from the welcome team will save you a seat. {owner}",
  ],
  group: [
    "Hi {first}, life groups are where Grace gets small: 8 to 12 people who eat, pray, and read the Bible together on a weeknight. There is one near you. Reply with your area and {owner} will introduce you to the leader.",
    "Hi {first}, most people at Grace find their friends in a life group. Groups meet in homes around Pasig, Quezon City, Marikina, Makati, and Taguig. Want to visit one this week? Just reply to this email.",
  ],
  email: [
    "Hi {first}, thank you again for visiting. Three easy next steps: come to the Newcomers' lunch on Nov 8, find a life group near you, or reply here to meet a pastor. {owner}",
    "Hi {first}, we are glad you found Grace. If there is anything we can pray about or help with, just reply to this email. {owner} reads every one.",
  ],
};
const stepAiDraft = (s: Step, round: number) => {
  const pool = s.kind === "text" ? STEP_AI.text : /group/i.test(s.title ?? "") ? STEP_AI.group : /expect|sunday/i.test(s.title ?? "") ? STEP_AI.expect : STEP_AI.email;
  return pool[round % pool.length];
};

const ownerLabel = (o?: string) => (!o || o === "owner" ? "owner" : first(o));
function stepTitle(s: Step) {
  switch (s.kind) {
    case "wait":
      return `Wait ${s.days} ${s.days === 1 ? "day" : "days"}`;
    case "text":
      return "Send text";
    case "email":
      return `Send email: ${s.title}`;
    case "task":
      return `Task for ${ownerLabel(s.owner)}: ${s.title}`;
    case "stage":
      return `Move to ${stageLabel(s.stage ?? "guest")}`;
    case "branch":
      return `If ${lower(s.cond ?? "")}`;
  }
}
function stepDetail(s: Step, day: number) {
  switch (s.kind) {
    case "wait":
      return `Until day ${day + (s.days ?? 0)}`;
    case "text":
    case "email":
      return s.body ?? "";
    case "task":
      return `Due ${s.due === 1 ? "1 day" : `${s.due} days`} after it is created`;
    case "stage":
      return "Updates the pipeline board";
    case "branch":
      return `Checks within ${s.days} days of the first visit`;
  }
}
function stepValid(s: Step) {
  if (s.kind === "text") return !!s.body?.trim();
  if (s.kind === "email") return !!s.title?.trim() && !!s.body?.trim();
  if (s.kind === "task") return !!s.title?.trim();
  return true;
}
const countHere = (steps: Step[]): number => steps.reduce((n, s) => n + s.here + countHere(s.yes ?? []) + countHere(s.no ?? []), 0);
const countSteps = (steps: Step[]): number => steps.reduce((n, s) => n + 1 + countSteps(s.yes ?? []) + countSteps(s.no ?? []), 0);
const flowDays = (steps: Step[]) => steps.reduce((n, s) => n + (s.kind === "wait" ? s.days ?? 0 : 0), 0);
const dayOffsets = (steps: Step[], start: number) => steps.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? start : acc[i - 1] + (steps[i - 1].kind === "wait" ? steps[i - 1].days ?? 0 : 0)], []);
const cloneSteps = (steps: Step[]): Step[] => steps.map((s) => ({ ...s, id: uid("s"), here: 0, yes: s.yes && cloneSteps(s.yes), no: s.no && cloneSteps(s.no) }));
// Edits one list of steps: the main path, or one side of a branch ("s6:yes").
function editList(steps: Step[], list: string, fn: (l: Step[]) => Step[]): Step[] {
  if (list === "main") return fn(steps);
  const [id, side] = list.split(":");
  return steps.map((s) => (s.id !== id ? s : side === "yes" ? { ...s, yes: fn(s.yes ?? []) } : { ...s, no: fn(s.no ?? []) }));
}

// ---- Connection card ---------------------------------------------------------------

const VISITS = ["First visit", "Second visit", "I attend here"];
const INTERESTS = ["Join a group", "Serve", "Talk to a pastor", "Baptism"];
const CARD_COPY = {
  en: { title: "Welcome to Grace Fellowship", intro: "Tell us a bit about you. We'll text you once this week.", name: "Full name", phone: "Mobile number", email: "Email (optional)", campus: "Campus", visit: "This is my", like: "I'd like to", prayer: "How can we pray for you?", send: "Send card", thanks: "Thanks", sent: "We will text you this week from the church number.", again: "Fill in another card", visits: VISITS, interests: INTERESTS },
  tl: { title: "Maligayang pagdating sa Grace Fellowship", intro: "Magpakilala ka sa amin. Isang text lang namin ngayong linggo.", name: "Buong pangalan", phone: "Mobile number", email: "Email (opsyonal)", campus: "Campus", visit: "Ito ang aking", like: "Gusto kong", prayer: "Paano ka namin maipagdarasal?", send: "Ipadala", thanks: "Salamat", sent: "Magte-text kami ngayong linggo mula sa numero ng simbahan.", again: "Punan ang isa pang card", visits: ["Unang bisita", "Ikalawang bisita", "Dito ako dumadalo"], interests: ["Sumali sa grupo", "Maglingkod", "Makausap ang pastor", "Bautismo"] },
};
// The live preview starts filled in so visitors can send a card in one click.
const SAMPLE_CARDS = [
  { name: "Rachel Lopez", phone: "0917 555 0164", email: "", campus: "Ortigas" as Campus, visit: "First visit", interests: ["Join a group"], prayer: "" },
  { name: "Bea Santiago", phone: "0918 555 0193", email: "", campus: "BGC" as Campus, visit: "First visit", interests: ["Serve"], prayer: "" },
  { name: "Josh Ramirez", phone: "0927 555 0148", email: "", campus: "Katipunan" as Campus, visit: "Second visit", interests: [] as string[], prayer: "For a new job." },
];

const SUBMISSIONS: Submission[] = [
  { id: "u1", personId: "p3", when: "Oct 25, 5:52 PM", visit: "First visit", interests: [] },
  { id: "u2", personId: "p13", when: "Oct 25, 10:48 AM", visit: "First visit", interests: ["Talk to a pastor"], prayer: "For my mom's health." },
  { id: "u3", personId: "p14", when: "Oct 25, 10:41 AM", visit: "First visit", interests: ["Join a group"] },
  { id: "u4", personId: "p1", when: "Oct 18, 12:20 PM", visit: "First visit", interests: ["Join a group"] },
  { id: "u5", personId: "p2", when: "Oct 11, 10:35 AM", visit: "First visit", interests: [] },
  { id: "u6", personId: "p15", when: "Oct 11, 9:58 AM", visit: "First visit", interests: ["Serve"] },
  { id: "u7", personId: "p17", when: "Oct 4, 5:44 PM", visit: "First visit", interests: ["Serve", "Join a group"] },
  { id: "u8", personId: "p7", when: "Oct 4, 10:50 AM", visit: "First visit", interests: ["Talk to a pastor"] },
  { id: "u9", personId: "p10", when: "Sep 6, 10:39 AM", visit: "First visit", interests: ["Join a group"] },
];

// A sample QR mark: three finder squares and a fixed module pattern.
const QR = Array.from({ length: 441 }, (_, i) => {
  const x = i % 21;
  const y = Math.floor(i / 21);
  for (const [cx, cy] of [[0, 0], [14, 0], [0, 14]]) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx >= 0 && dy >= 0 && dx <= 6 && dy <= 6) return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
    if (dx >= -1 && dy >= -1 && dx <= 7 && dy <= 7) return false;
  }
  return (x * 7 + y * 11 + x * y) % 3 === 0;
});

// ---- Insights ----------------------------------------------------------------------

type Range = "d30" | "d90" | "y";
const FUNNEL: Record<Range, number[]> = { d30: [23, 11, 8, 5, 3], d90: [64, 30, 22, 15, 9], y: [212, 104, 79, 52, 33] };
const RANGE_VS: Record<Range, string> = { d30: "+4 vs September", d90: "+12 vs last quarter", y: "+18% vs last year" };
const REPLY_MEDIAN: Record<Range, number> = { d30: 12, d90: 14, y: 19 };
const RANGE_FACTOR: Record<Range, number> = { d30: 1, d90: 1.15, y: 1.4 };
const RESPONSE = [
  { name: "Joel Navarro", median: 9, hour: 96 },
  { name: "Grace Villanueva", median: 11, hour: 92 },
  { name: "Ana Reyes", median: 14, hour: 88 },
  { name: "Mark Santos", median: 27, hour: 69 },
];
const SUNDAYS = ["Sep 6", "13", "20", "27", "Oct 4", "11", "18", "25"];

// ---- Activity kinds ----------------------------------------------------------------

const KIND: Record<TouchKind, { icon: LucideIcon; label: string; group: TimelineFilter }> = {
  card: { icon: IdCard, label: "Connection card", group: "visits" },
  visit: { icon: DoorOpen, label: "Visit", group: "visits" },
  text: { icon: MessageSquare, label: "Text sent", group: "messages" },
  reply: { icon: MessageSquare, label: "Text received", group: "messages" },
  email: { icon: Mail, label: "Email", group: "messages" },
  call: { icon: Phone, label: "Call", group: "calls" },
  coffee: { icon: Coffee, label: "Coffee", group: "calls" },
  task: { icon: Check, label: "Task done", group: "tasks" },
  stage: { icon: Flag, label: "Stage", group: "all" },
  note: { icon: StickyNote, label: "Note", group: "all" },
  group: { icon: Users, label: "Group", group: "all" },
};
const LOGGABLE: TouchKind[] = ["call", "coffee", "visit", "text", "email", "note"];

function suggest(p: Person, hh?: Household) {
  const f = first(p.name);
  const o = first(p.owner);
  const g = GROUPS[p.area];
  const spouse = hh?.members.find((x) => x.role === "Spouse");
  const kids = hh?.members.filter((x) => x.role === "Child") ?? [];
  const basis = [`${p.visits} ${p.visits === 1 ? "visit" : "visits"}`, hh ? `household of ${hh.members.length}` : "", `last contact ${ago(p.quiet).toLowerCase()}`, `${campusOf(p.area)} campus`].filter(Boolean).join(" · ");
  if (p.stage === "guest" && spouse)
    return { step: "Invite to Couples Night, Sat Nov 7", why: `First visit with ${first(spouse.name)}. Couples Night is an easy second step.`, basis, drafts: [
      `Hi ${f}, this is ${o} from Grace Fellowship. So glad you and ${first(spouse.name)} came on Sunday. We have a Couples Night on Nov 7 at 7 PM, dinner included. Can I save you two seats?`,
      `Hi ${f}, ${o} here from Grace. A few couples from church are having dinner on Nov 7. No program, just good food and conversation. Would you and ${first(spouse.name)} like to join?`,
    ] };
  if (p.stage === "guest")
    return { step: "Invite to coffee after service", why: "First visit. No real conversation with someone yet.", basis, drafts: [
      `Hi ${f}, this is ${o} from Grace Fellowship. Thank you for visiting on Sunday. Can I buy you coffee after the service this week? No agenda, just to get to know you.`,
      `Hello ${f}. ${o} from Grace here. Any questions after your visit? Happy to meet for coffee near ${p.area} this week.`,
    ] };
  if (p.stage === "returning")
    return { step: "Invite to Newcomers' lunch, Sun Nov 8", why: `Visited twice${kids.length ? ` with ${kids.map((k) => first(k.name)).join(" and ")}` : ""}. The lunch is where most returning guests meet a pastor.`, basis, drafts: [
      `Hi ${f}, ${o} here from Grace Fellowship. We have a Newcomers' lunch after the 11 AM on Nov 8. ${spouse ? `Would you and ${first(spouse.name)} like to come?` : "Would you like to come?"}${kids.length ? " Kids church runs during lunch." : ""}`,
      `Hi ${f}! It has been great seeing you on Sundays. Can I save you ${spouse ? "two seats" : "a seat"} at the Newcomers' lunch on Nov 8? It is a simple meal with the pastors.`,
    ] };
  if (p.stage === "connected")
    return { step: `Visit the ${g.name}`, why: `Lives in ${p.area}. The group meets ${g.when}, led by ${g.leader}.`, basis, drafts: [
      `Hi ${f}, ${o} here. There is a group that meets near you, the ${g.name}. They meet ${g.when}. Want me to introduce you to ${first(g.leader)}?`,
      `Hi ${f}. Since you are in ${p.area}, I thought of the ${g.name}. It is small, around 10 people. Can I bring you this week?`,
    ] };
  if (p.stage === "group")
    return { step: "Try one Sunday on the welcome team", why: `In a group for ${p.days} days. Has not served yet.`, basis, drafts: [
      `Hi ${f}, ${o} here. The welcome team needs one more person for the 9 AM. Would you try one Sunday with us? I will be beside you the whole time.`,
      `Hi ${f}. Your group leader says you are great with new people. Would you like to try greeting guests one Sunday this month?`,
    ] };
  if (p.quiet >= 14)
    return { step: "Thank and offer a rest Sunday", why: `Serving for ${Math.round(p.days / 30)} months. No personal contact in ${p.quiet} days.`, basis, drafts: [
      `Hi ${f}, ${o} here. Thank you for serving so faithfully. Would you like a rest Sunday this month? We can cover for you.`,
      `Hi ${f}. Just wanted to say thank you. How are you doing, really? Free for merienda this week?`,
    ] };
  return { step: "Invite to leaders' training, Sat Nov 21", why: `Serving for ${Math.round(p.days / 30)} months. Groups need apprentice leaders.`, basis, drafts: [
    `Hi ${f}, ${o} here. Thank you for serving so faithfully. Leaders' training starts Saturday, Nov 21. Would you pray about joining?`,
    `Hi ${f}. You have been a big help on Sundays. We would love you in the next leaders' training. Can we talk this week?`,
  ] };
}

const CAME_WITH: Record<string, string> = { "On their own": "", Spouse: " Came with their spouse.", Friend: " Came with a friend.", Family: " Came with family." };
const EMPTY_GUEST = { name: "", phone: "", area: "Pasig", service: "9 AM", with: "On their own", owner: "auto", enroll: true };
const selectSm = "h-8 px-2 rounded-md bg-sheet border border-rule text-[0.75rem] text-ink cursor-pointer";

// ---- Small pieces ------------------------------------------------------------------

function AiTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold-wash text-gold text-[0.66rem] font-medium whitespace-nowrap">
      <Sparkles size={11} />
      {text}
    </span>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block">
      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(inputClass, "h-8 pl-8 text-[0.76rem]")} />
    </label>
  );
}

function Stepper({ stage }: { stage: Stage }) {
  const at = stageIndex(stage);
  return (
    <ol className="grid grid-cols-5 gap-1.5 mb-4" aria-label="Pipeline stage">
      {STAGES.map((s, i) => (
        <li key={s.id} aria-current={i === at ? "step" : undefined}>
          <div className={cn("h-1 rounded-full", i <= at ? "bg-gold" : "bg-rule")} />
          <span className={cn("block mt-1 text-[0.68rem]", i === at ? "text-gold-bright font-semibold" : i < at ? "text-ink-soft" : "text-mist")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function TouchIcon({ kind }: { kind: TouchKind }) {
  const Icon = KIND[kind].icon;
  return <Icon size={12} />;
}

function Due({ task }: { task: Task }) {
  if (task.done) return <Status tone="good">Done</Status>;
  if (task.due < 0) return <Status tone="bad">{`${-task.due} ${task.due === -1 ? "day" : "days"} overdue`}</Status>;
  if (task.due === 0) return <Status tone="warn">Due today</Status>;
  return <Status tone="muted">{task.due === 1 ? "Due tomorrow" : `Due ${dayLabel(task.due)}`}</Status>;
}

function QrMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-1 -1 23 23" role="img" aria-label="Sample QR code" className={cn("shrink-0 rounded bg-sheet fill-ink border border-rule", className)}>
      {QR.map((on, i) => (on ? <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" /> : null))}
    </svg>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.from === "note")
    return (
      <div className="self-center w-[88%] rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-[0.76rem] text-ink-soft">
        <span className="block text-[0.64rem] font-semibold text-warn mb-0.5">Internal note · {msg.by} · {msg.time}</span>
        {msg.text}
      </div>
    );
  const guest = msg.from === "guest";
  return (
    <div className={cn("flex flex-col max-w-[82%]", guest ? "self-start items-start" : "self-end items-end")}>
      <div className={cn("px-3 py-2 rounded-2xl text-[0.78rem] leading-snug", guest ? "bg-sheet border border-rule text-ink rounded-bl-md" : msg.from === "flow" ? "bg-gold-wash border border-gold/20 text-ink rounded-br-md" : "bg-gold text-sheet rounded-br-md")}>{msg.text}</div>
      <span className="text-[0.62rem] text-mist mt-0.5">
        {msg.from === "flow" ? `Workflow · ${msg.by}` : msg.by} · {msg.time}
      </span>
    </div>
  );
}

function MoveButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-6 h-6 rounded-md border border-rule bg-sheet text-graphite hover:text-ink hover:bg-paper disabled:opacity-30 disabled:cursor-default flex items-center justify-center cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}

function Connector({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="w-px h-2 bg-rule" />
      <button type="button" onClick={onAdd} aria-label={label} title={label} className="w-5 h-5 rounded-full border border-rule bg-sheet text-mist hover:text-gold hover:border-gold flex items-center justify-center cursor-pointer transition-colors">
        <Plus size={11} />
      </button>
      <span className="w-px h-2 bg-rule" />
    </div>
  );
}

function StepCard({ step, day, onClick }: { step: Step; day: number; onClick: () => void }) {
  const Icon = STEP_META[step.kind].icon;
  return (
    <button type="button" onClick={onClick} className="w-full text-left flex items-start gap-2.5 rounded-lg border border-rule bg-sheet px-2.5 py-2 hover:border-gold transition-colors cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <span className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", step.kind === "wait" ? "bg-raised text-graphite" : step.kind === "branch" ? "bg-warn/10 text-warn" : "bg-gold-wash text-gold")}>
        <Icon size={14} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-2">
          <span className="text-[0.77rem] font-semibold text-ink truncate">{stepTitle(step)}</span>
          <span className="ml-auto font-mono text-[0.6rem] text-mist shrink-0">{`Day ${day}`}</span>
        </span>
        <span className="block text-[0.69rem] text-graphite leading-snug line-clamp-2 mt-0.5">{stepDetail(step, day)}</span>
      </span>
      {step.here > 0 && (
        <span className="self-center inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-raised text-[0.64rem] font-medium text-graphite shrink-0" aria-label={`${step.here} people at this step`}>
          <Users size={10} />
          {step.here}
        </span>
      )}
    </button>
  );
}

// Renders one path of a workflow. Branches render their Yes and No paths side by side.
function FlowList({ steps, list, start, onAdd, onEdit }: { steps: Step[]; list: string; start: number; onAdd: (list: string, index: number) => void; onEdit: (list: string, index: number, step: Step) => void }) {
  const days = dayOffsets(steps, start);
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={s.id} className="flex flex-col">
          <Connector onAdd={() => onAdd(list, i)} label={`Add a step before ${stepTitle(s)}`} />
          <StepCard step={s} day={days[i]} onClick={() => onEdit(list, i, s)} />
          {s.kind === "branch" && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(["yes", "no"] as const).map((side) => (
                <div key={side} className="rounded-lg border border-dashed border-rule bg-paper p-2">
                  <div className={cn("text-[0.66rem] font-semibold", side === "yes" ? "text-good" : "text-graphite")}>{side === "yes" ? "Yes" : "No"}</div>
                  <FlowList steps={(side === "yes" ? s.yes : s.no) ?? []} list={`${s.id}:${side}`} start={days[i]} onAdd={onAdd} onEdit={onEdit} />
                </div>
              ))}
            </div>
          )}
        </li>
      ))}
      <li>
        <Connector onAdd={() => onAdd(list, steps.length)} label={steps.length ? "Add a step at the end" : "Add the first step"} />
      </li>
    </ol>
  );
}

// ---- The app -----------------------------------------------------------------------

export function AIPipelinePrototype() {
  const app = useProtoApp("inbox");
  const [people, setPeople] = useState(PEOPLE);
  const [households, setHouseholds] = useState(HOUSEHOLDS);
  const [convs, setConvs] = useState(CONVS);
  const [tasks, setTasks] = useState(TASKS);
  const [flows, setFlows] = useState(FLOWS);
  const [subs, setSubs] = useState(SUBMISSIONS);
  const [modal, setModal] = useState<Modal>(null);
  const [drafting, setDrafting] = useState<string | null>(null);

  const [inboxView, setInboxView] = useState<"open" | "unassigned" | "mine" | "closed">("open");
  const [inboxQuery, setInboxQuery] = useState("");
  const [convId, setConvId] = useState("c1");
  const [convAi, setConvAi] = useState<Record<string, { idx: number; text?: string }>>({});
  const [replyEdit, setReplyEdit] = useState(false);
  const [composer, setComposer] = useState("");
  const [composeMode, setComposeMode] = useState<"reply" | "note">("reply");

  const [boardView, setBoardView] = useState<"all" | "mine" | "stalled">("all");
  const [campus, setCampus] = useState<"all" | Campus>("all");
  const [boardQuery, setBoardQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropOn, setDropOn] = useState<Stage | null>(null);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleStage, setPeopleStage] = useState<"all" | Stage>("all");

  const [ai, setAi] = useState<Record<string, { idx: number; text?: string; sent?: boolean }>>({});
  const [editing, setEditing] = useState(false);
  const [timeline, setTimeline] = useState<TimelineFilter>("all");

  const [taskView, setTaskView] = useState<"open" | "overdue" | "today" | "done">("open");
  const [taskOwner, setTaskOwner] = useState("all");

  const [lang, setLang] = useState<"en" | "tl">("en");
  const [fields, setFields] = useState({ email: true, interests: true, prayer: true });
  const [card, setCard] = useState(SAMPLE_CARDS[0]);
  const [cardSent, setCardSent] = useState<{ name: string; round: number } | null>(null);

  const [range, setRange] = useState<Range>("d90");
  const [summary, setSummary] = useState<{ state: "empty" | "drafting" | "shown" | "sent"; idx: number; text: string }>({ state: "empty", idx: 0, text: "" });
  const [summaryEdit, setSummaryEdit] = useState(false);

  const [guest, setGuest] = useState(EMPTY_GUEST);
  const [touchDraft, setTouchDraft] = useState<{ kind: TouchKind; text: string }>({ kind: "call", text: "" });
  const [taskDraft, setTaskDraft] = useState({ personId: "p1", title: "", owner: ME, due: 1 });
  const [memberDraft, setMemberDraft] = useState<{ name: string; role: Role; age: string }>({ name: "", role: "Spouse", age: "" });
  const [stepDraft, setStepDraft] = useState<StepDraft | null>(null);
  const [flowDraft, setFlowDraft] = useState({ name: "", trigger: TRIGGERS[0], copy: false });
  const [enrollSel, setEnrollSel] = useState<string[]>([]);

  // Moving to another screen closes any open slide-over and resets inline edits.
  const stackKey = app.stack.map((s) => `${s.screen}:${s.id ?? ""}`).join("/");
  const [seenKey, setSeenKey] = useState(stackKey);
  if (seenKey !== stackKey) {
    setSeenKey(stackKey);
    setModal(null);
    setEditing(false);
    setReplyEdit(false);
  }

  // ---- Derived ----
  const person = (id?: string) => people.find((x) => x.id === id);
  const stalled = (p: Person) => p.quiet >= 7;
  const stalledCount = people.filter(stalled).length;
  const openTasks = tasks.filter((x) => !x.done).sort((a, b) => a.due - b.due);
  const overdue = openTasks.filter((x) => x.due < 0);
  const unread = convs.filter((c) => c.open && c.unread).length;
  const unassigned = convs.filter((c) => c.open && !c.assignee).length;
  const enrolledIn = (f: Flow) => countHere(f.steps);
  const f1 = flows.find((f) => f.id === "f1");
  const topOwner = TEAM.reduce((a, b) => (overdue.filter((x) => x.owner === b).length > overdue.filter((x) => x.owner === a).length ? b : a));

  // ---- Shared state changes ----
  const patch = (id: string, fn: (p: Person) => Person) => setPeople((l) => l.map((x) => (x.id === id ? fn(x) : x)));
  const addTouch = (id: string, kind: TouchKind, text: string, by: string) =>
    patch(id, (x) => ({ ...x, quiet: kind === "note" || kind === "stage" || by === "Workflow" ? x.quiet : 0, touches: [...x.touches, { id: uid("t"), date: "Today", kind, text, by }] }));
  const closeModal = () => setModal(null);
  // Slide-overs sit at the top of the scrolling area, so bring it to the top first.
  const scrollAnchor = useRef<HTMLSpanElement>(null);
  const showModal = (m: Exclude<Modal, null>) => {
    scrollAnchor.current?.closest("[data-proto-scroll]")?.scrollTo({ top: 0 });
    setModal(m);
  };

  const enroll = (flowId: string, ids: string[]) => {
    if (!ids.length) return;
    setFlows((l) => l.map((f) => (f.id === flowId && f.steps[0] ? { ...f, steps: [{ ...f.steps[0], here: f.steps[0].here + ids.length }, ...f.steps.slice(1)] } : f)));
    setPeople((l) => l.map((p) => (ids.includes(p.id) ? { ...p, flow: flowId, flowDay: 0 } : p)));
  };

  const openPerson = (p: Person) => {
    setTimeline("all");
    app.open("person", p.id, p.name);
  };

  const moveTo = (p: Person, to: Stage) => {
    if (to === p.stage) return;
    const trigger = STAGE_TRIGGER[to];
    const flow = trigger ? flows.find((f) => f.on && f.trigger === trigger) : undefined;
    patch(p.id, (x) => ({ ...x, stage: to, days: 0, touches: [...x.touches, { id: uid("t"), date: "Today", kind: "stage", text: `Moved to ${stageLabel(to)}.`, by: ME }] }));
    if (flow) enroll(flow.id, [p.id]);
    setAi((a) => ({ ...a, [p.id]: { idx: 0 } }));
    setEditing(false);
    app.notify(`${first(p.name)} moved to ${stageLabel(to)}.${flow ? ` Enrolled in ${flow.name}.` : ""}`);
  };

  // Puts a message on a conversation and lifts it to the top of the inbox.
  const pushMsg = (id: string, msg: Msg, extra: Partial<Conv> = {}) =>
    setConvs((l) => {
      const c = l.find((x) => x.id === id);
      if (!c) return l;
      return [{ ...c, ...extra, at: "Just now", msgs: [...c.msgs, msg] }, ...l.filter((x) => x.id !== id)];
    });

  const sendReply = (c: Conv, raw: string) => {
    const p = person(c.personId);
    const text = raw.trim();
    if (!p || !text) return;
    setConvId(c.id);
    pushMsg(c.id, { id: uid("m"), from: "team", by: ME, text, time: "Just now" }, { assignee: c.assignee ?? ME, unread: false, open: true, drafts: [], reply: undefined });
    addTouch(p.id, "text", text, ME);
    setConvAi((a) => ({ ...a, [c.id]: { idx: 0 } }));
    setReplyEdit(false);
    app.notify(`Reply sent to ${first(p.name)}.${c.assignee ? "" : " Assigned to you."}`);
    const reply = c.reply;
    if (!reply) return;
    // The guest texts back a moment later, and a new draft is ready.
    window.setTimeout(() => {
      setConvs((l) => {
        const cur = l.find((x) => x.id === c.id);
        if (!cur) return l;
        return [{ ...cur, unread: true, at: "Just now", basis: "Last message", drafts: closingDrafts(first(p.name)), msgs: [...cur.msgs, { id: uid("m"), from: "guest", by: p.name, text: reply, time: "Just now" }] }, ...l.filter((x) => x.id !== c.id)];
      });
      addTouch(p.id, "reply", reply, p.name);
    }, 2600);
  };

  const sendComposer = (c: Conv) => {
    const text = composer.trim();
    if (!text) return;
    setComposer("");
    if (composeMode === "note") {
      pushMsg(c.id, { id: uid("m"), from: "note", by: ME, text, time: "Just now" });
      app.notify("Note added. Only the team sees it.");
      return;
    }
    sendReply(c, text);
  };

  const assign = (c: Conv, who: string | null) => {
    setConvId(c.id);
    setConvs((l) => l.map((x) => (x.id === c.id ? { ...x, assignee: who } : x)));
    app.notify(who ? `Assigned to ${who === ME ? "you" : who}` : "Conversation unassigned");
  };

  const toggleConv = (c: Conv) => {
    setConvId(c.id);
    setConvs((l) => l.map((x) => (x.id === c.id ? { ...x, open: !x.open, unread: false } : x)));
    app.notify(c.open ? "Conversation closed" : "Conversation reopened");
  };

  const selectConv = (c: Conv) => {
    setConvId(c.id);
    setReplyEdit(false);
    setComposer("");
    if (c.unread) setConvs((l) => l.map((x) => (x.id === c.id ? { ...x, unread: false } : x)));
  };

  const regenReply = (c: Conv) => {
    setReplyEdit(false);
    setDrafting(`c:${c.id}`);
    window.setTimeout(() => {
      setConvAi((a) => ({ ...a, [c.id]: { idx: (a[c.id]?.idx ?? 0) + 1 } }));
      setDrafting(null);
    }, 700);
  };

  const textPerson = (p: Person) => {
    const c = convs.find((x) => x.personId === p.id);
    if (!c) {
      const id = uid("c");
      setConvs((l) => [{ id, personId: p.id, assignee: p.owner, open: true, unread: false, at: "Just now", drafts: [], basis: "", msgs: [] }, ...l]);
      setConvId(id);
    } else {
      if (!c.open) setConvs((l) => l.map((x) => (x.id === c.id ? { ...x, open: true } : x)));
      setConvId(c.id);
    }
    setInboxView("open");
    setInboxQuery("");
    app.section("inbox");
  };

  const regenStep = (p: Person) => {
    setEditing(false);
    setDrafting(`p:${p.id}`);
    window.setTimeout(() => {
      setAi((a) => ({ ...a, [p.id]: { idx: (a[p.id]?.idx ?? 0) + 1 } }));
      setDrafting(null);
    }, 700);
  };

  const approveStep = (p: Person, text: string) => {
    const msg: Msg = { id: uid("m"), from: "team", by: p.owner, text, time: "Just now" };
    const c = convs.find((x) => x.personId === p.id);
    if (c) pushMsg(c.id, msg, { open: true, drafts: [] });
    else setConvs((l) => [{ id: uid("c"), personId: p.id, assignee: p.owner, open: true, unread: false, at: "Just now", drafts: [], basis: "", msgs: [msg] }, ...l]);
    addTouch(p.id, "text", text, p.owner);
    setAi((a) => ({ ...a, [p.id]: { idx: a[p.id]?.idx ?? 0, sent: true } }));
    setTasks((l) => [{ id: uid("k"), personId: p.id, title: `Check for ${first(p.name)}'s reply`, owner: p.owner, due: 2, done: false, source: "AI next step" }, ...l]);
    setEditing(false);
    app.notify(`Approved. Text sent to ${first(p.name)} from ${first(p.owner)}. Reply check added to tasks.`);
  };

  const setOwner = (p: Person, owner: string) => {
    patch(p.id, (x) => ({ ...x, owner }));
    setTasks((l) => l.map((x) => (x.personId === p.id && !x.done ? { ...x, owner } : x)));
    app.notify(`${first(p.name)} is now with ${owner}. Open tasks moved too.`);
  };

  const toggleTask = (k: Task) => {
    setTasks((l) => l.map((x) => (x.id === k.id ? { ...x, done: !x.done } : x)));
    if (k.done) return app.notify("Task reopened");
    addTouch(k.personId, "task", k.title, k.owner);
    app.notify(`Done. Logged on ${first(person(k.personId)?.name ?? "their")}'s timeline.`);
  };

  const openTaskModal = (personId?: string) => {
    const p = person(personId) ?? people[0];
    setTaskDraft({ personId: p.id, title: "", owner: p.owner, due: 1 });
    showModal("task");
  };

  const addTask = () => {
    const title = taskDraft.title.trim();
    const p = person(taskDraft.personId);
    if (!title || !p) return;
    setTasks((l) => [{ id: uid("k"), personId: p.id, title, owner: taskDraft.owner, due: taskDraft.due, done: false, source: "Manual" }, ...l]);
    closeModal();
    app.notify(`Task added for ${first(taskDraft.owner)}: ${title}`);
  };

  const addGuest = () => {
    const name = guest.name.trim();
    if (!name) return;
    const id = uid("p");
    const owner = guest.owner === "auto" ? GROUPS[guest.area].leader : guest.owner;
    const enrollNow = guest.enroll && !!f1;
    const touches: Touch[] = [{ id: uid("t"), date: "Today", kind: "visit", text: `First visit, ${guest.service}.${CAME_WITH[guest.with]}`, by: "Welcome team" }];
    if (enrollNow && f1?.on) touches.push({ id: uid("t"), date: "Today", kind: "text", text: "Welcome text from New guest journey.", by: "Workflow" });
    setPeople((l) => [{ id, name, phone: guest.phone.trim() || "No number", area: guest.area, stage: "guest", days: 0, quiet: 0, owner, source: "Added by staff", visits: 1, touches }, ...l]);
    if (enrollNow) enroll("f1", [id]);
    setTasks((l) => [{ id: uid("k"), personId: id, title: `Thank-you call to ${first(name)}`, owner, due: 2, done: false, source: enrollNow ? "New guest journey" : "Manual" }, ...l]);
    closeModal();
    setGuest(EMPTY_GUEST);
    app.notify(`${first(name)} added to Guest. Owner: ${owner}.${enrollNow ? " Enrolled in New guest journey." : ""}`);
  };

  const submitCard = () => {
    const name = card.name.trim();
    const phone = card.phone.trim();
    if (!name || !phone) return;
    const id = uid("p");
    const area = CAMPUS_AREA[card.campus];
    const owner = GROUPS[area].leader;
    const second = card.visit === "Second visit";
    const live = !!f1?.on;
    const prayer = fields.prayer ? card.prayer.trim() : "";
    const interests = fields.interests ? card.interests : [];
    const touches: Touch[] = [
      { id: uid("t"), date: "Today", kind: "card", text: `Connection card, ${card.campus}.${interests.length ? ` Ticked: ${interests.map(lower).join(", ")}.` : ""}`, by: name },
      { id: uid("t"), date: "Today", kind: "visit", text: second ? "Second visit." : "First visit.", by: "Welcome team" },
    ];
    if (live) touches.push({ id: uid("t"), date: "Today", kind: "text", text: "Welcome text from New guest journey.", by: "Workflow" });
    if (prayer) touches.push({ id: uid("t"), date: "Today", kind: "note", text: `Prayer request: ${prayer}`, by: name });
    setPeople((l) => [{ id, name, phone, area, stage: second ? "returning" : "guest", days: 0, quiet: 0, owner, source: "Connection card", visits: second ? 2 : 1, touches }, ...l]);
    enroll("f1", [id]);
    setSubs((l) => [{ id: uid("u"), personId: id, when: "Just now", visit: card.visit, interests, prayer: prayer || undefined }, ...l]);
    const body = f1?.steps.find((s) => s.kind === "text")?.body ?? "";
    setConvs((l) => [{ id: uid("c"), personId: id, assignee: owner, open: true, unread: false, at: "Just now", drafts: [], basis: "", msgs: live ? [{ id: uid("m"), from: "flow", by: "New guest journey", text: fillText(body, first(name), owner), time: "Just now" }] : [] }, ...l]);
    setTasks((l) => [
      ...(prayer ? [{ id: uid("k"), personId: id, title: `Pray and follow up on ${first(name)}'s request`, owner: ME, due: 1, done: false, source: "Connection card" }] : []),
      ...(live ? [{ id: uid("k"), personId: id, title: `Thank-you call to ${first(name)}`, owner, due: 2, done: false, source: "New guest journey" }] : []),
      ...l,
    ]);
    setCardSent((c) => ({ name: first(name), round: (c?.round ?? 0) + 1 }));
    app.notify(`${first(name)} added to ${second ? "Returning" : "Guest"}. ${live ? `Welcome text sent, call task for ${first(owner)}.` : "Journey is paused, so no text went out."}`);
  };

  const logActivity = (p: Person) => {
    const text = touchDraft.text.trim();
    if (!text) return;
    addTouch(p.id, touchDraft.kind, text, ME);
    let extra = "";
    if (touchDraft.kind === "visit") {
      const visits = p.visits + 1;
      patch(p.id, (x) => ({ ...x, visits }));
      if (visits === 2 && p.stage === "guest") {
        // Second-visit trigger: the guest moves on and the follow-up workflow starts.
        const f2 = flows.find((f) => f.on && f.trigger === "Guest visits twice");
        patch(p.id, (x) => ({ ...x, stage: "returning", days: 0, touches: [...x.touches, { id: uid("t"), date: "Today", kind: "stage", text: "Visited twice. Moved to Returning.", by: "Workflow" }] }));
        if (f2) enroll(f2.id, [p.id]);
        extra = ` Second visit: moved to Returning${f2 ? ` and enrolled in ${f2.name}` : ""}.`;
      }
    }
    closeModal();
    setTouchDraft({ kind: "call", text: "" });
    app.notify(`${KIND[touchDraft.kind].label} logged for ${first(p.name)}.${extra}`);
  };

  const addMember = (p: Person) => {
    const name = memberDraft.name.trim();
    if (!name) return;
    const member: Member = { name, role: memberDraft.role, age: Number(memberDraft.age) || undefined };
    const key = p.household && households[p.household] ? p.household : uid("h");
    setHouseholds((h) => ({ ...h, [key]: h[key] ? { ...h[key], members: [...h[key].members, member] } : { name: `${last(p.name)} household`, members: [{ name: p.name, role: "Primary contact", personId: p.id }, member] } }));
    if (key !== p.household) patch(p.id, (x) => ({ ...x, household: key }));
    closeModal();
    setMemberDraft({ name: "", role: "Spouse", age: "" });
    app.notify(`${first(name)} added to the ${last(p.name)} household`);
  };

  // ---- Workflow editing ----
  const toggleFlow = (f: Flow) => {
    setFlows((l) => l.map((x) => (x.id === f.id ? { ...x, on: !x.on } : x)));
    const n = enrolledIn(f);
    app.notify(f.on ? `Paused ${f.name}. ${n} people hold at their step.` : `Resumed ${f.name}. ${n} people move on from their step.`);
  };

  const addStepAt = (f: Flow, list: string, index: number) => {
    setStepDraft({ flowId: f.id, list, index, isNew: true, step: { id: uid("s"), here: 0, ...STEP_DEFAULTS.text }, ai: false, round: 0 });
    showModal("step");
  };
  const editStepAt = (f: Flow, list: string, index: number, step: Step) => {
    setStepDraft({ flowId: f.id, list, index, isNew: false, step: { ...step }, ai: false, round: 0 });
    showModal("step");
  };
  const setStepField = (fields: Partial<Step>) => setStepDraft((d) => (d ? { ...d, step: { ...d.step, ...fields } } : d));

  const draftStepWithAi = () => {
    if (!stepDraft) return;
    setDrafting("step");
    window.setTimeout(() => {
      setStepDraft((d) => (d ? { ...d, ai: true, round: d.round + 1, step: { ...d.step, body: stepAiDraft(d.step, d.round) } } : d));
      setDrafting(null);
    }, 700);
  };

  const saveStep = () => {
    if (!stepDraft || !stepValid(stepDraft.step)) return;
    const { flowId, list, index, isNew, step } = stepDraft;
    setFlows((l) => l.map((f) => (f.id !== flowId ? f : { ...f, steps: editList(f.steps, list, (s) => (isNew ? [...s.slice(0, index), step, ...s.slice(index)] : s.map((x, i) => (i === index ? step : x)))) })));
    closeModal();
    app.notify(stepDraft.ai ? `Step saved. You approved the AI draft.` : isNew ? `Step added: ${stepTitle(step)}` : `Step saved: ${stepTitle(step)}`);
  };

  const removeStep = () => {
    if (!stepDraft) return;
    const { flowId, list, index, step } = stepDraft;
    setFlows((l) =>
      l.map((f) =>
        f.id !== flowId
          ? f
          : {
              ...f,
              steps: editList(f.steps, list, (s) => {
                const rest = s.filter((_, i) => i !== index);
                // People waiting on a removed step move on to the next one.
                return step.here && rest[index] ? rest.map((x, i) => (i === index ? { ...x, here: x.here + step.here } : x)) : rest;
              }),
            },
      ),
    );
    closeModal();
    app.notify(`Step removed: ${stepTitle(step)}`);
  };

  const createFlow = () => {
    const name = flowDraft.name.trim();
    if (!name) return;
    const id = uid("f");
    const steps = flowDraft.copy && f1 ? cloneSteps(f1.steps) : [{ id: uid("s"), here: 0, kind: "text" as const, body: "Hi {first}, this is {owner} from Grace Fellowship. We would love to hear how you are doing." }];
    setFlows((l) => [...l, { id, name, trigger: flowDraft.trigger, on: false, completed: 0, replied: 0, steps }]);
    setFlowDraft({ name: "", trigger: TRIGGERS[0], copy: false });
    app.open("workflow", id, name);
    app.notify(`${name} created and paused. Add steps, then resume.`);
  };

  // ---- Insights ----
  const summaryDraft = (idx: number) => {
    const returning = people.filter((p) => p.stage === "returning").length;
    const prayer = person("p13");
    const drafts = [
      `Week of Oct 25. 9 first-time guests across three campuses, and ${returning} people are now returning guests. The team answered 37 texts with a median first reply of ${REPLY_MEDIAN.d30} minutes. ${stalledCount} people have had no personal contact in 7 or more days. ${overdue.length} tasks are overdue, and ${topOwner} has the most.${prayer ? ` ${prayer.name} asked for prayer for her mother, who is in the hospital in Cainta.` : ""}\n\nSuggested focus before Sunday: clear the overdue calls, and invite returning guests to the Newcomers' lunch on Nov 8.`,
      `Guests are coming back, but slowly: 47% of first-time guests in the last 90 days made a second visit, against a goal of 60%. The biggest drop is still right after the first visit. ${unassigned} inbox conversations have no owner yet, and ${stalledCount} people are stalled. ${topOwner} has the most overdue tasks.\n\nSuggested focus: assign every open conversation today, and ask each group leader to call one Connected person this week.`,
    ];
    return drafts[idx % drafts.length];
  };
  const draftSummary = () => {
    const idx = summary.state === "shown" ? summary.idx + 1 : summary.idx;
    setSummaryEdit(false);
    setSummary({ state: "drafting", idx, text: "" });
    window.setTimeout(() => setSummary({ state: "shown", idx, text: summaryDraft(idx) }), 700);
  };
  const approveSummary = () => {
    setSummaryEdit(false);
    setSummary((s) => ({ ...s, state: "sent" }));
    app.notify("Weekly summary approved and sent to 3 pastors");
  };

  // ---- Current screen data ----
  const bq = boardQuery.trim().toLowerCase();
  const boardPeople = people.filter((p) => (boardView === "all" || (boardView === "mine" && p.owner === ME) || (boardView === "stalled" && stalled(p))) && (campus === "all" || campusOf(p.area) === campus) && (!bq || p.name.toLowerCase().includes(bq)));
  const pq = peopleQuery.trim().toLowerCase();
  const peopleRows = people.filter((p) => (peopleStage === "all" || p.stage === peopleStage) && (campus === "all" || campusOf(p.area) === campus) && (!pq || `${p.name} ${p.phone} ${p.area}`.toLowerCase().includes(pq)));

  const iq = inboxQuery.trim().toLowerCase();
  const inboxRows = convs.filter((c) => {
    const inView = inboxView === "closed" ? !c.open : c.open && (inboxView === "open" || (inboxView === "unassigned" && !c.assignee) || (inboxView === "mine" && c.assignee === ME));
    return inView && (!iq || `${person(c.personId)?.name ?? ""} ${c.msgs.map((x) => x.text).join(" ")}`.toLowerCase().includes(iq));
  });
  const conv = inboxRows.find((c) => c.id === convId) ?? inboxRows[0];
  const convPerson = conv ? person(conv.personId) : undefined;
  const lastMsg = conv?.msgs.filter((x) => x.from !== "note").slice(-1)[0];
  const needsReply = !!conv && !!convPerson && conv.open && lastMsg?.from === "guest";
  // Our side spoke last: suggest a check-in only once the silence is a few days old.
  const waiting = !!conv && !!convPerson && conv.open && !!lastMsg && lastMsg.from !== "guest";
  const quietThread = waiting && lastMsg?.time !== "Just now";
  const convDrafts = conv && convPerson ? (conv.drafts.length ? conv.drafts : needsReply ? closingDrafts(first(convPerson.name)) : checkInDrafts(first(convPerson.name), convPerson.owner)) : [];
  const cst = (conv && convAi[conv.id]) || { idx: 0 };
  const replyText = cst.text ?? convDrafts[cst.idx % (convDrafts.length || 1)] ?? "";
  const replyBusy = !!conv && drafting === `c:${conv.id}`;

  const cur = app.screen === "person" ? person(app.id) : undefined;
  const curHousehold = cur?.household ? households[cur.household] : undefined;
  const sug = cur ? suggest(cur, curHousehold) : null;
  const st = (cur && ai[cur.id]) || { idx: 0 };
  const draftText = sug ? st.text ?? sug.drafts[st.idx % sug.drafts.length] : "";
  const stepBusy = !!cur && drafting === `p:${cur.id}`;
  const curTasks = cur ? openTasks.filter((x) => x.personId === cur.id) : [];
  const curFlow = cur ? flows.find((f) => f.id === cur.flow) : undefined;
  const curTimeline = cur ? [...cur.touches].reverse().filter((x) => timeline === "all" || KIND[x.kind].group === timeline) : [];

  const taskRows = (taskView === "done" ? tasks.filter((x) => x.done) : taskView === "overdue" ? overdue : taskView === "today" ? openTasks.filter((x) => x.due === 0) : openTasks).filter((x) => taskOwner === "all" || x.owner === taskOwner);

  const flow = app.screen === "workflow" ? flows.find((f) => f.id === app.id) : undefined;
  const enrollCandidates = flow ? people.filter((p) => p.flow !== flow.id) : [];

  const funnel = FUNNEL[range];
  const worst = funnel.reduce((w, n, i) => (i > 0 && n / funnel[i - 1] < funnel[w] / funnel[w - 1] ? i : w), 1);
  const copy = CARD_COPY[lang];

  const nav = [
    { id: "inbox", label: "Inbox", icon: Inbox, badge: unread },
    { id: "board", label: "Board", icon: Kanban },
    { id: "people", label: "People", icon: Users },
    { id: "tasks", label: "Tasks", icon: ListChecks, badge: openTasks.length },
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "card", label: "Connection card", icon: QrCode },
    { id: "insights", label: "Insights", icon: BarChart3 },
  ];

  return (
    <ProtoApp app={app} name="AI Church Pipeline · Grace Fellowship" user="Pastor Joel Navarro" nav={nav} alerts={overdue.length + unassigned}>
      <span ref={scrollAnchor} hidden />
      {/* ---- Inbox ---- */}
      {app.screen === "inbox" && (
        <>
          <ScreenHeader
            title="Inbox"
            subtitle={`${convs.filter((c) => c.open).length} open · ${unassigned} unassigned · texts to 0917 555 0100`}
            action={<Segmented id="pl-inbox" value={inboxView} onChange={(v) => { setInboxView(v); setReplyEdit(false); }} options={[{ id: "open", label: "Open" }, { id: "unassigned", label: "Unassigned" }, { id: "mine", label: "Mine" }, { id: "closed", label: "Closed" }]} />}
          />
          <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] gap-3 items-start">
            <div className="bg-sheet border border-rule rounded-lg overflow-hidden">
              <div className="p-2 border-b border-rule">
                <SearchBox value={inboxQuery} onChange={setInboxQuery} placeholder="Search texts" />
              </div>
              <ul className="max-h-[27rem] overflow-y-auto divide-y divide-rule-soft">
                {inboxRows.map((c) => {
                  const p = person(c.personId);
                  const lastText = c.msgs.slice(-1)[0];
                  const on = conv?.id === c.id;
                  return (
                    <li key={c.id}>
                      <button type="button" onClick={() => selectConv(c)} aria-current={on ? "true" : undefined} className={cn("w-full flex gap-2 px-2.5 py-2 text-left cursor-pointer transition-colors", on ? "bg-gold-wash" : "hover:bg-paper")}>
                        <Avatar name={p?.name ?? "?"} size={26} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline gap-1.5">
                            <span className={cn("flex-1 truncate text-[0.78rem] text-ink", c.unread ? "font-semibold" : "font-medium")}>{p?.name}</span>
                            <span className="text-[0.6rem] text-mist shrink-0">{c.at}</span>
                          </span>
                          <span className="block truncate text-[0.7rem] text-graphite">{lastText ? lastText.text : "No messages yet"}</span>
                          <span className={cn("block text-[0.62rem] mt-0.5", c.assignee ? "text-mist" : "text-warn font-medium")}>{c.assignee ? first(c.assignee) : "Unassigned"}</span>
                        </span>
                        {c.unread && <span className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0" aria-label="Unread" />}
                      </button>
                    </li>
                  );
                })}
                {!inboxRows.length && <li className="px-3 py-8 text-center text-[0.75rem] text-mist">No conversations here.</li>}
              </ul>
            </div>

            {conv && convPerson ? (
              <section aria-label={`Conversation with ${convPerson.name}`} className="bg-sheet border border-rule rounded-lg flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 px-3 py-2.5 border-b border-rule">
                  <Avatar name={convPerson.name} size={30} />
                  <div className="flex-1 min-w-0">
                    <button type="button" onClick={() => openPerson(convPerson)} className="block text-[0.85rem] font-semibold text-ink hover:text-gold-bright cursor-pointer truncate">
                      {convPerson.name}
                    </button>
                    <span className="block text-[0.68rem] text-mist truncate">
                      {stageLabel(convPerson.stage)} · {campusOf(convPerson.area)} · {convPerson.phone}
                    </span>
                  </div>
                  <select aria-label="Assign conversation" value={conv.assignee ?? ""} onChange={(e) => assign(conv, e.target.value || null)} className={selectSm}>
                    <option value="">Unassigned</option>
                    {TEAM.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                  <SmallButton onClick={() => toggleConv(conv)}>{conv.open ? <><Check size={12} /> Close</> : "Reopen"}</SmallButton>
                </div>
                {!conv.assignee && conv.open && (
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-rule bg-paper text-[0.72rem] text-graphite">
                    <span className="flex-1 min-w-[10rem]">No one owns this yet. {first(convPerson.name)}&apos;s follow-up owner is {convPerson.owner}.</span>
                    <SmallButton onClick={() => assign(conv, convPerson.owner)}>Assign to {first(convPerson.owner)}</SmallButton>
                    <SmallButton onClick={() => assign(conv, ME)}>Take it</SmallButton>
                  </div>
                )}
                <div className="flex flex-col-reverse gap-2 px-3 py-3 max-h-[11.5rem] overflow-y-auto bg-paper">
                  {[...conv.msgs].reverse().map((x) => (
                    <Bubble key={x.id} msg={x} />
                  ))}
                  {!conv.msgs.length && <p className="text-center text-[0.74rem] text-mist py-6">No messages yet. Write the first text below.</p>}
                </div>
                {(needsReply || quietThread) && (
                  <div className="px-3 py-2.5 border-t border-rule">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-[0.78rem] font-semibold text-ink">{needsReply ? "Suggested reply" : "Suggested check-in"}</span>
                      <AiTag text="AI draft · review before sending" />
                    </div>
                    <div className="rounded-md border border-dashed border-gold/40 bg-gold-wash p-2.5 min-h-[3.75rem]">
                      {replyBusy ? (
                        <span className="text-[0.76rem] text-graphite">Drafting a new version…</span>
                      ) : replyEdit ? (
                        <textarea aria-label="Edit suggested reply" value={replyText} onChange={(e) => setConvAi((a) => ({ ...a, [conv.id]: { ...cst, text: e.target.value } }))} rows={3} className="w-full bg-transparent text-[0.78rem] text-ink leading-relaxed outline-none resize-none" />
                      ) : (
                        <p className="text-[0.78rem] text-ink-soft leading-relaxed">{replyText}</p>
                      )}
                    </div>
                    <div className="text-[0.64rem] text-mist mt-1">Based on: {needsReply ? conv.basis || "the last message" : `no reply from ${first(convPerson.name)} since ${lastMsg?.time ?? "the last text"}`}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <SmallButton onClick={() => regenReply(conv)} disabled={replyBusy}><RefreshCw size={12} /> Regenerate</SmallButton>
                      <SmallButton onClick={() => setReplyEdit((e) => !e)} disabled={replyBusy}><Pencil size={12} /> {replyEdit ? "Done editing" : "Edit"}</SmallButton>
                      <PrimaryButton onClick={() => sendReply(conv, replyText)} disabled={replyBusy || !replyText.trim()}><Send size={13} /> Approve and send</PrimaryButton>
                    </div>
                  </div>
                )}
                {waiting && !quietThread && (
                  <div className="flex items-center gap-2 px-3 py-2.5 border-t border-rule text-[0.74rem] text-graphite">
                    <Check size={13} className="text-good shrink-0" />
                    Sent. Waiting for {first(convPerson.name)} to reply. A new AI draft appears when they text back.
                  </div>
                )}
                <div className="px-3 py-2.5 border-t border-rule bg-paper rounded-b-lg">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-[0.64rem] text-mist mr-0.5">Quick replies</span>
                    {QUICK.map((q) => (
                      <button key={q.label} type="button" onClick={() => { setComposeMode("reply"); setComposer(fillText(q.text, first(convPerson.name), ME)); }} className="px-2 py-0.5 rounded-full border border-rule bg-sheet text-[0.68rem] text-ink-soft hover:border-gold hover:text-ink cursor-pointer transition-colors">
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <textarea aria-label={composeMode === "reply" ? "Write a text" : "Write an internal note"} value={composer} onChange={(e) => setComposer(e.target.value)} rows={2} placeholder={composeMode === "reply" ? `Text ${first(convPerson.name)}…` : "Note for the team. The guest never sees it."} className={cn(textareaClass, "min-h-[3.25rem]", composeMode === "note" && "bg-warn/5")} />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Segmented id="pl-compose" value={composeMode} onChange={setComposeMode} options={[{ id: "reply", label: "Text" }, { id: "note", label: "Internal note" }]} />
                    <span className="text-[0.64rem] text-mist font-mono">{composeMode === "reply" ? `${composer.length}/160` : "Team only"}</span>
                    <span className="ml-auto">
                      <PrimaryButton onClick={() => sendComposer(conv)} disabled={!composer.trim()}><Send size={13} /> {composeMode === "reply" ? "Send" : "Add note"}</PrimaryButton>
                    </span>
                  </div>
                </div>
              </section>
            ) : (
              <div className="bg-sheet border border-rule rounded-lg px-4 py-16 text-center text-[0.8rem] text-mist">Pick a conversation to read and reply.</div>
            )}
          </div>
        </>
      )}

      {/* ---- Board ---- */}
      {app.screen === "board" && (
        <>
          <ScreenHeader title="Pipeline" subtitle={`${people.length} people · ${stalledCount} stalled, no personal contact in 7+ days`} action={<PrimaryButton onClick={() => showModal("guest")}><UserPlus size={14} /> New guest</PrimaryButton>} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Segmented id="pl-view" value={boardView} onChange={setBoardView} options={[{ id: "all", label: "Everyone" }, { id: "mine", label: "Mine" }, { id: "stalled", label: "Stalled" }]} />
            <select aria-label="Campus" value={campus} onChange={(e) => setCampus(e.target.value as "all" | Campus)} className={selectSm}>
              <option value="all">All campuses</option>
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="w-44">
              <SearchBox value={boardQuery} onChange={setBoardQuery} placeholder="Find a person" />
            </div>
            <span className="ml-auto text-[0.68rem] text-mist">Drag a card to move it</span>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-cols-5 gap-2 min-w-[45rem]">
              {STAGES.map((s, si) => {
                const list = boardPeople.filter((p) => p.stage === s.id);
                const late = list.filter(stalled).length;
                return (
                  <section
                    key={s.id}
                    aria-label={`${s.label}, ${list.length}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dropOn !== s.id) setDropOn(s.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const p = person(dragId ?? undefined);
                      if (p) moveTo(p, s.id);
                      setDragId(null);
                      setDropOn(null);
                    }}
                    className={cn("rounded-lg border min-h-[25rem] transition-colors", dropOn === s.id && dragId ? "border-gold bg-gold-wash" : "border-rule bg-sheet")}
                  >
                    <div className="px-2.5 py-2 border-b border-rule">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75rem] font-semibold text-ink">{s.label}</span>
                        <span className="font-mono text-[0.68rem] text-mist">{list.length}</span>
                      </div>
                      <div className={cn("text-[0.62rem]", late ? "text-danger" : "text-mist")}>{late ? `${late} stalled` : s.hint}</div>
                    </div>
                    <ul className="flex flex-col gap-1.5 p-1.5">
                      {list.map((p) => {
                        const prev = stageAt(si - 1);
                        const next = stageAt(si + 1);
                        return (
                          <li
                            key={p.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", p.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDragId(p.id);
                            }}
                            onDragEnd={() => {
                              setDragId(null);
                              setDropOn(null);
                            }}
                            className={cn("bg-paper border border-rule-soft rounded-md p-2 cursor-grab active:cursor-grabbing", dragId === p.id && "opacity-50")}
                          >
                            <button type="button" onClick={() => openPerson(p)} className="group flex items-center gap-1.5 w-full text-left cursor-pointer">
                              <Avatar name={p.name} size={22} />
                              <span className="flex-1 min-w-0 truncate text-[0.77rem] font-medium text-ink group-hover:text-gold-bright">{p.name}</span>
                            </button>
                            <div className="mt-1 text-[0.66rem] text-mist truncate" title={`${campusOf(p.area)} campus`}>
                              {p.days === 0 ? "New today" : `${p.days}d in stage`} · {first(p.owner)} · {campusOf(p.area)}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {stalled(p) ? <Status tone="bad">{`No contact ${p.quiet}d`}</Status> : <Status tone="good">On track</Status>}
                              <span className="ml-auto flex gap-1">
                                <MoveButton label={prev ? `Move ${first(p.name)} back to ${stageLabel(prev)}` : "Already at the first stage"} disabled={!prev} onClick={() => prev && moveTo(p, prev)}>
                                  <ChevronLeft size={12} />
                                </MoveButton>
                                <MoveButton label={next ? `Move ${first(p.name)} to ${stageLabel(next)}` : "Already at the last stage"} disabled={!next} onClick={() => next && moveTo(p, next)}>
                                  <ChevronRight size={12} />
                                </MoveButton>
                              </span>
                            </div>
                          </li>
                        );
                      })}
                      {list.length === 0 && <li className="px-1 py-4 text-center text-[0.72rem] text-mist">No one here</li>}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ---- People ---- */}
      {app.screen === "people" && (
        <>
          <ScreenHeader title="People" subtitle={`${people.length} in follow-up · ${Object.keys(households).length} households`} action={<PrimaryButton onClick={() => showModal("guest")}><UserPlus size={14} /> New guest</PrimaryButton>} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="w-56">
              <SearchBox value={peopleQuery} onChange={setPeopleQuery} placeholder="Search name, number, or area" />
            </div>
            <select aria-label="Stage" value={peopleStage} onChange={(e) => setPeopleStage(e.target.value as "all" | Stage)} className={selectSm}>
              <option value="all">All stages</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <select aria-label="Campus" value={campus} onChange={(e) => setCampus(e.target.value as "all" | Campus)} className={selectSm}>
              <option value="all">All campuses</option>
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Table
            rows={peopleRows}
            rowKey={(p) => p.id}
            onRowClick={openPerson}
            empty="No one matches."
            columns={[
              { key: "name", label: "Name", render: (p) => <span className="flex items-center gap-2.5"><Avatar name={p.name} size={26} /><span className="min-w-0"><span className="block text-ink font-medium">{p.name}</span><span className="block text-[0.68rem] text-mist">{p.phone}</span></span></span> },
              { key: "stage", label: "Stage", render: (p) => stageLabel(p.stage) },
              { key: "campus", label: "Campus", hideOnMobile: true, render: (p) => campusOf(p.area) },
              { key: "owner", label: "Owner", hideOnMobile: true, render: (p) => <span className="flex items-center gap-2"><Avatar name={p.owner} size={20} />{first(p.owner)}</span> },
              { key: "flow", label: "Workflow", hideOnMobile: true, render: (p) => <span className="text-[0.74rem] text-graphite">{flows.find((f) => f.id === p.flow)?.name ?? "None"}</span> },
              { key: "contact", label: "Last contact", align: "right", render: (p) => (stalled(p) ? <Status tone="bad">{`${p.quiet}d ago`}</Status> : <span className="text-[0.74rem] text-graphite">{ago(p.quiet)}</span>) },
            ]}
          />
        </>
      )}

      {/* ---- Person ---- */}
      {app.screen === "person" && cur && sug && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Avatar name={cur.name} size={46} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-[1.45rem] leading-tight font-semibold text-ink">{cur.name}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                {stalled(cur) ? <Status tone="bad">{`No contact in ${cur.quiet} days`}</Status> : <Status tone="good">{`Contacted ${ago(cur.quiet).toLowerCase()}`}</Status>}
                <span className="text-[0.72rem] text-mist">
                  {stageLabel(cur.stage)} · {cur.days === 0 ? "new to this stage" : `${cur.days} days in stage`} · {campusOf(cur.area)} · {cur.visits} {cur.visits === 1 ? "visit" : "visits"}
                </span>
              </div>
            </div>
            <SmallButton onClick={() => textPerson(cur)}><MessageSquare size={12} /> Text</SmallButton>
            <SmallButton onClick={() => showModal("touch")}><Plus size={12} /> Log activity</SmallButton>
            {stageAt(stageIndex(cur.stage) + 1) ? (
              <PrimaryButton onClick={() => moveTo(cur, stageAt(stageIndex(cur.stage) + 1) ?? cur.stage)}>Move to {stageLabel(stageAt(stageIndex(cur.stage) + 1) ?? cur.stage)} <ArrowRight size={13} /></PrimaryButton>
            ) : (
              <Status tone="good">Serving</Status>
            )}
          </div>
          <Stepper stage={cur.stage} />
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Suggested next step" action={<AiTag text="AI draft · review before sending" />}>
                <div className="text-[0.92rem] font-semibold text-ink">{sug.step}</div>
                <p className="text-[0.72rem] text-graphite mt-0.5">{sug.why}</p>
                <p className="text-[0.66rem] text-mist mt-0.5">Based on: {sug.basis}</p>
                {st.sent ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <Status tone="good">Approved and sent</Status>
                      <span className="text-[0.72rem] text-mist">From {first(cur.owner)}. Reply check due {dayLabel(2)}.</span>
                    </span>
                    <SmallButton onClick={() => { setAi((a) => ({ ...a, [cur.id]: { idx: st.idx } })); regenStep(cur); }}><RefreshCw size={12} /> Draft another</SmallButton>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 rounded-md border border-dashed border-gold/40 bg-gold-wash p-3 min-h-[5rem]">
                      {stepBusy ? (
                        <span className="text-[0.78rem] text-graphite">Drafting a new version…</span>
                      ) : editing ? (
                        <textarea aria-label="Edit draft message" value={draftText} onChange={(e) => setAi((a) => ({ ...a, [cur.id]: { ...st, text: e.target.value } }))} rows={4} className="w-full bg-transparent text-[0.8rem] text-ink leading-relaxed outline-none resize-none" />
                      ) : (
                        <p className="text-[0.8rem] text-ink-soft leading-relaxed">{draftText}</p>
                      )}
                    </div>
                    <div className="text-[0.66rem] text-mist mt-1.5">
                      Text to {cur.phone} from {first(cur.owner)} · {st.text !== undefined ? "edited by you" : `version ${(st.idx % sug.drafts.length) + 1} of ${sug.drafts.length}`}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <SmallButton onClick={() => regenStep(cur)} disabled={stepBusy}><RefreshCw size={12} /> Regenerate</SmallButton>
                      <SmallButton onClick={() => setEditing((e) => !e)} disabled={stepBusy}><Pencil size={12} /> {editing ? "Done editing" : "Edit"}</SmallButton>
                      <PrimaryButton onClick={() => approveStep(cur, draftText.trim())} disabled={stepBusy || !draftText.trim()}><Send size={13} /> Approve and send</PrimaryButton>
                    </div>
                  </>
                )}
              </Panel>

              <Panel title="Open tasks" action={<SmallButton onClick={() => openTaskModal(cur.id)}><Plus size={12} /> Add task</SmallButton>}>
                {curTasks.length ? (
                  <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                    {curTasks.map((k) => (
                      <li key={k.id} className="flex items-center gap-2 py-2">
                        <span className="flex-1 min-w-0">
                          <span className="block text-[0.78rem] text-ink">{k.title}</span>
                          <span className="block text-[0.66rem] text-mist">{k.owner} · {k.source}</span>
                        </span>
                        <Due task={k} />
                        <SmallButton label={`Mark done: ${k.title}`} onClick={() => toggleTask(k)}><Check size={12} /></SmallButton>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[0.76rem] text-mist">No open tasks for {first(cur.name)}.</p>
                )}
              </Panel>

              <Panel title="Household" action={<SmallButton onClick={() => showModal("member")}><Plus size={12} /> Add member</SmallButton>}>
                {curHousehold ? (
                  <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                    {curHousehold.members.map((x, i) => {
                      const linked = x.personId ? person(x.personId) : undefined;
                      return (
                        <li key={`${x.name}-${i}`} className="flex items-center gap-2.5 py-2">
                          <Avatar name={x.name} size={24} />
                          {linked && linked.id !== cur.id ? (
                            <button type="button" onClick={() => openPerson(linked)} className="text-[0.78rem] text-ink hover:text-gold-bright cursor-pointer">{x.name}</button>
                          ) : (
                            <span className="text-[0.78rem] text-ink">{x.name}</span>
                          )}
                          <span className="text-[0.68rem] text-mist">{x.age ? `${x.role}, ${x.age}` : x.role}</span>
                          {linked?.id === cur.id && <span className="ml-auto"><Status tone="muted">This profile</Status></span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[0.76rem] text-mist">No household yet. Add a spouse or kids so follow-up sees the whole family.</p>
                )}
              </Panel>

              <Panel title="Details">
                <KeyValues
                  items={[
                    ["Phone", cur.phone],
                    ["Email", emailOf(cur.name)],
                    ["Campus", `${campusOf(cur.area)} · Sundays ${SERVICES[campusOf(cur.area)]}`],
                    ["Came through", cur.source],
                    ["Nearest group", `${GROUPS[cur.area].name}, ${GROUPS[cur.area].when}`],
                    ["Workflow", curFlow ? `${curFlow.name} · day ${cur.flowDay ?? 0}` : "Not enrolled"],
                    [
                      "Owner",
                      <select key="owner" aria-label="Owner" value={cur.owner} onChange={(e) => setOwner(cur, e.target.value)} className={selectSm}>
                        {TEAM.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>,
                    ],
                  ]}
                />
              </Panel>
            </div>

            <Panel title="Timeline" action={<Segmented id="pl-tl" value={timeline} onChange={setTimeline} options={[{ id: "all", label: "All" }, { id: "visits", label: "Visits" }, { id: "messages", label: "Texts" }, { id: "calls", label: "Calls" }, { id: "tasks", label: "Tasks" }]} />}>
              {curTimeline.length ? (
                <ol className="relative flex flex-col gap-3 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-rule">
                  {curTimeline.map((x) => (
                    <li key={x.id} className="relative flex gap-2.5">
                      <span className="relative w-6 h-6 rounded-full bg-sheet border border-rule flex items-center justify-center text-gold-bright shrink-0">
                        <TouchIcon kind={x.kind} />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[0.78rem] text-ink-soft leading-snug">{x.text}</p>
                        <span className="text-[0.66rem] text-mist">{x.date} · {KIND[x.kind].label} · {x.by}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[0.76rem] text-mist">Nothing of this kind yet.</p>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ---- Tasks ---- */}
      {app.screen === "tasks" && (
        <>
          <ScreenHeader title="Tasks" subtitle={`${openTasks.length} open · ${overdue.length} overdue · every task has an owner and a due date`} action={<PrimaryButton onClick={() => openTaskModal()}><Plus size={14} /> New task</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            {TEAM.map((x) => {
              const mine = openTasks.filter((k) => k.owner === x);
              const late = mine.filter((k) => k.due < 0).length;
              const on = taskOwner === x;
              return (
                <button key={x} type="button" aria-pressed={on} onClick={() => setTaskOwner(on ? "all" : x)} className={cn("text-left bg-sheet border rounded-lg p-3 cursor-pointer transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.04)]", on ? "border-gold shadow-[0_0_0_3px_var(--color-gold-wash)]" : "border-rule hover:border-mist")}>
                  <span className="flex items-center gap-2">
                    <Avatar name={x} size={22} />
                    <span className="text-[0.74rem] font-medium text-ink-soft truncate">{x}</span>
                  </span>
                  <span className="block text-[1.3rem] leading-tight font-semibold text-ink mt-1.5 tabular-nums">{mine.length}</span>
                  <span className={cn("block text-[0.7rem]", late ? "text-danger" : "text-good")}>{late ? `${late} overdue` : "Nothing overdue"}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Segmented id="pl-tasks" value={taskView} onChange={setTaskView} options={[{ id: "open", label: "Open" }, { id: "overdue", label: "Overdue" }, { id: "today", label: "Due today" }, { id: "done", label: "Done" }]} />
            <select aria-label="Owner" value={taskOwner} onChange={(e) => setTaskOwner(e.target.value)} className={selectSm}>
              <option value="all">Everyone</option>
              {TEAM.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
          <Table
            rows={taskRows}
            rowKey={(k) => k.id}
            onRowClick={(k) => {
              const p = person(k.personId);
              if (p) openPerson(p);
            }}
            empty="Nothing in this list."
            columns={[
              { key: "task", label: "Task", render: (k) => <span><span className="block text-ink">{k.title}</span><span className="block text-[0.68rem] text-mist">{person(k.personId)?.name} · {stageLabel(person(k.personId)?.stage ?? "guest")}</span></span> },
              { key: "source", label: "From", hideOnMobile: true, render: (k) => <span className="text-[0.72rem] text-graphite">{k.source}</span> },
              { key: "owner", label: "Owner", hideOnMobile: true, render: (k) => <span className="flex items-center gap-2"><Avatar name={k.owner} size={20} />{first(k.owner)}</span> },
              { key: "due", label: "Due", render: (k) => <span className="flex flex-col items-start gap-0.5"><Due task={k} /><span className="text-[0.64rem] text-mist">{dayLabel(k.due)}</span></span> },
              { key: "act", label: "Action", align: "right", render: (k) => <span onKeyDown={(e) => e.stopPropagation()}><SmallButton onClick={() => toggleTask(k)}>{k.done ? "Reopen" : <><Check size={12} /> Mark done</>}</SmallButton></span> },
            ]}
          />
        </>
      )}

      {/* ---- Workflows ---- */}
      {app.screen === "workflows" && (
        <>
          <ScreenHeader title="Workflows" subtitle={`${flows.filter((f) => f.on).length} active · ${flows.reduce((n, f) => n + enrolledIn(f), 0)} people enrolled`} action={<PrimaryButton onClick={() => showModal("flow")}><Plus size={14} /> New workflow</PrimaryButton>} />
          <Table
            rows={flows}
            rowKey={(f) => f.id}
            onRowClick={(f) => app.open("workflow", f.id, f.name)}
            columns={[
              { key: "name", label: "Workflow", render: (f) => <span><span className="block text-ink font-medium">{f.name}</span><span className="block text-[0.68rem] text-mist">Trigger: {lower(f.trigger)} · {countSteps(f.steps)} steps · {flowDays(f.steps)} days</span></span> },
              { key: "enrolled", label: "Enrolled", align: "right", render: (f) => <span className="font-mono tabular-nums text-ink">{enrolledIn(f)}</span> },
              { key: "done", label: "Finished", align: "right", hideOnMobile: true, render: (f) => <span className="font-mono tabular-nums">{f.completed}</span> },
              { key: "reply", label: "Reply rate", hideOnMobile: true, render: (f) => <span className="flex items-center gap-2"><Meter value={f.replied} max={100} className="w-14" /><span className="font-mono text-[0.7rem]">{f.replied}%</span></span> },
              { key: "status", label: "Status", render: (f) => <Status tone={f.on ? "good" : "muted"}>{f.on ? "Active" : "Paused"}</Status> },
              { key: "toggle", label: "On", align: "right", render: (f) => <span onKeyDown={(e) => e.stopPropagation()} className="inline-flex"><Toggle on={f.on} label={`${f.on ? "Pause" : "Resume"} ${f.name}`} onChange={() => toggleFlow(f)} /></span> },
            ]}
          />
          <p className="text-[0.7rem] text-mist mt-2.5">Workflow messages are written or approved by your team. AI can draft a step, but a person saves it before anything sends.</p>
        </>
      )}

      {app.screen === "workflow" && flow && (
        <>
          <ScreenHeader
            title={flow.name}
            subtitle={`Trigger: ${lower(flow.trigger)} · ${flowDays(flow.steps)} days · ${countSteps(flow.steps)} steps`}
            action={
              <>
                <SmallButton onClick={() => { setEnrollSel([]); showModal("enroll"); }}><UserPlus size={12} /> Enroll people</SmallButton>
                {flow.on ? <SmallButton onClick={() => toggleFlow(flow)}><Pause size={12} /> Pause</SmallButton> : <PrimaryButton onClick={() => toggleFlow(flow)}><Play size={13} /> Resume</PrimaryButton>}
              </>
            }
          />
          {!flow.on && <div className="mb-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[0.76rem] text-ink-soft">Paused. {enrolledIn(flow)} people hold at their current step. Nothing sends until you resume.</div>}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_13.5rem] gap-3 items-start">
            <div className="bg-sheet border border-rule rounded-lg p-3">
              <div className="flex items-center gap-2.5 rounded-lg border border-gold/40 bg-gold-wash px-2.5 py-2">
                <span className="w-7 h-7 rounded-md bg-gold text-sheet flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[0.64rem] text-mist">Trigger</span>
                  <span className="block text-[0.78rem] font-semibold text-ink">{flow.trigger}</span>
                </span>
                <Status tone={flow.on ? "good" : "muted"}>{flow.on ? "Active" : "Paused"}</Status>
              </div>
              <FlowList steps={flow.steps} list="main" start={0} onAdd={(list, index) => addStepAt(flow, list, index)} onEdit={(list, index, step) => editStepAt(flow, list, index, step)} />
              <div className="rounded-lg border border-dashed border-rule px-2.5 py-2 text-center text-[0.72rem] text-mist">Journey ends · {flow.completed} people finished</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Stat label="Enrolled now" value={String(enrolledIn(flow))} sub={flow.on ? "Moving through the steps" : "On hold"} />
              <Stat label="Finished" value={String(flow.completed)} sub="Since January" />
              <Stat label="Reply rate" value={`${flow.replied}%`} sub="Replied to at least one text" />
              <Panel title="Recently enrolled">
                {people.filter((p) => p.flow === flow.id).length ? (
                  <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                    {people
                      .filter((p) => p.flow === flow.id)
                      .slice(0, 6)
                      .map((p) => (
                        <li key={p.id}>
                          <button type="button" onClick={() => openPerson(p)} className="w-full flex items-center gap-2 py-1.5 text-left cursor-pointer">
                            <Avatar name={p.name} size={20} />
                            <span className="flex-1 min-w-0 truncate text-[0.74rem] text-ink hover:text-gold-bright">{p.name}</span>
                            <span className="text-[0.62rem] text-mist">{p.flowDay ? `Day ${p.flowDay}` : "Today"}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-[0.72rem] text-mist">No one yet.</p>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---- Connection card ---- */}
      {app.screen === "card" && (
        <>
          <ScreenHeader title="Connection card" subtitle="Guests scan, fill it in under a minute, and land in the Guest stage with an owner." action={<SmallButton onClick={() => showModal("guest")}><UserPlus size={12} /> Add guest by hand</SmallButton>} />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-3 mb-3">
            <Panel title="Live preview" action={<Segmented id="pl-lang" value={lang} onChange={setLang} options={[{ id: "en", label: "English" }, { id: "tl", label: "Tagalog" }]} />}>
              {cardSent ? (
                <div className="mx-auto max-w-[19rem] rounded-2xl border border-rule bg-paper px-4 py-10 flex flex-col items-center text-center gap-2">
                  <span className="w-10 h-10 rounded-full bg-good/10 text-good flex items-center justify-center">
                    <Check size={20} />
                  </span>
                  <div className="text-[0.95rem] font-semibold text-ink">{`${copy.thanks}, ${cardSent.name}!`}</div>
                  <p className="text-[0.72rem] text-graphite">{copy.sent}</p>
                  <SmallButton
                    onClick={() => {
                      setCard(SAMPLE_CARDS[cardSent.round % SAMPLE_CARDS.length]);
                      setCardSent(null);
                    }}
                  >
                    {copy.again}
                  </SmallButton>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitCard();
                  }}
                  className="mx-auto max-w-[19rem] rounded-2xl border border-rule bg-paper p-3.5 flex flex-col gap-2"
                >
                  <div className="text-center mb-0.5">
                    <div className="mx-auto w-8 h-8 rounded-lg bg-gold text-sheet text-[0.8rem] font-bold flex items-center justify-center" aria-hidden>G</div>
                    <div className="mt-1.5 text-[0.9rem] font-semibold text-ink leading-tight">{copy.title}</div>
                    <p className="text-[0.68rem] text-graphite mt-0.5">{copy.intro}</p>
                  </div>
                  <input aria-label={copy.name} placeholder={copy.name} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className={cn(inputClass, "h-8")} />
                  <input aria-label={copy.phone} placeholder={copy.phone} value={card.phone} inputMode="tel" onChange={(e) => setCard({ ...card, phone: e.target.value })} className={cn(inputClass, "h-8")} />
                  {fields.email && <input aria-label={copy.email} placeholder={copy.email} value={card.email} type="email" onChange={(e) => setCard({ ...card, email: e.target.value })} className={cn(inputClass, "h-8")} />}
                  <div className="grid grid-cols-2 gap-2">
                    <select aria-label={copy.campus} value={card.campus} onChange={(e) => setCard({ ...card, campus: e.target.value as Campus })} className={cn(inputClass, "h-8 px-2")}>
                      {CAMPUSES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <select aria-label={copy.visit} value={card.visit} onChange={(e) => setCard({ ...card, visit: e.target.value })} className={cn(inputClass, "h-8 px-2")}>
                      {VISITS.map((v, i) => (
                        <option key={v} value={v}>{copy.visits[i]}</option>
                      ))}
                    </select>
                  </div>
                  {fields.interests && (
                    <fieldset>
                      <legend className="text-[0.68rem] font-medium text-ink-soft mb-1">{copy.like}</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {INTERESTS.map((it, i) => {
                          const on = card.interests.includes(it);
                          return (
                            <button key={it} type="button" aria-pressed={on} onClick={() => setCard({ ...card, interests: on ? card.interests.filter((x) => x !== it) : [...card.interests, it] })} className={cn("px-2 py-0.5 rounded-full border text-[0.68rem] cursor-pointer transition-colors", on ? "bg-gold text-sheet border-gold" : "bg-sheet border-rule text-ink-soft hover:border-mist")}>
                              {copy.interests[i]}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}
                  {fields.prayer && <textarea aria-label={copy.prayer} placeholder={copy.prayer} rows={2} value={card.prayer} onChange={(e) => setCard({ ...card, prayer: e.target.value })} className={cn(textareaClass, "min-h-[3rem] text-[0.78rem]")} />}
                  <button type="submit" disabled={!card.name.trim() || !card.phone.trim()} className="h-9 rounded-lg bg-gold text-sheet text-[0.8rem] font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-[filter]">
                    {copy.send}
                  </button>
                </form>
              )}
              <p className="text-[0.68rem] text-mist text-center mt-2">Try it. Sending adds the guest to the board, starts the journey, and opens a thread in the inbox.</p>
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Share">
                <div className="flex items-center gap-3">
                  <QrMark className="w-24 h-24" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.68rem] text-mist">Form link</div>
                    <div className="font-mono text-[0.74rem] text-ink truncate">example.com/grace/connect</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <SmallButton
                        onClick={() => {
                          navigator.clipboard?.writeText("https://example.com/grace/connect").catch(() => undefined);
                          app.notify("Form link copied");
                        }}
                      >
                        <Copy size={12} /> Copy link
                      </SmallButton>
                      <SmallButton onClick={() => app.notify(`Print file for 200 ${lang === "en" ? "English" : "Tagalog"} cards sent to the welcome team`)}><Printer size={12} /> Print 200 cards</SmallButton>
                    </div>
                  </div>
                </div>
              </Panel>
              <Panel title="Form fields">
                <ul className="flex flex-col gap-2.5">
                  <li className="flex items-center gap-3 text-[0.78rem]">
                    <span className="flex-1 text-ink-soft">Name, mobile, campus, visit</span>
                    <span className="text-[0.68rem] text-mist">Always on</span>
                  </li>
                  {([["email", "Email"], ["interests", "I'd like to"], ["prayer", "Prayer request"]] as const).map(([key, label]) => (
                    <li key={key} className="flex items-center gap-3 text-[0.78rem]">
                      <span className="flex-1 text-ink-soft">{label}</span>
                      <Toggle on={fields[key]} label={`Show ${label.toLowerCase()}`} onChange={(on) => { setFields((x) => ({ ...x, [key]: on })); app.notify(`${label} ${on ? "added to" : "removed from"} the card`); }} />
                    </li>
                  ))}
                </ul>
              </Panel>
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Cards received" value={String(subs.length)} sub="Since September" />
                <Stat label="Texted within 1 hour" value={f1?.on ? "100%" : "0%"} sub={f1?.on ? "New guest journey is on" : "Journey is paused"} tone={f1?.on ? "good" : "bad"} />
              </div>
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[0.85rem] font-semibold text-ink">Submissions</span>
            <span className="text-[0.7rem] text-mist">Each one lands in the Guest stage</span>
          </div>
          <Table
            rows={subs}
            rowKey={(s) => s.id}
            onRowClick={(s) => {
              const p = person(s.personId);
              if (p) openPerson(p);
            }}
            columns={[
              { key: "when", label: "Received", render: (s) => <span className="text-[0.74rem] text-graphite whitespace-nowrap">{s.when}</span> },
              { key: "name", label: "Guest", render: (s) => <span><span className="block text-ink">{person(s.personId)?.name}</span><span className="block text-[0.68rem] text-mist">{person(s.personId)?.phone}</span></span> },
              { key: "campus", label: "Campus", hideOnMobile: true, render: (s) => campusOf(person(s.personId)?.area ?? "Pasig") },
              { key: "interests", label: "Interested in", hideOnMobile: true, render: (s) => <span className="text-[0.72rem] text-graphite">{[...s.interests, ...(s.prayer ? ["Prayer request"] : [])].join(", ") || "None ticked"}</span> },
              { key: "stage", label: "Now in", align: "right", render: (s) => { const p = person(s.personId); return p ? <Status tone={p.stage === "guest" ? "warn" : "good"}>{stageLabel(p.stage)}</Status> : null; } },
            ]}
          />
        </>
      )}

      {/* ---- Insights ---- */}
      {app.screen === "insights" && (
        <>
          <ScreenHeader title="Insights" subtitle="Guest follow-up, from first visit to serving" action={<Segmented id="pl-range" value={range} onChange={setRange} options={[{ id: "d30", label: "30 days" }, { id: "d90", label: "90 days" }, { id: "y", label: "12 months" }]} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="First-time guests" value={String(funnel[0])} sub={RANGE_VS[range]} tone="good" />
            <Stat label="Came back twice" value={`${pct(funnel[1], funnel[0])}%`} sub="Goal: 60%" tone="bad" />
            <Stat label="Median first reply" value={`${REPLY_MEDIAN[range]} min`} sub="Inbox, 8 AM to 9 PM" />
            <Stat label="Stalled now" value={String(stalledCount)} sub="No contact 7+ days" tone={stalledCount ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Stage conversion" action={<SmallButton onClick={() => { setBoardView("stalled"); app.section("board"); }}>View stalled</SmallButton>}>
              <ul className="flex flex-col gap-2.5">
                {STAGES.map((s, i) => (
                  <li key={s.id} className="grid grid-cols-[5.25rem_minmax(0,1fr)_2.25rem_3.5rem] items-center gap-2.5 text-[0.78rem]">
                    <span className="text-ink-soft">{s.label}</span>
                    <Meter value={funnel[i]} max={funnel[0]} />
                    <span className="font-mono text-ink text-right tabular-nums">{funnel[i]}</span>
                    <span className={cn("font-mono text-[0.68rem] text-right", i === worst ? "text-danger font-semibold" : "text-mist")}>{i === 0 ? "start" : `${pct(funnel[i], funnel[i - 1])}% on`}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[0.7rem] text-mist mt-3">
                Biggest drop: {STAGES[worst - 1].label} to {STAGES[worst].label}, where {funnel[worst - 1] - funnel[worst]} people did not move on.
              </p>
            </Panel>

            <Panel title="Response times">
              <div className="grid grid-cols-[minmax(0,1fr)_3.25rem_4rem_3.25rem] gap-2 pb-1.5 text-[0.64rem] text-mist">
                <span>Team member</span>
                <span className="text-right">Median</span>
                <span className="text-right">Within 1h</span>
                <span className="text-right">Open</span>
              </div>
              <ul className="flex flex-col divide-y divide-rule-soft">
                {RESPONSE.map((r) => {
                  const med = Math.round(r.median * RANGE_FACTOR[range]);
                  return (
                    <li key={r.name} className="grid grid-cols-[minmax(0,1fr)_3.25rem_4rem_3.25rem] items-center gap-2 py-1.5 text-[0.76rem]">
                      <span className="flex items-center gap-2 min-w-0">
                        <Avatar name={r.name} size={20} />
                        <span className="truncate text-ink-soft">{r.name}</span>
                      </span>
                      <span className={cn("font-mono text-right tabular-nums", med > 20 ? "text-danger" : "text-ink")}>{med}m</span>
                      <span className="font-mono text-right text-mist">{r.hour}%</span>
                      <span className="font-mono text-right text-mist">{convs.filter((c) => c.open && c.assignee === r.name).length}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="text-[0.66rem] text-mist mt-3 mb-1">Median first reply by week, minutes</div>
              <Bars height="h-16" data={[34, 29, 26, 22, 19, 17, 15, 12].map((value, i) => ({ label: SUNDAYS[i], value }))} />
            </Panel>

            <Panel title="Weekly summary for pastors" action={summary.state === "shown" ? <AiTag text="AI draft · approve before it goes out" /> : summary.state === "sent" ? <Status tone="good">Sent to 3 pastors</Status> : undefined}>
              {summary.state === "empty" && <p className="text-[0.78rem] text-graphite mb-3">Turns this week&apos;s numbers, prayer requests, and overdue tasks into a short note for the pastors. Nothing goes out until you approve it.</p>}
              {summary.state === "drafting" && <p className="text-[0.78rem] text-graphite mb-3">Drafting from this week&apos;s data…</p>}
              {(summary.state === "shown" || summary.state === "sent") &&
                (summaryEdit ? (
                  <textarea aria-label="Edit summary" value={summary.text} onChange={(e) => setSummary((s) => ({ ...s, text: e.target.value }))} className={cn(textareaClass, "min-h-[10rem] mb-3")} />
                ) : (
                  <p className="text-[0.8rem] text-ink-soft leading-relaxed mb-3 whitespace-pre-line">{summary.text}</p>
                ))}
              <div className="flex flex-wrap items-center gap-2">
                {summary.state !== "sent" && <SmallButton onClick={draftSummary} disabled={summary.state === "drafting"}><RefreshCw size={12} /> {summary.state === "shown" ? "Redraft" : "Draft summary"}</SmallButton>}
                {summary.state === "shown" && <SmallButton onClick={() => setSummaryEdit((e) => !e)}><Pencil size={12} /> {summaryEdit ? "Done editing" : "Edit"}</SmallButton>}
                {summary.state === "shown" && <PrimaryButton onClick={approveSummary}><Send size={13} /> Approve and send to pastors</PrimaryButton>}
                {summary.state === "sent" && <span className="text-[0.72rem] text-mist">Approved by Pastor Joel. Emailed to Pastors Joel, Dan, and Ruth.</span>}
              </div>
            </Panel>

            <Panel title="Workflow results">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {flows.map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5 py-2">
                    <button type="button" onClick={() => { app.section("workflows"); app.open("workflow", f.id, f.name); }} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.78rem] text-ink hover:text-gold-bright truncate">{f.name}</span>
                      <span className="block text-[0.66rem] text-mist">{enrolledIn(f)} enrolled · {f.completed} finished{f.on ? "" : " · paused"}</span>
                    </button>
                    <Meter value={f.replied} max={100} className="w-16" />
                    <span className="font-mono text-[0.68rem] text-mist w-14 text-right">{f.replied}% reply</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="First-time guests, last eight Sundays" className="lg:col-span-2">
              <Bars height="h-24" data={[6, 4, 9, 5, 7, 8, 6, 9].map((value, i) => ({ label: SUNDAYS[i], value }))} />
            </Panel>
          </div>
        </>
      )}

      {/* ---- Slide-overs ---- */}
      <ProtoModal open={modal === "guest"} title="New guest" onClose={closeModal} footer={<PrimaryButton onClick={addGuest} disabled={!guest.name.trim()}>Add to Guest stage</PrimaryButton>}>
        <Field label="Full name">
          <input autoFocus value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} className={inputClass} placeholder="Maria Santos" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mobile number">
            <input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} className={inputClass} placeholder="0917 000 0000" />
          </Field>
          <Field label="Area">
            <select value={guest.area} onChange={(e) => setGuest({ ...guest, area: e.target.value })} className={inputClass}>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="First visit">
            <select value={guest.service} onChange={(e) => setGuest({ ...guest, service: e.target.value })} className={inputClass}>
              {["9 AM", "10 AM", "11 AM", "5 PM", "livestream"].map((x) => (
                <option key={x} value={x}>{x === "livestream" ? "Livestream" : `${x} service`}</option>
              ))}
            </select>
          </Field>
          <Field label="Came with">
            <select value={guest.with} onChange={(e) => setGuest({ ...guest, with: e.target.value })} className={inputClass}>
              {Object.keys(CAME_WITH).map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Owner">
          <select value={guest.owner} onChange={(e) => setGuest({ ...guest, owner: e.target.value })} className={inputClass}>
            <option value="auto">{`Auto by area: ${GROUPS[guest.area].leader}`}</option>
            {TEAM.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-3 rounded-lg border border-rule p-3">
          <span className="flex-1 text-[0.78rem] text-ink-soft">Enroll in New guest journey{f1 && !f1.on ? " (paused)" : ""}</span>
          <Toggle on={guest.enroll} label="Enroll in New guest journey" onChange={(on) => setGuest({ ...guest, enroll: on })} />
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "touch" && !!cur} title={cur ? `Log activity for ${first(cur.name)}` : "Log activity"} onClose={closeModal} footer={<PrimaryButton onClick={() => cur && logActivity(cur)} disabled={!touchDraft.text.trim()}>Save to timeline</PrimaryButton>}>
        <Field label="Type">
          <select value={touchDraft.kind} onChange={(e) => setTouchDraft({ ...touchDraft, kind: e.target.value as TouchKind })} className={inputClass}>
            {LOGGABLE.map((k) => (
              <option key={k} value={k}>{KIND[k].label}</option>
            ))}
          </select>
        </Field>
        <Field label="What happened">
          <textarea value={touchDraft.text} onChange={(e) => setTouchDraft({ ...touchDraft, text: e.target.value })} rows={3} className={textareaClass} placeholder="Called after service. Asked about the youth group." />
        </Field>
        {touchDraft.kind === "visit" && cur?.stage === "guest" && cur.visits === 1 && <p className="text-[0.72rem] text-mist">This is a second visit. {first(cur.name)} moves to Returning and the second-visit workflow starts.</p>}
      </ProtoModal>

      <ProtoModal open={modal === "task"} title="New task" onClose={closeModal} footer={<PrimaryButton onClick={addTask} disabled={!taskDraft.title.trim()}>Add task</PrimaryButton>}>
        <Field label="For">
          <select value={taskDraft.personId} onChange={(e) => setTaskDraft({ ...taskDraft, personId: e.target.value, owner: person(e.target.value)?.owner ?? taskDraft.owner })} className={inputClass}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Task">
          <input value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} className={inputClass} placeholder="Call to invite to Newcomers' lunch" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner">
            <select value={taskDraft.owner} onChange={(e) => setTaskDraft({ ...taskDraft, owner: e.target.value })} className={inputClass}>
              {TEAM.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Due">
            <select value={taskDraft.due} onChange={(e) => setTaskDraft({ ...taskDraft, due: Number(e.target.value) })} className={inputClass}>
              {[0, 1, 2, 3, 7].map((d) => (
                <option key={d} value={d}>{d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${dayLabel(d)}`}</option>
              ))}
            </select>
          </Field>
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "member" && !!cur} title={cur ? `Add to the ${last(cur.name)} household` : "Add household member"} onClose={closeModal} footer={<PrimaryButton onClick={() => cur && addMember(cur)} disabled={!memberDraft.name.trim()}>Add member</PrimaryButton>}>
        <Field label="Full name">
          <input value={memberDraft.name} onChange={(e) => setMemberDraft({ ...memberDraft, name: e.target.value })} className={inputClass} placeholder={cur ? `Rico ${last(cur.name)}` : "Full name"} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Relationship">
            <select value={memberDraft.role} onChange={(e) => setMemberDraft({ ...memberDraft, role: e.target.value as Role })} className={inputClass}>
              {(["Spouse", "Child", "Parent", "Sibling", "Other"] as const).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Age (optional)">
            <input value={memberDraft.age} inputMode="numeric" onChange={(e) => setMemberDraft({ ...memberDraft, age: e.target.value.replace(/\D/g, "").slice(0, 2) })} className={inputClass} placeholder="8" />
          </Field>
        </div>
      </ProtoModal>

      <ProtoModal
        open={modal === "step" && !!stepDraft}
        title={stepDraft?.isNew ? "Add step" : "Edit step"}
        onClose={closeModal}
        footer={
          <>
            {stepDraft && !stepDraft.isNew && <SmallButton onClick={removeStep}>Remove step</SmallButton>}
            <PrimaryButton onClick={saveStep} disabled={!stepDraft || !stepValid(stepDraft.step) || drafting === "step"}>{stepDraft?.isNew ? "Add step" : "Save step"}</PrimaryButton>
          </>
        }
      >
        {stepDraft && (
          <>
            {stepDraft.isNew ? (
              <Field label="Step type">
                <select value={stepDraft.step.kind} onChange={(e) => { const kind = e.target.value as StepKind; setStepDraft({ ...stepDraft, ai: false, step: { id: stepDraft.step.id, here: 0, ...STEP_DEFAULTS[kind] } }); }} className={inputClass}>
                  {(Object.keys(STEP_META) as StepKind[])
                    .filter((k) => k !== "branch" || stepDraft.list === "main")
                    .map((k) => (
                      <option key={k} value={k}>{STEP_META[k].label}</option>
                    ))}
                </select>
              </Field>
            ) : (
              <p className="text-[0.74rem] text-mist">{STEP_META[stepDraft.step.kind].label} · {stepDraft.step.here} {stepDraft.step.here === 1 ? "person" : "people"} at this step</p>
            )}

            {(stepDraft.step.kind === "wait" || stepDraft.step.kind === "branch") && (
              <Field label={stepDraft.step.kind === "wait" ? "Wait (days)" : "Check within (days)"}>
                <input type="number" min={1} max={60} value={stepDraft.step.days ?? 1} onChange={(e) => setStepField({ days: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })} className={inputClass} />
              </Field>
            )}

            {stepDraft.step.kind === "branch" && (
              <Field label="Condition">
                <select value={stepDraft.step.cond} onChange={(e) => setStepField({ cond: e.target.value })} className={inputClass}>
                  {BRANCH_CONDS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            )}

            {(stepDraft.step.kind === "email" || stepDraft.step.kind === "task") && (
              <Field label={stepDraft.step.kind === "email" ? "Subject" : "Task"}>
                <input value={stepDraft.step.title ?? ""} onChange={(e) => setStepField({ title: e.target.value })} className={inputClass} placeholder={stepDraft.step.kind === "email" ? "What to expect at Grace" : "Thank-you call"} />
              </Field>
            )}

            {(stepDraft.step.kind === "text" || stepDraft.step.kind === "email") && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.76rem] font-medium text-ink-soft">{stepDraft.step.kind === "text" ? "Message" : "Body"}</span>
                  <SmallButton onClick={draftStepWithAi} disabled={drafting === "step"}><Sparkles size={12} /> Draft with AI</SmallButton>
                </div>
                {drafting === "step" ? <span className="text-[0.72rem] text-graphite">Drafting from this journey…</span> : stepDraft.ai && <span><AiTag text="AI draft · edit, then save to approve" /></span>}
                <textarea aria-label={stepDraft.step.kind === "text" ? "Message" : "Body"} value={stepDraft.step.body ?? ""} onChange={(e) => setStepField({ body: e.target.value })} rows={5} className={cn(textareaClass, stepDraft.ai && "border-dashed border-gold/50")} placeholder="Hi {first}, …" />
                <p className="text-[0.68rem] text-mist">{"{first}"} and {"{owner}"} fill in when it sends. {stepDraft.step.kind === "text" ? "Texts go out from the church number, 8 AM to 9 PM." : "Emails come from the owner's name."}</p>
              </div>
            )}

            {stepDraft.step.kind === "task" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Owner">
                  <select value={stepDraft.step.owner ?? "owner"} onChange={(e) => setStepField({ owner: e.target.value })} className={inputClass}>
                    <option value="owner">The person&apos;s owner</option>
                    {TEAM.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Due after">
                  <select value={stepDraft.step.due ?? 2} onChange={(e) => setStepField({ due: Number(e.target.value) })} className={inputClass}>
                    {[1, 2, 3, 5, 7].map((d) => (
                      <option key={d} value={d}>{d === 1 ? "1 day" : `${d} days`}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {stepDraft.step.kind === "stage" && (
              <Field label="Move to">
                <select value={stepDraft.step.stage} onChange={(e) => setStepField({ stage: e.target.value as Stage })} className={inputClass}>
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
            )}
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "flow"} title="New workflow" onClose={closeModal} footer={<PrimaryButton onClick={createFlow} disabled={!flowDraft.name.trim()}>Create workflow</PrimaryButton>}>
        <Field label="Name">
          <input value={flowDraft.name} onChange={(e) => setFlowDraft({ ...flowDraft, name: e.target.value })} className={inputClass} placeholder="Youth guest follow-up" />
        </Field>
        <Field label="Trigger">
          <select value={flowDraft.trigger} onChange={(e) => setFlowDraft({ ...flowDraft, trigger: e.target.value })} className={inputClass}>
            {TRIGGERS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Start from">
          <select value={flowDraft.copy ? "copy" : "blank"} onChange={(e) => setFlowDraft({ ...flowDraft, copy: e.target.value === "copy" })} className={inputClass}>
            <option value="blank">One welcome text</option>
            <option value="copy">Copy of New guest journey</option>
          </select>
        </Field>
        <p className="text-[0.72rem] text-mist">New workflows start paused, so nothing sends until you resume.</p>
      </ProtoModal>

      <ProtoModal open={modal === "enroll" && !!flow} title={flow ? `Enroll in ${flow.name}` : "Enroll people"} onClose={closeModal} footer={<PrimaryButton onClick={() => { if (!flow) return; enroll(flow.id, enrollSel); closeModal(); app.notify(`${enrollSel.length} ${enrollSel.length === 1 ? "person" : "people"} enrolled in ${flow.name}`); }} disabled={!enrollSel.length}>Enroll {enrollSel.length || ""}</PrimaryButton>}>
        <p className="text-[0.74rem] text-mist">They start at the first step. Anyone in another workflow moves to this one.</p>
        <ul className="flex flex-col divide-y divide-rule-soft border border-rule rounded-lg bg-sheet">
          {enrollCandidates.map((p) => {
            const on = enrollSel.includes(p.id);
            return (
              <li key={p.id}>
                <label className="flex items-center gap-2.5 px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={on} onChange={() => setEnrollSel((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))} className="accent-gold" />
                  <Avatar name={p.name} size={22} />
                  <span className="flex-1 min-w-0 truncate text-[0.78rem] text-ink">{p.name}</span>
                  <span className="text-[0.66rem] text-mist">{stageLabel(p.stage)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </ProtoModal>
    </ProtoApp>
  );
}
