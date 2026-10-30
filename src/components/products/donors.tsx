"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  ClipboardList,
  Download,
  FileText,
  HandCoins,
  Landmark,
  Layers,
  LayoutDashboard,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  Sprout,
  Ticket,
  UserPlus,
  Users,
  type LucideIcon,
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
  Toggle,
  inputClass,
  textareaClass,
  useProtoApp,
} from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Formatting ------------------------------------------------------------------

const TODAY = "2026-10-29";
const USER = "Carmela Santos";
const STAFF = ["Carmela Santos", "Jasmine Uy", "Nico Ramirez"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const peso = (n: number) => `₱${n.toLocaleString()}`;
const pesoShort = (n: number) =>
  n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M` : n >= 10_000 ? `₱${Math.round(n / 1000)}k` : peso(n);
const compact = (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString());
const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return y === 2026 ? `${MONTHS[m - 1]} ${d}` : `${MONTHS[m - 1]} ${d}, ${y}`;
};
const daysFrom = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / 86_400_000);
const relDays = (iso: string) => {
  if (!iso) return "No gifts yet";
  const n = daysFrom(iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return n < 0 ? `${-n} days ago` : `In ${n} days`;
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Ids and receipt numbers for records created in the prototype. Only called from event handlers.
let seq = 100;
const nextId = (prefix: string) => `${prefix}${++seq}`;
let receiptSeq = 1212;
const nextReceipt = () => `BP-2026-${++receiptSeq}`;

// ---- Types -----------------------------------------------------------------------

type Segment = "Major" | "Monthly" | "Annual" | "First-time" | "Lapsed";
type Fund = "General" | "Feeding" | "Scholarships" | "Disaster relief";
type Method = "GCash" | "Maya" | "Bank transfer" | "Card" | "Check" | "Cash";
type GiftKind = "One-time" | "Recurring" | "Pledge payment";
type Ack = "Pending" | "Emailed" | "Called";
type Touch = "Call" | "Email" | "Visit" | "Meeting" | "Text";
type CampaignKind = "Appeal" | "Peer-to-peer" | "Event";
type GrantStage = "Researching" | "Drafting" | "Submitted" | "Awarded" | "Declined";
type Audience = Segment | "All active";
type TemplateId = "thanks" | "update" | "winback" | "yearend";
type Modal = "gift" | "batch" | "donor" | "touch" | "campaign" | "fundraiser" | "figures" | "grant";

interface Donor {
  id: string;
  name: string;
  kind: "Individual" | "Church" | "Company";
  email: string;
  phone: string;
  city: string;
  segment: Segment;
  engagement: number; // 1 to 5
  since: number;
  lastGift: string;
  funds: Partial<Record<Fund, number>>; // 2026 giving by fund
  lastYear: number;
  lifetime: number;
  gifts: number;
  household: string[];
  softCredits: { from: string; amount: number; note: string }[];
  owner: string;
}
interface Gift { id: string; donorId: string; amount: number; fund: Fund; method: Method; date: string; kind: GiftKind; campaignId?: string; receipt: string; ack: Ack; thankedOn?: string; batch?: string }
interface Recurring { id: string; donorId: string; amount: number; fund: Fund; method: Method; next: string; status: "Active" | "Paused" | "Failed" }
interface Pledge { id: string; donorId: string; fund: Fund; total: number; paid: number; installment: number; next: string; schedule: string }
interface Interaction { id: string; donorId: string; kind: Touch; text: string; date: string; by: string }
interface Task { id: string; donorId: string; text: string; due: string; done: boolean }
interface Fundraiser { id: string; name: string; team: string; goal: number; raised: number; donors: number }
interface Tier { id: string; name: string; price: number; sold: number; capacity: number; seats: number }
interface Campaign { id: string; name: string; kind: CampaignKind; fund: Fund; goal: number; raised: number; donors: number; starts: string; ends: string; status: "Live" | "Closed" | "Draft"; slug: string; blurb: string; fundraisers: Fundraiser[]; tiers: Tier[]; venue?: string }
interface Program { id: string; name: string; fund: Fund; metric: string; unit: string; costPer: number; costNote: string; cumulative: boolean; monthly: number[]; target: number; raised: number; spent: number; sites: { name: string; value: number; lead: string }[]; outcomes: [string, string][]; updates: { id: string; date: string; title: string; text: string }[] }
interface Grant { id: string; funder: string; title: string; fund: Fund; amount: number; stage: GrantStage; deadline: string; decision?: string; owner: string; contact: string; checklist: { label: string; done: boolean }[]; reports: { label: string; due: string; done: boolean }[] }
interface Email { id: string; subject: string; template: TemplateId; audience: Audience; date: string; recipients: number; opened: number; clicked: number; raised: number; status: "Sent" | "Scheduled"; body: string }
interface SentReport { id: string; to: string; kind: "Donor" | "Segment" | "Board"; date: string }

const SEGMENTS: Segment[] = ["Major", "Monthly", "Annual", "First-time", "Lapsed"];
const FUNDS: Fund[] = ["General", "Feeding", "Scholarships", "Disaster relief"];
const METHODS: Method[] = ["GCash", "Maya", "Bank transfer", "Card", "Check", "Cash"];
const TOUCHES: Touch[] = ["Call", "Email", "Visit", "Meeting", "Text"];
const STAGES: GrantStage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];
const AUDIENCES: Audience[] = ["All active", "Major", "Monthly", "Annual", "First-time", "Lapsed"];
const AUDIENCE_SIZE: Record<Audience, number> = { "All active": 1284, Major: 48, Monthly: 612, Annual: 457, "First-time": 167, Lapsed: 214 };
const SEG_TONE: Record<Segment, "good" | "warn" | "bad" | "muted"> = { Major: "good", Monthly: "good", Annual: "muted", "First-time": "warn", Lapsed: "bad" };
const STAGE_TONE: Record<GrantStage, "good" | "warn" | "bad" | "muted"> = { Researching: "muted", Drafting: "warn", Submitted: "warn", Awarded: "good", Declined: "bad" };
const ENGAGEMENT = ["Cold", "Cool", "Warm", "Engaged", "Champion"];
const FUND_PHRASE: Record<Fund, string> = { General: "where it's needed most", Feeding: "the feeding program", Scholarships: "our scholars", "Disaster relief": "disaster relief" };
const TOUCH_ICON: Record<Touch | "Gift", LucideIcon> = { Call: Phone, Email: Mail, Visit: MapPin, Meeting: Users, Text: MessageSquare, Gift: HandCoins };

// Revenue by month, Jan to Oct, all funds.
const REVENUE_2026 = [1_420_000, 1_310_000, 1_520_000, 1_490_000, 1_380_000, 1_860_000, 1_740_000, 2_050_000, 2_170_000, 1_820_000];
const REVENUE_2025 = [1_240_000, 1_200_000, 1_330_000, 1_290_000, 1_250_000, 1_660_000, 1_420_000, 1_570_000, 1_960_000, 1_530_000];
const sum = (ns: number[]) => ns.reduce((s, n) => s + n, 0);

// What one outcome costs, so gifts translate into results.
const COST = { meal: 38, scholarYear: 28_800, scholarMonth: 2_400, family: 1_100 };

// ---- Sample data -------------------------------------------------------------------

const DONORS: Donor[] = [
  { id: "d1", name: "Ramon Lim", kind: "Individual", email: "ramon.lim@limhardware.ph", phone: "0918 555 0193", city: "San Juan", segment: "Major", engagement: 5, since: 2014, lastGift: "2026-10-27", funds: { Feeding: 250000, Scholarships: 250000 }, lastYear: 420000, lifetime: 2150000, gifts: 31, household: ["Cecilia Lim"], softCredits: [{ from: "Lim Hardware Corp.", amount: 150000, note: "Company match · Busog Pasko 2025" }], owner: "Carmela Santos" },
  { id: "d2", name: "Ana Reyes", kind: "Individual", email: "ana.reyes@gmail.com", phone: "0917 555 0142", city: "Makati", segment: "Major", engagement: 4, since: 2017, lastGift: "2026-10-15", funds: { Scholarships: 100000, Feeding: 20000 }, lastYear: 110000, lifetime: 640000, gifts: 84, household: ["Jose Reyes", "Mika Reyes"], softCredits: [], owner: "Carmela Santos" },
  { id: "d3", name: "Joy Dela Cruz", kind: "Individual", email: "joy.delacruz@gmail.com", phone: "0927 555 0110", city: "Quezon City", segment: "Monthly", engagement: 4, since: 2021, lastGift: "2026-10-15", funds: { Feeding: 10000, Scholarships: 9000, "Disaster relief": 2500 }, lastYear: 18000, lifetime: 79000, gifts: 58, household: [], softCredits: [{ from: "Takbo para sa Iskolar 5K", amount: 12400, note: "Raised as a fundraiser · 15 donors" }], owner: "Jasmine Uy" },
  { id: "d4", name: "Grace Navarro", kind: "Individual", email: "grace.navarro@yahoo.com", phone: "0919 555 0105", city: "Taguig", segment: "Monthly", engagement: 3, since: 2022, lastGift: "2026-10-15", funds: { Scholarships: 20000 }, lastYear: 24000, lifetime: 66000, gifts: 46, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d5", name: "Liza Mendoza", kind: "Individual", email: "liza.mendoza@gmail.com", phone: "0906 555 0128", city: "Pasig", segment: "Lapsed", engagement: 2, since: 2019, lastGift: "2025-10-12", funds: {}, lastYear: 15000, lifetime: 52000, gifts: 9, household: ["Rico Mendoza"], softCredits: [], owner: "Jasmine Uy" },
  { id: "d6", name: "Rina Castillo", kind: "Individual", email: "rina.castillo@gmail.com", phone: "0928 555 0187", city: "Las Piñas", segment: "Lapsed", engagement: 1, since: 2020, lastGift: "2025-09-03", funds: {}, lastYear: 5000, lifetime: 18500, gifts: 6, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d7", name: "Mark Santos", kind: "Individual", email: "marksantos@gmail.com", phone: "0995 555 0177", city: "Parañaque", segment: "First-time", engagement: 2, since: 2026, lastGift: "2026-10-28", funds: { Feeding: 2500 }, lastYear: 0, lifetime: 2500, gifts: 1, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d8", name: "New Life Church Mandaluyong", kind: "Church", email: "missions@newlifemandaluyong.org", phone: "(02) 8555 0161", city: "Mandaluyong", segment: "Major", engagement: 4, since: 2016, lastGift: "2026-10-20", funds: { Feeding: 200000 }, lastYear: 240000, lifetime: 1320000, gifts: 70, household: [], softCredits: [], owner: "Nico Ramirez" },
  { id: "d9", name: "Paolo Garcia", kind: "Individual", email: "paolo@garciatrading.ph", phone: "0917 555 0119", city: "Mandaluyong", segment: "Major", engagement: 3, since: 2018, lastGift: "2026-09-15", funds: { Scholarships: 150000 }, lastYear: 100000, lifetime: 610000, gifts: 14, household: ["Lea Garcia"], softCredits: [{ from: "Garcia Trading Inc.", amount: 50000, note: "Company gift · Balik-eskwela 2026" }], owner: "Carmela Santos" },
  { id: "d10", name: "Teresa Villanueva", kind: "Individual", email: "tess.villanueva@gmail.com", phone: "0918 555 0124", city: "Antipolo", segment: "Monthly", engagement: 3, since: 2023, lastGift: "2026-10-15", funds: { General: 5000 }, lastYear: 6000, lifetime: 17500, gifts: 35, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d11", name: "Benjie Ramos", kind: "Individual", email: "benjie.ramos@gmail.com", phone: "0945 555 0136", city: "Marikina", segment: "First-time", engagement: 1, since: 2026, lastGift: "2026-10-26", funds: { Scholarships: 1000 }, lastYear: 0, lifetime: 1000, gifts: 1, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d12", name: "Dra. Cora Aquino", kind: "Individual", email: "cora.aquino@alabangmed.ph", phone: "0917 555 0188", city: "Muntinlupa", segment: "Major", engagement: 4, since: 2015, lastGift: "2026-07-15", funds: { Scholarships: 90000 }, lastYear: 180000, lifetime: 980000, gifts: 22, household: ["Dr. Luis Aquino"], softCredits: [], owner: "Carmela Santos" },
  { id: "d13", name: "Miguel Torres", kind: "Individual", email: "miguel.torres@gmail.com", phone: "0920 555 0172", city: "Quezon City", segment: "Monthly", engagement: 5, since: 2019, lastGift: "2026-10-15", funds: { Scholarships: 30000, Feeding: 6000 }, lastYear: 36000, lifetime: 230000, gifts: 92, household: ["Bea Torres"], softCredits: [{ from: "Takbo para sa Iskolar 5K", amount: 46200, note: "Raised as a fundraiser · 31 donors" }], owner: "Jasmine Uy" },
  { id: "d14", name: "Kristine Bautista", kind: "Individual", email: "kristine.b@outlook.com", phone: "0939 555 0151", city: "Bacoor, Cavite", segment: "Lapsed", engagement: 2, since: 2022, lastGift: "2025-07-15", funds: {}, lastYear: 3500, lifetime: 15000, gifts: 25, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d15", name: "Sta. Rosa Builders Inc.", kind: "Company", email: "csr@starosabuilders.ph", phone: "(049) 555 0144", city: "Santa Rosa, Laguna", segment: "Major", engagement: 3, since: 2020, lastGift: "2026-08-30", funds: { "Disaster relief": 250000 }, lastYear: 300000, lifetime: 1150000, gifts: 9, household: [], softCredits: [], owner: "Nico Ramirez" },
  { id: "d16", name: "Patricia Gonzales", kind: "Individual", email: "pat.gonzales@gmail.com", phone: "0917 555 0163", city: "Naga City", segment: "First-time", engagement: 2, since: 2026, lastGift: "2026-10-22", funds: { "Disaster relief": 5000 }, lastYear: 0, lifetime: 5000, gifts: 1, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d17", name: "Allan Mercado", kind: "Individual", email: "allan.mercado@gmail.com", phone: "0932 555 0108", city: "Cebu City", segment: "Monthly", engagement: 3, since: 2021, lastGift: "2026-09-15", funds: { Feeding: 13500 }, lastYear: 18000, lifetime: 76500, gifts: 51, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d18", name: "Nestor Dizon", kind: "Individual", email: "nestor.dizon@yahoo.com", phone: "0916 555 0179", city: "Malolos, Bulacan", segment: "Lapsed", engagement: 1, since: 2018, lastGift: "2025-08-21", funds: {}, lastYear: 10000, lifetime: 64000, gifts: 12, household: ["Elena Dizon"], softCredits: [], owner: "Nico Ramirez" },
  { id: "d19", name: "Hannah Cruz", kind: "Individual", email: "hannahcruz@gmail.com", phone: "0998 555 0114", city: "Sampaloc, Manila", segment: "First-time", engagement: 2, since: 2026, lastGift: "2026-10-25", funds: { Scholarships: 1500 }, lastYear: 0, lifetime: 1500, gifts: 1, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d20", name: "Rev. Daniel Ocampo", kind: "Individual", email: "dan.ocampo@gmail.com", phone: "0917 555 0137", city: "Quezon City", segment: "Annual", engagement: 3, since: 2016, lastGift: "2026-04-05", funds: { General: 15000, Feeding: 10000 }, lastYear: 25000, lifetime: 230000, gifts: 11, household: ["Ruth Ocampo"], softCredits: [], owner: "Nico Ramirez" },
  { id: "d21", name: "Marites Fernandez", kind: "Individual", email: "marites.fernandez@gmail.com", phone: "+971 50 555 0192", city: "Dubai, UAE", segment: "Monthly", engagement: 4, since: 2020, lastGift: "2026-10-15", funds: { "Disaster relief": 25000 }, lastYear: 25000, lifetime: 145000, gifts: 70, household: [], softCredits: [], owner: "Jasmine Uy" },
  { id: "d22", name: "Carlos Tan", kind: "Individual", email: "carlos.tan@binondotextiles.ph", phone: "0917 555 0101", city: "Binondo, Manila", segment: "Annual", engagement: 3, since: 2019, lastGift: "2026-10-24", funds: { General: 50000 }, lastYear: 60000, lifetime: 380000, gifts: 8, household: ["Lily Tan"], softCredits: [], owner: "Carmela Santos" },
];

const g = (id: string, donorId: string, amount: number, fund: Fund, method: Method, date: string, kind: GiftKind, receipt: number, ack: Ack, campaignId?: string): Gift => ({ id, donorId, amount, fund, method, date, kind, receipt: `BP-2026-${receipt}`, ack, campaignId });

const GIFTS: Gift[] = [
  g("g2", "d7", 2500, "Feeding", "GCash", "2026-10-28", "One-time", 1211, "Pending", "c1"),
  g("g1", "d1", 250000, "Feeding", "Bank transfer", "2026-10-27", "One-time", 1208, "Pending", "c1"),
  g("g3", "d11", 1000, "Scholarships", "GCash", "2026-10-26", "One-time", 1206, "Pending", "c2"),
  g("g4", "d19", 1500, "Scholarships", "Card", "2026-10-25", "One-time", 1204, "Pending", "c2"),
  g("g6", "d22", 50000, "General", "Bank transfer", "2026-10-24", "One-time", 1201, "Pending"),
  g("g5", "d16", 5000, "Disaster relief", "Maya", "2026-10-22", "One-time", 1198, "Pending", "c4"),
  g("g7", "d8", 20000, "Feeding", "Check", "2026-10-20", "Pledge payment", 1192, "Called"),
  g("g8", "d3", 1000, "Feeding", "GCash", "2026-10-15", "Recurring", 1171, "Emailed"),
  g("g9", "d4", 2000, "Scholarships", "Card", "2026-10-15", "Recurring", 1172, "Emailed"),
  g("g10", "d2", 10000, "Scholarships", "Bank transfer", "2026-10-15", "Recurring", 1173, "Emailed"),
  g("g11", "d13", 3000, "Scholarships", "Bank transfer", "2026-10-15", "Recurring", 1174, "Emailed"),
  g("g12", "d21", 2500, "Disaster relief", "Maya", "2026-10-15", "Recurring", 1175, "Emailed"),
  g("g13", "d10", 500, "General", "GCash", "2026-10-15", "Recurring", 1176, "Emailed"),
  g("g14", "d3", 2500, "Disaster relief", "GCash", "2026-09-27", "One-time", 1131, "Emailed", "c4"),
  g("g17", "d8", 20000, "Feeding", "Check", "2026-09-20", "Pledge payment", 1124, "Emailed"),
  g("g15", "d9", 75000, "Scholarships", "Bank transfer", "2026-09-15", "Pledge payment", 1120, "Called"),
  g("g16", "d17", 1500, "Feeding", "Card", "2026-09-15", "Recurring", 1118, "Emailed"),
  g("g18", "d15", 250000, "Disaster relief", "Bank transfer", "2026-08-30", "Pledge payment", 1088, "Called"),
  g("g19", "d12", 45000, "Scholarships", "Check", "2026-07-15", "Pledge payment", 1012, "Emailed"),
  g("g21", "d20", 25000, "General", "Cash", "2026-04-05", "One-time", 788, "Emailed"),
  g("g20", "d1", 250000, "Scholarships", "Bank transfer", "2026-03-10", "One-time", 702, "Called"),
];

const RECURRING: Recurring[] = [
  { id: "r1", donorId: "d3", amount: 1000, fund: "Feeding", method: "GCash", next: "2026-11-15", status: "Active" },
  { id: "r2", donorId: "d4", amount: 2000, fund: "Scholarships", method: "Card", next: "2026-11-15", status: "Active" },
  { id: "r3", donorId: "d2", amount: 10000, fund: "Scholarships", method: "Bank transfer", next: "2026-11-15", status: "Active" },
  { id: "r4", donorId: "d13", amount: 3000, fund: "Scholarships", method: "Bank transfer", next: "2026-11-15", status: "Active" },
  { id: "r5", donorId: "d21", amount: 2500, fund: "Disaster relief", method: "Maya", next: "2026-11-15", status: "Active" },
  { id: "r6", donorId: "d10", amount: 500, fund: "General", method: "GCash", next: "2026-11-15", status: "Active" },
  { id: "r7", donorId: "d17", amount: 1500, fund: "Feeding", method: "Card", next: "2026-10-15", status: "Failed" },
  { id: "r8", donorId: "d14", amount: 500, fund: "Feeding", method: "GCash", next: "", status: "Paused" },
];

const PLEDGES: Pledge[] = [
  { id: "pl1", donorId: "d1", fund: "Scholarships", total: 1000000, paid: 250000, installment: 250000, next: "2027-03-10", schedule: "Yearly, 2026 to 2029" },
  { id: "pl2", donorId: "d8", fund: "Feeding", total: 240000, paid: 200000, installment: 20000, next: "2026-11-20", schedule: "Monthly, 2026" },
  { id: "pl3", donorId: "d9", fund: "Scholarships", total: 300000, paid: 150000, installment: 75000, next: "2026-12-15", schedule: "Quarterly, 2026" },
  { id: "pl4", donorId: "d12", fund: "Scholarships", total: 180000, paid: 90000, installment: 45000, next: "2026-10-15", schedule: "Quarterly, 2026" },
  { id: "pl5", donorId: "d15", fund: "Disaster relief", total: 500000, paid: 250000, installment: 250000, next: "2026-11-30", schedule: "Two payments" },
];

const INTERACTIONS: Interaction[] = [
  { id: "i2", donorId: "d1", kind: "Call", text: "Confirmed ₱250,000 for Busog Pasko by bank transfer.", date: "2026-10-26", by: "Carmela Santos" },
  { id: "i1", donorId: "d1", kind: "Visit", text: "Toured the Tondo kitchen with Cecilia. Asked how a scholarship endowment would work.", date: "2026-10-08", by: "Carmela Santos" },
  { id: "i3", donorId: "d1", kind: "Email", text: "Sent the 2025 audited financials he asked for.", date: "2026-09-14", by: "Nico Ramirez" },
  { id: "i4", donorId: "d1", kind: "Meeting", text: "Lunch in Greenhills. Wants to name a scholarship after his late father.", date: "2026-07-22", by: "Carmela Santos" },
  { id: "i5", donorId: "d2", kind: "Email", text: "Opened the September impact update and clicked the scholar stories.", date: "2026-10-02", by: "Jasmine Uy" },
  { id: "i6", donorId: "d2", kind: "Call", text: "Thanked her for three years of monthly giving.", date: "2026-08-18", by: "Jasmine Uy" },
  { id: "i7", donorId: "d3", kind: "Text", text: "Sent her fundraiser page link and tips for sharing in group chats.", date: "2026-10-12", by: "Jasmine Uy" },
  { id: "i8", donorId: "d5", kind: "Email", text: "No reply to the June win-back email.", date: "2026-06-10", by: "Jasmine Uy" },
  { id: "i9", donorId: "d8", kind: "Meeting", text: "Missions committee approved ₱240,000 for 2026 feeding.", date: "2026-01-18", by: "Nico Ramirez" },
  { id: "i10", donorId: "d8", kind: "Visit", text: "Pastor Jun brought 12 youth volunteers to the Baseco site.", date: "2026-09-27", by: "Nico Ramirez" },
  { id: "i11", donorId: "d9", kind: "Call", text: "Asked for scholar report cards before the December payment.", date: "2026-10-21", by: "Carmela Santos" },
  { id: "i12", donorId: "d12", kind: "Email", text: "Sent a reminder for the Q3 pledge payment.", date: "2026-10-16", by: "Carmela Santos" },
  { id: "i13", donorId: "d15", kind: "Meeting", text: "CSR head wants a photo report for their annual report.", date: "2026-09-10", by: "Nico Ramirez" },
  { id: "i14", donorId: "d13", kind: "Visit", text: "Hosted Miguel and Bea at the scholars' camp in Tagaytay.", date: "2026-10-04", by: "Jasmine Uy" },
  { id: "i15", donorId: "d17", kind: "Email", text: "Card declined on Oct 15. Sent a link to update his card.", date: "2026-10-16", by: "Jasmine Uy" },
  { id: "i16", donorId: "d21", kind: "Call", text: "Video call from Dubai. Wants relief updates by email, not text.", date: "2026-09-02", by: "Jasmine Uy" },
];

const TASKS: Task[] = [
  { id: "t4", donorId: "d12", text: "Follow up on the Q3 pledge payment of ₱45,000", due: "2026-10-29", done: false },
  { id: "t2", donorId: "d5", text: "Call Liza: no gift since October 2025", due: "2026-10-30", done: false },
  { id: "t7", donorId: "d3", text: "Thank Joy for raising ₱12,400 on her run page", due: "2026-10-30", done: false },
  { id: "t3", donorId: "d9", text: "Send Q1 scholar grades for Paolo's pledge", due: "2026-10-31", done: false },
  { id: "t5", donorId: "d8", text: "Confirm the youth team for the 5K run", due: "2026-11-02", done: false },
  { id: "t1", donorId: "d1", text: "Invite Ramon and Cecilia to the Payatas kitchen opening", due: "2026-11-04", done: false },
  { id: "t6", donorId: "d15", text: "Send the relief photo report to their CSR team", due: "2026-11-05", done: false },
  { id: "t8", donorId: "d18", text: "Mail a birthday card for Nov 8", due: "2026-11-06", done: false },
];

const CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Busog Pasko 2026", kind: "Appeal", fund: "Feeding", goal: 1500000, raised: 912400, donors: 418, starts: "2026-10-01", ends: "2026-12-24", status: "Live", slug: "busog-pasko", blurb: "Christmas meals for 4,000 children in Tondo, Payatas and Baseco. ₱380 covers ten meals.", fundraisers: [], tiers: [] },
  {
    id: "c2", name: "Takbo para sa Iskolar 5K", kind: "Peer-to-peer", fund: "Scholarships", goal: 600000, raised: 418750, donors: 263, starts: "2026-09-01", ends: "2026-11-15", status: "Live", slug: "takbo-5k",
    blurb: "Run or walk 5K at the Quezon Memorial Circle and raise stipends for 20 college scholars.",
    fundraisers: [
      { id: "f1", name: "New Life Youth", team: "New Life Church Mandaluyong", goal: 100000, raised: 74300, donors: 88 },
      { id: "f2", name: "Miguel Torres", team: "Torres family", goal: 50000, raised: 46200, donors: 31 },
      { id: "f3", name: "Kat Sison", team: "Diliman runners", goal: 25000, raised: 28500, donors: 40 },
      { id: "f4", name: "Bea Torres", team: "Torres family", goal: 50000, raised: 21050, donors: 12 },
      { id: "f5", name: "JM Villareal", team: "Solo", goal: 15000, raised: 15800, donors: 19 },
      { id: "f6", name: "Joy Dela Cruz", team: "QC Fellowship", goal: 20000, raised: 12400, donors: 15 },
      { id: "f7", name: "Rafael Domingo", team: "Solo", goal: 10000, raised: 3500, donors: 4 },
    ],
    tiers: [],
  },
  {
    id: "c3", name: "Gabi ng Pasasalamat", kind: "Event", fund: "General", goal: 800000, raised: 535000, donors: 96, starts: "2026-09-15", ends: "2026-11-21", status: "Live", slug: "gabi-2026", venue: "Function hall, Ortigas Center",
    blurb: "A thanksgiving dinner with our scholars and partners. Every seat funds a month of programs.",
    fundraisers: [],
    tiers: [
      { id: "tr1", name: "Table sponsor", price: 50000, sold: 5, capacity: 10, seats: 10 },
      { id: "tr2", name: "Scholar sponsor seat", price: 7500, sold: 24, capacity: 60, seats: 1 },
      { id: "tr3", name: "Individual seat", price: 3500, sold: 30, capacity: 80, seats: 1 },
      { id: "tr4", name: "Student volunteer", price: 0, sold: 14, capacity: 20, seats: 1 },
    ],
  },
  { id: "c4", name: "Bicol typhoon response", kind: "Appeal", fund: "Disaster relief", goal: 2000000, raised: 1684200, donors: 1032, starts: "2026-09-25", ends: "2026-11-30", status: "Live", slug: "bicol-response", blurb: "Relief packs, clean water and hygiene kits for families in Camarines Sur and Albay.", fundraisers: [], tiers: [] },
  { id: "c5", name: "Balik-eskwela 2026", kind: "Appeal", fund: "Scholarships", goal: 800000, raised: 846300, donors: 512, starts: "2026-05-01", ends: "2026-06-30", status: "Closed", slug: "balik-eskwela", blurb: "Bags, books and uniforms for 186 scholars before school opened in June.", fundraisers: [], tiers: [] },
  { id: "c6", name: "Kapwa monthly circle", kind: "Appeal", fund: "General", goal: 300000, raised: 0, donors: 0, starts: "2027-01-05", ends: "2027-02-28", status: "Draft", slug: "kapwa-circle", blurb: "Invite 100 new monthly donors at ₱500 a month to steady the programs all year.", fundraisers: [], tiers: [] },
];

const PROGRAMS: Program[] = [
  {
    id: "pr1", name: "Feeding program", fund: "Feeding", metric: "Meals served", unit: "meal", costPer: COST.meal, costNote: "₱38 serves one hot meal", cumulative: true,
    monthly: [14200, 13800, 15100, 14900, 15400, 16800, 17200, 16900, 17600, 18100], target: 190000, raised: 6120000, spent: 6080000,
    sites: [{ name: "Tondo", value: 62400, lead: "Weng Salazar" }, { name: "Payatas", value: 54100, lead: "Romy Dantes" }, { name: "Baseco", value: 43500, lead: "Lorna Abad" }],
    outcomes: [["Children enrolled", "1,240"], ["Underweight at intake", "31%"], ["Underweight now", "14%"], ["Feeding days a week", "5"]],
    updates: [
      { id: "u1", date: "2026-10-24", title: "Payatas kitchen gets a second stove", text: "Cooks now serve 600 lunches before noon, up from 420." },
      { id: "u2", date: "2026-10-10", title: "Q3 weigh-in results", text: "Underweight children fell from 19% to 14% since June." },
    ],
  },
  {
    id: "pr2", name: "Scholarships", fund: "Scholarships", metric: "Scholars supported", unit: "scholar", costPer: COST.scholarYear, costNote: "₱2,400 a month keeps one scholar in school", cumulative: false,
    monthly: [172, 172, 174, 174, 176, 181, 184, 186, 186, 186], target: 200, raised: 4980000, spent: 4296000,
    sites: [{ name: "High school", value: 104, lead: "Joel Panganiban" }, { name: "College", value: 71, lead: "Ivy Marquez" }, { name: "Vocational", value: 11, lead: "Ivy Marquez" }],
    outcomes: [["Passing every subject", "94%"], ["Graduating in 2027", "38"], ["Dropout rate", "2.1%"], ["With a mentor", "142"]],
    updates: [
      { id: "u3", date: "2026-10-21", title: "First-quarter grades are in", text: "94% of scholars passed every subject. Jerome from Payatas finished with an 89 average." },
      { id: "u4", date: "2026-10-04", title: "Scholars' camp in Tagaytay", text: "162 scholars spent two days on study habits, faith and career talks." },
    ],
  },
  {
    id: "pr3", name: "Disaster relief", fund: "Disaster relief", metric: "Families reached", unit: "family", costPer: COST.family, costNote: "₱1,100 is one family relief pack", cumulative: true,
    monthly: [0, 0, 40, 0, 0, 110, 380, 640, 1420, 770], target: 4000, raised: 3840000, spent: 3696000,
    sites: [{ name: "Camarines Sur", value: 1860, lead: "Arnel Bico" }, { name: "Albay", value: 980, lead: "Arnel Bico" }, { name: "Rizal floods", value: 520, lead: "Lorna Abad" }],
    outcomes: [["Relief packs delivered", "3,360"], ["Hours to reach families", "36"], ["Volunteers deployed", "214"], ["Water filters given", "410"]],
    updates: [{ id: "u5", date: "2026-10-09", title: "1,420 families reached in Camarines Sur", text: "Relief packs reached Bula and Nabua within 36 hours of landfall." }],
  },
];

const cl = (pattern: string) => ["Eligibility check", "Budget", "Narrative", "Board resolution", "Audited financials"].map((label, i) => ({ label, done: pattern[i] === "1" }));

const GRANTS: Grant[] = [
  { id: "gr8", funder: "Alon Community Fund", title: "Water filters for Baseco families", fund: "Feeding", amount: 450000, stage: "Awarded", deadline: "2026-02-28", decision: "2026-04-10", owner: "Nico Ramirez", contact: "Mae Santiago", checklist: cl("11111"), reports: [{ label: "Six-month report", due: "2026-10-31", done: false }] },
  { id: "gr3", funder: "Bayanihan Corporate Giving Council", title: "Typhoon preparedness kits for 1,000 families", fund: "Disaster relief", amount: 850000, stage: "Drafting", deadline: "2026-11-06", owner: "Nico Ramirez", contact: "Grants desk", checklist: cl("11001"), reports: [] },
  { id: "gr1", funder: "Liwanag Family Foundation", title: "Stipends and school supplies, SY 2026–27", fund: "Scholarships", amount: 1200000, stage: "Awarded", deadline: "2026-03-31", decision: "2026-05-20", owner: "Nico Ramirez", contact: "Aurora Liwanag-Cruz", checklist: cl("11111"), reports: [{ label: "Interim report", due: "2026-11-15", done: false }, { label: "Final report", due: "2027-06-30", done: false }] },
  { id: "gr4", funder: "Tanglaw Education Trust", title: "College scholars, 2027 cohort", fund: "Scholarships", amount: 1800000, stage: "Drafting", deadline: "2026-11-20", owner: "Carmela Santos", contact: "Prof. Emma Santiago", checklist: cl("10001"), reports: [] },
  { id: "gr6", funder: "Isla Resilience Fund", title: "Bicol rebuild: 200 family shelters", fund: "Disaster relief", amount: 3000000, stage: "Researching", deadline: "2026-12-01", owner: "Nico Ramirez", contact: "—", checklist: cl("10000"), reports: [] },
  { id: "gr2", funder: "Pacific Hunger Relief Fund", title: "Payatas kitchen expansion", fund: "Feeding", amount: 2500000, stage: "Submitted", deadline: "2026-10-01", decision: "2026-12-10", owner: "Carmela Santos", contact: "Daniel Reyes", checklist: cl("11111"), reports: [] },
  { id: "gr5", funder: "Kalinga Health Initiative", title: "Nutrition monitoring for 1,200 children", fund: "Feeding", amount: 600000, stage: "Researching", deadline: "2027-01-15", owner: "Jasmine Uy", contact: "—", checklist: cl("00000"), reports: [] },
  { id: "gr7", funder: "Sto. Niño Parish Outreach Fund", title: "Christmas feeding in Tondo", fund: "Feeding", amount: 300000, stage: "Awarded", deadline: "2026-09-15", decision: "2026-10-05", owner: "Carmela Santos", contact: "Fr. Ben Lagman", checklist: cl("11111"), reports: [{ label: "Final report with photos", due: "2027-01-31", done: false }] },
  { id: "gr9", funder: "Northgate Foundation", title: "Teacher mentors for scholars", fund: "Scholarships", amount: 750000, stage: "Declined", deadline: "2026-06-30", decision: "2026-08-15", owner: "Nico Ramirez", contact: "Program team", checklist: cl("11111"), reports: [] },
];

const SIGN_OFF = "\n\nCarmela Santos\nBukas Palad Foundation";
const TEMPLATES: Record<TemplateId, { label: string; audience: Audience; subject: string; body: string }> = {
  thanks: { label: "Thank-you", audience: "Monthly", subject: "Salamat, {first_name}", body: `Dear {first_name},\n\nYour gift of {last_gift} to {fund} reached us this week. It is already at work in Tondo, Payatas and Baseco.\n\nThank you for giving with an open hand.${SIGN_OFF}` },
  update: { label: "Impact update", audience: "All active", subject: "What your giving did in October", body: `Hi {first_name},\n\nThis month our kitchens served 18,100 meals, 186 scholars received their stipends, and 770 families in Bicol got relief packs.\n\nYou are part of every one of them.${SIGN_OFF}` },
  winback: { label: "Win-back", audience: "Lapsed", subject: "We miss you, {first_name}", body: `Hi {first_name},\n\nIt has been a while since your gift of {last_gift}, and we wanted you to see what it started. Children in Payatas now eat lunch five days a week.\n\nWould you join us again this Christmas?${SIGN_OFF}` },
  yearend: { label: "Year-end appeal", audience: "All active", subject: "One more Christmas meal", body: `Dear {first_name},\n\nBusog Pasko is 61% of the way to feeding 4,000 children this Christmas. ₱380 covers ten meals.\n\nGive before Dec 24 and the Lim family will match your gift.${SIGN_OFF}` },
};

const EMAILS: Email[] = [
  { id: "e5", subject: "Scholar report: first quarter", template: "update", audience: "Major", date: "2026-10-22", recipients: 48, opened: 0.88, clicked: 0.42, raised: 0, status: "Sent", body: TEMPLATES.update.body },
  { id: "e1", subject: "Salamat, {first_name}", template: "thanks", audience: "Monthly", date: "2026-10-16", recipients: 598, opened: 0.71, clicked: 0.18, raised: 42000, status: "Sent", body: TEMPLATES.thanks.body },
  { id: "e2", subject: "What your giving did in September", template: "update", audience: "All active", date: "2026-10-05", recipients: 1262, opened: 0.52, clicked: 0.11, raised: 86500, status: "Sent", body: TEMPLATES.update.body },
  { id: "e6", subject: "Christmas meals start with you", template: "yearend", audience: "All active", date: "2026-10-01", recipients: 1281, opened: 0.58, clicked: 0.19, raised: 312000, status: "Sent", body: TEMPLATES.yearend.body },
  { id: "e3", subject: "Help us reach Bicol families", template: "yearend", audience: "All active", date: "2026-09-26", recipients: 1270, opened: 0.61, clicked: 0.22, raised: 684000, status: "Sent", body: TEMPLATES.yearend.body },
  { id: "e4", subject: "We miss you, {first_name}", template: "winback", audience: "Lapsed", date: "2026-06-10", recipients: 241, opened: 0.34, clicked: 0.06, raised: 18000, status: "Sent", body: TEMPLATES.winback.body },
];

const SENT_REPORTS: SentReport[] = [
  { id: "s1", to: "Major donors (48)", kind: "Segment", date: "2026-10-22" },
  { id: "s2", to: "New Life Church Mandaluyong", kind: "Donor", date: "2026-10-02" },
  { id: "s3", to: "Board of trustees", kind: "Board", date: "2026-07-30" },
];

const STORIES: Record<Fund, { title: string; text: string; photo: string }> = {
  Feeding: { title: "Lunch before class in Payatas", text: "Mika, 7, used to skip lunch. After six months in the program she is at a healthy weight and reading at grade level.", photo: "Photo · Payatas kitchen" },
  Scholarships: { title: "Jerome's first quarter", text: "Jerome, a Grade 11 scholar from Payatas, finished the first quarter with an 89 average. He wants to study civil engineering.", photo: "Photo · Scholars' camp" },
  "Disaster relief": { title: "Thirty-six hours after landfall", text: "Volunteers reached Bula, Camarines Sur with rice, water and hygiene kits while the roads were still flooded.", photo: "Photo · Relief run, Bicol" },
  General: { title: "Where it's needed most", text: "Your gifts kept trucks fueled, cooks paid and books audited, so every program ran on time.", photo: "Photo · Bukas Palad team" },
};

const BLANK_GIFT = { donorId: "d1", amount: "5000", fund: "Feeding" as Fund, method: "GCash" as Method, kind: "One-time" as GiftKind, campaignId: "", softCredit: "", sendNow: true };
const BLANK_BATCH = { name: "GCash export · Oct 29", method: "GCash" as Method, fund: "Feeding" as Fund, receipts: true, rows: [{ donorId: "d10", amount: "500" }, { donorId: "d19", amount: "1000" }, { donorId: "d4", amount: "2000" }, { donorId: "d7", amount: "1500" }] };
const BLANK_DONOR = { name: "", email: "", phone: "", city: "", kind: "Individual" as Donor["kind"], amount: "", fund: "Feeding" as Fund };
const BLANK_TOUCH = { kind: "Call" as Touch, note: "Called to say thank you and shared the latest program update.", followUp: "" };
const BLANK_CAMPAIGN = { name: "", kind: "Appeal" as CampaignKind, fund: "Feeding" as Fund, goal: "500000", ends: "2026-12-31", blurb: "" };
const BLANK_FUNDRAISER = { name: "Carla Mendoza", email: "carla.mendoza@gmail.com", team: "QC Fellowship", goal: "20000" };
const BLANK_GRANT = { funder: "", title: "", fund: "Feeding" as Fund, amount: "", deadline: "2026-12-15" };

// ---- Derived helpers ---------------------------------------------------------------

const ytd = (d: Donor) => Object.values(d.funds).reduce<number>((s, n) => s + (n ?? 0), 0);
const programTotal = (p: Program) => (p.cumulative ? sum(p.monthly) : p.monthly[p.monthly.length - 1]);
const greet = (d: Donor) => (d.kind === "Individual" ? d.name.replace(/^(Dra?\.|Rev\.)\s+/, "").split(" ")[0] : `friends at ${d.name}`);

function mergeFields(text: string, d: Donor, gifts: Gift[]) {
  const last = gifts.find((x) => x.donorId === d.id);
  return text
    .replace(/\{first_name\}/g, greet(d))
    .replace(/\{last_gift\}/g, last ? peso(last.amount) : "your last gift")
    .replace(/\{fund\}/g, FUND_PHRASE[last?.fund ?? "General"]);
}

// Turn a donor's giving by fund into outcomes they can picture.
function outcomesFor(funds: Partial<Record<Fund, number>>) {
  const out: { value: string; label: string }[] = [];
  const feeding = funds.Feeding ?? 0;
  const scholars = funds.Scholarships ?? 0;
  const relief = funds["Disaster relief"] ?? 0;
  if (feeding >= COST.meal) out.push({ value: Math.floor(feeding / COST.meal).toLocaleString(), label: "meals served" });
  if (scholars > 0) {
    const years = Math.floor(scholars / COST.scholarYear);
    out.push(years >= 1 ? { value: String(years), label: years === 1 ? "scholar for a full year" : "scholars for a full year" } : { value: String(Math.max(1, Math.round(scholars / COST.scholarMonth))), label: "months of a scholar's stipend" });
  }
  if (relief >= COST.family) out.push({ value: Math.floor(relief / COST.family).toLocaleString(), label: "families given relief packs" });
  if (funds.General) out.push({ value: pesoShort(funds.General), label: "to where it's needed most" });
  return out;
}

function givingByYear(d: Donor) {
  const start = Math.max(d.since, 2022);
  const earlierYears = Math.max(1, 2025 - d.since);
  const rest = Math.max(0, d.lifetime - ytd(d) - d.lastYear);
  return Array.from({ length: 2026 - start + 1 }, (_, i) => start + i).map((y) => ({ label: String(y), value: y === 2026 ? ytd(d) : y === 2025 ? d.lastYear : Math.round(rest / earlierYears) }));
}

// ---- Local building blocks ---------------------------------------------------------------

function Engagement({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`Engagement: ${ENGAGEMENT[level - 1]}`}>
      <span className="flex gap-[3px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={cn("w-1.5 h-3 rounded-[2px]", n <= level ? (level <= 2 ? "bg-warn" : "bg-gold") : "bg-rule")} />
        ))}
      </span>
      <span className="text-[0.72rem] text-ink-soft">{ENGAGEMENT[level - 1]}</span>
    </span>
  );
}

function CompareBars({ data, format }: { data: { label: string; now: number; prev: number }[]; format: (n: number) => string }) {
  const max = Math.max(...data.flatMap((d) => [d.now, d.prev]));
  return (
    <div>
      <div className="flex items-center gap-3 mb-2 text-[0.68rem] text-mist">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold" aria-hidden />2026</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold/25" aria-hidden />2025</span>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex items-end justify-center gap-0.5 h-full" title={`${d.label}: ${format(d.now)} (2025: ${format(d.prev)})`}>
            {[d.prev, d.now].map((v, j) => (
              <motion.div
                key={j}
                className={cn("flex-1 max-w-3 rounded-t-[3px]", j ? "bg-gold" : "bg-gold/25")}
                initial={{ height: 0 }}
                animate={{ height: `${(v / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5 border-t border-rule pt-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-[0.62rem] text-mist">{d.label}</span>
        ))}
      </div>
    </div>
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

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.76rem] font-medium text-ink-soft">{label}</span>
      {children}
    </div>
  );
}

function Tick({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn("w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 cursor-pointer transition-colors", on ? "bg-gold border-gold text-sheet" : "border-rule bg-sheet hover:border-gold")}
    >
      {on && <Check size={10} strokeWidth={3.5} />}
    </button>
  );
}

const selectSm = "h-9 px-2.5 rounded-lg border border-rule bg-sheet text-[0.78rem] text-ink cursor-pointer outline-none focus:border-gold";
const listClass = "flex flex-col divide-y divide-rule-soft -my-1";
const subhead = "text-[0.7rem] font-medium text-mist mb-1.5";

// ---- The app ------------------------------------------------------------------------------

export function DonorsPrototype() {
  const app = useProtoApp("dashboard");
  const [donors, setDonors] = useState(DONORS);
  const [gifts, setGifts] = useState(GIFTS);
  const [recurring, setRecurring] = useState(RECURRING);
  const [pledges, setPledges] = useState(PLEDGES);
  const [touches, setTouches] = useState(INTERACTIONS);
  const [tasks, setTasks] = useState(TASKS);
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [programs, setPrograms] = useState(PROGRAMS);
  const [grants, setGrants] = useState(GRANTS);
  const [emails, setEmails] = useState(EMAILS);
  const [sentReports, setSentReports] = useState(SENT_REPORTS);
  const [session, setSession] = useState({ amount: 0, count: 0 });
  const [nudged, setNudged] = useState<string[]>([]);
  const [resent, setResent] = useState<string[]>([]);

  const [donorQuery, setDonorQuery] = useState("");
  const [segFilter, setSegFilter] = useState<"all" | Segment>("all");
  const [profileTab, setProfileTab] = useState<"overview" | "giving" | "timeline">("overview");
  const [timelineKind, setTimelineKind] = useState<"all" | "Call" | "Email" | "Visit" | "Gift">("all");
  const [giftTab, setGiftTab] = useState<"gifts" | "recurring" | "pledges">("gifts");
  const [giftQuery, setGiftQuery] = useState("");
  const [ackFilter, setAckFilter] = useState<"all" | "pending" | "thanked">("all");
  const [fundFilter, setFundFilter] = useState<"all" | Fund>("all");
  const [campaignKind, setCampaignKind] = useState<"all" | CampaignKind>("all");
  const [grantStage, setGrantStage] = useState<"all" | GrantStage>("all");
  const [reportMode, setReportMode] = useState<"donor" | "board">("donor");
  const [reportScope, setReportScope] = useState<"donor" | "segment">("donor");
  const [reportDonor, setReportDonor] = useState("d1");
  const [reportSeg, setReportSeg] = useState<Segment>("Major");
  const [withStory, setWithStory] = useState(true);
  const [withLetter, setWithLetter] = useState(true);
  const [withGrants, setWithGrants] = useState(true);
  const [withNames, setWithNames] = useState(true);
  const [comm, setComm] = useState({ template: "thanks" as TemplateId, audience: TEMPLATES.thanks.audience, subject: TEMPLATES.thanks.subject, body: TEMPLATES.thanks.body });

  const [modal, setModal] = useState<Modal | null>(null);
  const [giftDraft, setGiftDraft] = useState(BLANK_GIFT);
  const [batch, setBatch] = useState(BLANK_BATCH);
  const [donorDraft, setDonorDraft] = useState(BLANK_DONOR);
  const [touchDraft, setTouchDraft] = useState(BLANK_TOUCH);
  const [campaignDraft, setCampaignDraft] = useState(BLANK_CAMPAIGN);
  const [fundraiserDraft, setFundraiserDraft] = useState(BLANK_FUNDRAISER);
  const [figures, setFigures] = useState({ programId: "pr1", month: 9, site: 0, value: "" });
  const [grantDraft, setGrantDraft] = useState(BLANK_GRANT);
  const [taskText, setTaskText] = useState("");
  const [memberName, setMemberName] = useState("");
  const [updateDraft, setUpdateDraft] = useState({ title: "", text: "" });

  // ---- Lookups and derived numbers ----
  const donor = (id?: string) => donors.find((d) => d.id === id);
  const nameOf = (id: string) => donor(id)?.name ?? "Unknown donor";
  const campaignName = (id?: string) => campaigns.find((c) => c.id === id)?.name;
  const pending = gifts.filter((x) => x.ack === "Pending");
  const raisedYtd = sum(REVENUE_2026) + session.amount;
  const lastYtd = sum(REVENUE_2025);
  const growth = Math.round((raisedYtd / lastYtd - 1) * 100);
  const octTotal = REVENUE_2026[9] + session.amount;
  const octCount = 412 + session.count;
  const lapsed = donors.filter((d) => d.segment === "Lapsed");
  const openTasks = [...tasks].filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  const mrr = sum(recurring.filter((r) => r.status === "Active").map((r) => r.amount));

  const openDonor = (d: Donor) => {
    setProfileTab("overview");
    app.open("donor", d.id, d.name);
  };
  const openDonorId = (id: string) => {
    const d = donor(id);
    if (d) openDonor(d);
  };
  const openGift = (prefill: Partial<typeof BLANK_GIFT>) => {
    setGiftDraft({ ...BLANK_GIFT, ...prefill });
    setModal("gift");
  };
  const logTouch = (donorId: string, kind: Touch, text: string) => setTouches((l) => [{ id: nextId("i"), donorId, kind, text, date: TODAY, by: USER }, ...l]);

  // Every new gift updates the donor, campaign, pledge and year-to-date totals.
  const applyGifts = (list: Gift[]) => {
    const total = sum(list.map((x) => x.amount));
    setGifts((l) => [...list, ...l]);
    setDonors((ds) =>
      ds.map((d) => {
        const mine = list.filter((x) => x.donorId === d.id);
        if (!mine.length) return d;
        const funds = { ...d.funds };
        for (const x of mine) funds[x.fund] = (funds[x.fund] ?? 0) + x.amount;
        const segment: Segment = d.segment === "Lapsed" || (d.segment === "First-time" && d.gifts >= 1) ? "Annual" : d.segment;
        return { ...d, funds, segment, lifetime: d.lifetime + sum(mine.map((x) => x.amount)), gifts: d.gifts + mine.length, lastGift: TODAY };
      }),
    );
    setCampaigns((cs) => cs.map((c) => {
      const mine = list.filter((x) => x.campaignId === c.id);
      return mine.length ? { ...c, raised: c.raised + sum(mine.map((x) => x.amount)), donors: c.donors + mine.length } : c;
    }));
    setPledges((ps) => ps.map((p) => {
      const pay = sum(list.filter((x) => x.kind === "Pledge payment" && x.donorId === p.donorId && x.fund === p.fund).map((x) => x.amount));
      return pay ? { ...p, paid: Math.min(p.total, p.paid + pay) } : p;
    }));
    setSession((s) => ({ amount: s.amount + total, count: s.count + list.length }));
  };

  const thank = (ids: string[], how: "Emailed" | "Called") => {
    const list = gifts.filter((x) => ids.includes(x.id) && x.ack === "Pending");
    if (!list.length) return;
    setGifts((l) => l.map((x) => (ids.includes(x.id) && x.ack === "Pending" ? { ...x, ack: how, thankedOn: TODAY } : x)));
    const logs = list.map((x): Interaction => ({
      id: nextId("i"),
      donorId: x.donorId,
      kind: how === "Called" ? "Call" : "Email",
      text: how === "Called" ? `Thank-you call for the ${peso(x.amount)} gift to ${x.fund}.` : `Thank-you email sent with receipt ${x.receipt}.`,
      date: TODAY,
      by: USER,
    }));
    setTouches((l) => [...logs, ...l]);
    if (list.length > 1) app.notify(`Thank-you emails sent to ${list.length} donors. Receipts attached.`);
    else app.notify(how === "Called" ? `Thank-you call logged for ${nameOf(list[0].donorId)}` : `Thank-you sent to ${nameOf(list[0].donorId)}`);
  };

  const recordGift = () => {
    const amount = Number(giftDraft.amount);
    const d = donor(giftDraft.donorId);
    if (!amount || !d) return;
    const gift: Gift = { id: nextId("g"), donorId: d.id, amount, fund: giftDraft.fund, method: giftDraft.method, date: TODAY, kind: giftDraft.kind, campaignId: giftDraft.campaignId || undefined, receipt: nextReceipt(), ack: giftDraft.sendNow ? "Emailed" : "Pending", thankedOn: giftDraft.sendNow ? TODAY : undefined };
    applyGifts([gift]);
    const credit = donor(giftDraft.softCredit);
    if (credit) setDonors((ds) => ds.map((x) => (x.id === credit.id ? { ...x, softCredits: [{ from: d.name, amount, note: `Soft credit · ${gift.fund} · ${fmtDate(TODAY)}` }, ...x.softCredits] } : x)));
    if (gift.kind === "Recurring" && !recurring.some((r) => r.donorId === d.id && r.fund === gift.fund)) {
      setRecurring((l) => [{ id: nextId("r"), donorId: d.id, amount, fund: gift.fund, method: gift.method, next: "2026-11-29", status: "Active" }, ...l]);
    }
    if (giftDraft.sendNow) logTouch(d.id, "Email", `Thank-you email sent with receipt ${gift.receipt}.`);
    setModal(null);
    app.notify(`${peso(amount)} from ${d.name} recorded${giftDraft.sendNow ? ". Receipt and thank-you sent." : ""}`);
  };

  const postBatch = () => {
    const rows = batch.rows.filter((r) => Number(r.amount) > 0 && donor(r.donorId));
    if (!rows.length) return;
    const list = rows.map((r): Gift => ({ id: nextId("g"), donorId: r.donorId, amount: Number(r.amount), fund: batch.fund, method: batch.method, date: TODAY, kind: "One-time", receipt: nextReceipt(), ack: batch.receipts ? "Emailed" : "Pending", thankedOn: batch.receipts ? TODAY : undefined, batch: batch.name }));
    applyGifts(list);
    setModal(null);
    setBatch(BLANK_BATCH);
    app.notify(`Batch posted: ${list.length} gifts, ${peso(sum(list.map((x) => x.amount)))}`);
  };

  const addDonor = () => {
    const name = donorDraft.name.trim();
    if (!name) return;
    const d: Donor = { id: nextId("d"), name, kind: donorDraft.kind, email: donorDraft.email.trim() || "—", phone: donorDraft.phone.trim() || "—", city: donorDraft.city.trim() || "Manila", segment: "First-time", engagement: 1, since: 2026, lastGift: "", funds: {}, lastYear: 0, lifetime: 0, gifts: 0, household: [], softCredits: [], owner: USER };
    setDonors((l) => [d, ...l]);
    const amount = Number(donorDraft.amount);
    if (amount) applyGifts([{ id: nextId("g"), donorId: d.id, amount, fund: donorDraft.fund, method: "GCash", date: TODAY, kind: "One-time", receipt: nextReceipt(), ack: "Pending" }]);
    setModal(null);
    setDonorDraft(BLANK_DONOR);
    openDonor(d);
    app.notify(`${name} added to donors`);
  };

  const loadTemplate = (id: TemplateId, audience?: Audience) => {
    const t = TEMPLATES[id];
    setComm({ template: id, audience: audience ?? t.audience, subject: t.subject, body: t.body });
  };

  const sendEmail = (schedule: boolean) => {
    const n = AUDIENCE_SIZE[comm.audience];
    setEmails((l) => [{ id: nextId("e"), subject: comm.subject, template: comm.template, audience: comm.audience, date: schedule ? "2026-10-30" : TODAY, recipients: n, opened: 0, clicked: 0, raised: 0, status: schedule ? "Scheduled" : "Sent", body: comm.body }, ...l]);
    app.notify(schedule ? `Scheduled for Fri, Oct 30 at 9:00 AM to ${n.toLocaleString()} donors` : `Sent to ${n.toLocaleString()} ${comm.audience === "All active" ? "active" : comm.audience.toLowerCase()} donors`);
  };

  const moveGrant = (target: Grant, stage: GrantStage) => {
    setGrants((l) => l.map((x) => (x.id === target.id ? { ...x, stage, reports: stage === "Awarded" && !x.reports.length ? [{ label: "Interim report", due: "2027-04-30", done: false }, { label: "Final report", due: "2027-10-31", done: false }] : x.reports } : x)));
    app.notify(`${target.funder} moved to ${stage}`);
  };

  const linkMember = (d: Donor) => {
    const n = memberName.trim();
    if (!n) return;
    setDonors((l) => l.map((x) => (x.id === d.id ? { ...x, household: [...x.household, n] } : x)));
    setMemberName("");
    app.notify(`${n} linked to the ${d.name.split(" ").slice(-1)[0]} household`);
  };

  const openReportFor = (d: Donor) => {
    setReportMode("donor");
    setReportScope("donor");
    setReportDonor(d.id);
    app.section("reports");
  };

  // ---- Current records ----
  const dn = app.screen === "donor" ? donor(app.id) : undefined;
  const gf = app.screen === "gift" ? gifts.find((x) => x.id === app.id) : undefined;
  const gfDonor = gf ? donor(gf.donorId) : undefined;
  const cp = app.screen === "campaign" ? campaigns.find((c) => c.id === app.id) : undefined;
  const pg = app.screen === "program" ? programs.find((p) => p.id === app.id) : undefined;
  const gr = app.screen === "grant" ? grants.find((x) => x.id === app.id) : undefined;
  const em = app.screen === "email" ? emails.find((x) => x.id === app.id) : undefined;
  const figProgram = programs.find((p) => p.id === figures.programId) ?? programs[0];

  const visibleDonors = donors.filter((d) => {
    const q = donorQuery.toLowerCase();
    return `${d.name} ${d.city} ${d.email} ${d.household.join(" ")}`.toLowerCase().includes(q) && (segFilter === "all" || d.segment === segFilter);
  });
  const visibleGifts = [...gifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((x) => {
      const q = giftQuery.toLowerCase();
      const matches = `${nameOf(x.donorId)} ${x.receipt} ${x.batch ?? ""}`.toLowerCase().includes(q);
      const ack = ackFilter === "all" || (ackFilter === "pending" ? x.ack === "Pending" : x.ack !== "Pending");
      return matches && ack && (fundFilter === "all" || x.fund === fundFilter);
    });
  const visiblePending = visibleGifts.filter((x) => x.ack === "Pending");
  const thankList = gifts.filter((x) => x.ack === "Pending" || x.thankedOn === TODAY).sort((a, b) => b.amount - a.amount).slice(0, 6);

  const upcoming = [
    ...grants.filter((x) => (x.stage === "Researching" || x.stage === "Drafting") && x.deadline >= TODAY).map((x) => ({ key: `${x.id}-app`, date: x.deadline, text: `${x.funder} application`, go: () => app.open("grant", x.id, x.funder) })),
    ...grants.flatMap((x) => x.reports.filter((r) => !r.done).map((r) => ({ key: `${x.id}-${r.label}`, date: r.due, text: `${r.label}, ${x.funder}`, go: () => app.open("grant", x.id, x.funder) }))),
    ...pledges.filter((p) => p.paid < p.total).map((p) => ({ key: p.id, date: p.next, text: `Pledge payment, ${nameOf(p.donorId)}`, go: () => openDonorId(p.donorId) })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  // Impact report: one donor, or a sample donor from the chosen segment.
  const segmentSample = donors.find((d) => d.segment === reportSeg && ytd(d) > 0) ?? donors[0];
  const rd = reportScope === "donor" ? donor(reportDonor) ?? donors[0] : segmentSample;
  const rdOutcomes = outcomesFor(rd.funds);
  const rdFunds = FUNDS.filter((f) => (rd.funds[f] ?? 0) > 0);
  const rdTop = [...rdFunds].sort((a, b) => (rd.funds[b] ?? 0) - (rd.funds[a] ?? 0))[0] ?? "General";

  const commSample = donors.find((d) => (comm.audience === "All active" ? d.segment !== "Lapsed" : d.segment === comm.audience)) ?? donors[0];

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "donors", label: "Donors", icon: Users },
    { id: "gifts", label: "Gifts", icon: HandCoins, badge: pending.length || undefined },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "programs", label: "Programs", icon: Sprout },
    { id: "reports", label: "Impact reports", icon: FileText },
    { id: "grants", label: "Grants", icon: Landmark },
    { id: "comms", label: "Communication", icon: Mail },
  ];

  return (
    <ProtoApp app={app} name="Donors & Impact · Bukas Palad Foundation" user="Carmela Santos" nav={nav} alerts={pending.length}>
      {/* ---------------- Dashboard ---------------- */}
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Dashboard" subtitle="Thursday, October 29, 2026" action={<PrimaryButton onClick={() => openGift({})}><Plus size={14} /> Record gift</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Donor retention" value="61%" sub="+7 pts vs 2025" tone="good" />
            <Stat label="Active donors" value="1,284" sub="Gave in the last 12 months" />
            <Stat label="Raised this year" value={pesoShort(raisedYtd)} sub={`+${growth}% vs same period 2025`} tone="good" />
            <Stat label="Thank-yous pending" value={String(pending.length)} sub={pending.length ? "Thank within 48 hours" : "All caught up"} tone={pending.length ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3 mb-3">
            <Panel title="Raised by month, 2026 vs 2025" action={<span className="text-[0.7rem] text-mist">{`${pesoShort(raisedYtd)} vs ${pesoShort(lastYtd)}`}</span>}>
              <CompareBars format={pesoShort} data={REVENUE_2026.map((v, i) => ({ label: MONTHS[i], now: i === 9 ? v + session.amount : v, prev: REVENUE_2025[i] }))} />
            </Panel>
            <Panel title="Donors to thank today" action={<span className="text-[0.7rem] text-mist">{`${pending.length} waiting`}</span>}>
              <ul className={listClass}>
                {thankList.map((x) => {
                  const d = donor(x.donorId);
                  if (!d) return null;
                  return (
                    <li key={x.id} className="flex items-center gap-2.5 py-2">
                      <Avatar name={d.name} size={28} />
                      <button type="button" onClick={() => openDonor(d)} className="flex-1 min-w-0 text-left cursor-pointer">
                        <span className="block text-[0.8rem] text-ink truncate hover:text-gold">{d.name}</span>
                        <span className="block text-[0.68rem] text-mist truncate">{`${peso(x.amount)} · ${x.fund} · ${fmtDate(x.date)}`}</span>
                      </button>
                      {x.ack === "Pending" ? (
                        <span className="flex gap-1.5 shrink-0">
                          <SmallButton onClick={() => thank([x.id], "Called")}><Phone size={12} /> Call</SmallButton>
                          <SmallButton onClick={() => thank([x.id], "Emailed")} label={`Email ${d.name}`}><Mail size={12} /></SmallButton>
                        </span>
                      ) : (
                        <Status tone="good">{x.ack === "Called" ? "Called" : "Emailed"}</Status>
                      )}
                    </li>
                  );
                })}
                {thankList.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Every gift has been thanked.</li>}
              </ul>
            </Panel>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Panel title="Lapsed-donor alert">
              <p className="text-[0.8rem] text-ink leading-snug">
                <span className="font-semibold text-danger">37 donors</span> gave last October and nothing since. Together they gave ₱412,500 last year.
              </p>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {lapsed.slice(0, 3).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 text-[0.74rem]">
                    <button type="button" onClick={() => openDonor(d)} className="text-ink-soft hover:text-ink truncate cursor-pointer">{d.name}</button>
                    <span className="text-mist shrink-0">{`Last gift ${fmtDate(d.lastGift)}`}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <SmallButton onClick={() => { setSegFilter("Lapsed"); app.section("donors"); }}>Review lapsed</SmallButton>
                <SmallButton onClick={() => { loadTemplate("winback"); app.section("comms"); }}><Send size={12} /> Send win-back</SmallButton>
              </div>
            </Panel>
            <Panel title="Coming up">
              <ul className={listClass}>
                {upcoming.map((u) => {
                  const days = daysFrom(u.date);
                  return (
                    <li key={u.key}>
                      <button type="button" onClick={u.go} className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer group">
                        <span className="w-10 shrink-0 text-[0.68rem] font-medium text-graphite">{fmtDate(u.date)}</span>
                        <span className="flex-1 min-w-0 text-[0.76rem] text-ink-soft group-hover:text-ink truncate">{u.text}</span>
                        <span className={cn("text-[0.66rem] shrink-0", days < 0 ? "text-danger" : days <= 7 ? "text-warn" : "text-mist")}>{days < 0 ? "Overdue" : relDays(u.date)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel title="My tasks" action={<span className="text-[0.7rem] text-mist">{`${openTasks.length} open`}</span>}>
              <ul className={listClass}>
                {openTasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5 py-2">
                    <span className="pt-0.5"><Tick on={t.done} label={`Complete: ${t.text}`} onToggle={() => { setTasks((l) => l.map((x) => (x.id === t.id ? { ...x, done: true } : x))); app.notify("Task completed"); }} /></span>
                    <button type="button" onClick={() => openDonorId(t.donorId)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.76rem] text-ink leading-snug">{t.text}</span>
                      <span className={cn("block text-[0.66rem]", t.due <= TODAY ? "text-danger" : "text-mist")}>{`${nameOf(t.donorId)} · due ${fmtDate(t.due)}`}</span>
                    </button>
                  </li>
                ))}
                {openTasks.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No open tasks.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Donors ---------------- */}
      {app.screen === "donors" && (
        <>
          <ScreenHeader
            title="Donors"
            subtitle={`${donors.length} donors · ${donors.filter((d) => d.segment === "Major").length} major · ${donors.filter((d) => d.segment === "Monthly").length} monthly · ${lapsed.length} lapsed`}
            action={<PrimaryButton onClick={() => setModal("donor")}><UserPlus size={14} /> Add donor</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={donorQuery} onChange={setDonorQuery} placeholder="Search name, city, email" />
            <Segmented
              id="dn-seg"
              value={segFilter}
              onChange={setSegFilter}
              options={[{ id: "all", label: "All" }, { id: "Major", label: "Major" }, { id: "Monthly", label: "Monthly" }, { id: "Lapsed", label: "Lapsed" }, { id: "First-time", label: "First-time" }]}
            />
          </div>
          <Table
            rows={visibleDonors}
            rowKey={(r) => r.id}
            onRowClick={openDonor}
            empty="No donors match. Try another name or segment."
            columns={[
              {
                key: "name",
                label: "Donor",
                render: (r) => (
                  <span className="flex items-center gap-2 min-w-0">
                    <Avatar name={r.name} size={26} />
                    <span className="min-w-0">
                      <span className="block text-ink truncate">{r.name}</span>
                      <span className="block text-[0.68rem] text-mist truncate">{r.household.length ? `${r.name.split(" ").slice(-1)[0]} household · ${r.city}` : `${r.kind} · ${r.city}`}</span>
                    </span>
                  </span>
                ),
              },
              { key: "seg", label: "Segment", render: (r) => <Status tone={SEG_TONE[r.segment]}>{r.segment}</Status> },
              { key: "eng", label: "Engagement", render: (r) => <Engagement level={r.engagement} />, hideOnMobile: true },
              { key: "last", label: "Last gift", render: (r) => fmtDate(r.lastGift), hideOnMobile: true },
              { key: "ytd", label: "2026", align: "right", render: (r) => <span className="font-mono text-ink">{ytd(r) ? peso(ytd(r)) : "—"}</span> },
              { key: "life", label: "Lifetime", align: "right", render: (r) => <span className="font-mono text-ink-soft">{peso(r.lifetime)}</span>, hideOnMobile: true },
            ]}
          />
        </>
      )}

      {/* ---------------- Donor profile ---------------- */}
      {app.screen === "donor" && dn && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Avatar name={dn.name} size={48} />
            <div className="flex-1 min-w-[12rem]">
              <h4 className="text-[1.3rem] leading-tight font-semibold text-ink tracking-[-0.01em]">{dn.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Status tone={SEG_TONE[dn.segment]}>{dn.segment}</Status>
                <span className="text-[0.74rem] text-mist">{`${dn.kind} · ${dn.city} · since ${dn.since}`}</span>
                <Engagement level={dn.engagement} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <SmallButton onClick={() => setModal("touch")}><ClipboardList size={12} /> Log interaction</SmallButton>
              <SmallButton onClick={() => openReportFor(dn)} disabled={ytd(dn) === 0}><FileText size={12} /> Impact report</SmallButton>
              <PrimaryButton onClick={() => openGift({ donorId: dn.id })}><Plus size={14} /> Record gift</PrimaryButton>
            </div>
          </div>
          <div className="mb-3">
            <Segmented id="dn-tab" value={profileTab} onChange={setProfileTab} options={[{ id: "overview", label: "Overview" }, { id: "giving", label: "Giving" }, { id: "timeline", label: "Timeline" }]} />
          </div>

          {profileTab === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat
                  label="Given in 2026"
                  value={peso(ytd(dn))}
                  sub={dn.lastYear ? `${ytd(dn) >= dn.lastYear ? "+" : ""}${Math.round((ytd(dn) / dn.lastYear - 1) * 100)}% vs 2025` : "First year giving"}
                  tone={dn.lastYear && ytd(dn) < dn.lastYear ? "bad" : "good"}
                />
                <Stat label="Lifetime" value={peso(dn.lifetime)} sub={`${dn.gifts} gifts since ${dn.since}`} />
                <Stat label="Last gift" value={fmtDate(dn.lastGift)} sub={relDays(dn.lastGift)} tone={dn.segment === "Lapsed" ? "bad" : undefined} />
                <Stat label="Touches, 90 days" value={String(touches.filter((t) => t.donorId === dn.id && t.date >= "2026-07-31").length)} sub={dn.engagement <= 2 ? "At risk of lapsing" : "Relationship is warm"} tone={dn.engagement <= 2 ? "bad" : "good"} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Panel title="Contact">
                  <KeyValues
                    items={[
                      ["Email", dn.email],
                      ["Phone", dn.phone],
                      ["City", dn.city],
                      [
                        "Owner",
                        <select
                          key="owner"
                          aria-label="Relationship owner"
                          value={dn.owner}
                          onChange={(e) => {
                            const owner = e.target.value;
                            setDonors((l) => l.map((x) => (x.id === dn.id ? { ...x, owner } : x)));
                            app.notify(`${dn.name} reassigned to ${owner}`);
                          }}
                          className="h-7 -my-1 px-1.5 rounded-md border border-rule bg-sheet text-[0.78rem] text-ink cursor-pointer"
                        >
                          {STAFF.map((s) => <option key={s}>{s}</option>)}
                        </select>,
                      ],
                    ]}
                  />
                </Panel>
                <Panel title="Household and soft credits">
                  <div className={subhead}>Household</div>
                  <ul className="flex flex-col gap-1.5 mb-2">
                    {[dn.name, ...dn.household].map((n, i) => (
                      <li key={n} className="flex items-center gap-2 text-[0.78rem]">
                        <Avatar name={n} size={22} />
                        <span className="flex-1 text-ink-soft">{n}</span>
                        <span className="text-[0.66rem] text-mist">{i === 0 ? "Primary" : "Member"}</span>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="flex items-center gap-2 mb-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      linkMember(dn);
                    }}
                  >
                    <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Link a household member" aria-label="Household member name" className={cn(inputClass, "h-8")} />
                    <SmallButton onClick={() => linkMember(dn)} disabled={!memberName.trim()}>Link</SmallButton>
                  </form>
                  <div className={subhead}>Soft credits</div>
                  <ul className="flex flex-col gap-1.5">
                    {dn.softCredits.map((s) => (
                      <li key={`${s.from}-${s.note}`} className="flex items-start justify-between gap-2 text-[0.78rem]">
                        <span className="min-w-0">
                          <span className="block text-ink-soft">{s.from}</span>
                          <span className="block text-[0.66rem] text-mist">{s.note}</span>
                        </span>
                        <span className="font-mono text-ink">{peso(s.amount)}</span>
                      </li>
                    ))}
                    {dn.softCredits.length === 0 && <li className="text-[0.76rem] text-graphite">No soft credits.</li>}
                  </ul>
                </Panel>
                <Panel title="Tasks" className="lg:col-span-2">
                  <ul className="flex flex-col gap-2 mb-3">
                    {tasks.filter((t) => t.donorId === dn.id).map((t) => (
                      <li key={t.id} className="flex items-center gap-2.5 text-[0.8rem]">
                        <Tick on={t.done} label={`Complete: ${t.text}`} onToggle={() => setTasks((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
                        <span className={cn("flex-1", t.done ? "text-mist line-through" : "text-ink")}>{t.text}</span>
                        <span className={cn("text-[0.7rem]", !t.done && t.due <= TODAY ? "text-danger" : "text-mist")}>{fmtDate(t.due)}</span>
                      </li>
                    ))}
                    {tasks.every((t) => t.donorId !== dn.id) && <li className="text-[0.78rem] text-graphite">No tasks for this donor.</li>}
                  </ul>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!taskText.trim()) return;
                      setTasks((l) => [...l, { id: nextId("t"), donorId: dn.id, text: taskText.trim(), due: "2026-11-05", done: false }]);
                      setTaskText("");
                      app.notify("Task added, due Nov 5");
                    }}
                  >
                    <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="Add a task, e.g. Invite to the Gabi dinner" aria-label="New task" className={inputClass} />
                    <PrimaryButton type="submit" disabled={!taskText.trim()}>Add task</PrimaryButton>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {profileTab === "giving" && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem] gap-3">
              <div className="flex flex-col gap-3 min-w-0">
                <Table
                  rows={gifts.filter((x) => x.donorId === dn.id)}
                  rowKey={(x) => x.id}
                  onRowClick={(x) => app.open("gift", x.id, x.receipt)}
                  empty="No gifts recorded yet."
                  columns={[
                    { key: "date", label: "Date", render: (x) => fmtDate(x.date) },
                    { key: "fund", label: "Fund", render: (x) => <span className="text-ink">{x.fund}</span> },
                    { key: "kind", label: "Type", render: (x) => x.kind, hideOnMobile: true },
                    { key: "method", label: "Method", render: (x) => x.method, hideOnMobile: true },
                    { key: "amt", label: "Amount", align: "right", render: (x) => <span className="font-mono text-ink">{peso(x.amount)}</span> },
                    { key: "ack", label: "Thanked", render: (x) => <Status tone={x.ack === "Pending" ? "warn" : "good"}>{x.ack === "Pending" ? "Not yet" : x.ack}</Status> },
                  ]}
                />
                {recurring.some((r) => r.donorId === dn.id) && (
                  <Panel title="Recurring gifts">
                    {recurring.filter((r) => r.donorId === dn.id).map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 text-[0.8rem]">
                        <span className="text-ink">{`${peso(r.amount)} a month to ${r.fund} · ${r.method}`}</span>
                        <Status tone={r.status === "Active" ? "good" : r.status === "Failed" ? "bad" : "muted"}>{r.status === "Active" ? `Next ${fmtDate(r.next)}` : r.status}</Status>
                      </div>
                    ))}
                  </Panel>
                )}
                {pledges.some((p) => p.donorId === dn.id) && (
                  <Panel title="Pledges">
                    {pledges.filter((p) => p.donorId === dn.id).map((p) => (
                      <div key={p.id}>
                        <div className="flex justify-between text-[0.8rem]"><span className="text-ink">{`${peso(p.total)} to ${p.fund}`}</span><span className="text-mist">{p.schedule}</span></div>
                        <Meter value={p.paid} max={p.total} className="my-2" />
                        <div className="flex justify-between text-[0.72rem] text-mist"><span>{`${peso(p.paid)} paid`}</span><span>{`Next ${peso(p.installment)} on ${fmtDate(p.next)}`}</span></div>
                      </div>
                    ))}
                  </Panel>
                )}
              </div>
              <Panel title="Giving by year">
                <Bars data={givingByYear(dn)} format={pesoShort} height="h-28" />
                <div className={cn(subhead, "mt-4")}>2026 by fund</div>
                <ul className="flex flex-col gap-2">
                  {FUNDS.filter((f) => (dn.funds[f] ?? 0) > 0).map((f) => (
                    <li key={f} className="text-[0.74rem]">
                      <div className="flex justify-between mb-1"><span className="text-ink-soft">{f}</span><span className="font-mono text-ink">{peso(dn.funds[f] ?? 0)}</span></div>
                      <Meter value={dn.funds[f] ?? 0} max={ytd(dn)} />
                    </li>
                  ))}
                  {ytd(dn) === 0 && <li className="text-[0.76rem] text-graphite">No gifts in 2026 yet.</li>}
                </ul>
              </Panel>
            </div>
          )}

          {profileTab === "timeline" && (() => {
            const items = [
              ...touches.filter((t) => t.donorId === dn.id).map((t) => ({ id: t.id, kind: t.kind as Touch | "Gift", date: t.date, title: t.kind, text: t.text, by: t.by })),
              ...gifts.filter((x) => x.donorId === dn.id).map((x) => ({ id: x.id, kind: "Gift" as Touch | "Gift", date: x.date, title: `${peso(x.amount)} gift`, text: `${x.fund} · ${x.method}${x.campaignId ? ` · ${campaignName(x.campaignId)}` : ""}`, by: x.ack === "Pending" ? "Not thanked yet" : `Thanked by ${x.ack === "Called" ? "call" : "email"}` })),
            ]
              .filter((it) => timelineKind === "all" || it.kind === timelineKind || (timelineKind === "Visit" && it.kind === "Meeting"))
              .sort((a, b) => b.date.localeCompare(a.date));
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <Segmented id="dn-tl" value={timelineKind} onChange={setTimelineKind} options={[{ id: "all", label: "All" }, { id: "Call", label: "Calls" }, { id: "Email", label: "Emails" }, { id: "Visit", label: "Visits" }, { id: "Gift", label: "Gifts" }]} />
                  <SmallButton onClick={() => setModal("touch")}><Plus size={12} /> Add to timeline</SmallButton>
                </div>
                <ol className="bg-sheet border border-rule rounded-lg p-3.5">
                  {items.map((it, i) => {
                    const Icon = TOUCH_ICON[it.kind];
                    return (
                      <motion.li key={it.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="relative flex gap-3 pb-4 last:pb-0">
                        {i < items.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-rule" aria-hidden />}
                        <span className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", it.kind === "Gift" ? "bg-gold text-sheet" : "bg-raised text-graphite")}>
                          <Icon size={13} />
                        </span>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[0.8rem] font-medium text-ink">{it.title}</span>
                            <span className="text-[0.68rem] text-mist shrink-0">{fmtDate(it.date)}</span>
                          </div>
                          <p className="text-[0.76rem] text-ink-soft leading-snug mt-0.5">{it.text}</p>
                          <p className="text-[0.66rem] text-mist mt-0.5">{it.by}</p>
                        </div>
                      </motion.li>
                    );
                  })}
                  {items.length === 0 && <li className="py-4 text-center text-[0.8rem] text-mist">Nothing logged here yet.</li>}
                </ol>
              </>
            );
          })()}
        </>
      )}

      {/* ---------------- Gifts ---------------- */}
      {app.screen === "gifts" && (
        <>
          <ScreenHeader
            title="Gifts"
            subtitle="October 2026 · all funds"
            action={
              <>
                <SmallButton onClick={() => setModal("batch")}><Layers size={12} /> Batch entry</SmallButton>
                <PrimaryButton onClick={() => openGift({})}><Plus size={14} /> Record gift</PrimaryButton>
              </>
            }
          />
          <div className="mb-3">
            <Segmented id="gf-tab" value={giftTab} onChange={setGiftTab} options={[{ id: "gifts", label: "All gifts" }, { id: "recurring", label: "Recurring" }, { id: "pledges", label: "Pledges" }]} />
          </div>

          {giftTab === "gifts" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="October so far" value={pesoShort(octTotal)} sub={`${octCount} gifts`} />
                <Stat label="Average gift" value={peso(Math.round(octTotal / octCount))} sub="+9% vs September" tone="good" />
                <Stat label="Recurring, monthly" value={peso(mrr)} sub={`${recurring.filter((r) => r.status === "Active").length} schedules shown`} />
                <Stat label="Awaiting thank-you" value={String(pending.length)} sub={pending.length ? `Oldest from ${fmtDate([...pending].sort((a, b) => a.date.localeCompare(b.date))[0].date)}` : "All thanked"} tone={pending.length ? "bad" : "good"} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SearchBox value={giftQuery} onChange={setGiftQuery} placeholder="Search donor, receipt or batch" />
                <select value={fundFilter} onChange={(e) => setFundFilter(e.target.value as "all" | Fund)} aria-label="Fund" className={selectSm}>
                  <option value="all">All funds</option>
                  {FUNDS.map((f) => <option key={f}>{f}</option>)}
                </select>
                <Segmented id="gf-ack" value={ackFilter} onChange={setAckFilter} options={[{ id: "all", label: "All" }, { id: "pending", label: "Needs thank-you" }, { id: "thanked", label: "Thanked" }]} />
                {visiblePending.length > 0 && (
                  <PrimaryButton onClick={() => thank(visiblePending.map((x) => x.id), "Emailed")}><Send size={14} /> Send all thank-yous</PrimaryButton>
                )}
              </div>
              <Table
                rows={visibleGifts}
                rowKey={(x) => x.id}
                onRowClick={(x) => app.open("gift", x.id, x.receipt)}
                empty={ackFilter === "pending" ? "Every gift has been thanked." : "No gifts match these filters."}
                columns={[
                  { key: "date", label: "Date", render: (x) => fmtDate(x.date) },
                  {
                    key: "donor",
                    label: "Donor",
                    render: (x) => (
                      <span className="min-w-0">
                        <span className="block text-ink truncate">{nameOf(x.donorId)}</span>
                        <span className="block text-[0.66rem] text-mist">{x.batch ? `${x.receipt} · ${x.batch}` : `${x.receipt} · ${x.kind}`}</span>
                      </span>
                    ),
                  },
                  { key: "fund", label: "Fund", render: (x) => x.fund, hideOnMobile: true },
                  { key: "method", label: "Method", render: (x) => x.method, hideOnMobile: true },
                  { key: "amt", label: "Amount", align: "right", render: (x) => <span className="font-mono text-ink">{peso(x.amount)}</span> },
                  {
                    key: "ack",
                    label: "Thank-you",
                    render: (x) => (x.ack === "Pending" ? <SmallButton onClick={() => thank([x.id], "Emailed")}><Send size={11} /> Send thank-you</SmallButton> : <Status tone="good">{x.ack}</Status>),
                  },
                ]}
              />
            </>
          )}

          {giftTab === "recurring" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="Monthly donors" value="612" sub="+18 since July" tone="good" />
                <Stat label="These schedules" value={`${peso(mrr)}/mo`} />
                <Stat label="Failed this month" value={String(recurring.filter((r) => r.status === "Failed").length)} sub="Card or wallet declined" tone={recurring.some((r) => r.status === "Failed") ? "bad" : "good"} />
                <Stat label="Paused" value={String(recurring.filter((r) => r.status === "Paused").length)} />
              </div>
              <Table
                rows={recurring}
                rowKey={(r) => r.id}
                onRowClick={(r) => openDonorId(r.donorId)}
                columns={[
                  { key: "donor", label: "Donor", render: (r) => <span className="text-ink">{nameOf(r.donorId)}</span> },
                  { key: "amt", label: "Monthly", align: "right", render: (r) => <span className="font-mono text-ink">{peso(r.amount)}</span> },
                  { key: "fund", label: "Fund", render: (r) => r.fund, hideOnMobile: true },
                  { key: "method", label: "Method", render: (r) => r.method, hideOnMobile: true },
                  { key: "next", label: "Next charge", render: (r) => (r.status === "Active" ? fmtDate(r.next) : "—"), hideOnMobile: true },
                  { key: "status", label: "Status", render: (r) => <Status tone={r.status === "Active" ? "good" : r.status === "Failed" ? "bad" : "muted"}>{r.status}</Status> },
                  {
                    key: "act",
                    label: "",
                    align: "right",
                    render: (r) =>
                      r.status === "Failed" ? (
                        <SmallButton
                          onClick={() => {
                            setRecurring((l) => l.map((x) => (x.id === r.id ? { ...x, status: "Active", next: "2026-11-15" } : x)));
                            applyGifts([{ id: nextId("g"), donorId: r.donorId, amount: r.amount, fund: r.fund, method: r.method, date: TODAY, kind: "Recurring", receipt: nextReceipt(), ack: "Pending" }]);
                            app.notify(`Charge retried. ${peso(r.amount)} received from ${nameOf(r.donorId)}`);
                          }}
                        >
                          Retry charge
                        </SmallButton>
                      ) : (
                        <SmallButton
                          onClick={() => {
                            const next = r.status === "Active" ? "Paused" : "Active";
                            setRecurring((l) => l.map((x) => (x.id === r.id ? { ...x, status: next, next: next === "Active" ? "2026-11-15" : "" } : x)));
                            app.notify(`${nameOf(r.donorId)}'s monthly gift ${next === "Active" ? "resumed" : "paused"}`);
                          }}
                        >
                          {r.status === "Active" ? "Pause" : "Resume"}
                        </SmallButton>
                      ),
                  },
                ]}
              />
            </>
          )}

          {giftTab === "pledges" && (
            <>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <Stat label="Pledged" value={pesoShort(sum(pledges.map((p) => p.total)))} sub={`${pledges.length} pledges`} />
                <Stat label="Collected" value={pesoShort(sum(pledges.map((p) => p.paid)))} sub={`${Math.round((sum(pledges.map((p) => p.paid)) / sum(pledges.map((p) => p.total))) * 100)}% of pledged`} />
                <Stat label="Overdue" value={String(pledges.filter((p) => p.paid < p.total && p.next < TODAY).length)} sub="Past the due date" tone={pledges.some((p) => p.paid < p.total && p.next < TODAY) ? "bad" : "good"} />
              </div>
              <Table
                rows={pledges}
                rowKey={(p) => p.id}
                onRowClick={(p) => openDonorId(p.donorId)}
                columns={[
                  { key: "donor", label: "Donor", render: (p) => <span className="text-ink">{nameOf(p.donorId)}</span> },
                  { key: "fund", label: "Fund", render: (p) => p.fund, hideOnMobile: true },
                  { key: "paid", label: "Paid", render: (p) => <span className="flex items-center gap-2"><Meter value={p.paid} max={p.total} className="w-16" /><span className="font-mono text-[0.7rem]">{`${pesoShort(p.paid)} / ${pesoShort(p.total)}`}</span></span> },
                  { key: "next", label: "Next payment", render: (p) => (p.paid >= p.total ? <Status tone="good">Fulfilled</Status> : <span className={p.next < TODAY ? "text-danger" : ""}>{`${peso(p.installment)} · ${fmtDate(p.next)}`}</span>), hideOnMobile: true },
                  {
                    key: "act",
                    label: "",
                    align: "right",
                    render: (p) =>
                      p.paid < p.total ? (
                        <span className="inline-flex gap-1.5">
                          <SmallButton onClick={() => { logTouch(p.donorId, "Email", `Pledge reminder sent for ${peso(p.installment)} due ${fmtDate(p.next)}.`); app.notify(`Reminder sent to ${nameOf(p.donorId)}`); }}>Remind</SmallButton>
                          <SmallButton onClick={() => openGift({ donorId: p.donorId, fund: p.fund, kind: "Pledge payment", amount: String(p.installment), method: "Bank transfer" })}>Record payment</SmallButton>
                        </span>
                      ) : null,
                  },
                ]}
              />
            </>
          )}
        </>
      )}

      {/* ---------------- Gift detail ---------------- */}
      {app.screen === "gift" && gf && gfDonor && (
        <>
          <ScreenHeader title={`${peso(gf.amount)} from ${gfDonor.name}`} subtitle={`${fmtDate(gf.date)} · ${gf.receipt}`} action={<SmallButton onClick={() => openDonor(gfDonor)}>Open donor</SmallButton>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Gift details">
              <KeyValues items={[["Donor", gfDonor.name], ["Amount", peso(gf.amount)], ["Fund", gf.fund], ["Campaign", campaignName(gf.campaignId) ?? "—"], ["Method", gf.method], ["Type", gf.kind], ["Batch", gf.batch ?? "—"], ["Receipt no.", gf.receipt]]} />
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Acknowledgment">
                {gf.ack === "Pending" ? (
                  <>
                    <p className="text-[0.8rem] text-ink-soft leading-snug">Not thanked yet. Thank within 48 hours, by email or a short call.</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <PrimaryButton onClick={() => thank([gf.id], "Emailed")}><Send size={14} /> Send thank-you</PrimaryButton>
                      <SmallButton onClick={() => thank([gf.id], "Called")}><Phone size={12} /> Log thank-you call</SmallButton>
                    </div>
                  </>
                ) : (
                  <>
                    <Status tone="good">{gf.ack === "Called" ? "Thanked by call" : "Thanked by email"}</Status>
                    <p className="text-[0.78rem] text-ink-soft mt-2">{`Receipt ${gf.receipt} emailed to ${gfDonor.email}.`}</p>
                    <div className="mt-3"><SmallButton onClick={() => app.notify(`Receipt ${gf.receipt} resent to ${gfDonor.email}`)}><Send size={11} /> Resend receipt</SmallButton></div>
                  </>
                )}
              </Panel>
              <Panel title="Receipt preview">
                <div className="rounded-md border border-dashed border-rule p-3 text-[0.74rem] text-ink-soft">
                  <div className="flex justify-between text-[0.66rem] text-mist"><span className="font-semibold text-gold">Bukas Palad Foundation</span><span>{gf.receipt}</span></div>
                  <div className="mt-2 text-ink font-medium">Acknowledgment receipt</div>
                  <div className="mt-1">{`Received from ${gfDonor.name} the amount of ${peso(gf.amount)} for ${gf.fund}, by ${gf.method}, on ${fmtDate(gf.date)}.`}</div>
                  <div className="mt-2 text-[0.68rem] text-mist">Thank you for giving with an open hand.</div>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Campaigns ---------------- */}
      {app.screen === "campaigns" && (
        <>
          <ScreenHeader title="Campaigns" subtitle="Appeals, peer-to-peer and events" action={<PrimaryButton onClick={() => setModal("campaign")}><Plus size={14} /> New campaign</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Raised, live campaigns" value={pesoShort(sum(campaigns.filter((c) => c.status === "Live").map((c) => c.raised)))} />
            <Stat label="Donors, live campaigns" value={sum(campaigns.filter((c) => c.status === "Live").map((c) => c.donors)).toLocaleString()} />
            <Stat label="Fundraisers" value={String(sum(campaigns.map((c) => c.fundraisers.length)))} sub="Peer-to-peer pages" />
            <Stat label="Tickets sold" value={String(sum(campaigns.flatMap((c) => c.tiers.map((t) => t.sold))))} sub="Gabi ng Pasasalamat" />
          </div>
          <div className="mb-3">
            <Segmented id="cp-kind" value={campaignKind} onChange={setCampaignKind} options={[{ id: "all", label: "All" }, { id: "Appeal", label: "Appeals" }, { id: "Peer-to-peer", label: "Peer-to-peer" }, { id: "Event", label: "Events" }]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {campaigns.filter((c) => campaignKind === "all" || c.kind === campaignKind).map((c, i) => (
              <motion.button
                key={c.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => app.open("campaign", c.id, c.name)}
                className="text-left bg-sheet border border-rule rounded-lg p-3.5 hover:border-mist transition-colors cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[0.86rem] font-semibold text-ink">{c.name}</span>
                  <Status tone={c.status === "Live" ? "good" : c.status === "Draft" ? "warn" : "muted"}>{c.status}</Status>
                </div>
                <div className="text-[0.7rem] text-mist mt-0.5">{`${c.kind} · ${c.fund} · ${c.kind === "Event" ? fmtDate(c.ends) : `ends ${fmtDate(c.ends)}`}`}</div>
                <Meter value={c.raised} max={c.goal} className="mt-3" />
                <div className="flex justify-between mt-1.5 text-[0.72rem]">
                  <span className="text-ink font-medium">{`${peso(c.raised)} of ${pesoShort(c.goal)}`}</span>
                  <span className="text-mist">{c.kind === "Peer-to-peer" ? `${c.fundraisers.length} fundraisers` : `${c.donors.toLocaleString()} donors`}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {/* ---------------- Campaign detail ---------------- */}
      {app.screen === "campaign" && cp && (
        <>
          <ScreenHeader
            title={cp.name}
            subtitle={`${cp.kind} · ${cp.fund} fund · ${fmtDate(cp.starts)} to ${fmtDate(cp.ends)}`}
            action={
              <>
                <SmallButton onClick={() => app.notify(`Link copied: give.bukaspalad.org/${cp.slug}`)}><Share2 size={12} /> Share page</SmallButton>
                {cp.status === "Draft" ? (
                  <PrimaryButton onClick={() => { setCampaigns((l) => l.map((c) => (c.id === cp.id ? { ...c, status: "Live" } : c))); app.notify(`${cp.name} is live`); }}>Publish page</PrimaryButton>
                ) : cp.status === "Live" ? (
                  <PrimaryButton onClick={() => openGift({ campaignId: cp.id, fund: cp.fund })}><Plus size={14} /> Record gift</PrimaryButton>
                ) : null}
              </>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Raised" value={peso(cp.raised)} sub={`${Math.round((cp.raised / cp.goal) * 100)}% of ${pesoShort(cp.goal)}`} tone={cp.raised >= cp.goal ? "good" : undefined} />
            <Stat label="Donors" value={cp.donors.toLocaleString()} />
            <Stat label="Average gift" value={cp.donors ? peso(Math.round(cp.raised / cp.donors)) : "—"} />
            <Stat label={cp.status === "Closed" ? "Ended" : "Days left"} value={cp.status === "Closed" ? fmtDate(cp.ends) : String(Math.max(0, daysFrom(cp.ends)))} sub={cp.status === "Draft" ? "Not published" : undefined} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-3">
            <Panel title="Campaign page">
              <div className="h-24 rounded-md bg-gold-wash flex items-center justify-center text-[0.7rem] text-gold">Cover photo</div>
              <div className="mt-3 text-[0.9rem] font-semibold text-ink">{cp.name}</div>
              <p className="text-[0.76rem] text-ink-soft mt-1 leading-snug">{cp.blurb}</p>
              <Meter value={cp.raised} max={cp.goal} className="mt-3" />
              <div className="mt-1.5 flex justify-between text-[0.7rem] text-mist"><span>{`${peso(cp.raised)} raised`}</span><span>{`Goal ${peso(cp.goal)}`}</span></div>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {[500, 1000, 2500, 5000].map((n) => <span key={n} className="h-7 rounded-md border border-rule text-[0.7rem] text-ink-soft flex items-center justify-center">{peso(n)}</span>)}
              </div>
              <div className="mt-2 text-[0.66rem] text-mist">{`give.bukaspalad.org/${cp.slug} · GCash, Maya, card, bank transfer`}</div>
            </Panel>

            {cp.kind === "Peer-to-peer" && (
              <Panel title="Fundraisers" action={<SmallButton onClick={() => setModal("fundraiser")}><UserPlus size={12} /> Invite fundraiser</SmallButton>}>
                <ol className={listClass}>
                  {[...cp.fundraisers].sort((a, b) => b.raised - a.raised).map((f, i) => (
                    <li key={f.id} className="flex items-center gap-2.5 py-2">
                      <span className="w-4 text-[0.7rem] font-semibold text-mist tabular-nums">{i + 1}</span>
                      <Avatar name={f.name} size={26} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 text-[0.78rem]"><span className="text-ink truncate">{f.name}</span><span className="font-mono text-ink">{peso(f.raised)}</span></div>
                        <Meter value={f.raised} max={f.goal} className="my-1" />
                        <div className="flex justify-between text-[0.66rem] text-mist"><span className="truncate">{`${f.team} · ${f.donors} donors`}</span><span>{`${Math.round((f.raised / f.goal) * 100)}% of ${pesoShort(f.goal)}`}</span></div>
                      </div>
                      {f.raised < f.goal / 2 &&
                        (nudged.includes(f.id) ? (
                          <Status tone="muted">Nudged</Status>
                        ) : (
                          <SmallButton onClick={() => { setNudged((l) => [...l, f.id]); app.notify(`Tips and a nudge sent to ${f.name}`); }}>Nudge</SmallButton>
                        ))}
                    </li>
                  ))}
                  {cp.fundraisers.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No fundraisers yet. Invite your first.</li>}
                </ol>
              </Panel>
            )}

            {cp.kind === "Event" && (
              <Panel title="Tickets" action={<span className="text-[0.7rem] text-mist">{`${sum(cp.tiers.map((t) => t.sold * t.seats))} seats sold`}</span>}>
                <ul className={listClass}>
                  {cp.tiers.map((t) => (
                    <li key={t.id} className="flex items-center gap-2.5 py-2">
                      <Ticket size={14} className="text-mist shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 text-[0.78rem]"><span className="text-ink">{t.name}</span><span className="font-mono text-ink-soft">{t.price ? peso(t.price) : "Free"}</span></div>
                        <Meter value={t.sold} max={t.capacity} className="my-1" />
                        <div className="text-[0.66rem] text-mist">{`${t.sold} of ${t.capacity} sold${t.seats > 1 ? ` · ${t.seats} seats each` : ""}`}</div>
                      </div>
                      <SmallButton
                        disabled={t.sold >= t.capacity}
                        onClick={() => {
                          setCampaigns((l) => l.map((c) => (c.id === cp.id ? { ...c, raised: c.raised + t.price, donors: c.donors + 1, tiers: c.tiers.map((x) => (x.id === t.id ? { ...x, sold: x.sold + 1 } : x)) } : c)));
                          setSession((s) => ({ amount: s.amount + t.price, count: s.count + 1 }));
                          app.notify(`${t.name} sold. E-ticket emailed.`);
                        }}
                      >
                        Sell
                      </SmallButton>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-rule">
                  <KeyValues items={[["Date", `Sat, ${fmtDate(cp.ends)} · 6:00 PM`], ["Venue", cp.venue ?? "—"], ["Ticket revenue", peso(sum(cp.tiers.map((t) => t.price * t.sold)))]]} />
                </div>
              </Panel>
            )}

            {cp.kind === "Appeal" && (
              <Panel title="Recent gifts">
                <ul className={listClass}>
                  {gifts.filter((x) => x.campaignId === cp.id).map((x) => (
                    <li key={x.id}>
                      <button type="button" onClick={() => app.open("gift", x.id, x.receipt)} className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer group">
                        <Avatar name={nameOf(x.donorId)} size={24} />
                        <span className="flex-1 min-w-0 text-[0.78rem] text-ink group-hover:text-gold truncate">{nameOf(x.donorId)}</span>
                        <span className="text-[0.68rem] text-mist">{`${x.method} · ${fmtDate(x.date)}`}</span>
                        <span className="font-mono text-[0.78rem] text-ink">{peso(x.amount)}</span>
                      </button>
                    </li>
                  ))}
                  {gifts.every((x) => x.campaignId !== cp.id) && <li className="py-3 text-[0.8rem] text-graphite">{cp.status === "Draft" ? "Publish the page to start taking gifts." : "Older gifts are in the Gifts list."}</li>}
                </ul>
              </Panel>
            )}
          </div>
        </>
      )}

      {/* ---------------- Programs ---------------- */}
      {app.screen === "programs" && (
        <>
          <ScreenHeader
            title="Programs and impact"
            subtitle="Outcomes, linked to the funds that paid for them"
            action={<SmallButton onClick={() => { setFigures({ programId: "pr1", month: 9, site: 0, value: "" }); setModal("figures"); }}><Plus size={12} /> Log figures</SmallButton>}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 mb-3">
            {programs.map((p) => {
              const total = programTotal(p);
              return (
                <button key={p.id} type="button" onClick={() => app.open("program", p.id, p.name)} className="text-left bg-sheet border border-rule rounded-lg p-3.5 hover:border-mist transition-colors cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="flex items-center justify-between gap-2"><span className="text-[0.86rem] font-semibold text-ink">{p.name}</span><span className="text-[0.66rem] text-mist">{`${p.fund} fund`}</span></div>
                  <div className="mt-2 text-[1.45rem] font-semibold text-ink tabular-nums leading-tight">{total.toLocaleString()}</div>
                  <div className="text-[0.72rem] text-mist">{`${p.metric.toLowerCase()} · target ${p.target.toLocaleString()}`}</div>
                  <Meter value={total} max={p.target} className="mt-2.5" />
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[0.72rem]">
                    <div><div className="text-mist">Raised</div><div className="text-ink font-medium">{pesoShort(p.raised)}</div></div>
                    <div><div className="text-mist">Spent</div><div className="text-ink font-medium">{pesoShort(p.spent)}</div></div>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-rule-soft text-[0.7rem] text-graphite">{p.costNote}</div>
                </button>
              );
            })}
          </div>
          <Panel title="Monthly figures, 2026">
            <div className="overflow-x-auto">
              <table className="w-full text-[0.74rem] tabular-nums">
                <thead>
                  <tr className="text-mist text-[0.66rem]">
                    <th className="text-left font-medium px-1.5 py-1.5">Outcome</th>
                    {MONTHS.slice(0, 10).map((m) => <th key={m} className="text-right font-medium px-1.5 py-1.5">{m}</th>)}
                    <th className="text-right font-medium px-1.5 py-1.5">2026</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((p) => (
                    <tr key={p.id} onClick={() => app.open("program", p.id, p.name)} className="border-t border-rule-soft cursor-pointer hover:bg-paper">
                      <td className="px-1.5 py-2 text-ink whitespace-nowrap">{p.metric}</td>
                      {p.monthly.map((v, i) => <td key={i} className={cn("px-1.5 py-2 text-right", i === 9 ? "text-ink font-semibold" : "text-ink-soft")}>{compact(v)}</td>)}
                      <td className="px-1.5 py-2 text-right text-ink font-semibold">{compact(programTotal(p))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[0.7rem] text-mist">{`Scholars are an active count, not a sum. General fund (${pesoShort(1_820_000)}) covers staff, transport and audits.`}</p>
          </Panel>
        </>
      )}

      {/* ---------------- Program detail ---------------- */}
      {app.screen === "program" && pg && (
        <>
          <ScreenHeader
            title={pg.name}
            subtitle={`${pg.fund} fund · ${pg.sites.length} sites · ${pg.costNote}`}
            action={<SmallButton onClick={() => { setFigures({ programId: pg.id, month: 9, site: 0, value: "" }); setModal("figures"); }}><Plus size={12} /> Log figures</SmallButton>}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label={`${pg.metric}, 2026`} value={programTotal(pg).toLocaleString()} sub={`${Math.round((programTotal(pg) / pg.target) * 100)}% of ${pg.target.toLocaleString()} target`} tone="good" />
            <Stat label="Raised" value={pesoShort(pg.raised)} sub={`${pg.fund} fund, year to date`} />
            <Stat label="Spent" value={pesoShort(pg.spent)} sub={`${Math.round((pg.spent / pg.raised) * 100)}% of funds raised`} />
            <Stat label={`Cost per ${pg.unit}`} value={peso(pg.costPer)} sub={pg.cumulative ? "All-in, incl. transport" : "Per year, stipend and books"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title={`${pg.metric} by month`}>
              <Bars data={pg.monthly.map((v, i) => ({ label: MONTHS[i], value: v }))} format={compact} />
            </Panel>
            <Panel title="By site">
              <ul className="flex flex-col gap-3">
                {pg.sites.map((s) => (
                  <li key={s.name} className="text-[0.78rem]">
                    <div className="flex justify-between mb-1"><span className="text-ink">{s.name}</span><span className="font-mono text-ink">{s.value.toLocaleString()}</span></div>
                    <Meter value={s.value} max={sum(pg.sites.map((x) => x.value))} />
                    <div className="mt-1 text-[0.66rem] text-mist">{`Site lead: ${s.lead}`}</div>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Outcomes">
              <KeyValues items={pg.outcomes} />
            </Panel>
            <Panel title="Updates for donors">
              <ul className="flex flex-col gap-2.5 mb-3">
                {pg.updates.map((u) => (
                  <li key={u.id} className="text-[0.78rem]">
                    <div className="flex justify-between gap-2"><span className="text-ink font-medium">{u.title}</span><span className="text-[0.66rem] text-mist shrink-0">{fmtDate(u.date)}</span></div>
                    <p className="text-ink-soft leading-snug mt-0.5">{u.text}</p>
                  </li>
                ))}
              </ul>
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!updateDraft.title.trim()) return;
                  setPrograms((l) => l.map((p) => (p.id === pg.id ? { ...p, updates: [{ id: nextId("u"), date: TODAY, title: updateDraft.title.trim(), text: updateDraft.text.trim() || "Photos and details in the donor app." }, ...p.updates] } : p)));
                  setUpdateDraft({ title: "", text: "" });
                  app.notify("Update posted. Donors see it in the app.");
                }}
              >
                <input value={updateDraft.title} onChange={(e) => setUpdateDraft({ ...updateDraft, title: e.target.value })} placeholder="Headline" aria-label="Update headline" className={inputClass} />
                <input value={updateDraft.text} onChange={(e) => setUpdateDraft({ ...updateDraft, text: e.target.value })} placeholder="One or two lines for donors" aria-label="Update text" className={inputClass} />
                <div className="flex justify-end"><PrimaryButton type="submit" disabled={!updateDraft.title.trim()}><Send size={14} /> Post update</PrimaryButton></div>
              </form>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Impact reports ---------------- */}
      {app.screen === "reports" && (
        <>
          <ScreenHeader
            title="Impact reports"
            subtitle="Show donors and the board what the gifts did"
            action={<Segmented id="rp-mode" value={reportMode} onChange={setReportMode} options={[{ id: "donor", label: "Donor report" }, { id: "board", label: "Board report" }]} />}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] gap-3">
            <div className="flex flex-col gap-3">
              {reportMode === "donor" ? (
                <Panel title="Build report">
                  <div className="flex flex-col gap-3">
                    <Group label="Send to">
                      <Segmented id="rp-scope" value={reportScope} onChange={setReportScope} options={[{ id: "donor", label: "One donor" }, { id: "segment", label: "Segment" }]} />
                    </Group>
                    {reportScope === "donor" ? (
                      <Field label="Donor">
                        <select value={rd.id} onChange={(e) => setReportDonor(e.target.value)} className={inputClass}>
                          {donors.filter((d) => ytd(d) > 0).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </Field>
                    ) : (
                      <Field label="Segment">
                        <select value={reportSeg} onChange={(e) => setReportSeg(e.target.value as Segment)} className={inputClass}>
                          {SEGMENTS.filter((s) => s !== "Lapsed").map((s) => <option key={s} value={s}>{`${s} donors (${AUDIENCE_SIZE[s]})`}</option>)}
                        </select>
                      </Field>
                    )}
                    <div className="flex items-center justify-between gap-2 text-[0.78rem] text-ink-soft">Program story <Toggle on={withStory} onChange={setWithStory} label="Include a program story" /></div>
                    <div className="flex items-center justify-between gap-2 text-[0.78rem] text-ink-soft">Letter from Carmela <Toggle on={withLetter} onChange={setWithLetter} label="Include a letter" /></div>
                    <PrimaryButton
                      onClick={() => {
                        const to = reportScope === "donor" ? rd.name : `${reportSeg} donors (${AUDIENCE_SIZE[reportSeg]})`;
                        setSentReports((l) => [{ id: nextId("s"), to, kind: reportScope === "donor" ? "Donor" : "Segment", date: TODAY }, ...l]);
                        if (reportScope === "donor") logTouch(rd.id, "Email", "Sent the 2026 impact report.");
                        app.notify(reportScope === "donor" ? `Impact report sent to ${rd.name}` : `${AUDIENCE_SIZE[reportSeg]} personal impact reports sent`);
                      }}
                    >
                      <Send size={14} /> {reportScope === "donor" ? "Send report" : `Send to ${AUDIENCE_SIZE[reportSeg]} donors`}
                    </PrimaryButton>
                    <SmallButton onClick={() => app.notify(`PDF ready: ${rd.name}, 2026 impact`)}><Download size={12} /> Download PDF</SmallButton>
                  </div>
                </Panel>
              ) : (
                <Panel title="Board report">
                  <div className="flex flex-col gap-3">
                    <p className="text-[0.78rem] text-ink-soft leading-snug">Q3 2026 for the Nov 12 board meeting. Figures update as gifts and outcomes come in.</p>
                    <div className="flex items-center justify-between gap-2 text-[0.78rem] text-ink-soft">Grants pipeline <Toggle on={withGrants} onChange={setWithGrants} label="Include grants pipeline" /></div>
                    <div className="flex items-center justify-between gap-2 text-[0.78rem] text-ink-soft">Top donor names <Toggle on={withNames} onChange={setWithNames} label="Include top donor names" /></div>
                    <PrimaryButton onClick={() => { setSentReports((l) => [{ id: nextId("s"), to: "Board of trustees", kind: "Board", date: TODAY }, ...l]); app.notify("Board report sent to 9 trustees"); }}><Send size={14} /> Send to board</PrimaryButton>
                    <SmallButton onClick={() => app.notify("PDF ready: Board report, Q3 2026")}><Download size={12} /> Export PDF</SmallButton>
                  </div>
                </Panel>
              )}
              <Panel title="Recently sent">
                <ul className={listClass}>
                  {sentReports.slice(0, 5).map((s) => (
                    <li key={s.id} className="py-1.5 text-[0.74rem]">
                      <div className="text-ink truncate">{s.to}</div>
                      <div className="text-[0.66rem] text-mist">{`${s.kind} report · ${fmtDate(s.date)}`}</div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            {reportMode === "donor" ? (
              <div className="min-w-0">
                {reportScope === "segment" && <div className="mb-2 text-[0.72rem] text-mist">{`Previewing for ${rd.name}. Each of the ${AUDIENCE_SIZE[reportSeg]} donors gets their own numbers.`}</div>}
                <motion.article key={`${rd.id}-${withStory}-${withLetter}`} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="bg-sheet border border-rule rounded-lg shadow-[0_8px_24px_-12px_rgba(16,24,40,0.18)] p-5 sm:p-6">
                  <div className="flex items-center justify-between text-[0.66rem] text-mist">
                    <span className="font-semibold text-gold">Bukas Palad Foundation</span>
                    <span>Impact report · 2026 to date</span>
                  </div>
                  <h5 className="mt-3 text-[1.15rem] font-semibold text-ink leading-snug">{`${cap(greet(rd))}, here is what you made possible`}</h5>
                  <p className="text-[0.78rem] text-ink-soft mt-1">{`This year you gave ${peso(ytd(rd))} across ${rdFunds.length} ${rdFunds.length === 1 ? "fund" : "funds"}. Every peso is tracked to an outcome.`}</p>
                  <div className={cn("mt-4 grid gap-2", rdOutcomes.length >= 3 ? "grid-cols-3" : "grid-cols-2")}>
                    {rdOutcomes.map((o) => (
                      <div key={o.label} className="rounded-md bg-gold-wash px-3 py-2.5">
                        <div className="text-[1.25rem] font-semibold text-gold tabular-nums leading-tight">{o.value}</div>
                        <div className="text-[0.68rem] text-ink-soft">{o.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="text-[0.74rem] font-semibold text-ink mb-2">Where your gifts went</div>
                    <ul className="flex flex-col gap-2">
                      {rdFunds.map((f) => (
                        <li key={f} className="text-[0.74rem]">
                          <div className="flex justify-between mb-1"><span className="text-ink-soft">{f}</span><span className="font-mono text-ink">{peso(rd.funds[f] ?? 0)}</span></div>
                          <Meter value={rd.funds[f] ?? 0} max={ytd(rd)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <div className="text-[0.74rem] font-semibold text-ink mb-1.5">Your recent gifts</div>
                    <ul className="flex flex-col gap-1 text-[0.74rem]">
                      {gifts.filter((x) => x.donorId === rd.id).slice(0, 4).map((x) => (
                        <li key={x.id} className="flex justify-between gap-2"><span className="text-ink-soft">{`${fmtDate(x.date)} · ${x.fund}`}</span><span className="font-mono text-ink">{peso(x.amount)}</span></li>
                      ))}
                      {gifts.every((x) => x.donorId !== rd.id) && <li className="text-graphite">Gift history is attached as a statement.</li>}
                    </ul>
                  </div>
                  {withStory && (
                    <div className="mt-4 grid grid-cols-[6rem_minmax(0,1fr)] gap-3">
                      <div className="h-20 rounded-md bg-raised text-graphite text-[0.62rem] flex items-center justify-center text-center px-1">{STORIES[rdTop].photo}</div>
                      <div>
                        <div className="text-[0.78rem] font-semibold text-ink">{STORIES[rdTop].title}</div>
                        <p className="text-[0.74rem] text-ink-soft leading-snug mt-0.5">{STORIES[rdTop].text}</p>
                      </div>
                    </div>
                  )}
                  {withLetter && (
                    <div className="mt-4 pt-3 border-t border-rule text-[0.76rem] text-ink-soft leading-relaxed">
                      Thank you for standing with families in Tondo, Payatas, Baseco and Bicol this year. You made every number on this page happen.
                      <div className="mt-2 text-ink font-medium">Carmela Santos</div>
                      <div className="text-[0.7rem] text-mist">Development director, Bukas Palad Foundation</div>
                    </div>
                  )}
                </motion.article>
              </div>
            ) : (
              <motion.article key={`board-${withGrants}-${withNames}`} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="min-w-0 bg-sheet border border-rule rounded-lg shadow-[0_8px_24px_-12px_rgba(16,24,40,0.18)] p-5 sm:p-6">
                <div className="flex items-center justify-between text-[0.66rem] text-mist">
                  <span className="font-semibold text-gold">Bukas Palad Foundation</span>
                  <span>Board report · Q3 2026</span>
                </div>
                <h5 className="mt-3 text-[1.15rem] font-semibold text-ink">Giving and impact, January to October</h5>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    [pesoShort(raisedYtd), `Raised, +${growth}% vs 2025`],
                    ["61%", "Donor retention, +7 pts"],
                    ["1,284", "Active donors"],
                    ["612", "Monthly donors"],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-md bg-gold-wash px-3 py-2.5">
                      <div className="text-[1.1rem] font-semibold text-gold tabular-nums leading-tight">{v}</div>
                      <div className="text-[0.66rem] text-ink-soft">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[0.74rem] font-semibold text-ink mb-2">Raised by fund</div>
                    <Bars height="h-24" format={pesoShort} data={[...programs.map((p) => ({ label: p.fund === "Disaster relief" ? "Relief" : p.fund, value: p.raised })), { label: "General", value: 1_820_000 }]} />
                  </div>
                  <div>
                    <div className="text-[0.74rem] font-semibold text-ink mb-2">Outcomes against target</div>
                    <ul className="flex flex-col gap-2.5">
                      {programs.map((p) => (
                        <li key={p.id} className="text-[0.72rem]">
                          <div className="flex justify-between mb-1"><span className="text-ink-soft">{p.metric}</span><span className="text-ink tabular-nums">{`${programTotal(p).toLocaleString()} / ${p.target.toLocaleString()}`}</span></div>
                          <Meter value={programTotal(p)} max={p.target} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {withGrants && (
                  <div className="mt-4">
                    <div className="text-[0.74rem] font-semibold text-ink mb-1.5">Grants</div>
                    <p className="text-[0.74rem] text-ink-soft leading-snug">
                      {`${pesoShort(sum(grants.filter((x) => x.stage === "Awarded").map((x) => x.amount)))} awarded this year. ${pesoShort(sum(grants.filter((x) => ["Researching", "Drafting", "Submitted"].includes(x.stage)).map((x) => x.amount)))} in open asks across ${grants.filter((x) => ["Researching", "Drafting", "Submitted"].includes(x.stage)).length} funders.`}
                    </p>
                  </div>
                )}
                {withNames && (
                  <div className="mt-4">
                    <div className="text-[0.74rem] font-semibold text-ink mb-1.5">Top donors, 2026</div>
                    <ul className="flex flex-col gap-1 text-[0.74rem]">
                      {[...donors].sort((a, b) => ytd(b) - ytd(a)).slice(0, 5).map((d) => (
                        <li key={d.id} className="flex justify-between gap-2"><span className="text-ink-soft">{d.name}</span><span className="font-mono text-ink">{peso(ytd(d))}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-rule">
                  <div className="text-[0.74rem] font-semibold text-ink mb-1.5">Asks of the board</div>
                  <ul className="flex flex-col gap-1 text-[0.74rem] text-ink-soft">
                    <li>{`Introduce two corporate partners for Busog Pasko (${pesoShort((campaigns.find((c) => c.id === "c1")?.goal ?? 0) - (campaigns.find((c) => c.id === "c1")?.raised ?? 0))} to goal).`}</li>
                    <li>Host a table at Gabi ng Pasasalamat on Nov 21.</li>
                    <li>Approve the 2027 scholar cohort of 40.</li>
                  </ul>
                </div>
              </motion.article>
            )}
          </div>
        </>
      )}

      {/* ---------------- Grants ---------------- */}
      {app.screen === "grants" && (
        <>
          <ScreenHeader title="Grants" subtitle="Pipeline, deadlines and reporting" action={<PrimaryButton onClick={() => setModal("grant")}><Plus size={14} /> Add grant</PrimaryButton>} />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            {STAGES.map((s) => {
              const list = grants.filter((x) => x.stage === s);
              const on = grantStage === s;
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => setGrantStage(on ? "all" : s)} className={cn("text-left rounded-lg border p-2.5 transition-colors cursor-pointer", on ? "border-gold bg-gold-wash" : "border-rule bg-sheet hover:border-mist")}>
                  <div className={cn("text-[0.7rem] font-medium", on ? "text-gold" : "text-mist")}>{s}</div>
                  <div className="text-[1.05rem] font-semibold text-ink tabular-nums">{pesoShort(sum(list.map((x) => x.amount)))}</div>
                  <div className="text-[0.66rem] text-mist">{`${list.length} ${list.length === 1 ? "grant" : "grants"}`}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2 mb-2 text-[0.74rem] text-mist">
            <span>{grantStage === "all" ? "All stages" : `${grantStage} only`}</span>
            {grantStage !== "all" && <button type="button" onClick={() => setGrantStage("all")} className="text-gold font-medium cursor-pointer">Show all</button>}
          </div>
          <Table
            rows={grants.filter((x) => grantStage === "all" || x.stage === grantStage)}
            rowKey={(x) => x.id}
            onRowClick={(x) => app.open("grant", x.id, x.funder)}
            columns={[
              { key: "funder", label: "Funder", render: (x) => <span className="min-w-0"><span className="block text-ink truncate">{x.funder}</span><span className="block text-[0.66rem] text-mist truncate">{x.title}</span></span> },
              { key: "fund", label: "Program", render: (x) => x.fund, hideOnMobile: true },
              { key: "amt", label: "Amount", align: "right", render: (x) => <span className="font-mono text-ink">{pesoShort(x.amount)}</span> },
              {
                key: "dl",
                label: "Deadline",
                render: (x) => {
                  const live = x.stage === "Researching" || x.stage === "Drafting";
                  return <span className={cn(live && daysFrom(x.deadline) <= 14 ? "text-warn font-medium" : "")}>{live ? `${fmtDate(x.deadline)} · ${relDays(x.deadline).toLowerCase()}` : fmtDate(x.deadline)}</span>;
                },
                hideOnMobile: true,
              },
              {
                key: "rep",
                label: "Report due",
                render: (x) => {
                  const next = x.reports.find((r) => !r.done);
                  return next ? <span className={daysFrom(next.due) <= 7 ? "text-danger font-medium" : ""}>{fmtDate(next.due)}</span> : "—";
                },
                hideOnMobile: true,
              },
              { key: "stage", label: "Stage", render: (x) => <Status tone={STAGE_TONE[x.stage]}>{x.stage}</Status> },
            ]}
          />
        </>
      )}

      {/* ---------------- Grant detail ---------------- */}
      {app.screen === "grant" && gr && (
        <>
          <ScreenHeader
            title={gr.funder}
            subtitle={`${gr.title} · ${peso(gr.amount)}`}
            action={
              <>
                <Status tone={STAGE_TONE[gr.stage]}>{gr.stage}</Status>
                {gr.stage === "Researching" && <PrimaryButton onClick={() => moveGrant(gr, "Drafting")}>Start draft</PrimaryButton>}
                {gr.stage === "Drafting" && <PrimaryButton disabled={gr.checklist.some((c) => !c.done)} onClick={() => moveGrant(gr, "Submitted")}><Send size={14} /> Mark submitted</PrimaryButton>}
                {gr.stage === "Submitted" && (
                  <>
                    <SmallButton onClick={() => moveGrant(gr, "Declined")}>Mark declined</SmallButton>
                    <PrimaryButton onClick={() => moveGrant(gr, "Awarded")}>Mark awarded</PrimaryButton>
                  </>
                )}
              </>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Details">
              <KeyValues items={[["Program", `${gr.fund}`], ["Amount", peso(gr.amount)], ["Application due", fmtDate(gr.deadline)], ["Decision", gr.decision ? fmtDate(gr.decision) : "—"], ["Owner", gr.owner], ["Funder contact", gr.contact]]} />
            </Panel>
            <Panel title="Application checklist" action={<span className="text-[0.7rem] text-mist">{`${gr.checklist.filter((c) => c.done).length} of ${gr.checklist.length}`}</span>}>
              <Meter value={gr.checklist.filter((c) => c.done).length} max={gr.checklist.length} className="mb-3" />
              <ul className="flex flex-col gap-2">
                {gr.checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-[0.8rem]">
                    <Tick on={c.done} label={c.label} onToggle={() => setGrants((l) => l.map((x) => (x.id === gr.id ? { ...x, checklist: x.checklist.map((y) => (y.label === c.label ? { ...y, done: !y.done } : y)) } : x)))} />
                    <span className={c.done ? "text-mist line-through" : "text-ink"}>{c.label}</span>
                  </li>
                ))}
              </ul>
              {gr.stage === "Drafting" && gr.checklist.some((c) => !c.done) && <p className="mt-3 text-[0.7rem] text-mist">Finish the checklist to mark it submitted.</p>}
            </Panel>
            <Panel title="Reporting">
              <ul className={listClass}>
                {gr.reports.map((r) => (
                  <li key={r.label} className="flex items-center gap-2.5 py-2 text-[0.8rem]">
                    <CalendarClock size={14} className="text-mist shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-ink">{r.label}</span>
                      <span className={cn("block text-[0.68rem]", !r.done && daysFrom(r.due) <= 7 ? "text-danger" : "text-mist")}>{`Due ${fmtDate(r.due)} · ${relDays(r.due).toLowerCase()}`}</span>
                    </span>
                    {r.done ? (
                      <Status tone="good">Sent</Status>
                    ) : (
                      <SmallButton onClick={() => { setGrants((l) => l.map((x) => (x.id === gr.id ? { ...x, reports: x.reports.map((y) => (y.label === r.label ? { ...y, done: true } : y)) } : x))); app.notify(`${r.label} sent to ${gr.funder}`); }}>
                        <Send size={11} /> Submit report
                      </SmallButton>
                    )}
                  </li>
                ))}
                {gr.reports.length === 0 && <li className="py-2 text-[0.78rem] text-graphite">{gr.stage === "Declined" ? "No reporting. Ask for feedback before reapplying." : "Reports are scheduled once the grant is awarded."}</li>}
              </ul>
            </Panel>
            {(() => {
              const p = programs.find((x) => x.fund === gr.fund);
              if (!p) return null;
              return (
                <Panel title="Linked outcomes" action={<SmallButton onClick={() => app.open("program", p.id, p.name)}>Open program</SmallButton>}>
                  <div className="text-[1.3rem] font-semibold text-ink tabular-nums">{programTotal(p).toLocaleString()}</div>
                  <div className="text-[0.74rem] text-mist">{`${p.metric.toLowerCase()} in 2026 · ${p.costNote}`}</div>
                  <p className="mt-2 text-[0.76rem] text-ink-soft leading-snug">{`This grant would fund about ${Math.floor(gr.amount / p.costPer).toLocaleString()} ${p.cumulative ? `${p.unit === "family" ? "families" : `${p.unit}s`}` : "scholar-years"}. Monthly figures feed the report automatically.`}</p>
                </Panel>
              );
            })()}
          </div>
        </>
      )}

      {/* ---------------- Communication ---------------- */}
      {app.screen === "comms" && (
        <>
          <ScreenHeader title="Communication" subtitle="Thank-you and update emails, personalized for each donor" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <Panel title="New email">
              <div className="flex flex-col gap-3">
                <Group label="Template">
                  <Segmented id="cm-tpl" value={comm.template} onChange={(id) => loadTemplate(id)} options={[{ id: "thanks", label: "Thank-you" }, { id: "update", label: "Update" }, { id: "winback", label: "Win-back" }, { id: "yearend", label: "Year-end" }]} />
                </Group>
                <Field label="To">
                  <select value={comm.audience} onChange={(e) => setComm({ ...comm, audience: e.target.value as Audience })} className={inputClass}>
                    {AUDIENCES.map((a) => <option key={a} value={a}>{`${a} donors · ${AUDIENCE_SIZE[a].toLocaleString()}`}</option>)}
                  </select>
                </Field>
                <Field label="Subject">
                  <input value={comm.subject} onChange={(e) => setComm({ ...comm, subject: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Message">
                  <textarea value={comm.body} onChange={(e) => setComm({ ...comm, body: e.target.value })} rows={8} className={textareaClass} />
                </Field>
                <p className="text-[0.68rem] text-mist">{"Merge fields: {first_name}  {last_gift}  {fund}"}</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <SmallButton onClick={() => sendEmail(true)}><CalendarClock size={12} /> Schedule Fri 9 AM</SmallButton>
                  <PrimaryButton onClick={() => sendEmail(false)} disabled={!comm.subject.trim()}><Send size={14} /> {`Send to ${AUDIENCE_SIZE[comm.audience].toLocaleString()} donors`}</PrimaryButton>
                </div>
              </div>
            </Panel>
            <Panel title="Preview" action={<span className="text-[0.7rem] text-mist">{`As ${commSample.name}`}</span>}>
              <div className="text-[0.7rem] text-mist">{`To ${commSample.email}`}</div>
              <div className="mt-1 text-[0.9rem] font-semibold text-ink">{mergeFields(comm.subject, commSample, gifts)}</div>
              <div className="mt-3 text-[0.78rem] text-ink-soft leading-relaxed whitespace-pre-line">{mergeFields(comm.body, commSample, gifts)}</div>
              <div className="mt-4 pt-3 border-t border-rule text-[0.66rem] text-mist">Bukas Palad Foundation · Tondo, Manila · Update preferences or unsubscribe</div>
            </Panel>
          </div>
          <Table
            rows={emails}
            rowKey={(x) => x.id}
            onRowClick={(x) => app.open("email", x.id, x.subject)}
            columns={[
              { key: "subj", label: "Email", render: (x) => <span className="min-w-0"><span className="block text-ink truncate">{x.subject}</span><span className="block text-[0.66rem] text-mist">{`${TEMPLATES[x.template].label} · ${x.audience} donors`}</span></span> },
              { key: "date", label: "Date", render: (x) => (x.status === "Scheduled" ? <Status tone="warn">{`Scheduled ${fmtDate(x.date)}`}</Status> : fmtDate(x.date)), hideOnMobile: true },
              { key: "rec", label: "Sent to", align: "right", render: (x) => x.recipients.toLocaleString(), hideOnMobile: true },
              { key: "open", label: "Opened", align: "right", render: (x) => (x.opened ? `${Math.round(x.opened * 100)}%` : "—") },
              { key: "raised", label: "Gifts", align: "right", render: (x) => <span className="font-mono text-ink">{x.raised ? pesoShort(x.raised) : "—"}</span> },
            ]}
          />
        </>
      )}

      {/* ---------------- Email detail ---------------- */}
      {app.screen === "email" && em && (
        <>
          <ScreenHeader
            title={em.subject}
            subtitle={`${TEMPLATES[em.template].label} · ${em.audience} donors · ${em.status === "Sent" ? `sent ${fmtDate(em.date)}` : `scheduled ${fmtDate(em.date)}, 9:00 AM`}`}
            action={
              em.status === "Scheduled" ? (
                <>
                  <SmallButton onClick={() => { setEmails((l) => l.filter((x) => x.id !== em.id)); app.back(); app.notify("Scheduled email canceled"); }}>Cancel send</SmallButton>
                  <PrimaryButton onClick={() => { setEmails((l) => l.map((x) => (x.id === em.id ? { ...x, status: "Sent", date: TODAY } : x))); app.notify(`Sent to ${em.recipients.toLocaleString()} donors`); }}><Send size={14} /> Send now</PrimaryButton>
                </>
              ) : (
                <>
                  <SmallButton onClick={() => { loadTemplate(em.template, em.audience); setComm((c) => ({ ...c, subject: em.subject, body: em.body })); app.section("comms"); app.notify("Loaded into a new email"); }}>Use as template</SmallButton>
                  <SmallButton
                    disabled={resent.includes(em.id) || !em.opened}
                    onClick={() => {
                      const n = Math.round(em.recipients * (1 - em.opened));
                      setResent((l) => [...l, em.id]);
                      setEmails((l) => [{ ...em, id: nextId("e"), subject: `${em.subject} (resend)`, date: TODAY, recipients: n, opened: 0, clicked: 0, raised: 0 }, ...l]);
                      app.notify(`Resent to ${n.toLocaleString()} donors who didn't open`);
                    }}
                  >
                    <Send size={11} /> Resend to non-openers
                  </SmallButton>
                </>
              )
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Recipients" value={em.recipients.toLocaleString()} />
            <Stat label="Opened" value={em.opened ? `${Math.round(em.opened * 100)}%` : "—"} sub={em.opened ? `${Math.round(em.recipients * em.opened).toLocaleString()} donors` : "No data yet"} tone={em.opened >= 0.5 ? "good" : undefined} />
            <Stat label="Clicked" value={em.clicked ? `${Math.round(em.clicked * 100)}%` : "—"} />
            <Stat label="Gifts from this email" value={em.raised ? peso(em.raised) : "—"} />
          </div>
          <Panel title="Message">
            <div className="text-[0.78rem] text-ink-soft leading-relaxed whitespace-pre-line">{em.body}</div>
          </Panel>
        </>
      )}

      {/* ---------------- Slide-overs ---------------- */}
      <ProtoModal
        open={modal === "gift"}
        title="Record gift"
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={recordGift} disabled={!Number(giftDraft.amount)}>{giftDraft.sendNow ? "Record and send receipt" : "Record gift"}</PrimaryButton>}
      >
        <Field label="Donor">
          <select value={giftDraft.donorId} onChange={(e) => setGiftDraft({ ...giftDraft, donorId: e.target.value })} className={inputClass}>
            {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₱)">
            <input inputMode="numeric" value={giftDraft.amount} onChange={(e) => setGiftDraft({ ...giftDraft, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} />
          </Field>
          <Field label="Method">
            <select value={giftDraft.method} onChange={(e) => setGiftDraft({ ...giftDraft, method: e.target.value as Method })} className={inputClass}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fund">
            <select value={giftDraft.fund} onChange={(e) => setGiftDraft({ ...giftDraft, fund: e.target.value as Fund })} className={inputClass}>
              {FUNDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select value={giftDraft.kind} onChange={(e) => setGiftDraft({ ...giftDraft, kind: e.target.value as GiftKind })} className={inputClass}>
              <option>One-time</option>
              <option>Recurring</option>
              <option>Pledge payment</option>
            </select>
          </Field>
        </div>
        <Field label="Campaign">
          <select value={giftDraft.campaignId} onChange={(e) => setGiftDraft({ ...giftDraft, campaignId: e.target.value })} className={inputClass}>
            <option value="">None</option>
            {campaigns.filter((c) => c.status === "Live").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Soft credit to">
          <select value={giftDraft.softCredit} onChange={(e) => setGiftDraft({ ...giftDraft, softCredit: e.target.value })} className={inputClass}>
            <option value="">No one</option>
            {donors.filter((d) => d.id !== giftDraft.donorId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        {giftDraft.kind === "Recurring" && <p className="text-[0.72rem] text-mist">Creates a monthly schedule on the 29th using the same method.</p>}
        <div className="flex items-center justify-between gap-3 text-[0.8rem] text-ink-soft">
          Email receipt and thank-you now
          <Toggle on={giftDraft.sendNow} onChange={(on) => setGiftDraft({ ...giftDraft, sendNow: on })} label="Email receipt and thank-you now" />
        </div>
      </ProtoModal>

      <ProtoModal
        open={modal === "batch"}
        title="Batch entry"
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={postBatch}>{`Post ${batch.rows.filter((r) => Number(r.amount) > 0).length} gifts · ${peso(sum(batch.rows.map((r) => Number(r.amount) || 0)))}`}</PrimaryButton>}
      >
        <Field label="Batch name">
          <input value={batch.name} onChange={(e) => setBatch({ ...batch, name: e.target.value })} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Method">
            <select value={batch.method} onChange={(e) => setBatch({ ...batch, method: e.target.value as Method })} className={inputClass}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Fund">
            <select value={batch.fund} onChange={(e) => setBatch({ ...batch, fund: e.target.value as Fund })} className={inputClass}>
              {FUNDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </div>
        <Group label="Gifts">
          <div className="flex flex-col gap-2">
            {batch.rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
                <select aria-label={`Donor ${i + 1}`} value={r.donorId} onChange={(e) => setBatch({ ...batch, rows: batch.rows.map((x, j) => (j === i ? { ...x, donorId: e.target.value } : x)) })} className={inputClass}>
                  {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input aria-label={`Amount ${i + 1}`} inputMode="numeric" value={r.amount} placeholder="₱" onChange={(e) => setBatch({ ...batch, rows: batch.rows.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/\D/g, "") } : x)) })} className={inputClass} />
              </div>
            ))}
          </div>
          <div><SmallButton onClick={() => setBatch({ ...batch, rows: [...batch.rows, { donorId: donors[0].id, amount: "" }] })}><Plus size={12} /> Add row</SmallButton></div>
        </Group>
        <div className="flex items-center justify-between gap-3 text-[0.8rem] text-ink-soft">
          Email receipts when posted
          <Toggle on={batch.receipts} onChange={(on) => setBatch({ ...batch, receipts: on })} label="Email receipts when posted" />
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "donor"} title="Add donor" onClose={() => setModal(null)} footer={<PrimaryButton onClick={addDonor} disabled={!donorDraft.name.trim()}>Add donor</PrimaryButton>}>
        <Field label="Name">
          <input value={donorDraft.name} onChange={(e) => setDonorDraft({ ...donorDraft, name: e.target.value })} placeholder="Maria Santos" className={inputClass} />
        </Field>
        <Field label="Type">
          <select value={donorDraft.kind} onChange={(e) => setDonorDraft({ ...donorDraft, kind: e.target.value as Donor["kind"] })} className={inputClass}>
            <option>Individual</option>
            <option>Church</option>
            <option>Company</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><input value={donorDraft.email} onChange={(e) => setDonorDraft({ ...donorDraft, email: e.target.value })} placeholder="maria@gmail.com" className={inputClass} /></Field>
          <Field label="Mobile"><input value={donorDraft.phone} onChange={(e) => setDonorDraft({ ...donorDraft, phone: e.target.value })} placeholder="0917 000 0000" className={inputClass} /></Field>
        </div>
        <Field label="City"><input value={donorDraft.city} onChange={(e) => setDonorDraft({ ...donorDraft, city: e.target.value })} placeholder="Quezon City" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First gift (₱, optional)"><input inputMode="numeric" value={donorDraft.amount} onChange={(e) => setDonorDraft({ ...donorDraft, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} /></Field>
          <Field label="Fund">
            <select value={donorDraft.fund} onChange={(e) => setDonorDraft({ ...donorDraft, fund: e.target.value as Fund })} className={inputClass}>
              {FUNDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "touch"} title={dn ? `Log interaction · ${dn.name}` : "Log interaction"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={() => {
        if (!dn || !touchDraft.note.trim()) return;
        logTouch(dn.id, touchDraft.kind, touchDraft.note.trim());
        if (touchDraft.kind === "Visit" || touchDraft.kind === "Meeting") setDonors((l) => l.map((x) => (x.id === dn.id ? { ...x, engagement: Math.min(5, x.engagement + 1) } : x)));
        if (touchDraft.followUp.trim()) setTasks((l) => [...l, { id: nextId("t"), donorId: dn.id, text: touchDraft.followUp.trim(), due: "2026-11-05", done: false }]);
        setModal(null);
        setTouchDraft(BLANK_TOUCH);
        setProfileTab("timeline");
        app.notify(`${touchDraft.kind} logged for ${dn.name}`);
      }} disabled={!touchDraft.note.trim()}>Save to timeline</PrimaryButton>}>
        <Group label="Type">
          <div className="flex flex-wrap gap-1.5">
            {TOUCHES.map((t) => {
              const Icon = TOUCH_ICON[t];
              return (
                <button key={t} type="button" aria-pressed={touchDraft.kind === t} onClick={() => setTouchDraft({ ...touchDraft, kind: t })} className={cn("inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border text-[0.76rem] cursor-pointer transition-colors", touchDraft.kind === t ? "border-gold bg-gold-wash text-gold font-medium" : "border-rule bg-sheet text-ink-soft hover:border-mist")}>
                  <Icon size={13} /> {t}
                </button>
              );
            })}
          </div>
        </Group>
        <Field label="What happened">
          <textarea value={touchDraft.note} onChange={(e) => setTouchDraft({ ...touchDraft, note: e.target.value })} placeholder="Called to thank her. She asked about visiting the Payatas kitchen." className={textareaClass} />
        </Field>
        <Field label="Follow-up task (optional)">
          <input value={touchDraft.followUp} onChange={(e) => setTouchDraft({ ...touchDraft, followUp: e.target.value })} placeholder="Schedule a site visit" className={inputClass} />
        </Field>
        <p className="text-[0.72rem] text-mist">Visits and meetings raise the engagement level.</p>
      </ProtoModal>

      <ProtoModal open={modal === "campaign"} title="New campaign" onClose={() => setModal(null)} footer={<PrimaryButton disabled={!campaignDraft.name.trim() || !Number(campaignDraft.goal)} onClick={() => {
        const name = campaignDraft.name.trim();
        const c: Campaign = { id: nextId("c"), name, kind: campaignDraft.kind, fund: campaignDraft.fund, goal: Number(campaignDraft.goal), raised: 0, donors: 0, starts: TODAY, ends: campaignDraft.ends, status: "Live", slug: slugify(name), blurb: campaignDraft.blurb.trim() || `Help us reach our goal for ${FUND_PHRASE[campaignDraft.fund]}.`, fundraisers: [], tiers: campaignDraft.kind === "Event" ? [{ id: nextId("tr"), name: "Regular seat", price: 1500, sold: 0, capacity: 100, seats: 1 }] : [], venue: campaignDraft.kind === "Event" ? "To be announced" : undefined };
        setCampaigns((l) => [c, ...l]);
        setModal(null);
        setCampaignDraft(BLANK_CAMPAIGN);
        app.open("campaign", c.id, c.name);
        app.notify(`Page published at give.bukaspalad.org/${c.slug}`);
      }}>Publish campaign page</PrimaryButton>}>
        <Field label="Name"><input value={campaignDraft.name} onChange={(e) => setCampaignDraft({ ...campaignDraft, name: e.target.value })} placeholder="Noche Buena para sa Lahat" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={campaignDraft.kind} onChange={(e) => setCampaignDraft({ ...campaignDraft, kind: e.target.value as CampaignKind })} className={inputClass}>
              <option>Appeal</option>
              <option>Peer-to-peer</option>
              <option>Event</option>
            </select>
          </Field>
          <Field label="Fund">
            <select value={campaignDraft.fund} onChange={(e) => setCampaignDraft({ ...campaignDraft, fund: e.target.value as Fund })} className={inputClass}>
              {FUNDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Goal (₱)"><input inputMode="numeric" value={campaignDraft.goal} onChange={(e) => setCampaignDraft({ ...campaignDraft, goal: e.target.value.replace(/\D/g, "") })} className={inputClass} /></Field>
          <Field label={campaignDraft.kind === "Event" ? "Event date" : "Ends"}><input type="date" value={campaignDraft.ends} onChange={(e) => setCampaignDraft({ ...campaignDraft, ends: e.target.value })} className={inputClass} /></Field>
        </div>
        <Field label="Page text"><textarea value={campaignDraft.blurb} onChange={(e) => setCampaignDraft({ ...campaignDraft, blurb: e.target.value })} placeholder="What the money does, in one or two lines." className={textareaClass} /></Field>
      </ProtoModal>

      <ProtoModal open={modal === "fundraiser"} title="Invite fundraiser" onClose={() => setModal(null)} footer={<PrimaryButton disabled={!fundraiserDraft.name.trim()} onClick={() => {
        if (!cp) return;
        const name = fundraiserDraft.name.trim();
        setCampaigns((l) => l.map((c) => (c.id === cp.id ? { ...c, fundraisers: [...c.fundraisers, { id: nextId("f"), name, team: fundraiserDraft.team.trim() || "Solo", goal: Number(fundraiserDraft.goal) || 10000, raised: 0, donors: 0 }] } : c)));
        setModal(null);
        setFundraiserDraft({ name: "", email: "", team: "", goal: "10000" });
        app.notify(`Invite sent to ${name}. Their page is ready to share.`);
      }}>Send invite</PrimaryButton>}>
        <Field label="Name"><input value={fundraiserDraft.name} onChange={(e) => setFundraiserDraft({ ...fundraiserDraft, name: e.target.value })} className={inputClass} /></Field>
        <Field label="Email"><input value={fundraiserDraft.email} onChange={(e) => setFundraiserDraft({ ...fundraiserDraft, email: e.target.value })} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Team"><input value={fundraiserDraft.team} onChange={(e) => setFundraiserDraft({ ...fundraiserDraft, team: e.target.value })} placeholder="Solo" className={inputClass} /></Field>
          <Field label="Personal goal (₱)"><input inputMode="numeric" value={fundraiserDraft.goal} onChange={(e) => setFundraiserDraft({ ...fundraiserDraft, goal: e.target.value.replace(/\D/g, "") })} className={inputClass} /></Field>
        </div>
        <p className="text-[0.72rem] text-mist">They get a personal page, a share kit and weekly progress emails. Gifts to their page soft-credit them.</p>
      </ProtoModal>

      <ProtoModal open={modal === "figures"} title="Log figures" onClose={() => setModal(null)} footer={<PrimaryButton disabled={!Number(figures.value)} onClick={() => {
        const n = Number(figures.value);
        const p = figProgram;
        if (!n) return;
        setPrograms((l) => l.map((x) => (x.id !== p.id ? x : { ...x, monthly: x.monthly.map((v, i) => (i === figures.month ? (x.cumulative ? v + n : n) : v)), sites: x.cumulative ? x.sites.map((s, i) => (i === figures.site ? { ...s, value: s.value + n } : s)) : x.sites })));
        setModal(null);
        app.notify(`${n.toLocaleString()} ${p.metric.toLowerCase()} logged for ${MONTHS[figures.month]}`);
      }}>Save figures</PrimaryButton>}>
        <Field label="Program">
          <select value={figures.programId} onChange={(e) => setFigures({ ...figures, programId: e.target.value, site: 0 })} className={inputClass}>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Month">
            <select value={figures.month} onChange={(e) => setFigures({ ...figures, month: Number(e.target.value) })} className={inputClass}>
              {MONTHS.slice(0, 10).map((m, i) => <option key={m} value={i}>{`${m} 2026`}</option>)}
            </select>
          </Field>
          <Field label="Site">
            <select value={figures.site} onChange={(e) => setFigures({ ...figures, site: Number(e.target.value) })} className={inputClass}>
              {figProgram.sites.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label={figProgram.cumulative ? `${figProgram.metric} to add` : `${figProgram.metric} this month`}>
          <input inputMode="numeric" value={figures.value} onChange={(e) => setFigures({ ...figures, value: e.target.value.replace(/\D/g, "") })} placeholder={figProgram.cumulative ? "1200" : "186"} className={inputClass} />
        </Field>
        <p className="text-[0.72rem] text-mist">{`Current ${MONTHS[figures.month]} figure: ${figProgram.monthly[figures.month].toLocaleString()}. Donor reports and the board report update right away.`}</p>
      </ProtoModal>

      <ProtoModal open={modal === "grant"} title="Add grant" onClose={() => setModal(null)} footer={<PrimaryButton disabled={!grantDraft.funder.trim() || !Number(grantDraft.amount)} onClick={() => {
        const x: Grant = { id: nextId("gr"), funder: grantDraft.funder.trim(), title: grantDraft.title.trim() || `${grantDraft.fund} support`, fund: grantDraft.fund, amount: Number(grantDraft.amount), stage: "Researching", deadline: grantDraft.deadline, owner: USER, contact: "—", checklist: cl("00000"), reports: [] };
        setGrants((l) => [x, ...l]);
        setModal(null);
        setGrantDraft(BLANK_GRANT);
        setGrantStage("all");
        app.notify(`${x.funder} added to the pipeline`);
      }}>Add to pipeline</PrimaryButton>}>
        <Field label="Funder"><input value={grantDraft.funder} onChange={(e) => setGrantDraft({ ...grantDraft, funder: e.target.value })} placeholder="Foundation or company" className={inputClass} /></Field>
        <Field label="Project"><input value={grantDraft.title} onChange={(e) => setGrantDraft({ ...grantDraft, title: e.target.value })} placeholder="What the grant pays for" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Program">
            <select value={grantDraft.fund} onChange={(e) => setGrantDraft({ ...grantDraft, fund: e.target.value as Fund })} className={inputClass}>
              {FUNDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Amount (₱)"><input inputMode="numeric" value={grantDraft.amount} onChange={(e) => setGrantDraft({ ...grantDraft, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} /></Field>
        </div>
        <Field label="Application deadline"><input type="date" value={grantDraft.deadline} onChange={(e) => setGrantDraft({ ...grantDraft, deadline: e.target.value })} className={inputClass} /></Field>
      </ProtoModal>
    </ProtoApp>
  );
}
