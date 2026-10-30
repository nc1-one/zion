"use client";

import React, { useState } from "react";
import {
  BarChart3,
  CalendarRange,
  Check,
  ClipboardCheck,
  Download,
  FileText,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Avatar,
  Bars,
  Field,
  KeyValues,
  Meter,
  Panel,
  PrimaryButton,
  ProtoApp,
  ProtoModal,
  ScreenHeader,
  Segmented,
  SmallButton,
  Stat,
  Status,
  Table,
  inputClass,
  textareaClass,
  useProtoApp,
} from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Types ------------------------------------------------------------------------

type MemberStatus = "Member" | "Regular" | "Guest";
type Role = "Head" | "Spouse" | "Adult" | "Child";
type Fund = "General" | "Missions" | "Building" | "Benevolence";
type Method = "GCash" | "Maya" | "Card" | "Bank" | "Cash" | "Check";
type Service = "9 AM" | "11 AM";
type Room = "Nursery" | "Preschool" | "Elementary";
type Tone = "good" | "warn" | "bad" | "muted";

interface Note { id: string; text: string; by: string; date: string }
interface Person {
  id: string; name: string; householdId: string; role: Role; status: MemberStatus; phone: string; email: string; groups: string[];
  joined: string; firstVisit?: string; weeksAway: number; age?: number; allergy?: string; notes: Note[];
  // Custom fields
  baptized: string; membershipClass: string; lifeGroup: string; skills: string;
}
interface Household { id: string; name: string; address: string }
interface FollowUp { id: string; personId: string; task: string; owner: string; due: string; done: boolean }
interface Gift { id: string; personId: string | null; fund: Fund; method: Method; amount: number; date: string; ref: string }
interface BatchItem { id: string; personId: string | null; method: "Cash" | "Check"; check?: string; fund: Fund; amount: number }
interface Batch { id: string; name: string; date: string; counted: number; counters: string; status: "Open" | "Committed"; items: BatchItem[] }
interface Recurring { id: string; personId: string; amount: number; fund: Fund; frequency: "Weekly" | "Twice a month" | "Monthly"; method: Method; next: string; status: "Active" | "Paused" | "Card expiring" }
interface Pledge { id: string; householdId: string; pledged: number; given: number }
interface CheckIn { id: string; name: string; personId?: string; household: string; age: number; room: Room; service: Service; code: string; time: string; guardian: string; allergy: string; out: boolean }
interface Attendee { id: string; name: string; personId?: string; paid: boolean; method?: Method; checkedIn: boolean }
interface ChurchEvent { id: string; name: string; date: string; location: string; capacity: number; price: number; opened: string; attendees: Attendee[]; waitlist: Attendee[] }
interface Slot { name: string | null; status: "Confirmed" | "Pending" | "Declined"; reason?: string }
interface Message { id: string; date: string; channel: "SMS" | "Email"; title: string; audience: string; recipients: number; rate: string }
interface Booking { id: string; title: string; room: string; day: number; start: number; end: number; by: string; status: "Booked" | "Pending" }

// ---- Helpers ----------------------------------------------------------------------

const peso = (n: number) => `₱${n.toLocaleString("en-US")}`;
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const first = (name: string) => name.split(" ")[0];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-10-25" → "Oct 25"; a bare year stays as is.
const fmt = (d: string) => (d.length <= 4 ? d : `${MONTHS[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}`);
const hr = (h: number) => `${Math.floor(h) % 12 || 12}${h % 1 ? ":30" : ""} ${h < 12 ? "AM" : "PM"}`;
const TODAY = "2026-10-29";
const SUNDAYS = ["2026-10-25", "2026-10-18", "2026-10-11", "2026-10-04", "2026-09-27", "2026-09-20", "2026-09-13", "2026-09-06"];
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
const REF_PREFIX: Record<Method, string> = { GCash: "GC", Maya: "MY", Card: "CD", Bank: "BT", Cash: "CS", Check: "CK" };
const refFor = (method: Method, n: number) => `${REF_PREFIX[method]}-${String(n).slice(-6)}`;
const roomFor = (age: number): Room => (age <= 2 ? "Nursery" : age <= 5 ? "Preschool" : "Elementary");
// Ids for records created in the demo. Kept out of render so components stay pure.
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
const newRef = (method: Method) => refFor(method, Date.now());
const FUNDS: Fund[] = ["General", "Missions", "Building", "Benevolence"];
const METHODS: Method[] = ["GCash", "Maya", "Card", "Bank", "Cash", "Check"];
const PAY_OPTIONS: (Method | "Unpaid")[] = ["GCash", "Maya", "Card", "Bank", "Unpaid"];
const BATCH_METHODS: BatchItem["method"][] = ["Cash", "Check"];
const STATUSES: MemberStatus[] = ["Guest", "Regular", "Member"];
const ROLES: Role[] = ["Child", "Spouse", "Adult"];

// ---- Sample data: Grace Fellowship, Quezon City -------------------------------------

const adult = (id: string, name: string, householdId: string, role: Role, status: MemberStatus, phone: string, groups: string[], joined: string, weeksAway: number, more: Partial<Person> = {}): Person => ({
  id, name, householdId, role, status, phone, groups, joined, weeksAway,
  email: `${name.toLowerCase().replace(/ /g, ".")}@gmail.com`,
  baptized: status === "Member" ? `Yes · ${joined}` : "Not yet",
  membershipClass: status === "Member" ? `Completed · ${joined}` : "Not yet",
  lifeGroup: "",
  skills: "",
  notes: [],
  ...more,
});

const kid = (id: string, name: string, householdId: string, age: number, allergy: string, more: Partial<Person> = {}): Person => ({
  id, name, householdId, role: "Child", status: "Member", phone: "—", email: "—", groups: ["Kids church"], joined: "", weeksAway: 0, age, allergy,
  baptized: "—", membershipClass: "—", lifeGroup: "", skills: "", notes: [],
  ...more,
});

const HOUSEHOLDS: Household[] = [
  { id: "h1", name: "Reyes", address: "Teachers Village East, Quezon City" },
  { id: "h2", name: "Santos", address: "Project 4, Quezon City" },
  { id: "h3", name: "Dela Cruz", address: "Marikina Heights, Marikina" },
  { id: "h4", name: "Garcia", address: "Cubao, Quezon City" },
  { id: "h5", name: "Mendoza", address: "Kamuning, Quezon City" },
  { id: "h6", name: "Ramos", address: "West Crame, San Juan" },
  { id: "h7", name: "Villanueva", address: "UP Village, Diliman" },
  { id: "h8", name: "Bautista", address: "Kapitolyo, Pasig" },
  { id: "h9", name: "Navarro", address: "Teachers Village West, Quezon City" },
  { id: "h10", name: "Castillo", address: "Highway Hills, Mandaluyong" },
  { id: "h11", name: "Aquino", address: "Sikatuna Village, Quezon City" },
  { id: "h12", name: "Lim", address: "Scout Area, Quezon City" },
  { id: "h13", name: "Ocampo", address: "San Roque, Antipolo" },
  { id: "h14", name: "Torres", address: "Cainta, Rizal" },
  { id: "h15", name: "Flores", address: "Loyola Heights, Quezon City" },
];

const PEOPLE: Person[] = [
  adult("p1", "Ana Reyes", "h1", "Spouse", "Member", "0917 555 0142", ["Worship team"], "2019", 0, { lifeGroup: "Teachers Village", skills: "Vocals, piano", notes: [{ id: "n1", text: "Leads Sunday 9 AM worship team.", by: "Pastor Joel", date: "2026-08-02" }] }),
  adult("p11", "Jun Reyes", "h1", "Head", "Member", "0917 555 0188", ["Ushers", "Men's group"], "2019", 0, { lifeGroup: "Teachers Village", skills: "Carpentry" }),
  kid("k1", "Mika Reyes", "h1", 7, "None", { joined: "2019" }),
  kid("k2", "Lucas Reyes", "h1", 4, "Peanuts", { joined: "2022" }),
  adult("p2", "Mark Santos", "h2", "Head", "Member", "0918 555 0193", ["Youth", "Worship team"], "2021", 0, { lifeGroup: "Project 4", skills: "Guitar, youth ministry" }),
  adult("p12", "Carla Santos", "h2", "Spouse", "Member", "0918 555 0127", ["Kids church", "Hospitality"], "2021", 0, { lifeGroup: "Project 4" }),
  kid("k3", "Sofia Santos", "h2", 2, "Dairy", { joined: "2024" }),
  adult("p3", "Joy Dela Cruz", "h3", "Head", "Regular", "0927 555 0110", ["Kids church"], "2025", 1, { lifeGroup: "Marikina", skills: "Teaching" }),
  kid("k4", "Ella Dela Cruz", "h3", 9, "None", { status: "Regular", joined: "2025", weeksAway: 1 }),
  adult("p4", "Paolo Garcia", "h4", "Head", "Member", "0995 555 0177", ["Production"], "2020", 6, { lifeGroup: "Cubao", skills: "Video, livestream", notes: [{ id: "n2", text: "Moved to night shift in September.", by: "Pastor Joel", date: "2026-09-20" }] }),
  adult("p13", "Tess Garcia", "h4", "Spouse", "Member", "0995 555 0164", ["Women's Bible study", "Kids church"], "2020", 2, { lifeGroup: "Cubao" }),
  kid("k5", "Nico Garcia", "h4", 8, "None", { joined: "2020", weeksAway: 2 }),
  kid("k6", "Gabby Garcia", "h4", 5, "Shrimp", { joined: "2021", weeksAway: 2 }),
  adult("p5", "Liza Mendoza", "h5", "Head", "Guest", "0906 555 0128", [], "2026", 0, { firstVisit: "2026-10-18", notes: [{ id: "n3", text: "First visit Oct 18, came with Joy.", by: "Grace Villanueva", date: "2026-10-18" }] }),
  kid("k7", "Bea Mendoza", "h5", 3, "None", { status: "Guest", joined: "2026", firstVisit: "2026-10-18" }),
  adult("p6", "Ben Ramos", "h6", "Head", "Member", "0917 555 0161", ["Ushers", "Elders"], "2018", 5, { lifeGroup: "San Juan", skills: "Finance, counting team" }),
  adult("p14", "Lorna Ramos", "h6", "Spouse", "Member", "0917 555 0174", ["Prayer team", "Kids church"], "2018", 0, { lifeGroup: "San Juan", skills: "Care, hospitality" }),
  adult("p7", "Grace Villanueva", "h7", "Head", "Regular", "0919 555 0105", ["Prayer team", "Hospitality"], "2024", 0, { lifeGroup: "Diliman", skills: "Welcome, follow-up" }),
  adult("p8", "Carlo Bautista", "h8", "Head", "Guest", "0945 555 0136", [], "2026", 2, { firstVisit: "2026-10-04" }),
  adult("p15", "Joel Navarro", "h9", "Head", "Member", "0928 555 0150", ["Staff", "Elders"], "2015", 0, { lifeGroup: "Teachers Village", skills: "Preaching, counseling" }),
  adult("p9", "Rina Navarro", "h9", "Spouse", "Member", "0928 555 0187", ["Kids church"], "2017", 0, { lifeGroup: "Teachers Village", skills: "Kids ministry lead" }),
  kid("k8", "Andre Navarro", "h9", 10, "None", { joined: "2016" }),
  kid("k9", "Pia Navarro", "h9", 1, "Eggs", { joined: "2025" }),
  adult("p10", "Dan Castillo", "h10", "Head", "Member", "0917 555 0119", ["Men's group"], "2016", 8, { email: "—", lifeGroup: "Mandaluyong", notes: [{ id: "n4", text: "Caring for his mother in Batangas.", by: "Ben Ramos", date: "2026-09-13" }] }),
  adult("p16", "Rafael Aquino", "h11", "Head", "Regular", "0916 555 0133", [], "2026", 0, { firstVisit: "2026-09-13" }),
  adult("p17", "Mae Aquino", "h11", "Spouse", "Regular", "0916 555 0145", ["Hospitality"], "2026", 0, { firstVisit: "2026-09-13", lifeGroup: "Diliman" }),
  kid("k10", "Tomas Aquino", "h11", 6, "None", { status: "Regular", joined: "2026", firstVisit: "2026-09-13" }),
  adult("p18", "Kevin Lim", "h12", "Head", "Guest", "0939 555 0102", [], "2026", 0, { firstVisit: "2026-10-25", email: "—" }),
  adult("p19", "Ramil Ocampo", "h13", "Head", "Member", "0922 555 0158", ["Production", "Men's group"], "2019", 4, { skills: "Sound" }),
  adult("p20", "Bianca Torres", "h14", "Adult", "Regular", "0908 555 0171", ["Youth", "Worship team"], "2025", 0, { lifeGroup: "Youth LG", skills: "Vocals" }),
  adult("p21", "Patricia Flores", "h15", "Head", "Guest", "0926 555 0139", [], "2026", 0, { firstVisit: "2026-10-11" }),
];

// Smart lists update themselves as records change.
const SMART_LISTS: { id: string; name: string; test: (p: Person) => boolean }[] = [
  { id: "away", name: "Away 4+ weeks", test: (p) => p.role !== "Child" && p.status !== "Guest" && p.weeksAway >= 4 },
  { id: "guests", name: "First-time guests this month", test: (p) => p.role !== "Child" && p.status === "Guest" && (p.firstVisit ?? "") >= "2026-10-01" },
  { id: "regulars", name: "Regulars, not yet members", test: (p) => p.role !== "Child" && p.status === "Regular" },
  { id: "nogroup", name: "Not in a life group", test: (p) => p.role !== "Child" && p.status !== "Guest" && !p.lifeGroup },
  { id: "members", name: "All members", test: (p) => p.role !== "Child" && p.status === "Member" },
  { id: "kids", name: "Kids, ages 0–11", test: (p) => p.role === "Child" },
];

const FOLLOW_UPS: FollowUp[] = [
  { id: "f1", personId: "p18", task: "Welcome call after first visit", owner: "Grace Villanueva", due: "2026-10-29", done: false },
  { id: "f2", personId: "p5", task: "Invite to membership class", owner: "Grace Villanueva", due: "2026-10-30", done: false },
  { id: "f3", personId: "p10", task: "Visit in Batangas", owner: "Pastor Joel", due: "2026-11-03", done: false },
  { id: "f4", personId: "p8", task: "Coffee after the 11 AM service", owner: "Jun Reyes", due: "2026-11-01", done: false },
  { id: "f5", personId: "p21", task: "Send welcome packet", owner: "Mae Aquino", due: "2026-10-27", done: true },
];
const OWNERS = ["Pastor Joel", "Grace Villanueva", "Lorna Ramos", "Jun Reyes", "Mae Aquino"];
const DUE_DATES = ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-05"];

const gift = (id: string, personId: string | null, fund: Fund, method: Method, amount: number, date: string): Gift => ({ id, personId, fund, method, amount, date, ref: refFor(method, 40000 + Number(id.slice(1)) * 137) });

const ONLINE_GIFTS: Gift[] = [
  gift("g1", "p1", "General", "GCash", 5000, "2026-10-25"),
  gift("g2", "p9", "Missions", "Card", 2500, "2026-10-25"),
  gift("g3", "p20", "General", "GCash", 500, "2026-10-25"),
  gift("g4", "p17", "General", "Maya", 1500, "2026-10-25"),
  gift("g5", "p2", "General", "Bank", 3000, "2026-10-24"),
  gift("g6", "p15", "General", "Bank", 8000, "2026-10-23"),
  gift("g7", "p13", "Building", "Maya", 2000, "2026-10-22"),
  gift("g8", "p7", "Building", "GCash", 1000, "2026-10-18"),
  gift("g9", "p16", "General", "Maya", 2500, "2026-10-18"),
  gift("g10", "p17", "General", "Maya", 1500, "2026-10-18"),
  gift("g11", "p11", "Building", "Bank", 10000, "2026-10-15"),
  gift("g12", "p1", "Missions", "GCash", 2000, "2026-10-11"),
  gift("g13", "p14", "Benevolence", "GCash", 1000, "2026-10-11"),
  gift("g14", "p2", "Missions", "GCash", 1500, "2026-10-11"),
  gift("g15", "p21", "General", "GCash", 300, "2026-10-11"),
  gift("g16", "p1", "General", "GCash", 5000, "2026-10-10"),
  gift("g17", "p6", "General", "Bank", 6000, "2026-10-05"),
  gift("g18", "p19", "General", "GCash", 1500, "2026-10-04"),
  gift("g19", "p12", "Missions", "Card", 1200, "2026-10-04"),
  gift("g20", "p9", "General", "Card", 4000, "2026-10-04"),
  gift("g21", "p4", "General", "GCash", 3000, "2026-10-01"),
  gift("g22", "p10", "General", "Bank", 5000, "2026-09-30"),
];

const item = (id: string, personId: string | null, fund: Fund, amount: number, check?: string): BatchItem => ({ id, personId, method: check ? "Check" : "Cash", check, fund, amount });
const BATCHES: Batch[] = [
  { id: "b1", name: "Sunday 9 AM offering", date: "2026-10-25", counted: 21350, counters: "Jun Reyes and Lorna Ramos", status: "Open", items: [item("b1-1", "p3", "General", 1000), item("b1-2", "p11", "Building", 10000, "BDO 004182"), item("b1-3", "p14", "Benevolence", 500), item("b1-4", "p16", "General", 2000), item("b1-5", null, "General", 5350)] },
  { id: "b5", name: "Midweek prayer night", date: "2026-10-28", counted: 3450, counters: "Lorna Ramos and Grace Villanueva", status: "Open", items: [item("b5-1", "p7", "Benevolence", 450), item("b5-2", null, "General", 3000)] },
  { id: "b2", name: "Sunday 11 AM offering", date: "2026-10-25", counted: 14200, counters: "Mark Santos and Carla Santos", status: "Committed", items: [item("b2-1", "p2", "General", 2000), item("b2-2", "p12", "Missions", 5000, "BPI 118204"), item("b2-3", "p7", "General", 1000), item("b2-4", null, "General", 6200)] },
  { id: "b3", name: "Sunday 9 AM offering", date: "2026-10-18", counted: 19650, counters: "Jun Reyes and Lorna Ramos", status: "Committed", items: [item("b3-1", "p1", "General", 8000, "Metrobank 2207"), item("b3-2", "p13", "Building", 1500), item("b3-3", null, "General", 10150)] },
  { id: "b4", name: "Sunday 11 AM offering", date: "2026-10-18", counted: 12900, counters: "Mark Santos and Carla Santos", status: "Committed", items: [item("b4-1", "p20", "General", 500), item("b4-2", "p19", "General", 2000), item("b4-3", null, "General", 10400)] },
];
const postBatch = (b: Batch): Gift[] => b.items.map((i) => ({ id: `g-${i.id}`, personId: i.personId, fund: i.fund, method: i.method, amount: i.amount, date: b.date, ref: i.check ?? `Batch ${b.id.toUpperCase()}` }));
const GIFTS: Gift[] = [...ONLINE_GIFTS, ...BATCHES.filter((b) => b.status === "Committed").flatMap(postBatch)];

// Giving recorded before this demo's ledger starts (other givers, January to September).
const OCT_BASE = 248600;
const FUND_BASE: Record<Fund, number> = { General: 1182400, Missions: 421900, Building: 2036000, Benevolence: 96300 };
const STATEMENT_BASE: Record<string, number> = { p1: 61000, p11: 48000, p2: 33000, p12: 11000, p3: 4500, p4: 27000, p13: 18000, p6: 66000, p14: 12000, p7: 9000, p15: 96000, p9: 41000, p10: 45000, p16: 7500, p17: 6000, p19: 15000, p20: 4000 };

const RECURRING: Recurring[] = [
  { id: "r1", personId: "p1", amount: 5000, fund: "General", frequency: "Twice a month", method: "GCash", next: "2026-11-08", status: "Active" },
  { id: "r2", personId: "p15", amount: 8000, fund: "General", frequency: "Monthly", method: "Bank", next: "2026-11-23", status: "Active" },
  { id: "r3", personId: "p4", amount: 3000, fund: "General", frequency: "Monthly", method: "GCash", next: "2026-11-01", status: "Active" },
  { id: "r4", personId: "p9", amount: 2500, fund: "Missions", frequency: "Monthly", method: "Card", next: "2026-11-25", status: "Card expiring" },
  { id: "r5", personId: "p6", amount: 6000, fund: "General", frequency: "Monthly", method: "Bank", next: "2026-11-05", status: "Active" },
  { id: "r6", personId: "p13", amount: 2000, fund: "Building", frequency: "Monthly", method: "Maya", next: "2026-11-22", status: "Active" },
  { id: "r7", personId: "p17", amount: 1500, fund: "General", frequency: "Weekly", method: "Maya", next: "2026-11-01", status: "Active" },
  { id: "r8", personId: "p19", amount: 1500, fund: "General", frequency: "Monthly", method: "GCash", next: "2026-11-04", status: "Paused" },
  { id: "r9", personId: "p12", amount: 1200, fund: "Missions", frequency: "Monthly", method: "Card", next: "2026-11-04", status: "Active" },
];

const CAMPAIGN = { name: "Room to Grow", purpose: "New kids wing and four classrooms", goal: 8500000, ends: "Dec 2028", otherPledged: 3920000, otherGiven: 1410000, otherHouseholds: 61 };
const PLEDGES: Pledge[] = [
  { id: "pl1", householdId: "h6", pledged: 450000, given: 210000 },
  { id: "pl2", householdId: "h1", pledged: 360000, given: 130000 },
  { id: "pl3", householdId: "h9", pledged: 300000, given: 120000 },
  { id: "pl4", householdId: "h10", pledged: 240000, given: 95000 },
  { id: "pl5", householdId: "h2", pledged: 180000, given: 52000 },
  { id: "pl6", householdId: "h4", pledged: 150000, given: 34000 },
  { id: "pl7", householdId: "h13", pledged: 90000, given: 12000 },
  { id: "pl8", householdId: "h11", pledged: 72000, given: 6000 },
  { id: "pl9", householdId: "h7", pledged: 60000, given: 21000 },
];

const KID_ROOMS: { id: Room; ages: string; capacity: number }[] = [
  { id: "Nursery", ages: "Ages 0–2", capacity: 8 },
  { id: "Preschool", ages: "Ages 3–5", capacity: 12 },
  { id: "Elementary", ages: "Ages 6–11", capacity: 24 },
];
const ci = (id: string, name: string, age: number, service: Service, code: string, time: string, guardian: string, allergy = "None", personId?: string): CheckIn => ({
  id, name, personId, household: name.split(" ").slice(1).join(" "), age, room: roomFor(age), service, code, time, guardian, allergy, out: false,
});
const CHECKINS: CheckIn[] = [
  ci("c1", "Andre Navarro", 10, "9 AM", "R5T8", "8:41 AM", "Rina Navarro", "None", "k8"),
  ci("c2", "Pia Navarro", 1, "9 AM", "R5T8", "8:41 AM", "Rina Navarro", "Eggs", "k9"),
  ci("c3", "Sofia Santos", 2, "9 AM", "M2X9", "8:47 AM", "Carla Santos", "Dairy", "k3"),
  ci("c4", "Lia Domingo", 4, "9 AM", "P4C7", "8:49 AM", "Kat Domingo"),
  ci("c5", "Jacob Tan", 7, "9 AM", "J9L3", "8:50 AM", "Cathy Tan"),
  ci("c6", "Ysa Tan", 3, "9 AM", "J9L3", "8:50 AM", "Cathy Tan", "Peanuts"),
  ci("c7", "Ella Dela Cruz", 9, "9 AM", "H8N2", "8:52 AM", "Joy Dela Cruz", "None", "k4"),
  ci("c8", "Migo Fernandez", 8, "9 AM", "D6F5", "8:53 AM", "Gab Fernandez"),
  ci("c9", "Tomas Aquino", 6, "9 AM", "B3W6", "8:55 AM", "Mae Aquino", "None", "k10"),
  ci("c10", "Amara Lopez", 2, "9 AM", "W7K2", "8:56 AM", "Andrea Lopez"),
  ci("c11", "Noah Castro", 5, "9 AM", "T3Q8", "8:58 AM", "Rhea Castro"),
  ci("c12", "Zoe Aguilar", 11, "9 AM", "F2M6", "9:01 AM", "Renz Aguilar"),
  ci("c13", "Bea Mendoza", 3, "11 AM", "N5R4", "10:52 AM", "Liza Mendoza", "None", "k7"),
  ci("c14", "Kian Ocampo", 6, "11 AM", "V8D3", "10:55 AM", "Jen Ocampo"),
  ci("c15", "Leah Cruz", 9, "11 AM", "G4H7", "10:57 AM", "Marites Cruz", "Gluten"),
];

const LINKS: Record<string, string> = {
  ...Object.fromEntries(PEOPLE.map((p) => [p.name, p.id])),
  "Jun & Ana Reyes": "p11", "Mark & Carla Santos": "p2", "Ben & Lorna Ramos": "p6", "Paolo & Tess Garcia": "p4", "Rafael & Mae Aquino": "p16", "Joel & Rina Navarro": "p15", "Ramil & Jen Ocampo": "p19",
};
const PAY_CYCLE: Method[] = ["GCash", "Maya", "GCash", "Card", "Bank"];
const roster = (eid: string, names: string[], paid: number): Attendee[] =>
  names.map((name, i) => ({ id: `${eid}-${i}`, name, personId: LINKS[name], paid: i < paid, method: i < paid ? PAY_CYCLE[i % PAY_CYCLE.length] : undefined, checkedIn: false }));

const EVENTS: ChurchEvent[] = [
  { id: "e1", name: "Youth Camp 2026", date: "Nov 14–16", location: "Caliraya, Laguna", capacity: 40, price: 2500, opened: "2026-10-01", waitlist: [], attendees: roster("e1", ["Bianca Torres", "Jared Lim", "Kyla Ramos", "Miguel Ocampo", "Sam Villareal", "Trisha Mendoza", "Paulo Santiago", "Andrea Lopez", "Josh Manalo", "Nicole Tan", "Gab Fernandez", "Rhea Castro", "Elijah Bautista", "Kat Domingo", "Renz Aguilar", "Faith Mercado", "Iya Gonzales", "Luis Pascual", "Mark Santos"], 14) },
  { id: "e2", name: "Couples Night", date: "Nov 7", location: "Fellowship hall", capacity: 10, price: 1200, opened: "2026-10-12", attendees: roster("e2", ["Jun & Ana Reyes", "Mark & Carla Santos", "Ben & Lorna Ramos", "Paolo & Tess Garcia", "Rafael & Mae Aquino", "Joel & Rina Navarro", "Arnel & Joy Bautista", "Dennis & Cathy Tan", "Edgar & Liezl Lim", "Boyet & Marites Cruz"], 8), waitlist: roster("e2w", ["Ramil & Jen Ocampo", "Victor & Grace Salazar", "JR & Pia Fernandez"], 0) },
  { id: "e3", name: "Membership class", date: "Nov 8", location: "Room 201", capacity: 20, price: 0, opened: "2026-10-19", waitlist: [], attendees: roster("e3", ["Joy Dela Cruz", "Grace Villanueva", "Rafael Aquino", "Mae Aquino", "Bianca Torres", "Patricia Flores", "Carmela Diaz", "Victor Salazar"], 0) },
  { id: "e4", name: "Men's breakfast", date: "Nov 14", location: "Fellowship hall", capacity: 40, price: 350, opened: "2026-10-20", waitlist: [], attendees: roster("e4", ["Jun Reyes", "Mark Santos", "Joel Navarro", "Dan Castillo", "Ramil Ocampo", "Rafael Aquino", "Boyet Cruz", "Dennis Tan", "Edgar Lim", "Arnel Bautista", "Totoy Reyes"], 7) },
  { id: "e5", name: "Kids Christmas Program", date: "Dec 13", location: "Main sanctuary", capacity: 120, price: 0, opened: "2026-10-26", waitlist: [], attendees: roster("e5", ["Mika Reyes", "Lucas Reyes", "Ella Dela Cruz", "Nico Garcia", "Gabby Garcia", "Andre Navarro", "Tomas Aquino", "Bea Mendoza", "Jacob Tan", "Ysa Tan", "Migo Fernandez", "Noah Castro"], 0) },
];

const TEAMS: { team: string; positions: string[]; roster: string[] }[] = [
  { team: "Worship", positions: ["Worship leader", "Vocals", "Keys", "Guitar", "Bass", "Drums"], roster: ["Ana Reyes", "Mark Santos", "Bianca Torres", "Kat Domingo", "Paulo Santiago", "Josh Manalo", "Trisha Mendoza", "Nicole Tan", "Renz Aguilar", "Elijah Bautista", "Jared Lim"] },
  { team: "Production", positions: ["Sound", "Slides", "Livestream"], roster: ["Paolo Garcia", "Ramil Ocampo", "Edgar Lim", "Gab Fernandez", "Dennis Tan", "Miguel Ocampo"] },
  { team: "Kids church", positions: ["Nursery", "Preschool", "Elementary"], roster: ["Rina Navarro", "Lorna Ramos", "Joy Dela Cruz", "Carla Santos", "Tess Garcia", "Andrea Lopez"] },
  { team: "Hospitality", positions: ["Welcome team", "Ushers", "Coffee"], roster: ["Grace Villanueva", "Jun Reyes", "Ben Ramos", "Mae Aquino", "Cathy Tan", "Liezl Lim", "Rafael Aquino"] },
];
const BLOCKED: Record<string, string> = { "Josh Manalo": "out of town", "Ben Ramos": "away", "Paolo Garcia": "working Sunday" };
const slot = (name: string | null, status: Slot["status"] = "Confirmed", reason?: string): Slot => ({ name, status, reason });
const PLAN: Record<string, Slot> = {
  "9 AM|Worship leader": slot("Ana Reyes"), "9 AM|Vocals": slot("Bianca Torres"), "9 AM|Keys": slot("Kat Domingo", "Pending"), "9 AM|Guitar": slot("Paulo Santiago"),
  "9 AM|Bass": slot(null), "9 AM|Drums": slot("Josh Manalo", "Declined", "Out of town"), "9 AM|Sound": slot("Edgar Lim"), "9 AM|Slides": slot("Gab Fernandez"),
  "9 AM|Livestream": slot(null), "9 AM|Nursery": slot("Lorna Ramos"), "9 AM|Preschool": slot("Joy Dela Cruz", "Pending"), "9 AM|Elementary": slot("Rina Navarro"),
  "9 AM|Welcome team": slot("Grace Villanueva"), "9 AM|Ushers": slot("Jun Reyes"), "9 AM|Coffee": slot("Mae Aquino", "Pending"),
  "11 AM|Worship leader": slot("Mark Santos"), "11 AM|Vocals": slot("Trisha Mendoza"), "11 AM|Keys": slot("Nicole Tan"), "11 AM|Guitar": slot(null),
  "11 AM|Bass": slot("Renz Aguilar"), "11 AM|Drums": slot("Elijah Bautista", "Pending"), "11 AM|Sound": slot("Dennis Tan"), "11 AM|Slides": slot(null),
  "11 AM|Livestream": slot("Paolo Garcia", "Declined", "Working that Sunday"), "11 AM|Nursery": slot("Carla Santos"), "11 AM|Preschool": slot(null), "11 AM|Elementary": slot("Tess Garcia", "Pending"),
  "11 AM|Welcome team": slot("Cathy Tan"), "11 AM|Ushers": slot("Ben Ramos", "Declined", "Away"), "11 AM|Coffee": slot("Liezl Lim"),
};
// Minutes after the service starts, item, who leads, length.
const ORDER: [number, string, string, string][] = [
  [0, "Welcome and call to worship", "Worship leader", "5 min"],
  [5, "Great Is Thy Faithfulness · D", "Worship team", "5 min"],
  [10, "It Is Well with My Soul · C", "Worship team", "6 min"],
  [16, "Holy, Holy, Holy · E♭", "Worship team", "5 min"],
  [21, "Announcements", "Grace Villanueva", "4 min"],
  [25, "Offering", "Ushers", "5 min"],
  [30, "Message: Faithful in little things · Luke 16:10", "Pastor Joel Navarro", "35 min"],
  [65, "Response and benediction", "Pastor Joel Navarro", "10 min"],
];

const TEMPLATES = [
  { name: "Missed you on Sunday", subject: "We missed you", body: "Hi {first_name}, we missed you at Grace Fellowship these past weeks. Is there anything we can pray with you about? Reply anytime. Pastor Joel" },
  { name: "Welcome, first-time guest", subject: "Thanks for visiting", body: "Hi {first_name}, thank you for worshiping with us at Grace Fellowship. We'd love to buy you coffee after service this Sunday. Grace, Welcome team" },
  { name: "Membership class invite", subject: "Membership class, Nov 8", body: "Hi {first_name}, our next membership class is Sunday, Nov 8 at 1 PM in Room 201. Lunch is provided. Reply YES to save a seat." },
  { name: "Volunteer thank-you", subject: "Thank you for serving", body: "Hi {first_name}, thank you for serving this month. Your faithfulness makes Sunday possible for 400 people. Pastor Joel" },
];
const SENT: Message[] = [
  { id: "m1", date: "2026-10-27", channel: "Email", title: "Couples Night is full", audience: "All members", recipients: 17, rate: "71% opened" },
  { id: "m2", date: "2026-10-26", channel: "SMS", title: "Thanks for visiting", audience: "First-time guests this month", recipients: 3, rate: "100% delivered" },
  { id: "m3", date: "2026-10-22", channel: "Email", title: "Youth Camp: last call to register", audience: "Youth parents", recipients: 41, rate: "64% opened" },
  { id: "m4", date: "2026-10-17", channel: "SMS", title: "Sunday volunteer reminder", audience: "Serving Oct 18", recipients: 29, rate: "100% delivered" },
  { id: "m5", date: "2026-10-12", channel: "Email", title: "October giving update", audience: "All members", recipients: 17, rate: "58% opened" },
];

const ROOMS = ["Main sanctuary", "Fellowship hall", "Kids wing", "Room 201", "Room 202", "Youth room"];
const DAYS = ["Mon 26", "Tue 27", "Wed 28", "Thu 29", "Fri 30", "Sat 31", "Sun 1"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const bk = (id: string, title: string, room: string, day: number, start: number, end: number, by: string, status: Booking["status"] = "Booked"): Booking => ({ id, title, room, day, start, end, by, status });
const BOOKINGS: Booking[] = [
  bk("bk1", "Staff meeting", "Room 201", 0, 10, 12, "Pastor Joel"),
  bk("bk2", "Women's Bible study", "Room 202", 1, 19, 21, "Tess Garcia"),
  bk("bk3", "Prayer night", "Main sanctuary", 2, 19, 21, "Lorna Ramos"),
  bk("bk4", "Youth leaders huddle", "Youth room", 2, 19, 20.5, "Mark Santos"),
  bk("bk5", "Worship rehearsal", "Main sanctuary", 3, 19, 21.5, "Ana Reyes"),
  bk("bk6", "Membership class prep", "Room 201", 3, 18, 19, "Grace Villanueva"),
  bk("bk7", "Youth night", "Youth room", 4, 18.5, 21, "Mark Santos"),
  bk("bk8", "Ladies fellowship", "Fellowship hall", 4, 18, 21, "Carla Santos"),
  bk("bk9", "Barangay health caravan", "Fellowship hall", 5, 8, 13, "Church office"),
  bk("bk10", "Outreach packing, Brgy. Pansol", "Fellowship hall", 5, 9, 12, "Lorna Ramos", "Pending"),
  bk("bk11", "Kids Christmas rehearsal", "Kids wing", 5, 9, 11, "Rina Navarro"),
  bk("bk12", "Wedding: Lim and Tan", "Main sanctuary", 5, 14, 17, "Church office"),
  bk("bk13", "Sunday services", "Main sanctuary", 6, 8.5, 12.5, "Church office"),
  bk("bk14", "Kids church", "Kids wing", 6, 8.5, 12.5, "Rina Navarro"),
  bk("bk15", "Fellowship lunch", "Fellowship hall", 6, 12.5, 14, "Hospitality team"),
  bk("bk16", "Youth service", "Youth room", 6, 15, 17, "Mark Santos"),
];

const TREND_LABELS = ["Aug 9", "16", "23", "30", "Sep 6", "13", "20", "27", "Oct 4", "11", "18", "25"];
const TREND: Record<"total" | Service, number[]> = {
  total: [348, 356, 351, 360, 362, 368, 381, 377, 395, 402, 398, 412],
  "9 AM": [201, 205, 199, 207, 210, 212, 221, 219, 228, 233, 230, 238],
  "11 AM": [147, 151, 152, 153, 152, 156, 160, 158, 167, 169, 168, 174],
};
const RETENTION: [string, number][] = [["First visit", 86], ["Came back a second time", 52], ["Three or more visits", 38], ["Regular attender", 29], ["Became a member", 11]];

const KIND_DOT: Record<string, string> = { Attendance: "bg-good", "Check-in": "bg-good", Gift: "bg-gold", Serving: "bg-trace", Event: "bg-warn", Group: "bg-mist", Note: "bg-graphite", "Follow-up": "bg-danger" };

const tone = (p: Person): Tone => (p.role !== "Child" && p.status !== "Guest" && p.weeksAway >= 4 ? "bad" : p.status === "Guest" ? "warn" : p.status === "Regular" ? "muted" : "good");
const statusLabel = (p: Person) => (tone(p) === "bad" ? `Away ${p.weeksAway} wks` : p.role === "Child" ? `Child · ${p.status}` : p.status);

// ---- Small local pieces -----------------------------------------------------------

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[0.74rem] transition-colors cursor-pointer", on ? "bg-gold border-gold text-sheet font-medium" : "bg-sheet border-rule text-ink-soft hover:border-mist")}
    >
      {children}
    </button>
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

function TextField({ label, value, onChange, placeholder, numeric }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean }) {
  return (
    <Field label={label}>
      <input inputMode={numeric ? "numeric" : undefined} value={value} onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)} placeholder={placeholder} className={inputClass} />
    </Field>
  );
}

function SelectField<T extends string | number>({ label, value, onChange, options, format = String }: { label: string; value: T; onChange: (v: T) => void; options: readonly T[]; format?: (v: T) => string }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => {
          const next = options.find((o) => String(o) === e.target.value);
          if (next !== undefined) onChange(next);
        }}
        className={inputClass}
      >
        {options.map((o) => <option key={String(o)} value={o}>{format(o)}</option>)}
      </select>
    </Field>
  );
}

// Labelled horizontal meters, used by the reports.
function MeterList({ rows }: { rows: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-2 text-[0.76rem] mb-1">
            <span className="text-ink-soft">{r.label}</span>
            <span className="font-mono text-ink">{r.display}</span>
          </div>
          <Meter value={r.value} max={max} />
        </li>
      ))}
    </ul>
  );
}

const selectClass = "h-9 px-2 rounded-lg bg-sheet border border-rule text-[0.78rem] text-ink cursor-pointer";
const listClass = "flex flex-col divide-y divide-rule-soft -my-1.5";

// ---- The app ----------------------------------------------------------------------

type ModalId = "person" | "member" | "followup" | "edit" | "gift" | "entry" | "pledge" | "statement" | "event" | "register" | "schedule" | "checkout" | "booking" | "bookingDetail";

export function ChurchOSPrototype() {
  const app = useProtoApp("dashboard");
  const [people, setPeople] = useState(PEOPLE);
  const [households, setHouseholds] = useState(HOUSEHOLDS);
  const [followUps, setFollowUps] = useState(FOLLOW_UPS);
  const [gifts, setGifts] = useState(GIFTS);
  const [batches, setBatches] = useState(BATCHES);
  const [recurring, setRecurring] = useState(RECURRING);
  const [pledges, setPledges] = useState(PLEDGES);
  const [sentStatements, setSentStatements] = useState<string[]>([]);
  const [checkins, setCheckins] = useState(CHECKINS);
  const [events, setEvents] = useState(EVENTS);
  const [plan, setPlan] = useState(PLAN);
  const [messages, setMessages] = useState(SENT);
  const [bookings, setBookings] = useState(BOOKINGS);

  const [modal, setModal] = useState<ModalId | null>(null);
  const close = () => setModal(null);
  const [list, setList] = useState("all");
  const [peopleView, setPeopleView] = useState<"people" | "households">("people");
  const [query, setQuery] = useState("");
  const [personTab, setPersonTab] = useState<"timeline" | "notes" | "giving">("timeline");
  const [note, setNote] = useState("");
  const [givingTab, setGivingTab] = useState<"donations" | "batches" | "recurring" | "campaign" | "statements">("donations");
  const [fundFilter, setFundFilter] = useState<"All" | Fund>("All");
  const [methodFilter, setMethodFilter] = useState<"All" | Method>("All");
  const [giftQuery, setGiftQuery] = useState("");
  const [ciService, setCiService] = useState<Service>("9 AM");
  const [ciQuery, setCiQuery] = useState("");
  const [ciHouse, setCiHouse] = useState<string | null>(null);
  const [ciPick, setCiPick] = useState<string[]>([]);
  const [ciRoom, setCiRoom] = useState<"All" | Room>("All");
  const [labels, setLabels] = useState<CheckIn[]>([]);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [codeEntry, setCodeEntry] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [regFilter, setRegFilter] = useState<"all" | "unpaid" | "in">("all");
  const [service, setService] = useState<Service>("9 AM");
  const [scheduling, setScheduling] = useState<{ team: string; position: string } | null>(null);
  const [channel, setChannel] = useState<"SMS" | "Email">("SMS");
  const [audience, setAudience] = useState("guests");
  const [subject, setSubject] = useState(TEMPLATES[1].subject);
  const [body, setBody] = useState(TEMPLATES[1].body);
  const [trend, setTrend] = useState<"total" | Service>("total");

  const [personDraft, setPersonDraft] = useState({ name: "", phone: "", email: "", status: "Guest" as MemberStatus, householdId: "new" });
  const [memberDraft, setMemberDraft] = useState({ name: "", role: "Child" as Role, age: "6", allergy: "" });
  const [fuDraft, setFuDraft] = useState({ task: "Call to check in", owner: "Lorna Ramos", due: "2026-11-02" });
  const [editDraft, setEditDraft] = useState({ status: "Member" as MemberStatus, lifeGroup: "", baptized: "", membershipClass: "", skills: "", allergy: "" });
  const [giftDraft, setGiftDraft] = useState({ personId: "p1", amount: "1000", fund: "General" as Fund, method: "GCash" as Method });
  const [entryDraft, setEntryDraft] = useState({ personId: "", method: "Cash" as "Cash" | "Check", check: "", fund: "General" as Fund, amount: "" });
  const [pledgeDraft, setPledgeDraft] = useState({ householdId: "h3", amount: "60000" });
  const [statementFor, setStatementFor] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState({ name: "", date: "", location: "Fellowship hall", capacity: "40", price: "0" });
  const [regDraft, setRegDraft] = useState({ personId: "p5", method: "GCash" as Method | "Unpaid" });
  const [bookingDraft, setBookingDraft] = useState({ title: "", room: "Fellowship hall", day: 5, start: 9, end: 11 });
  const [bookingId, setBookingId] = useState<string | null>(null);

  // ---- Lookups and derived numbers ----
  const byId = (id?: string | null) => people.find((x) => x.id === id);
  const giver = (id: string | null) => byId(id)?.name ?? "Loose offering";
  const houseOf = (id?: string | null) => households.find((h) => h.id === id);
  const membersOf = (hid: string) => people.filter((x) => x.householdId === hid);
  const kidsOf = (hid: string) => membersOf(hid).filter((x) => x.role === "Child");
  const adultsOf = (hid: string) => membersOf(hid).filter((x) => x.role !== "Child");
  const smart = (id: string) => people.filter(SMART_LISTS.find((l) => l.id === id)?.test ?? (() => true));
  const listName = (id: string) => SMART_LISTS.find((l) => l.id === id)?.name ?? "Everyone";
  const away = smart("away").sort((a, b) => b.weeksAway - a.weeksAway);
  const openFollowUps = followUps.filter((f) => !f.done).sort((a, b) => a.due.localeCompare(b.due));
  const octGifts = gifts.filter((g) => g.date >= "2026-10-01");
  const octTotal = OCT_BASE + sum(octGifts.map((g) => g.amount));
  const givenBy = (pid: string) => gifts.filter((g) => g.personId === pid).sort((a, b) => b.date.localeCompare(a.date));
  const ytd = (pid: string) => (STATEMENT_BASE[pid] ?? 0) + sum(givenBy(pid).map((g) => g.amount));
  const openSlots = Object.values(plan).filter((s) => !s.name || s.status === "Declined").length;
  const pendingBookings = bookings.filter((b) => b.status === "Pending");
  const clashes = (b: { id?: string; room: string; day: number; start: number; end: number }) =>
    bookings.filter((o) => o.id !== b.id && o.room === b.room && o.day === b.day && o.start < b.end && b.start < o.end);
  const activeRecurring = recurring.filter((r) => r.status !== "Paused");
  const onlineShare = Math.round((sum(octGifts.filter((g) => g.method !== "Cash" && g.method !== "Check").map((g) => g.amount)) / Math.max(1, sum(octGifts.map((g) => g.amount)))) * 100);

  const p = app.screen === "person" ? byId(app.id) : undefined;
  const house = app.screen === "household" ? houseOf(app.id) : undefined;
  const batch = app.screen === "batch" ? batches.find((b) => b.id === app.id) : undefined;
  const ev = app.screen === "event" ? events.find((e) => e.id === app.id) : undefined;
  const entered = batch ? sum(batch.items.map((i) => i.amount)) : 0;
  const remaining = batch ? batch.counted - entered : 0;
  const evFull = ev ? ev.attendees.length >= ev.capacity : false;

  // Everything that happened with a person, newest first.
  const timeline = (x: Person) => {
    const items: { date: string; kind: string; text: string }[] = [];
    SUNDAYS.slice(x.weeksAway, x.weeksAway + 3).forEach((d, i) => {
      if (x.firstVisit && d < x.firstVisit) return;
      const text = d === x.firstVisit ? "First visit, 9 AM service" : x.role === "Child" ? `Checked in to ${roomFor(x.age ?? 0)}` : `Attended the ${i % 2 ? "11 AM" : "9 AM"} service`;
      items.push({ date: d, kind: "Attendance", text });
    });
    if (x.firstVisit && !items.some((i) => i.date === x.firstVisit)) items.push({ date: x.firstVisit, kind: "Attendance", text: "First visit" });
    checkins.filter((c) => c.personId === x.id).forEach((c) => items.push({ date: "2026-11-01", kind: "Check-in", text: `${c.room}, ${c.service} · code ${c.code}${c.out ? " · picked up" : ""}` }));
    givenBy(x.id).forEach((g) => items.push({ date: g.date, kind: "Gift", text: `${peso(g.amount)} to ${g.fund} via ${g.method}` }));
    Object.entries(plan).forEach(([key, s]) => {
      if (s.name === x.name) items.push({ date: "2026-11-01", kind: "Serving", text: `${key.split("|")[1]}, ${key.split("|")[0]} · ${s.status}` });
    });
    events.forEach((e) => {
      if (e.attendees.some((a) => a.personId === x.id)) items.push({ date: e.opened, kind: "Event", text: `Registered for ${e.name}` });
    });
    if (x.joined) x.groups.forEach((g) => items.push({ date: x.joined, kind: "Group", text: `Joined ${g}` }));
    x.notes.forEach((n) => items.push({ date: n.date, kind: "Note", text: `${n.text} (${n.by})` }));
    followUps.filter((f) => f.personId === x.id).forEach((f) => items.push({ date: f.due, kind: "Follow-up", text: `${f.task} · ${f.owner}${f.done ? " · done" : ""}` }));
    return items.sort((a, b) => b.date.localeCompare(a.date));
  };

  // ---- People actions ----
  const assignCall = (x: Person) => {
    setFollowUps((l) => [...l, { id: uid("f"), personId: x.id, task: `Call: away ${x.weeksAway} weeks`, owner: "Lorna Ramos", due: "2026-10-31", done: false }]);
    app.notify(`Follow-up for ${x.name} assigned to Lorna Ramos`);
  };
  const markDone = (f: FollowUp) => {
    setFollowUps((l) => l.map((x) => (x.id === f.id ? { ...x, done: true } : x)));
    app.notify(`Marked done: ${f.task}`);
  };
  const addPerson = () => {
    const name = personDraft.name.trim();
    if (!name) return;
    const isNew = personDraft.householdId === "new";
    const householdId = isNew ? uid("h") : personDraft.householdId;
    if (isNew) setHouseholds((l) => [...l, { id: householdId, name: name.split(" ").slice(-1)[0], address: "Quezon City" }]);
    const added = adult(uid("p"), name, householdId, isNew ? "Head" : "Adult", personDraft.status, personDraft.phone.trim() || "—", [], "2026", 0, {
      email: personDraft.email.trim() || "—",
      firstVisit: personDraft.status === "Guest" ? TODAY : undefined,
    });
    setPeople((l) => [added, ...l]);
    setPersonDraft({ name: "", phone: "", email: "", status: "Guest", householdId: "new" });
    close();
    app.notify(`${name} added to People`);
  };
  const addMember = () => {
    const name = memberDraft.name.trim();
    if (!house || !name) return;
    const status = adultsOf(house.id)[0]?.status ?? "Guest";
    const id = uid(memberDraft.role === "Child" ? "k" : "p");
    const added = memberDraft.role === "Child" ? kid(id, name, house.id, Number(memberDraft.age) || 0, memberDraft.allergy.trim() || "None", { status, joined: "2026" }) : adult(id, name, house.id, memberDraft.role, status, "—", [], "2026", 0);
    setPeople((l) => [...l, added]);
    setMemberDraft({ name: "", role: "Child", age: "6", allergy: "" });
    close();
    app.notify(`${name} added to the ${house.name} household`);
  };
  const openFollowUp = (x: Person) => {
    setFuDraft({ task: x.weeksAway >= 4 ? "Call to check in" : "Coffee after service", owner: "Lorna Ramos", due: "2026-11-02" });
    setModal("followup");
  };
  const saveFollowUp = () => {
    if (!p || !fuDraft.task.trim()) return;
    setFollowUps((l) => [...l, { id: uid("f"), personId: p.id, task: fuDraft.task.trim(), owner: fuDraft.owner, due: fuDraft.due, done: false }]);
    close();
    app.notify(`Follow-up saved for ${fuDraft.owner}, due ${fmt(fuDraft.due)}`);
  };
  const openEdit = (x: Person) => {
    setEditDraft({ status: x.status, lifeGroup: x.lifeGroup, baptized: x.baptized, membershipClass: x.membershipClass, skills: x.skills, allergy: x.allergy ?? "None" });
    setModal("edit");
  };
  const saveEdit = () => {
    if (!p) return;
    setPeople((l) => l.map((x) => (x.id === p.id ? { ...x, ...editDraft, allergy: x.role === "Child" ? editDraft.allergy : x.allergy } : x)));
    close();
    app.notify("Profile updated");
  };
  const addNote = () => {
    if (!p || !note.trim()) return;
    setPeople((l) => l.map((x) => (x.id === p.id ? { ...x, notes: [...x.notes, { id: uid("n"), text: note.trim(), by: "Pastor Joel", date: TODAY }] } : x)));
    setNote("");
    app.notify("Note saved");
  };

  // ---- Giving actions ----
  const recordGift = () => {
    const amount = Number(giftDraft.amount);
    if (!amount) return;
    const personId = giftDraft.personId || null;
    setGifts((l) => [{ id: uid("g"), personId, fund: giftDraft.fund, method: giftDraft.method, amount, date: TODAY, ref: newRef(giftDraft.method) }, ...l]);
    close();
    app.notify(personId ? `Gift of ${peso(amount)} recorded. Receipt sent.` : `Gift of ${peso(amount)} recorded.`);
  };
  const openEntry = () => {
    setEntryDraft({ personId: "", method: "Cash", check: "", fund: "General", amount: String(Math.max(0, remaining)) });
    setModal("entry");
  };
  const addEntry = () => {
    const amount = Number(entryDraft.amount);
    if (!batch || !amount) return;
    const item: BatchItem = { id: uid(`${batch.id}-`), personId: entryDraft.personId || null, method: entryDraft.method, check: entryDraft.method === "Check" ? entryDraft.check || "Check" : undefined, fund: entryDraft.fund, amount };
    setBatches((l) => l.map((b) => (b.id === batch.id ? { ...b, items: [...b.items, item] } : b)));
    close();
    app.notify(`Entry of ${peso(amount)} added to the batch`);
  };
  const commitBatch = (b: Batch) => {
    setBatches((l) => l.map((x) => (x.id === b.id ? { ...x, status: "Committed" } : x)));
    setGifts((l) => [...postBatch(b), ...l]);
    app.notify(`Batch committed. ${b.items.length} gifts posted to the ledger.`);
  };
  const toggleRecurring = (r: Recurring) => {
    if (r.status === "Card expiring") return app.notify(`Card update link sent to ${first(giver(r.personId))}`);
    setRecurring((l) => l.map((x) => (x.id === r.id ? { ...x, status: r.status === "Paused" ? "Active" : "Paused" } : x)));
    app.notify(r.status === "Paused" ? `Recurring gift resumed for ${giver(r.personId)}` : `Recurring gift paused for ${giver(r.personId)}`);
  };
  const unpledged = households.filter((h) => !pledges.some((x) => x.householdId === h.id));
  const openPledge = () => {
    setPledgeDraft({ householdId: unpledged[0]?.id ?? "", amount: "60000" });
    setModal("pledge");
  };
  const addPledge = () => {
    const amount = Number(pledgeDraft.amount);
    const h = houseOf(pledgeDraft.householdId);
    if (!amount || !h) return;
    setPledges((l) => [...l, { id: uid("pl"), householdId: h.id, pledged: amount, given: 0 }]);
    close();
    app.notify(`Pledge of ${peso(amount)} recorded for the ${h.name} household`);
  };
  const statementGivers = people.filter((x) => x.role !== "Child" && ytd(x.id) > 0).sort((a, b) => ytd(b.id) - ytd(a.id));
  const openStatement = (id: string) => {
    setStatementFor(id);
    setModal("statement");
  };
  const sendStatement = (x: Person) => {
    setSentStatements((l) => [...new Set([...l, x.id])]);
    close();
    app.notify(x.email === "—" ? `Statement for ${x.name} sent to the printer` : `Statement emailed to ${x.email}`);
  };
  const sendAllStatements = () => {
    const emailable = statementGivers.filter((x) => x.email !== "—");
    setSentStatements(statementGivers.map((x) => x.id));
    app.notify(`${emailable.length} statements emailed. ${statementGivers.length - emailable.length} sent to the printer.`);
  };

  // ---- Check-in actions ----
  const sessionIns = checkins.filter((c) => c.service === ciService);
  const activeFor = (kidId: string) => sessionIns.find((c) => c.personId === kidId && !c.out);
  const stationHouses = households.filter((h) => kidsOf(h.id).length > 0 && `${h.name} ${membersOf(h.id).map((m) => `${m.name} ${m.phone}`).join(" ")}`.toLowerCase().includes(ciQuery.toLowerCase()));
  const station = houseOf(ciHouse);
  const switchSession = (v: Service) => {
    setCiService(v);
    setCiHouse(null);
    setCiPick([]);
    setLabels([]);
  };
  const nextFamily = () => {
    setCiHouse(null);
    setCiPick([]);
    setCiQuery("");
    setLabels([]);
  };
  const pickHouse = (hid: string) => {
    setCiHouse(hid);
    setCiPick(kidsOf(hid).filter((k) => !activeFor(k.id)).map((k) => k.id));
  };
  const checkIn = () => {
    if (!station || ciPick.length === 0) return;
    const code = makeCode();
    const guardian = adultsOf(station.id)[0]?.name ?? "Guardian";
    const time = ciService === "9 AM" ? "8:59 AM" : "10:58 AM";
    const added = kidsOf(station.id)
      .filter((k) => ciPick.includes(k.id))
      .map((k, i): CheckIn => ({ id: `${uid("c")}-${i}`, name: k.name, personId: k.id, household: station.name, age: k.age ?? 0, room: roomFor(k.age ?? 0), service: ciService, code, time, guardian, allergy: k.allergy ?? "None", out: false }));
    setCheckins((l) => [...added, ...l]);
    setLabels(added);
    setCiPick([]);
    app.notify(`${added.length + 1} labels printed for the ${station.name} household. Code ${code}`);
  };
  const coTarget = checkins.find((c) => c.id === checkoutId);
  const openCheckout = (c: CheckIn) => {
    setCheckoutId(c.id);
    setCodeEntry("");
    setCodeError(false);
    setModal("checkout");
  };
  const confirmCheckout = () => {
    if (!coTarget) return;
    if (codeEntry.trim().toUpperCase() !== coTarget.code) return setCodeError(true);
    setCheckins((l) => l.map((c) => (c.id === coTarget.id ? { ...c, out: true } : c)));
    close();
    app.notify(`${coTarget.name} checked out to ${coTarget.guardian}`);
  };

  // ---- Registration actions ----
  const updateEvent = (id: string, fn: (e: ChurchEvent) => ChurchEvent) => setEvents((l) => l.map((e) => (e.id === id ? fn(e) : e)));
  const updateAttendee = (a: Attendee, change: Partial<Attendee>) => ev && updateEvent(ev.id, (e) => ({ ...e, attendees: e.attendees.map((x) => (x.id === a.id ? { ...x, ...change } : x)) }));
  const markPaid = (a: Attendee) => {
    updateAttendee(a, { paid: true, method: "Cash" });
    app.notify(`${a.name} marked paid, ${peso(ev?.price ?? 0)} cash`);
  };
  const offerSpot = (w: Attendee) => {
    if (!ev) return;
    updateEvent(ev.id, (e) => ({ ...e, waitlist: e.waitlist.filter((x) => x.id !== w.id), attendees: [...e.attendees, w] }));
    app.notify(`Spot offered to ${w.name}. Payment link sent.`);
  };
  const addSpots = () => {
    if (!ev) return;
    updateEvent(ev.id, (e) => ({ ...e, capacity: e.capacity + 2 }));
    app.notify(`Capacity raised to ${ev.capacity + 2}`);
  };
  const openRegister = () => {
    if (!ev) return;
    const taken = new Set([...ev.attendees, ...ev.waitlist].map((a) => byId(a.personId)?.householdId));
    const free = people.find((x) => x.role !== "Child" && !taken.has(x.householdId));
    setRegDraft({ personId: free?.id ?? "p5", method: ev.price ? "GCash" : "Unpaid" });
    setModal("register");
  };
  const register = () => {
    const who = byId(regDraft.personId);
    if (!ev || !who) return;
    const method = regDraft.method === "Unpaid" ? undefined : regDraft.method;
    const paid = ev.price > 0 && !!method && !evFull;
    const entry: Attendee = { id: uid(`${ev.id}-`), name: who.name, personId: who.id, paid, method: paid ? method : undefined, checkedIn: false };
    updateEvent(ev.id, (e) => (evFull ? { ...e, waitlist: [...e.waitlist, entry] } : { ...e, attendees: [...e.attendees, entry] }));
    close();
    app.notify(evFull ? `${ev.name} is full. ${who.name} added to the waitlist.` : paid ? `${who.name} registered. ${peso(ev.price)} paid via ${method}.` : `${who.name} registered for ${ev.name}`);
  };
  const addEvent = () => {
    const name = eventDraft.name.trim();
    if (!name) return;
    setEvents((l) => [...l, { id: uid("e"), name, date: eventDraft.date.trim() || "Date to follow", location: eventDraft.location, capacity: Number(eventDraft.capacity) || 20, price: Number(eventDraft.price) || 0, opened: TODAY, attendees: [], waitlist: [] }]);
    setEventDraft({ name: "", date: "", location: "Fellowship hall", capacity: "40", price: "0" });
    close();
    app.notify(`${name} created. Registration is open.`);
  };

  // ---- Services actions ----
  const setSlot = (position: string, s: Slot) => setPlan((l) => ({ ...l, [`${service}|${position}`]: s }));
  const openSchedule = (team: string, position: string) => {
    setScheduling({ team, position });
    setModal("schedule");
  };
  const serviceSlots = Object.entries(plan).filter(([k]) => k.startsWith(`${service}|`)).map(([, s]) => s);
  const confirmSlot = (position: string, s: Slot) => {
    setSlot(position, { ...s, status: "Confirmed" });
    app.notify(`${s.name} confirmed for ${position}`);
  };
  const requestVolunteer = (name: string) => {
    if (!scheduling) return;
    setSlot(scheduling.position, { name, status: "Pending" });
    close();
    app.notify(`Request sent to ${name} for ${scheduling.position}, ${service}`);
  };

  // ---- Messages ----
  const audienceList = smart(audience).filter((x) => x.role !== "Child");
  const reachable = audienceList.filter((x) => (channel === "SMS" ? x.phone !== "—" : x.email !== "—"));
  const preview = body.split("{first_name}").join(reachable[0] ? first(reachable[0].name) : "friend");
  const sendMessage = () => {
    if (!body.trim() || reachable.length === 0) return;
    setMessages((l) => [{ id: uid("m"), date: TODAY, channel, title: subject.trim() || body.slice(0, 40), audience: listName(audience), recipients: reachable.length, rate: "Just sent" }, ...l]);
    app.notify(`${channel === "SMS" ? "SMS" : "Email"} sent to ${reachable.length} ${reachable.length === 1 ? "person" : "people"} in ${listName(audience)}`);
  };

  // ---- Calendar actions ----
  const draftClashes = clashes(bookingDraft);
  const saveBooking = () => {
    if (!bookingDraft.title.trim() || bookingDraft.end <= bookingDraft.start) return;
    const conflict = draftClashes.length > 0;
    setBookings((l) => [...l, { id: uid("bk"), ...bookingDraft, title: bookingDraft.title.trim(), by: "Pastor Joel", status: conflict ? "Pending" : "Booked" }]);
    close();
    app.notify(conflict ? "Request sent to the church office for approval" : `${bookingDraft.room} booked for ${DAYS[bookingDraft.day]}, ${hr(bookingDraft.start)}–${hr(bookingDraft.end)}`);
  };
  const booking = bookings.find((b) => b.id === bookingId);
  const openBooking = (id: string) => {
    setBookingId(id);
    setModal("bookingDetail");
  };
  const approveBooking = (b: Booking) => {
    setBookings((l) => l.map((x) => (x.id === b.id ? { ...x, status: "Booked" } : x)));
    close();
    app.notify(`Approved: ${b.title}`);
  };
  const removeBooking = (b: Booking, verb: string) => {
    setBookings((l) => l.filter((x) => x.id !== b.id));
    close();
    app.notify(`${verb}: ${b.title}`);
  };

  // ---- Reports ----
  const fundTotals = FUNDS.map((f) => ({ fund: f, total: FUND_BASE[f] + sum(gifts.filter((g) => g.fund === f).map((g) => g.amount)) }));
  const methodTotals = METHODS.map((m) => ({ method: m, total: sum(octGifts.filter((g) => g.method === m).map((g) => g.amount)) })).filter((x) => x.total > 0);
  const pledged = CAMPAIGN.otherPledged + sum(pledges.map((x) => x.pledged));
  const received = CAMPAIGN.otherGiven + sum(pledges.map((x) => x.given));

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "people", label: "People", icon: Users, badge: people.length },
    { id: "giving", label: "Giving", icon: HandCoins },
    { id: "checkins", label: "Check-ins", icon: ClipboardCheck },
    { id: "registrations", label: "Registrations", icon: Ticket },
    { id: "services", label: "Services", icon: HeartHandshake, badge: openSlots },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "calendar", label: "Calendar", icon: CalendarRange, badge: pendingBookings.length },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const adultIds = people.filter((x) => x.role !== "Child").map((x) => x.id);
  const visiblePeople = (list === "all" ? people : smart(list)).filter((x) => `${x.name} ${x.groups.join(" ")} ${houseOf(x.householdId)?.name ?? ""} ${x.phone}`.toLowerCase().includes(query.toLowerCase()));
  const ledger = [...gifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((g) => (fundFilter === "All" || g.fund === fundFilter) && (methodFilter === "All" || g.method === methodFilter) && giver(g.personId).toLowerCase().includes(giftQuery.toLowerCase()));
  const statementPerson = byId(statementFor);

  return (
    <ProtoApp app={app} name="Church OS · Grace Fellowship" user="Pastor Joel Navarro" nav={nav} alerts={openFollowUps.filter((f) => f.due <= TODAY).length + pendingBookings.length}>
      {/* ---- Dashboard ---- */}
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Dashboard" subtitle="Thursday, October 29" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Attendance, Oct 25" value="412" sub="+6% vs September" tone="good" />
            <Stat label="Giving, October" value={peso(octTotal)} sub={`${118 + activeRecurring.length} recurring givers`} />
            <Stat label="First-time guests" value={String(smart("guests").length)} sub="This month · 2 came back" />
            <Stat label="Away 4+ weeks" value={String(away.length)} sub="Members and regulars" tone="bad" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
            <Panel title="Attendance, last eight Sundays">
              <Bars data={TREND.total.slice(4).map((value, i) => ({ label: TREND_LABELS[i + 4], value }))} />
            </Panel>
            <Panel title="Needs a call this week">
              <ul className={listClass}>
                {away.map((d) => (
                  <li key={d.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={d.name} size={28} />
                    <button type="button" onClick={() => app.open("person", d.id, d.name)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{d.name}</span>
                      <span className="block text-[0.68rem] text-mist">{`Away ${d.weeksAway} weeks · ${d.groups[0] ?? "No ministry"}`}</span>
                    </button>
                    {followUps.some((f) => f.personId === d.id && !f.done) ? <Status tone="good">Assigned</Status> : <SmallButton onClick={() => assignCall(d)}>Assign</SmallButton>}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="This Sunday, November 1">
              <ul className={cn(listClass, "text-[0.8rem]")}>
                {[
                  { label: "Volunteer slots to fill", value: openSlots, action: "Open plan", go: () => app.section("services") },
                  { label: "Kids checked in, 9 AM", value: checkins.filter((c) => c.service === "9 AM" && !c.out).length, action: "Open check-in", go: () => app.section("checkins") },
                  { label: "Room requests waiting", value: pendingBookings.length, action: "Review", go: () => app.section("calendar") },
                  { label: "Couples Night waitlist", value: events.find((e) => e.id === "e2")?.waitlist.length ?? 0, action: "Open event", go: () => (app.section("registrations"), app.open("event", "e2", "Couples Night")) },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-3 py-2">
                    <span className="flex-1 text-ink-soft">{row.label}</span>
                    <span className="font-mono text-ink tabular-nums">{row.value}</span>
                    <SmallButton onClick={row.go}>{row.action}</SmallButton>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Follow-ups due">
              <ul className={listClass}>
                {openFollowUps.slice(0, 5).map((f) => (
                  <li key={f.id} className="flex items-center gap-2.5 py-2">
                    <button type="button" onClick={() => app.open("person", f.personId, giver(f.personId))} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.8rem] text-ink truncate">{f.task}</span>
                      <span className={cn("block text-[0.68rem]", f.due <= TODAY ? "text-danger" : "text-mist")}>{`${giver(f.personId)} · ${f.owner} · due ${fmt(f.due)}`}</span>
                    </button>
                    <SmallButton onClick={() => markDone(f)}>Mark done</SmallButton>
                  </li>
                ))}
                {openFollowUps.length === 0 && <li className="py-3 text-[0.8rem] text-mist">All caught up.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---- People ---- */}
      {app.screen === "people" && (
        <>
          <ScreenHeader
            title="People"
            subtitle={`${people.length} people · ${households.length} households`}
            action={
              <>
                <Segmented id="cos-pview" value={peopleView} onChange={setPeopleView} options={[{ id: "people", label: "People" }, { id: "households", label: "Households" }]} />
                <PrimaryButton onClick={() => setModal("person")}><UserPlus size={14} /> Add person</PrimaryButton>
              </>
            }
          />
          {peopleView === "people" ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[{ id: "all", name: "All people" }, ...SMART_LISTS].map((l) => (
                  <Chip key={l.id} on={list === l.id} onClick={() => setList(l.id)}>
                    <span>{l.name}</span>
                    <span className={cn("tabular-nums", list === l.id ? "text-sheet/75" : "text-mist")}>{l.id === "all" ? people.length : smart(l.id).length}</span>
                  </Chip>
                ))}
              </div>
              <div className="flex mb-3"><SearchBox value={query} onChange={setQuery} placeholder="Search name, group, household, phone" /></div>
              <Table
                rows={visiblePeople}
                rowKey={(r) => r.id}
                onRowClick={(r) => app.open("person", r.id, r.name)}
                empty="No one matches this list and search."
                columns={[
                  { key: "name", label: "Name", render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={24} /><span className="text-ink">{r.name}</span></span> },
                  { key: "house", label: "Household", render: (r) => houseOf(r.householdId)?.name ?? "—", hideOnMobile: true },
                  { key: "groups", label: "Groups", render: (r) => <span className="text-graphite">{r.groups.join(", ") || "—"}</span>, hideOnMobile: true },
                  { key: "last", label: "Last seen", render: (r) => fmt(SUNDAYS[Math.min(r.weeksAway, 7)]), hideOnMobile: true },
                  { key: "status", label: "Status", render: (r) => <Status tone={tone(r)}>{statusLabel(r)}</Status> },
                ]}
              />
            </>
          ) : (
            <Table
              rows={households}
              rowKey={(h) => h.id}
              onRowClick={(h) => app.open("household", h.id, `${h.name} household`)}
              columns={[
                { key: "name", label: "Household", render: (h) => <span className="text-ink">{`${h.name} household`}</span> },
                { key: "members", label: "Members", render: (h) => <span className="text-graphite">{membersOf(h.id).map((m) => first(m.name)).join(", ")}</span> },
                { key: "address", label: "Address", render: (h) => h.address, hideOnMobile: true },
                { key: "giving", label: "Giving, 2026", align: "right", render: (h) => <span className="font-mono text-ink">{peso(sum(membersOf(h.id).map((m) => ytd(m.id))))}</span> },
              ]}
            />
          )}
        </>
      )}

      {/* ---- Person record ---- */}
      {app.screen === "person" && p && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Avatar name={p.name} size={48} />
            <div className="flex-1 min-w-[10rem]">
              <h4 className="text-[1.35rem] leading-tight font-semibold text-ink tracking-[-0.01em]">{p.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[0.74rem] text-mist">
                <Status tone={tone(p)}>{statusLabel(p)}</Status>
                <span>{p.role === "Child" ? `Age ${p.age}` : p.firstVisit ? `First visit ${fmt(p.firstVisit)}` : `With us since ${p.joined}`}</span>
                <span>{`${houseOf(p.householdId)?.name ?? ""} household`}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.phone !== "—" && <SmallButton onClick={() => app.notify(`Text sent to ${first(p.name)}`)}><MessageSquare size={12} /> Text</SmallButton>}
              <SmallButton onClick={() => openEdit(p)}><Pencil size={12} /> Edit</SmallButton>
              <PrimaryButton onClick={() => openFollowUp(p)}><Plus size={14} /> Add follow-up</PrimaryButton>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Profile">
                <KeyValues
                  items={
                    p.role === "Child"
                      ? [["Age", String(p.age)], ["Room", roomFor(p.age ?? 0)], ["Allergies", <span key="a" className={p.allergy !== "None" ? "text-danger font-medium" : ""}>{p.allergy}</span>], ["Authorized pickup", adultsOf(p.householdId).map((a) => a.name).join(", ")]]
                      : [["Mobile", p.phone], ["Email", p.email], ["Groups", p.groups.join(", ") || "None yet"], ["Last attended", p.weeksAway === 0 ? "Oct 25" : `${fmt(SUNDAYS[Math.min(p.weeksAway, 7)])} · ${p.weeksAway} weeks ago`], ["Giving, 2026", peso(ytd(p.id))]]
                  }
                />
              </Panel>
              {p.role !== "Child" && (
                <Panel title="Custom fields" action={<SmallButton onClick={() => openEdit(p)}>Edit</SmallButton>}>
                  <KeyValues items={[["Baptized", p.baptized], ["Membership class", p.membershipClass], ["Life group", p.lifeGroup || "None"], ["Skills", p.skills || "—"]]} />
                </Panel>
              )}
              <Panel title="Household" action={<SmallButton onClick={() => app.open("household", p.householdId, `${houseOf(p.householdId)?.name ?? ""} household`)}>Open</SmallButton>}>
                <ul className={listClass}>
                  {membersOf(p.householdId).filter((m) => m.id !== p.id).map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => app.open("person", m.id, m.name)} className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer group">
                        <Avatar name={m.name} size={26} />
                        <span className="flex-1 text-[0.8rem] text-ink group-hover:text-gold-bright">{m.name}</span>
                        <span className="text-[0.7rem] text-mist">{m.role === "Child" ? `Child, ${m.age}` : m.role}</span>
                      </button>
                    </li>
                  ))}
                  {membersOf(p.householdId).length === 1 && <li className="py-2 text-[0.8rem] text-mist">No other family members yet.</li>}
                </ul>
              </Panel>
            </div>
            <Panel>
              <div className="mb-3">
                <Segmented id="cos-ptab" value={personTab} onChange={setPersonTab} options={[{ id: "timeline", label: "Timeline" }, { id: "notes", label: "Notes and follow-ups" }, { id: "giving", label: "Giving" }]} />
              </div>
              {personTab === "timeline" && (
                <ol className="relative flex flex-col gap-3 pl-4 before:absolute before:left-[3px] before:top-1 before:bottom-1 before:w-px before:bg-rule">
                  {timeline(p).map((t, i) => (
                    <li key={`${t.date}-${i}`} className="relative">
                      <span className={cn("absolute -left-4 top-1.5 w-[7px] h-[7px] rounded-full ring-2 ring-sheet", KIND_DOT[t.kind] ?? "bg-mist")} aria-hidden />
                      <div className="flex items-baseline gap-2 text-[0.68rem] text-mist">
                        <span className="font-medium text-graphite">{t.kind}</span>
                        <span>{t.date > TODAY && (t.kind === "Serving" || t.kind === "Follow-up") ? `${fmt(t.date)} · upcoming` : fmt(t.date)}</span>
                      </div>
                      <div className="text-[0.8rem] text-ink-soft">{t.text}</div>
                    </li>
                  ))}
                </ol>
              )}
              {personTab === "notes" && (
                <>
                  <div className="text-[0.72rem] font-medium text-mist mb-1.5">Follow-ups</div>
                  <ul className="flex flex-col divide-y divide-rule-soft mb-3">
                    {followUps.filter((f) => f.personId === p.id).map((f) => (
                      <li key={f.id} className="flex items-center gap-2 py-2">
                        <span className="flex-1 min-w-0">
                          <span className={cn("block text-[0.8rem]", f.done ? "text-mist line-through" : "text-ink")}>{f.task}</span>
                          <span className="block text-[0.68rem] text-mist">{`${f.owner} · due ${fmt(f.due)}`}</span>
                        </span>
                        {f.done ? <Status tone="good">Done</Status> : <SmallButton onClick={() => markDone(f)}>Mark done</SmallButton>}
                      </li>
                    ))}
                    {followUps.every((f) => f.personId !== p.id) && <li className="py-2 text-[0.8rem] text-mist">No follow-ups.</li>}
                  </ul>
                  <div className="text-[0.72rem] font-medium text-mist mb-1.5">Pastoral notes</div>
                  <ul className="flex flex-col gap-2 mb-3">
                    {p.notes.map((n) => (
                      <li key={n.id} className="rounded-md bg-paper border border-rule-soft px-2.5 py-2">
                        <div className="text-[0.8rem] text-ink-soft">{n.text}</div>
                        <div className="text-[0.66rem] text-mist mt-0.5">{`${n.by} · ${fmt(n.date)}`}</div>
                      </li>
                    ))}
                    {p.notes.length === 0 && <li className="text-[0.8rem] text-mist">No notes yet.</li>}
                  </ul>
                  <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), addNote())}>
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a private note" aria-label="Add a note" className={inputClass} />
                    <PrimaryButton type="submit" disabled={!note.trim()}>Save note</PrimaryButton>
                  </form>
                </>
              )}
              {personTab === "giving" && (
                <>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div className="text-[0.72rem] text-mist">2026 to date</div>
                      <div className="text-[1.3rem] font-semibold text-ink tabular-nums">{peso(ytd(p.id))}</div>
                    </div>
                    <SmallButton onClick={() => openStatement(p.id)}><FileText size={12} /> Preview statement</SmallButton>
                  </div>
                  {recurring.filter((r) => r.personId === p.id).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 mb-3 px-2.5 py-2 rounded-md bg-gold-wash text-[0.78rem] text-ink-soft">
                      <span>{`Recurring: ${peso(r.amount)} ${r.frequency.toLowerCase()} to ${r.fund} via ${r.method}`}</span>
                      <Status tone={r.status === "Active" ? "good" : "warn"}>{r.status}</Status>
                    </div>
                  ))}
                  <ul className="flex flex-col divide-y divide-rule-soft text-[0.8rem]">
                    {givenBy(p.id).map((g) => (
                      <li key={g.id} className="flex justify-between gap-2 py-1.5">
                        <span className="text-ink-soft">{`${fmt(g.date)} · ${g.fund} · ${g.method}`}</span>
                        <span className="font-mono text-ink">{peso(g.amount)}</span>
                      </li>
                    ))}
                    {givenBy(p.id).length === 0 && <li className="py-2 text-mist">No gifts recorded this year.</li>}
                  </ul>
                </>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ---- Household ---- */}
      {app.screen === "household" && house && (
        <>
          <ScreenHeader title={`${house.name} household`} subtitle={house.address} action={<PrimaryButton onClick={() => setModal("member")}><UserPlus size={14} /> Add family member</PrimaryButton>} />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Members" value={String(membersOf(house.id).length)} sub={`${kidsOf(house.id).length} kids`} />
            <Stat label="Giving, 2026" value={peso(sum(membersOf(house.id).map((m) => ytd(m.id))))} />
            <Stat label="Campaign pledge" value={peso(pledges.find((x) => x.householdId === house.id)?.pledged ?? 0)} sub={CAMPAIGN.name} />
          </div>
          <Table
            rows={membersOf(house.id)}
            rowKey={(m) => m.id}
            onRowClick={(m) => app.open("person", m.id, m.name)}
            columns={[
              { key: "name", label: "Name", render: (m) => <span className="flex items-center gap-2"><Avatar name={m.name} size={24} /><span className="text-ink">{m.name}</span></span> },
              { key: "role", label: "Role", render: (m) => (m.role === "Child" ? `Child, age ${m.age}` : m.role) },
              { key: "contact", label: "Contact", render: (m) => (m.role === "Child" ? `Allergies: ${m.allergy}` : m.phone), hideOnMobile: true },
              { key: "status", label: "Status", render: (m) => <Status tone={tone(m)}>{statusLabel(m)}</Status> },
            ]}
          />
        </>
      )}

      {/* ---- Giving ---- */}
      {app.screen === "giving" && (
        <>
          <ScreenHeader title="Giving" subtitle="GCash, Maya, card, bank and Sunday batches in one ledger" action={<PrimaryButton onClick={() => setModal("gift")}><Plus size={14} /> Record gift</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="October to date" value={peso(octTotal)} sub="+8% vs September" tone="good" />
            <Stat label="Recurring givers" value={String(118 + activeRecurring.length)} sub={`${recurring.filter((r) => r.status === "Card expiring").length} card expiring`} />
            <Stat label="Given online" value={`${onlineShare}%`} sub="Of October gifts" />
            <Stat label="Open batches" value={String(batches.filter((b) => b.status === "Open").length)} sub="Waiting to commit" />
          </div>
          <div className="mb-3 overflow-x-auto">
            <Segmented id="cos-gtab" value={givingTab} onChange={setGivingTab} options={[{ id: "donations", label: "Donations" }, { id: "batches", label: "Batches" }, { id: "recurring", label: "Recurring" }, { id: "campaign", label: "Campaign" }, { id: "statements", label: "Statements" }]} />
          </div>

          {givingTab === "donations" && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                <SearchBox value={giftQuery} onChange={setGiftQuery} placeholder="Search giver" />
                <select aria-label="Fund" value={fundFilter} onChange={(e) => setFundFilter(e.target.value as "All" | Fund)} className={selectClass}>
                  <option value="All">All funds</option>
                  {FUNDS.map((f) => <option key={f}>{f}</option>)}
                </select>
                <select aria-label="Method" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as "All" | Method)} className={selectClass}>
                  <option value="All">All methods</option>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <Table
                rows={ledger}
                rowKey={(g) => g.id}
                onRowClick={(g) => g.personId && app.open("person", g.personId, giver(g.personId))}
                empty="No gifts match these filters."
                columns={[
                  { key: "date", label: "Date", render: (g) => fmt(g.date) },
                  { key: "who", label: "Giver", render: (g) => <span className={g.personId ? "text-ink" : "text-graphite"}>{giver(g.personId)}</span> },
                  { key: "fund", label: "Fund", render: (g) => g.fund },
                  { key: "method", label: "Method", render: (g) => g.method, hideOnMobile: true },
                  { key: "ref", label: "Reference", render: (g) => <span className="font-mono text-[0.7rem] text-mist">{g.ref}</span>, hideOnMobile: true },
                  { key: "amount", label: "Amount", align: "right", render: (g) => <span className="font-mono text-ink">{peso(g.amount)}</span> },
                ]}
              />
              <p className="mt-2 text-[0.72rem] text-mist">{`Filtered total ${peso(sum(ledger.map((g) => g.amount)))}`}</p>
            </>
          )}

          {givingTab === "batches" && (
            <Table
              rows={batches}
              rowKey={(b) => b.id}
              onRowClick={(b) => app.open("batch", b.id, `${b.name}, ${fmt(b.date)}`)}
              columns={[
                { key: "name", label: "Batch", render: (b) => <span><span className="block text-ink">{b.name}</span><span className="block text-[0.68rem] text-mist">{fmt(b.date)}</span></span> },
                { key: "by", label: "Counted by", render: (b) => b.counters, hideOnMobile: true },
                { key: "n", label: "Entries", render: (b) => b.items.length },
                { key: "total", label: "Counted", align: "right", render: (b) => <span className="font-mono text-ink">{peso(b.counted)}</span> },
                { key: "status", label: "Status", render: (b) => (b.status === "Committed" ? <Status tone="good">Committed</Status> : sum(b.items.map((i) => i.amount)) === b.counted ? <Status tone="muted">Balanced</Status> : <Status tone="warn">Unbalanced</Status>) },
              ]}
            />
          )}

          {givingTab === "recurring" && (
            <Table
              rows={recurring}
              rowKey={(r) => r.id}
              onRowClick={(r) => app.open("person", r.personId, giver(r.personId))}
              columns={[
                { key: "who", label: "Giver", render: (r) => <span className="text-ink">{giver(r.personId)}</span> },
                { key: "amount", label: "Schedule", render: (r) => `${peso(r.amount)} ${r.frequency.toLowerCase()}` },
                { key: "fund", label: "Fund", render: (r) => r.fund, hideOnMobile: true },
                { key: "method", label: "Method", render: (r) => r.method, hideOnMobile: true },
                { key: "next", label: "Next", render: (r) => (r.status === "Paused" ? "—" : fmt(r.next)), hideOnMobile: true },
                { key: "status", label: "Status", render: (r) => <Status tone={r.status === "Active" ? "good" : r.status === "Paused" ? "muted" : "warn"}>{r.status}</Status> },
                { key: "act", label: "", align: "right", render: (r) => <SmallButton onClick={() => toggleRecurring(r)}>{r.status === "Active" ? "Pause" : r.status === "Paused" ? "Resume" : "Send card link"}</SmallButton> },
              ]}
            />
          )}

          {givingTab === "campaign" && (
            <>
              <Panel title={`${CAMPAIGN.name} · ${CAMPAIGN.purpose}`} className="mb-3" action={<SmallButton onClick={openPledge}><Plus size={12} /> Add pledge</SmallButton>}>
                <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[1.45rem] font-semibold text-ink tabular-nums leading-tight">{peso(pledged)}</div>
                    <div className="text-[0.74rem] text-mist">{`pledged of ${peso(CAMPAIGN.goal)} · ${Math.round((pledged / CAMPAIGN.goal) * 100)}%`}</div>
                  </div>
                  <div className="text-right text-[0.74rem] text-mist">
                    <div className="font-mono text-ink text-[0.9rem]">{peso(received)}</div>
                    received so far
                  </div>
                </div>
                <Meter value={pledged} max={CAMPAIGN.goal} className="mb-1.5 h-2" />
                <Meter value={received} max={CAMPAIGN.goal} className="h-2" />
                <div className="mt-2 text-[0.72rem] text-mist">{`${CAMPAIGN.otherHouseholds + pledges.length} households pledged · three-year campaign, ends ${CAMPAIGN.ends}`}</div>
              </Panel>
              <Table
                rows={[...pledges].sort((a, b) => b.pledged - a.pledged)}
                rowKey={(x) => x.id}
                onRowClick={(x) => app.open("household", x.householdId, `${houseOf(x.householdId)?.name ?? ""} household`)}
                columns={[
                  { key: "h", label: "Household", render: (x) => <span className="text-ink">{`${houseOf(x.householdId)?.name ?? ""} household`}</span> },
                  { key: "pledged", label: "Pledged", align: "right", render: (x) => <span className="font-mono">{peso(x.pledged)}</span> },
                  { key: "given", label: "Given", align: "right", render: (x) => <span className="font-mono">{peso(x.given)}</span>, hideOnMobile: true },
                  { key: "progress", label: "Progress", render: (x) => <span className="flex items-center gap-2"><Meter value={x.given} max={x.pledged} className="w-16" /><span className="font-mono text-[0.7rem]">{`${Math.round((x.given / x.pledged) * 100)}%`}</span></span> },
                ]}
              />
            </>
          )}

          {givingTab === "statements" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-[0.78rem] text-mist">{`Jan 1 – Oct 29, 2026 · ${statementGivers.length} givers · ${sentStatements.length} sent`}</p>
                <PrimaryButton onClick={sendAllStatements}><Mail size={14} /> Send all statements</PrimaryButton>
              </div>
              <Table
                rows={statementGivers}
                rowKey={(x) => x.id}
                onRowClick={(x) => openStatement(x.id)}
                columns={[
                  { key: "who", label: "Giver", render: (x) => <span className="text-ink">{x.name}</span> },
                  { key: "to", label: "Delivery", render: (x) => (x.email === "—" ? "Print and mail" : x.email), hideOnMobile: true },
                  { key: "total", label: "2026 total", align: "right", render: (x) => <span className="font-mono text-ink">{peso(ytd(x.id))}</span> },
                  { key: "status", label: "Status", render: (x) => (sentStatements.includes(x.id) ? <Status tone="good">Sent</Status> : <Status tone="muted">Not sent</Status>) },
                ]}
              />
            </>
          )}
        </>
      )}

      {/* ---- Batch detail ---- */}
      {app.screen === "batch" && batch && (
        <>
          <ScreenHeader
            title={`${batch.name}, ${fmt(batch.date)}`}
            subtitle={`Counted by ${batch.counters}`}
            action={
              batch.status === "Open" ? (
                <>
                  <SmallButton onClick={openEntry}><Plus size={12} /> Add entry</SmallButton>
                  <PrimaryButton disabled={remaining !== 0} onClick={() => commitBatch(batch)}><Check size={14} /> Commit batch</PrimaryButton>
                </>
              ) : (
                <Status tone="good">Committed</Status>
              )
            }
          />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Counted" value={peso(batch.counted)} sub="Two-person count" />
            <Stat label="Entered" value={peso(entered)} sub={`${batch.items.length} entries`} />
            <Stat label="Difference" value={peso(Math.abs(remaining))} sub={remaining === 0 ? "Balanced" : remaining > 0 ? "Still to enter" : "Over the count"} tone={remaining === 0 ? "good" : "bad"} />
          </div>
          {batch.status === "Open" && remaining !== 0 && (
            <p className="mb-3 px-3 py-2 rounded-md bg-warn/10 text-[0.78rem] text-warn">{remaining > 0 ? `Enter ${peso(remaining)} more to balance this batch before committing.` : `Entries are ${peso(-remaining)} over the count. Check the envelopes.`}</p>
          )}
          <Table
            rows={batch.items}
            rowKey={(i) => i.id}
            onRowClick={(i) => i.personId && app.open("person", i.personId, giver(i.personId))}
            columns={[
              { key: "who", label: "Giver", render: (i) => <span className={i.personId ? "text-ink" : "text-graphite"}>{giver(i.personId)}</span> },
              { key: "method", label: "Method", render: (i) => (i.check ? `Check · ${i.check}` : "Cash") },
              { key: "fund", label: "Fund", render: (i) => i.fund, hideOnMobile: true },
              { key: "amount", label: "Amount", align: "right", render: (i) => <span className="font-mono text-ink">{peso(i.amount)}</span> },
            ]}
          />
        </>
      )}

      {/* ---- Check-ins ---- */}
      {app.screen === "checkins" && (
        <>
          <ScreenHeader title="Kids check-in" subtitle="Sunday, November 1 · Kids wing" action={<Segmented id="cos-cisvc" value={ciService} onChange={switchSession} options={[{ id: "9 AM", label: "9 AM" }, { id: "11 AM", label: "11 AM" }]} />} />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {KID_ROOMS.map((r) => {
              const count = sessionIns.filter((c) => c.room === r.id && !c.out).length;
              const lead = plan[`${ciService}|${r.id}`];
              const staffed = !!lead?.name && lead.status !== "Declined";
              return (
                <div key={r.id} className="bg-sheet border border-rule rounded-lg p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.8rem] font-semibold text-ink">{r.id}</span>
                    <span className="text-[0.66rem] text-mist">{r.ages}</span>
                  </div>
                  <div className="text-[1.3rem] font-semibold text-ink tabular-nums mt-1">
                    {count}
                    <span className="text-[0.8rem] font-normal text-mist">{` / ${r.capacity}`}</span>
                  </div>
                  <Meter value={count} max={r.capacity} className="my-1.5" />
                  <div className={cn("text-[0.68rem] truncate", staffed ? "text-mist" : "text-danger")}>{staffed ? `Lead: ${lead.name}` : "No lead scheduled"}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-3">
            <Panel title="Station" action={station && <SmallButton onClick={nextFamily}>Next family</SmallButton>}>
              {!station && <div className="flex mb-2.5"><SearchBox value={ciQuery} onChange={setCiQuery} placeholder="Family name or last 4 of phone" /></div>}
              <ul className="flex flex-col gap-1">
                {(station ? [station] : stationHouses).map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => pickHouse(h.id)} aria-pressed={ciHouse === h.id} className={cn("w-full text-left px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer", ciHouse === h.id ? "border-gold bg-gold-wash" : "border-transparent hover:bg-paper")}>
                      <span className="block text-[0.8rem] text-ink">{`${h.name} household`}</span>
                      <span className="block text-[0.68rem] text-mist">{kidsOf(h.id).map((k) => `${first(k.name)} (${k.age})`).join(", ")}</span>
                    </button>
                  </li>
                ))}
                {stationHouses.length === 0 && <li className="py-2 text-[0.8rem] text-mist">No family found. Try a phone number.</li>}
              </ul>
              {station && (
                <div className="mt-3 pt-3 border-t border-rule">
                  <div className="text-[0.74rem] font-medium text-ink-soft mb-1.5">{`Who is here from the ${station.name} household?`}</div>
                  <div className="flex flex-col gap-1 mb-3">
                    {kidsOf(station.id).map((k) => {
                      const inside = activeFor(k.id);
                      const on = ciPick.includes(k.id);
                      return (
                        <button key={k.id} type="button" disabled={!!inside} aria-pressed={on} onClick={() => setCiPick((l) => (on ? l.filter((x) => x !== k.id) : [...l, k.id]))} className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-rule text-left cursor-pointer disabled:cursor-default disabled:opacity-60">
                          <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", on ? "bg-gold border-gold text-sheet" : "border-rule")}>{on && <Check size={11} />}</span>
                          <span className="flex-1 text-[0.8rem] text-ink">{k.name}</span>
                          <span className={cn("text-[0.68rem]", k.allergy !== "None" ? "text-danger" : "text-mist")}>{inside ? `Checked in · ${inside.code}` : `${roomFor(k.age ?? 0)}${k.allergy !== "None" ? ` · ${k.allergy}` : ""}`}</span>
                        </button>
                      );
                    })}
                  </div>
                  <PrimaryButton disabled={ciPick.length === 0} onClick={checkIn}><Printer size={14} /> Check in and print labels</PrimaryButton>
                </div>
              )}
              {labels.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rule">
                  <div className="text-[0.72rem] text-mist mb-1.5">Printed labels</div>
                  <div className="grid grid-cols-2 gap-2">
                    {labels.map((k) => (
                      <div key={k.id} className="rounded-md border border-rule bg-paper p-2">
                        <div className="text-[0.8rem] font-semibold text-ink">{k.name}</div>
                        <div className="text-[0.66rem] text-mist">{`${k.room} · ${k.service} · Nov 1`}</div>
                        <div className={cn("text-[0.66rem]", k.allergy !== "None" ? "text-danger font-medium" : "text-mist")}>{k.allergy !== "None" ? `Allergy: ${k.allergy}` : "No allergies"}</div>
                        <div className="font-mono text-[1rem] font-semibold text-ink mt-0.5">{k.code}</div>
                      </div>
                    ))}
                    <div className="rounded-md border border-dashed border-mist bg-raised p-2">
                      <div className="text-[0.8rem] font-semibold text-ink">Parent tag</div>
                      <div className="text-[0.66rem] text-mist">{`${labels[0].household} household · show at pickup`}</div>
                      <div className="font-mono text-[1rem] font-semibold text-ink mt-0.5">{labels[0].code}</div>
                    </div>
                  </div>
                </div>
              )}
            </Panel>
            <Panel
              title={`Checked in · ${sessionIns.filter((c) => !c.out).length}`}
              action={
                <select aria-label="Room" value={ciRoom} onChange={(e) => setCiRoom(e.target.value as "All" | Room)} className="h-7 px-1.5 rounded-md bg-paper border border-rule text-[0.72rem] text-ink cursor-pointer">
                  <option value="All">All rooms</option>
                  {KID_ROOMS.map((r) => <option key={r.id}>{r.id}</option>)}
                </select>
              }
            >
              <ul className={listClass}>
                {sessionIns.filter((c) => ciRoom === "All" || c.room === ciRoom).map((c) => (
                  <li key={c.id} className={cn("flex items-center gap-2.5 py-2", c.out && "opacity-55")}>
                    <Avatar name={c.name} size={26} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.8rem] text-ink truncate">{c.name}</span>
                      <span className="block text-[0.68rem] text-mist truncate">
                        {`${c.room} · ${c.time}`}
                        {c.allergy !== "None" && <span className="text-danger">{` · ${c.allergy}`}</span>}
                      </span>
                    </span>
                    <span className="font-mono text-[0.72rem] text-graphite">{c.code}</span>
                    {c.out ? <Status tone="muted">Picked up</Status> : <SmallButton onClick={() => openCheckout(c)}>Check out</SmallButton>}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Registrations ---- */}
      {app.screen === "registrations" && (
        <>
          <ScreenHeader title="Registrations" subtitle="Sign-ups, payments, waitlists and check-in" action={<PrimaryButton onClick={() => setModal("event")}><Plus size={14} /> New event</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Open events" value={String(events.length)} />
            <Stat label="Registered" value={String(sum(events.map((e) => e.attendees.length)))} sub="Across all events" />
            <Stat label="Collected" value={peso(sum(events.map((e) => e.attendees.filter((a) => a.paid).length * e.price)))} sub="GCash, Maya, card, bank" tone="good" />
            <Stat label="On waitlists" value={String(sum(events.map((e) => e.waitlist.length)))} />
          </div>
          <Table
            rows={events}
            rowKey={(e) => e.id}
            onRowClick={(e) => app.open("event", e.id, e.name)}
            columns={[
              { key: "name", label: "Event", render: (e) => <span><span className="block text-ink">{e.name}</span><span className="block text-[0.68rem] text-mist">{e.location}</span></span> },
              { key: "date", label: "Date", render: (e) => e.date },
              { key: "price", label: "Price", render: (e) => (e.price ? peso(e.price) : "Free"), hideOnMobile: true },
              { key: "reg", label: "Registered", render: (e) => <span className="flex items-center gap-2"><Meter value={e.attendees.length} max={e.capacity} className="w-14" /><span className="font-mono text-[0.7rem]">{`${e.attendees.length}/${e.capacity}`}</span></span> },
              { key: "status", label: "Status", render: (e) => (e.attendees.length >= e.capacity ? <Status tone="warn">{e.waitlist.length ? `Full · ${e.waitlist.length} waiting` : "Full"}</Status> : <Status tone="good">Open</Status>) },
            ]}
          />
        </>
      )}

      {app.screen === "event" && ev && (
        <>
          <ScreenHeader
            title={ev.name}
            subtitle={`${ev.date} · ${ev.location} · ${ev.price ? `${peso(ev.price)} per registration` : "Free"}`}
            action={
              <>
                <SmallButton onClick={() => app.notify(`Reminder sent to ${ev.attendees.length} registrants`)}><Send size={12} /> Send reminder</SmallButton>
                <PrimaryButton onClick={openRegister}><UserPlus size={14} /> Register someone</PrimaryButton>
              </>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Registered" value={`${ev.attendees.length} / ${ev.capacity}`} sub={evFull ? "Full" : `${ev.capacity - ev.attendees.length} spots left`} tone={evFull ? "bad" : undefined} />
            <Stat label="Waitlist" value={String(ev.waitlist.length)} />
            <Stat label="Collected" value={ev.price ? peso(ev.attendees.filter((a) => a.paid).length * ev.price) : "Free"} sub={ev.price ? `${ev.attendees.filter((a) => !a.paid).length} unpaid` : undefined} />
            <Stat label="Checked in" value={String(ev.attendees.filter((a) => a.checkedIn).length)} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-3">
            <Panel title="Attendees" action={<Segmented id="cos-reg" value={regFilter} onChange={setRegFilter} options={[{ id: "all", label: "All" }, { id: "unpaid", label: "Unpaid" }, { id: "in", label: "Checked in" }]} />}>
              <ul className={listClass}>
                {ev.attendees.filter((a) => regFilter === "all" || (regFilter === "unpaid" ? ev.price > 0 && !a.paid : a.checkedIn)).map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={a.name} size={26} />
                    <span className="flex-1 min-w-0">
                      {a.personId ? (
                        <button type="button" onClick={() => app.open("person", a.personId, giver(a.personId ?? null))} className="block text-[0.8rem] text-ink hover:text-gold-bright truncate cursor-pointer">{a.name}</button>
                      ) : (
                        <span className="block text-[0.8rem] text-ink truncate">{a.name}</span>
                      )}
                      <span className="block text-[0.68rem] text-mist">{ev.price === 0 ? "Free registration" : a.paid ? `Paid · ${a.method}` : "Unpaid"}</span>
                    </span>
                    {ev.price > 0 && !a.paid && <SmallButton onClick={() => markPaid(a)}>Mark paid</SmallButton>}
                    <button type="button" aria-pressed={a.checkedIn} onClick={() => updateAttendee(a, { checkedIn: !a.checkedIn })} className={cn("px-2.5 py-1 rounded-md text-[0.72rem] font-medium border transition-colors cursor-pointer", a.checkedIn ? "bg-gold border-gold text-sheet" : "border-rule text-ink hover:border-gold")}>
                      {a.checkedIn ? "Checked in" : "Check in"}
                    </button>
                  </li>
                ))}
                {ev.attendees.length === 0 && <li className="py-3 text-[0.8rem] text-mist">No one has registered yet.</li>}
              </ul>
            </Panel>
            <Panel title={`Waitlist · ${ev.waitlist.length}`} action={<SmallButton onClick={addSpots}>Add 2 spots</SmallButton>}>
              <ul className={listClass}>
                {ev.waitlist.map((w, i) => (
                  <li key={w.id} className="flex items-center gap-2.5 py-2">
                    <span className="w-5 text-[0.7rem] font-mono text-mist">{i + 1}</span>
                    <span className="flex-1 text-[0.8rem] text-ink truncate">{w.name}</span>
                    <SmallButton disabled={evFull} onClick={() => offerSpot(w)}>Offer spot</SmallButton>
                  </li>
                ))}
                {ev.waitlist.length === 0 && <li className="py-3 text-[0.8rem] text-mist">No one is waiting.</li>}
              </ul>
              {evFull && ev.waitlist.length > 0 && <p className="mt-2 text-[0.7rem] text-mist">Full. Add spots or wait for a cancellation to offer one.</p>}
            </Panel>
          </div>
        </>
      )}

      {/* ---- Services ---- */}
      {app.screen === "services" && (
        <>
          <ScreenHeader title="Sunday plan" subtitle="Sunday, November 1 · Faithful in little things" action={<Segmented id="cos-svc" value={service} onChange={setService} options={[{ id: "9 AM", label: "9 AM" }, { id: "11 AM", label: "11 AM" }]} />} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Confirmed" value={String(serviceSlots.filter((s) => s.name && s.status === "Confirmed").length)} sub={`of ${serviceSlots.length} positions`} tone="good" />
            <Stat label="Pending" value={String(serviceSlots.filter((s) => s.name && s.status === "Pending").length)} sub="Waiting for a reply" />
            <Stat label="Declined" value={String(serviceSlots.filter((s) => s.status === "Declined").length)} sub="Need a replacement" tone="bad" />
            <Stat label="Open slots" value={String(serviceSlots.filter((s) => !s.name).length)} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-3">
            <div className="flex flex-col gap-3">
              {TEAMS.map((t) => (
                <Panel key={t.team} title={`${t.team} team`} action={<span className="text-[0.7rem] text-mist">{`${t.positions.filter((pos) => plan[`${service}|${pos}`].name && plan[`${service}|${pos}`].status === "Confirmed").length} of ${t.positions.length} confirmed`}</span>}>
                  <ul className={listClass}>
                    {t.positions.map((pos) => {
                      const s = plan[`${service}|${pos}`];
                      const needs = !s.name || s.status === "Declined";
                      return (
                        <li key={pos} className="flex items-center gap-2.5 py-2">
                          {s.name ? <Avatar name={s.name} size={26} /> : <span className="w-[26px] h-[26px] rounded-full border border-dashed border-mist shrink-0" aria-hidden />}
                          <span className="flex-1 min-w-0">
                            <span className="block text-[0.8rem] text-ink">{pos}</span>
                            <span className={cn("block text-[0.68rem] truncate", needs ? "text-danger" : "text-mist")}>{!s.name ? "Open slot" : s.status === "Declined" ? `${s.name} declined · ${s.reason ?? ""}` : s.name}</span>
                          </span>
                          {s.name && s.status !== "Declined" && <Status tone={s.status === "Confirmed" ? "good" : "warn"}>{s.status}</Status>}
                          {s.name && s.status === "Pending" && <SmallButton onClick={() => app.notify(`Reminder sent to ${s.name}`)}>Remind</SmallButton>}
                          {s.name && s.status === "Pending" && <SmallButton onClick={() => confirmSlot(pos, s)}>Confirm</SmallButton>}
                          {needs && <SmallButton onClick={() => openSchedule(t.team, pos)}>{s.name ? "Replace" : "Schedule"}</SmallButton>}
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              ))}
            </div>
            <Panel title="Order of service" className="h-fit">
              <ol className={listClass}>
                {ORDER.map(([min, item, who, length]) => {
                  const at = (service === "9 AM" ? 9 * 60 : 11 * 60) + min;
                  return (
                    <li key={item} className="flex gap-2.5 py-2">
                      <span className="w-10 shrink-0 font-mono text-[0.7rem] text-mist pt-0.5">{`${Math.floor(at / 60) % 12 || 12}:${String(at % 60).padStart(2, "0")}`}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8rem] text-ink">{item}</span>
                        <span className="block text-[0.68rem] text-mist">{`${who === "Worship leader" ? plan[`${service}|Worship leader`].name ?? who : who} · ${length}`}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 pt-2 border-t border-rule text-[0.72rem] text-mist">Runs 1 hr 15 min · plan locks Saturday 6 PM</p>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Messages ---- */}
      {app.screen === "messages" && (
        <>
          <ScreenHeader title="Messages" subtitle="Email and SMS to any smart list" />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-3 mb-3">
            <Panel title="New message" action={<Segmented id="cos-chan" value={channel} onChange={setChannel} options={[{ id: "SMS", label: "SMS" }, { id: "Email", label: "Email" }]} />}>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-[0.76rem] font-medium text-ink-soft mb-1.5">To</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SMART_LISTS.filter((l) => l.id !== "kids").map((l) => (
                      <Chip key={l.id} on={audience === l.id} onClick={() => setAudience(l.id)}>
                        <span>{l.name}</span>
                        <span className={cn("tabular-nums", audience === l.id ? "text-sheet/75" : "text-mist")}>{smart(l.id).length}</span>
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[0.76rem] font-medium text-ink-soft mb-1.5">Start from a template</div>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATES.map((t) => (
                      <Chip key={t.name} on={body === t.body} onClick={() => (setSubject(t.subject), setBody(t.body))}>
                        {t.name}
                      </Chip>
                    ))}
                  </div>
                </div>
                <TextField label={channel === "Email" ? "Subject" : "Label (for your records)"} value={subject} onChange={setSubject} />
                <Field label="Message">
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} className={textareaClass} />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[0.7rem] text-mist">{channel === "SMS" ? `${body.length} characters · ${Math.max(1, Math.ceil(body.length / 160))} SMS each · {first_name} fills in` : "{first_name} fills in for each person"}</span>
                  <PrimaryButton disabled={!body.trim() || reachable.length === 0} onClick={sendMessage}>
                    <Send size={14} />
                    {channel === "SMS" ? "Send SMS" : "Send email"}
                  </PrimaryButton>
                </div>
              </div>
            </Panel>
            <Panel title="Preview">
              <div className="text-[0.74rem] text-mist mb-2">
                {`To ${reachable.length} ${reachable.length === 1 ? "person" : "people"} in ${listName(audience)}`}
                {audienceList.length > reachable.length && <span className="text-warn">{` · ${audienceList.length - reachable.length} skipped, no ${channel === "SMS" ? "mobile number" : "email"}`}</span>}
              </div>
              {channel === "SMS" ? (
                <div className="rounded-lg bg-raised p-3">
                  <div className="text-[0.66rem] text-mist mb-1.5">Grace Fellowship · SMS</div>
                  <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-sheet border border-rule px-3 py-2 text-[0.8rem] text-ink whitespace-pre-wrap">{preview || "Your message appears here."}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-rule bg-paper text-[0.8rem]">
                  <div className="px-3 py-2 border-b border-rule text-[0.72rem] text-mist">
                    <div>From: Grace Fellowship office</div>
                    <div>{`To: ${reachable[0]?.email ?? "—"}`}</div>
                  </div>
                  <div className="px-3 pt-2 font-semibold text-ink">{subject || "No subject"}</div>
                  <div className="px-3 pb-3 pt-1 text-ink-soft whitespace-pre-wrap">{preview || "Your message appears here."}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {reachable.slice(0, 8).map((x) => (
                  <span key={x.id} className="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-raised text-[0.7rem] text-ink-soft">
                    <Avatar name={x.name} size={18} />
                    {x.name}
                  </span>
                ))}
                {reachable.length > 8 && <span className="text-[0.7rem] text-mist self-center">{`and ${reachable.length - 8} more`}</span>}
              </div>
            </Panel>
          </div>
          <Table
            rows={messages}
            rowKey={(m) => m.id}
            columns={[
              { key: "date", label: "Sent", render: (m) => fmt(m.date) },
              { key: "title", label: "Message", render: (m) => <span className="text-ink">{m.title}</span> },
              { key: "channel", label: "Channel", render: (m) => m.channel, hideOnMobile: true },
              { key: "aud", label: "Audience", render: (m) => m.audience, hideOnMobile: true },
              { key: "n", label: "People", align: "right", render: (m) => <span className="font-mono">{m.recipients}</span> },
              { key: "rate", label: "Result", render: (m) => <span className="text-graphite">{m.rate}</span>, hideOnMobile: true },
            ]}
          />
        </>
      )}

      {/* ---- Calendar ---- */}
      {app.screen === "calendar" && (
        <>
          <ScreenHeader title="Calendar" subtitle="Rooms and resources · Oct 26 – Nov 1" action={<PrimaryButton onClick={() => setModal("booking")}><Plus size={14} /> Book a room</PrimaryButton>} />
          {pendingBookings.length > 0 && (
            <Panel title={`Requests waiting · ${pendingBookings.length}`} className="mb-3">
              <ul className={listClass}>
                {pendingBookings.map((b) => {
                  const c = clashes(b);
                  return (
                    <li key={b.id} className="flex flex-wrap items-center gap-2.5 py-2">
                      <span className="flex-1 min-w-[12rem]">
                        <span className="block text-[0.8rem] text-ink">{b.title}</span>
                        <span className="block text-[0.68rem] text-mist">{`${b.room} · ${DAYS[b.day]} · ${hr(b.start)}–${hr(b.end)} · ${b.by}`}</span>
                        {c.length > 0 && <span className="block text-[0.68rem] text-danger">{`Conflicts with ${c.map((o) => `${o.title}, ${hr(o.start)}–${hr(o.end)}`).join("; ")}`}</span>}
                      </span>
                      <SmallButton onClick={() => removeBooking(b, "Declined")}>Decline</SmallButton>
                      <SmallButton onClick={() => approveBooking(b)}>Approve</SmallButton>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
          <div className="bg-sheet border border-rule rounded-lg overflow-x-auto shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <table className="w-full min-w-[46rem] text-left table-fixed">
              <thead>
                <tr className="border-b border-rule bg-paper">
                  <th className="w-[7.5rem] px-2.5 py-2 text-[0.7rem] font-medium text-mist">Room</th>
                  {DAYS.map((d, i) => <th key={d} className={cn("px-1.5 py-2 text-[0.7rem] font-medium", i === 3 ? "text-gold" : "text-mist")}>{i === 3 ? `${d} · today` : d}</th>)}
                </tr>
              </thead>
              <tbody>
                {ROOMS.map((room) => (
                  <tr key={room} className="border-b border-rule-soft last:border-0">
                    <td className="px-2.5 py-2 align-top text-[0.74rem] font-medium text-ink">{room}</td>
                    {DAYS.map((d, day) => (
                      <td key={d} className={cn("p-1 align-top border-l border-rule-soft", day === 3 && "bg-gold-wash/40")}>
                        <div className="flex flex-col gap-1">
                          {bookings.filter((b) => b.room === room && b.day === day).sort((a, b) => a.start - b.start).map((b) => {
                            const conflict = clashes(b).length > 0;
                            return (
                              <button key={b.id} type="button" onClick={() => openBooking(b.id)} className={cn("w-full text-left rounded px-1.5 py-1 border cursor-pointer", conflict ? "border-danger/40 bg-danger-wash" : b.status === "Pending" ? "border-dashed border-warn/60 bg-warn/5" : "border-gold/20 bg-gold-wash hover:border-gold/50")}>
                                <span className="block text-[0.6rem] text-mist">{`${hr(b.start)}–${hr(b.end)}`}</span>
                                <span className="block text-[0.68rem] leading-tight text-ink">{b.title}</span>
                                {conflict && <span className="block text-[0.6rem] font-medium text-danger">Conflict</span>}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---- Reports ---- */}
      {app.screen === "reports" && (
        <>
          <ScreenHeader title="Reports" subtitle="Through Sunday, October 25" action={<SmallButton onClick={() => app.notify("Report exported as CSV")}><Download size={12} /> Export CSV</SmallButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Average attendance" value={String(Math.round(sum(TREND.total) / TREND.total.length))} sub="Last 12 Sundays" />
            <Stat label="Guests who returned" value={`${Math.round((RETENTION[1][1] / RETENTION[0][1]) * 100)}%`} sub="+9 points since April" tone="good" />
            <Stat label="Members retained" value="92%" sub="Over 12 months" tone="good" />
            <Stat label="Members serving" value="61%" sub="Goal: 70%" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Attendance trend" action={<Segmented id="cos-trend" value={trend} onChange={setTrend} options={[{ id: "total", label: "Total" }, { id: "9 AM", label: "9 AM" }, { id: "11 AM", label: "11 AM" }]} />}>
              <Bars key={trend} data={TREND[trend].map((value, i) => ({ label: TREND_LABELS[i], value }))} />
            </Panel>
            <Panel title="Guest retention, 2026">
              <MeterList rows={RETENTION.map(([label, n]) => ({ label, value: n, display: `${n} · ${Math.round((n / RETENTION[0][1]) * 100)}%` }))} />
            </Panel>
            <Panel title="Giving by fund, 2026">
              <MeterList rows={fundTotals.map((f) => ({ label: f.fund, value: f.total, display: peso(f.total) }))} />
              <p className="mt-3 text-[0.72rem] text-mist">{`Total ${peso(sum(fundTotals.map((f) => f.total)))} year to date`}</p>
            </Panel>
            <Panel title="Giving by method, October ledger">
              <MeterList rows={methodTotals.map((m) => ({ label: m.method, value: m.total, display: `${peso(m.total)} · ${Math.round((m.total / Math.max(1, sum(methodTotals.map((x) => x.total)))) * 100)}%` }))} />
            </Panel>
          </div>
        </>
      )}

      {/* ---- Slide-overs ---- */}
      <ProtoModal open={modal === "person"} title="Add person" onClose={close} footer={<PrimaryButton onClick={addPerson} disabled={!personDraft.name.trim()}>Add to People</PrimaryButton>}>
        <TextField label="Full name" value={personDraft.name} onChange={(name) => setPersonDraft({ ...personDraft, name })} placeholder="Maria Santos" />
        <TextField label="Mobile number" value={personDraft.phone} onChange={(phone) => setPersonDraft({ ...personDraft, phone })} placeholder="0917 000 0000" />
        <TextField label="Email" value={personDraft.email} onChange={(email) => setPersonDraft({ ...personDraft, email })} placeholder="maria@gmail.com" />
        <SelectField label="Status" value={personDraft.status} onChange={(status) => setPersonDraft({ ...personDraft, status })} options={STATUSES} />
        <SelectField label="Household" value={personDraft.householdId} onChange={(householdId) => setPersonDraft({ ...personDraft, householdId })} options={["new", ...households.map((h) => h.id)]} format={(id) => (id === "new" ? "Start a new household" : `${houseOf(id)?.name ?? ""} household`)} />
      </ProtoModal>

      <ProtoModal open={modal === "member"} title={house ? `Add to the ${house.name} household` : "Add family member"} onClose={close} footer={<PrimaryButton onClick={addMember} disabled={!memberDraft.name.trim()}>Add family member</PrimaryButton>}>
        <TextField label="Full name" value={memberDraft.name} onChange={(name) => setMemberDraft({ ...memberDraft, name })} placeholder={`Juan ${house?.name ?? ""}`} />
        <SelectField label="Role" value={memberDraft.role} onChange={(role) => setMemberDraft({ ...memberDraft, role })} options={ROLES} />
        {memberDraft.role === "Child" && <TextField label="Age" numeric value={memberDraft.age} onChange={(age) => setMemberDraft({ ...memberDraft, age })} />}
        {memberDraft.role === "Child" && <TextField label="Allergies (printed on the check-in label)" value={memberDraft.allergy} onChange={(allergy) => setMemberDraft({ ...memberDraft, allergy })} placeholder="None" />}
      </ProtoModal>

      <ProtoModal open={modal === "followup"} title={p ? `Follow-up for ${p.name}` : "Follow-up"} onClose={close} footer={<PrimaryButton onClick={saveFollowUp} disabled={!fuDraft.task.trim()}>Save follow-up</PrimaryButton>}>
        <TextField label="What needs to happen" value={fuDraft.task} onChange={(task) => setFuDraft({ ...fuDraft, task })} />
        <SelectField label="Owner" value={fuDraft.owner} onChange={(owner) => setFuDraft({ ...fuDraft, owner })} options={OWNERS} />
        <SelectField label="Due" value={fuDraft.due} onChange={(due) => setFuDraft({ ...fuDraft, due })} options={DUE_DATES} format={fmt} />
        <p className="text-[0.74rem] text-mist">The owner gets a text and sees it on their dashboard.</p>
      </ProtoModal>

      <ProtoModal open={modal === "edit"} title={p ? `Edit ${p.name}` : "Edit"} onClose={close} footer={<PrimaryButton onClick={saveEdit}>Save changes</PrimaryButton>}>
        {p?.role === "Child" ? (
          <TextField label="Allergies" value={editDraft.allergy} onChange={(allergy) => setEditDraft({ ...editDraft, allergy })} />
        ) : (
          <>
            <SelectField label="Status" value={editDraft.status} onChange={(status) => setEditDraft({ ...editDraft, status })} options={STATUSES} />
            <TextField label="Life group" value={editDraft.lifeGroup} onChange={(lifeGroup) => setEditDraft({ ...editDraft, lifeGroup })} placeholder="None" />
            <TextField label="Baptized" value={editDraft.baptized} onChange={(baptized) => setEditDraft({ ...editDraft, baptized })} />
            <TextField label="Membership class" value={editDraft.membershipClass} onChange={(membershipClass) => setEditDraft({ ...editDraft, membershipClass })} />
            <TextField label="Skills" value={editDraft.skills} onChange={(skills) => setEditDraft({ ...editDraft, skills })} />
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "gift"} title="Record a gift" onClose={close} footer={<PrimaryButton onClick={recordGift} disabled={!Number(giftDraft.amount)}>Record gift</PrimaryButton>}>
        <SelectField label="Giver" value={giftDraft.personId} onChange={(personId) => setGiftDraft({ ...giftDraft, personId })} options={["", ...adultIds]} format={(id) => (id ? giver(id) : "Loose offering (no giver)")} />
        <TextField label="Amount (₱)" numeric value={giftDraft.amount} onChange={(amount) => setGiftDraft({ ...giftDraft, amount })} />
        <SelectField label="Fund" value={giftDraft.fund} onChange={(fund) => setGiftDraft({ ...giftDraft, fund })} options={FUNDS} />
        <SelectField label="Method" value={giftDraft.method} onChange={(method) => setGiftDraft({ ...giftDraft, method })} options={METHODS} />
        <p className="text-[0.74rem] text-mist">Named gifts get an emailed receipt and appear on the giver&apos;s statement.</p>
      </ProtoModal>

      <ProtoModal open={modal === "entry"} title="Add batch entry" onClose={close} footer={<PrimaryButton onClick={addEntry} disabled={!Number(entryDraft.amount)}>Add entry</PrimaryButton>}>
        <SelectField label="Giver" value={entryDraft.personId} onChange={(personId) => setEntryDraft({ ...entryDraft, personId })} options={["", ...adultIds]} format={(id) => (id ? giver(id) : "Loose offering (no envelope)")} />
        <SelectField label="Type" value={entryDraft.method} onChange={(method) => setEntryDraft({ ...entryDraft, method })} options={BATCH_METHODS} />
        {entryDraft.method === "Check" && <TextField label="Bank and check number" value={entryDraft.check} onChange={(check) => setEntryDraft({ ...entryDraft, check })} placeholder="BDO 004190" />}
        <SelectField label="Fund" value={entryDraft.fund} onChange={(fund) => setEntryDraft({ ...entryDraft, fund })} options={FUNDS} />
        <TextField label="Amount (₱)" numeric value={entryDraft.amount} onChange={(amount) => setEntryDraft({ ...entryDraft, amount })} />
      </ProtoModal>

      <ProtoModal open={modal === "pledge"} title={`Pledge to ${CAMPAIGN.name}`} onClose={close} footer={<PrimaryButton onClick={addPledge} disabled={!Number(pledgeDraft.amount) || !pledgeDraft.householdId}>Record pledge</PrimaryButton>}>
        <SelectField label="Household" value={pledgeDraft.householdId} onChange={(householdId) => setPledgeDraft({ ...pledgeDraft, householdId })} options={unpledged.map((h) => h.id)} format={(id) => `${houseOf(id)?.name ?? ""} household`} />
        <TextField label="Three-year pledge (₱)" numeric value={pledgeDraft.amount} onChange={(amount) => setPledgeDraft({ ...pledgeDraft, amount })} />
        <p className="text-[0.74rem] text-mist">{`About ${peso(Math.round((Number(pledgeDraft.amount) || 0) / 36))} a month until ${CAMPAIGN.ends}.`}</p>
      </ProtoModal>

      <ProtoModal
        open={modal === "statement" && !!statementPerson}
        title="Giving statement"
        onClose={close}
        footer={
          statementPerson && (
            <PrimaryButton onClick={() => sendStatement(statementPerson)}>
              {statementPerson.email === "—" ? <Printer size={14} /> : <Mail size={14} />}
              {statementPerson.email === "—" ? "Print statement" : "Email statement"}
            </PrimaryButton>
          )
        }
      >
        {statementPerson && (
          <div className="rounded-lg border border-rule bg-paper p-3.5 text-[0.78rem] text-ink-soft">
            <div className="font-semibold text-ink">Grace Fellowship</div>
            <div className="text-[0.7rem] text-mist">Teachers Village, Quezon City</div>
            <div className="mt-3 text-ink">{statementPerson.name}</div>
            <div className="text-[0.72rem] text-mist">{houseOf(statementPerson.householdId)?.address}</div>
            <div className="mt-3 font-semibold text-ink">Giving statement, Jan 1 – Oct 29, 2026</div>
            <ul className="mt-2 flex flex-col gap-1">
              {FUNDS.map((f) => {
                const amount = sum(givenBy(statementPerson.id).filter((g) => g.fund === f).map((g) => g.amount)) + (f === "General" ? STATEMENT_BASE[statementPerson.id] ?? 0 : 0);
                return amount > 0 && <li key={f} className="flex justify-between"><span>{`${f} fund`}</span><span className="font-mono text-ink">{peso(amount)}</span></li>;
              })}
              <li className="flex justify-between pt-1.5 mt-1 border-t border-rule font-semibold text-ink">
                <span>Total</span>
                <span className="font-mono">{peso(ytd(statementPerson.id))}</span>
              </li>
            </ul>
            <p className="mt-3 text-[0.7rem] text-mist">Thank you for your generosity. No goods or services were given in exchange for these gifts.</p>
          </div>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "event"} title="New event" onClose={close} footer={<PrimaryButton onClick={addEvent} disabled={!eventDraft.name.trim()}>Create event</PrimaryButton>}>
        <TextField label="Event name" value={eventDraft.name} onChange={(name) => setEventDraft({ ...eventDraft, name })} placeholder="Leaders' retreat" />
        <TextField label="Date" value={eventDraft.date} onChange={(date) => setEventDraft({ ...eventDraft, date })} placeholder="Nov 21" />
        <SelectField label="Location" value={eventDraft.location} onChange={(location) => setEventDraft({ ...eventDraft, location })} options={ROOMS} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Capacity" numeric value={eventDraft.capacity} onChange={(capacity) => setEventDraft({ ...eventDraft, capacity })} />
          <TextField label="Price (₱, 0 for free)" numeric value={eventDraft.price} onChange={(price) => setEventDraft({ ...eventDraft, price })} />
        </div>
        <p className="text-[0.74rem] text-mist">Paid events take GCash, Maya and cards. A waitlist opens when the event fills.</p>
      </ProtoModal>

      <ProtoModal open={modal === "register" && !!ev} title={ev ? `Register for ${ev.name}` : "Register"} onClose={close} footer={<PrimaryButton onClick={register}>{evFull ? "Add to waitlist" : "Register"}</PrimaryButton>}>
        <SelectField label="Person" value={regDraft.personId} onChange={(personId) => setRegDraft({ ...regDraft, personId })} options={adultIds} format={giver} />
        {ev && ev.price > 0 && !evFull && <SelectField label={`Payment, ${peso(ev.price)}`} value={regDraft.method} onChange={(method) => setRegDraft({ ...regDraft, method })} options={PAY_OPTIONS} format={(m) => (m === "Unpaid" ? "Pay at the door" : m)} />}
        {evFull && <p className="px-3 py-2 rounded-md bg-warn/10 text-[0.78rem] text-warn">This event is full. They join the waitlist and get a text when a spot opens.</p>}
      </ProtoModal>

      <ProtoModal open={modal === "schedule" && !!scheduling} title={scheduling ? `Schedule ${scheduling.position}, ${service}` : "Schedule"} onClose={close}>
        <p className="text-[0.76rem] text-mist">{`Sunday, November 1 · ${scheduling?.team ?? ""} team. They get a text and an email to accept or decline.`}</p>
        <ul className="flex flex-col divide-y divide-rule-soft">
          {(TEAMS.find((t) => t.team === scheduling?.team)?.roster ?? []).map((name) => {
            const blocked = BLOCKED[name];
            const busy = Object.entries(plan).find(([k, s]) => k.startsWith(`${service}|`) && s.name === name && s.status !== "Declined");
            return (
              <li key={name} className="flex items-center gap-2.5 py-2">
                <Avatar name={name} size={28} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[0.8rem] text-ink">{name}</span>
                  <span className={cn("block text-[0.68rem]", blocked ? "text-danger" : "text-mist")}>{blocked ? `Blocked out, ${blocked}` : busy ? `Already on ${busy[0].split("|")[1]}` : `Served ${(name.length % 3) + 1} times in October`}</span>
                </span>
                <SmallButton disabled={!!blocked || !!busy} onClick={() => requestVolunteer(name)}>Request</SmallButton>
              </li>
            );
          })}
        </ul>
      </ProtoModal>

      <ProtoModal open={modal === "checkout" && !!coTarget} title={coTarget ? `Check out ${coTarget.name}` : "Check out"} onClose={close} footer={<PrimaryButton onClick={confirmCheckout} disabled={codeEntry.trim().length < 4}>Check out</PrimaryButton>}>
        {coTarget && (
          <>
            <KeyValues items={[["Room", `${coTarget.room} · ${coTarget.service}`], ["Checked in", `${coTarget.time} by ${coTarget.guardian}`], ["Allergies", coTarget.allergy]]} />
            <Field label="Code on the parent tag">
              <input
                value={codeEntry}
                onChange={(e) => {
                  setCodeEntry(e.target.value.toUpperCase().slice(0, 4));
                  setCodeError(false);
                }}
                className={cn(inputClass, "font-mono tracking-[0.3em] uppercase")}
                placeholder="K7Q4"
              />
            </Field>
            {codeError && <p className="px-3 py-2 rounded-md bg-danger-wash text-[0.78rem] text-danger">That code does not match. Check the guardian&apos;s ID before releasing the child.</p>}
            <p className="text-[0.72rem] text-mist">{`Demo hint: this tag reads ${coTarget.code}.`}</p>
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "booking"} title="Book a room" onClose={close} footer={<PrimaryButton onClick={saveBooking} disabled={!bookingDraft.title.trim() || bookingDraft.end <= bookingDraft.start}>{draftClashes.length ? "Send for approval" : "Book room"}</PrimaryButton>}>
        <TextField label="What is it for" value={bookingDraft.title} onChange={(title) => setBookingDraft({ ...bookingDraft, title })} placeholder="Life group leaders meeting" />
        <SelectField label="Room" value={bookingDraft.room} onChange={(room) => setBookingDraft({ ...bookingDraft, room })} options={ROOMS} />
        <SelectField label="Day" value={bookingDraft.day} onChange={(day) => setBookingDraft({ ...bookingDraft, day })} options={DAYS.map((_, i) => i)} format={(i) => DAYS[i]} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="From" value={bookingDraft.start} onChange={(start) => setBookingDraft({ ...bookingDraft, start })} options={HOURS} format={hr} />
          <SelectField label="To" value={bookingDraft.end} onChange={(end) => setBookingDraft({ ...bookingDraft, end })} options={HOURS} format={hr} />
        </div>
        {bookingDraft.end <= bookingDraft.start && <p className="text-[0.76rem] text-danger">End time must be after the start.</p>}
        {draftClashes.length > 0 ? (
          <div className="px-3 py-2 rounded-md bg-danger-wash text-[0.78rem] text-danger">
            <div className="font-medium">{`Conflict in ${bookingDraft.room}`}</div>
            {draftClashes.map((c) => <div key={c.id}>{`${c.title}, ${hr(c.start)}–${hr(c.end)}${c.status === "Pending" ? " (pending)" : ""}`}</div>)}
            <div className="mt-1 text-[0.72rem]">Pick another room or time, or send it to the office for approval.</div>
          </div>
        ) : (
          bookingDraft.title.trim() && bookingDraft.end > bookingDraft.start && <p className="px-3 py-2 rounded-md bg-good/10 text-[0.78rem] text-good">{`${bookingDraft.room} is free then.`}</p>
        )}
      </ProtoModal>

      <ProtoModal
        open={modal === "bookingDetail" && !!booking}
        title={booking?.title ?? "Booking"}
        onClose={close}
        footer={
          booking &&
          (booking.status === "Pending" ? (
            <>
              <SmallButton onClick={() => removeBooking(booking, "Declined")}>Decline</SmallButton>
              <PrimaryButton onClick={() => approveBooking(booking)}>Approve</PrimaryButton>
            </>
          ) : (
            <SmallButton onClick={() => removeBooking(booking, "Cancelled")}>Cancel booking</SmallButton>
          ))
        }
      >
        {booking && (
          <>
            <KeyValues items={[["Room", booking.room], ["When", `${DAYS[booking.day]} · ${hr(booking.start)}–${hr(booking.end)}`], ["Booked by", booking.by], ["Status", <Status key="s" tone={booking.status === "Booked" ? "good" : "warn"}>{booking.status === "Booked" ? "Booked" : "Waiting for approval"}</Status>]]} />
            {clashes(booking).length > 0 && (
              <div className="px-3 py-2 rounded-md bg-danger-wash text-[0.78rem] text-danger">
                <div className="font-medium">Overlaps with</div>
                {clashes(booking).map((c) => <div key={c.id}>{`${c.title}, ${hr(c.start)}–${hr(c.end)}`}</div>)}
              </div>
            )}
          </>
        )}
      </ProtoModal>
    </ProtoApp>
  );
}
