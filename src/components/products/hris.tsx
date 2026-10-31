"use client";

import React, { useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock, Download, FileText, Landmark, LayoutDashboard, ListChecks, Mail, Megaphone, Paperclip, Pencil, Plus, Receipt, Search, Send, Target, Upload, UserPlus, Users, Wallet } from "lucide-react";
import { ProtoHeading, Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, Toggle, inputClass, textareaClass, useProtoApp, type ProtoAlert, type ProtoSearchItem } from "./ProtoKit";
import { cn } from "@/lib/utils";

type Tone = "good" | "warn" | "bad" | "muted";

// ---- Formatting and dates ------------------------------------------------------------

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;
const minus = (n: number) => (Math.round(n) === 0 ? peso(0) : `−${peso(n)}`);
const signed = (n: number) => (Math.round(n) === 0 ? peso(0) : `${n < 0 ? "−" : "+"}${peso(Math.abs(n))}`);
const pct = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}%`;

const TODAY = "2026-10-29";
const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayNo = (iso: string) => Math.round(Date.parse(iso) / DAY);
const isoOf = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
const weekday = (iso: string) => (dayNo(iso) + 4) % 7; // Jan 1, 1970 was a Thursday
const fmt = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
const fmtDay = (iso: string) => `${WEEKDAYS[weekday(iso)]}, ${fmt(iso)}`;
const fmtYear = (iso: string) => `${fmt(iso)}, ${iso.slice(0, 4)}`;
const fmtRange = (a: string, b: string) => (a === b ? fmt(a) : a.slice(0, 7) === b.slice(0, 7) ? `${fmt(a)}–${Number(b.slice(8, 10))}` : `${fmt(a)} to ${fmt(b)}`);
const daysUntil = (iso: string) => dayNo(iso) - dayNo(TODAY);
// "Today", "2 days ago", "In 14 days": how far a date is from the demo's today.
const relDay = (iso: string) => {
  const d = daysUntil(iso);
  return d === 0 ? "Today" : d === 1 ? "Tomorrow" : d === -1 ? "Yesterday" : d > 1 ? `In ${d} days` : d > -14 ? `${-d} days ago` : fmt(iso);
};
const inRange = (iso: string, from: string, to: string) => iso >= from && iso <= to;
const validDate = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso));
const addMonths = (iso: string, n: number) => {
  const m = Number(iso.slice(5, 7)) - 1 + n;
  return `${Number(iso.slice(0, 4)) + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, "0")}${iso.slice(7)}`;
};
const clock = (min: number) => (min ? `${((Math.floor(min / 60) + 11) % 12) + 1}:${String(min % 60).padStart(2, "0")} ${min >= 720 ? "PM" : "AM"}` : "—");
const tenure = (hired: string) => {
  const m = (2026 - Number(hired.slice(0, 4))) * 12 + 10 - Number(hired.slice(5, 7));
  return m >= 12 ? `${Math.floor(m / 12)} yr${m >= 24 ? "s" : ""}` : `${m} mo${m === 1 ? "" : "s"}`;
};

// Sample holiday list. Production follows the year's proclamation.
const HOLIDAYS: { date: string; name: string; kind: "Regular holiday" | "Special non-working" }[] = [
  { date: "2026-11-01", name: "All Saints' Day", kind: "Special non-working" },
  { date: "2026-11-30", name: "Bonifacio Day", kind: "Regular holiday" },
  { date: "2026-12-08", name: "Immaculate Conception", kind: "Special non-working" },
  { date: "2026-12-24", name: "Christmas Eve", kind: "Special non-working" },
  { date: "2026-12-25", name: "Christmas Day", kind: "Regular holiday" },
  { date: "2026-12-30", name: "Rizal Day", kind: "Regular holiday" },
  { date: "2026-12-31", name: "Last day of the year", kind: "Special non-working" },
];
const holidayOn = (iso: string) => HOLIDAYS.find((h) => h.date === iso);
const isWorkday = (iso: string) => weekday(iso) % 6 !== 0 && !holidayOn(iso);

// Working days between two dates, inclusive, skipping weekends and holidays.
function workdays(from: string, to: string) {
  const a = dayNo(from);
  const b = dayNo(to);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a || b - a > 120) return [];
  const out: string[] = [];
  for (let d = a; d <= b; d++) if (isWorkday(isoOf(d))) out.push(isoOf(d));
  return out;
}

// ---- Staff and 201 files ----------------------------------------------------------------

type Dept = "Pastoral" | "Admin" | "Worship" | "Kids";
type EmpType = "Regular" | "Probationary" | "Contractual";
interface Staff {
  id: string; name: string; role: string; dept: Dept; type: EmpType; hired: string; monthly: number; prevMonthly?: number; manager?: string;
  phone: string; city: string; vl: number; sl: number; exempt?: boolean; payout: string; nbi?: string; medical?: string; missing?: string[]; leaving?: string; contractEnd?: string;
}
interface Doc { id: string; staffId: string; kind: string; file: string; uploaded: string; expires?: string }

const DEPTS: Dept[] = ["Pastoral", "Admin", "Worship", "Kids"];

const STAFF: Staff[] = [
  { id: "s10", name: "Dan Castillo", role: "Senior pastor", dept: "Pastoral", type: "Regular", hired: "2009-03-02", monthly: 56000, phone: "0917 555 0110", city: "Quezon City", vl: 14, sl: 15, exempt: true, payout: "Bank transfer ••• 1093", nbi: "2027-06-15", medical: "2027-03-12" },
  { id: "s1", name: "Joel Manalo", role: "Associate pastor", dept: "Pastoral", type: "Regular", hired: "2015-06-01", monthly: 42000, manager: "s10", phone: "0917 555 0201", city: "Quezon City", vl: 11, sl: 13, exempt: true, payout: "Bank transfer ••• 4821", nbi: "2027-01-14", medical: "2027-02-10" },
  { id: "s2", name: "Andrea Flores", role: "Youth pastor", dept: "Pastoral", type: "Probationary", hired: "2026-06-01", monthly: 28000, manager: "s1", phone: "0918 555 0233", city: "Fairview, QC", vl: 5, sl: 4, payout: "GCash 0918 ••• 0233", nbi: "2027-05-30", medical: "2027-05-20", missing: ["PSA birth certificate"] },
  { id: "s11", name: "Rachel Santiago", role: "Missions coordinator", dept: "Pastoral", type: "Regular", hired: "2022-07-04", monthly: 26000, manager: "s1", phone: "0927 555 0311", city: "Marikina", vl: 6, sl: 12, payout: "Bank transfer ••• 7730", nbi: "2027-02-02", medical: "2027-08-01" },
  { id: "s8", name: "Jerome Pascual", role: "Kids ministry coordinator", dept: "Kids", type: "Regular", hired: "2021-09-01", monthly: 24000, prevMonthly: 22000, manager: "s1", phone: "0945 555 0296", city: "Caloocan", vl: 8, sl: 11, payout: "Maya 0945 ••• 0296", nbi: "2026-11-12", medical: "2027-02-28" },
  { id: "s9", name: "Mae Gonzales", role: "Kids ministry assistant", dept: "Kids", type: "Probationary", hired: "2026-07-16", monthly: 18000, manager: "s8", phone: "0928 555 0207", city: "Novaliches, QC", vl: 3, sl: 5, payout: "GCash 0928 ••• 0207", medical: "2027-07-10" },
  { id: "s3", name: "Tess Aquino", role: "Admin and HR officer", dept: "Admin", type: "Regular", hired: "2018-01-08", monthly: 30000, manager: "s10", phone: "0927 555 0248", city: "San Juan", vl: 9, sl: 14, exempt: true, payout: "Bank transfer ••• 3307", nbi: "2027-03-02", medical: "2027-01-15" },
  { id: "s4", name: "Ramon Villareal", role: "Bookkeeper", dept: "Admin", type: "Regular", hired: "2020-03-02", monthly: 26000, manager: "s3", phone: "0995 555 0217", city: "Pasig", vl: 12, sl: 15, payout: "Bank transfer ••• 5512", nbi: "2026-12-08", medical: "2027-03-01" },
  { id: "s5", name: "Noel Cruz", role: "Facilities lead", dept: "Admin", type: "Regular", hired: "2016-08-01", monthly: 20000, manager: "s3", phone: "0906 555 0265", city: "Antipolo", vl: 7, sl: 10, payout: "GCash 0906 ••• 0265", nbi: "2027-02-19", medical: "2026-11-20" },
  { id: "s12", name: "Arnel Bautista", role: "Driver and utility", dept: "Admin", type: "Regular", hired: "2017-05-15", monthly: 18000, manager: "s5", phone: "0919 555 0342", city: "Cainta", vl: 9, sl: 8, payout: "GCash 0919 ••• 0342", nbi: "2027-01-30", medical: "2026-12-20", leaving: "2026-11-13" },
  { id: "s6", name: "Kristine Lim", role: "Worship director", dept: "Worship", type: "Regular", hired: "2019-02-04", monthly: 32000, manager: "s10", phone: "0917 555 0272", city: "Mandaluyong", vl: 10, sl: 12, exempt: true, payout: "Bank transfer ••• 2268", nbi: "2027-04-11", medical: "2027-04-02" },
  { id: "s7", name: "Bea Soriano", role: "Media and livestream", dept: "Worship", type: "Contractual", hired: "2025-01-13", monthly: 14000, manager: "s6", phone: "0919 555 0284", city: "Quezon City", vl: 3, sl: 4, payout: "GCash 0919 ••• 0284", nbi: "2026-10-20", medical: "2027-01-09", contractEnd: "2026-12-31" },
];

const lastName = (name: string) => name.split(" ").slice(-1)[0];
const firstName = (name: string) => name.split(" ")[0];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const typeTone = (t: EmpType): Tone => (t === "Regular" ? "good" : t === "Probationary" ? "warn" : "muted");
const leaveCap = (s: Staff) => (s.type === "Regular" ? 15 : 5);
// Masked sample government numbers; only the last four digits show.
const govNo = (s: Staff, k: number) => `•••• ${1000 + ((Number(s.id.slice(1)) * 7919 + k * 104729) % 9000)}`;

const DOC_KINDS = ["Employment contract", "PSA birth certificate", "Government IDs", "BIR Form 2316 or 1902", "NBI clearance", "Medical certificate", "Child protection policy"];
const EXPIRING = ["NBI clearance", "Medical certificate"];
const requiredDocs = (s: Staff) => DOC_KINDS.filter((k) => k !== "Child protection policy" || s.dept === "Kids" || s.role === "Youth pastor");

const DOCS: Doc[] = STAFF.flatMap((s) =>
  requiredDocs(s).flatMap((kind): Doc[] => {
    const expires = kind === "NBI clearance" ? s.nbi : kind === "Medical certificate" ? s.medical : undefined;
    if (s.missing?.includes(kind) || (EXPIRING.includes(kind) && !expires)) return [];
    const uploaded = expires ? `${Number(expires.slice(0, 4)) - 1}${expires.slice(4)}` : s.hired;
    return [{ id: `${s.id}-${slug(kind)}`, staffId: s.id, kind, file: `${lastName(s.name)}-${slug(kind)}.pdf`, uploaded, expires }];
  }),
);

function docState(doc?: Doc): { tone: Tone; text: string } {
  if (!doc) return { tone: "bad", text: "Missing" };
  if (!doc.expires) return { tone: "muted", text: "On file" };
  const left = daysUntil(doc.expires);
  if (left < 0) return { tone: "bad", text: `Expired ${fmt(doc.expires)}` };
  if (left <= 30) return { tone: "warn", text: `Expires ${fmt(doc.expires)}` };
  return { tone: "good", text: `Valid to ${fmtYear(doc.expires)}` };
}

// ---- Time, overtime, leave ----------------------------------------------------------

type LeaveType = "Vacation" | "Sick" | "Bereavement";
interface Leave { id: string; staffId: string; type: LeaveType; from: string; to: string; days: number; reason: string; filed: string; status: "Pending" | "Approved" | "Declined" }
interface Late { id: string; staffId: string; date: string; minutes: number; note?: string }
type OtKind = "Regular day" | "Rest day";
interface Overtime { id: string; staffId: string; date: string; hours: number; kind: OtKind; reason: string; status: "Pending" | "Approved" | "Declined" }

const LEAVES: Leave[] = [
  { id: "l1", staffId: "s6", type: "Vacation", from: "2026-11-03", to: "2026-11-06", days: 4, reason: "Family trip to Baguio", filed: "2026-10-27", status: "Pending" },
  { id: "l2", staffId: "s8", type: "Sick", from: "2026-10-28", to: "2026-10-28", days: 1, reason: "Fever, medical certificate attached", filed: "2026-10-28", status: "Pending" },
  { id: "l3", staffId: "s4", type: "Vacation", from: "2026-11-16", to: "2026-11-17", days: 2, reason: "Daughter's graduation in Iloilo", filed: "2026-10-29", status: "Pending" },
  { id: "l4", staffId: "s5", type: "Vacation", from: "2026-10-19", to: "2026-10-20", days: 2, reason: "Town fiesta in Batangas", filed: "2026-10-09", status: "Approved" },
  { id: "l5", staffId: "s7", type: "Sick", from: "2026-10-13", to: "2026-10-13", days: 1, reason: "Flu", filed: "2026-10-13", status: "Approved" },
  { id: "l6", staffId: "s3", type: "Vacation", from: "2026-11-02", to: "2026-11-02", days: 1, reason: "All Souls' Day with family in Pampanga", filed: "2026-10-15", status: "Approved" },
  { id: "l7", staffId: "s10", type: "Vacation", from: "2026-11-09", to: "2026-11-13", days: 5, reason: "Sabbath week", filed: "2026-10-05", status: "Approved" },
  { id: "l8", staffId: "s11", type: "Vacation", from: "2026-11-23", to: "2026-11-24", days: 2, reason: "Sister's wedding in Cebu", filed: "2026-10-20", status: "Approved" },
  { id: "l9", staffId: "s1", type: "Vacation", from: "2026-12-28", to: "2026-12-29", days: 2, reason: "Christmas with family in Davao", filed: "2026-10-01", status: "Approved" },
  { id: "l10", staffId: "s9", type: "Bereavement", from: "2026-10-05", to: "2026-10-06", days: 2, reason: "Grandmother's wake in Bulacan", filed: "2026-10-05", status: "Approved" },
  { id: "l11", staffId: "s12", type: "Vacation", from: "2026-10-12", to: "2026-10-12", days: 1, reason: "Driver's license renewal", filed: "2026-10-08", status: "Declined" },
];

const LATES: Late[] = [
  { id: "t1", staffId: "s7", date: "2026-10-19", minutes: 18 },
  { id: "t2", staffId: "s7", date: "2026-10-26", minutes: 25 },
  { id: "t3", staffId: "s7", date: "2026-10-29", minutes: 12 },
  { id: "t4", staffId: "s9", date: "2026-10-27", minutes: 32, note: "Flooding on Commonwealth Ave." },
  { id: "t5", staffId: "s5", date: "2026-10-22", minutes: 15 },
  { id: "t6", staffId: "s12", date: "2026-10-23", minutes: 10 },
  { id: "t7", staffId: "s4", date: "2026-10-29", minutes: 7 },
];
const ABSENT = [{ staffId: "s9", date: "2026-10-23" }, { staffId: "s8", date: "2026-10-28" }];
const OFFICIAL_BUSINESS = [{ staffId: "s11", from: "2026-10-26", to: "2026-10-30", note: "Missions trip, Mindoro" }];

const OVERTIME: Overtime[] = [
  { id: "o1", staffId: "s5", date: "2026-10-24", hours: 5, kind: "Rest day", reason: "Set up for the youth camp send-off", status: "Approved" },
  { id: "o2", staffId: "s8", date: "2026-10-24", hours: 4, kind: "Rest day", reason: "Kids teachers' training", status: "Approved" },
  { id: "o3", staffId: "s4", date: "2026-10-20", hours: 2, kind: "Regular day", reason: "Audit prep for the finance committee", status: "Approved" },
  { id: "o4", staffId: "s12", date: "2026-10-27", hours: 3, kind: "Regular day", reason: "Drove the missions team back from Batangas port", status: "Pending" },
  { id: "o5", staffId: "s5", date: "2026-10-28", hours: 2, kind: "Regular day", reason: "Aircon repair in the fellowship hall", status: "Pending" },
  { id: "o6", staffId: "s7", date: "2026-10-28", hours: 2, kind: "Regular day", reason: "Midweek prayer livestream ran long", status: "Pending" },
  { id: "o7", staffId: "s9", date: "2026-10-17", hours: 3, kind: "Rest day", reason: "Kids church decorating", status: "Declined" },
];

// ---- Expense reimbursements -------------------------------------------------------------
// Staff submit a receipt. Approved claims join the pay run as a non-taxable adjustment.

const EXPENSE_CATEGORIES = ["Transport", "Meals", "Supplies", "Ministry event", "Training"] as const;
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
interface Expense { id: string; staffId: string; category: ExpenseCategory; amount: number; date: string; note: string; receipt: string; status: "Pending" | "Approved" | "Declined"; paidIn?: string }

const EXPENSES: Expense[] = [
  { id: "e1", staffId: "s11", category: "Transport", amount: 3450, date: "2026-10-27", note: "Ferry and van for the Mindoro missions trip", receipt: "Santiago-ferry-tickets.jpg", status: "Pending" },
  { id: "e2", staffId: "s8", category: "Supplies", amount: 1860, date: "2026-10-26", note: "Craft materials for the Kids Christmas Program", receipt: "Pascual-craft-supplies.pdf", status: "Pending" },
  { id: "e3", staffId: "s7", category: "Meals", amount: 640, date: "2026-10-28", note: "Snacks for the livestream volunteers", receipt: "Soriano-snacks.jpg", status: "Pending" },
  { id: "e4", staffId: "s5", category: "Supplies", amount: 1850, date: "2026-10-22", note: "Aircon parts for the fellowship hall", receipt: "Cruz-aircon-parts.pdf", status: "Approved", paidIn: "Oct 16–31" },
  { id: "e5", staffId: "s9", category: "Meals", amount: 380, date: "2026-10-21", note: "Lunch for the kids church volunteers", receipt: "Gonzales-lunch.jpg", status: "Declined" },
];
const expenseAdjustment = (e: Expense) => ({ id: `x${e.id}`, staffId: e.staffId, label: `${e.category} reimbursement`, amount: e.amount });

// ---- Pay math (sample rates) -----------------------------------------------------------
// Sample rates for the demo: SSS 5% employee and 10% employer on a salary credit up to
// ₱35,000, PhilHealth 5% split evenly, Pag-IBIG 2% each on up to ₱10,000, and the BIR
// semi-monthly withholding table. Monthly contributions split across both cutoffs.

const TAX: [number, number, number][] = [[0, 0, 0], [10417, 0, 0.15], [16667, 937.5, 0.2], [33333, 4270.7, 0.25], [83333, 16770.7, 0.3], [333333, 91770.7, 0.35]];
function withholding(taxable: number) {
  const [floor, base, rate] = TAX.filter(([f]) => taxable >= f).pop() ?? TAX[0];
  return Math.round(base + (taxable - floor) * rate);
}

function contributions(monthly: number) {
  const credit = Math.min(Math.max(Math.round(monthly / 500) * 500, 5000), 35000);
  const health = Math.min(Math.max(monthly, 10000), 100000) * 0.05;
  const fund = Math.min(monthly, 10000) * 0.02;
  return {
    sss: Math.round(credit * 0.025),
    sssER: Math.round((credit * 0.1 + (credit < 15000 ? 10 : 30)) / 2),
    ph: Math.round(health / 4),
    phER: Math.round(health / 4),
    pag: Math.round(fund / 2),
    pagER: Math.round(fund / 2),
  };
}

const dailyRate = (monthly: number) => (monthly * 12) / 261;
const otAmount = (o: Overtime, monthly: number) => Math.round(o.hours * (dailyRate(monthly) / 8) * (o.kind === "Rest day" ? 1.3 : 1.25));
const lateAmount = (minutes: number, monthly: number) => Math.round((minutes * dailyRate(monthly)) / 480);

interface Line { staffId: string; basic: number; ot: number; less: number; gross: number; sss: number; ph: number; pag: number; tax: number; adj: number; net: number; sssER: number; phER: number; pagER: number }
function payLine(staffId: string, monthly: number, ot = 0, less = 0, adj = 0): Line {
  const basic = monthly / 2;
  const c = contributions(monthly);
  const gross = basic + ot - less;
  const tax = withholding(gross - c.sss - c.ph - c.pag);
  return { staffId, basic, ot, less, gross, ...c, tax, adj, net: gross - c.sss - c.ph - c.pag - tax + adj };
}
type Amount = Exclude<keyof Line, "staffId">;
const sum = (lines: Line[], k: Amount) => lines.reduce((t, l) => t + l[k], 0);
const employeeShare = (lines: Line[]) => sum(lines, "sss") + sum(lines, "ph") + sum(lines, "pag");

// Past cutoffs are frozen. Extra is overtime (positive) or lates and absences (negative).
interface PastRun { id: string; period: string; short: string; paid: string; extra: Record<string, number>; adj?: Record<string, number> }
const PAST_RUNS: PastRun[] = [
  { id: "aug-a", period: "Aug 1–15", short: "Aug 1", paid: "2026-08-14", extra: { s5: 1300, s12: 900, s9: -280 } },
  { id: "aug-b", period: "Aug 16–31", short: "Aug 16", paid: "2026-08-31", extra: { s7: 1100, s8: -400 } },
  { id: "sep-a", period: "Sep 1–15", short: "Sep 1", paid: "2026-09-15", extra: { s5: 1600, s12: 1250 } },
  { id: "sep-b", period: "Sep 16–30", short: "Sep 16", paid: "2026-09-30", extra: { s7: 900, s9: -300, s5: 650 } },
  { id: "oct-a", period: "Oct 1–15", short: "Oct 1", paid: "2026-10-15", extra: { s5: 1800, s7: 1200, s12: 950, s9: -350 }, adj: { s4: -1500 } },
];
const PAST = PAST_RUNS.map((r) => ({
  ...r,
  lines: STAFF.map((s) => {
    const e = r.extra[s.id] ?? 0;
    return payLine(s.id, s.prevMonthly ?? s.monthly, Math.max(e, 0), Math.max(-e, 0), r.adj?.[s.id] ?? 0);
  }),
}));
const PREV = PAST[PAST.length - 1];
const CUTOFF = { id: "oct-b", period: "Oct 16–31", from: "2026-10-16", to: "2026-10-31", payDate: "2026-10-30" };

const ADJ_KINDS = [{ label: "Rice subsidy", sign: 1 }, { label: "Ministry trip reimbursement", sign: 1 }, { label: "Cash advance repayment", sign: -1 }, { label: "SSS salary loan", sign: -1 }];

// ---- Remittances ---------------------------------------------------------------------

type Agency = "bir" | "philhealth" | "pagibig" | "sss";
const AGENCIES: { id: Agency; name: string; form: string; code: string; due: string; note?: string; idKey: number; ee: (l: Line) => number; er: (l: Line) => number }[] = [
  { id: "bir", name: "BIR withholding tax", form: "1601-C", code: "1601C", due: "2026-11-10", idKey: 4, ee: (l) => l.tax, er: () => 0 },
  { id: "philhealth", name: "PhilHealth", form: "RF-1", code: "PH", due: "2026-11-16", idKey: 2, ee: (l) => l.ph, er: (l) => l.phER },
  { id: "pagibig", name: "Pag-IBIG Fund", form: "MCRF", code: "HDMF", due: "2026-11-19", idKey: 3, ee: (l) => l.pag, er: (l) => l.pagER },
  { id: "sss", name: "SSS", form: "Contribution list", code: "PRN", due: "2026-12-01", note: "Moved from Nov 30, Bonifacio Day", idKey: 1, ee: (l) => l.sss, er: (l) => l.sssER },
];
type AgencyInfo = (typeof AGENCIES)[number];
const remit = (a: AgencyInfo, lines: Line[]) => {
  const ee = lines.reduce((t, l) => t + a.ee(l), 0);
  const er = lines.reduce((t, l) => t + a.er(l), 0);
  return { ee, er, total: ee + er };
};
const FILED = [
  { month: "September", lines: [...PAST[2].lines, ...PAST[3].lines], dates: { bir: "2026-10-09", philhealth: "2026-10-14", pagibig: "2026-10-16", sss: "2026-10-27" } },
  { month: "August", lines: [...PAST[0].lines, ...PAST[1].lines], dates: { bir: "2026-09-10", philhealth: "2026-09-14", pagibig: "2026-09-17", sss: "2026-09-28" } },
];
interface Filing { date: string; ref: string; channel: string }

// ---- Performance, policies, onboarding, volunteers -------------------------------------

const COMPETENCIES = ["Ministry results", "Teamwork", "Reliability", "Character and growth"];
interface Review { staffId: string; kind: "Annual" | "Probation"; due: string; self: "Not started" | "Submitted"; manager: "Not started" | "Draft" | "Submitted"; ratings: Record<string, number>; notes: { text: string; by: string; date: string }[]; outcome?: string }
const rv = (staffId: string, self: Review["self"], manager: Review["manager"], scores: number[] = [], notes: Review["notes"] = [], kind: Review["kind"] = "Annual", due = "2026-11-20"): Review => ({
  staffId, kind, due, self, manager, notes, ratings: Object.fromEntries(scores.map((n, i) => [COMPETENCIES[i], n])),
});
const REVIEWS: Review[] = [
  rv("s10", "Not started", "Not started"),
  rv("s1", "Submitted", "Submitted", [5, 4, 5, 5]),
  rv("s2", "Submitted", "Draft", [5, 4], [{ text: "Youth attendance up from 18 to 31 since June.", by: "Joel Manalo", date: "2026-10-12" }, { text: "Ready to lead the youth camp in December.", by: "Joel Manalo", date: "2026-10-26" }], "Probation", "2026-11-15"),
  rv("s11", "Submitted", "Not started"),
  rv("s8", "Submitted", "Draft", [4, 5, 4], [{ text: "Handled a parent concern on Oct 4 with patience and clear follow-up.", by: "Joel Manalo", date: "2026-10-05" }]),
  rv("s9", "Not started", "Not started", [], [], "Probation", "2027-01-02"),
  rv("s3", "Submitted", "Submitted", [5, 5, 5, 4]),
  rv("s4", "Submitted", "Not started"),
  rv("s5", "Not started", "Not started"),
  rv("s6", "Submitted", "Submitted", [4, 4, 5, 4]),
  rv("s7", "Submitted", "Not started", [], [{ text: "Contract ends Dec 31. Decide on renewal in this review.", by: "Kristine Lim", date: "2026-10-20" }]),
];
interface Goal { id: string; staffId: string; title: string; due: string; progress: number }
const GOALS: Goal[] = [
  { id: "g1", staffId: "s2", title: "Launch a Friday youth Bible study in Fairview", due: "2026-11-30", progress: 60 },
  { id: "g2", staffId: "s2", title: "Recruit six new youth leaders", due: "2026-12-31", progress: 50 },
  { id: "g3", staffId: "s8", title: "Child protection training for all kids volunteers", due: "2026-11-30", progress: 70 },
  { id: "g4", staffId: "s8", title: "Run the Kids Christmas Program", due: "2026-12-14", progress: 40 },
  { id: "g5", staffId: "s6", title: "Train two new worship leaders", due: "2026-12-31", progress: 50 },
  { id: "g6", staffId: "s4", title: "Close the books by the 5th of each month", due: "2026-12-31", progress: 80 },
  { id: "g7", staffId: "s3", title: "Digitize every 201 file", due: "2026-11-30", progress: 90 },
  { id: "g8", staffId: "s7", title: "Keep livestream uptime above 99%", due: "2026-12-31", progress: 90 },
  { id: "g9", staffId: "s11", title: "Send two short-term mission teams", due: "2026-12-31", progress: 50 },
  { id: "g10", staffId: "s5", title: "Preventive maintenance plan for all aircon units", due: "2026-11-30", progress: 70 },
  { id: "g11", staffId: "s9", title: "Teach a kids church class on her own", due: "2026-12-31", progress: 30 },
  { id: "g12", staffId: "s1", title: "Start three new life groups in Quezon City", due: "2026-12-31", progress: 60 },
  { id: "g13", staffId: "s10", title: "Elders' succession plan", due: "2027-03-31", progress: 40 },
];

type PostKind = "Policy" | "Announcement";
interface Post { id: string; title: string; kind: PostKind; posted: string; audience: "All staff" | Dept; required: boolean; body: string; acks: string[] }
const allBut = (...ids: string[]) => STAFF.map((s) => s.id).filter((id) => !ids.includes(id));
const POSTS: Post[] = [
  { id: "p1", title: "Child protection policy, 2026 revision", kind: "Policy", posted: "2026-10-19", audience: "All staff", required: true, acks: ["s10", "s1", "s2", "s8", "s9", "s3", "s6", "s4"], body: "Two adults in every kids room at all times. No private messages to minors. Report any concern to the safeguarding lead within 24 hours. This applies to staff and volunteers." },
  { id: "p2", title: "Typhoon and flooding work arrangements", kind: "Policy", posted: "2026-10-05", audience: "All staff", required: true, acks: allBut("s7", "s12"), body: "When Signal No. 2 or higher is raised over Metro Manila, the office closes and staff work from home. Lates on heavy-flood days can be excused by your manager." },
  { id: "p3", title: "13th month pay goes out Dec 15", kind: "Announcement", posted: "2026-10-26", audience: "All staff", required: false, acks: ["s10", "s1", "s3", "s4", "s6", "s8"], body: "13th month pay is released with the Dec 1–15 cutoff. Your amount shows on your payslip in the staff app." },
  { id: "p4", title: "Data privacy notice for staff records", kind: "Policy", posted: "2026-08-03", audience: "All staff", required: true, acks: allBut(), body: "Your 201 file is kept under the Data Privacy Act of 2012. Only HR and your manager can open it. Ask Tess for a copy anytime." },
  { id: "p5", title: "Staff Christmas party, Dec 18", kind: "Announcement", posted: "2026-10-28", audience: "All staff", required: false, acks: ["s3", "s6", "s7", "s2"], body: "Fellowship hall, 6 PM. Bring a gift worth ₱500 for the exchange. Families are welcome." },
  { id: "p6", title: "Kids ministry room ratios", kind: "Policy", posted: "2026-09-21", audience: "Kids", required: true, acks: ["s8"], body: "One adult for every six children under five, and one for every ten older kids. Check ratios before the doors open." },
  { id: "p7", title: "Code of conduct", kind: "Policy", posted: "2026-01-12", audience: "All staff", required: true, acks: allBut("s9"), body: "Serve with integrity, keep confidences, and settle conflicts face to face. Gifts above ₱2,000 from members are declared to the senior pastor." },
];

interface Hire { id: string; name: string; role: string; dept: Dept; start: string }
const HIRES: Hire[] = [
  { id: "h1", name: "Carla Domingo", role: "Receptionist", dept: "Admin", start: "2026-11-03" },
  { id: "h2", name: "Paul Espiritu", role: "Sound technician", dept: "Worship", start: "2026-11-16" },
];
const TASKS = [
  { id: "t1", label: "Job offer and contract signed", phase: "Before day one", owner: "Tess" },
  { id: "t2", label: "NBI clearance and PSA birth certificate", phase: "Before day one", owner: "New hire" },
  { id: "t3", label: "SSS, PhilHealth, Pag-IBIG, and TIN numbers", phase: "Before day one", owner: "New hire" },
  { id: "t4", label: "BIR Form 2316 from previous employer", phase: "Before day one", owner: "New hire" },
  { id: "t5", label: "Payroll account set up", phase: "Before day one", owner: "Ramon" },
  { id: "t6", label: "Church email and staff app access", phase: "Before day one", owner: "Bea" },
  { id: "t7", label: "Orientation with Pastor Dan", phase: "First week", owner: "Pastor Dan" },
  { id: "t8", label: "Child protection policy and code of conduct signed", phase: "First week", owner: "New hire" },
  { id: "t9", label: "Office keys and ID card", phase: "First week", owner: "Noel" },
  { id: "t10", label: "Introduced at staff devotion", phase: "First week", owner: "Tess" },
];
const EXIT_TASKS = [
  { id: "x1", label: "Resignation letter received", owner: "Tess" },
  { id: "x2", label: "Errands and vehicle schedule turned over", owner: "Noel" },
  { id: "x3", label: "Exit interview", owner: "Tess" },
  { id: "x4", label: "Vehicle keys, gas card, and ID returned", owner: "Noel" },
  { id: "x5", label: "Clearance signed by finance and facilities", owner: "Ramon" },
  { id: "x6", label: "Final pay approved", owner: "Ramon" },
  { id: "x7", label: "Certificate of employment issued", owner: "Tess" },
  { id: "x8", label: "BIR Form 2316 issued", owner: "Ramon" },
];

interface Volunteer { id: string; name: string; ministry: string; trained: boolean; check: "Cleared" | "Pending" | "Not started" | "Expired" | "Not required"; expires?: string }
const VOLUNTEERS: Volunteer[] = [
  { id: "v1", name: "Rina Navarro", ministry: "Kids church", trained: true, check: "Cleared", expires: "2027-03-10" },
  { id: "v2", name: "Joy Dela Cruz", ministry: "Kids church", trained: false, check: "Pending" },
  { id: "v3", name: "Liza Mendoza", ministry: "Kids church", trained: false, check: "Not started" },
  { id: "v4", name: "Hazel Ramos", ministry: "Kids church", trained: true, check: "Pending" },
  { id: "v5", name: "Nina Castro", ministry: "Kids church", trained: true, check: "Cleared", expires: "2026-11-20" },
  { id: "v6", name: "Mark Santos", ministry: "Youth", trained: true, check: "Cleared", expires: "2027-01-22" },
  { id: "v7", name: "Cathy Lopez", ministry: "Youth", trained: true, check: "Expired", expires: "2026-10-02" },
  { id: "v8", name: "Miguel Torres", ministry: "Youth", trained: true, check: "Cleared", expires: "2027-06-01" },
  { id: "v9", name: "Grace Villanueva", ministry: "Welcome team", trained: true, check: "Not required" },
  { id: "v10", name: "Paolo Garcia", ministry: "Livestream", trained: false, check: "Not required" },
  { id: "v11", name: "Ben Ramos", ministry: "Ushers", trained: true, check: "Not required" },
  { id: "v12", name: "Leo Fernandez", ministry: "Welcome team", trained: false, check: "Not required" },
];
const withKids = (v: Volunteer) => v.ministry === "Kids church" || v.ministry === "Youth";
const isReady = (v: Volunteer) => v.trained && (v.check === "Cleared" || v.check === "Not required");
const checkTone = (c: Volunteer["check"]): Tone => (c === "Cleared" ? "good" : c === "Pending" ? "warn" : c === "Not required" ? "muted" : "bad");

// ---- Small pieces -----------------------------------------------------------------------

function Rows({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col divide-y divide-rule-soft -my-1">{children}</ul>;
}

function Row({ name, title, sub, onClick, children }: { name?: string; title: React.ReactNode; sub?: React.ReactNode; onClick?: () => void; children?: React.ReactNode }) {
  const text = (
    <span className="block flex-1 min-w-0">
      <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{title}</span>
      {sub && <span className="block text-[0.68rem] text-mist truncate">{sub}</span>}
    </span>
  );
  return (
    <li className="flex flex-wrap items-center gap-2.5 py-2">
      {name && <Avatar name={name} size={28} />}
      {onClick ? (
        <button type="button" onClick={onClick} className="group flex flex-1 min-w-[8rem] text-left cursor-pointer">
          {text}
        </button>
      ) : (
        <span className="flex flex-1 min-w-[8rem]">{text}</span>
      )}
      {children}
    </li>
  );
}

function PayLine({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <li className={cn("flex justify-between gap-3 py-1.5 text-[0.8rem]", strong ? "border-t border-rule mt-1 pt-2.5 text-ink font-semibold" : muted ? "text-mist" : "text-ink-soft")}>
      <span>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </li>
  );
}

function CheckItem({ on, label, meta, onToggle }: { on: boolean; label: string; meta: string; onToggle: () => void }) {
  return (
    <li>
      <button type="button" aria-pressed={on} onClick={onToggle} className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer group">
        <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors", on ? "bg-gold border-gold text-sheet" : "border-mist group-hover:border-gold")}>{on && <Check size={11} strokeWidth={3} />}</span>
        <span className={cn("flex-1 text-[0.8rem]", on ? "text-graphite line-through" : "text-ink")}>{label}</span>
        <span className="text-[0.68rem] text-mist shrink-0">{meta}</span>
      </button>
    </li>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
      <Search size={14} className="text-mist" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
    </label>
  );
}

const mono = (n: number) => <span className="font-mono tabular-nums">{peso(n)}</span>;

// Org chart: each person with their direct reports nested underneath.
function OrgNode({ person, staff, onOpen }: { person: Staff; staff: Staff[]; onOpen: (s: Staff) => void }) {
  const reports = staff.filter((s) => s.manager === person.id);
  return (
    <div>
      <button type="button" onClick={() => onOpen(person)} className="w-full flex items-center gap-2 p-2 rounded-lg border border-rule bg-sheet hover:border-mist text-left cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <Avatar name={person.name} size={26} />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.78rem] font-medium text-ink truncate">{person.name}</span>
          <span className="block text-[0.66rem] text-mist truncate">{person.role}</span>
        </span>
        {reports.length > 0 && <span className="text-[0.64rem] text-mist">{reports.length}</span>}
      </button>
      {reports.length > 0 && (
        <div className="ml-3 pl-3 border-l border-rule flex flex-col gap-1.5 pt-1.5">
          {reports.map((r) => (
            <OrgNode key={r.id} person={r} staff={staff} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

type CalItem = { key: string; label: string; tone: "holiday" | "approved" | "pending" };
function MonthGrid({ month, items }: { month: string; items: (iso: string) => CalItem[] }) {
  const first = `${month}-01`;
  const length = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const cells: (string | null)[] = [...Array.from({ length: weekday(first) }, () => null), ...Array.from({ length }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  const chip = { holiday: "bg-danger-wash text-danger", approved: "bg-gold-wash text-gold", pending: "bg-warn/10 text-warn" };
  return (
    <div className="bg-sheet border border-rule rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-rule bg-paper">
        {WEEKDAYS.map((d) => (
          <span key={d} className="px-1.5 py-1.5 text-[0.66rem] font-medium text-mist">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} className="min-h-[4.25rem] border-b border-r border-rule-soft bg-paper" />;
          const list = items(iso);
          return (
            <div key={iso} className={cn("min-h-[4.25rem] p-1 border-b border-r border-rule-soft flex flex-col gap-0.5 min-w-0", weekday(iso) % 6 === 0 && "bg-paper", iso === TODAY && "bg-gold-wash")}>
              <span className={cn("text-[0.66rem] tabular-nums", iso === TODAY ? "text-gold font-semibold" : "text-mist")}>{Number(iso.slice(8))}</span>
              {list.slice(0, 3).map((it) => (
                <span key={it.key} className={cn("truncate rounded px-1 text-[0.6rem] leading-[1.1rem]", chip[it.tone])}>{it.label}</span>
              ))}
              {list.length > 3 && <span className="text-[0.6rem] text-mist">{`+${list.length - 3} more`}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- App ---------------------------------------------------------------------------------

type Modal = "upload" | "leave" | "approve" | "adjust" | "salary" | "ot" | "expense" | "filing" | "hire" | "goal" | "post";
interface DayInfo { label: string; tone: Tone; inAt: number; outAt: number; ot: number; late?: Late; present: boolean; absent: boolean }

export function ChurchHRISPrototype() {
  const app = useProtoApp("dashboard");
  const [staff, setStaff] = useState(STAFF);
  const [docs, setDocs] = useState(DOCS);
  const [leaves, setLeaves] = useState(LEAVES);
  const [ots, setOts] = useState(OVERTIME);
  const [excused, setExcused] = useState<string[]>([]);
  const [expenses, setExpenses] = useState(EXPENSES);
  const [adjustments, setAdjustments] = useState([{ id: "a1", staffId: "s5", label: "Rice subsidy", amount: 1000 }, ...EXPENSES.filter((e) => e.status === "Approved" && e.paidIn === CUTOFF.period).map(expenseAdjustment)]);
  const [run, setRun] = useState<"Draft" | "Approved" | "Paid">("Draft");
  const [frozen, setFrozen] = useState<Line[] | null>(null);
  const [thirteenthSet, setThirteenthSet] = useState(false);
  const [filings, setFilings] = useState<Partial<Record<Agency, Filing>>>({});
  const [reviews, setReviews] = useState(REVIEWS);
  const [goals, setGoals] = useState(GOALS);
  const [posts, setPosts] = useState(POSTS);
  const [hires, setHires] = useState(HIRES);
  const [done, setDone] = useState<Record<string, string[]>>({ h1: ["t1", "t2", "t3", "t5", "t6"], h2: ["t1"] });
  const [exitDone, setExitDone] = useState(["x1", "x2"]);
  const [volunteers, setVolunteers] = useState(VOLUNTEERS);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState<"All" | Dept>("All");
  const [dirView, setDirView] = useState<"list" | "org">("list");
  const [profileTab, setProfileTab] = useState<"job" | "docs" | "pay" | "leave">("job");
  const [timeView, setTimeView] = useState<"today" | "overtime" | "summary">("today");
  const [leaveView, setLeaveView] = useState<"requests" | "calendar" | "balances">("requests");
  const [calMonth, setCalMonth] = useState<"2026-10" | "2026-11" | "2026-12">("2026-11");
  const [payView, setPayView] = useState<"run" | "variance" | "thirteenth" | "history">("run");
  const [reviewView, setReviewView] = useState<"all" | "probation" | "open">("all");
  const [peopleView, setPeopleView] = useState<"hires" | "exits" | "volunteers">("hires");
  const [volView, setVolView] = useState<"all" | "kids" | "hold">("all");
  const [hire, setHire] = useState("h1");
  const [modal, setModal] = useState<Modal | null>(null);

  const [upload, setUpload] = useState({ kind: DOC_KINDS[0], file: "", expires: "2027-10-29" });
  const [leaveDraft, setLeaveDraft] = useState({ staffId: "s1", type: "Vacation" as LeaveType, from: "2026-11-09", to: "2026-11-10", reason: "" });
  const [adjDraft, setAdjDraft] = useState({ staffId: "s1", kind: ADJ_KINDS[0].label, amount: "1500" });
  const [salaryDraft, setSalaryDraft] = useState("");
  const [otDraft, setOtDraft] = useState({ staffId: "s5", date: TODAY, hours: "2", kind: "Regular day" as OtKind, reason: "" });
  const [expDraft, setExpDraft] = useState({ staffId: "s11", category: "Transport" as ExpenseCategory, amount: "", date: TODAY, note: "", file: "" });
  const [filingDraft, setFilingDraft] = useState({ agency: "bir" as Agency, ref: "", channel: "Online banking", date: TODAY });
  const [hireDraft, setHireDraft] = useState({ name: "", role: "", dept: "Admin" as Dept, start: "2026-11-23" });
  const [goalDraft, setGoalDraft] = useState({ title: "", due: "2026-12-31" });
  const [postDraft, setPostDraft] = useState({ title: "", body: "", kind: "Announcement" as PostKind, audience: "All staff" as Post["audience"], required: true });
  const [noteDraft, setNoteDraft] = useState("");

  const close = () => setModal(null);
  const byId = (id?: string) => staff.find((s) => s.id === id);
  const nameOf = (id?: string) => byId(id)?.name ?? "";
  const locked = run !== "Draft";

  // ---- Time and attendance
  const dayInfo = (s: Staff, iso: string): DayInfo => {
    const ot = ots.filter((o) => o.staffId === s.id && o.date === iso && o.status === "Approved").reduce((t, o) => t + o.hours, 0);
    const make = (label: string, tone: Tone, extra: Partial<DayInfo> = {}): DayInfo => ({ label, tone, inAt: 0, outAt: 0, ot, present: false, absent: false, ...extra });
    const seed = (Number(s.id.slice(1)) * 7 + dayNo(iso)) % 17;
    if (!isWorkday(iso)) return ot ? make("Rest day work", "muted", { inAt: 480, outAt: 480 + ot * 60 + (ot > 4 ? 60 : 0), present: true }) : make(holidayOn(iso)?.name ?? "Rest day", "muted");
    if (iso > TODAY) return make("Scheduled", "muted");
    const leave = leaves.find((l) => l.staffId === s.id && l.status !== "Declined" && inRange(iso, l.from, l.to));
    if (leave) return make(leave.status === "Approved" ? `${leave.type} leave` : "Leave pending", leave.status === "Approved" ? "muted" : "warn");
    if (OFFICIAL_BUSINESS.some((o) => o.staffId === s.id && inRange(iso, o.from, o.to))) return make("Official business", "muted", { present: true });
    if (ABSENT.some((a) => a.staffId === s.id && a.date === iso)) return make("Absent", "bad", { absent: true });
    const late = LATES.find((l) => l.staffId === s.id && l.date === iso);
    const ok = !late || excused.includes(late.id);
    return make(late ? (ok ? "Late, excused" : `Late ${late.minutes} min`) : "On time", ok ? "good" : "warn", {
      late,
      present: true,
      inAt: late ? 480 + late.minutes : 460 + seed,
      outAt: iso === TODAY ? 0 : 1020 + (seed % 9) + ot * 60,
    });
  };
  const cutoffDays = workdays(CUTOFF.from, TODAY);
  const timeOf = (s: Staff) => {
    const days = cutoffDays.map((d) => dayInfo(s, d));
    const lates = days.flatMap((d) => (d.late && !excused.includes(d.late.id) ? [d.late] : []));
    const absences = days.filter((d) => d.absent).length;
    const approved = ots.filter((o) => o.staffId === s.id && o.status === "Approved" && inRange(o.date, CUTOFF.from, CUTOFF.to));
    return {
      present: days.filter((d) => d.present).length,
      lateMin: lates.reduce((t, l) => t + l.minutes, 0),
      absences,
      otHours: approved.reduce((t, o) => t + o.hours, 0),
      otPay: approved.reduce((t, o) => t + otAmount(o, s.monthly), 0),
      less: lates.reduce((t, l) => t + lateAmount(l.minutes, s.monthly), 0) + absences * Math.round(dailyRate(s.monthly)),
    };
  };

  // ---- Payroll: the live run until approval, then frozen
  const liveLines = staff.map((s) => {
    const t = timeOf(s);
    return payLine(s.id, s.monthly, t.otPay, t.less, adjustments.filter((a) => a.staffId === s.id).reduce((n, a) => n + a.amount, 0));
  });
  const lines = frozen ?? liveLines;
  const lineFor = (list: Line[], id?: string) => list.find((l) => l.staffId === id);
  const runFor = (id?: string) => (id === CUTOFF.id ? { id: CUTOFF.id, period: CUTOFF.period, paid: CUTOFF.payDate, lines } : PAST.find((r) => r.id === id));
  const variance = lines.map((l) => {
    const p = lineFor(PREV.lines, l.staffId);
    const change = l.net - (p?.net ?? 0);
    const share = p?.net ? (change / p.net) * 100 : 0;
    const reasons = !p ? ["new this cutoff"] : [
      l.basic !== p.basic && "salary change",
      l.ot !== p.ot && (l.ot > p.ot ? "more overtime" : "less overtime"),
      l.less !== p.less && (l.less > p.less ? "more lates or absences" : "fewer lates or absences"),
      l.adj !== p.adj && "adjustments",
    ].filter((r): r is string => Boolean(r));
    const why = reasons.join(", ").replace(/^./, (c) => c.toUpperCase());
    return { l, p, change, share, flagged: Math.abs(share) > 5, reasons, why };
  });
  const flagged = variance.filter((v) => v.flagged);
  const netChange = sum(lines, "net") - sum(PREV.lines, "net");
  const pendingOtCutoff = ots.filter((o) => o.status === "Pending" && inRange(o.date, CUTOFF.from, CUTOFF.to));
  const absentDays = staff.reduce((t, s) => t + timeOf(s).absences, 0);

  const thirteenth = staff.map((s) => {
    const start = s.hired < "2026-01-01" ? 0 : Number(s.hired.slice(5, 7)) - 1 + (Number(s.hired.slice(8, 10)) >= 16 ? 0.5 : 0);
    const raise = s.prevMonthly ? (s.monthly - s.prevMonthly) * Math.max(0, 9.5 - start) : 0;
    const earned = (10 - start) * s.monthly - raise;
    const lastDays = s.leaving ? workdays("2026-11-01", s.leaving).length : 0;
    const year = s.leaving ? earned + Math.round(lastDays * dailyRate(s.monthly)) : (12 - start) * s.monthly - raise;
    return { s, months: s.leaving ? 10 + lastDays / 21.75 : 12 - start, earned, accrued: Math.round(earned / 12), amount: Math.round(year / 12) };
  });

  // Final pay for the staff member leaving: salary to the last day, prorated 13th month,
  // unused vacation leave converted at the daily rate, less contributions and balances.
  const leaver = staff.find((s) => s.leaving);
  const finalPay = leaver?.leaving
    ? (() => {
        const daily = dailyRate(leaver.monthly);
        const days = workdays("2026-11-01", leaver.leaving).length;
        const c = contributions(leaver.monthly);
        const items: [string, number][] = [
          [`Salary, Nov 1–${Number(leaver.leaving.slice(8))} (${days} days)`, Math.round(days * daily)],
          ["13th month, prorated", thirteenth.find((t) => t.s.id === leaver.id)?.amount ?? 0],
          [`Unused vacation leave, ${leaver.vl} days`, Math.round(leaver.vl * daily)],
          ["SSS, PhilHealth, Pag-IBIG", -(c.sss + c.ph + c.pag)],
          ["Cash advance balance", -2000],
        ];
        return { items, total: items.reduce((t, [, n]) => t + n, 0) };
      })()
    : null;

  // ---- 201 file alerts
  const docsOf = (id: string) => docs.filter((d) => d.staffId === id);
  const docAlerts = staff.flatMap((s) =>
    requiredDocs(s).flatMap((kind) => {
      const doc = docs.find((d) => d.staffId === s.id && d.kind === kind);
      const st = docState(doc);
      return st.tone === "bad" || st.tone === "warn" ? [{ staff: s, kind, expires: doc?.expires, ...st }] : [];
    }),
  );
  const alertsFor = (id: string) => docAlerts.filter((a) => a.staff.id === id);

  const pendingLeave = leaves.filter((l) => l.status === "Pending");
  const pendingOt = ots.filter((o) => o.status === "Pending");
  const pendingExp = expenses.filter((e) => e.status === "Pending");
  const octLines = [...PREV.lines, ...lines];
  const unfiled = AGENCIES.filter((a) => !filings[a.id]);
  const reviewOf = (id?: string) => reviews.find((r) => r.staffId === id);
  const avgRating = (r: Review) => {
    const v = Object.values(r.ratings);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const recipients = (p: Post) => staff.filter((s) => p.audience === "All staff" || s.dept === p.audience);

  // ---- Actions
  const openProfile = (s: Staff, tab: typeof profileTab = "job") => {
    setProfileTab(tab);
    app.open("profile", s.id, s.name);
  };
  const openLeave = (staffId: string) => {
    setLeaveDraft({ staffId, type: "Vacation", from: "2026-11-09", to: "2026-11-10", reason: "" });
    setModal("leave");
  };
  const openUpload = (kind: string) => {
    setUpload({ kind, file: "", expires: "2027-10-29" });
    setModal("upload");
  };
  const openFiling = (a: AgencyInfo) => {
    setFilingDraft({ agency: a.id, ref: `${a.code}-2610-${String(4100 + AGENCIES.indexOf(a) * 137)}`, channel: "Online banking", date: TODAY });
    setModal("filing");
  };
  const openOt = (staffId: string) => {
    setOtDraft({ staffId, date: TODAY, hours: "2", kind: "Regular day", reason: "" });
    setModal("ot");
  };
  const openExpense = () => {
    setExpDraft({ staffId: "s11", category: "Transport", amount: "", date: TODAY, note: "", file: "" });
    setModal("expense");
  };

  const draftStaff = byId(leaveDraft.staffId);
  const draftDays = workdays(leaveDraft.from, leaveDraft.to);
  const draftHolidays = HOLIDAYS.filter((h) => inRange(h.date, leaveDraft.from, leaveDraft.to) && weekday(h.date) % 6 !== 0);
  const draftLeft = !draftStaff ? 0 : leaveDraft.type === "Vacation" ? draftStaff.vl : leaveDraft.type === "Sick" ? draftStaff.sl : 3;
  const fileLeave = () => {
    if (!draftStaff || !draftDays.length || draftDays.length > draftLeft) return;
    setLeaves((list) => [{ id: `l${Date.now()}`, ...leaveDraft, reason: leaveDraft.reason.trim() || "No reason given", days: draftDays.length, filed: TODAY, status: "Pending" }, ...list]);
    setLeaveView("requests");
    close();
    app.notify(`${leaveDraft.type} leave for ${draftStaff.name} filed. Waiting for approval.`);
  };
  const decideLeave = (l: Leave, status: "Approved" | "Declined") => {
    const s = byId(l.staffId);
    if (!s) return;
    const key = l.type === "Vacation" ? "vl" : l.type === "Sick" ? "sl" : null;
    if (status === "Approved" && key && s[key] < l.days) return app.notify(`${firstName(s.name)} has only ${s[key]} ${l.type.toLowerCase()} days left`);
    setLeaves((list) => list.map((x) => (x.id === l.id ? { ...x, status } : x)));
    if (status === "Approved" && key) setStaff((list) => list.map((x) => (x.id === s.id ? { ...x, [key]: x[key] - l.days } : x)));
    app.notify(status === "Approved" ? `Approved. ${firstName(s.name)} was notified in the staff app.` : `Declined. ${firstName(s.name)} was notified in the staff app.`);
  };
  const decideOt = (o: Overtime, status: "Approved" | "Declined") => {
    setOts((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const s = byId(o.staffId);
    if (status === "Declined") return app.notify(`Overtime for ${nameOf(o.staffId)} declined`);
    app.notify(locked ? `Approved. ${peso(s ? otAmount(o, s.monthly) : 0)} goes to the Nov 1–15 cutoff.` : `Approved. ${peso(s ? otAmount(o, s.monthly) : 0)} added to the Oct 16–31 pay run.`);
  };
  const fileOt = () => {
    const hours = Number(otDraft.hours);
    if (!hours || !otDraft.reason.trim() || !validDate(otDraft.date)) return;
    setOts((list) => [{ id: `o${Date.now()}`, staffId: otDraft.staffId, date: otDraft.date, hours, kind: otDraft.kind, reason: otDraft.reason.trim(), status: "Pending" }, ...list]);
    setTimeView("overtime");
    close();
    app.notify(`Overtime request for ${nameOf(otDraft.staffId)} filed`);
  };
  const fileExpense = () => {
    const amount = Number(expDraft.amount);
    const s = byId(expDraft.staffId);
    if (!s || !amount || !expDraft.note.trim() || !validDate(expDraft.date)) return;
    setExpenses((list) => [{ id: `e${Date.now()}`, staffId: s.id, category: expDraft.category, amount, date: expDraft.date, note: expDraft.note.trim(), receipt: expDraft.file || `${lastName(s.name)}-receipt.jpg`, status: "Pending" }, ...list]);
    close();
    app.notify(`${peso(amount)} expense for ${s.name} filed. Waiting for approval.`);
  };
  const decideExpense = (e: Expense, status: "Approved" | "Declined") => {
    const s = byId(e.staffId);
    if (!s) return;
    setExpenses((list) => list.map((x) => (x.id === e.id ? { ...x, status, paidIn: status === "Approved" ? (locked ? "Nov 1–15" : CUTOFF.period) : undefined } : x)));
    if (status === "Declined") return app.notify(`Expense declined. ${firstName(s.name)} was notified in the staff app.`);
    if (!locked) setAdjustments((list) => [...list, expenseAdjustment(e)]);
    app.notify(locked ? `Approved. ${peso(e.amount)} goes to the Nov 1–15 cutoff.` : `Approved. ${peso(e.amount)} added to the Oct 16–31 pay run.`);
  };
  const excuse = (late: Late) => {
    setExcused((list) => [...list, late.id]);
    app.notify(locked ? `Late on ${fmt(late.date)} excused. Refund goes to the next cutoff.` : `Late on ${fmt(late.date)} excused. Deduction removed.`);
  };
  const addAdjustment = () => {
    const amount = Number(adjDraft.amount);
    const kind = ADJ_KINDS.find((k) => k.label === adjDraft.kind) ?? ADJ_KINDS[0];
    if (!amount || locked) return;
    setAdjustments((list) => [...list, { id: `a${Date.now()}`, staffId: adjDraft.staffId, label: kind.label, amount: amount * kind.sign }]);
    close();
    app.notify(`${kind.label} of ${peso(amount)} added for ${nameOf(adjDraft.staffId)}`);
  };
  const approveRun = () => {
    setFrozen(liveLines);
    setRun("Approved");
    close();
    app.notify(`Pay run approved. ${peso(sum(liveLines, "net"))} ready for release on Oct 30.`);
  };
  const changeSalary = (s: Staff) => {
    const monthly = Math.round(Number(salaryDraft) / 100) * 100;
    if (!monthly) return;
    setStaff((list) => list.map((x) => (x.id === s.id ? { ...x, monthly, prevMonthly: x.prevMonthly ?? x.monthly } : x)));
    close();
    app.notify(locked ? `Salary updated to ${peso(monthly)}. Applies from the Nov 1–15 cutoff.` : `Salary updated to ${peso(monthly)}. Pay run recalculated.`);
  };
  const uploadDoc = (s: Staff) => {
    const file = upload.file || `${lastName(s.name)}-${slug(upload.kind)}.pdf`;
    setDocs((list) => [{ id: `d${Date.now()}`, staffId: s.id, kind: upload.kind, file, uploaded: TODAY, expires: EXPIRING.includes(upload.kind) ? upload.expires : undefined }, ...list.filter((d) => !(d.staffId === s.id && d.kind === upload.kind))]);
    close();
    app.notify(`${upload.kind} saved to ${firstName(s.name)}'s 201 file`);
  };
  const saveFiling = () => {
    const a = AGENCIES.find((x) => x.id === filingDraft.agency);
    if (!a || !filingDraft.ref.trim() || !validDate(filingDraft.date)) return;
    setFilings((f) => ({ ...f, [a.id]: { date: filingDraft.date, ref: filingDraft.ref.trim(), channel: filingDraft.channel } }));
    close();
    app.notify(`${a.name} for October marked filed. ${peso(remit(a, octLines).total)} paid.`);
  };
  const addHire = () => {
    if (!hireDraft.name.trim() || !hireDraft.role.trim() || !validDate(hireDraft.start)) return;
    const id = `h${Date.now()}`;
    setHires((list) => [...list, { id, name: hireDraft.name.trim(), role: hireDraft.role.trim(), dept: hireDraft.dept, start: hireDraft.start }]);
    setDone((d) => ({ ...d, [id]: [] }));
    setHire(id);
    setPeopleView("hires");
    setHireDraft({ name: "", role: "", dept: "Admin", start: "2026-11-23" });
    close();
    app.notify(`${hireDraft.name.trim()} added. ${TASKS.length}-step checklist created.`);
    if (app.screen !== "onboarding") app.section("onboarding");
  };
  const toggleTask = (taskId: string) => {
    const current = done[hire] ?? [];
    const next = current.includes(taskId) ? current.filter((t) => t !== taskId) : [...current, taskId];
    setDone((d) => ({ ...d, [hire]: next }));
    if (next.length === TASKS.length) app.notify(`${hires.find((h) => h.id === hire)?.name ?? "New hire"} is ready for day one`);
  };
  const toggleExit = (id: string, message?: string) => {
    setExitDone((list) => (list.includes(id) ? (message ? list : list.filter((x) => x !== id)) : [...list, id]));
    if (message) app.notify(message);
  };
  const updateReview = (staffId: string, change: Partial<Review>) => setReviews((list) => list.map((r) => (r.staffId === staffId ? { ...r, ...change } : r)));
  const updateVolunteer = (v: Volunteer, change: Partial<Volunteer>, message: string) => {
    setVolunteers((list) => list.map((x) => (x.id === v.id ? { ...x, ...change } : x)));
    app.notify(message);
  };
  const publish = () => {
    if (!postDraft.title.trim() || !postDraft.body.trim()) return;
    const post: Post = { id: `p${Date.now()}`, title: postDraft.title.trim(), body: postDraft.body.trim(), kind: postDraft.kind, audience: postDraft.audience, required: postDraft.required, posted: TODAY, acks: [] };
    setPosts((list) => [post, ...list]);
    setPostDraft({ title: "", body: "", kind: "Announcement", audience: "All staff", required: true });
    close();
    app.notify(`Posted to ${recipients(post).length} staff${post.required ? ". Acknowledgment required." : ""}`);
  };

  const nav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "directory", label: "Staff", icon: Users, badge: staff.length },
    { id: "time", label: "Time", icon: Clock, badge: pendingOt.length || undefined },
    { id: "leave", label: "Leave", icon: CalendarDays, badge: pendingLeave.length || undefined },
    { id: "expenses", label: "Expenses", icon: Receipt, badge: pendingExp.length || undefined },
    { id: "payroll", label: "Payroll", icon: Wallet },
    { id: "remittances", label: "Remittances", icon: Landmark, badge: unfiled.length || undefined },
    { id: "performance", label: "Reviews", icon: Target },
    { id: "policies", label: "Policies", icon: Megaphone },
    { id: "onboarding", label: "Onboarding", icon: ListChecks },
  ];

  // Record lookups for detail screens.
  const sp = app.screen === "profile" || app.screen === "dtr" ? byId(app.id) : undefined;
  const [slipStaffId, slipRunId] = (app.id ?? "").split("|");
  const slipRun = app.screen === "payslip" ? runFor(slipRunId) : app.screen === "run" ? runFor(app.id) : undefined;
  const slip = slipRun && lineFor(slipRun.lines, slipStaffId);
  const slipStaff = byId(slipStaffId);
  const ag = app.screen === "remit" ? AGENCIES.find((a) => a.id === app.id) : undefined;
  const rs = app.screen === "review" ? byId(app.id) : undefined;
  const review = reviewOf(rs?.id);
  const post = app.screen === "policy" ? posts.find((p) => p.id === app.id) : undefined;
  const runStatus = (id: string) => (id !== CUTOFF.id || run === "Paid" ? <Status tone="good">Paid</Status> : <Status tone="warn">{run === "Draft" ? "Draft" : "Approved"}</Status>);
  const hireInfo = hires.find((h) => h.id === hire) ?? hires[0];
  const hireDone = done[hireInfo.id] ?? [];

  const attention = [
    ...pendingLeave.map((l) => ({ key: l.id, name: nameOf(l.staffId), sub: `${l.type} leave · ${fmtRange(l.from, l.to)}`, status: <Status tone="warn">Pending</Status>, label: "Review", go: () => { setLeaveView("requests"); app.section("leave"); } })),
    ...(pendingOt.length ? [{ key: "ot", name: "", sub: `${pendingOt.map((o) => firstName(nameOf(o.staffId))).join(", ")}`, title: `${pendingOt.length} overtime requests`, status: <Status tone="warn">Pending</Status>, label: "Review", go: () => { setTimeView("overtime"); app.section("time"); } }] : []),
    ...(pendingExp.length ? [{ key: "exp", name: "", sub: pendingExp.map((e) => firstName(nameOf(e.staffId))).join(", "), title: `${pendingExp.length} expense ${pendingExp.length === 1 ? "claim" : "claims"}`, status: <Status tone="warn">Pending</Status>, label: "Review", go: () => app.section("expenses") }] : []),
    ...docAlerts.map((a) => ({ key: `${a.staff.id}-${a.kind}`, name: a.staff.name, sub: a.kind, status: <Status tone={a.tone}>{a.text}</Status>, label: "Open", go: () => openProfile(a.staff, "docs") })),
    ...staff.filter((s) => s.type === "Probationary" && daysUntil(addMonths(s.hired, 6)) <= 45).map((s) => ({ key: `prob-${s.id}`, name: s.name, sub: `Probation ends ${fmt(addMonths(s.hired, 6))}`, status: <Status tone="warn">Review due</Status>, label: "Open", go: () => app.open("review", s.id, s.name) })),
    ...staff.filter((s) => s.contractEnd).map((s) => ({ key: `ctr-${s.id}`, name: s.name, sub: `Contract ends ${fmt(s.contractEnd ?? "")}`, status: <Status tone="warn">Renewal</Status>, label: "Open", go: () => openProfile(s) })),
    ...unfiled.slice(0, 1).map((a) => ({ key: `rem-${a.id}`, name: "", title: `${a.name} for October`, sub: `${a.form} · ${peso(remit(a, octLines).total)}`, status: <Status tone="warn">{`Due ${fmt(a.due)}`}</Status>, label: "Open", go: () => app.section("remittances") })),
  ];

  const upcoming = [
    ...HOLIDAYS.filter((h) => daysUntil(h.date) >= 0).slice(0, 2).map((h) => ({ date: h.date, text: h.name, sub: h.kind })),
    ...hires.map((h) => ({ date: h.start, text: `${h.name} starts`, sub: h.role })),
    ...(leaver?.leaving ? [{ date: leaver.leaving, text: `${firstName(leaver.name)}'s last day`, sub: "Offboarding" }] : []),
    ...unfiled.map((a) => ({ date: a.due, text: `${a.name} due`, sub: `October ${a.form}` })),
    { date: "2026-12-15", text: "13th month payout", sub: "With the Dec 1–15 cutoff" },
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const weekOut = staff.flatMap((s) => {
    const l = leaves.find((x) => x.staffId === s.id && x.status !== "Declined" && x.to >= "2026-10-26" && x.from <= "2026-11-06");
    const ob = OFFICIAL_BUSINESS.find((o) => o.staffId === s.id);
    return l ? [{ s, text: `${l.type} · ${fmtRange(l.from, l.to)}`, tone: (l.status === "Approved" ? "muted" : "warn") as Tone, status: l.status === "Approved" ? "Approved" : "Pending" }] : ob ? [{ s, text: `${ob.note} · ${fmtRange(ob.from, ob.to)}`, tone: "muted" as Tone, status: "Official business" }] : [];
  });

  const visibleStaff = staff.filter((s) => (dept === "All" || s.dept === dept) && `${s.name} ${s.role}`.toLowerCase().includes(query.toLowerCase()));
  const root = staff.find((s) => !s.manager);

  // Command palette: each record opens the way the app opens it, root section first.
  const search: ProtoSearchItem[] = [
    ...staff.map((s) => ({ label: s.name, hint: "Staff", stack: [{ screen: "directory" }, { screen: "profile", id: s.id, label: s.name }] })),
    ...posts.map((p) => ({ label: p.title, hint: p.kind, stack: [{ screen: "policies" }, { screen: "policy", id: p.id, label: p.title }] })),
    ...AGENCIES.map((a) => ({ label: a.name, hint: "Remittance", stack: [{ screen: "remittances" }, { screen: "remit", id: a.id, label: a.name }] })),
    ...[CUTOFF, ...[...PAST].reverse()].map((r) => ({ label: `Pay run ${r.period}`, hint: "Pay run", stack: [{ screen: "payroll" }, { screen: "run", id: r.id, label: r.period }] })),
    ...reviews.flatMap((r) => {
      const s = byId(r.staffId);
      return s ? [{ label: `${s.name} · ${r.kind.toLowerCase()} review`, hint: "Review", stack: [{ screen: "performance" }, { screen: "review", id: s.id, label: s.name }] }] : [];
    }),
  ];

  // Bell: one item per pending leave, pending overtime, and 201 file alert.
  const raised: ProtoAlert[] = [
    ...pendingLeave.map((l) => ({ text: `${nameOf(l.staffId)} asked for ${l.type.toLowerCase()} leave, ${fmtRange(l.from, l.to)}`, time: relDay(l.filed), stack: [{ screen: "leave" }] })),
    ...pendingOt.map((o) => ({ text: `${nameOf(o.staffId)} asked for ${o.hours} h overtime, ${fmt(o.date)}`, time: relDay(o.date), stack: [{ screen: "time" }] })),
    ...docAlerts.map((a) => ({
      text: `${a.staff.name}: ${a.kind} ${a.text.replace(/^./, (c) => c.toLowerCase())}`,
      time: a.expires ? relDay(a.expires) : `Since ${fmt(a.staff.hired)}`,
      stack: [{ screen: "directory" }, { screen: "profile", id: a.staff.id, label: a.staff.name }],
    })),
  ];
  // The bell keys items by text, so a repeated request gets a number.
  const inbox = raised.map((a, i) => {
    const same = raised.slice(0, i).filter((x) => x.text === a.text).length;
    return same ? { ...a, text: `${a.text} (${same + 1})` } : a;
  });

  return (
    <ProtoApp app={app} name="Church HRIS · Grace Fellowship" user="Tess Aquino" nav={nav} inbox={inbox} search={search}>
      {/* ---- Overview ---- */}
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Overview" subtitle="Thursday, October 29 · Cutoff Oct 16–31" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Headcount" value={String(staff.length)} sub={`${staff.filter((s) => s.type === "Regular").length} regular · ${hires.length} starting soon`} />
            <Stat label="Next pay date" value="Oct 30" sub={run === "Draft" ? "Pay run in draft" : run === "Approved" ? "Approved, not yet released" : "Paid, payslips sent"} tone={run === "Paid" ? "good" : undefined} />
            <Stat label="Waiting for you" value={String(pendingLeave.length + pendingOt.length + pendingExp.length)} sub={`${pendingLeave.length} leave · ${pendingOt.length} overtime · ${pendingExp.length} expenses`} />
            <Stat label="201 file alerts" value={String(docAlerts.length)} sub="Missing or expiring" tone={docAlerts.length ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-3">
            <Panel title="Needs attention">
              <Rows>
                {attention.map((a) => (
                  <Row key={a.key} name={a.name || undefined} title={"title" in a && a.title ? a.title : a.name} sub={a.sub}>
                    {a.status}
                    <SmallButton onClick={a.go}>{a.label}</SmallButton>
                  </Row>
                ))}
                {attention.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Nothing needs attention.</li>}
              </Rows>
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Gross pay, last six cutoffs">
                <Bars format={(n) => `${Math.round(n / 1000)}k`} data={[...PAST.map((r) => ({ label: r.short, value: sum(r.lines, "gross") })), { label: "Oct 16", value: sum(lines, "gross") }]} />
              </Panel>
              <Panel title="Out through Nov 6">
                <Rows>
                  {weekOut.map((w) => (
                    <Row key={w.s.id} name={w.s.name} title={w.s.name} sub={w.text} onClick={() => openProfile(w.s, "leave")}>
                      <Status tone={w.tone}>{w.status}</Status>
                    </Row>
                  ))}
                </Rows>
              </Panel>
              <Panel title="Coming up">
                <Rows>
                  {upcoming.map((u) => (
                    <li key={`${u.date}-${u.text}`} className="flex items-center gap-3 py-1.5 text-[0.78rem]">
                      <span className="w-12 shrink-0 font-mono text-[0.7rem] text-mist">{fmt(u.date)}</span>
                      <span className="flex-1 min-w-0 truncate text-ink">{u.text}</span>
                      <span className="text-[0.68rem] text-mist truncate">{u.sub}</span>
                    </li>
                  ))}
                </Rows>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---- Staff directory and org chart ---- */}
      {app.screen === "directory" && (
        <>
          <ScreenHeader
            title="Staff"
            subtitle={`${staff.length} staff · ${DEPTS.length} departments · ${docAlerts.length} document alerts`}
            action={
              <>
                <Segmented id="hris-dir" value={dirView} onChange={setDirView} options={[{ id: "list", label: "List" }, { id: "org", label: "Org chart" }]} />
                <PrimaryButton onClick={() => setModal("hire")}><UserPlus size={14} /> Add new hire</PrimaryButton>
              </>
            }
          />
          {dirView === "list" ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SearchBox value={query} onChange={setQuery} placeholder="Search name or role" />
                <Segmented id="hris-dept" value={dept} onChange={setDept} options={[{ id: "All", label: "All" }, ...DEPTS.map((d) => ({ id: d, label: d }))]} />
              </div>
              <Table
                rows={visibleStaff}
                rowKey={(s) => s.id}
                onRowClick={(s) => openProfile(s)}
                empty="No staff match that search."
                columns={[
                  { key: "name", label: "Name", render: (s) => <span className="flex items-center gap-2"><Avatar name={s.name} size={26} /><span className="min-w-0"><span className="block text-ink">{s.name}</span><span className="block text-[0.7rem] text-mist">{s.role}</span></span></span> },
                  { key: "dept", label: "Department", hideOnMobile: true, render: (s) => s.dept },
                  { key: "type", label: "Employment", render: (s) => <Status tone={typeTone(s.type)}>{s.leaving ? `Leaving ${fmt(s.leaving)}` : s.type}</Status> },
                  { key: "manager", label: "Reports to", hideOnMobile: true, render: (s) => (s.manager ? nameOf(s.manager) : "Elder board") },
                  { key: "docs", label: "201 file", hideOnMobile: true, render: (s) => { const a = alertsFor(s.id); return a.length ? <Status tone={a.some((x) => x.tone === "bad") ? "bad" : "warn"}>{a.length === 1 ? `${a[0].kind.split(" ")[0]} ${a[0].text.toLowerCase()}` : `${a.length} alerts`}</Status> : <Status tone="good">Complete</Status>; } },
                ]}
              />
            </>
          ) : (
            root && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[15rem]"><OrgNode person={root} staff={[]} onOpen={(s) => openProfile(s)} /></div>
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-rule">
                  {staff.filter((s) => s.manager === root.id).map((m) => (
                    <OrgNode key={m.id} person={m} staff={staff} onOpen={(s) => openProfile(s)} />
                  ))}
                </div>
                <p className="text-[0.72rem] text-mist">Pastor Dan reports to the elder board. Click anyone to open their profile.</p>
              </div>
            )
          )}
        </>
      )}

      {/* ---- Employee profile ---- */}
      {app.screen === "profile" && sp && (() => {
        const t13 = thirteenth.find((t) => t.s.id === sp.id);
        const mine = leaves.filter((l) => l.staffId === sp.id);
        const required = requiredDocs(sp);
        const onFile = required.filter((k) => docsOf(sp.id).some((d) => d.kind === k)).length;
        const reports = staff.filter((s) => s.manager === sp.id);
        return (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Avatar name={sp.name} size={48} />
              <div className="flex-1 min-w-[12rem]">
                <ProtoHeading className="text-[1.35rem] leading-tight font-semibold text-ink">{sp.name}</ProtoHeading>
                <span className="text-[0.78rem] text-graphite">{sp.role} · {sp.dept} · GF-{String(100 + Number(sp.id.slice(1))).padStart(4, "0")}</span>
              </div>
              <Status tone={typeTone(sp.type)}>{sp.type}</Status>
              <SmallButton onClick={() => openLeave(sp.id)}><CalendarDays size={12} /> File leave</SmallButton>
              {reviewOf(sp.id) && <SmallButton onClick={() => app.open("review", sp.id, sp.name)}><Target size={12} /> Review</SmallButton>}
            </div>
            <div className="mb-3">
              <Segmented id="hris-profile" value={profileTab} onChange={setProfileTab} options={[{ id: "job", label: "Job" }, { id: "docs", label: "201 file" }, { id: "pay", label: "Pay" }, { id: "leave", label: "Leave" }]} />
            </div>
            {profileTab === "job" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Panel title="Employment">
                  <KeyValues
                    items={[
                      ["Hired", `${fmtYear(sp.hired)} · ${tenure(sp.hired)}`],
                      ...(sp.type === "Probationary" ? ([["Probation ends", fmtYear(addMonths(sp.hired, 6))]] as [string, string][]) : []),
                      ...(sp.contractEnd ? ([["Contract ends", fmtYear(sp.contractEnd)]] as [string, string][]) : []),
                      ...(sp.leaving ? ([["Last day", fmtYear(sp.leaving)]] as [string, string][]) : []),
                      ["Reports to", sp.manager ? nameOf(sp.manager) : "Elder board"],
                      ["Schedule", "Mon–Fri, 8:00 AM–5:00 PM"],
                      ["Overtime", sp.exempt ? "Managerial, exempt" : "Eligible"],
                      ["Mobile", sp.phone],
                      ["Email", `${firstName(sp.name).toLowerCase()}@gracefellowship.ph`],
                      ["Lives in", sp.city],
                    ]}
                  />
                </Panel>
                <div className="flex flex-col gap-3">
                  <Panel title="Government numbers">
                    <KeyValues items={[["SSS", govNo(sp, 1)], ["PhilHealth", govNo(sp, 2)], ["Pag-IBIG", govNo(sp, 3)], ["TIN", govNo(sp, 4)]]} />
                  </Panel>
                  <Panel title={`Direct reports · ${reports.length}`}>
                    <Rows>
                      {reports.map((r) => <Row key={r.id} name={r.name} title={r.name} sub={r.role} onClick={() => openProfile(r)} />)}
                      {reports.length === 0 && <li className="py-2 text-[0.78rem] text-mist">No direct reports.</li>}
                    </Rows>
                  </Panel>
                </div>
              </div>
            )}
            {profileTab === "docs" && (
              <Panel title="Documents" action={<SmallButton onClick={() => openUpload(required.find((k) => !docsOf(sp.id).some((d) => d.kind === k)) ?? required[0])}><Upload size={12} /> Upload document</SmallButton>}>
                <div className="flex items-center justify-between text-[0.78rem] mb-1.5">
                  <span className="text-ink">{`${onFile} of ${required.length} required documents on file`}</span>
                  <span className="text-mist">{alertsFor(sp.id).length ? `${alertsFor(sp.id).length} need action` : "Complete"}</span>
                </div>
                <Meter value={onFile} max={required.length} className="mb-3" />
                <Rows>
                  {required.map((kind) => {
                    const d = docsOf(sp.id).find((x) => x.kind === kind);
                    const st = docState(d);
                    return (
                      <li key={kind} className="flex flex-wrap items-center gap-2.5 py-2">
                        <FileText size={15} className="text-mist shrink-0" />
                        <span className="flex-1 min-w-[10rem]">
                          <span className="block text-[0.8rem] text-ink">{kind}</span>
                          <span className="block text-[0.68rem] text-mist truncate">{d ? `${d.file} · Uploaded ${fmtYear(d.uploaded)}` : kind === "Child protection policy" ? "Required for kids and youth staff" : "Not yet submitted"}</span>
                        </span>
                        <Status tone={st.tone}>{st.text}</Status>
                        <SmallButton onClick={() => openUpload(kind)}>{d ? "Replace" : "Upload"}</SmallButton>
                      </li>
                    );
                  })}
                </Rows>
              </Panel>
            )}
            {profileTab === "pay" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Panel title="Compensation" action={<SmallButton onClick={() => { setSalaryDraft(String(sp.monthly)); setModal("salary"); }}><Pencil size={12} /> Change salary</SmallButton>}>
                  <KeyValues
                    items={[
                      ["Monthly basic", peso(sp.monthly)],
                      ["Per cutoff", peso(sp.monthly / 2)],
                      ["Daily rate", `${peso(dailyRate(sp.monthly))} · 261-day factor`],
                      ...(sp.prevMonthly && sp.prevMonthly !== sp.monthly ? ([["Previous", `${peso(sp.prevMonthly)} until Oct 15`]] as [string, string][]) : []),
                      ["Paid through", sp.payout],
                      ["13th month", t13 ? `${peso(t13.accrued)} accrued · ${peso(t13.amount)} projected` : "—"],
                    ]}
                  />
                </Panel>
                <Panel title="Payslips">
                  <Rows>
                    {[runFor(CUTOFF.id), ...[...PAST].reverse()].map((r) => r && (
                      <li key={r.id}>
                        <button type="button" onClick={() => app.open("payslip", `${sp.id}|${r.id}`, `Payslip ${r.period}`)} className="w-full flex items-center justify-between gap-3 py-2 text-left text-[0.8rem] cursor-pointer group">
                          <span className="text-ink group-hover:text-gold-bright">{r.period}</span>
                          <span className="flex items-center gap-3">{runStatus(r.id)}{mono(lineFor(r.lines, sp.id)?.net ?? 0)}</span>
                        </button>
                      </li>
                    ))}
                  </Rows>
                </Panel>
              </div>
            )}
            {profileTab === "leave" && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-3">
                <Panel title="Balances">
                  {(["vl", "sl"] as const).map((k) => (
                    <div key={k} className="mb-2.5 last:mb-0">
                      <div className="flex justify-between text-[0.78rem] mb-1"><span className="text-ink">{k === "vl" ? "Vacation" : "Sick"}</span><span className="font-mono text-graphite">{`${sp[k]} of ${leaveCap(sp)} days left`}</span></div>
                      <Meter value={sp[k]} max={leaveCap(sp)} />
                    </div>
                  ))}
                  <p className="mt-2 text-[0.7rem] text-mist">Unused vacation leave converts to cash at year end. Bereavement leave is 3 days per event.</p>
                </Panel>
                <Panel title="Requests">
                  <Rows>
                    {mine.map((l) => <Row key={l.id} title={`${l.type} · ${fmtRange(l.from, l.to)}`} sub={`${l.days} ${l.days === 1 ? "day" : "days"} · ${l.reason}`}><Status tone={l.status === "Approved" ? "good" : l.status === "Pending" ? "warn" : "bad"}>{l.status}</Status></Row>)}
                    {mine.length === 0 && <li className="py-2 text-[0.78rem] text-mist">No leave filed this year.</li>}
                  </Rows>
                </Panel>
              </div>
            )}
          </>
        );
      })()}

      {/* ---- Time and attendance ---- */}
      {app.screen === "time" && (
        <>
          <ScreenHeader title="Time" subtitle="Daily time records · Cutoff Oct 16–31" action={<PrimaryButton onClick={() => openOt("s5")}><Plus size={14} /> File overtime</PrimaryButton>} />
          <div className="mb-3">
            <Segmented id="hris-time" value={timeView} onChange={setTimeView} options={[{ id: "today", label: "Today" }, { id: "overtime", label: "Overtime" }, { id: "summary", label: "Cutoff summary" }]} />
          </div>
          {timeView === "today" && (() => {
            const today = staff.map((s) => ({ s, d: dayInfo(s, TODAY) }));
            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                  <Stat label="Clocked in" value={`${today.filter((x) => x.d.inAt).length} of ${staff.length}`} sub="As of 10:15 AM" />
                  <Stat label="Late today" value={String(today.filter((x) => x.d.late && !excused.includes(x.d.late.id)).length)} sub="Grace period: none" tone="bad" />
                  <Stat label="Out or on field work" value={String(today.filter((x) => !x.d.inAt).length)} />
                  <Stat label="Overtime to approve" value={String(pendingOt.length)} />
                </div>
                <Table
                  rows={today}
                  rowKey={(x) => x.s.id}
                  onRowClick={(x) => app.open("dtr", x.s.id, x.s.name)}
                  columns={[
                    { key: "name", label: "Staff", render: (x) => <span className="flex items-center gap-2"><Avatar name={x.s.name} size={24} /><span className="text-ink">{x.s.name}</span></span> },
                    { key: "in", label: "Time in", render: (x) => <span className="font-mono">{clock(x.d.inAt)}</span> },
                    { key: "source", label: "Source", hideOnMobile: true, render: (x) => (x.d.inAt ? (x.s.dept === "Pastoral" ? "Staff app, geotagged" : "Biometric, main office") : "—") },
                    { key: "status", label: "Status", render: (x) => <Status tone={x.d.tone}>{x.d.label}</Status> },
                  ]}
                />
              </>
            );
          })()}
          {timeView === "overtime" && (
            <div className="flex flex-col gap-3">
              <Panel title={`Waiting for approval · ${pendingOt.length}`}>
                <Rows>
                  {pendingOt.map((o) => {
                    const s = byId(o.staffId);
                    return (
                      <Row key={o.id} name={nameOf(o.staffId)} title={`${nameOf(o.staffId)} · ${o.hours} h ${o.kind.toLowerCase()}`} sub={`${fmtDay(o.date)} · ${o.reason} · ${peso(s ? otAmount(o, s.monthly) : 0)}`}>
                        <SmallButton onClick={() => decideOt(o, "Declined")}>Decline</SmallButton>
                        <PrimaryButton onClick={() => decideOt(o, "Approved")}>Approve</PrimaryButton>
                      </Row>
                    );
                  })}
                  {pendingOt.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No overtime waiting.</li>}
                </Rows>
              </Panel>
              <Table
                rows={ots.filter((o) => o.status !== "Pending")}
                rowKey={(o) => o.id}
                onRowClick={(o) => app.open("dtr", o.staffId, nameOf(o.staffId))}
                columns={[
                  { key: "who", label: "Staff", render: (o) => <span className="text-ink">{nameOf(o.staffId)}</span> },
                  { key: "date", label: "Date", render: (o) => fmtDay(o.date) },
                  { key: "hours", label: "Hours", align: "right", render: (o) => <span className="font-mono">{o.hours}</span> },
                  { key: "kind", label: "Rate", hideOnMobile: true, render: (o) => (o.kind === "Rest day" ? "Rest day, 130%" : "Regular day, 125%") },
                  { key: "pay", label: "Pay", align: "right", hideOnMobile: true, render: (o) => { const s = byId(o.staffId); return o.status === "Approved" && s ? mono(otAmount(o, s.monthly)) : "—"; } },
                  { key: "status", label: "Status", render: (o) => <Status tone={o.status === "Approved" ? "good" : "bad"}>{o.status}</Status> },
                ]}
              />
              <p className="text-[0.72rem] text-mist">Managerial staff are exempt from overtime. Approved hours flow into the next pay run.</p>
            </div>
          )}
          {timeView === "summary" && (
            <>
              <Table
                rows={staff.map((s) => ({ s, t: timeOf(s) }))}
                rowKey={(x) => x.s.id}
                onRowClick={(x) => app.open("dtr", x.s.id, x.s.name)}
                columns={[
                  { key: "name", label: "Staff", render: (x) => <span className="text-ink">{x.s.name}</span> },
                  { key: "days", label: "Days present", align: "right", hideOnMobile: true, render: (x) => <span className="font-mono">{`${x.t.present}/${cutoffDays.length}`}</span> },
                  { key: "late", label: "Lates", align: "right", render: (x) => <span className={cn("font-mono", x.t.lateMin && "text-warn")}>{x.t.lateMin ? `${x.t.lateMin} min` : "—"}</span> },
                  { key: "abs", label: "Absent", align: "right", hideOnMobile: true, render: (x) => <span className={cn("font-mono", x.t.absences && "text-danger")}>{x.t.absences || "—"}</span> },
                  { key: "ot", label: "OT hours", align: "right", hideOnMobile: true, render: (x) => <span className="font-mono">{x.t.otHours || "—"}</span> },
                  { key: "pay", label: "Pay effect", align: "right", render: (x) => <span className={cn("font-mono", x.t.otPay - x.t.less < 0 && "text-danger")}>{signed(x.t.otPay - x.t.less)}</span> },
                ]}
              />
              <p className="mt-2 text-[0.72rem] text-mist">{locked ? "Locked. The Oct 16–31 pay run is approved." : "Feeds the Oct 16–31 pay run. Lates use the per-minute rate; unpaid absences use the daily rate."}</p>
            </>
          )}
        </>
      )}

      {app.screen === "dtr" && sp && (() => {
        const t = timeOf(sp);
        const extra = ots.filter((o) => o.staffId === sp.id && o.status === "Approved" && !isWorkday(o.date) && inRange(o.date, CUTOFF.from, TODAY)).map((o) => o.date);
        const dates = [...new Set([...cutoffDays, ...extra])].sort();
        return (
          <>
            <ScreenHeader title={sp.name} subtitle={`Daily time record · Oct 16–31 · ${sp.role}`} action={!sp.exempt && <SmallButton onClick={() => openOt(sp.id)}><Plus size={12} /> File overtime</SmallButton>} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
              <Stat label="Days present" value={`${t.present}/${cutoffDays.length}`} />
              <Stat label="Late" value={`${t.lateMin} min`} sub={t.lateMin ? minus(t.less - t.absences * Math.round(dailyRate(sp.monthly))) : "None"} tone={t.lateMin ? "bad" : "good"} />
              <Stat label="Unpaid absences" value={String(t.absences)} sub={t.absences ? minus(t.absences * Math.round(dailyRate(sp.monthly))) : "None"} tone={t.absences ? "bad" : undefined} />
              <Stat label="Overtime approved" value={`${t.otHours} h`} sub={t.otPay ? `+${peso(t.otPay)}` : sp.exempt ? "Exempt" : undefined} tone={t.otPay ? "good" : undefined} />
            </div>
            <Table
              rows={dates.map((d) => ({ d, info: dayInfo(sp, d) }))}
              rowKey={(r) => r.d}
              columns={[
                { key: "date", label: "Date", render: (r) => <span className="text-ink">{fmtDay(r.d)}</span> },
                { key: "in", label: "In", render: (r) => <span className="font-mono">{clock(r.info.inAt)}</span> },
                { key: "out", label: "Out", render: (r) => <span className="font-mono">{r.d === TODAY && r.info.inAt ? "Still in" : clock(r.info.outAt)}</span> },
                { key: "ot", label: "OT", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono">{r.info.ot ? `${r.info.ot} h` : "—"}</span> },
                {
                  key: "status",
                  label: "Status",
                  render: (r) => (
                    <span className="flex flex-wrap items-center gap-2">
                      <Status tone={r.info.tone}>{r.info.label}</Status>
                      {r.info.late && !excused.includes(r.info.late.id) && <SmallButton onClick={() => r.info.late && excuse(r.info.late)}>Excuse</SmallButton>}
                      {r.info.late?.note && <span className="text-[0.66rem] text-mist">{r.info.late.note}</span>}
                    </span>
                  ),
                },
              ]}
            />
            <p className="mt-2 text-[0.72rem] text-mist">Schedule Mon–Fri, 8:00 AM–5:00 PM with a one-hour break. Late deductions use the per-minute rate.</p>
          </>
        );
      })()}

      {/* ---- Leave ---- */}
      {app.screen === "leave" && (
        <>
          <ScreenHeader title="Leave" subtitle={`${pendingLeave.length} pending · Regular staff earn 15 vacation and 15 sick days a year`} action={<PrimaryButton onClick={() => openLeave("s1")}><Plus size={14} /> File leave</PrimaryButton>} />
          <div className="mb-3">
            <Segmented id="hris-leave" value={leaveView} onChange={setLeaveView} options={[{ id: "requests", label: "Requests" }, { id: "calendar", label: "Calendar" }, { id: "balances", label: "Balances" }]} />
          </div>
          {leaveView === "requests" && (
            <div className="flex flex-col gap-3">
              <Panel title={`Waiting for approval · ${pendingLeave.length}`}>
                <Rows>
                  {pendingLeave.map((l) => {
                    const s = byId(l.staffId);
                    if (!s) return null;
                    const overlap = leaves.filter((x) => x.id !== l.id && x.status !== "Declined" && byId(x.staffId)?.dept === s.dept && x.from <= l.to && x.to >= l.from);
                    const left = l.type === "Vacation" ? s.vl : l.type === "Sick" ? s.sl : 3;
                    return (
                      <Row key={l.id} name={s.name} title={`${s.name} · ${l.type}, ${l.days} ${l.days === 1 ? "day" : "days"}`} sub={`${fmtRange(l.from, l.to)} · ${l.reason} · ${left} left${overlap.length ? ` · Also out: ${overlap.map((x) => firstName(nameOf(x.staffId))).join(", ")}` : ""}`}>
                        <SmallButton onClick={() => decideLeave(l, "Declined")}>Decline</SmallButton>
                        <PrimaryButton onClick={() => decideLeave(l, "Approved")}>Approve</PrimaryButton>
                      </Row>
                    );
                  })}
                  {pendingLeave.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No requests waiting.</li>}
                </Rows>
              </Panel>
              <Table
                rows={leaves.filter((l) => l.status !== "Pending")}
                rowKey={(l) => l.id}
                onRowClick={(l) => { const s = byId(l.staffId); if (s) openProfile(s, "leave"); }}
                columns={[
                  { key: "who", label: "Staff", render: (l) => <span className="text-ink">{nameOf(l.staffId)}</span> },
                  { key: "type", label: "Type", render: (l) => l.type },
                  { key: "dates", label: "Dates", hideOnMobile: true, render: (l) => fmtRange(l.from, l.to) },
                  { key: "days", label: "Days", align: "right", hideOnMobile: true, render: (l) => <span className="font-mono">{l.days}</span> },
                  { key: "status", label: "Status", render: (l) => <Status tone={l.status === "Approved" ? "good" : "bad"}>{l.status}</Status> },
                ]}
              />
            </div>
          )}
          {leaveView === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_13rem] gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Segmented id="hris-month" value={calMonth} onChange={setCalMonth} options={[{ id: "2026-10", label: "October" }, { id: "2026-11", label: "November" }, { id: "2026-12", label: "December" }]} />
                  <span className="flex items-center gap-2 text-[0.66rem] text-mist">
                    <span className="w-2 h-2 rounded-sm bg-gold" /> Approved <span className="w-2 h-2 rounded-sm bg-warn" /> Pending <span className="w-2 h-2 rounded-sm bg-danger" /> Holiday
                  </span>
                </div>
                <MonthGrid
                  month={calMonth}
                  items={(iso) => {
                    const h = holidayOn(iso);
                    const out = weekday(iso) % 6 === 0 ? [] : leaves.filter((l) => l.status !== "Declined" && inRange(iso, l.from, l.to)).map((l): CalItem => ({ key: l.id, label: firstName(nameOf(l.staffId)), tone: l.status === "Approved" ? "approved" : "pending" }));
                    return [...(h ? [{ key: h.date, label: h.name, tone: "holiday" as const }] : []), ...out];
                  }}
                />
              </div>
              <Panel title="Holidays">
                <Rows>
                  {HOLIDAYS.map((h) => (
                    <li key={h.date} className="py-1.5">
                      <span className="block text-[0.78rem] text-ink">{h.name}</span>
                      <span className="block text-[0.66rem] text-mist">{`${fmtDay(h.date)} · ${h.kind}`}</span>
                    </li>
                  ))}
                </Rows>
                <p className="mt-2 text-[0.66rem] text-mist">Sample list. Work on a regular holiday pays 200%, special days 130%.</p>
              </Panel>
            </div>
          )}
          {leaveView === "balances" && (
            <Table
              rows={staff}
              rowKey={(s) => s.id}
              onRowClick={(s) => openProfile(s, "leave")}
              columns={[
                { key: "name", label: "Staff", render: (s) => <span className="text-ink">{s.name}</span> },
                ...(["vl", "sl"] as const).map((k) => ({
                  key: k,
                  label: k === "vl" ? "Vacation left" : "Sick left",
                  render: (s: Staff) => <span className="flex items-center gap-2"><Meter value={s[k]} max={leaveCap(s)} className="w-16" /><span className="font-mono text-[0.72rem]">{`${s[k]}/${leaveCap(s)}`}</span></span>,
                })),
                { key: "used", label: "Used", align: "right" as const, hideOnMobile: true, render: (s: Staff) => { const used = leaveCap(s) * 2 - s.vl - s.sl; return <span className="font-mono">{`${used} ${used === 1 ? "day" : "days"}`}</span>; } },
                { key: "cash", label: "Vacation value", align: "right" as const, hideOnMobile: true, render: (s: Staff) => mono(s.vl * dailyRate(s.monthly)) },
              ]}
            />
          )}
        </>
      )}

      {/* ---- Expenses ---- */}
      {app.screen === "expenses" && (() => {
        const sumOf = (list: Expense[]) => list.reduce((t, e) => t + e.amount, 0);
        const inRun = expenses.filter((e) => e.status === "Approved" && e.paidIn === CUTOFF.period);
        const later = expenses.filter((e) => e.status === "Approved" && e.paidIn !== CUTOFF.period);
        return (
          <>
            <ScreenHeader title="Expenses" subtitle={`${pendingExp.length} waiting · Approved claims are added to the next pay run`} action={<PrimaryButton onClick={openExpense}><Plus size={14} /> Submit expense</PrimaryButton>} />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
              <Stat label="Waiting for approval" value={peso(sumOf(pendingExp))} sub={`${pendingExp.length} ${pendingExp.length === 1 ? "claim" : "claims"}`} />
              <Stat label="In the Oct 16–31 pay run" value={peso(sumOf(inRun))} sub={`${inRun.length} approved`} tone={inRun.length ? "good" : undefined} />
              <Stat label="For the Nov 1–15 cutoff" value={peso(sumOf(later))} sub={`${later.length} approved`} />
            </div>
            <div className="flex flex-col gap-3">
              <Panel title={`Waiting for approval · ${pendingExp.length}`}>
                <Rows>
                  {pendingExp.map((e) => (
                    <Row key={e.id} name={nameOf(e.staffId)} title={`${nameOf(e.staffId)} · ${e.category}, ${peso(e.amount)}`} sub={`${fmtDay(e.date)} · ${e.note}`}>
                      <span className="inline-flex items-center gap-1 max-w-[9rem] text-[0.68rem] text-mist"><Paperclip size={11} className="shrink-0" /><span className="truncate">{e.receipt}</span></span>
                      <SmallButton onClick={() => decideExpense(e, "Declined")}>Decline</SmallButton>
                      <PrimaryButton onClick={() => decideExpense(e, "Approved")}>Approve</PrimaryButton>
                    </Row>
                  ))}
                  {pendingExp.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No expenses waiting.</li>}
                </Rows>
              </Panel>
              <Table
                rows={expenses.filter((e) => e.status !== "Pending")}
                rowKey={(e) => e.id}
                empty="No decided claims yet."
                onRowClick={(e) => { const s = byId(e.staffId); if (s) openProfile(s, "pay"); }}
                columns={[
                  { key: "who", label: "Staff", render: (e) => <span className="text-ink">{nameOf(e.staffId)}</span> },
                  { key: "cat", label: "Category", hideOnMobile: true, render: (e) => <span><span className="block">{e.category}</span><span className="block text-[0.66rem] text-mist">{fmt(e.date)}</span></span> },
                  { key: "receipt", label: "Receipt", hideOnMobile: true, render: (e) => <span className="inline-flex items-center gap-1 max-w-[10rem] text-[0.72rem]"><Paperclip size={11} className="text-mist shrink-0" /><span className="truncate">{e.receipt}</span></span> },
                  { key: "amount", label: "Amount", align: "right", render: (e) => mono(e.amount) },
                  { key: "status", label: "Status", render: (e) => <span><Status tone={e.status === "Approved" ? "good" : "bad"}>{e.status}</Status>{e.paidIn && <span className="block mt-0.5 text-[0.64rem] text-mist">{`${e.paidIn} pay run`}</span>}</span> },
                ]}
              />
              <p className="text-[0.72rem] text-mist">Reimbursements are not taxed. They are added after tax, so contributions and withholding stay the same.</p>
            </div>
          </>
        );
      })()}

      {/* ---- Payroll ---- */}
      {app.screen === "payroll" && (
        <>
          <ScreenHeader
            title="Payroll"
            subtitle={`Semi-monthly · ${CUTOFF.period} · Pay date Fri, Oct 30`}
            action={
              run === "Draft" ? (
                <>
                  <SmallButton onClick={() => setModal("adjust")}><Plus size={12} /> Adjustment</SmallButton>
                  <PrimaryButton onClick={() => setModal("approve")}><Check size={14} /> Review and approve</PrimaryButton>
                </>
              ) : run === "Approved" ? (
                <PrimaryButton onClick={() => { setRun("Paid"); app.notify(`Pay released to ${staff.length} staff. Payslips sent to the staff app.`); }}><Send size={14} /> Release pay</PrimaryButton>
              ) : (
                <SmallButton onClick={() => app.notify("Bank file and GCash batch saved")}><Download size={12} /> Bank file</SmallButton>
              )
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <Segmented id="hris-pay" value={payView} onChange={setPayView} options={[{ id: "run", label: "Pay run" }, { id: "variance", label: "Variance" }, { id: "thirteenth", label: "13th month" }, { id: "history", label: "History" }]} />
            <span className="flex items-center gap-1.5">
              {["Draft", "Approved", "Paid"].map((label, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <ChevronRight size={12} className="text-mist" />}
                  <Status tone={label === run ? (run === "Paid" ? "good" : "warn") : ["Draft", "Approved", "Paid"].indexOf(run) > i ? "good" : "muted"}>{label}</Status>
                </React.Fragment>
              ))}
            </span>
          </div>
          {payView === "run" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="Gross pay" value={peso(sum(lines, "gross"))} sub={`${peso(sum(lines, "ot"))} overtime · ${minus(sum(lines, "less"))} lates`} />
                <Stat label="Employee contributions" value={peso(employeeShare(lines))} sub="SSS, PhilHealth, Pag-IBIG" />
                <Stat label="Withholding tax" value={peso(sum(lines, "tax"))} />
                <Stat label="Net pay" value={peso(sum(lines, "net"))} sub={`${signed(netChange)} vs Oct 1–15`} tone={Math.abs(netChange) > 0 ? undefined : "good"} />
              </div>
              <Table
                rows={lines}
                rowKey={(l) => l.staffId}
                onRowClick={(l) => app.open("payslip", `${l.staffId}|${CUTOFF.id}`, nameOf(l.staffId))}
                columns={[
                  { key: "name", label: "Staff", render: (l) => <span className="text-ink">{nameOf(l.staffId)}</span> },
                  { key: "gross", label: "Gross", align: "right", render: (l) => <span><span className="block font-mono">{peso(l.gross)}</span>{(l.ot > 0 || l.less > 0) && <span className="block text-[0.64rem] text-mist">{[l.ot && `+${peso(l.ot)} OT`, l.less && `${minus(l.less)} lates`].filter(Boolean).join(" · ")}</span>}</span> },
                  ...(["sss", "ph", "pag", "tax"] as const).map((k) => ({ key: k, label: { sss: "SSS", ph: "PhilHealth", pag: "Pag-IBIG", tax: "Tax" }[k], align: "right" as const, hideOnMobile: true, render: (l: Line) => mono(l[k]) })),
                  { key: "net", label: "Net pay", align: "right", render: (l) => <span><span className="block font-mono text-ink">{peso(l.net)}</span>{l.adj !== 0 && <span className="block text-[0.64rem] text-mist">{`${signed(l.adj)} adj.`}</span>}</span> },
                ]}
              />
              <p className="mt-2 text-[0.72rem] text-mist">{`Sample contribution rates. Employer share this cutoff: SSS ${peso(sum(lines, "sssER"))} · PhilHealth ${peso(sum(lines, "phER"))} · Pag-IBIG ${peso(sum(lines, "pagER"))}.`}</p>
            </>
          )}
          {payView === "variance" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="Net pay, Oct 1–15" value={peso(sum(PREV.lines, "net"))} />
                <Stat label="Net pay, Oct 16–31" value={peso(sum(lines, "net"))} />
                <Stat label="Change" value={signed(netChange)} sub={pct((netChange / sum(PREV.lines, "net")) * 100)} />
                <Stat label="Changes over 5%" value={String(flagged.length)} sub="Check before approving" tone={flagged.length ? "bad" : "good"} />
              </div>
              <Table
                rows={[...variance].sort((a, b) => Math.abs(b.share) - Math.abs(a.share))}
                rowKey={(v) => v.l.staffId}
                onRowClick={(v) => app.open("payslip", `${v.l.staffId}|${CUTOFF.id}`, nameOf(v.l.staffId))}
                columns={[
                  { key: "name", label: "Staff", render: (v) => <span className="text-ink">{nameOf(v.l.staffId)}</span> },
                  { key: "prev", label: "Oct 1–15", align: "right", hideOnMobile: true, render: (v) => mono(v.p?.net ?? 0) },
                  { key: "now", label: "Oct 16–31", align: "right", hideOnMobile: true, render: (v) => mono(v.l.net) },
                  { key: "chg", label: "Change", align: "right", render: (v) => <span className={cn("font-mono", v.flagged && (v.change < 0 ? "text-danger" : "text-warn"))}>{`${signed(v.change)} · ${pct(v.share)}`}</span> },
                  { key: "why", label: "Reason", render: (v) => (v.why ? <span className="text-[0.74rem]">{v.why}</span> : <span className="text-mist">No change</span>) },
                ]}
              />
            </>
          )}
          {payView === "thirteenth" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="Projected 13th month" value={peso(thirteenth.reduce((t, x) => t + x.amount, 0))} sub="Basic pay for 2026 ÷ 12" />
                <Stat label="Accrued to Oct 31" value={peso(thirteenth.reduce((t, x) => t + x.accrued, 0))} />
                <Stat label="Payout" value="Dec 15" sub="Legal deadline Dec 24" />
                <Stat label="Tax-exempt up to" value={peso(90000)} sub="No one is over the cap" tone="good" />
              </div>
              <Table
                rows={thirteenth}
                rowKey={(x) => x.s.id}
                onRowClick={(x) => openProfile(x.s, "pay")}
                columns={[
                  { key: "name", label: "Staff", render: (x) => <span className="text-ink">{x.s.name}</span> },
                  { key: "months", label: "Months in 2026", align: "right", hideOnMobile: true, render: (x) => <span className="font-mono">{x.months.toFixed(1)}</span> },
                  { key: "earned", label: "Basic to Oct 31", align: "right", hideOnMobile: true, render: (x) => mono(x.earned) },
                  { key: "amount", label: "13th month", align: "right", render: (x) => <span className="font-mono text-ink">{peso(x.amount)}</span> },
                  { key: "status", label: "Status", render: (x) => (x.s.leaving ? <Status tone="muted">In final pay</Status> : thirteenthSet ? <Status tone="good">Scheduled Dec 15</Status> : <Status tone="muted">Not scheduled</Status>) },
                ]}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[0.72rem] text-mist">Prorated for staff hired this year. Includes the Oct 16 salary change.</p>
                {!thirteenthSet && <PrimaryButton onClick={() => { setThirteenthSet(true); app.notify(`13th month of ${peso(thirteenth.filter((x) => !x.s.leaving).reduce((t, x) => t + x.amount, 0))} scheduled for Dec 15`); }}>Schedule payout</PrimaryButton>}
              </div>
            </>
          )}
          {payView === "history" && (
            <div className="flex flex-col gap-3">
              <Panel title="Net pay by cutoff">
                <Bars height="h-24" format={(n) => `${Math.round(n / 1000)}k`} data={[...PAST.map((r) => ({ label: r.short, value: sum(r.lines, "net") })), { label: "Oct 16", value: sum(lines, "net") }]} />
              </Panel>
              <Table
                rows={[runFor(CUTOFF.id), ...[...PAST].reverse()].flatMap((r) => (r ? [r] : []))}
                rowKey={(r) => r.id}
                onRowClick={(r) => app.open("run", r.id, r.period)}
                columns={[
                  { key: "period", label: "Cutoff", render: (r) => <span className="text-ink">{r.period}</span> },
                  { key: "paid", label: "Pay date", hideOnMobile: true, render: (r) => fmtDay(r.paid) },
                  { key: "gross", label: "Gross", align: "right", render: (r) => mono(sum(r.lines, "gross")) },
                  { key: "net", label: "Net", align: "right", hideOnMobile: true, render: (r) => mono(sum(r.lines, "net")) },
                  { key: "status", label: "Status", render: (r) => runStatus(r.id) },
                ]}
              />
            </div>
          )}
        </>
      )}

      {app.screen === "run" && slipRun && (
        <>
          <ScreenHeader title={`Pay run · ${slipRun.period}`} subtitle={`Pay date ${fmtDay(slipRun.paid)} · ${slipRun.lines.length} staff`} action={<SmallButton onClick={() => app.notify(`Payroll register for ${slipRun.period} saved as PDF`)}><Download size={12} /> Payroll register</SmallButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Gross pay" value={peso(sum(slipRun.lines, "gross"))} />
            <Stat label="Employee contributions" value={peso(employeeShare(slipRun.lines))} />
            <Stat label="Withholding tax" value={peso(sum(slipRun.lines, "tax"))} />
            <Stat label="Net pay" value={peso(sum(slipRun.lines, "net"))} />
          </div>
          <Table
            rows={slipRun.lines}
            rowKey={(l) => l.staffId}
            onRowClick={(l) => app.open("payslip", `${l.staffId}|${slipRun.id}`, nameOf(l.staffId))}
            columns={[
              { key: "name", label: "Staff", render: (l) => <span className="text-ink">{nameOf(l.staffId)}</span> },
              { key: "gross", label: "Gross", align: "right", render: (l) => mono(l.gross) },
              { key: "ded", label: "Deductions", align: "right", hideOnMobile: true, render: (l) => mono(l.sss + l.ph + l.pag + l.tax) },
              { key: "net", label: "Net pay", align: "right", render: (l) => <span className="font-mono text-ink">{peso(l.net)}</span> },
            ]}
          />
        </>
      )}

      {app.screen === "payslip" && slip && slipRun && slipStaff && (
        <>
          <ScreenHeader
            title={`Payslip · ${slipRun.period}`}
            subtitle={`${slipStaff.name} · ${slipStaff.role} · Paid through ${slipStaff.payout}`}
            action={
              <>
                <SmallButton onClick={() => app.notify(`Payslip saved as PDF`)}><Download size={12} /> PDF</SmallButton>
                <SmallButton onClick={() => app.notify(`Payslip sent to ${firstName(slipStaff.name).toLowerCase()}@gracefellowship.ph`)}><Mail size={12} /> Email payslip</SmallButton>
              </>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
            <Panel title="Earnings and deductions" action={runStatus(slipRun.id)}>
              <ul className="flex flex-col">
                <PayLine label="Basic pay, semi-monthly" value={peso(slip.basic)} />
                {slip.ot > 0 && <PayLine label="Overtime and rest day pay" value={`+${peso(slip.ot)}`} />}
                {slip.less > 0 && <PayLine label="Lates and unpaid absences" value={minus(slip.less)} />}
                <PayLine label="Gross pay" value={peso(slip.gross)} muted />
                <PayLine label="SSS" value={minus(slip.sss)} />
                <PayLine label="PhilHealth" value={minus(slip.ph)} />
                <PayLine label="Pag-IBIG" value={minus(slip.pag)} />
                <PayLine label="Withholding tax" value={minus(slip.tax)} />
                {slipRun.id === CUTOFF.id
                  ? adjustments.filter((a) => a.staffId === slip.staffId).map((a) => <PayLine key={a.id} label={a.label} value={signed(a.amount)} />)
                  : slip.adj !== 0 && <PayLine label={slip.adj < 0 ? "Cash advance repayment" : "Adjustments"} value={signed(slip.adj)} />}
                <PayLine strong label="Net pay" value={peso(slip.net)} />
              </ul>
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Employer share">
                <KeyValues items={[["SSS and EC", peso(slip.sssER)], ["PhilHealth", peso(slip.phER)], ["Pag-IBIG", peso(slip.pagER)], ["Total", peso(slip.sssER + slip.phER + slip.pagER)]]} />
              </Panel>
              <Panel title="Taxable income">
                <KeyValues items={[["Gross pay", peso(slip.gross)], ["Less contributions", minus(slip.sss + slip.ph + slip.pag)], ["Taxable", peso(slip.gross - slip.sss - slip.ph - slip.pag)], ["Tax withheld", peso(slip.tax)]]} />
                <p className="mt-3 text-[0.7rem] text-mist">Sample contribution rates and the semi-monthly withholding table.</p>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---- Government remittances ---- */}
      {app.screen === "remittances" && (
        <>
          <ScreenHeader title="Remittances · October 2026" subtitle={run === "Draft" ? "From the Oct 1–15 and Oct 16–31 runs. Oct 16–31 is still in draft." : "From the Oct 1–15 and Oct 16–31 runs. Both are approved."} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Due in November" value={peso(AGENCIES.reduce((t, a) => t + remit(a, octLines).total, 0))} sub="Employee and employer share" />
            <Stat label="Employer share" value={peso(AGENCIES.reduce((t, a) => t + remit(a, octLines).er, 0))} sub="Church cost on top of pay" />
            <Stat label="Filed" value={`${AGENCIES.length - unfiled.length} of ${AGENCIES.length}`} tone={unfiled.length ? undefined : "good"} sub={unfiled.length ? `Next: ${unfiled[0].name.split(" ")[0]}, ${fmt(unfiled[0].due)}` : "All filed"} />
            <Stat label="Tax withheld, October" value={peso(remit(AGENCIES[0], octLines).total)} sub="BIR 1601-C" />
          </div>
          <Table
            rows={AGENCIES}
            rowKey={(a) => a.id}
            onRowClick={(a) => app.open("remit", a.id, a.name)}
            columns={[
              { key: "name", label: "Agency", render: (a) => <span><span className="block text-ink">{a.name}</span><span className="block text-[0.68rem] text-mist">{a.form}</span></span> },
              { key: "ee", label: "Employee", align: "right", hideOnMobile: true, render: (a) => mono(remit(a, octLines).ee) },
              { key: "er", label: "Employer", align: "right", hideOnMobile: true, render: (a) => (a.id === "bir" ? "—" : mono(remit(a, octLines).er)) },
              { key: "total", label: "Total", align: "right", render: (a) => <span className="font-mono text-ink">{peso(remit(a, octLines).total)}</span> },
              { key: "due", label: "Due", render: (a) => <span><span className="block">{fmt(a.due)}</span><span className="block text-[0.64rem] text-mist">{a.note ?? `${daysUntil(a.due)} days left`}</span></span> },
              {
                key: "status",
                label: "Status",
                render: (a) => {
                  const f = filings[a.id];
                  return f ? <Status tone="good">{`Filed ${fmt(f.date)}`}</Status> : <SmallButton onClick={() => openFiling(a)}><Check size={12} /> Mark filed</SmallButton>;
                },
              },
            ]}
          />
          <p className="mt-2 mb-3 text-[0.72rem] text-mist">Sample contribution rates and due dates. Set yours from your employer numbers.</p>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
            <Panel title="Filed">
              <Rows>
                {FILED.flatMap((m) => AGENCIES.map((a) => (
                  <Row key={`${m.month}-${a.id}`} title={`${a.name} · ${m.month}`} sub={`Ref ${a.code}-${m.month === "September" ? "2609" : "2608"}-${String(3900 + AGENCIES.indexOf(a) * 211)} · Filed ${fmt(m.dates[a.id])}`}>
                    <span className="font-mono text-[0.78rem] text-ink">{peso(remit(a, m.lines).total)}</span>
                  </Row>
                )))}
              </Rows>
            </Panel>
            <Panel title="Year-end">
              <Rows>
                <Row title="13th month pay" sub="Release by Dec 24"><Status tone={thirteenthSet ? "good" : "muted"}>{thirteenthSet ? "Scheduled" : "Dec 15"}</Status></Row>
                <Row title="BIR Form 2316 to each staff" sub="By Jan 31, 2027"><Status tone="muted">{`${staff.length} forms`}</Status></Row>
                <Row title="BIR 1604-C and alphalist" sub="By Jan 31, 2027"><Status tone="muted">Not started</Status></Row>
                <Row title="Annualized tax adjustment" sub="December payroll"><Status tone="muted">Auto</Status></Row>
              </Rows>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "remit" && ag && (
        <>
          <ScreenHeader
            title={`${ag.name} · October 2026`}
            subtitle={`${ag.form} · Due ${fmtDay(ag.due)}${filings[ag.id] ? ` · Filed ${fmt(filings[ag.id]?.date ?? TODAY)}, ref ${filings[ag.id]?.ref}` : ""}`}
            action={
              <>
                <SmallButton onClick={() => app.notify(`${ag.form} for October saved as CSV`)}><Download size={12} /> Download {ag.form}</SmallButton>
                {!filings[ag.id] && <PrimaryButton onClick={() => openFiling(ag)}><Check size={14} /> Mark filed</PrimaryButton>}
              </>
            }
          />
          <Table
            rows={staff}
            rowKey={(s) => s.id}
            onRowClick={(s) => openProfile(s, "pay")}
            columns={[
              { key: "name", label: "Staff", render: (s) => <span className="text-ink">{s.name}</span> },
              { key: "id", label: ag.id === "bir" ? "TIN" : "Member no.", hideOnMobile: true, render: (s) => <span className="font-mono">{govNo(s, ag.idKey)}</span> },
              { key: "a", label: ag.id === "bir" ? "Oct 1–15" : "Employee", align: "right", render: (s) => { const p = lineFor(PREV.lines, s.id); const c = lineFor(lines, s.id); return mono(ag.id === "bir" ? (p?.tax ?? 0) : (p ? ag.ee(p) : 0) + (c ? ag.ee(c) : 0)); } },
              { key: "b", label: ag.id === "bir" ? "Oct 16–31" : "Employer", align: "right", render: (s) => { const p = lineFor(PREV.lines, s.id); const c = lineFor(lines, s.id); return mono(ag.id === "bir" ? (c?.tax ?? 0) : (p ? ag.er(p) : 0) + (c ? ag.er(c) : 0)); } },
              { key: "t", label: "Total", align: "right", render: (s) => <span className="font-mono text-ink">{peso(remit(ag, octLines.filter((l) => l.staffId === s.id)).total)}</span> },
            ]}
          />
          <p className="mt-2 text-[0.72rem] text-mist">{`Total ${peso(remit(ag, octLines).total)}. Sample contribution rates. Matches the deductions on each October payslip.`}</p>
        </>
      )}

      {/* ---- Performance ---- */}
      {app.screen === "performance" && (() => {
        const rows = reviews.filter((r) => reviewView === "all" || (reviewView === "probation" ? r.kind === "Probation" : r.manager !== "Submitted"));
        const goalAvg = Math.round(goals.reduce((t, g) => t + g.progress, 0) / (goals.length || 1));
        return (
          <>
            <ScreenHeader title="Reviews" subtitle="2026 annual review · Self reviews close Nov 6 · Manager reviews due Nov 20" action={<Segmented id="hris-reviews" value={reviewView} onChange={setReviewView} options={[{ id: "all", label: "All" }, { id: "probation", label: "Probation" }, { id: "open", label: "Not submitted" }]} />} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
              <Stat label="Self reviews" value={`${reviews.filter((r) => r.self === "Submitted").length} of ${reviews.length}`} sub="Submitted" />
              <Stat label="Manager reviews" value={`${reviews.filter((r) => r.manager === "Submitted").length} of ${reviews.length}`} sub="Submitted" />
              <Stat label="Probation reviews" value={String(reviews.filter((r) => r.kind === "Probation" && !r.outcome).length)} sub="Decide before day 180" tone="bad" />
              <Stat label="Goal progress" value={`${goalAvg}%`} sub={`${goals.length} goals`} />
            </div>
            <Table
              rows={rows}
              rowKey={(r) => r.staffId}
              onRowClick={(r) => app.open("review", r.staffId, nameOf(r.staffId))}
              columns={[
                { key: "name", label: "Staff", render: (r) => <span className="flex items-center gap-2"><Avatar name={nameOf(r.staffId)} size={24} /><span className="text-ink">{nameOf(r.staffId)}</span></span> },
                { key: "kind", label: "Review", hideOnMobile: true, render: (r) => <span><span className="block">{r.kind}</span><span className="block text-[0.66rem] text-mist">{`Due ${fmt(r.due)}`}</span></span> },
                { key: "by", label: "Reviewer", hideOnMobile: true, render: (r) => { const m = byId(r.staffId)?.manager; return m ? nameOf(m) : "Elder board"; } },
                { key: "self", label: "Self", render: (r) => <Status tone={r.self === "Submitted" ? "good" : "muted"}>{r.self}</Status> },
                { key: "mgr", label: "Manager", render: (r) => <Status tone={r.manager === "Submitted" ? "good" : r.manager === "Draft" ? "warn" : "muted"}>{r.outcome ?? r.manager}</Status> },
                { key: "rating", label: "Rating", align: "right", render: (r) => <span className="font-mono">{r.manager === "Submitted" ? avgRating(r).toFixed(1) : "—"}</span> },
              ]}
            />
          </>
        );
      })()}

      {app.screen === "review" && rs && review && (() => {
        const mine = goals.filter((g) => g.staffId === rs.id);
        const submitted = review.manager === "Submitted";
        const complete = COMPETENCIES.every((c) => review.ratings[c]);
        return (
          <>
            <ScreenHeader
              title={rs.name}
              subtitle={`${review.kind} review · Due ${fmtDay(review.due)} · Reviewer ${rs.manager ? nameOf(rs.manager) : "Elder board"}`}
              action={
                <>
                  {review.kind === "Probation" && !review.outcome && <SmallButton onClick={() => { updateReview(rs.id, { outcome: "Regularization recommended" }); app.notify(`${firstName(rs.name)} recommended for regular status from ${fmt(addMonths(rs.hired, 6))}`); }}><Check size={12} /> Recommend regularization</SmallButton>}
                  <PrimaryButton disabled={submitted || !complete} onClick={() => { updateReview(rs.id, { manager: "Submitted" }); app.notify(`Review for ${rs.name} submitted. Shared with ${firstName(rs.name)}.`); }}><Send size={14} /> {submitted ? "Submitted" : "Submit review"}</PrimaryButton>
                </>
              }
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Panel title="Ratings" action={<span className="text-[0.72rem] text-mist">{complete ? `Overall ${avgRating(review).toFixed(1)} of 5` : "1 needs work · 5 exceptional"}</span>}>
                <div className="flex flex-col gap-2.5">
                  {COMPETENCIES.map((c) => (
                    <div key={c} className="flex items-center justify-between gap-3">
                      <span className="text-[0.8rem] text-ink">{c}</span>
                      <span className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" disabled={submitted} aria-pressed={review.ratings[c] === n} aria-label={`${c}: ${n}`} onClick={() => updateReview(rs.id, { manager: "Draft", ratings: { ...review.ratings, [c]: n } })} className={cn("w-7 h-7 rounded-md border text-[0.74rem] font-medium transition-colors cursor-pointer disabled:cursor-default", review.ratings[c] === n ? "bg-gold border-gold text-sheet" : "border-rule text-graphite hover:border-mist")}>
                            {n}
                          </button>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Review status">
                <KeyValues
                  items={[
                    ["Self review", review.self === "Submitted" ? <Status key="s" tone="good">Submitted</Status> : <SmallButton key="s" onClick={() => app.notify(`Reminder sent to ${firstName(rs.name)} in the staff app`)}><Send size={12} /> Send reminder</SmallButton>],
                    ["Manager review", <Status key="m" tone={submitted ? "good" : review.manager === "Draft" ? "warn" : "muted"}>{review.manager}</Status>],
                    ...(review.kind === "Probation" ? ([["Probation ends", fmtYear(addMonths(rs.hired, 6))]] as [string, string][]) : []),
                    ...(review.outcome ? ([["Outcome", review.outcome]] as [string, string][]) : []),
                    ["Employment", rs.type],
                  ]}
                />
              </Panel>
              <Panel title={`Goals · ${mine.length}`} action={<SmallButton onClick={() => { setGoalDraft({ title: "", due: "2026-12-31" }); setModal("goal"); }}><Plus size={12} /> Add goal</SmallButton>}>
                <div className="flex flex-col gap-3">
                  {mine.map((g) => (
                    <div key={g.id}>
                      <div className="flex items-center justify-between gap-2 text-[0.78rem] mb-1">
                        <span className="text-ink min-w-0">{g.title}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-graphite">{`${g.progress}%`}</span>
                          <SmallButton disabled={g.progress >= 100} label={`Add progress to ${g.title}`} onClick={() => setGoals((list) => list.map((x) => (x.id === g.id ? { ...x, progress: Math.min(100, x.progress + 10) } : x)))}>+10%</SmallButton>
                        </span>
                      </div>
                      <Meter value={g.progress} max={100} />
                      <span className="block mt-0.5 text-[0.66rem] text-mist">{`Due ${fmtYear(g.due)}`}</span>
                    </div>
                  ))}
                  {mine.length === 0 && <span className="text-[0.78rem] text-mist">No goals yet.</span>}
                </div>
              </Panel>
              <Panel title="Manager notes">
                <Rows>
                  {review.notes.map((n, i) => <Row key={i} title={n.text} sub={`${n.by} · ${fmt(n.date)}`} />)}
                  {review.notes.length === 0 && <li className="py-2 text-[0.78rem] text-mist">No notes yet. Notes stay private until the review is shared.</li>}
                </Rows>
                <div className="mt-3 flex flex-col gap-2">
                  <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="What went well, what to grow in" aria-label="Manager note" className={cn(textareaClass, "min-h-[3.5rem]")} />
                  <div className="flex justify-end">
                    <SmallButton disabled={!noteDraft.trim()} onClick={() => { updateReview(rs.id, { notes: [...review.notes, { text: noteDraft.trim(), by: "Tess Aquino", date: TODAY }] }); setNoteDraft(""); app.notify("Note added to the review"); }}>Add note</SmallButton>
                  </div>
                </div>
              </Panel>
            </div>
          </>
        );
      })()}

      {/* ---- Policies and announcements ---- */}
      {app.screen === "policies" && (
        <>
          <ScreenHeader title="Policies" subtitle="Announcements and policies staff read and acknowledge" action={<PrimaryButton onClick={() => setModal("post")}><Plus size={14} /> New post</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
            <Stat label="Posts" value={String(posts.length)} sub={`${posts.filter((p) => p.kind === "Policy").length} policies`} />
            <Stat label="Waiting on staff" value={String(posts.filter((p) => p.required).reduce((t, p) => t + recipients(p).filter((s) => !p.acks.includes(s.id)).length, 0))} sub="Required acknowledgments" tone="bad" />
            <Stat label="Fully acknowledged" value={String(posts.filter((p) => p.required && recipients(p).every((s) => p.acks.includes(s.id))).length)} tone="good" sub="Required policies" />
          </div>
          <Table
            rows={posts}
            rowKey={(p) => p.id}
            onRowClick={(p) => app.open("policy", p.id, p.title)}
            columns={[
              { key: "title", label: "Title", render: (p) => <span><span className="block text-ink">{p.title}</span><span className="block text-[0.68rem] text-mist">{`${p.kind} · ${p.audience}`}</span></span> },
              { key: "posted", label: "Posted", hideOnMobile: true, render: (p) => fmt(p.posted) },
              { key: "acks", label: "Read", render: (p) => { const n = recipients(p).filter((s) => p.acks.includes(s.id)).length; return <span className="flex items-center gap-2"><Meter value={n} max={recipients(p).length} className="w-14" /><span className="font-mono text-[0.72rem]">{`${n}/${recipients(p).length}`}</span></span>; } },
              { key: "status", label: "Status", render: (p) => { const left = recipients(p).filter((s) => !p.acks.includes(s.id)).length; return !p.required ? <Status tone="muted">Read receipts</Status> : left ? <Status tone="warn">{`${left} pending`}</Status> : <Status tone="good">Complete</Status>; } },
            ]}
          />
        </>
      )}

      {app.screen === "policy" && post && (() => {
        const people = recipients(post);
        const pending = people.filter((s) => !post.acks.includes(s.id));
        const setAcks = (acks: string[]) => setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, acks } : p)));
        return (
          <>
            <ScreenHeader title={post.title} subtitle={`${post.kind} · Posted ${fmtYear(post.posted)} · ${post.audience}${post.required ? " · Acknowledgment required" : ""}`} action={<SmallButton disabled={!pending.length} onClick={() => app.notify(`Reminder sent to ${pending.length} staff in the staff app`)}><Send size={12} /> Send reminder</SmallButton>} />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-3">
              <Panel title="Message">
                <p className="text-[0.82rem] leading-relaxed text-ink-soft">{post.body}</p>
                <p className="mt-3 text-[0.7rem] text-mist">Posted by Tess Aquino. Shown in the staff app until acknowledged.</p>
              </Panel>
              <Panel title={`${post.required ? "Acknowledged" : "Read"} · ${people.length - pending.length} of ${people.length}`}>
                <Rows>
                  {people.map((s) => (
                    <Row key={s.id} name={s.name} title={s.name} sub={s.role}>
                      {post.acks.includes(s.id) ? <Status tone="good">{post.required ? "Acknowledged" : "Read"}</Status> : <SmallButton onClick={() => { setAcks([...post.acks, s.id]); app.notify(`Paper signature recorded for ${s.name}`); }}>Record signature</SmallButton>}
                    </Row>
                  ))}
                </Rows>
              </Panel>
            </div>
          </>
        );
      })()}

      {/* ---- Onboarding, offboarding, volunteers ---- */}
      {app.screen === "onboarding" && (
        <>
          <ScreenHeader
            title="Onboarding"
            subtitle={peopleView === "hires" ? `${hireInfo.name} · ${hireInfo.role} · Starts ${fmtDay(hireInfo.start)}` : peopleView === "exits" ? `${leaver?.name ?? ""} · Last day ${leaver?.leaving ? fmtDay(leaver.leaving) : ""}` : "Kids and youth volunteers need training and a cleared NBI check"}
            action={peopleView === "hires" ? <PrimaryButton onClick={() => setModal("hire")}><UserPlus size={14} /> Add new hire</PrimaryButton> : undefined}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Segmented id="hris-people" value={peopleView} onChange={setPeopleView} options={[{ id: "hires", label: "New hires" }, { id: "exits", label: "Offboarding" }, { id: "volunteers", label: "Volunteers" }]} />
            {peopleView === "hires" && <Segmented id="hris-hire" value={hireInfo.id} onChange={setHire} options={hires.map((h) => ({ id: h.id, label: firstName(h.name) }))} />}
          </div>
          {peopleView === "hires" && (
            <>
              <Panel className="mb-3">
                <div className="flex items-center justify-between gap-3 mb-2 text-[0.8rem]">
                  <span className="text-ink">{`${hireDone.length} of ${TASKS.length} tasks done · Starts in ${daysUntil(hireInfo.start)} days`}</span>
                  {hireDone.length === TASKS.length ? <Status tone="good">Ready for day one</Status> : <SmallButton onClick={() => app.notify(`Reminders sent for ${TASKS.length - hireDone.length} open tasks`)}><Send size={12} /> Send reminders</SmallButton>}
                </div>
                <Meter value={hireDone.length} max={TASKS.length} />
              </Panel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {["Before day one", "First week"].map((phase) => (
                  <Panel key={phase} title={phase}>
                    <Rows>
                      {TASKS.filter((t) => t.phase === phase).map((t) => <CheckItem key={t.id} on={hireDone.includes(t.id)} label={t.label} meta={t.owner === "New hire" ? firstName(hireInfo.name) : t.owner} onToggle={() => toggleTask(t.id)} />)}
                    </Rows>
                  </Panel>
                ))}
              </div>
            </>
          )}
          {peopleView === "exits" && leaver && finalPay && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Panel title={`Exit checklist · ${exitDone.length} of ${EXIT_TASKS.length}`}>
                <Meter value={exitDone.length} max={EXIT_TASKS.length} className="mb-2" />
                <Rows>
                  {EXIT_TASKS.map((t) => <CheckItem key={t.id} on={exitDone.includes(t.id)} label={t.label} meta={t.owner} onToggle={() => toggleExit(t.id)} />)}
                </Rows>
              </Panel>
              <Panel title="Final pay" action={<span className="text-[0.7rem] text-mist">Release by Dec 13</span>}>
                <ul className="flex flex-col">
                  {finalPay.items.map(([label, n]) => <PayLine key={label} label={label} value={n < 0 ? minus(-n) : peso(n)} />)}
                  <PayLine strong label="Final pay" value={peso(finalPay.total)} />
                </ul>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <SmallButton disabled={exitDone.includes("x7")} onClick={() => toggleExit("x7", `Certificate of employment for ${leaver.name} issued`)}><FileText size={12} /> Issue certificate</SmallButton>
                  <PrimaryButton disabled={exitDone.includes("x6")} onClick={() => toggleExit("x6", `Final pay of ${peso(finalPay.total)} approved for ${leaver.name}`)}><Check size={14} /> {exitDone.includes("x6") ? "Final pay approved" : "Approve final pay"}</PrimaryButton>
                </div>
                <p className="mt-2 text-[0.7rem] text-mist">Final pay is due within 30 days of separation. Sick leave does not convert.</p>
              </Panel>
            </div>
          )}
          {peopleView === "volunteers" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[0.78rem] text-graphite">{`${volunteers.filter(isReady).length} of ${volunteers.length} ready to serve · ${volunteers.filter((v) => withKids(v) && !isReady(v)).length} kids and youth volunteers on hold`}</span>
                <Segmented id="hris-vol" value={volView} onChange={setVolView} options={[{ id: "all", label: "All" }, { id: "kids", label: "Kids and youth" }, { id: "hold", label: "On hold" }]} />
              </div>
              <Table
                rows={volunteers.filter((v) => volView === "all" || (volView === "kids" ? withKids(v) : !isReady(v)))}
                rowKey={(v) => v.id}
                empty="Everyone is cleared to serve."
                columns={[
                  { key: "name", label: "Volunteer", render: (v) => <span><span className="block text-ink">{v.name}</span><span className="block text-[0.7rem] text-mist">{v.ministry}</span></span> },
                  { key: "training", label: "Training", render: (v) => (v.trained ? <Status tone="good">{withKids(v) ? "Child protection" : "Orientation"}</Status> : <SmallButton onClick={() => updateVolunteer(v, { trained: true }, `${v.name} marked trained. Certificate saved.`)}><Check size={12} /> Mark trained</SmallButton>) },
                  {
                    key: "check",
                    label: "NBI clearance",
                    render: (v) => (
                      <span className="flex flex-wrap items-center gap-2">
                        <Status tone={v.check === "Cleared" && v.expires && daysUntil(v.expires) <= 30 ? "warn" : checkTone(v.check)}>{v.check === "Cleared" && v.expires ? `Valid to ${fmt(v.expires)}` : v.check}</Status>
                        {(v.check === "Not started" || v.check === "Expired") && <SmallButton onClick={() => updateVolunteer(v, { check: "Pending" }, `NBI clearance request sent to ${firstName(v.name)}`)}>Request</SmallButton>}
                        {v.check === "Pending" && <SmallButton onClick={() => updateVolunteer(v, { check: "Cleared", expires: "2027-10-29" }, `${v.name} cleared until Oct 29, 2027`)}>Mark cleared</SmallButton>}
                      </span>
                    ),
                  },
                  { key: "serve", label: "Serving", render: (v) => (isReady(v) ? <Status tone="good">Ready</Status> : <Status tone="bad">On hold</Status>) },
                ]}
              />
            </>
          )}
        </>
      )}

      {/* ---- Slide-overs ---- */}
      <ProtoModal open={modal === "upload" && !!sp} title={`Upload to 201 file · ${sp?.name ?? ""}`} onClose={close} footer={<PrimaryButton onClick={() => sp && uploadDoc(sp)} disabled={EXPIRING.includes(upload.kind) && !upload.expires}><Upload size={14} /> Upload</PrimaryButton>}>
        <Field label="Document type">
          <select value={upload.kind} onChange={(e) => setUpload({ ...upload, kind: e.target.value })} className={inputClass}>{(sp ? requiredDocs(sp) : DOC_KINDS).map((k) => <option key={k}>{k}</option>)}</select>
        </Field>
        <Field label="File (PDF or photo)">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0]?.name ?? "" })} className="text-[0.75rem] text-graphite file:mr-3 file:px-2.5 file:py-1 file:rounded-md file:border file:border-rule file:bg-transparent file:text-ink file:text-[0.72rem] file:cursor-pointer" />
        </Field>
        {EXPIRING.includes(upload.kind) && (
          <Field label="Valid until">
            <input type="date" value={upload.expires} onChange={(e) => setUpload({ ...upload, expires: e.target.value })} className={inputClass} />
          </Field>
        )}
        <p className="text-[0.72rem] text-mist">{sp && docsOf(sp.id).some((d) => d.kind === upload.kind) ? `Replaces the ${upload.kind.toLowerCase()} on file.` : "Expiring documents raise an alert 30 days before."}</p>
      </ProtoModal>

      <ProtoModal open={modal === "leave"} title="File leave" onClose={close} footer={<PrimaryButton onClick={fileLeave} disabled={!draftDays.length || draftDays.length > draftLeft}>Submit request</PrimaryButton>}>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <Field label="Staff member">
            <select value={leaveDraft.staffId} onChange={(e) => setLeaveDraft({ ...leaveDraft, staffId: e.target.value })} className={inputClass}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </Field>
          <Field label="Type">
            <select value={leaveDraft.type} onChange={(e) => setLeaveDraft({ ...leaveDraft, type: e.target.value as LeaveType })} className={inputClass}><option>Vacation</option><option>Sick</option><option>Bereavement</option></select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><input type="date" value={leaveDraft.from} onChange={(e) => setLeaveDraft({ ...leaveDraft, from: e.target.value })} className={inputClass} /></Field>
          <Field label="To"><input type="date" value={leaveDraft.to} onChange={(e) => setLeaveDraft({ ...leaveDraft, to: e.target.value })} className={inputClass} /></Field>
        </div>
        <Field label="Reason">
          <input value={leaveDraft.reason} onChange={(e) => setLeaveDraft({ ...leaveDraft, reason: e.target.value })} placeholder="Family event in Pampanga" className={inputClass} />
        </Field>
        <p className={cn("text-[0.72rem]", !draftDays.length || draftDays.length > draftLeft ? "text-danger" : "text-mist")}>
          {draftDays.length ? `${draftDays.length} working ${draftDays.length === 1 ? "day" : "days"}` : "Pick a valid date range"}
          {` · ${draftLeft} ${leaveDraft.type === "Bereavement" ? "days allowed per event" : `${leaveDraft.type.toLowerCase()} days left`}`}
          {draftDays.length > draftLeft ? ". Not enough credits." : ""}
        </p>
        {draftHolidays.length > 0 && <p className="text-[0.72rem] text-mist">{`Skips ${draftHolidays.map((h) => `${fmt(h.date)}, ${h.name}`).join(" and ")}.`}</p>}
      </ProtoModal>

      <ProtoModal open={modal === "approve"} title={`Review pay run · ${CUTOFF.period}`} onClose={close} footer={<><SmallButton onClick={close}>Keep editing</SmallButton><PrimaryButton onClick={approveRun}><Check size={14} /> Approve pay run</PrimaryButton></>}>
        <KeyValues
          items={[
            ["Staff", String(staff.length)],
            ["Gross pay", peso(sum(liveLines, "gross"))],
            ["SSS", peso(sum(liveLines, "sss"))],
            ["PhilHealth", peso(sum(liveLines, "ph"))],
            ["Pag-IBIG", peso(sum(liveLines, "pag"))],
            ["Withholding tax", peso(sum(liveLines, "tax"))],
            ["Adjustments", signed(sum(liveLines, "adj"))],
            ["Net pay", <span key="net" className="font-semibold">{peso(sum(liveLines, "net"))}</span>],
          ]}
        />
        <div className="rounded-lg border border-rule">
          <div className="px-3 py-2 border-b border-rule text-[0.78rem] font-semibold text-ink">Variance checks</div>
          <ul className="px-3 divide-y divide-rule-soft">
            {[
              { label: "Net pay vs Oct 1–15", tone: (Math.abs(netChange / sum(PREV.lines, "net")) > 0.05 ? "warn" : "good") as Tone, text: `${signed(netChange)} · ${pct((netChange / sum(PREV.lines, "net")) * 100)}` },
              { label: "Staff changed over 5%", tone: (flagged.length ? "warn" : "good") as Tone, text: flagged.length ? `${flagged.length} staff` : "None" },
              { label: "Salary changes", tone: "muted" as Tone, text: variance.filter((v) => v.reasons.includes("salary change")).map((v) => firstName(nameOf(v.l.staffId))).join(", ") || "None" },
              { label: "Overtime not yet approved", tone: (pendingOtCutoff.length ? "warn" : "good") as Tone, text: pendingOtCutoff.length ? `${pendingOtCutoff.length}, not included` : "None" },
              { label: "Unpaid absences", tone: (absentDays ? "warn" : "good") as Tone, text: absentDays ? `${absentDays} ${absentDays === 1 ? "day" : "days"}` : "None" },
              { label: "Payout accounts", tone: "good" as Tone, text: `${staff.length} of ${staff.length} on file` },
            ].map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 py-2 text-[0.78rem]">
                <span className="text-ink-soft">{c.label}</span>
                <Status tone={c.tone}>{c.text}</Status>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[0.72rem] text-mist">Approving locks the pay run. Later changes go to the Nov 1–15 cutoff. Sample contribution rates.</p>
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
        <p className="text-[0.72rem] text-mist">Non-taxable. Added after tax, so contributions and withholding stay the same.</p>
      </ProtoModal>

      <ProtoModal open={modal === "salary" && !!sp} title={`Change salary · ${sp?.name ?? ""}`} onClose={close} footer={<PrimaryButton onClick={() => sp && changeSalary(sp)} disabled={!Number(salaryDraft)}>Save salary</PrimaryButton>}>
        <Field label="New monthly basic (₱)">
          <input inputMode="numeric" value={salaryDraft} onChange={(e) => setSalaryDraft(e.target.value.replace(/\D/g, ""))} className={inputClass} />
        </Field>
        {sp && Number(salaryDraft) > 0 && (() => {
          const next = payLine(sp.id, Math.round(Number(salaryDraft) / 100) * 100);
          const now = payLine(sp.id, sp.monthly);
          return <KeyValues items={[["Effective", locked ? "Nov 1–15 cutoff" : "Oct 16–31 cutoff"], ["Current", `${peso(sp.monthly)} a month`], ["Net per cutoff", `${peso(next.net)} (${signed(next.net - now.net)} before OT and lates)`], ["Contributions", peso(next.sss + next.ph + next.pag)]]} />;
        })()}
      </ProtoModal>

      <ProtoModal open={modal === "ot"} title="File overtime" onClose={close} footer={<PrimaryButton onClick={fileOt} disabled={!Number(otDraft.hours) || !otDraft.reason.trim() || !validDate(otDraft.date)}>Submit for approval</PrimaryButton>}>
        <Field label="Staff member">
          <select value={otDraft.staffId} onChange={(e) => setOtDraft({ ...otDraft, staffId: e.target.value })} className={inputClass}>{staff.filter((s) => !s.exempt).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" value={otDraft.date} onChange={(e) => setOtDraft({ ...otDraft, date: e.target.value })} className={inputClass} /></Field>
          <Field label="Hours"><input inputMode="numeric" value={otDraft.hours} onChange={(e) => setOtDraft({ ...otDraft, hours: e.target.value.replace(/\D/g, "").slice(0, 2) })} className={inputClass} /></Field>
        </div>
        <Field label="Day type">
          <select value={otDraft.kind} onChange={(e) => setOtDraft({ ...otDraft, kind: e.target.value as OtKind })} className={inputClass}><option>Regular day</option><option>Rest day</option></select>
        </Field>
        <Field label="Reason">
          <input value={otDraft.reason} onChange={(e) => setOtDraft({ ...otDraft, reason: e.target.value })} placeholder="Sound check for the Sunday concert" className={inputClass} />
        </Field>
        {(() => {
          const s = byId(otDraft.staffId);
          return s && Number(otDraft.hours) > 0 ? <p className="text-[0.72rem] text-mist">{`About ${peso(otAmount({ ...otDraft, id: "", hours: Number(otDraft.hours), status: "Pending" }, s.monthly))} at ${otDraft.kind === "Rest day" ? "130%" : "125%"} of ${peso(dailyRate(s.monthly) / 8)} an hour. Managerial staff are not listed.`}</p> : null;
        })()}
      </ProtoModal>

      <ProtoModal open={modal === "expense"} title="Submit expense" onClose={close} footer={<PrimaryButton onClick={fileExpense} disabled={!Number(expDraft.amount) || !expDraft.note.trim() || !validDate(expDraft.date)}><Send size={14} /> Submit for approval</PrimaryButton>}>
        <Field label="Staff member">
          <select value={expDraft.staffId} onChange={(e) => setExpDraft({ ...expDraft, staffId: e.target.value })} className={inputClass}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={expDraft.category} onChange={(e) => setExpDraft({ ...expDraft, category: e.target.value as ExpenseCategory })} className={inputClass}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Amount (₱)">
            <input inputMode="numeric" value={expDraft.amount} onChange={(e) => setExpDraft({ ...expDraft, amount: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="1200" className={inputClass} />
          </Field>
        </div>
        <Field label="Date paid"><input type="date" value={expDraft.date} onChange={(e) => setExpDraft({ ...expDraft, date: e.target.value })} className={inputClass} /></Field>
        <Field label="What it was for"><input value={expDraft.note} onChange={(e) => setExpDraft({ ...expDraft, note: e.target.value })} placeholder="Tarps for the outreach booth" className={inputClass} /></Field>
        <Field label="Receipt (photo or PDF)">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setExpDraft({ ...expDraft, file: e.target.files?.[0]?.name ?? "" })} className="text-[0.75rem] text-graphite file:mr-3 file:px-2.5 file:py-1 file:rounded-md file:border file:border-rule file:bg-transparent file:text-ink file:text-[0.72rem] file:cursor-pointer" />
        </Field>
        <p className="text-[0.72rem] text-mist">{`Once approved, it is added to the ${locked ? "Nov 1–15" : "Oct 16–31"} pay run after tax. The receipt is kept with the claim.`}</p>
      </ProtoModal>

      <ProtoModal open={modal === "filing"} title={`Mark filed · ${AGENCIES.find((a) => a.id === filingDraft.agency)?.name ?? ""}`} onClose={close} footer={<PrimaryButton onClick={saveFiling} disabled={!filingDraft.ref.trim() || !validDate(filingDraft.date)}><Check size={14} /> Save filing</PrimaryButton>}>
        {(() => {
          const a = AGENCIES.find((x) => x.id === filingDraft.agency);
          return a ? <KeyValues items={[["Period", "October 2026"], ["Form", a.form], ["Employee share", peso(remit(a, octLines).ee)], ["Employer share", a.id === "bir" ? "—" : peso(remit(a, octLines).er)], ["Total paid", <span key="t" className="font-semibold">{peso(remit(a, octLines).total)}</span>]]} /> : null;
        })()}
        <Field label="Reference number">
          <input value={filingDraft.ref} onChange={(e) => setFilingDraft({ ...filingDraft, ref: e.target.value })} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Paid through">
            <select value={filingDraft.channel} onChange={(e) => setFilingDraft({ ...filingDraft, channel: e.target.value })} className={inputClass}>{["Online banking", "GCash", "Maya", "Over the counter"].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Date paid"><input type="date" value={filingDraft.date} onChange={(e) => setFilingDraft({ ...filingDraft, date: e.target.value })} className={inputClass} /></Field>
        </div>
        <p className="text-[0.72rem] text-mist">The receipt is saved with the filing. Ramon is notified.</p>
      </ProtoModal>

      <ProtoModal open={modal === "hire"} title="Add new hire" onClose={close} footer={<PrimaryButton onClick={addHire} disabled={!hireDraft.name.trim() || !hireDraft.role.trim() || !validDate(hireDraft.start)}><UserPlus size={14} /> Create checklist</PrimaryButton>}>
        <Field label="Full name"><input value={hireDraft.name} onChange={(e) => setHireDraft({ ...hireDraft, name: e.target.value })} placeholder="Miguel Ramos" className={inputClass} /></Field>
        <Field label="Role"><input value={hireDraft.role} onChange={(e) => setHireDraft({ ...hireDraft, role: e.target.value })} placeholder="Worship keyboardist" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Department">
            <select value={hireDraft.dept} onChange={(e) => setHireDraft({ ...hireDraft, dept: e.target.value as Dept })} className={inputClass}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select>
          </Field>
          <Field label="Start date"><input type="date" value={hireDraft.start} onChange={(e) => setHireDraft({ ...hireDraft, start: e.target.value })} className={inputClass} /></Field>
        </div>
        <p className="text-[0.72rem] text-mist">{`Creates a ${TASKS.length}-step checklist: contract, NBI and PSA documents, government numbers, payroll, and first-week orientation.`}</p>
      </ProtoModal>

      <ProtoModal open={modal === "goal" && !!rs} title={`Add goal · ${rs?.name ?? ""}`} onClose={close} footer={<PrimaryButton disabled={!goalDraft.title.trim() || !validDate(goalDraft.due)} onClick={() => { if (!rs || !goalDraft.title.trim() || !validDate(goalDraft.due)) return; setGoals((list) => [...list, { id: `g${Date.now()}`, staffId: rs.id, title: goalDraft.title.trim(), due: goalDraft.due, progress: 0 }]); close(); app.notify(`Goal added for ${firstName(rs.name)}`); }}><Plus size={14} /> Add goal</PrimaryButton>}>
        <Field label="Goal"><input value={goalDraft.title} onChange={(e) => setGoalDraft({ ...goalDraft, title: e.target.value })} placeholder="Disciple two new small group leaders" className={inputClass} /></Field>
        <Field label="Due"><input type="date" value={goalDraft.due} onChange={(e) => setGoalDraft({ ...goalDraft, due: e.target.value })} className={inputClass} /></Field>
      </ProtoModal>

      <ProtoModal open={modal === "post"} title="New post" onClose={close} footer={<PrimaryButton onClick={publish} disabled={!postDraft.title.trim() || !postDraft.body.trim()}><Megaphone size={14} /> Post to staff</PrimaryButton>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={postDraft.kind} onChange={(e) => setPostDraft({ ...postDraft, kind: e.target.value as PostKind })} className={inputClass}><option>Announcement</option><option>Policy</option></select>
          </Field>
          <Field label="Audience">
            <select value={postDraft.audience} onChange={(e) => setPostDraft({ ...postDraft, audience: e.target.value as Post["audience"] })} className={inputClass}>{["All staff", ...DEPTS].map((d) => <option key={d}>{d}</option>)}</select>
          </Field>
        </div>
        <Field label="Title"><input value={postDraft.title} onChange={(e) => setPostDraft({ ...postDraft, title: e.target.value })} placeholder="Office closed on Nov 2" className={inputClass} /></Field>
        <Field label="Message"><textarea value={postDraft.body} onChange={(e) => setPostDraft({ ...postDraft, body: e.target.value })} placeholder="What staff need to know" className={textareaClass} /></Field>
        <div className="flex items-center justify-between gap-3 text-[0.8rem] text-ink">
          <span>Require acknowledgment</span>
          <Toggle on={postDraft.required} onChange={(required) => setPostDraft({ ...postDraft, required })} label="Require acknowledgment" />
        </div>
        <p className="text-[0.72rem] text-mist">{`Goes to ${staff.filter((s) => postDraft.audience === "All staff" || s.dept === postDraft.audience).length} staff in the staff app.`}</p>
      </ProtoModal>
    </ProtoApp>
  );
}
