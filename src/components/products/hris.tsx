"use client";

import React, { useState } from "react";
import { CalendarDays, Check, ChevronRight, FileText, HeartHandshake, LayoutDashboard, ListChecks, Mail, Plus, Search, Send, Upload, Users, Wallet } from "lucide-react";
import { Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

const peso = (n: number) => `₱${n.toLocaleString()}`;
const signed = (n: number) => `${n < 0 ? "−" : "+"}${peso(Math.abs(n))}`;

// ---- Dates -----------------------------------------------------------------------

const TODAY = "2026-10-29";
const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
const fmtRange = (a: string, b: string) => (a === b ? fmt(a) : a.slice(0, 7) === b.slice(0, 7) ? `${fmt(a)}–${Number(b.slice(8, 10))}` : `${fmt(a)} to ${fmt(b)}`);
const daysUntil = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / DAY);

// Weekdays between two dates, inclusive. Day 0 (Jan 1, 1970) was a Thursday.
function workingDays(from: string, to: string) {
  const start = Date.parse(from) / DAY;
  const end = Date.parse(to) / DAY;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start || end - start > 90) return 0;
  let n = 0;
  for (let d = start; d <= end; d++) if ((d + 4) % 7 !== 0 && (d + 4) % 7 !== 6) n++;
  return n;
}

// Sample contribution math for one semi-monthly cutoff. Production uses the current tables.
function computePay(monthly: number) {
  const basic = monthly / 2;
  const sss = Math.round((Math.min(monthly, 35000) * 0.05) / 2);
  const philhealth = Math.round((Math.min(Math.max(monthly, 10000), 100000) * 0.025) / 2);
  const pagibig = 100;
  const taxable = basic - sss - philhealth - pagibig;
  const tax = Math.round(taxable <= 10417 ? 0 : taxable <= 16666 ? (taxable - 10417) * 0.15 : 937.5 + (taxable - 16667) * 0.2);
  return { basic, sss, philhealth, pagibig, tax, net: basic - sss - philhealth - pagibig - tax };
}

// ---- Sample data -------------------------------------------------------------------

type Dept = "Pastoral" | "Admin" | "Worship" | "Kids";
interface Staff { id: string; name: string; role: string; dept: Dept; type: "Regular" | "Probationary" | "Part-time"; hired: string; monthly: number; phone: string; vl: number; sl: number; nbi?: string }
interface Doc { id: string; staffId: string; kind: string; file: string; uploaded: string; expires?: string }
interface Leave { id: string; staffId: string; type: "Vacation" | "Sick"; from: string; to: string; days: number; reason: string; filed: string; status: "Pending" | "Approved" | "Declined" }
interface Volunteer { id: string; name: string; ministry: string; trained: boolean; check: "Cleared" | "Pending" | "Not started" | "Expired" | "Not required" }

const DEPTS: Dept[] = ["Pastoral", "Admin", "Worship", "Kids"];

const STAFF: Staff[] = [
  { id: "s1", name: "Joel Manalo", role: "Associate pastor", dept: "Pastoral", type: "Regular", hired: "Jun 2015", monthly: 42000, phone: "0917 555 0201", vl: 11, sl: 13, nbi: "2027-01-14" },
  { id: "s2", name: "Andrea Flores", role: "Youth pastor", dept: "Pastoral", type: "Probationary", hired: "Jun 2026", monthly: 28000, phone: "0918 555 0233", vl: 4, sl: 5, nbi: "2027-05-30" },
  { id: "s3", name: "Tess Aquino", role: "Admin officer", dept: "Admin", type: "Regular", hired: "Jan 2018", monthly: 30000, phone: "0927 555 0248", vl: 9, sl: 14, nbi: "2027-03-02" },
  { id: "s4", name: "Ramon Villareal", role: "Bookkeeper", dept: "Admin", type: "Regular", hired: "Mar 2020", monthly: 27000, phone: "0995 555 0217", vl: 12, sl: 15, nbi: "2026-12-08" },
  { id: "s5", name: "Noel Cruz", role: "Facilities lead", dept: "Admin", type: "Regular", hired: "Aug 2016", monthly: 18000, phone: "0906 555 0265", vl: 7, sl: 10, nbi: "2027-02-19" },
  { id: "s6", name: "Kristine Lim", role: "Worship director", dept: "Worship", type: "Regular", hired: "Feb 2019", monthly: 32000, phone: "0917 555 0272", vl: 10, sl: 12, nbi: "2027-04-11" },
  { id: "s7", name: "Bea Soriano", role: "Media and livestream", dept: "Worship", type: "Part-time", hired: "Jan 2025", monthly: 14000, phone: "0919 555 0284", vl: 5, sl: 4, nbi: "2026-10-20" },
  { id: "s8", name: "Jerome Pascual", role: "Kids ministry coordinator", dept: "Kids", type: "Regular", hired: "Sep 2021", monthly: 24000, phone: "0945 555 0296", vl: 8, sl: 11, nbi: "2026-11-12" },
  { id: "s9", name: "Mae Gonzales", role: "Kids ministry assistant", dept: "Kids", type: "Probationary", hired: "Aug 2026", monthly: 17000, phone: "0928 555 0207", vl: 5, sl: 4 },
];

const lastName = (name: string) => name.split(" ").slice(-1)[0];
const firstName = (name: string) => name.split(" ")[0];

const DOCS: Doc[] = STAFF.flatMap((s) => {
  const last = lastName(s.name);
  const list: Doc[] = [
    { id: `${s.id}-c`, staffId: s.id, kind: "Employment contract", file: `${last}-contract-${s.hired.slice(-4)}.pdf`, uploaded: s.hired },
    { id: `${s.id}-i`, staffId: s.id, kind: "Government IDs", file: `${last}-SSS-PhilHealth-PagIBIG-TIN.pdf`, uploaded: s.hired },
  ];
  if (s.nbi) list.push({ id: `${s.id}-n`, staffId: s.id, kind: "NBI clearance", file: `${last}-NBI-clearance.pdf`, uploaded: `${fmt(s.nbi)}, ${Number(s.nbi.slice(0, 4)) - 1}`, expires: s.nbi });
  return list;
});

const DOC_KINDS = ["NBI clearance", "Employment contract", "Government IDs", "Medical certificate", "Diploma or TOR"];

const LEAVES: Leave[] = [
  { id: "l1", staffId: "s6", type: "Vacation", from: "2026-11-03", to: "2026-11-06", days: 4, reason: "Family trip to Baguio", filed: "Oct 27", status: "Pending" },
  { id: "l2", staffId: "s8", type: "Sick", from: "2026-10-28", to: "2026-10-28", days: 1, reason: "Fever, medical certificate attached", filed: "Oct 28", status: "Pending" },
  { id: "l3", staffId: "s4", type: "Vacation", from: "2026-11-16", to: "2026-11-17", days: 2, reason: "Daughter's graduation in Iloilo", filed: "Oct 29", status: "Pending" },
  { id: "l4", staffId: "s5", type: "Vacation", from: "2026-10-19", to: "2026-10-20", days: 2, reason: "Town fiesta in Batangas", filed: "Oct 9", status: "Approved" },
  { id: "l5", staffId: "s7", type: "Sick", from: "2026-10-13", to: "2026-10-13", days: 1, reason: "Flu", filed: "Oct 13", status: "Approved" },
];

const ADJ_KINDS = [{ label: "Rice allowance", sign: 1 }, { label: "Transportation allowance", sign: 1 }, { label: "Cash advance repayment", sign: -1 }];
const PERIODS = ["Oct 16–31", "Oct 1–15", "Sep 16–30"];
const PAST_CUTOFFS = [{ label: "Aug 1", value: 107500 }, { label: "Aug 16", value: 116000 }, { label: "Sep 1", value: 116000 }, { label: "Sep 16", value: 117800 }, { label: "Oct 1", value: 116000 }];

const HIRES = [{ id: "h1", name: "Carla Domingo", role: "Receptionist", start: "Tue, Nov 3" }, { id: "h2", name: "Paul Espiritu", role: "Sound technician", start: "Mon, Nov 16" }];

const TASKS = [
  { id: "t1", label: "Employment contract signed", phase: "Before day one", owner: "Tess" },
  { id: "t2", label: "NBI clearance submitted", phase: "Before day one", owner: "New hire" },
  { id: "t3", label: "SSS, PhilHealth, Pag-IBIG, and TIN numbers on file", phase: "Before day one", owner: "New hire" },
  { id: "t4", label: "Payroll account opened", phase: "Before day one", owner: "Ramon" },
  { id: "t5", label: "Church email account created", phase: "Before day one", owner: "Bea" },
  { id: "t6", label: "Orientation with Pastor Joel", phase: "First week", owner: "Pastor Joel" },
  { id: "t7", label: "Child protection policy signed", phase: "First week", owner: "New hire" },
  { id: "t8", label: "Office keys and access card", phase: "First week", owner: "Noel" },
  { id: "t9", label: "Introduced at staff devotion", phase: "First week", owner: "Tess" },
];

const VOLUNTEERS: Volunteer[] = [
  { id: "v1", name: "Rina Navarro", ministry: "Kids church", trained: true, check: "Cleared" },
  { id: "v2", name: "Joy Dela Cruz", ministry: "Kids church", trained: false, check: "Pending" },
  { id: "v3", name: "Liza Mendoza", ministry: "Kids church", trained: false, check: "Not started" },
  { id: "v4", name: "Mark Santos", ministry: "Youth", trained: true, check: "Cleared" },
  { id: "v5", name: "Cathy Lopez", ministry: "Youth", trained: true, check: "Expired" },
  { id: "v6", name: "Grace Villanueva", ministry: "Welcome team", trained: true, check: "Not required" },
  { id: "v7", name: "Paolo Garcia", ministry: "Livestream", trained: false, check: "Not required" },
  { id: "v8", name: "Ben Ramos", ministry: "Ushers", trained: true, check: "Not required" },
];

const isReady = (v: Volunteer) => v.trained && (v.check === "Cleared" || v.check === "Not required");
const worksWithKids = (v: Volunteer) => v.ministry === "Kids church" || v.ministry === "Youth";
// Regular staff earn 15 days of each per year; others are prorated.
const cap = (s: Staff) => (s.type === "Regular" ? 15 : 5);
const typeTone = (t: Staff["type"]) => (t === "Regular" ? "good" : t === "Probationary" ? "warn" : "muted");
const checkTone = (c: Volunteer["check"]) => (c === "Cleared" ? "good" : c === "Pending" ? "warn" : c === "Not required" ? "muted" : "bad");

function docStatus(d: Doc) {
  if (!d.expires) return <Status tone="muted">On file</Status>;
  const left = daysUntil(d.expires);
  if (left < 0) return <Status tone="bad">Expired {fmt(d.expires)}</Status>;
  if (left <= 30) return <Status tone="warn">Expires {fmt(d.expires)}</Status>;
  return <Status tone="good">Valid to {fmt(d.expires)}, {d.expires.slice(0, 4)}</Status>;
}

function PayLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <li className={cn("flex justify-between gap-3 py-1.5 text-[0.8rem]", strong ? "border-t border-rule mt-1 pt-2.5 text-ink font-semibold" : "text-ink-soft")}>
      <span>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </li>
  );
}

// ---- App -------------------------------------------------------------------------------

export function ChurchHRISPrototype() {
  const app = useProtoApp("dashboard");
  const [staff, setStaff] = useState(STAFF);
  const [docs, setDocs] = useState(DOCS);
  const [leaves, setLeaves] = useState(LEAVES);
  const [adjustments, setAdjustments] = useState([{ id: "a1", staffId: "s5", label: "Transportation allowance", amount: 1000 }]);
  const [run, setRun] = useState<"Draft" | "Approved" | "Sent">("Draft");
  const [volunteers, setVolunteers] = useState(VOLUNTEERS);
  const [done, setDone] = useState<Record<string, string[]>>({ h1: ["t1", "t2", "t3", "t5"], h2: ["t1"] });
  const [hire, setHire] = useState("h1");
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<"All" | Dept>("All");
  const [leaveView, setLeaveView] = useState<"requests" | "balances">("requests");
  const [volView, setVolView] = useState<"all" | "blocked">("all");
  const [modal, setModal] = useState<"upload" | "leave" | "approve" | "adjust" | null>(null);
  const [upload, setUpload] = useState({ kind: "NBI clearance", file: "", expires: "2027-10-29" });
  const [leaveDraft, setLeaveDraft] = useState({ staffId: "s1", type: "Vacation" as Leave["type"], from: "2026-11-09", to: "2026-11-10", reason: "" });
  const [adjDraft, setAdjDraft] = useState({ staffId: "s1", kind: ADJ_KINDS[0].label, amount: "1500" });

  const close = () => setModal(null);
  const byId = (id?: string) => staff.find((s) => s.id === id);
  const pending = leaves.filter((l) => l.status === "Pending");
  const decided = leaves.filter((l) => l.status !== "Pending");

  // One alert per staff member whose NBI clearance is missing, expired, or due within 30 days.
  const docAlerts = staff.flatMap((s): { staff: Staff; text: string; tone: "bad" | "warn" }[] => {
    const nbi = docs.find((d) => d.staffId === s.id && d.kind === "NBI clearance");
    if (!nbi?.expires) return [{ staff: s, text: "Missing", tone: "bad" }];
    const left = daysUntil(nbi.expires);
    if (left < 0) return [{ staff: s, text: "Expired", tone: "bad" }];
    return left <= 30 ? [{ staff: s, text: `Expires in ${left} days`, tone: "warn" }] : [];
  });
  const alertFor = (id: string) => docAlerts.find((a) => a.staff.id === id);

  const pay = staff.map((s) => {
    const base = computePay(s.monthly);
    const adj = adjustments.filter((a) => a.staffId === s.id).reduce((t, a) => t + a.amount, 0);
    return { s, ...base, adj, net: base.net + adj };
  });
  const sum = (k: "basic" | "sss" | "philhealth" | "pagibig" | "tax" | "net" | "adj") => pay.reduce((t, r) => t + r[k], 0);
  const step = run === "Draft" ? 0 : run === "Approved" ? 1 : 2;

  const visibleStaff = staff.filter((s) => (dept === "All" || s.dept === dept) && `${s.name} ${s.role}`.toLowerCase().includes(query.toLowerCase()));
  const visibleVols = volunteers.filter((v) => volView === "all" || !isReady(v));

  const sp = app.screen === "profile" ? byId(app.id) : undefined;
  const [slipId, period] = (app.id ?? "").split("|");
  const slip = app.screen === "payslip" ? pay.find((r) => r.s.id === slipId) : undefined;
  const slipAdj = slip && period === PERIODS[0] ? adjustments.filter((a) => a.staffId === slip.s.id) : [];
  const runStatus = (current: boolean) => (current && run !== "Sent" ? <Status tone="warn">{run === "Draft" ? "In review" : "Approved"}</Status> : <Status tone="good">Sent</Status>);

  const draftStaff = byId(leaveDraft.staffId);
  const draftDays = workingDays(leaveDraft.from, leaveDraft.to);
  const draftLeft = draftStaff ? (leaveDraft.type === "Vacation" ? draftStaff.vl : draftStaff.sl) : 0;
  const needsExpiry = upload.kind === "NBI clearance" || upload.kind === "Medical certificate";
  const hireInfo = HIRES.find((h) => h.id === hire) ?? HIRES[0];
  const hireDone = done[hire];

  const openLeave = (staffId: string) => {
    setLeaveDraft({ staffId, type: "Vacation", from: "2026-11-09", to: "2026-11-10", reason: "" });
    setModal("leave");
  };

  const fileLeave = () => {
    if (!draftStaff || !draftDays || draftDays > draftLeft) return;
    setLeaves((list) => [...list, { id: `l${Date.now()}`, ...leaveDraft, reason: leaveDraft.reason.trim() || "No reason given", days: draftDays, filed: "Oct 29", status: "Pending" }]);
    setLeaveView("requests");
    close();
    app.notify(`${leaveDraft.type} leave for ${draftStaff.name} filed. Waiting for approval.`);
  };

  const decide = (l: Leave, status: "Approved" | "Declined") => {
    const s = byId(l.staffId);
    if (!s) return;
    const key = l.type === "Vacation" ? "vl" : "sl";
    if (status === "Approved" && s[key] < l.days) return app.notify(`${firstName(s.name)} has only ${s[key]} ${l.type.toLowerCase()} days left`);
    setLeaves((list) => list.map((x) => (x.id === l.id ? { ...x, status } : x)));
    if (status === "Approved") setStaff((list) => list.map((x) => (x.id === s.id ? { ...x, [key]: x[key] - l.days } : x)));
    app.notify(status === "Approved" ? `Approved. ${firstName(s.name)} has ${s[key] - l.days} ${l.type.toLowerCase()} days left.` : `Declined. ${firstName(s.name)} was notified by SMS.`);
  };

  const uploadDoc = () => {
    if (!sp) return;
    const file = upload.file || `${lastName(sp.name)}-${upload.kind.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    const doc: Doc = { id: `d${Date.now()}`, staffId: sp.id, kind: upload.kind, file, uploaded: "Oct 29, 2026", expires: needsExpiry ? upload.expires : undefined };
    setDocs((list) => [doc, ...list.filter((d) => !(d.staffId === sp.id && d.kind === upload.kind))]);
    close();
    app.notify(`${upload.kind} saved to ${firstName(sp.name)}'s profile`);
  };

  const addAdjustment = () => {
    const amount = Number(adjDraft.amount);
    const s = byId(adjDraft.staffId);
    const kind = ADJ_KINDS.find((k) => k.label === adjDraft.kind) ?? ADJ_KINDS[0];
    if (!amount || !s) return;
    setAdjustments((list) => [...list, { id: `a${Date.now()}`, staffId: s.id, label: kind.label, amount: amount * kind.sign }]);
    close();
    app.notify(`${kind.label} of ${peso(amount)} added for ${s.name}`);
  };

  const toggleTask = (taskId: string) => {
    const next = hireDone.includes(taskId) ? hireDone.filter((t) => t !== taskId) : [...hireDone, taskId];
    setDone((d) => ({ ...d, [hire]: next }));
    if (next.length === TASKS.length) app.notify(`${hireInfo.name} is ready for day one`);
  };

  const updateVolunteer = (v: Volunteer, change: Partial<Volunteer>, message: string) => {
    setVolunteers((list) => list.map((x) => (x.id === v.id ? { ...x, ...change } : x)));
    app.notify(message);
  };

  const nav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "directory", label: "Staff", icon: Users, badge: staff.length },
    { id: "payroll", label: "Payroll", icon: Wallet },
    { id: "leave", label: "Leave", icon: CalendarDays, badge: pending.length || undefined },
    { id: "onboarding", label: "Onboarding", icon: ListChecks },
    { id: "volunteers", label: "Volunteers", icon: HeartHandshake },
  ];

  const rowText = (title: React.ReactNode, sub: React.ReactNode) => (
    <span className="flex-1 min-w-0">
      <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{title}</span>
      <span className="block text-[0.68rem] text-mist truncate">{sub}</span>
    </span>
  );

  return (
    <ProtoApp app={app} name="Church HRIS · Grace Fellowship" user="Tess Aquino" nav={nav} alerts={pending.length + docAlerts.length}>
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Overview" subtitle="Thursday, October 29" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Headcount" value={String(staff.length)} sub={`${staff.filter((s) => s.type === "Regular").length} regular`} />
            <Stat label="Next pay date" value="Oct 30" sub={run === "Draft" ? "Pay run in draft" : run === "Approved" ? "Approved, payslips not sent" : "Payslips sent"} tone={run === "Sent" ? "good" : undefined} />
            <Stat label="Pending leave" value={String(pending.length)} sub={pending.length ? `Oldest filed ${pending[0].filed}` : "All caught up"} />
            <Stat label="Document alerts" value={String(docAlerts.length)} sub="NBI clearances" tone={docAlerts.length ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3">
            <Panel title="Payroll cost, last six cutoffs">
              <Bars format={(n) => `${Math.round(n / 1000)}k`} data={[...PAST_CUTOFFS, { label: "Oct 16", value: sum("basic") + sum("adj") }]} />
            </Panel>
            <Panel title="Needs attention">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {docAlerts.map((a) => (
                  <li key={a.staff.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={a.staff.name} size={28} />
                    <button type="button" onClick={() => app.open("profile", a.staff.id, a.staff.name)} className="group flex-1 min-w-0 text-left cursor-pointer">{rowText(a.staff.name, "NBI clearance")}</button>
                    <Status tone={a.tone}>{a.text}</Status>
                  </li>
                ))}
                {pending.map((l) => (
                  <li key={l.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={byId(l.staffId)?.name ?? ""} size={28} />
                    {rowText(byId(l.staffId)?.name, `${l.type} leave · ${fmtRange(l.from, l.to)}`)}
                    <SmallButton onClick={() => app.section("leave")}>Review</SmallButton>
                  </li>
                ))}
                {docAlerts.length + pending.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Nothing needs attention.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "directory" && (
        <>
          <ScreenHeader title="Staff" subtitle={`${staff.length} staff · ${DEPTS.length} departments`} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
              <Search size={14} className="text-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or role" aria-label="Search staff" className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
            </label>
            <Segmented id="hris-dept" value={dept} onChange={setDept} options={[{ id: "All", label: "All" }, ...DEPTS.map((d) => ({ id: d, label: d }))]} />
          </div>
          <Table
            rows={visibleStaff}
            rowKey={(s) => s.id}
            onRowClick={(s) => app.open("profile", s.id, s.name)}
            empty="No staff match that search."
            columns={[
              { key: "name", label: "Name", render: (s) => <span className="flex items-center gap-2"><Avatar name={s.name} size={26} /><span><span className="block text-ink">{s.name}</span><span className="block text-[0.7rem] text-mist">{s.role}</span></span></span> },
              { key: "dept", label: "Department", render: (s) => s.dept, hideOnMobile: true },
              { key: "type", label: "Employment", render: (s) => <Status tone={typeTone(s.type)}>{s.type}</Status> },
              { key: "docs", label: "Documents", hideOnMobile: true, render: (s) => { const a = alertFor(s.id); return a ? <Status tone={a.tone}>NBI {a.text.toLowerCase()}</Status> : <Status tone="good">Complete</Status>; } },
            ]}
          />
        </>
      )}

      {app.screen === "profile" && sp && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={sp.name} size={48} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-[1.5rem] leading-tight font-semibold text-ink">{sp.name}</h4>
              <span className="text-[0.78rem] text-graphite">{sp.role} · {sp.dept}</span>
            </div>
            <SmallButton onClick={() => openLeave(sp.id)}><CalendarDays size={12} /> File leave</SmallButton>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Details">
              <KeyValues items={[["Employment", <Status key="t" tone={typeTone(sp.type)}>{sp.type}</Status>], ["Hired", sp.hired], ["Mobile", sp.phone], ["Email", `${firstName(sp.name).toLowerCase()}@gracefellowship.ph`], ["Monthly basic", peso(sp.monthly)], ["Government IDs", "SSS, PhilHealth, Pag-IBIG, TIN"]]} />
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Leave balances">
                {(["vl", "sl"] as const).map((k) => (
                  <div key={k} className="mb-2.5 last:mb-0">
                    <div className="flex justify-between text-[0.78rem] mb-1"><span className="text-ink">{k === "vl" ? "Vacation" : "Sick"}</span><span className="font-mono text-graphite">{sp[k]} of {cap(sp)} days left</span></div>
                    <Meter value={sp[k]} max={cap(sp)} />
                  </div>
                ))}
              </Panel>
              <Panel title="Recent payslips">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {PERIODS.map((p, i) => (
                    <li key={p}>
                      <button type="button" onClick={() => app.open("payslip", `${sp.id}|${p}`, `Payslip ${p}`)} className="w-full flex items-center justify-between gap-3 py-2 text-left text-[0.8rem] cursor-pointer group">
                        <span className="text-ink group-hover:text-gold-bright">{p}</span>
                        <span className="flex items-center gap-3">{runStatus(i === 0)}<span className="font-mono text-ink">{peso(computePay(sp.monthly).net + (i === 0 ? (pay.find((r) => r.s.id === sp.id)?.adj ?? 0) : 0))}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
            <Panel title="Documents" className="lg:col-span-2" action={<SmallButton onClick={() => { setUpload({ kind: "NBI clearance", file: "", expires: "2027-10-29" }); setModal("upload"); }}><Upload size={12} /> Upload document</SmallButton>}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {docs.filter((d) => d.staffId === sp.id).map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-2.5 py-2">
                    <FileText size={15} className="text-mist shrink-0" />
                    {rowText(d.kind, `${d.file} · Uploaded ${d.uploaded}`)}
                    {docStatus(d)}
                  </li>
                ))}
                {!docs.some((d) => d.staffId === sp.id && d.kind === "NBI clearance") && (
                  <li className="flex items-center gap-2.5 py-2"><FileText size={15} className="text-mist shrink-0" />{rowText("NBI clearance", "Required for staff who work with kids")}<Status tone="bad">Missing</Status></li>
                )}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "payroll" && (
        <>
          <ScreenHeader
            title="Pay run · Oct 16–31"
            subtitle={`Pay date Oct 30 · ${staff.length} staff`}
            action={
              run === "Draft" ? (
                <>
                  <SmallButton onClick={() => setModal("adjust")}><Plus size={12} /> Adjustment</SmallButton>
                  <PrimaryButton onClick={() => setModal("approve")}><Check size={14} /> Review and approve</PrimaryButton>
                </>
              ) : run === "Approved" ? (
                <PrimaryButton onClick={() => { setRun("Sent"); app.notify(`${staff.length} payslips emailed to staff`); }}><Send size={14} /> Send payslips</PrimaryButton>
              ) : null
            }
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {["Draft", "Approved", "Payslips sent"].map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && <ChevronRight size={12} className="text-mist" />}
                <Status tone={i < step || run === "Sent" ? "good" : i === step ? "warn" : "muted"}>{label}</Status>
              </React.Fragment>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Gross pay" value={peso(sum("basic"))} />
            <Stat label="Employee contributions" value={peso(sum("sss") + sum("philhealth") + sum("pagibig"))} sub="SSS, PhilHealth, Pag-IBIG" />
            <Stat label="Withholding tax" value={peso(sum("tax"))} />
            <Stat label="Net pay" value={peso(sum("net"))} sub={sum("adj") ? `Includes ${signed(sum("adj"))} adjustments` : undefined} />
          </div>
          <Table
            rows={pay}
            rowKey={(r) => r.s.id}
            onRowClick={(r) => app.open("payslip", `${r.s.id}|${PERIODS[0]}`, r.s.name)}
            columns={[
              { key: "name", label: "Staff", render: (r) => <span className="text-ink">{r.s.name}</span> },
              ...(["basic", "sss", "philhealth", "pagibig", "tax"] as const).map((k) => ({
                key: k,
                label: { basic: "Basic", sss: "SSS", philhealth: "PhilHealth", pagibig: "Pag-IBIG", tax: "Tax" }[k],
                align: "right" as const,
                hideOnMobile: true,
                render: (r: (typeof pay)[number]) => <span className="font-mono">{peso(r[k])}</span>,
              })),
              { key: "net", label: "Net pay", align: "right", render: (r) => <span><span className="block font-mono text-ink">{peso(r.net)}</span>{r.adj !== 0 && <span className="block text-[0.65rem] text-mist">{signed(r.adj)} adjustment</span>}</span> },
            ]}
          />
          <p className="mt-2 text-[0.72rem] text-mist">Sample contribution amounts. SSS {peso(sum("sss"))} · PhilHealth {peso(sum("philhealth"))} · Pag-IBIG {peso(sum("pagibig"))}</p>
        </>
      )}

      {app.screen === "payslip" && slip && (
        <>
          <ScreenHeader title={`Payslip · ${period}`} subtitle={`${slip.s.name} · ${slip.s.role}`} action={<SmallButton onClick={() => app.notify(`Payslip emailed to ${firstName(slip.s.name).toLowerCase()}@gracefellowship.ph`)}><Mail size={12} /> Email payslip</SmallButton>} />
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
            <Panel title="Earnings and deductions" action={runStatus(period === PERIODS[0])}>
              <ul className="flex flex-col">
                <PayLine label="Basic pay, semi-monthly" value={peso(slip.basic)} />
                {slipAdj.map((a) => <PayLine key={a.id} label={a.label} value={signed(a.amount)} />)}
                <PayLine label="SSS" value={`−${peso(slip.sss)}`} />
                <PayLine label="PhilHealth" value={`−${peso(slip.philhealth)}`} />
                <PayLine label="Pag-IBIG" value={`−${peso(slip.pagibig)}`} />
                <PayLine label="Withholding tax" value={`−${peso(slip.tax)}`} />
                <PayLine strong label="Net pay" value={peso(slip.net - slip.adj + slipAdj.reduce((t, a) => t + a.amount, 0))} />
              </ul>
            </Panel>
            <Panel title="Employer share">
              <KeyValues items={[["SSS", peso(Math.round((Math.min(slip.s.monthly, 35000) * 0.1) / 2))], ["PhilHealth", peso(slip.philhealth)], ["Pag-IBIG", peso(100)], ["Paid to", "BPI payroll account"]]} />
              <p className="mt-3 text-[0.72rem] text-mist">Sample contribution amounts.</p>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "leave" && (
        <>
          <ScreenHeader title="Leave" subtitle={`${pending.length} pending · Regular staff earn 15 vacation and 15 sick days a year`} action={<PrimaryButton onClick={() => openLeave("s1")}><Plus size={14} /> File leave</PrimaryButton>} />
          <div className="mb-3">
            <Segmented id="hris-leave" value={leaveView} onChange={setLeaveView} options={[{ id: "requests", label: "Requests" }, { id: "balances", label: "Balances" }]} />
          </div>
          {leaveView === "requests" ? (
            <div className="flex flex-col gap-3">
              <Panel title={`Waiting for approval · ${pending.length}`}>
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {pending.map((l) => {
                    const s = byId(l.staffId);
                    if (!s) return null;
                    return (
                      <li key={l.id} className="flex flex-wrap items-center gap-2.5 py-2.5">
                        <Avatar name={s.name} size={28} />
                        <span className="flex-1 min-w-[11rem]">
                          <span className="block text-[0.8rem] text-ink">{s.name} <span className="text-mist">· {l.type}, {l.days} {l.days === 1 ? "day" : "days"}</span></span>
                          <span className="block text-[0.7rem] text-mist">{fmtRange(l.from, l.to)} · {l.reason} · {l.type === "Vacation" ? s.vl : s.sl} days left</span>
                        </span>
                        <SmallButton onClick={() => decide(l, "Declined")}>Decline</SmallButton>
                        <PrimaryButton onClick={() => decide(l, "Approved")}>Approve</PrimaryButton>
                      </li>
                    );
                  })}
                  {pending.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No requests waiting.</li>}
                </ul>
              </Panel>
              <Table
                rows={decided}
                rowKey={(l) => l.id}
                columns={[
                  { key: "who", label: "Staff", render: (l) => <span className="text-ink">{byId(l.staffId)?.name}</span> },
                  { key: "type", label: "Type", render: (l) => l.type },
                  { key: "dates", label: "Dates", hideOnMobile: true, render: (l) => fmtRange(l.from, l.to) },
                  { key: "days", label: "Days", align: "right", hideOnMobile: true, render: (l) => <span className="font-mono">{l.days}</span> },
                  { key: "status", label: "Status", render: (l) => <Status tone={l.status === "Approved" ? "good" : "bad"}>{l.status}</Status> },
                ]}
              />
            </div>
          ) : (
            <Table
              rows={staff}
              rowKey={(s) => s.id}
              onRowClick={(s) => app.open("profile", s.id, s.name)}
              columns={[
                { key: "name", label: "Staff", render: (s) => <span className="text-ink">{s.name}</span> },
                ...(["vl", "sl"] as const).map((k) => ({
                  key: k,
                  label: k === "vl" ? "Vacation left" : "Sick left",
                  render: (s: Staff) => <span className="flex items-center gap-2"><Meter value={s[k]} max={cap(s)} className="w-16" /><span className="font-mono text-[0.72rem]">{s[k]}/{cap(s)}</span></span>,
                })),
                { key: "used", label: "Used this year", align: "right" as const, hideOnMobile: true, render: (s: Staff) => <span className="font-mono">{cap(s) * 2 - s.vl - s.sl} days</span> },
              ]}
            />
          )}
        </>
      )}

      {app.screen === "onboarding" && (
        <>
          <ScreenHeader title="Onboarding" subtitle={`${hireInfo.name} · ${hireInfo.role} · Starts ${hireInfo.start}`} action={<Segmented id="hris-hire" value={hire} onChange={setHire} options={HIRES.map((h) => ({ id: h.id, label: firstName(h.name) }))} />} />
          <Panel className="mb-3">
            <div className="flex items-center justify-between gap-3 mb-2 text-[0.8rem]">
              <span className="text-ink">{hireDone.length} of {TASKS.length} tasks done</span>
              {hireDone.length === TASKS.length ? <Status tone="good">Ready for day one</Status> : <SmallButton onClick={() => app.notify(`Reminders sent for ${TASKS.length - hireDone.length} open tasks`)}><Send size={12} /> Send reminders</SmallButton>}
            </div>
            <Meter value={hireDone.length} max={TASKS.length} />
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {["Before day one", "First week"].map((phase) => (
              <Panel key={phase} title={phase}>
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {TASKS.filter((t) => t.phase === phase).map((t) => {
                    const on = hireDone.includes(t.id);
                    return (
                      <li key={t.id}>
                        <button type="button" aria-pressed={on} onClick={() => toggleTask(t.id)} className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer group">
                          <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", on ? "bg-gold border-gold text-paper" : "border-mist group-hover:border-gold")}>{on && <Check size={11} strokeWidth={3} />}</span>
                          <span className={cn("flex-1 text-[0.8rem]", on ? "text-graphite line-through" : "text-ink")}>{t.label}</span>
                          <span className="text-[0.68rem] text-mist shrink-0">{t.owner === "New hire" ? firstName(hireInfo.name) : t.owner}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))}
          </div>
        </>
      )}

      {app.screen === "volunteers" && (
        <>
          <ScreenHeader title="Volunteers" subtitle="Kids and youth volunteers need training and a cleared NBI check" action={<Segmented id="hris-vol" value={volView} onChange={setVolView} options={[{ id: "all", label: "All" }, { id: "blocked", label: "Not cleared" }]} />} />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Volunteers" value={String(volunteers.length)} />
            <Stat label="Ready to serve" value={String(volunteers.filter(isReady).length)} tone="good" sub="Trained and cleared" />
            <Stat label="Training due" value={String(volunteers.filter((v) => !v.trained).length)} tone={volunteers.some((v) => !v.trained) ? "bad" : "good"} sub="Before next Sunday" />
          </div>
          <Table
            rows={visibleVols}
            rowKey={(v) => v.id}
            empty="Everyone is cleared to serve."
            columns={[
              { key: "name", label: "Volunteer", render: (v) => <span><span className="block text-ink">{v.name}</span><span className="block text-[0.7rem] text-mist">{v.ministry}</span></span> },
              { key: "training", label: "Training", render: (v) => (v.trained ? <Status tone="good">{worksWithKids(v) ? "Child protection" : "Orientation"}</Status> : <SmallButton onClick={() => updateVolunteer(v, { trained: true }, `${v.name} marked trained. Certificate saved.`)}><Check size={12} /> Mark complete</SmallButton>) },
              {
                key: "check",
                label: "NBI check",
                hideOnMobile: true,
                render: (v) => (
                  <span className="flex items-center gap-2">
                    <Status tone={checkTone(v.check)}>{v.check}</Status>
                    {(v.check === "Not started" || v.check === "Expired") && <SmallButton onClick={() => updateVolunteer(v, { check: "Pending" }, `NBI clearance request sent to ${firstName(v.name)}`)}>Request</SmallButton>}
                    {v.check === "Pending" && <SmallButton onClick={() => updateVolunteer(v, { check: "Cleared" }, `${v.name} cleared. Clearance saved to their record.`)}>Mark cleared</SmallButton>}
                  </span>
                ),
              },
              { key: "serve", label: "Serving", render: (v) => (isReady(v) ? <Status tone="good">Ready</Status> : <Status tone="bad">On hold</Status>) },
            ]}
          />
        </>
      )}

      <ProtoModal open={modal === "upload"} title={`Upload document · ${sp?.name ?? ""}`} onClose={close} footer={<PrimaryButton onClick={uploadDoc} disabled={needsExpiry && !upload.expires}><Upload size={14} /> Upload</PrimaryButton>}>
        <Field label="Document type">
          <select value={upload.kind} onChange={(e) => setUpload({ ...upload, kind: e.target.value })} className={inputClass}>{DOC_KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        </Field>
        <Field label="File (PDF or photo)">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0]?.name ?? "" })} className="text-[0.75rem] text-graphite file:mr-3 file:px-2.5 file:py-1 file:rounded-md file:border file:border-rule file:bg-transparent file:text-ink file:text-[0.72rem] file:cursor-pointer" />
        </Field>
        {needsExpiry && (
          <Field label="Valid until">
            <input type="date" value={upload.expires} onChange={(e) => setUpload({ ...upload, expires: e.target.value })} className={inputClass} />
          </Field>
        )}
        {sp && docs.some((d) => d.staffId === sp.id && d.kind === upload.kind) && <p className="text-[0.72rem] text-mist">Replaces the {upload.kind.toLowerCase()} on file.</p>}
      </ProtoModal>

      <ProtoModal open={modal === "leave"} title="File leave" onClose={close} footer={<PrimaryButton onClick={fileLeave} disabled={!draftDays || draftDays > draftLeft}>Submit request</PrimaryButton>}>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <Field label="Staff member">
            <select value={leaveDraft.staffId} onChange={(e) => setLeaveDraft({ ...leaveDraft, staffId: e.target.value })} className={inputClass}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </Field>
          <Field label="Type">
            <select value={leaveDraft.type} onChange={(e) => setLeaveDraft({ ...leaveDraft, type: e.target.value as Leave["type"] })} className={inputClass}><option>Vacation</option><option>Sick</option></select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><input type="date" value={leaveDraft.from} onChange={(e) => setLeaveDraft({ ...leaveDraft, from: e.target.value })} className={inputClass} /></Field>
          <Field label="To"><input type="date" value={leaveDraft.to} onChange={(e) => setLeaveDraft({ ...leaveDraft, to: e.target.value })} className={inputClass} /></Field>
        </div>
        <Field label="Reason">
          <input value={leaveDraft.reason} onChange={(e) => setLeaveDraft({ ...leaveDraft, reason: e.target.value })} placeholder="Family event in Pampanga" className={inputClass} />
        </Field>
        <p className={cn("text-[0.72rem]", draftDays > draftLeft || !draftDays ? "text-danger" : "text-mist")}>
          {draftDays ? `${draftDays} working ${draftDays === 1 ? "day" : "days"}` : "Pick a valid date range"} · {draftLeft} {leaveDraft.type.toLowerCase()} days left{draftDays > draftLeft ? ". Not enough credits." : ""}
        </p>
      </ProtoModal>

      <ProtoModal
        open={modal === "approve"}
        title="Review pay run, Oct 16–31"
        onClose={close}
        footer={
          <>
            <SmallButton onClick={close}>Keep editing</SmallButton>
            <PrimaryButton onClick={() => { setRun("Approved"); close(); app.notify("Pay run approved. Bank file sent to Ramon for Oct 30."); }}><Check size={14} /> Approve pay run</PrimaryButton>
          </>
        }
      >
        <KeyValues
          items={[
            ["Staff", String(staff.length)],
            ["Gross pay", peso(sum("basic"))],
            ["Adjustments", sum("adj") ? signed(sum("adj")) : peso(0)],
            ["SSS", peso(sum("sss"))],
            ["PhilHealth", peso(sum("philhealth"))],
            ["Pag-IBIG", peso(sum("pagibig"))],
            ["Withholding tax", peso(sum("tax"))],
            ["Net pay", <span key="net" className="font-semibold">{peso(sum("net"))}</span>],
          ]}
        />
        <p className="text-[0.72rem] text-mist">Approving locks the pay run. Sample contribution amounts.</p>
      </ProtoModal>

      <ProtoModal open={modal === "adjust"} title="Add pay adjustment" onClose={close} footer={<PrimaryButton onClick={addAdjustment} disabled={!Number(adjDraft.amount)}>Add to pay run</PrimaryButton>}>
        <Field label="Staff member">
          <select value={adjDraft.staffId} onChange={(e) => setAdjDraft({ ...adjDraft, staffId: e.target.value })} className={inputClass}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </Field>
        <Field label="Type">
          <select value={adjDraft.kind} onChange={(e) => setAdjDraft({ ...adjDraft, kind: e.target.value })} className={inputClass}>{ADJ_KINDS.map((k) => <option key={k.label}>{k.label}</option>)}</select>
        </Field>
        <Field label="Amount (₱)">
          <input inputMode="numeric" value={adjDraft.amount} onChange={(e) => setAdjDraft({ ...adjDraft, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} />
        </Field>
      </ProtoModal>
    </ProtoApp>
  );
}
