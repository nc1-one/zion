"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Check, Coffee, DoorOpen, Flag, Kanban, ListChecks, MessageSquare, Pencil, Phone, Plus, Printer, QrCode, RefreshCw, Send, Sparkles, StickyNote, UserPlus, Users, Workflow, type LucideIcon } from "lucide-react";
import { Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

type Stage = "guest" | "connected" | "group" | "serving" | "leading";
type TouchKind = "visit" | "text" | "call" | "coffee" | "group" | "stage" | "note" | "done";

interface Touch { id: string; date: string; kind: TouchKind; text: string; by: string }
interface Person { id: string; name: string; phone: string; area: string; stage: Stage; days: number; quiet: number; owner: string; source: string; couple?: boolean; touches: Touch[] }
interface Task { id: string; personId: string; title: string; owner: string; due: number; done: boolean }
interface Rule { id: string; name: string; when: string; then: string; on: boolean; runs: number }

const STAGES: { id: Stage; label: string }[] = [
  { id: "guest", label: "Guest" },
  { id: "connected", label: "Connected" },
  { id: "group", label: "In a group" },
  { id: "serving", label: "Serving" },
  { id: "leading", label: "Leading" },
];
const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? s;
const nextStage = (s: Stage): Stage | undefined => STAGES[STAGES.findIndex((x) => x.id === s) + 1]?.id;

const ME = "Joel Navarro";
const TEAM = ["Joel Navarro", "Grace Villanueva", "Mark Santos", "Ana Reyes"];
const first = (name: string) => name.split(" ")[0];
const lower = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const daysLabel = (d: number) => (d === 0 ? "New today" : `${d} ${d === 1 ? "day" : "days"} in stage`);

const GROUPS: Record<string, { name: string; when: string; leader: string }> = {
  Pasig: { name: "Kapitolyo life group", when: "Thursdays, 7 PM", leader: "Grace Villanueva" },
  "Quezon City": { name: "Teachers Village group", when: "Wednesdays, 7 PM", leader: "Mark Santos" },
  Makati: { name: "Poblacion young pros", when: "Tuesdays, 7:30 PM", leader: "Ana Reyes" },
  Mandaluyong: { name: "Shaw couples group", when: "Fridays, 7 PM", leader: "Joel Navarro" },
  Marikina: { name: "Concepcion family group", when: "Saturdays, 4 PM", leader: "Ana Reyes" },
  Taguig: { name: "BGC group", when: "Thursdays, 7:30 PM", leader: "Mark Santos" },
};
const AREAS = Object.keys(GROUPS);

let seq = 0;
const t = (date: string, kind: TouchKind, text: string, by: string): Touch => ({ id: `t${++seq}`, date, kind, text, by });

const PEOPLE: Person[] = [
  { id: "p1", name: "Liza Mendoza", phone: "0906 555 0128", area: "Pasig", stage: "guest", days: 9, quiet: 8, owner: "Grace Villanueva", source: "Welcome card", couple: true, touches: [t("Oct 19", "visit", "First visit, 11 AM. Came with her husband Rico.", "Welcome team"), t("Oct 20", "text", "Welcome text sent. No reply.", "Automation"), t("Oct 26", "visit", "Second visit. Sat with Joy Dela Cruz.", "Welcome team")] },
  { id: "p2", name: "Carlo Bautista", phone: "0945 555 0136", area: "Quezon City", stage: "guest", days: 16, quiet: 15, owner: "Mark Santos", source: "QR card", touches: [t("Oct 12", "visit", "First visit, 9 AM. Scanned the card in the lobby.", "Welcome team"), t("Oct 13", "text", "Welcome text sent. No reply.", "Automation")] },
  { id: "p3", name: "Mia Fernandez", phone: "0917 555 0174", area: "Makati", stage: "guest", days: 2, quiet: 1, owner: "Ana Reyes", source: "QR card", touches: [t("Oct 26", "visit", "First visit, 9 AM. Found us on Facebook.", "Welcome team"), t("Oct 27", "text", "Welcome text sent. Replied: Salamat po.", "Automation")] },
  { id: "p4", name: "Jerome Tan", phone: "0918 555 0150", area: "Mandaluyong", stage: "guest", days: 2, quiet: 1, owner: "Joel Navarro", source: "Invited by Ben Ramos", couple: true, touches: [t("Oct 26", "visit", "First visit with his wife Kat. Invited by Ben Ramos.", "Welcome team"), t("Oct 27", "call", "Called to say thanks. Asked about kids church.", "Joel Navarro")] },
  { id: "p5", name: "Joy Dela Cruz", phone: "0927 555 0110", area: "Quezon City", stage: "connected", days: 21, quiet: 3, owner: "Grace Villanueva", source: "Invited by Ana Reyes", touches: [t("Sep 14", "visit", "First visit, 9 AM.", "Welcome team"), t("Sep 21", "coffee", "Coffee at Tomas Morato. Teacher, new to QC.", "Grace Villanueva"), t("Oct 25", "text", "Sent Teachers Village group details.", "Grace Villanueva")] },
  { id: "p6", name: "Patrick Lim", phone: "0917 555 0133", area: "Taguig", stage: "connected", days: 34, quiet: 15, owner: "Mark Santos", source: "Livestream form", touches: [t("Aug 31", "visit", "First visit after a month of watching online.", "Welcome team"), t("Sep 14", "coffee", "Coffee at BGC. Works night shift at a BPO.", "Mark Santos"), t("Oct 13", "text", "Sent BGC group details. No reply.", "Mark Santos")] },
  { id: "p7", name: "Andrea Pascual", phone: "0919 555 0182", area: "Marikina", stage: "connected", days: 11, quiet: 4, owner: "Ana Reyes", source: "Welcome card", couple: true, touches: [t("Oct 5", "visit", "First visit with her husband Jun.", "Welcome team"), t("Oct 17", "coffee", "Merienda with Andrea and Jun.", "Ana Reyes"), t("Oct 24", "text", "Asked about Couples Night. Interested.", "Ana Reyes")] },
  { id: "p8", name: "Nina Robles", phone: "0995 555 0121", area: "Pasig", stage: "group", days: 40, quiet: 6, owner: "Joel Navarro", source: "Welcome card", touches: [t("Aug 10", "visit", "First visit, 11 AM.", "Welcome team"), t("Sep 18", "group", "Joined Kapitolyo life group.", "Grace Villanueva"), t("Oct 22", "text", "Checked in after group night.", "Joel Navarro")] },
  { id: "p9", name: "Leo Aquino", phone: "0928 555 0166", area: "Quezon City", stage: "group", days: 63, quiet: 21, owner: "Mark Santos", source: "Invited by Mark Santos", touches: [t("Jul 6", "visit", "First visit, 9 AM.", "Welcome team"), t("Aug 27", "group", "Joined Teachers Village group.", "Mark Santos"), t("Oct 7", "note", "Missed the last three group nights.", "Mark Santos")] },
  { id: "p10", name: "Carmela Diaz", phone: "0906 555 0199", area: "Makati", stage: "group", days: 18, quiet: 2, owner: "Grace Villanueva", source: "QR card", touches: [t("Sep 7", "visit", "First visit, 9 AM.", "Welcome team"), t("Oct 10", "group", "Joined Poblacion young pros.", "Ana Reyes"), t("Oct 26", "text", "Thanked her for bringing a friend.", "Grace Villanueva")] },
  { id: "p11", name: "Paolo Garcia", phone: "0995 555 0177", area: "Mandaluyong", stage: "serving", days: 120, quiet: 5, owner: "Joel Navarro", source: "Invited by a coworker", touches: [t("Mar 2", "group", "Joined Shaw couples group.", "Joel Navarro"), t("Jun 30", "stage", "Started on the livestream team.", "Joel Navarro"), t("Oct 23", "call", "Talked about his new night shift.", "Joel Navarro")] },
  { id: "p12", name: "Ella Soriano", phone: "0917 555 0108", area: "Taguig", stage: "serving", days: 75, quiet: 30, owner: "Ana Reyes", source: "Welcome card", touches: [t("May 3", "group", "Joined BGC group.", "Mark Santos"), t("Aug 14", "stage", "Started on kids church, 11 AM.", "Ana Reyes"), t("Sep 28", "text", "Thanked her for covering two Sundays.", "Ana Reyes")] },
  { id: "p13", name: "Ben Ramos", phone: "0917 555 0161", area: "Marikina", stage: "leading", days: 210, quiet: 9, owner: "Joel Navarro", source: "Member since 2018", touches: [t("Mar 30", "stage", "Started leading Concepcion family group.", "Joel Navarro"), t("Oct 19", "coffee", "Monthly check-in. Group grew to 12.", "Joel Navarro")] },
  { id: "p14", name: "Rina Navarro", phone: "0928 555 0187", area: "Quezon City", stage: "leading", days: 400, quiet: 3, owner: "Joel Navarro", source: "Member since 2017", touches: [t("2025", "stage", "Started leading kids church.", "Joel Navarro"), t("Oct 25", "call", "Planned the Kids Christmas Program.", "Joel Navarro")] },
];

const TASKS: Task[] = [
  { id: "f1", personId: "p2", title: "Call Carlo. Welcome text had no reply.", owner: "Mark Santos", due: -5, done: false },
  { id: "f2", personId: "p1", title: "Invite Liza and Rico to Couples Night", owner: "Grace Villanueva", due: -2, done: false },
  { id: "f3", personId: "p9", title: "Ask Leo how group is going", owner: "Mark Santos", due: -1, done: false },
  { id: "f4", personId: "p6", title: "Check in with Patrick about BGC group", owner: "Mark Santos", due: 0, done: false },
  { id: "f5", personId: "p3", title: "Coffee invite for Mia", owner: "Ana Reyes", due: 1, done: false },
  { id: "f6", personId: "p12", title: "Thank Ella and offer a rest Sunday", owner: "Ana Reyes", due: 2, done: false },
  { id: "f7", personId: "p4", title: "Send kids church info to Jerome and Kat", owner: "Joel Navarro", due: 3, done: false },
  { id: "f8", personId: "p5", title: "Send Teachers Village details to Joy", owner: "Grace Villanueva", due: -3, done: true },
];

const RULES: Rule[] = [
  { id: "r1", name: "Text new guests within 24 hours", when: "A guest card is submitted", then: "Send the welcome text from the owner's number", on: true, runs: 23 },
  { id: "r2", name: "Assign an owner by area", when: "A guest is added", then: "Assign the life group leader nearest them", on: true, runs: 23 },
  { id: "r3", name: "Remind owner after 7 days without contact", when: "No touchpoint for 7 days", then: "Add a follow-up and remind the owner", on: true, runs: 9 },
  { id: "r4", name: "Draft a group invite after a second visit", when: "A guest visits twice", then: "AI drafts a next step for the owner to review", on: true, runs: 6 },
  { id: "r5", name: "Flag anyone stalled 30 days", when: "No stage change for 30 days", then: "Notify Pastor Joel", on: false, runs: 0 },
];
const WHENS = ["A guest card is submitted", "A guest visits twice", "No touchpoint for 7 days", "Someone moves to a new stage", "Someone serves for 3 months"];
const THENS = ["Remind the owner", "Add a follow-up for the owner", "AI drafts a next step for review", "Send the welcome text", "Notify Pastor Joel"];

const KIND: Record<TouchKind, { icon: LucideIcon; label: string }> = {
  visit: { icon: DoorOpen, label: "Visit" },
  text: { icon: MessageSquare, label: "Text" },
  call: { icon: Phone, label: "Call" },
  coffee: { icon: Coffee, label: "Coffee" },
  group: { icon: Users, label: "Group" },
  stage: { icon: Flag, label: "Stage" },
  note: { icon: StickyNote, label: "Note" },
  done: { icon: Check, label: "Follow-up" },
};

const FUNNEL = { d90: [64, 26, 17, 11, 4], y: [212, 97, 66, 41, 15] };
const CARD = {
  en: { title: "Welcome to Grace Fellowship", body: "Scan to say hello. We will text you once this week, then only if you want us to.", foot: "Sundays 9 AM and 11 AM · Ortigas Ave, Pasig" },
  tl: { title: "Maligayang pagdating sa Grace Fellowship", body: "I-scan para magpakilala. Isang text lang namin ngayong linggo, at uulitin lang kung gusto mo.", foot: "Tuwing Linggo, 9 AM at 11 AM · Ortigas Ave, Pasig" },
};

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

function suggest(p: Person) {
  const f = first(p.name);
  const o = first(p.owner);
  const g = GROUPS[p.area];
  const visits = p.touches.filter((x) => x.kind === "visit").length;
  if (p.stage === "guest" && p.couple)
    return { step: "Invite to Couples Night, Nov 7", why: `Visited ${visits === 1 ? "once" : visits === 2 ? "twice" : `${visits} times`} with spouse. Couples Night is an easy second step.`, drafts: [
      `Hi ${f}, this is ${p.owner} from Grace Fellowship. So glad you both came on Sunday. We have a Couples Night on Nov 7 at 7 PM, dinner included. Can I save you two seats?`,
      `Hi ${f}, ${o} here from Grace. Thank you for coming back. A few couples from church are having dinner on Nov 7. No program, just good food and conversation. Would you like to join?`,
      `Good afternoon ${f}. ${o} from Grace Fellowship here. We would love to get to know you both. Couples Night is Nov 7 at the fellowship hall. Want me to send the details?`,
    ] };
  if (p.stage === "guest")
    return { step: "Invite to coffee after service", why: `${visits === 1 ? "First visit" : `${visits} visits`}. No conversation with a person yet.`, drafts: [
      `Hi ${f}, this is ${p.owner} from Grace Fellowship. Thank you for visiting on Sunday. Can I buy you coffee after the service this week? No agenda, just to get to know you.`,
      `Hi ${f}, ${o} here from Grace. It was good to see you on Sunday. A few of us get coffee after the 11 AM service. Would you like to join us this Sunday?`,
      `Hello ${f}. ${o} from Grace Fellowship here. Any questions after your visit? Happy to meet for coffee near ${p.area} this week.`,
    ] };
  if (p.stage === "connected")
    return { step: `Visit the ${g.name}`, why: `Lives in ${p.area}. The group meets ${g.when}.`, drafts: [
      `Hi ${f}, ${o} here. There is a group that meets near you, the ${g.name}. They meet ${g.when}. Want me to introduce you to the leader?`,
      `Hi ${f}. Since you are in ${p.area}, I thought of the ${g.name}. It is small, around 10 people. Can I bring you this week?`,
    ] };
  if (p.stage === "group")
    return { step: "Try one Sunday on the welcome team", why: `In a group for ${p.days} days. Has not served yet.`, drafts: [
      `Hi ${f}, ${o} here. The welcome team needs one more person for the 9 AM service. Would you try one Sunday with us? I will be beside you the whole time.`,
      `Hi ${f}. Your group leader says you are great with new people. Would you like to try greeting guests one Sunday this month?`,
    ] };
  if (p.stage === "serving")
    return { step: "Invite to leaders' training, Nov 22", why: `Serving for ${Math.round(p.days / 30)} months. Groups need apprentice leaders.`, drafts: [
      `Hi ${f}, ${o} here. Thank you for serving so faithfully. Leaders' training starts Nov 22. Would you pray about joining? Happy to talk it over coffee.`,
      `Hi ${f}. You have been a big help on Sundays. We would love you in the next leaders' training, Saturdays from Nov 22. Can we talk this week?`,
    ] };
  return { step: "Check in and ask about an apprentice", why: `Leads a group. Last contact ${p.quiet} days ago.`, drafts: [
    `Hi ${f}, ${o} here. How is the group doing? I would love to hear what is going well and pray for you. Free for merienda this week?`,
    `Hi ${f}. Thank you for leading. Is there someone in your group who could be your apprentice? Let us talk about it this week.`,
  ] };
}

const SUMMARIES = [
  (n: number) => `Most people stall between Guest and Connected. 59% of guests in the last 90 days never had a second conversation. Guests texted within 24 hours came back twice as often. ${n} people have gone 7 or more days without contact. Clear overdue follow-ups first.`,
  (n: number, owner: string) => `Groups are working: 65% of connected people join one. The leak is the first two weeks after a visit. ${n} people are past 7 days without contact, and ${owner} owns the most. Consider sharing two of them with another owner.`,
];

const CAME_WITH: Record<string, string> = { "On their own": "", Spouse: " Came with their spouse.", Friend: " Came with a friend.", Family: " Came with family." };
const EMPTY_GUEST = { name: "", phone: "", area: "Pasig", service: "9 AM service", with: "On their own", owner: "auto" };

function Stepper({ stage }: { stage: Stage }) {
  const at = STAGES.findIndex((s) => s.id === stage);
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

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn("relative w-9 h-5 shrink-0 rounded-full border transition-colors cursor-pointer", on ? "bg-gold border-gold" : "bg-night border-rule")}>
      <span className={cn("absolute top-[3px] left-0 w-3 h-3 rounded-full transition-transform", on ? "translate-x-[19px] bg-paper" : "translate-x-[3px] bg-graphite")} />
    </button>
  );
}

function Due({ task }: { task: Task }) {
  if (task.done) return <Status tone="good">Done</Status>;
  if (task.due < 0) return <Status tone="bad">Overdue {-task.due} {task.due === -1 ? "day" : "days"}</Status>;
  if (task.due === 0) return <Status tone="warn">Due today</Status>;
  return <Status tone="muted">{task.due === 1 ? "Due tomorrow" : `Due in ${task.due} days`}</Status>;
}

export function AIPipelinePrototype() {
  const app = useProtoApp("board");
  const [people, setPeople] = useState(PEOPLE);
  const [tasks, setTasks] = useState(TASKS);
  const [rules, setRules] = useState(RULES);
  const [view, setView] = useState<"all" | "mine" | "stalled">("all");
  const [taskView, setTaskView] = useState<"open" | "overdue" | "done">("open");
  const [range, setRange] = useState<"d90" | "y">("d90");
  const [lang, setLang] = useState<"en" | "tl">("en");
  const [ai, setAi] = useState<Record<string, { idx: number; text?: string; sent?: boolean }>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState<{ idx: number; state: "empty" | "drafting" | "shown" }>({ idx: 0, state: "empty" });
  const [guestOpen, setGuestOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const [guest, setGuest] = useState(EMPTY_GUEST);
  const [ruleDraft, setRuleDraft] = useState({ name: "", when: WHENS[0], then: THENS[0] });
  const [touchDraft, setTouchDraft] = useState<{ kind: TouchKind; text: string }>({ kind: "call", text: "" });

  const rule = (id: string) => rules.some((r) => r.id === id && r.on);
  const stalled = (p: Person) => p.quiet >= 7;
  const stalledCount = people.filter(stalled).length;
  const openTasks = tasks.filter((x) => !x.done).sort((a, b) => a.due - b.due);
  const overdue = openTasks.filter((x) => x.due < 0);
  const person = (id?: string) => people.find((x) => x.id === id);
  const shown = people.filter((p) => view === "all" || (view === "mine" && p.owner === ME) || (view === "stalled" && stalled(p)));
  const taskRows = taskView === "open" ? openTasks : taskView === "overdue" ? overdue : tasks.filter((x) => x.done);

  const patch = (id: string, fn: (p: Person) => Person) => setPeople((l) => l.map((x) => (x.id === id ? fn(x) : x)));
  const addTouch = (id: string, kind: TouchKind, text: string, by: string) =>
    patch(id, (x) => ({ ...x, quiet: kind === "note" || kind === "stage" ? x.quiet : 0, touches: [...x.touches, { id: `t${Date.now()}`, date: "Today", kind, text, by }] }));

  const openPerson = (p: Person) => {
    setEditing(false);
    app.open("person", p.id, p.name);
  };

  const moveNext = (p: Person) => {
    const to = nextStage(p.stage);
    if (!to) return;
    patch(p.id, (x) => ({ ...x, stage: to, days: 0, touches: [...x.touches, { id: `t${Date.now()}`, date: "Today", kind: "stage", text: `Moved to ${stageLabel(to)}.`, by: ME }] }));
    setAi((a) => ({ ...a, [p.id]: { idx: 0 } }));
    setEditing(false);
    app.notify(`${first(p.name)} moved to ${stageLabel(to)}. New next step drafted for ${first(p.owner)}.`);
  };

  const regenerate = (p: Person) => {
    setEditing(false);
    setDrafting(p.id);
    window.setTimeout(() => {
      setAi((a) => ({ ...a, [p.id]: { idx: (a[p.id]?.idx ?? 0) + 1 } }));
      setDrafting(null);
    }, 700);
  };

  const approve = (p: Person, text: string) => {
    addTouch(p.id, "text", text, p.owner);
    setAi((a) => ({ ...a, [p.id]: { idx: a[p.id]?.idx ?? 0, sent: true } }));
    setTasks((l) => [{ id: `f${Date.now()}`, personId: p.id, title: `Check for ${first(p.name)}'s reply`, owner: p.owner, due: 2, done: false }, ...l]);
    setEditing(false);
    app.notify(`Text sent to ${first(p.name)} from ${first(p.owner)}. Reply check added to follow-ups.`);
  };

  const setOwner = (p: Person, owner: string) => {
    patch(p.id, (x) => ({ ...x, owner }));
    setTasks((l) => l.map((x) => (x.personId === p.id && !x.done ? { ...x, owner } : x)));
    app.notify(`${first(p.name)} is now with ${owner}. Open follow-ups moved too.`);
  };

  const toggleTask = (task: Task) => {
    setTasks((l) => l.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)));
    if (task.done) return app.notify("Follow-up reopened");
    addTouch(task.personId, "done", task.title, task.owner);
    app.notify(`Done. Logged on ${first(person(task.personId)?.name ?? "")}'s timeline.`);
  };

  const addGuest = () => {
    const name = guest.name.trim();
    if (!name) return;
    const id = `p${Date.now()}`;
    const owner = guest.owner === "auto" ? (rule("r2") ? GROUPS[guest.area].leader : ME) : guest.owner;
    const touches: Touch[] = [{ id: `${id}-v`, date: "Today", kind: "visit", text: `First visit, ${guest.service}.${CAME_WITH[guest.with]}`, by: "Welcome team" }];
    if (rule("r1")) touches.push({ id: `${id}-w`, date: "Today", kind: "text", text: "Welcome text queued for this evening.", by: "Automation" });
    setPeople((l) => [{ id, name, phone: guest.phone || "No number", area: guest.area, stage: "guest", days: 0, quiet: 0, owner, source: "Added by staff", couple: guest.with === "Spouse", touches }, ...l]);
    setTasks((l) => [{ id: `f${Date.now()}`, personId: id, title: `First call to ${first(name)}`, owner, due: 2, done: false }, ...l]);
    setGuestOpen(false);
    setGuest(EMPTY_GUEST);
    app.notify(`${first(name)} added to Guest. Owner: ${owner}.${rule("r1") ? " Welcome text queued." : ""}`);
  };

  const addRule = () => {
    const name = ruleDraft.name.trim() || `${ruleDraft.then} when ${lower(ruleDraft.when)}`;
    setRules((l) => [...l, { id: `r${Date.now()}`, name, when: ruleDraft.when, then: ruleDraft.then, on: true, runs: 0 }]);
    setRuleOpen(false);
    setRuleDraft({ name: "", when: WHENS[0], then: THENS[0] });
    app.notify(`Rule added and on: ${name}`);
  };

  const draftSummary = () => {
    setSummary((s) => ({ idx: s.state === "shown" ? s.idx + 1 : s.idx, state: "drafting" }));
    window.setTimeout(() => setSummary((s) => ({ ...s, state: "shown" })), 800);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText("https://example.com/grace/hello").catch(() => undefined);
    app.notify("Guest form link copied");
  };

  const cur = app.screen === "person" ? person(app.id) : undefined;
  const sug = cur ? suggest(cur) : null;
  const st = (cur && ai[cur.id]) || { idx: 0 };
  const draftText = sug ? st.text ?? sug.drafts[st.idx % sug.drafts.length] : "";
  const funnel = FUNNEL[range];
  const drops = STAGES.slice(1).map((s, i) => ({ from: STAGES[i].label, to: s.label, lost: funnel[i] - funnel[i + 1], rate: Math.round((funnel[i + 1] / funnel[i]) * 100) }));
  const worst = Math.max(...drops.map((d) => d.lost));
  const topOwner = TEAM.reduce((a, b) => (people.filter((p) => p.owner === b && stalled(p)).length > people.filter((p) => p.owner === a && stalled(p)).length ? b : a));

  const nav = [
    { id: "board", label: "Board", icon: Kanban },
    { id: "followups", label: "Follow-ups", icon: ListChecks, badge: openTasks.length },
    { id: "card", label: "Guest card", icon: QrCode },
    { id: "insights", label: "Insights", icon: BarChart3 },
    { id: "automations", label: "Automations", icon: Workflow },
  ];

  return (
    <ProtoApp app={app} name="AI Church Pipeline · Grace Fellowship" user="Pastor Joel Navarro" nav={nav} alerts={overdue.length}>
      {app.screen === "board" && (
        <>
          <ScreenHeader title="Pipeline" subtitle={`${people.length} people · ${stalledCount} with no contact in 7+ days`} action={<PrimaryButton onClick={() => setGuestOpen(true)}><UserPlus size={14} /> New guest</PrimaryButton>} />
          <div className="mb-3">
            <Segmented id="pl-view" value={view} onChange={setView} options={[{ id: "all", label: "Everyone" }, { id: "mine", label: "Mine" }, { id: "stalled", label: "Stalled" }]} />
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-cols-5 gap-2 min-w-[46rem]">
              {STAGES.map((s) => {
                const list = shown.filter((p) => p.stage === s.id);
                return (
                  <section key={s.id} aria-label={`${s.label}, ${list.length}`} className="bg-sheet border border-rule rounded-lg min-h-[24rem]">
                    <div className="flex items-center justify-between px-2.5 h-9 border-b border-rule">
                      <span className="text-[0.75rem] font-semibold text-ink">{s.label}</span>
                      <span className="font-mono text-[0.68rem] text-mist">{list.length}</span>
                    </div>
                    <ul className="flex flex-col gap-1.5 p-1.5">
                      {list.map((p) => (
                        <motion.li key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-paper border border-rule-soft rounded-md p-2">
                          <button type="button" onClick={() => openPerson(p)} className="group flex items-center gap-1.5 w-full text-left cursor-pointer">
                            <Avatar name={p.name} size={22} />
                            <span className="flex-1 min-w-0 truncate text-[0.78rem] font-medium text-ink group-hover:text-gold-bright">{p.name}</span>
                          </button>
                          <div className="mt-1 text-[0.68rem] text-mist">{p.days === 0 ? "New today" : `${p.days}d here`} · {first(p.owner)}</div>
                          <div className="mt-1">{stalled(p) ? <Status tone="bad">No contact {p.quiet}d</Status> : <Status tone="good">On track</Status>}</div>
                          {nextStage(p.stage) && (
                            <div className="mt-2">
                              <SmallButton onClick={() => moveNext(p)}>Move to next stage</SmallButton>
                            </div>
                          )}
                        </motion.li>
                      ))}
                      {list.length === 0 && <li className="px-1 py-4 text-center text-[0.72rem] text-mist">No one here</li>}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}

      {app.screen === "person" && cur && sug && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Avatar name={cur.name} size={46} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-[1.5rem] leading-tight font-semibold text-ink">{cur.name}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                {stalled(cur) ? <Status tone="bad">No contact in {cur.quiet} days</Status> : <Status tone="good">Contacted {cur.quiet === 0 ? "today" : `${cur.quiet}d ago`}</Status>}
                <span className="text-[0.72rem] text-mist">{stageLabel(cur.stage)} · {daysLabel(cur.days)} · {cur.area}</span>
              </div>
            </div>
            <SmallButton onClick={() => setTouchOpen(true)}><Plus size={12} /> Log touchpoint</SmallButton>
            {nextStage(cur.stage) ? <PrimaryButton onClick={() => moveNext(cur)}>Move to next stage <ArrowRight size={13} /></PrimaryButton> : <Status tone="good">Leader</Status>}
          </div>
          <Stepper stage={cur.stage} />
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Suggested next step" action={<span className="flex items-center gap-1 text-[0.68rem] text-mist"><Sparkles size={11} /> AI draft · review before sending</span>}>
                <div className="text-[0.92rem] font-semibold text-ink">{sug.step}</div>
                <p className="text-[0.72rem] text-mist mt-0.5">{sug.why}</p>
                {st.sent ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2"><Status tone="good">Sent today</Status><span className="text-[0.72rem] text-mist">From {first(cur.owner)}. Reply check due in 2 days.</span></span>
                    <SmallButton onClick={() => { setAi((a) => ({ ...a, [cur.id]: { idx: st.idx } })); regenerate(cur); }}><RefreshCw size={12} /> Draft another</SmallButton>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 rounded-md border border-rule-soft bg-paper p-3 min-h-[5.5rem]">
                      {drafting === cur.id ? (
                        <span className="text-[0.78rem] text-graphite">Drafting a new version…</span>
                      ) : editing ? (
                        <textarea aria-label="Edit draft message" value={draftText} onChange={(e) => setAi((a) => ({ ...a, [cur.id]: { ...st, text: e.target.value } }))} rows={4} className="w-full bg-transparent text-[0.8rem] text-ink leading-relaxed outline-none resize-none" />
                      ) : (
                        <p className="text-[0.8rem] text-ink-soft leading-relaxed">{draftText}</p>
                      )}
                    </div>
                    <div className="text-[0.66rem] text-mist mt-1.5">Text to {cur.phone} from {first(cur.owner)} · {st.text !== undefined ? "edited" : `version ${(st.idx % sug.drafts.length) + 1} of ${sug.drafts.length}`}</div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <SmallButton onClick={() => regenerate(cur)} disabled={drafting === cur.id}><RefreshCw size={12} /> Regenerate</SmallButton>
                      <SmallButton onClick={() => setEditing((e) => !e)} disabled={drafting === cur.id}><Pencil size={12} /> {editing ? "Done editing" : "Edit"}</SmallButton>
                      <PrimaryButton onClick={() => approve(cur, draftText.trim())} disabled={drafting === cur.id || !draftText.trim()}><Send size={13} /> Approve and send</PrimaryButton>
                    </div>
                  </>
                )}
              </Panel>
              <Panel title="Details">
                <KeyValues
                  items={[
                    ["Phone", cur.phone],
                    ["Came through", cur.source],
                    ["Nearest group", `${GROUPS[cur.area].name}, ${GROUPS[cur.area].when}`],
                    [
                      "Owner",
                      <select key="owner" aria-label="Owner" value={cur.owner} onChange={(e) => setOwner(cur, e.target.value)} className="h-8 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer">
                        {TEAM.map((m) => <option key={m}>{m}</option>)}
                      </select>,
                    ],
                  ]}
                />
              </Panel>
            </div>
            <Panel title={`Touchpoints · ${cur.touches.length}`}>
              <ol className="relative flex flex-col gap-3 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-rule">
                {[...cur.touches].reverse().map((x) => (
                  <li key={x.id} className="relative flex gap-2.5">
                    <span className="relative w-6 h-6 rounded-full bg-sheet border border-rule flex items-center justify-center text-gold-bright shrink-0"><TouchIcon kind={x.kind} /></span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[0.78rem] text-ink-soft leading-snug">{x.text}</p>
                      <span className="text-[0.66rem] text-mist">{x.date} · {KIND[x.kind].label} · {x.by}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "followups" && (
        <>
          <ScreenHeader title="Follow-ups" subtitle={`${openTasks.length} open · ${overdue.length} overdue · each one has an owner`} action={<Segmented id="pl-tasks" value={taskView} onChange={setTaskView} options={[{ id: "open", label: "Open" }, { id: "overdue", label: "Overdue" }, { id: "done", label: "Done" }]} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            {TEAM.map((m) => {
              const mine = openTasks.filter((x) => x.owner === m);
              const late = mine.filter((x) => x.due < 0).length;
              return <Stat key={m} label={m} value={String(mine.length)} sub={late ? `${late} overdue` : "Nothing overdue"} tone={late ? "bad" : "good"} />;
            })}
          </div>
          <Table
            rows={taskRows}
            rowKey={(x) => x.id}
            onRowClick={(x) => {
              const who = person(x.personId);
              if (who) openPerson(who);
            }}
            empty="Nothing in this list."
            columns={[
              { key: "task", label: "Follow-up", render: (x) => <span><span className="block text-ink">{x.title}</span><span className="block text-[0.68rem] text-mist">{person(x.personId)?.name} · {stageLabel(person(x.personId)?.stage ?? "guest")}</span></span> },
              { key: "owner", label: "Owner", hideOnMobile: true, render: (x) => <span className="flex items-center gap-2"><Avatar name={x.owner} size={22} />{x.owner}</span> },
              { key: "due", label: "Due", render: (x) => <Due task={x} /> },
              { key: "act", label: "Action", align: "right", render: (x) => <span onKeyDown={(e) => e.stopPropagation()}><SmallButton onClick={() => toggleTask(x)}>{x.done ? "Reopen" : <><Check size={12} /> Mark done</>}</SmallButton></span> },
            ]}
          />
        </>
      )}

      {app.screen === "card" && (
        <>
          <ScreenHeader title="Guest card" subtitle="Printed for the lobby and seat backs. Every scan lands in the Guest column." action={<PrimaryButton onClick={() => setGuestOpen(true)}><UserPlus size={14} /> Add guest</PrimaryButton>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Card preview" action={<Segmented id="pl-lang" value={lang} onChange={setLang} options={[{ id: "en", label: "English" }, { id: "tl", label: "Tagalog" }]} />}>
              <div className="mx-auto max-w-[20rem] rounded-lg border border-rule bg-paper p-4 flex gap-4 items-center">
                <svg viewBox="-1 -1 23 23" role="img" aria-label="Sample QR code" className="w-24 h-24 shrink-0 rounded bg-ink fill-night">
                  {QR.map((on, i) => (on ? <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" /> : null))}
                </svg>
                <div className="min-w-0">
                  <div className="font-display text-[1.1rem] leading-tight font-semibold text-ink">{CARD[lang].title}</div>
                  <p className="text-[0.72rem] text-graphite mt-1.5 leading-snug">{CARD[lang].body}</p>
                  <p className="text-[0.64rem] text-mist mt-2">{CARD[lang].foot}</p>
                </div>
              </div>
              <p className="text-[0.7rem] text-mist text-center mt-3">The form asks for name, mobile number, and area. Nothing else.</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                <SmallButton onClick={() => app.notify(`Print file for 200 ${lang === "en" ? "English" : "Tagalog"} cards sent to the welcome team`)}><Printer size={12} /> Print 200 cards</SmallButton>
                <SmallButton onClick={copyLink}>Copy form link</SmallButton>
              </div>
            </Panel>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="Scans, October" value="31" sub="23 finished the form" />
                <Stat label="Texted within 24 hours" value={rule("r1") ? "100%" : "38%"} sub={rule("r1") ? "Welcome rule is on" : "Welcome rule is paused"} tone={rule("r1") ? "good" : "bad"} />
              </div>
              <Panel title="In the Guest column now">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {people.filter((p) => p.stage === "guest").map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5 py-2">
                      <Avatar name={p.name} size={26} />
                      <button type="button" onClick={() => openPerson(p)} className="flex-1 min-w-0 text-left cursor-pointer">
                        <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{p.name}</span>
                        <span className="block text-[0.68rem] text-mist">{p.source} · {p.area} · {first(p.owner)}</span>
                      </button>
                      {stalled(p) ? <Status tone="bad">Waiting</Status> : <Status tone="good">Contacted</Status>}
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}

      {app.screen === "insights" && (
        <>
          <ScreenHeader title="Insights" subtitle="Guest to leader, by stage" action={<Segmented id="pl-range" value={range} onChange={setRange} options={[{ id: "d90", label: "90 days" }, { id: "y", label: "12 months" }]} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="New guests" value={String(funnel[0])} sub={range === "d90" ? "+12 vs last quarter" : "+18% vs last year"} tone="good" />
            <Stat label="Reached Connected" value={`${Math.round((funnel[1] / funnel[0]) * 100)}%`} sub="Goal: 60%" tone="bad" />
            <Stat label="Guest to group, median" value={range === "d90" ? "38 days" : "41 days"} />
            <Stat label="Stalled now" value={String(stalledCount)} sub="No contact 7+ days" tone={stalledCount ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Stage conversion">
              <ul className="flex flex-col gap-2.5">
                {STAGES.map((s, i) => (
                  <li key={s.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.25rem_2.75rem] items-center gap-2.5 text-[0.78rem]">
                    <span className="text-ink-soft">{s.label}</span>
                    <Meter value={funnel[i]} max={funnel[0]} />
                    <span className="font-mono text-ink text-right tabular-nums">{funnel[i]}</span>
                    <span className="font-mono text-[0.68rem] text-mist text-right">{Math.round((funnel[i] / funnel[0]) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Where people stall" action={<SmallButton onClick={() => { setView("stalled"); app.section("board"); }}>View stalled</SmallButton>}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {drops.map((d) => (
                  <li key={d.to} className="flex items-center gap-2 py-2">
                    <span className="flex-1 flex items-center gap-1.5 text-[0.78rem] text-ink-soft">{d.from} <ArrowRight size={11} className="text-mist" /> {d.to}</span>
                    <span className="font-mono text-[0.68rem] text-mist">{d.rate}% move on</span>
                    <Status tone={d.lost === worst ? "bad" : "muted"}>{d.lost} {d.lost === worst ? "lost, biggest drop" : "lost"}</Status>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="AI summary" action={summary.state === "shown" ? <span className="flex items-center gap-1 text-[0.68rem] text-mist"><Sparkles size={11} /> AI draft · sample text, review before sharing</span> : undefined}>
              {summary.state === "empty" && <p className="text-[0.78rem] text-graphite mb-3">Turns the numbers on this page into a short note for the staff meeting.</p>}
              {summary.state === "drafting" && <p className="text-[0.78rem] text-graphite mb-3">Drafting from this page…</p>}
              {summary.state === "shown" && <p className="text-[0.8rem] text-ink-soft leading-relaxed mb-3">{SUMMARIES[summary.idx % SUMMARIES.length](stalledCount, topOwner)}</p>}
              <div className="flex flex-wrap gap-2">
                <SmallButton onClick={draftSummary} disabled={summary.state === "drafting"}><RefreshCw size={12} /> {summary.state === "empty" ? "Draft summary" : "Redraft"}</SmallButton>
                {summary.state === "shown" && <SmallButton onClick={() => app.notify("Summary posted to the staff group chat")}><Send size={12} /> Share with staff</SmallButton>}
              </div>
            </Panel>
            <Panel title="First-time guests, last eight Sundays">
              <Bars height="h-24" data={[{ label: "Sep 7", value: 6 }, { label: "14", value: 4 }, { label: "21", value: 9 }, { label: "28", value: 5 }, { label: "Oct 5", value: 7 }, { label: "12", value: 8 }, { label: "19", value: 6 }, { label: "26", value: 9 }]} />
            </Panel>
          </div>
        </>
      )}

      {app.screen === "automations" && (
        <>
          <ScreenHeader title="Automations" subtitle={`${rules.filter((r) => r.on).length} of ${rules.length} rules on`} action={<PrimaryButton onClick={() => setRuleOpen(true)}><Plus size={14} /> New rule</PrimaryButton>} />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3.5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[0.82rem] font-medium text-ink">{r.name}</div>
                  <div className="text-[0.7rem] text-mist mt-0.5">When {lower(r.when)}, {lower(r.then)}.</div>
                </div>
                <span className="hidden md:block font-mono text-[0.68rem] text-graphite">{r.runs} runs this month</span>
                <span className="w-16"><Status tone={r.on ? "good" : "muted"}>{r.on ? "On" : "Paused"}</Status></span>
                <Switch on={r.on} label={r.name} onChange={() => { setRules((l) => l.map((x) => (x.id === r.id ? { ...x, on: !x.on } : x))); app.notify(r.on ? `Paused: ${r.name}` : `On: ${r.name}`); }} />
              </li>
            ))}
          </ul>
          <p className="text-[0.7rem] text-mist mt-2.5">AI-drafted messages wait for a person to approve them. No rule sends AI text on its own.</p>
        </>
      )}

      <ProtoModal open={guestOpen} title="New guest" onClose={() => setGuestOpen(false)} footer={<PrimaryButton onClick={addGuest} disabled={!guest.name.trim()}>Add to Guest column</PrimaryButton>}>
        <Field label="Full name">
          <input autoFocus value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} className={inputClass} placeholder="Maria Santos" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mobile number">
            <input value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} className={inputClass} placeholder="0917 000 0000" />
          </Field>
          <Field label="Area">
            <select value={guest.area} onChange={(e) => setGuest({ ...guest, area: e.target.value })} className={inputClass}>
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="First visit">
            <select value={guest.service} onChange={(e) => setGuest({ ...guest, service: e.target.value })} className={inputClass}>
              <option>9 AM service</option>
              <option>11 AM service</option>
              <option value="livestream">Livestream</option>
            </select>
          </Field>
          <Field label="Came with">
            <select value={guest.with} onChange={(e) => setGuest({ ...guest, with: e.target.value })} className={inputClass}>
              {Object.keys(CAME_WITH).map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Owner">
          <select value={guest.owner} onChange={(e) => setGuest({ ...guest, owner: e.target.value })} className={inputClass}>
            <option value="auto">{rule("r2") ? `Auto by area: ${GROUPS[guest.area].leader}` : `Auto: ${ME} (area rule paused)`}</option>
            {TEAM.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </ProtoModal>

      <ProtoModal open={ruleOpen} title="New rule" onClose={() => setRuleOpen(false)} footer={<PrimaryButton onClick={addRule}>Add rule</PrimaryButton>}>
        <Field label="When">
          <select value={ruleDraft.when} onChange={(e) => setRuleDraft({ ...ruleDraft, when: e.target.value })} className={inputClass}>
            {WHENS.map((w) => <option key={w}>{w}</option>)}
          </select>
        </Field>
        <Field label="Then">
          <select value={ruleDraft.then} onChange={(e) => setRuleDraft({ ...ruleDraft, then: e.target.value })} className={inputClass}>
            {THENS.map((w) => <option key={w}>{w}</option>)}
          </select>
        </Field>
        <Field label="Name (optional)">
          <input value={ruleDraft.name} onChange={(e) => setRuleDraft({ ...ruleDraft, name: e.target.value })} className={inputClass} placeholder={`${ruleDraft.then} when ${lower(ruleDraft.when)}`} />
        </Field>
      </ProtoModal>

      <ProtoModal open={touchOpen} title={cur ? `Log touchpoint for ${first(cur.name)}` : "Log touchpoint"} onClose={() => setTouchOpen(false)} footer={<PrimaryButton onClick={() => {
        if (!cur || !touchDraft.text.trim()) return;
        addTouch(cur.id, touchDraft.kind, touchDraft.text.trim(), ME);
        setTouchOpen(false);
        setTouchDraft({ kind: "call", text: "" });
        app.notify(`${KIND[touchDraft.kind].label} logged for ${first(cur.name)}`);
      }} disabled={!touchDraft.text.trim()}>Save to timeline</PrimaryButton>}>
        <Field label="Type">
          <select value={touchDraft.kind} onChange={(e) => setTouchDraft({ ...touchDraft, kind: e.target.value as TouchKind })} className={inputClass}>
            {(["call", "text", "coffee", "visit", "note"] as const).map((k) => <option key={k} value={k}>{KIND[k].label}</option>)}
          </select>
        </Field>
        <Field label="What happened">
          <textarea value={touchDraft.text} onChange={(e) => setTouchDraft({ ...touchDraft, text: e.target.value })} rows={3} className={cn(inputClass, "h-auto py-2 resize-none")} placeholder="Called after service. Asked about the youth group." />
        </Field>
      </ProtoModal>
    </ProtoApp>
  );
}
