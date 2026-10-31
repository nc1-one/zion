"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Lock,
  MapPin,
  Minus,
  Navigation,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  Receipt,
  Route,
  Search,
  Send,
  ShoppingCart,
  Signature,
  Store,
  Truck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { ProtoHeading, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp, type Column, type ProtoAlert, type ProtoSearchItem } from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Formatting ------------------------------------------------------------------

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;
const millions = (n: number) => `₱${(n / 1_000_000).toFixed(2)}M`;
const signed = (n: number) => (n > 0 ? `+${n.toLocaleString()}` : n < 0 ? `−${Math.abs(n).toLocaleString()}` : "0");
// Dates are stored as days from today, Thursday, October 29, 2026.
const day = (n: number) => new Date(2026, 9, 29 + n).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const vat = (n: number) => Math.round(n * 0.12);
const pad = (prefix: string, n: number, width = 4) => `${prefix}${String(n).padStart(width, "0")}`;
// Highest number already used after a prefix, so new documents continue the sequence.
const lastNo = (ids: (string | undefined)[], prefix: string, floor = 0) =>
  Math.max(floor, ...ids.filter((x): x is string => !!x && x.startsWith(prefix)).map((x) => Number(x.slice(prefix.length))));
const unitOne = (unit: string) => unit.replace(/e?s$/, "");
const roundQty = (n: number) => (n >= 50 ? Math.ceil(n / 10) * 10 : Math.ceil(n));
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
// Times on the dispatch board are minutes after midnight.
const clock = (m: number) => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;

// Ids for records created in the prototype. Only called from event handlers.
let seq = 100;
const nextId = (prefix: string) => `${prefix}${++seq}`;

// ---- Types -----------------------------------------------------------------------

type Branch = "Quezon City" | "Pasig";
const BRANCHES: Branch[] = ["Quezon City", "Pasig"];
const CODE: Record<Branch, string> = { "Quezon City": "QC", Pasig: "PSG" };
const LOC: Record<Branch, string> = { "Quezon City": "QC/Stock", Pasig: "PSG/Stock" };
const other = (b: Branch): Branch => (b === "Pasig" ? "Quezon City" : "Pasig");
const isStock = (loc: string) => loc.endsWith("/Stock");
const branchOf = (loc: string): Branch | undefined => (loc.startsWith("QC/") ? "Quezon City" : loc.startsWith("PSG/") ? "Pasig" : undefined);

type Category = "Cement" | "Steel" | "Tiles" | "Paint" | "Plumbing" | "Lumber" | "Electrical" | "Aggregates";
const CATEGORIES: Category[] = ["Cement", "Steel", "Tiles", "Paint", "Plumbing", "Lumber", "Electrical", "Aggregates"];
type Method = "Bank transfer" | "Check" | "GCash" | "Maya" | "Card" | "Cash";
type Account = "BDO current" | "BPI savings" | "GCash and Maya" | "Cash drawers";
const ACCOUNT_FOR: Record<Method, Account> = { "Bank transfer": "BDO current", Check: "BPI savings", Card: "BPI savings", GCash: "GCash and Maya", Maya: "GCash and Maya", Cash: "Cash drawers" };
const ACCOUNTS: [Account, string][] = [
  ["BDO current", "Bank feed, synced 8:00 AM"],
  ["BPI savings", "Checks and card settlements"],
  ["GCash and Maya", "E-wallet collections"],
  ["Cash drawers", "Both counters, counted at close"],
];

interface Item { id: string; sku: string; name: string; unit: string; category: Category; cost: number; price: number; supplierId: string; lead: number; stock: Record<Branch, number>; bin: Record<Branch, string>; rule: Record<Branch, { min: number; max: number }> }
interface Contact { id: string; name: string; kind: "Customer" | "Supplier"; person: string; phone: string; city: string; terms: number; tin: string; credit?: number }
interface Line { itemId: string; qty: number; price: number }
interface Trail { text: string; date: number }

const SALE_STAGES = [["draft", "Quotation"], ["sent", "Sent"], ["order", "Sales order"], ["delivered", "Delivered"], ["invoiced", "Invoiced"]] as const;
type SaleStage = (typeof SALE_STAGES)[number][0];
const sIdx = (s: SaleStage) => SALE_STAGES.findIndex(([id]) => id === s);
const SALE_BADGE: Record<SaleStage, [string, "good" | "warn" | "muted"]> = { draft: ["Quotation", "muted"], sent: ["Quotation sent", "muted"], order: ["To deliver", "warn"], delivered: ["To invoice", "warn"], invoiced: ["Invoiced", "good"] };
interface Sale { id: string; customerId: string; branch: Branch; date: number; stage: SaleStage; lines: Line[]; confirmed?: number; delivery?: string; invoiceId?: string; trail: Trail[] }

const PO_STAGES = [["rfq", "RFQ"], ["sent", "Sent"], ["order", "Purchase order"], ["received", "Received"], ["billed", "Billed"]] as const;
type PoStage = (typeof PO_STAGES)[number][0];
const pIdx = (s: PoStage) => PO_STAGES.findIndex(([id]) => id === s);
const PO_BADGE: Record<PoStage, [string, "good" | "warn" | "muted"]> = { rfq: ["RFQ", "muted"], sent: ["RFQ sent", "muted"], order: ["To receive", "warn"], received: ["To bill", "warn"], billed: ["Billed", "good"] };
interface Purchase { id: string; supplierId: string; branch: Branch; date: number; expected: number; stage: PoStage; lines: Line[]; receipt?: string; billId?: string; trail: Trail[] }

interface Invoice { id: string; customerId: string; saleId?: string; issued: number; due: number; lines: Line[]; paid: number; log: Trail[] }
interface Bill { id: string; supplierId: string; poId?: string; ref: string; issued: number; due: number; lines: Line[]; paid: number; log: Trail[] }
interface Payment { id: string; date: number; contactId: string; dir: "in" | "out"; method: Method; amount: number; docId: string; ref: string }
interface Move { id: string; date: number; ref: string; itemId: string; qty: number; from: string; to: string }
interface Transfer { id: string; from: Branch; to: Branch; date: number; lines: { itemId: string; qty: number }[]; status: "Ready" | "In transit" | "Done" }
interface Truck { id: string; name: string; model: string; plate: string; driver: string }
type StopStatus = "Loading" | "On the road" | "Delivered";
interface Run { saleId: string; truckId: string; status: StopStatus; eta: number; at?: string; signedBy?: string }
interface PosReceipt { id: string; time: string; branch: Branch; lines: Line[]; method: "Cash" | "GCash" | "Card" }

type SaleFilter = "all" | "quotes" | "orders" | "toinvoice" | "invoiced";
type PoFilter = "all" | "rfqs" | "orders" | "tobill" | "billed";
const SALE_FILTER: Record<SaleFilter, SaleStage[]> = { all: ["draft", "sent", "order", "delivered", "invoiced"], quotes: ["draft", "sent"], orders: ["order"], toinvoice: ["delivered"], invoiced: ["invoiced"] };
const PO_FILTER: Record<PoFilter, PoStage[]> = { all: ["rfq", "sent", "order", "received", "billed"], rfqs: ["rfq", "sent"], orders: ["order"], tobill: ["received"], billed: ["billed"] };
const BUCKETS: [string, number, number][] = [["Current", -9999, 0], ["1–30 days", 1, 30], ["31–60 days", 31, 60], ["61–90 days", 61, 90], ["90+ days", 91, 9999]];

// ---- Sample data -----------------------------------------------------------------

const mk = (id: string, sku: string, name: string, unit: string, category: Category, cost: number, price: number, supplierId: string, lead: number, [qc, pg]: [number, number], [binQc, binPg]: [string, string], [qcMin, qcMax, pgMin, pgMax]: [number, number, number, number]): Item => ({
  id, sku, name, unit, category, cost, price, supplierId, lead,
  stock: { "Quezon City": qc, Pasig: pg },
  bin: { "Quezon City": `QC/Stock/${binQc}`, Pasig: `PSG/Stock/${binPg}` },
  rule: { "Quezon City": { min: qcMin, max: qcMax }, Pasig: { min: pgMin, max: pgMax } },
});

const ITEMS: Item[] = [
  mk("i1", "CEM-040", "Portland cement 40kg", "bags", "Cement", 235, 265, "s1", 3, [180, 64], ["Yard A", "Yard"], [200, 500, 120, 300]),
  mk("i2", "RB-010", "Deformed bar 10mm × 6m", "pcs", "Steel", 168, 195, "s2", 5, [420, 260], ["Steel rack 1", "Steel rack"], [250, 600, 150, 400]),
  mk("i3", "RB-012", "Deformed bar 12mm × 6m", "pcs", "Steel", 245, 285, "s2", 5, [95, 40], ["Steel rack 2", "Steel rack"], [150, 400, 80, 200]),
  mk("i4", "TL-6060", "Ceramic floor tile 60×60", "boxes", "Tiles", 410, 520, "s3", 7, [340, 210], ["Aisle 3", "Aisle 1"], [120, 400, 100, 300]),
  mk("i5", "PT-W04", "Latex paint, white 4L", "cans", "Paint", 520, 680, "s4", 2, [26, 22], ["Aisle 5", "Aisle 2"], [40, 120, 30, 90]),
  mk("i6", "PV-075", "PVC pipe ¾ in × 3m", "pcs", "Plumbing", 85, 115, "s5", 4, [310, 190], ["Pipe rack", "Pipe rack"], [100, 400, 80, 250]),
  mk("i7", "PW-012", "Marine plywood ½ in", "sheets", "Lumber", 890, 1080, "s6", 6, [48, 31], ["Shed B", "Shed"], [60, 150, 40, 100]),
  mk("i8", "GI-026", "GI roofing sheet, gauge 26", "sheets", "Steel", 380, 465, "s2", 5, [140, 95], ["Shed A", "Shed"], [80, 250, 60, 150]),
  mk("i9", "HB-004", "Hollow block 4 in", "pcs", "Cement", 11, 15, "s7", 2, [2400, 1300], ["Yard B", "Yard"], [1500, 5000, 1000, 3000]),
  mk("i10", "AG-SND", "Washed sand", "cu.m", "Aggregates", 1250, 1550, "s7", 2, [18, 6], ["Bay 1", "Bay"], [10, 30, 8, 20]),
  mk("i11", "EL-THHN35", "THHN wire 3.5mm², 150m", "rolls", "Electrical", 3150, 3890, "s8", 4, [22, 15], ["Aisle 6", "Aisle 4"], [10, 30, 8, 20]),
  mk("i12", "TL-ADH25", "Tile adhesive 25kg", "bags", "Tiles", 310, 395, "s3", 7, [85, 12], ["Aisle 3", "Aisle 1"], [40, 120, 30, 80]),
  mk("i13", "PT-RL09", "Paint roller 9 in", "pcs", "Paint", 95, 145, "s4", 2, [64, 41], ["Aisle 5", "Aisle 2"], [30, 80, 20, 60]),
  mk("i14", "LB-CC23", "Coco lumber 2×3×10", "pcs", "Lumber", 98, 135, "s6", 6, [520, 300], ["Shed B", "Shed"], [300, 900, 200, 600]),
];

const CONTACTS: Contact[] = [
  { id: "c1", name: "Dela Cruz Builders", kind: "Customer", person: "Ramon Dela Cruz", phone: "0917 555 0142", city: "Fairview, Quezon City", terms: 30, tin: "214-883-091-000", credit: 300000 },
  { id: "c2", name: "Ramos Interiors", kind: "Customer", person: "Liza Ramos", phone: "0918 555 0193", city: "Kapitolyo, Pasig", terms: 30, tin: "308-112-457-000", credit: 150000 },
  { id: "c3", name: "Garcia Construction", kind: "Customer", person: "Rodel Garcia", phone: "0927 555 0110", city: "Batasan Hills, Quezon City", terms: 30, tin: "221-640-338-000", credit: 500000 },
  { id: "c4", name: "Villanueva Hardware", kind: "Customer", person: "Carmela Villanueva", phone: "0995 555 0177", city: "Rosario, Pasig", terms: 30, tin: "412-905-216-000", credit: 120000 },
  { id: "c5", name: "Santos & Sons Contractors", kind: "Customer", person: "Ernesto Santos", phone: "0906 555 0128", city: "Novaliches, Quezon City", terms: 30, tin: "176-334-802-000", credit: 250000 },
  { id: "c6", name: "Mendoza Kitchens", kind: "Customer", person: "Joy Mendoza", phone: "0917 555 0161", city: "Ugong, Pasig", terms: 30, tin: "390-221-647-000", credit: 80000 },
  { id: "c7", name: "Bayani Homes Marikina", kind: "Customer", person: "Arnel Bayani", phone: "0919 555 0105", city: "Concepcion, Marikina", terms: 30, tin: "255-718-904-000", credit: 400000 },
  { id: "c8", name: "Aquino Renovations", kind: "Customer", person: "Tess Aquino", phone: "0945 555 0136", city: "Cubao, Quezon City", terms: 15, tin: "433-016-275-000", credit: 100000 },
  { id: "c9", name: "Lim Hardware Cainta", kind: "Customer", person: "Vincent Lim", phone: "0928 555 0187", city: "Cainta, Rizal", terms: 30, tin: "198-552-730-000", credit: 150000 },
  { id: "c10", name: "Torres Property Development", kind: "Customer", person: "Bea Torres", phone: "0917 555 0119", city: "Ortigas Center, Pasig", terms: 45, tin: "009-871-443-000", credit: 1000000 },
  { id: "c11", name: "Grace Fellowship Church", kind: "Customer", person: "Ptr. Daniel Navarro", phone: "0918 555 0154", city: "Antipolo, Rizal", terms: 15, tin: "471-203-589-000", credit: 100000 },
  { id: "s1", name: "Rizal Cement Trading", kind: "Supplier", person: "Edgar Soriano", phone: "0917 555 0201", city: "Antipolo, Rizal", terms: 7, tin: "201-447-118-000" },
  { id: "s2", name: "Valenzuela Steel Corp.", kind: "Supplier", person: "Mylene Tan", phone: "0918 555 0233", city: "Valenzuela", terms: 30, tin: "117-905-362-000" },
  { id: "s3", name: "Laguna Tile Center", kind: "Supplier", person: "Rey Mercado", phone: "0927 555 0248", city: "Santa Rosa, Laguna", terms: 30, tin: "322-618-077-000" },
  { id: "s4", name: "Pasig Paint Supply", kind: "Supplier", person: "Nora Pineda", phone: "0995 555 0212", city: "Caniogan, Pasig", terms: 15, tin: "284-130-955-000" },
  { id: "s5", name: "Caloocan Pipe & Fittings", kind: "Supplier", person: "Boy Castillo", phone: "0906 555 0264", city: "Caloocan", terms: 30, tin: "156-772-410-000" },
  { id: "s6", name: "Bulacan Lumber Yard", kind: "Supplier", person: "Lito Manalo", phone: "0917 555 0279", city: "Malolos, Bulacan", terms: 30, tin: "367-049-821-000" },
  { id: "s7", name: "Batangas Aggregates Co.", kind: "Supplier", person: "Celia Umali", phone: "0919 555 0285", city: "Lipa, Batangas", terms: 7, tin: "402-588-136-000" },
  { id: "s8", name: "Meycauayan Wire & Cable", kind: "Supplier", person: "Jojo Bernardo", phone: "0928 555 0290", city: "Meycauayan, Bulacan", terms: 15, tin: "239-614-507-000" },
];

const find = (id: string) => ITEMS.find((i) => i.id === id)!;
const L = (itemId: string, qty: number): Line => ({ itemId, qty, price: find(itemId).price });
const C = (itemId: string, qty: number): Line => ({ itemId, qty, price: find(itemId).cost });
const tr = (...steps: [string, number][]): Trail[] => steps.map(([text, date]) => ({ text, date }));
const sold = (who: string, d: number, b: Branch, delivery: string, invoice: string) =>
  tr([`Quotation created by ${who}`, d], [`Confirmed, stock reserved at ${b}`, d], [`Delivered, ${delivery}`, d + 1], [`Invoiced, ${invoice}`, d + 1]);
const bought = (d: number, receipt: string, bill: string) =>
  tr(["RFQ created by Marites Bautista", d], ["Confirmed with the supplier", d], [`Received in full, ${receipt}`, d + 3], [`Billed, ${bill}`, d + 3]);

const SALES: Sale[] = [
  { id: "SO-2424", customerId: "c8", branch: "Quezon City", date: 0, stage: "draft", lines: [L("i4", 30), L("i12", 20)], trail: tr(["Quotation created by Jun Reyes", 0]) },
  { id: "SO-2423", customerId: "c10", branch: "Pasig", date: -1, stage: "sent", lines: [L("i2", 300), L("i3", 200), L("i1", 400)], trail: tr(["Quotation created by Aileen Cruz", -1], ["Sent to Bea Torres by email", -1]) },
  { id: "SO-2422", customerId: "c11", branch: "Quezon City", date: -2, stage: "sent", lines: [L("i9", 1500), L("i1", 150), L("i10", 8)], trail: tr(["Quotation created by Jun Reyes", -2], ["Sent to Ptr. Daniel Navarro by email", -2], ["Customer opened the quotation", -1]) },
  { id: "SO-2421", customerId: "c9", branch: "Pasig", date: -2, stage: "sent", lines: [L("i5", 12), L("i13", 24), L("i6", 40)], trail: tr(["Quotation created by Aileen Cruz", -2], ["Sent to Vincent Lim by email", -2], ["Customer opened the quotation", 0]) },
  { id: "SO-2420", customerId: "c7", branch: "Quezon City", date: -3, stage: "order", confirmed: -1, lines: [L("i7", 20), L("i14", 120)], trail: tr(["Quotation created by Jun Reyes", -3], ["Sent to Arnel Bayani by email", -3], ["Confirmed, stock reserved at Quezon City", -1], ["Assigned to Truck 1, Ador Pascual", -1], ["Out for delivery on Truck 1", 0]) },
  { id: "SO-2419", customerId: "c5", branch: "Quezon City", date: 0, stage: "order", confirmed: 0, lines: [L("i7", 30), L("i1", 50)], trail: tr(["Quotation created by Jun Reyes", -1], ["Confirmed by phone, stock reserved at Quezon City", 0]) },
  { id: "SO-2418", customerId: "c1", branch: "Quezon City", date: 0, stage: "order", confirmed: 0, lines: [L("i1", 120), L("i3", 60)], trail: tr(["Quotation created by Jun Reyes", -1], ["Sent to Ramon Dela Cruz by email", -1], ["Confirmed, stock reserved at Quezon City", 0], ["Assigned to Truck 2, Bong Agustin", 0]) },
  { id: "SO-2417", customerId: "c2", branch: "Pasig", date: 0, stage: "order", confirmed: 0, lines: [L("i4", 40), L("i5", 6)], trail: tr(["Quotation created by Aileen Cruz", 0], ["Confirmed, stock reserved at Pasig", 0], ["Assigned to Truck 2, Bong Agustin", 0]) },
  { id: "SO-2416", customerId: "c3", branch: "Quezon City", date: -2, stage: "delivered", confirmed: -2, delivery: "QC/OUT/0231", lines: [L("i2", 200), L("i8", 50), L("i1", 80)], trail: tr(["Quotation created by Jun Reyes", -3], ["Confirmed, stock reserved at Quezon City", -2], ["Out for delivery on Truck 1", 0], ["Delivered, QC/OUT/0231, signed by R. Garcia", 0]) },
  { id: "SO-2415", customerId: "c4", branch: "Pasig", date: -4, stage: "invoiced", confirmed: -4, delivery: "PSG/OUT/0118", invoiceId: "INV-3050", lines: [L("i6", 60), L("i5", 4)], trail: sold("Aileen Cruz", -4, "Pasig", "PSG/OUT/0118", "INV-3050") },
  { id: "SO-2414", customerId: "c5", branch: "Quezon City", date: -8, stage: "invoiced", confirmed: -8, delivery: "QC/OUT/0228", invoiceId: "INV-3047", lines: [L("i9", 2000), L("i14", 150)], trail: sold("Jun Reyes", -8, "Quezon City", "QC/OUT/0228", "INV-3047") },
  { id: "SO-2413", customerId: "c6", branch: "Pasig", date: -10, stage: "invoiced", confirmed: -10, delivery: "PSG/OUT/0116", invoiceId: "INV-3046", lines: [L("i4", 25)], trail: sold("Aileen Cruz", -10, "Pasig", "PSG/OUT/0116", "INV-3046") },
  { id: "SO-2412", customerId: "c1", branch: "Quezon City", date: -24, stage: "invoiced", confirmed: -24, delivery: "QC/OUT/0219", invoiceId: "INV-3041", lines: [L("i2", 150), L("i8", 40)], trail: sold("Jun Reyes", -24, "Quezon City", "QC/OUT/0219", "INV-3041") },
  { id: "SO-2411", customerId: "c3", branch: "Quezon City", date: -28, stage: "invoiced", confirmed: -28, delivery: "QC/OUT/0215", invoiceId: "INV-3039", lines: [L("i9", 3000), L("i1", 200)], trail: sold("Jun Reyes", -28, "Quezon City", "QC/OUT/0215", "INV-3039") },
];

const PURCHASES: Purchase[] = [
  { id: "PO-0874", supplierId: "s7", branch: "Pasig", date: 0, expected: 2, stage: "rfq", lines: [C("i10", 14)], trail: tr(["RFQ drafted from reordering rules", 0]) },
  { id: "PO-0873", supplierId: "s3", branch: "Pasig", date: -1, expected: 6, stage: "sent", lines: [C("i12", 60), C("i4", 100)], trail: tr(["RFQ created by Marites Bautista", -1], ["Sent to Laguna Tile Center by email", -1]) },
  { id: "PO-0872", supplierId: "s1", branch: "Quezon City", date: -2, expected: 2, stage: "order", lines: [C("i1", 300)], trail: tr(["RFQ created by Marites Bautista", -2], ["Sent to Rizal Cement Trading by email", -2], ["Confirmed, arriving Oct 31", -1]) },
  { id: "PO-0871", supplierId: "s6", branch: "Quezon City", date: -4, expected: 1, stage: "order", lines: [C("i7", 120)], trail: tr(["RFQ drafted from reordering rules", -4], ["Sent to Bulacan Lumber Yard by email", -4], ["Confirmed, arriving Oct 30", -3]) },
  { id: "PO-0870", supplierId: "s4", branch: "Pasig", date: -2, expected: 0, stage: "order", lines: [C("i5", 48), C("i13", 30)], trail: tr(["RFQ drafted from reordering rules", -3], ["Confirmed by phone, arriving Oct 29", -2]) },
  { id: "PO-0869", supplierId: "s5", branch: "Quezon City", date: -6, expected: -2, stage: "received", receipt: "QC/IN/0117", lines: [C("i6", 200)], trail: tr(["RFQ created by Marites Bautista", -6], ["Confirmed, arriving Oct 27", -6], ["Received in full, QC/IN/0117", -2]) },
  { id: "PO-0868", supplierId: "s2", branch: "Quezon City", date: -8, expected: -5, stage: "billed", receipt: "QC/IN/0115", billId: "BILL-0142", lines: [C("i2", 300), C("i8", 100)], trail: bought(-8, "QC/IN/0115", "BILL-0142") },
  { id: "PO-0867", supplierId: "s8", branch: "Quezon City", date: -15, expected: -12, stage: "billed", receipt: "QC/IN/0112", billId: "BILL-0139", lines: [C("i11", 20)], trail: bought(-15, "QC/IN/0112", "BILL-0139") },
  { id: "PO-0866", supplierId: "s1", branch: "Quezon City", date: -10, expected: -7, stage: "billed", receipt: "QC/IN/0114", billId: "BILL-0140", lines: [C("i1", 300)], trail: bought(-10, "QC/IN/0114", "BILL-0140") },
];

const INVOICES: Invoice[] = [
  { id: "INV-3050", customerId: "c4", saleId: "SO-2415", issued: -3, due: 27, lines: [L("i6", 60), L("i5", 4)], paid: 0, log: tr(["Posted from SO-2415 and emailed", -3]) },
  { id: "INV-3047", customerId: "c5", saleId: "SO-2414", issued: -7, due: 23, lines: [L("i9", 2000), L("i14", 150)], paid: 0, log: tr(["Posted from SO-2414 and emailed", -7]) },
  { id: "INV-3046", customerId: "c6", saleId: "SO-2413", issued: -9, due: 21, lines: [L("i4", 25)], paid: 0, log: tr(["Posted from SO-2413 and emailed", -9]) },
  { id: "INV-3043", customerId: "c11", issued: -17, due: -2, lines: [L("i1", 100), L("i9", 1000)], paid: 46480, log: tr(["Posted and emailed", -17], ["₱46,480 received by GCash, ref 7781 2290", -1]) },
  { id: "INV-3041", customerId: "c1", saleId: "SO-2412", issued: -23, due: 7, lines: [L("i2", 150), L("i8", 40)], paid: 0, log: tr(["Posted from SO-2412 and emailed", -23], ["Auto reminder, 7 days before due", 0]) },
  { id: "INV-3039", customerId: "c3", saleId: "SO-2411", issued: -27, due: 3, lines: [L("i9", 3000), L("i1", 200)], paid: 50000, log: tr(["Posted from SO-2411 and emailed", -27], ["₱50,000 received by check, ref BPI 001842", -3]) },
  { id: "INV-3036", customerId: "c7", issued: -49, due: -19, lines: [L("i14", 200), L("i7", 20)], paid: 54432, log: tr(["Posted and emailed", -49], ["₱54,432 received by bank transfer", -20]) },
  { id: "INV-3031", customerId: "c2", issued: -44, due: -14, lines: [L("i4", 30), L("i12", 20)], paid: 0, log: tr(["Posted and emailed", -44], ["Auto reminder, due today", -14], ["Auto reminder, 7 days late", -7]) },
  { id: "INV-3028", customerId: "c4", issued: -35, due: -5, lines: [L("i6", 120), L("i13", 20)], paid: 0, log: tr(["Posted and emailed", -35], ["Auto reminder, due today", -5]) },
  { id: "INV-3022", customerId: "c6", issued: -69, due: -39, lines: [L("i5", 10), L("i13", 10)], paid: 0, log: tr(["Posted and emailed", -69], ["Auto reminder, due today", -39], ["Auto reminder, 14 days late", -25], ["Call task created for Marites", -9]) },
  { id: "INV-3015", customerId: "c5", issued: -95, due: -65, lines: [L("i2", 400), L("i1", 300)], paid: 0, log: tr(["Posted and emailed", -95], ["Auto reminder, due today", -65], ["Statement sent", -28], ["Auto reminder, 60 days late", -5]) },
  { id: "INV-3009", customerId: "c9", issued: -131, due: -101, lines: [L("i11", 6)], paid: 0, log: tr(["Posted and emailed", -131], ["Auto reminder, 30 days late", -71], ["Payment plan agreed with Vincent Lim", -40]) },
  { id: "INV-3005", customerId: "c10", issued: -60, due: -15, lines: [L("i3", 400), L("i2", 500)], paid: 236880, log: tr(["Posted and emailed", -60], ["₱236,880 received by bank transfer", -14]) },
];

const BILLS: Bill[] = [
  { id: "BILL-0142", supplierId: "s2", poId: "PO-0868", ref: "VSC-88213", issued: -5, due: 25, lines: [C("i2", 300), C("i8", 100)], paid: 0, log: tr(["Bill entered, matched to PO-0868 and QC/IN/0115", -5]) },
  { id: "BILL-0141", supplierId: "s4", ref: "PPS-5530", issued: -16, due: -1, lines: [C("i5", 40)], paid: 0, log: tr(["Bill entered from supplier invoice", -16]) },
  { id: "BILL-0140", supplierId: "s1", poId: "PO-0866", ref: "RCT-10293", issued: -7, due: 0, lines: [C("i1", 300)], paid: 0, log: tr(["Bill entered, matched to PO-0866 and QC/IN/0114", -7]) },
  { id: "BILL-0139", supplierId: "s8", poId: "PO-0867", ref: "MWC-4410", issued: -12, due: 3, lines: [C("i11", 20)], paid: 0, log: tr(["Bill entered, matched to PO-0867 and QC/IN/0112", -12]) },
  { id: "BILL-0135", supplierId: "s3", ref: "LTC-2207", issued: -29, due: 1, lines: [C("i4", 150)], paid: 68880, log: tr(["Bill entered from supplier invoice", -29], ["₱68,880 paid by bank transfer", -8]) },
  { id: "BILL-0133", supplierId: "s6", ref: "BLY-0918", issued: -33, due: -3, lines: [C("i7", 40), C("i14", 100)], paid: 50848, log: tr(["Bill entered from supplier invoice", -33], ["₱50,848 paid by bank transfer", -2]) },
];

const PAYMENTS: Payment[] = [
  { id: "PAY-0526", date: -1, contactId: "c11", dir: "in", method: "GCash", amount: 46480, docId: "INV-3043", ref: "7781 2290" },
  { id: "PAY-0525", date: -2, contactId: "s6", dir: "out", method: "Bank transfer", amount: 50848, docId: "BILL-0133", ref: "BDO 0093 4410" },
  { id: "PAY-0524", date: -3, contactId: "c3", dir: "in", method: "Check", amount: 50000, docId: "INV-3039", ref: "BPI 001842" },
  { id: "PAY-0523", date: -8, contactId: "s3", dir: "out", method: "Bank transfer", amount: 68880, docId: "BILL-0135", ref: "BDO 0093 4387" },
  { id: "PAY-0522", date: -14, contactId: "c10", dir: "in", method: "Bank transfer", amount: 236880, docId: "INV-3005", ref: "BPI 7720 1185" },
  { id: "PAY-0521", date: -20, contactId: "c7", dir: "in", method: "Bank transfer", amount: 54432, docId: "INV-3036", ref: "BDO 0093 4201" },
];

const mv = (date: number, ref: string, itemId: string, qty: number, from: string, to: string): Move => ({ id: `${ref}-${itemId}-${from}`, date, ref, itemId, qty, from, to });
const MOVES: Move[] = [
  mv(0, "OR-000484", "i5", 2, "QC/Stock", "Customers"),
  mv(0, "OR-000484", "i13", 2, "QC/Stock", "Customers"),
  mv(0, "OR-000483", "i1", 10, "PSG/Stock", "Customers"),
  mv(0, "QC/OUT/0231", "i2", 200, "QC/Stock", "Customers"),
  mv(0, "QC/OUT/0231", "i8", 50, "QC/Stock", "Customers"),
  mv(0, "QC/OUT/0231", "i1", 80, "QC/Stock", "Customers"),
  mv(-1, "INT/0043", "i14", 100, "QC/Stock", "In transit"),
  mv(-2, "QC/IN/0117", "i6", 200, "Vendors", "QC/Stock"),
  mv(-2, "INT/0042", "i3", 40, "In transit", "PSG/Stock"),
  mv(-3, "INT/0042", "i3", 40, "QC/Stock", "In transit"),
  mv(-3, "PSG/OUT/0118", "i6", 60, "PSG/Stock", "Customers"),
  mv(-3, "PSG/OUT/0118", "i5", 4, "PSG/Stock", "Customers"),
  mv(-5, "QC/IN/0115", "i2", 300, "Vendors", "QC/Stock"),
  mv(-5, "QC/IN/0115", "i8", 100, "Vendors", "QC/Stock"),
  mv(-5, "INT/0041", "i4", 50, "In transit", "QC/Stock"),
  mv(-6, "INT/0041", "i4", 50, "PSG/Stock", "In transit"),
  mv(-6, "ADJ/0031", "i5", 2, "QC/Stock", "Count adjustment"),
  mv(-7, "QC/IN/0114", "i1", 300, "Vendors", "QC/Stock"),
  mv(-7, "QC/OUT/0228", "i9", 2000, "QC/Stock", "Customers"),
  mv(-7, "QC/OUT/0228", "i14", 150, "QC/Stock", "Customers"),
  mv(-9, "PSG/OUT/0116", "i4", 25, "PSG/Stock", "Customers"),
];

const TRANSFERS: Transfer[] = [
  { id: "INT/0044", from: "Quezon City", to: "Pasig", date: 0, lines: [{ itemId: "i12", qty: 30 }], status: "Ready" },
  { id: "INT/0043", from: "Quezon City", to: "Pasig", date: -1, lines: [{ itemId: "i14", qty: 100 }], status: "In transit" },
  { id: "INT/0042", from: "Quezon City", to: "Pasig", date: -3, lines: [{ itemId: "i3", qty: 40 }], status: "Done" },
  { id: "INT/0041", from: "Pasig", to: "Quezon City", date: -6, lines: [{ itemId: "i4", qty: 50 }], status: "Done" },
];

const RECEIPTS: PosReceipt[] = [
  { id: "OR-000484", time: "11:42 AM", branch: "Quezon City", lines: [L("i5", 2), L("i13", 2)], method: "GCash" },
  { id: "OR-000483", time: "11:05 AM", branch: "Pasig", lines: [L("i1", 10)], method: "Cash" },
  { id: "OR-000482", time: "10:31 AM", branch: "Quezon City", lines: [L("i6", 12)], method: "Cash" },
  { id: "OR-000481", time: "9:58 AM", branch: "Quezon City", lines: [L("i9", 200), L("i1", 8)], method: "Card" },
  { id: "OR-000480", time: "9:20 AM", branch: "Pasig", lines: [L("i11", 1)], method: "GCash" },
  { id: "OR-000479", time: "8:47 AM", branch: "Quezon City", lines: [L("i7", 3)], method: "Cash" },
  { id: "OR-000478", time: "8:12 AM", branch: "Pasig", lines: [L("i12", 4), L("i4", 6)], method: "GCash" },
];

const TRUCKS: Truck[] = [
  { id: "t1", name: "Truck 1", model: "Isuzu Elf", plate: "NDA 4821", driver: "Ador Pascual" },
  { id: "t2", name: "Truck 2", model: "Hino 300", plate: "NCX 7094", driver: "Bong Agustin" },
  { id: "t3", name: "Truck 3", model: "Mitsubishi L300", plate: "ZQT 318", driver: "Rene Lacson" },
];
const RUNS: Run[] = [
  { saleId: "SO-2416", truckId: "t1", status: "Delivered", eta: 530, at: "8:50 AM", signedBy: "R. Garcia" },
  { saleId: "SO-2420", truckId: "t1", status: "On the road", eta: 735 },
  { saleId: "SO-2418", truckId: "t2", status: "Loading", eta: 795 },
  { saleId: "SO-2417", truckId: "t2", status: "Loading", eta: 900 },
];
const STOP_TONE: Record<StopStatus, "good" | "warn" | "muted"> = { Loading: "muted", "On the road": "warn", Delivered: "good" };
// Street and lot for each customer's delivery site; the city comes from the contact.
const SITE: Record<string, string> = {
  c1: "Blk 6 Lot 14 Regalado Ave", c2: "22 West Capitol Dr", c3: "Site 3, Batasan Rd", c4: "108 Ortigas Ave Ext", c5: "55 Quirino Hwy", c6: "9 Evangelista St",
  c7: "Phase 2, Bayani Homes site", c8: "17 Aurora Blvd", c9: "86 Felix Ave", c10: "ADB Ave, tower 2 site", c11: "Church grounds, Sumulong Hwy",
};

const CASH: Record<Account, number> = { "BDO current": 1284500, "BPI savings": 642300, "GCash and Maya": 86420, "Cash drawers": 48650 };

// October so far, before the sample documents above. September is closed.
const OCT = { invoiced: 1184000, pos: 612400, cogs: 1300000, purchases: 1210000 };
const SEPT = { invoiced: 1402000, pos: 638000, cogs: 1571000 };
const BRANCH_BASE: Record<Branch, number> = { "Quezon City": 1090000, Pasig: 610000 };
const OPEX: [string, number, number][] = [
  ["Salaries and wages", 186000, 184500],
  ["Rent, two branches", 120000, 120000],
  ["Utilities", 38400, 36900],
  ["Delivery and fuel", 52700, 47300],
  ["Other expenses", 21300, 19800],
];
const MONTHS = [
  { label: "May", rev: 1820000, exp: 1760000 },
  { label: "Jun", rev: 1640000, exp: 1600000 },
  { label: "Jul", rev: 1950000, exp: 1870000 },
  { label: "Aug", rev: 2110000, exp: 2010000 },
  { label: "Sep", rev: 2040000, exp: 1979500 },
];

const sub = (lines: Line[]) => lines.reduce((s, l) => s + l.qty * l.price, 0);
const grand = (lines: Line[]) => sub(lines) + vat(sub(lines));
const qtyOf = (lines: { itemId: string; qty: number }[], id: string) => lines.reduce((n, l) => (l.itemId === id ? n + l.qty : n), 0);
const mergeLine = (lines: { itemId: string; qty: number }[], itemId: string, qty: number) =>
  lines.some((l) => l.itemId === itemId) ? lines.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + qty } : l)) : [...lines, { itemId, qty }];

// ---- Small building blocks -----------------------------------------------------------

// Buttons inside a clickable table row. Table rows act on Enter and Space, so key
// presses on these buttons must not bubble up and open the row instead.
function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex gap-1.5" onKeyDown={(e) => e.stopPropagation()}>
      {children}
    </span>
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

// Status bar across the top of a document, like the stage bar on a sales order form.
function StageBar({ stages, current }: { stages: readonly (readonly [string, string])[]; current: string }) {
  const at = stages.findIndex(([id]) => id === current);
  return (
    <ol aria-label="Document status" className="flex flex-wrap items-center gap-1 mb-3">
      {stages.map(([id, label], i) => (
        <li key={id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-mist" aria-hidden />}
          <span
            aria-current={i === at ? "step" : undefined}
            className={cn("inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[0.72rem] font-medium", i === at ? "border-gold bg-gold-wash text-gold" : i < at ? "border-rule bg-sheet text-good" : "border-rule bg-sheet text-mist")}
          >
            {i < at && <Check size={12} strokeWidth={2.5} />}
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Totals({ lines, paid }: { lines: Line[]; paid?: number }) {
  const s = sub(lines);
  const rows: [string, number, boolean][] = [["Untaxed amount", s, false], ["VAT 12%", vat(s), false], ["Total", s + vat(s), true]];
  if (paid !== undefined) rows.push(["Paid", -paid, false], ["Amount due", s + vat(s) - paid, true]);
  return (
    <dl className="flex flex-col gap-1.5 text-[0.8rem]">
      {rows.map(([k, v, strong]) => (
        <div key={k} className={cn("flex justify-between", strong && "pt-1.5 border-t border-rule-soft")}>
          <dt className={strong ? "text-ink font-medium" : "text-mist"}>{k}</dt>
          <dd className={cn("font-mono", strong ? "text-ink font-semibold" : "text-ink-soft")}>{v < 0 ? `−${peso(-v)}` : peso(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function TrailList({ trail }: { trail: Trail[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {[...trail].reverse().map((t, i) => (
        <li key={`${i}-${t.text}`} className="flex items-start gap-2.5 text-[0.78rem]">
          <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", i === 0 ? "bg-gold" : "bg-rule")} aria-hidden />
          <span className="flex-1 text-ink-soft">{t.text}</span>
          <span className="font-mono text-[0.68rem] text-mist shrink-0">{day(t.date)}</span>
        </li>
      ))}
    </ol>
  );
}

// Aging bucket that doubles as a filter.
function Tile({ label, value, note, on, alert, onClick }: { label: string; value: string; note: string; on: boolean; alert?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("text-left bg-sheet border rounded-lg px-3 py-2.5 transition-[border-color,box-shadow] cursor-pointer", on ? "border-gold shadow-[0_0_0_3px_var(--color-gold-wash)]" : "border-rule hover:border-mist")}
    >
      <span className="block text-[0.7rem] font-medium text-mist">{label}</span>
      <span className={cn("block mt-0.5 text-[1.02rem] font-semibold tabular-nums", alert ? "text-danger" : "text-ink")}>{value}</span>
      <span className="block text-[0.66rem] text-mist">{note}</span>
    </button>
  );
}

const Heading = ({ children }: { children: React.ReactNode }) => <ProtoHeading sub className="text-[0.8rem] font-semibold text-ink mb-2">{children}</ProtoHeading>;
const linkClass = "text-gold-bright hover:text-ink cursor-pointer text-left";

// Paired bars for revenue against expenses.
function PairBars({ data }: { data: typeof MONTHS }) {
  const max = Math.max(...data.map((d) => Math.max(d.rev, d.exp)));
  return (
    <div>
      <div className="flex items-end gap-3 h-36">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex items-end justify-center gap-1 h-full" role="img" aria-label={`${d.label}: revenue ${millions(d.rev)}, expenses ${millions(d.exp)}`}>
            {(["rev", "exp"] as const).map((k) => (
              <motion.div
                key={k}
                className={cn("w-full max-w-[16px] rounded-t-[3px]", k === "rev" ? "bg-gold" : "bg-trace/45")}
                initial={{ height: 0 }}
                animate={{ height: `${(d[k] / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-1.5">
        {data.map((d) => <span key={d.label} className="flex-1 text-center font-mono text-[0.6rem] text-mist">{d.label}</span>)}
      </div>
      <div className="flex gap-4 mt-3 text-[0.7rem] text-graphite">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-gold" aria-hidden />Revenue</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-trace/45" aria-hidden />Costs and expenses</span>
      </div>
    </div>
  );
}

// A customer's signature on a delivery. Draws itself when freshly signed.
function SignatureMark({ className, draw }: { className?: string; draw?: boolean }) {
  return (
    <svg viewBox="0 0 160 50" className={cn("text-ink", className)} role="img" aria-label="Customer signature">
      <motion.path d="M6 34 C 20 6, 30 46, 44 24 S 66 8, 74 30 S 98 44, 108 18 S 132 30, 154 22" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" initial={draw ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
    </svg>
  );
}

// ---- The app -------------------------------------------------------------------------

type Modal = "doc" | "pay" | "transfer" | "rule" | "contact" | "pod" | null;
interface DocForm { kind: "sale" | "purchase"; partyId: string; branch: Branch; lines: { itemId: string; qty: number }[]; pick: string; pickQty: string }
interface PayForm { kind: "invoice" | "bill"; docId: string; amount: string; method: Method; ref: string }

export function ErpPrototype() {
  const app = useProtoApp("dashboard");
  const [items, setItems] = useState(ITEMS);
  const [contacts, setContacts] = useState(CONTACTS);
  const [sales, setSales] = useState(SALES);
  const [purchases, setPurchases] = useState(PURCHASES);
  const [invoices, setInvoices] = useState(INVOICES);
  const [bills, setBills] = useState(BILLS);
  const [payments, setPayments] = useState(PAYMENTS);
  const [moves, setMoves] = useState(MOVES);
  const [transfers, setTransfers] = useState(TRANSFERS);
  const [receipts, setReceipts] = useState(RECEIPTS);
  const [runs, setRuns] = useState(RUNS);
  const [cash, setCash] = useState(CASH);
  const [reminded, setReminded] = useState<string[]>([]);
  const [closeDone, setCloseDone] = useState<string[]>([]);
  const [countPosted, setCountPosted] = useState(false);
  const [locked, setLocked] = useState(false);

  // Filters and tabs
  const [q, setQ] = useState({ sales: "", purchase: "", items: "", moves: "", pos: "", contacts: "" });
  const search = (k: keyof typeof q) => (v: string) => setQ((s) => ({ ...s, [k]: v }));
  const [saleFilter, setSaleFilter] = useState<SaleFilter>("all");
  const [poFilter, setPoFilter] = useState<PoFilter>("all");
  const [invTab, setInvTab] = useState<"products" | "moves" | "transfers" | "reorder" | "count">("products");
  const [catFilter, setCatFilter] = useState<"all" | Category>("all");
  const [moveBranch, setMoveBranch] = useState<"all" | Branch>("all");
  const [reorderView, setReorderView] = useState<"need" | "all">("need");
  const [countBranch, setCountBranch] = useState<Branch>("Quezon City");
  const [counted, setCounted] = useState<Record<string, string>>({ "i5|Quezon City": "24", "i6|Quezon City": "306", "i13|Quezon City": "64" });
  const [contactKind, setContactKind] = useState<"Customer" | "Supplier">("Customer");
  const [acctTab, setAcctTab] = useState<"invoices" | "bills" | "payments" | "pnl">("invoices");
  const [invFilter, setInvFilter] = useState<"open" | "overdue" | "paid" | "all">("open");
  const [bucketOn, setBucketOn] = useState<number | null>(null);
  const [payDir, setPayDir] = useState<"all" | "in" | "out">("all");

  // Point of sale
  const [posBranch, setPosBranch] = useState<Branch>("Quezon City");
  const [posCat, setPosCat] = useState<"All" | Category>("All");
  const [cart, setCart] = useState<{ itemId: string; qty: number }[]>([]);
  const [posMethod, setPosMethod] = useState<"Cash" | "GCash" | "Card">("Cash");
  const [tendered, setTendered] = useState("");
  const [posRef, setPosRef] = useState("");

  // Slide-over forms
  const [modal, setModal] = useState<Modal>(null);
  const [doc, setDoc] = useState<DocForm>({ kind: "sale", partyId: "c1", branch: "Quezon City", lines: [], pick: "i1", pickQty: "" });
  const [pay, setPay] = useState<PayForm>({ kind: "invoice", docId: "", amount: "", method: "Bank transfer", ref: "" });
  const [tf, setTf] = useState<{ from: Branch; itemId: string; qty: string }>({ from: "Quezon City", itemId: "i12", qty: "" });
  const [rf, setRf] = useState<{ itemId: string; values: Record<Branch, { min: string; max: string }> }>({ itemId: "i1", values: { "Quezon City": { min: "", max: "" }, Pasig: { min: "", max: "" } } });
  const [cf, setCf] = useState({ name: "", kind: "Customer" as "Customer" | "Supplier", person: "", phone: "", city: "", terms: "30" });
  const [pod, setPod] = useState({ saleId: "", by: "", signed: false });
  const closeModal = () => setModal(null);

  // ---- Lookups and derived numbers ----
  const item = (id?: string) => items.find((i) => i.id === id);
  const contact = (id?: string) => contacts.find((c) => c.id === id);
  const nameOf = (id?: string) => contact(id)?.name ?? "";
  const costOf = (lines: Line[]) => lines.reduce((s, l) => s + l.qty * (item(l.itemId)?.cost ?? 0), 0);
  const balance = (d: { lines: Line[]; paid: number }) => grand(d.lines) - d.paid;

  // Forecast = on hand + incoming − reserved, per branch, the way reordering rules see it.
  const reserved = (id: string, b: Branch, except?: string) => sum(sales.filter((s) => s.stage === "order" && s.branch === b && s.id !== except).map((s) => qtyOf(s.lines, id)));
  const outgoing = (id: string, b: Branch) => sum(transfers.filter((t) => t.status === "Ready" && t.from === b).map((t) => qtyOf(t.lines, id)));
  const incoming = (id: string, b: Branch) =>
    sum(purchases.filter((p) => p.stage === "order" && p.branch === b).map((p) => qtyOf(p.lines, id))) + sum(transfers.filter((t) => t.status !== "Done" && t.to === b).map((t) => qtyOf(t.lines, id)));
  const free = (id: string, b: Branch, except?: string) => (item(id)?.stock[b] ?? 0) - reserved(id, b, except) - outgoing(id, b);
  const forecast = (i: Item, b: Branch) => i.stock[b] + incoming(i.id, b) - reserved(i.id, b) - outgoing(i.id, b);
  const openRfq = (id: string, b: Branch) => purchases.find((p) => (p.stage === "rfq" || p.stage === "sent") && p.branch === b && p.lines.some((l) => l.itemId === id));
  const rules = items.flatMap((i) =>
    BRANCHES.map((b) => {
      const f = forecast(i, b);
      return { key: `${i.id}|${b}`, item: i, branch: b, min: i.rule[b].min, max: i.rule[b].max, forecast: f, need: f < i.rule[b].min, qty: roundQty(i.rule[b].max - f), rfq: openRfq(i.id, b) };
    }),
  );
  type Rule = (typeof rules)[number];
  const toOrder = rules.filter((r) => r.need && !r.rfq);

  const openInv = invoices.filter((i) => balance(i) > 0);
  const overdueInv = openInv.filter((i) => i.due < 0);
  const openBills = bills.filter((b) => balance(b) > 0);
  const receivable = (cid: string) => sum(openInv.filter((i) => i.customerId === cid).map(balance));
  const payable = (sid: string) => sum(openBills.filter((b) => b.supplierId === sid).map(balance));
  const overdueOf = (id: string) => sum(overdueInv.filter((i) => i.customerId === id).map(balance)) + sum(openBills.filter((b) => b.supplierId === id && b.due < 0).map(balance));
  const overLimit = (c: Contact | undefined, extra: number) => (c?.credit ? receivable(c.id) + extra - c.credit : 0);

  // Confirmed orders with no truck yet, and the stops still to make today.
  const unassigned = sales.filter((s) => s.stage === "order" && !runs.some((r) => r.saleId === s.id));
  const stopsLeft = runs.filter((r) => r.status !== "Delivered");
  const onRoad = runs.filter((r) => r.status === "On the road");
  const trucksOut = new Set(onRoad.map((r) => r.truckId)).size;

  const stockValue = sum(items.map((i) => (i.stock["Quezon City"] + i.stock.Pasig) * i.cost));
  const salesToday = sum(receipts.map((r) => grand(r.lines))) + sum(sales.filter((s) => s.confirmed === 0).map((s) => grand(s.lines)));
  const octInv = invoices.filter((i) => i.issued >= -28);
  const invoicedRev = OCT.invoiced + sum(octInv.map((i) => sub(i.lines)));
  const posRev = OCT.pos + sum(receipts.map((r) => sub(r.lines)));
  const cogs = OCT.cogs + sum(octInv.map((i) => costOf(i.lines))) + sum(receipts.map((r) => costOf(r.lines)));
  const revenue = invoicedRev + posRev;
  const opex = sum(OPEX.map((o) => o[1]));
  const gross = revenue - cogs;
  const net = gross - opex;
  const septRev = SEPT.invoiced + SEPT.pos;
  const septGross = septRev - SEPT.cogs;
  const outputVat = vat(revenue);
  const inputVat = vat(OCT.purchases + sum(bills.filter((b) => b.issued >= -28).map((b) => sub(b.lines))));
  const branchSales = (b: Branch) =>
    BRANCH_BASE[b] + sum(sales.filter((s) => s.branch === b && sIdx(s.stage) >= 2 && s.date >= -28).map((s) => sub(s.lines))) + sum(receipts.filter((r) => r.branch === b).map((r) => sub(r.lines)));

  // ---- Shared effects of documents on stock and cash ----
  const addMoves = (list: Omit<Move, "id">[]) => setMoves((m) => [...list.map((x) => ({ ...x, id: nextId("m") })), ...m]);
  const shiftStock = (changes: { itemId: string; branch: Branch; delta: number }[]) =>
    setItems((list) =>
      list.map((i) => {
        const mine = changes.filter((c) => c.itemId === i.id);
        if (!mine.length) return i;
        const stock = { ...i.stock };
        mine.forEach((c) => {
          stock[c.branch] = Math.max(0, stock[c.branch] + c.delta);
        });
        return { ...i, stock };
      }),
    );
  const addCash = (method: Method, amount: number) => setCash((c) => ({ ...c, [ACCOUNT_FOR[method]]: c[ACCOUNT_FOR[method]] + amount }));

  // ---- Sales: quotation → order → delivery → invoice ----
  const patchSale = (id: string, patch: Partial<Sale>, note: string) => setSales((list) => list.map((s) => (s.id === id ? { ...s, ...patch, trail: [...s.trail, { text: note, date: 0 }] } : s)));
  const sendQuote = (s: Sale) => {
    patchSale(s.id, { stage: "sent" }, `Sent to ${contact(s.customerId)?.person} by email`);
    app.notify(`Quotation ${s.id} sent to ${nameOf(s.customerId)}`);
  };
  const confirmSale = (s: Sale) => {
    const short = s.lines.find((l) => free(l.itemId, s.branch, s.id) < l.qty);
    patchSale(s.id, { stage: "order", confirmed: 0 }, `Confirmed, stock reserved at ${s.branch}`);
    app.notify(short ? `${s.id} confirmed. ${item(short.itemId)?.name} is short at ${s.branch}; reordering picks it up.` : `${s.id} confirmed. Stock reserved at ${s.branch}.`);
  };
  const deliverSale = (s: Sale, signedBy?: string) => {
    const prefix = `${CODE[s.branch]}/OUT/`;
    const ref = pad(prefix, lastNo(sales.map((x) => x.delivery), prefix) + 1);
    shiftStock(s.lines.map((l) => ({ itemId: l.itemId, branch: s.branch, delta: -l.qty })));
    addMoves(s.lines.map((l) => ({ date: 0, ref, itemId: l.itemId, qty: l.qty, from: LOC[s.branch], to: "Customers" })));
    patchSale(s.id, { stage: "delivered", delivery: ref }, signedBy ? `Delivered, ${ref}, signed by ${signedBy}` : `Delivered, ${ref}`);
    setRuns((l) => l.map((r) => (r.saleId === s.id ? { ...r, status: "Delivered", at: "Just now", signedBy } : r)));
    const low = s.lines.map((l) => item(l.itemId)).find((i) => i && i.stock[s.branch] - qtyOf(s.lines, i.id) < i.rule[s.branch].min);
    const tail = low ? `; ${low.name} is now below minimum` : "";
    app.notify(signedBy ? `${s.id} delivered, signed by ${signedBy}. ${ref} validated; stock updated at ${s.branch}${tail}.` : `${ref} validated. Stock updated at ${s.branch}${tail}.`);
  };
  const invoiceSale = (s: Sale) => {
    const id = pad("INV-", lastNo(invoices.map((i) => i.id), "INV-") + 1);
    const terms = contact(s.customerId)?.terms ?? 30;
    setInvoices((list) => [{ id, customerId: s.customerId, saleId: s.id, issued: 0, due: terms, lines: s.lines, paid: 0, log: [{ text: `Posted from ${s.id} and emailed`, date: 0 }] }, ...list]);
    patchSale(s.id, { stage: "invoiced", invoiceId: id }, `Invoiced, ${id}`);
    app.notify(`${id} posted to ${nameOf(s.customerId)}: ${peso(grand(s.lines))} with VAT, due ${day(terms)}`);
  };

  // ---- Deliveries: assign to a truck, send out, confirm with a signature ----
  const addressOf = (id: string) => [SITE[id], contact(id)?.city].filter(Boolean).join(", ");
  const assignStop = (s: Sale, truckId: string) => {
    const t = TRUCKS.find((x) => x.id === truckId);
    if (!t) return;
    const eta = Math.max(750, Math.max(0, ...runs.filter((r) => r.truckId === t.id && r.status !== "Delivered").map((r) => r.eta)) + 90);
    setRuns((l) => [...l, { saleId: s.id, truckId: t.id, status: "Loading", eta }]);
    patchSale(s.id, {}, `Assigned to ${t.name}, ${t.driver}`);
    app.notify(`${s.id} loaded on ${t.name}. ${t.driver} should reach ${nameOf(s.customerId)} around ${clock(eta)}.`);
  };
  const unassignStop = (r: Run) => {
    const t = TRUCKS.find((x) => x.id === r.truckId);
    setRuns((l) => l.filter((x) => x.saleId !== r.saleId));
    patchSale(r.saleId, {}, `Taken off ${t?.name}`);
    app.notify(`${r.saleId} taken off ${t?.name}. Assign it to another truck.`);
  };
  const sendOut = (t: Truck) => {
    const going = runs.filter((r) => r.truckId === t.id && r.status === "Loading");
    if (!going.length) return;
    setRuns((l) => l.map((r) => (r.truckId === t.id && r.status === "Loading" ? { ...r, status: "On the road" } : r)));
    setSales((l) => l.map((s) => (going.some((r) => r.saleId === s.id) ? { ...s, trail: [...s.trail, { text: `Out for delivery on ${t.name}`, date: 0 }] } : s)));
    app.notify(`${t.name} is on the road with ${going.length === 1 ? "1 stop" : `${going.length} stops`}. Customers get an SMS with the arrival time.`);
  };
  const openPod = (r: Run) => {
    setPod({ saleId: r.saleId, by: contact(sales.find((s) => s.id === r.saleId)?.customerId)?.person ?? "", signed: false });
    setModal("pod");
  };
  const podSale = sales.find((s) => s.id === pod.saleId);
  const confirmStop = () => {
    if (!podSale || podSale.stage !== "order" || !pod.signed || !pod.by.trim()) return;
    deliverSale(podSale, pod.by.trim());
    setModal(null);
  };

  // ---- Purchase: RFQ → order → receipt → vendor bill ----
  const patchPo = (id: string, patch: Partial<Purchase>, note: string) => setPurchases((list) => list.map((p) => (p.id === id ? { ...p, ...patch, trail: [...p.trail, { text: note, date: 0 }] } : p)));
  const sendRfq = (p: Purchase) => {
    patchPo(p.id, { stage: "sent" }, `Sent to ${nameOf(p.supplierId)} by email`);
    app.notify(`RFQ ${p.id} sent to ${nameOf(p.supplierId)}`);
  };
  const confirmPo = (p: Purchase) => {
    const lead = Math.max(...p.lines.map((l) => item(l.itemId)?.lead ?? 3));
    patchPo(p.id, { stage: "order", expected: lead }, `Confirmed, arriving ${day(lead)}`);
    app.notify(`${p.id} confirmed with ${nameOf(p.supplierId)}. Arriving ${day(lead)} at ${p.branch}.`);
  };
  const receivePo = (p: Purchase) => {
    const prefix = `${CODE[p.branch]}/IN/`;
    const ref = pad(prefix, lastNo(purchases.map((x) => x.receipt), prefix, p.branch === "Pasig" ? 46 : 0) + 1);
    shiftStock(p.lines.map((l) => ({ itemId: l.itemId, branch: p.branch, delta: l.qty })));
    addMoves(p.lines.map((l) => ({ date: 0, ref, itemId: l.itemId, qty: l.qty, from: "Vendors", to: LOC[p.branch] })));
    patchPo(p.id, { stage: "received", receipt: ref }, `Received in full, ${ref}`);
    app.notify(`${ref} validated. ${p.lines.length === 1 ? "1 product" : `${p.lines.length} products`} added to ${p.branch} stock.`);
  };
  const billPo = (p: Purchase) => {
    const id = pad("BILL-", lastNo(bills.map((b) => b.id), "BILL-") + 1);
    const terms = contact(p.supplierId)?.terms ?? 30;
    setBills((list) => [{ id, supplierId: p.supplierId, poId: p.id, ref: `SI-${4400 + list.length}`, issued: 0, due: terms, lines: p.lines, paid: 0, log: [{ text: `Bill entered, matched to ${p.id} and ${p.receipt}`, date: 0 }] }, ...list]);
    patchPo(p.id, { stage: "billed", billId: id }, `Billed, ${id}`);
    app.notify(`${id} created and matched to ${p.id}. Due ${day(terms)}.`);
  };

  // ---- Payments and reminders ----
  const openPay = (kind: "invoice" | "bill", docId: string) => {
    const d = kind === "invoice" ? invoices.find((i) => i.id === docId) : bills.find((b) => b.id === docId);
    if (!d) return;
    setPay({ kind, docId, amount: String(balance(d)), method: "Bank transfer", ref: "" });
    setModal("pay");
  };
  const payDoc = pay.kind === "invoice" ? invoices.find((i) => i.id === pay.docId) : bills.find((b) => b.id === pay.docId);
  const payParty = payDoc ? ("customerId" in payDoc ? payDoc.customerId : payDoc.supplierId) : "";
  const recordPay = () => {
    if (!payDoc) return;
    const due = balance(payDoc);
    const amt = Math.min(Number(pay.amount), due);
    if (!amt) return;
    const entry = { text: `${peso(amt)} ${pay.kind === "invoice" ? "received" : "paid"} by ${pay.method.toLowerCase()}${pay.ref ? `, ref ${pay.ref}` : ""}`, date: 0 };
    if (pay.kind === "invoice") setInvoices((l) => l.map((x) => (x.id === payDoc.id ? { ...x, paid: x.paid + amt, log: [...x.log, entry] } : x)));
    else setBills((l) => l.map((x) => (x.id === payDoc.id ? { ...x, paid: x.paid + amt, log: [...x.log, entry] } : x)));
    setPayments((l) => [{ id: pad("PAY-", lastNo(l.map((p) => p.id), "PAY-") + 1), date: 0, contactId: payParty, dir: pay.kind === "invoice" ? "in" : "out", method: pay.method, amount: amt, docId: payDoc.id, ref: pay.ref }, ...l]);
    addCash(pay.method, pay.kind === "invoice" ? amt : -amt);
    setModal(null);
    app.notify(amt >= due ? `${payDoc.id} paid in full. ${peso(amt)} ${pay.kind === "invoice" ? "deposited to" : "paid from"} ${ACCOUNT_FOR[pay.method]}.` : `${peso(amt)} recorded. ${peso(due - amt)} still open on ${payDoc.id}.`);
  };
  const remind = (list: Invoice[]) => {
    if (!list.length) return;
    setReminded((r) => [...r, ...list.map((i) => i.id)]);
    setInvoices((l) => l.map((x) => (list.some((i) => i.id === x.id) ? { ...x, log: [...x.log, { text: "Reminder sent by email and SMS", date: 0 }] } : x)));
    app.notify(list.length === 1 ? `Reminder sent to ${nameOf(list[0].customerId)} by email and SMS` : `${list.length} reminders sent by email and SMS`);
  };

  // ---- Inventory: transfers, reordering, counts ----
  const shipTransfer = (t: Transfer) => {
    shiftStock(t.lines.map((l) => ({ itemId: l.itemId, branch: t.from, delta: -l.qty })));
    addMoves(t.lines.map((l) => ({ date: 0, ref: t.id, itemId: l.itemId, qty: l.qty, from: LOC[t.from], to: "In transit" })));
    setTransfers((l) => l.map((x) => (x.id === t.id ? { ...x, status: "In transit" } : x)));
    app.notify(`${t.id} shipped from ${t.from}. Receive it at ${t.to} when the truck arrives.`);
  };
  const receiveTransfer = (t: Transfer) => {
    shiftStock(t.lines.map((l) => ({ itemId: l.itemId, branch: t.to, delta: l.qty })));
    addMoves(t.lines.map((l) => ({ date: 0, ref: t.id, itemId: l.itemId, qty: l.qty, from: "In transit", to: LOC[t.to] })));
    setTransfers((l) => l.map((x) => (x.id === t.id ? { ...x, status: "Done" } : x)));
    app.notify(`${t.id} received at ${t.to}. Stock is ready to sell.`);
  };
  const openTransfer = (i?: Item) => {
    setTf({ from: i && i.stock.Pasig > i.stock["Quezon City"] ? "Pasig" : "Quezon City", itemId: i?.id ?? "i12", qty: "" });
    setModal("transfer");
  };
  const createTransfer = () => {
    const i = item(tf.itemId);
    const qty = Number(tf.qty);
    if (!i || !qty) return;
    const id = pad("INT/", lastNo(transfers.map((t) => t.id), "INT/") + 1);
    setTransfers((l) => [{ id, from: tf.from, to: other(tf.from), date: 0, lines: [{ itemId: i.id, qty }], status: "Ready" }, ...l]);
    setInvTab("transfers");
    setModal(null);
    app.notify(`${id} ready to ship: ${qty} ${i.unit}, ${tf.from} to ${other(tf.from)}`);
  };

  const draftRfqs = (list: Rule[]) => {
    const groups = new Map<string, Rule[]>();
    list.forEach((r) => {
      const k = `${r.item.supplierId}|${r.branch}`;
      groups.set(k, [...(groups.get(k) ?? []), r]);
    });
    const start = lastNo(purchases.map((p) => p.id), "PO-");
    const created: Purchase[] = Array.from(groups.values()).map((g, k) => ({
      id: pad("PO-", start + k + 1),
      supplierId: g[0].item.supplierId,
      branch: g[0].branch,
      date: 0,
      expected: Math.max(...g.map((r) => r.item.lead)),
      stage: "rfq",
      lines: g.map((r) => ({ itemId: r.item.id, qty: r.qty, price: r.item.cost })),
      trail: [{ text: "RFQ drafted from reordering rules", date: 0 }],
    }));
    setPurchases((l) => [...created, ...l]);
    return created;
  };
  const orderOne = (r: Rule) => {
    const [p] = draftRfqs([r]);
    app.notify(`${p.id} drafted for ${nameOf(p.supplierId)}: ${r.qty} ${r.item.unit} to ${r.branch}`);
  };
  const orderAll = () => {
    const created = draftRfqs(toOrder);
    app.notify(`${created.length} RFQs drafted for ${new Set(created.map((p) => p.supplierId)).size} suppliers. Review them in Purchase.`);
  };
  const openRule = (i: Item) => {
    const v = (b: Branch) => ({ min: String(i.rule[b].min), max: String(i.rule[b].max) });
    setRf({ itemId: i.id, values: { "Quezon City": v("Quezon City"), Pasig: v("Pasig") } });
    setModal("rule");
  };
  const saveRule = () => {
    const n = (b: Branch) => ({ min: Number(rf.values[b].min) || 0, max: Math.max(Number(rf.values[b].max) || 0, Number(rf.values[b].min) || 0) });
    setItems((l) => l.map((i) => (i.id === rf.itemId ? { ...i, rule: { "Quezon City": n("Quezon City"), Pasig: n("Pasig") } } : i)));
    setModal(null);
    app.notify(`Reordering rules saved for ${item(rf.itemId)?.name}`);
  };

  const countLines = items.map((i) => {
    const raw = counted[`${i.id}|${countBranch}`];
    const n = raw === undefined || raw === "" ? null : Number(raw);
    return { item: i, system: i.stock[countBranch], counted: n, diff: n === null ? 0 : n - i.stock[countBranch] };
  });
  const applyCount = () => {
    const b = countBranch;
    const changed = countLines.filter((l) => l.diff !== 0);
    const ref = pad("ADJ/", lastNo(moves.map((m) => m.ref), "ADJ/") + 1);
    shiftStock(changed.map((l) => ({ itemId: l.item.id, branch: b, delta: l.diff })));
    addMoves(changed.map((l) => ({ date: 0, ref, itemId: l.item.id, qty: Math.abs(l.diff), from: l.diff > 0 ? "Count adjustment" : LOC[b], to: l.diff > 0 ? LOC[b] : "Count adjustment" })));
    setCounted((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.endsWith(`|${b}`))));
    setCountPosted(true);
    const value = sum(changed.map((l) => l.diff * l.item.cost));
    app.notify(changed.length ? `${ref} posted at ${b}. ${changed.length} lines adjusted, ${value < 0 ? "−" : "+"}${peso(Math.abs(value))} in stock value.` : `Count matches the system at ${b}. Nothing to adjust.`);
  };

  // ---- Point of sale ----
  const inCart = (id: string) => cart.find((c) => c.itemId === id)?.qty ?? 0;
  const cartLines: Line[] = cart.map((c) => ({ itemId: c.itemId, qty: c.qty, price: item(c.itemId)?.price ?? 0 }));
  const cartTotal = grand(cartLines);
  const cashIn = Number(tendered) || cartTotal;
  const canPay = cart.length > 0 && (posMethod !== "Cash" || cashIn >= cartTotal);
  const posItems = items.filter((i) => (posCat === "All" || i.category === posCat) && `${i.name} ${i.sku}`.toLowerCase().includes(q.pos.toLowerCase()));
  const branchReceipts = receipts.filter((r) => r.branch === posBranch);
  const addToCart = (i: Item) => setCart((c) => mergeLine(c, i.id, 1));
  const bump = (id: string, d: number) => setCart((c) => c.map((x) => (x.itemId === id ? { ...x, qty: Math.min(x.qty + d, item(id)?.stock[posBranch] ?? 0) } : x)).filter((x) => x.qty > 0));
  const completeSale = () => {
    if (!canPay) return;
    const id = pad("OR-", lastNo(receipts.map((r) => r.id), "OR-") + 1, 6);
    shiftStock(cartLines.map((l) => ({ itemId: l.itemId, branch: posBranch, delta: -l.qty })));
    addMoves(cartLines.map((l) => ({ date: 0, ref: id, itemId: l.itemId, qty: l.qty, from: LOC[posBranch], to: "Customers" })));
    setReceipts((r) => [{ id, time: "Just now", branch: posBranch, lines: cartLines, method: posMethod }, ...r]);
    addCash(posMethod, cartTotal);
    setCart([]);
    setTendered("");
    setPosRef("");
    app.notify(
      posMethod === "Cash"
        ? `Receipt ${id} printed. ${peso(cartTotal)} cash, change ${peso(cashIn - cartTotal)}.`
        : `Receipt ${id} printed. ${peso(cartTotal)} paid by ${posMethod === "GCash" ? "GCash" : "card"}${posRef ? `, ref ${posRef}` : ""}.`,
    );
  };

  // ---- New documents and contacts ----
  const openDoc = (kind: "sale" | "purchase", partyId?: string, lines: { itemId: string; qty: number }[] = [], branch: Branch = "Quezon City") => {
    const first = contacts.find((c) => c.kind === (kind === "sale" ? "Customer" : "Supplier"));
    const supplied = kind === "purchase" ? items.find((i) => i.supplierId === partyId) : undefined;
    setDoc({ kind, partyId: partyId ?? first?.id ?? "", branch, lines, pick: lines[0]?.itemId ?? supplied?.id ?? "i1", pickQty: "" });
    setModal("doc");
  };
  const docLines = (d: DocForm): Line[] => {
    const all = Number(d.pickQty) ? mergeLine(d.lines, d.pick, Number(d.pickQty)) : d.lines;
    return all.map((l) => ({ ...l, price: (d.kind === "sale" ? item(l.itemId)?.price : item(l.itemId)?.cost) ?? 0 }));
  };
  const addDocLine = () => {
    const qty = Number(doc.pickQty);
    if (qty) setDoc((d) => ({ ...d, pickQty: "", lines: mergeLine(d.lines, d.pick, qty) }));
  };
  const createDoc = () => {
    const lines = docLines(doc);
    if (!lines.length || !doc.partyId) return;
    setModal(null);
    if (doc.kind === "sale") {
      const id = pad("SO-", lastNo(sales.map((s) => s.id), "SO-") + 1);
      setSales((l) => [{ id, customerId: doc.partyId, branch: doc.branch, date: 0, stage: "draft", lines, trail: [{ text: "Quotation created by Marites Bautista", date: 0 }] }, ...l]);
      app.open("sale", id, id);
      app.notify(`Quotation ${id} created for ${nameOf(doc.partyId)}`);
    } else {
      const id = pad("PO-", lastNo(purchases.map((p) => p.id), "PO-") + 1);
      const lead = Math.max(...lines.map((l) => item(l.itemId)?.lead ?? 3));
      setPurchases((l) => [{ id, supplierId: doc.partyId, branch: doc.branch, date: 0, expected: lead, stage: "rfq", lines, trail: [{ text: "RFQ created by Marites Bautista", date: 0 }] }, ...l]);
      app.open("purchase-doc", id, id);
      app.notify(`RFQ ${id} created for ${nameOf(doc.partyId)}`);
    }
  };
  const orderMore = (i: Item) => {
    const b: Branch = forecast(i, "Pasig") - i.rule.Pasig.min < forecast(i, "Quezon City") - i.rule["Quezon City"].min ? "Pasig" : "Quezon City";
    const rfq = openRfq(i.id, b);
    if (rfq) {
      app.open("purchase-doc", rfq.id, rfq.id);
      app.notify(`${i.name} is already on ${rfq.id} for ${b}`);
      return;
    }
    openDoc("purchase", i.supplierId, [{ itemId: i.id, qty: Math.max(roundQty(i.rule[b].max - forecast(i, b)), 10) }], b);
  };
  const openContact = () => {
    setCf({ name: "", kind: contactKind, person: "", phone: "", city: "", terms: "30" });
    setModal("contact");
  };
  const saveContact = () => {
    if (!cf.name.trim()) return;
    setContacts((l) => [...l, { id: nextId("k"), name: cf.name.trim(), kind: cf.kind, person: cf.person || "—", phone: cf.phone || "—", city: cf.city || "—", terms: Number(cf.terms), tin: "To follow", credit: cf.kind === "Customer" ? 100000 : undefined }]);
    setContactKind(cf.kind);
    setModal(null);
    app.notify(`${cf.name.trim()} added to ${cf.kind === "Customer" ? "customers" : "suppliers"}`);
  };

  // ---- Status badges ----
  const saleBadge = (s: Sale) => {
    const si = invoices.find((i) => i.id === s.invoiceId);
    if (si && balance(si) <= 0) return <Status tone="good">Paid</Status>;
    const [label, tone] = SALE_BADGE[s.stage];
    return <Status tone={tone}>{label}</Status>;
  };
  const poBadge = (p: Purchase) => {
    const vb = bills.find((b) => b.id === p.billId);
    if (vb && balance(vb) <= 0) return <Status tone="good">Paid</Status>;
    const [label, tone] = PO_BADGE[p.stage];
    return <Status tone={tone}>{label}</Status>;
  };
  const invStatus = (i: Invoice) => {
    if (balance(i) <= 0) return <Status tone="good">Paid</Status>;
    if (i.due < 0) return <Status tone={i.due < -30 ? "bad" : "warn"}>{`${-i.due} days overdue`}</Status>;
    return <Status tone="muted">{i.paid ? `Partly paid · due ${day(i.due)}` : `Due ${day(i.due)}`}</Status>;
  };
  const billStatus = (b: Bill) =>
    balance(b) <= 0 ? <Status tone="good">Paid</Status> : b.due < 0 ? <Status tone="bad">Overdue</Status> : b.due === 0 ? <Status tone="warn">Due today</Status> : <Status tone="muted">{`Due ${day(b.due)}`}</Status>;
  const itemStatus = (i: Item) => {
    const low = rules.filter((r) => r.item.id === i.id && r.need);
    if (!low.length) return <Status tone="good">In stock</Status>;
    const open = low.filter((r) => !r.rfq);
    return open.length ? <Status tone="bad">{`Low at ${open.map((r) => CODE[r.branch]).join(", ")}`}</Status> : <Status tone="warn">In RFQ</Status>;
  };

  const productCell = (id: string) => (
    <span className="min-w-0">
      <span className="block text-ink truncate">{item(id)?.name}</span>
      <span className="block font-mono text-[0.65rem] text-mist">{item(id)?.sku}</span>
    </span>
  );
  const linesTable = (lines: Line[], extra: Column<Line>[] = []) => (
    <Table
      rows={lines}
      rowKey={(l) => l.itemId}
      onRowClick={(l) => app.open("item", l.itemId, item(l.itemId)?.name)}
      columns={[
        { key: "item", label: "Product", render: (l) => productCell(l.itemId) },
        { key: "qty", label: "Qty", align: "right", render: (l) => <span className="font-mono">{`${l.qty.toLocaleString()} ${item(l.itemId)?.unit}`}</span> },
        ...extra,
        { key: "price", label: "Unit price", align: "right", hideOnMobile: true, render: (l) => <span className="font-mono">{peso(l.price)}</span> },
        { key: "amount", label: "Amount", align: "right", render: (l) => <span className="font-mono text-ink">{peso(l.qty * l.price)}</span> },
      ]}
    />
  );
  const contactLink = (id: string) => (
    <button type="button" onClick={() => app.open("contact", id, nameOf(id))} className={linkClass}>
      {nameOf(id)}
    </button>
  );

  // ---- Navigation ----
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales", icon: ShoppingCart, badge: sales.filter((s) => s.stage === "order" || s.stage === "delivered").length },
    { id: "purchase", label: "Purchase", icon: Truck, badge: purchases.filter((p) => p.stage === "order" && p.expected <= 0).length },
    { id: "inventory", label: "Inventory", icon: Package, badge: toOrder.length },
    { id: "deliveries", label: "Deliveries", icon: Route, badge: unassigned.length },
    { id: "pos", label: "Point of sale", icon: Store },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "accounting", label: "Invoicing", icon: Receipt, badge: overdueInv.length },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const sale = app.screen === "sale" ? sales.find((x) => x.id === app.id) : undefined;
  const saleInv = invoices.find((i) => i.id === sale?.invoiceId);
  const saleRun = runs.find((r) => r.saleId === sale?.id);
  const po = app.screen === "purchase-doc" ? purchases.find((x) => x.id === app.id) : undefined;
  const poBill = bills.find((b) => b.id === po?.billId);
  const inv = app.screen === "invoice" ? invoices.find((x) => x.id === app.id) : undefined;
  const bill = app.screen === "bill" ? bills.find((x) => x.id === app.id) : undefined;
  const billOrder = purchases.find((p) => p.id === bill?.poId);
  const it = app.screen === "item" ? item(app.id) : undefined;
  const ct = app.screen === "contact" ? contact(app.id) : undefined;

  const alerts: { key: string; icon: LucideIcon; title: string; note: string; badge: React.ReactNode; go: () => void }[] = [
    ...toOrder.slice(0, 3).map((r) => ({ key: r.key, icon: Package, title: r.item.name, note: `${r.branch} · forecast ${r.forecast} ${r.item.unit}, minimum ${r.min}`, badge: <Status tone="bad">Reorder</Status>, go: () => { setInvTab("reorder"); app.section("inventory"); } })),
    ...purchases.filter((p) => p.stage === "order" && p.expected <= 0).map((p) => ({ key: p.id, icon: Truck, title: `${p.id} · ${nameOf(p.supplierId)}`, note: `Arriving today at ${p.branch}`, badge: <Status tone="warn">Receive</Status>, go: () => app.open("purchase-doc", p.id, p.id) })),
    ...sales.filter((s) => s.stage === "delivered").map((s) => ({ key: s.id, icon: ShoppingCart, title: `${s.id} · ${nameOf(s.customerId)}`, note: `Delivered ${s.delivery}, not invoiced yet`, badge: <Status tone="warn">To invoice</Status>, go: () => app.open("sale", s.id, s.id) })),
    ...openBills.filter((b) => b.due <= 0).map((b) => ({ key: b.id, icon: Wallet, title: nameOf(b.supplierId), note: `${b.id} · ${peso(balance(b))}`, badge: <Status tone={b.due < 0 ? "bad" : "warn"}>{b.due < 0 ? "Bill overdue" : "Bill due today"}</Status>, go: () => app.open("bill", b.id, b.id) })),
    ...overdueInv.filter((i) => i.due < -30).map((i) => ({ key: i.id, icon: Receipt, title: nameOf(i.customerId), note: `${i.id} · ${peso(balance(i))} unpaid`, badge: <Status tone="bad">{`${-i.due}d late`}</Status>, go: () => app.open("invoice", i.id, i.id) })),
  ];

  // Everything with a detail screen, opened from its own section like the app does.
  const record = (root: string, screen: string, id: string, label: string, hint: string): ProtoSearchItem => ({ label, hint, stack: [{ screen: root }, { screen, id, label }] });
  const searchItems: ProtoSearchItem[] = [
    ...items.map((i) => record("inventory", "item", i.id, i.name, "Item")),
    ...sales.map((s) => record("sales", "sale", s.id, s.id, sIdx(s.stage) < 2 ? "Quotation" : "Sales order")),
    ...purchases.map((p) => record("purchase", "purchase-doc", p.id, p.id, pIdx(p.stage) < 2 ? "RFQ" : "Purchase order")),
    ...invoices.map((i) => record("accounting", "invoice", i.id, i.id, "Invoice")),
    ...bills.map((b) => record("accounting", "bill", b.id, b.id, "Bill")),
    ...contacts.map((c) => record("contacts", "contact", c.id, c.name, c.kind)),
  ];
  // The bell counts what the old badge counted: overdue invoices and rules waiting for an RFQ.
  const inbox: ProtoAlert[] = [
    ...[...overdueInv].sort((a, b) => a.due - b.due).map((i) => ({ text: `${i.id} ${nameOf(i.customerId)}: ${peso(balance(i))} overdue`, time: `Due ${day(i.due)}`, stack: [{ screen: "accounting" }, { screen: "invoice", id: i.id, label: i.id }] })),
    ...toOrder.map((r) => ({ text: `${r.item.name} below minimum at ${r.branch}`, time: "Today", stack: [{ screen: "inventory" }, { screen: "item", id: r.item.id, label: r.item.name }] })),
  ];

  const closeSteps = [
    { id: "bank", label: "Bank and e-wallets reconciled", note: "BDO, BPI, GCash and Maya matched daily", done: true },
    { id: "invoiced", label: "Deliveries invoiced", note: sales.some((s) => s.stage === "delivered") ? `${sales.filter((s) => s.stage === "delivered").length} delivered order not invoiced` : "Every delivery has an invoice", done: !sales.some((s) => s.stage === "delivered"), fix: () => { setSaleFilter("toinvoice"); app.section("sales"); } },
    { id: "billed", label: "Receipts billed", note: purchases.some((p) => p.stage === "received") ? `${purchases.filter((p) => p.stage === "received").length} receipt waiting for a vendor bill` : "Every receipt has a vendor bill", done: !purchases.some((p) => p.stage === "received"), fix: () => { setPoFilter("tobill"); app.section("purchase"); } },
    { id: "count", label: "Stock count posted", note: countPosted ? "Posted today" : "Count at least one branch", done: countPosted, fix: () => { setInvTab("count"); app.section("inventory"); } },
    { id: "pos", label: "POS sessions closed", note: "Cash drawers counted at both counters", done: closeDone.includes("pos"), mark: "Close sessions" },
    { id: "value", label: "Inventory valued", note: `${peso(stockValue)} at cost across both branches`, done: closeDone.includes("value"), mark: "Run valuation" },
    { id: "vat", label: "VAT summary reviewed", note: `${peso(outputVat - inputVat)} payable for October`, done: closeDone.includes("vat"), mark: "Mark reviewed" },
  ];
  const closeCount = closeSteps.filter((s) => s.done).length;

  return (
    <ProtoApp app={app} name="ERP · Bautista Builders Supply" user="Marites Bautista" nav={nav} inbox={inbox} search={searchItems}>
      {/* ---------------- Dashboard ---------------- */}
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Dashboard" subtitle="Thursday, October 29 · Quezon City and Pasig" action={<PrimaryButton onClick={() => openDoc("sale")}><Plus size={14} /> New quotation</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Sales today" value={peso(salesToday)} sub={`${receipts.length} counter receipts · ${sales.filter((s) => s.confirmed === 0).length} orders`} tone="good" />
            <Stat label="Receivables" value={peso(sum(openInv.map(balance)))} sub={`${peso(sum(overdueInv.map(balance)))} overdue`} tone={overdueInv.length ? "bad" : undefined} />
            <Stat label="Bills due this week" value={peso(sum(openBills.filter((b) => b.due <= 7).map(balance)))} sub={`${openBills.filter((b) => b.due <= 7).length} bills to pay`} />
            <Stat label="To reorder" value={String(toOrder.length)} sub={`${rules.filter((r) => r.need && r.rfq).length} more already in RFQs`} tone={toOrder.length ? "bad" : undefined} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3">
            <Panel title="Needs attention">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {alerts.slice(0, 8).map((a) => (
                  <li key={a.key}>
                    <button type="button" onClick={a.go} className="w-full flex items-start gap-2.5 py-2 text-left cursor-pointer group">
                      <a.icon size={14} className="mt-0.5 text-gold-bright shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{a.title}</span>
                        <span className="block text-[0.68rem] text-mist truncate">{a.note}</span>
                      </span>
                      {a.badge}
                    </button>
                  </li>
                ))}
                {alerts.length === 0 && <li className="py-2 text-[0.8rem] text-graphite">Nothing needs attention.</li>}
              </ul>
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Sales, last 7 days">
                <Bars format={(n) => `${Math.round(n / 1000)}k`} data={[{ label: "Fri", value: 214000 }, { label: "Sat", value: 236000 }, { label: "Sun", value: 88000 }, { label: "Mon", value: 198000 }, { label: "Tue", value: 221000 }, { label: "Wed", value: 247000 }, { label: "Thu", value: salesToday }]} />
              </Panel>
              <Panel title="Sales pipeline">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {([["quotes", "Open quotations"], ["orders", "To deliver"], ["toinvoice", "To invoice"]] as const).map(([f, label]) => {
                    const list = sales.filter((s) => SALE_FILTER[f].includes(s.stage));
                    return (
                      <li key={f}>
                        <button type="button" onClick={() => { setSaleFilter(f); app.section("sales"); }} className="w-full flex items-center justify-between gap-3 py-2 text-left cursor-pointer group">
                          <span>
                            <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright">{label}</span>
                            <span className="block text-[0.68rem] text-mist">{`${list.length} documents`}</span>
                          </span>
                          <span className="font-mono text-[0.8rem] text-ink">{peso(sum(list.map((s) => grand(s.lines))))}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
            <Panel title="Cash and bank" className="lg:col-span-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ACCOUNTS.map(([acct, note]) => (
                  <div key={acct}>
                    <div className="text-[0.72rem] text-mist">{acct}</div>
                    <div className="font-mono text-[0.95rem] font-semibold text-ink tabular-nums">{peso(cash[acct])}</div>
                    <div className="text-[0.66rem] text-mist">{note}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Sales ---------------- */}
      {app.screen === "sales" && (
        <>
          <ScreenHeader
            title="Sales"
            subtitle={`${sales.filter((s) => sIdx(s.stage) < 2).length} open quotations · ${sales.filter((s) => s.stage === "order").length} to deliver · ${sales.filter((s) => s.stage === "delivered").length} to invoice`}
            action={<PrimaryButton onClick={() => openDoc("sale")}><Plus size={14} /> New quotation</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={q.sales} onChange={search("sales")} placeholder="Search number or customer" />
            <Segmented id="erp-sales" value={saleFilter} onChange={setSaleFilter} options={[{ id: "all", label: "All" }, { id: "quotes", label: "Quotations" }, { id: "orders", label: "To deliver" }, { id: "toinvoice", label: "To invoice" }, { id: "invoiced", label: "Invoiced" }]} />
          </div>
          <Table
            rows={sales.filter((s) => SALE_FILTER[saleFilter].includes(s.stage) && `${s.id} ${nameOf(s.customerId)}`.toLowerCase().includes(q.sales.toLowerCase()))}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("sale", r.id, r.id)}
            empty="No documents match."
            columns={[
              { key: "id", label: "Number", render: (r) => <span><span className="block font-mono text-ink">{r.id}</span><span className="block text-[0.65rem] text-mist">{day(r.date)}</span></span> },
              { key: "customer", label: "Customer", render: (r) => <span className="text-ink-soft">{nameOf(r.customerId)}</span> },
              { key: "branch", label: "Branch", hideOnMobile: true, render: (r) => r.branch },
              { key: "total", label: "Total", align: "right", render: (r) => <span className="font-mono text-ink">{peso(grand(r.lines))}</span> },
              { key: "status", label: "Status", render: saleBadge },
            ]}
          />
        </>
      )}

      {sale && (
        <>
          <ScreenHeader
            title={`${sIdx(sale.stage) < 2 ? "Quotation" : "Sales order"} ${sale.id}`}
            subtitle={`${nameOf(sale.customerId)} · ships from ${sale.branch} · ${day(sale.date)}`}
            action={
              sIdx(sale.stage) < 2 ? (
                <>
                  {sale.stage === "draft" && <SmallButton onClick={() => sendQuote(sale)}><Send size={12} /> Send quotation</SmallButton>}
                  <PrimaryButton onClick={() => confirmSale(sale)}><Check size={14} /> Confirm order</PrimaryButton>
                </>
              ) : sale.stage === "order" ? (
                <PrimaryButton onClick={() => deliverSale(sale)}><Truck size={14} /> Validate delivery</PrimaryButton>
              ) : sale.stage === "delivered" ? (
                <PrimaryButton onClick={() => invoiceSale(sale)}><Receipt size={14} /> Create invoice</PrimaryButton>
              ) : saleInv && balance(saleInv) > 0 ? (
                <PrimaryButton onClick={() => openPay("invoice", saleInv.id)}><Wallet size={14} /> Register payment</PrimaryButton>
              ) : (
                <Status tone="good">Paid</Status>
              )
            }
          />
          <StageBar stages={SALE_STAGES} current={sale.stage} />
          {(sale.delivery || sale.invoiceId) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {sale.delivery && (
                <SmallButton onClick={() => { setInvTab("moves"); setQ((s) => ({ ...s, moves: sale.delivery ?? "" })); app.section("inventory"); }}>
                  <Truck size={12} /> Delivery {sale.delivery}
                </SmallButton>
              )}
              {sale.invoiceId && <SmallButton onClick={() => app.open("invoice", sale.invoiceId, sale.invoiceId)}><Receipt size={12} /> Invoice {sale.invoiceId}</SmallButton>}
            </div>
          )}
          {linesTable(
            sale.lines,
            sIdx(sale.stage) <= 2
              ? [{ key: "free", label: `Free at ${CODE[sale.branch]}`, align: "right", hideOnMobile: true, render: (l) => { const f = free(l.itemId, sale.branch, sale.id); return f < l.qty ? <Status tone="bad">{`${Math.max(0, f)} free`}</Status> : <span className="font-mono text-good">{f.toLocaleString()}</span>; } }]
              : [],
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <Panel title="Details">
              <KeyValues
                items={[
                  ["Customer", contactLink(sale.customerId)],
                  ["Ships from", `${sale.branch} · ${LOC[sale.branch]}`],
                  ["Payment terms", `${contact(sale.customerId)?.terms ?? 30} days`],
                  [sIdx(sale.stage) < 2 ? "Valid until" : "Confirmed", day(sIdx(sale.stage) < 2 ? sale.date + 14 : (sale.confirmed ?? sale.date))],
                  ...(saleRun ? ([["Truck", <button key="t" type="button" onClick={() => app.section("deliveries")} className={linkClass}>{`${TRUCKS.find((t) => t.id === saleRun.truckId)?.name} · ${saleRun.status}`}</button>]] as [string, React.ReactNode][]) : []),
                ]}
              />
              {sIdx(sale.stage) < 3 && overLimit(contact(sale.customerId), grand(sale.lines)) > 0 && (
                <p className="mt-3 pt-3 border-t border-rule-soft text-[0.72rem] text-danger">{`Over the ${peso(contact(sale.customerId)?.credit ?? 0)} credit limit by ${peso(overLimit(contact(sale.customerId), grand(sale.lines)))}, counting open invoices.`}</p>
              )}
            </Panel>
            <Panel title="Totals"><Totals lines={sale.lines} /></Panel>
            <Panel title="Activity" className="lg:col-span-2"><TrailList trail={sale.trail} /></Panel>
          </div>
        </>
      )}

      {/* ---------------- Purchase ---------------- */}
      {app.screen === "purchase" && (
        <>
          <ScreenHeader
            title="Purchase"
            subtitle={`${purchases.filter((p) => pIdx(p.stage) < 2).length} RFQs · ${peso(sum(purchases.filter((p) => p.stage === "order").map((p) => grand(p.lines))))} on order · ${purchases.filter((p) => p.stage === "received").length} to bill`}
            action={<PrimaryButton onClick={() => openDoc("purchase")}><Plus size={14} /> New RFQ</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={q.purchase} onChange={search("purchase")} placeholder="Search number or supplier" />
            <Segmented id="erp-po" value={poFilter} onChange={setPoFilter} options={[{ id: "all", label: "All" }, { id: "rfqs", label: "RFQs" }, { id: "orders", label: "To receive" }, { id: "tobill", label: "To bill" }, { id: "billed", label: "Billed" }]} />
          </div>
          <Table
            rows={purchases.filter((p) => PO_FILTER[poFilter].includes(p.stage) && `${p.id} ${nameOf(p.supplierId)}`.toLowerCase().includes(q.purchase.toLowerCase()))}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("purchase-doc", r.id, r.id)}
            empty="No documents match."
            columns={[
              { key: "id", label: "Number", render: (r) => <span><span className="block font-mono text-ink">{r.id}</span><span className="block text-[0.65rem] text-mist">{day(r.date)}</span></span> },
              { key: "supplier", label: "Supplier", render: (r) => <span className="text-ink-soft">{nameOf(r.supplierId)}</span> },
              { key: "branch", label: "Deliver to", hideOnMobile: true, render: (r) => r.branch },
              { key: "exp", label: "Expected", hideOnMobile: true, render: (r) => (pIdx(r.stage) >= 3 ? "Received" : r.expected <= 0 ? "Today" : day(r.expected)) },
              { key: "total", label: "Total", align: "right", render: (r) => <span className="font-mono text-ink">{peso(grand(r.lines))}</span> },
              { key: "status", label: "Status", align: "right", render: (r) => (r.stage === "order" ? <RowActions><SmallButton onClick={() => receivePo(r)}><PackageCheck size={12} /> Receive</SmallButton></RowActions> : poBadge(r)) },
            ]}
          />
        </>
      )}

      {po && (
        <>
          <ScreenHeader
            title={`${pIdx(po.stage) < 2 ? "RFQ" : "Purchase order"} ${po.id}`}
            subtitle={`${nameOf(po.supplierId)} · deliver to ${po.branch} · ${day(po.date)}`}
            action={
              pIdx(po.stage) < 2 ? (
                <>
                  {po.stage === "rfq" && <SmallButton onClick={() => sendRfq(po)}><Send size={12} /> Send RFQ</SmallButton>}
                  <PrimaryButton onClick={() => confirmPo(po)}><Check size={14} /> Confirm order</PrimaryButton>
                </>
              ) : po.stage === "order" ? (
                <PrimaryButton onClick={() => receivePo(po)}><PackageCheck size={14} /> Receive goods</PrimaryButton>
              ) : po.stage === "received" ? (
                <PrimaryButton onClick={() => billPo(po)}><FileText size={14} /> Create bill</PrimaryButton>
              ) : poBill && balance(poBill) > 0 ? (
                <PrimaryButton onClick={() => openPay("bill", poBill.id)}><Wallet size={14} /> Pay bill</PrimaryButton>
              ) : (
                <Status tone="good">Paid</Status>
              )
            }
          />
          <StageBar stages={PO_STAGES} current={po.stage} />
          {(po.receipt || po.billId) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {po.receipt && (
                <SmallButton onClick={() => { setInvTab("moves"); setQ((s) => ({ ...s, moves: po.receipt ?? "" })); app.section("inventory"); }}>
                  <PackageCheck size={12} /> Receipt {po.receipt}
                </SmallButton>
              )}
              {po.billId && <SmallButton onClick={() => app.open("bill", po.billId, po.billId)}><FileText size={12} /> Bill {po.billId}</SmallButton>}
            </div>
          )}
          {linesTable(po.lines, [{ key: "fc", label: `Forecast at ${CODE[po.branch]}`, align: "right", hideOnMobile: true, render: (l) => { const i = item(l.itemId); return i ? <span className={cn("font-mono", forecast(i, po.branch) < i.rule[po.branch].min ? "text-danger" : "text-ink-soft")}>{forecast(i, po.branch).toLocaleString()}</span> : null; } }])}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <Panel title="Details">
              <KeyValues
                items={[
                  ["Supplier", contactLink(po.supplierId)],
                  ["Deliver to", `${po.branch} · ${LOC[po.branch]}`],
                  ["Expected", pIdx(po.stage) >= 3 ? "Received" : po.expected <= 0 ? "Today" : day(po.expected)],
                  ["Payment terms", `${contact(po.supplierId)?.terms ?? 30} days`],
                ]}
              />
            </Panel>
            <Panel title="Totals"><Totals lines={po.lines} /></Panel>
            <Panel title="Activity" className="lg:col-span-2"><TrailList trail={po.trail} /></Panel>
          </div>
        </>
      )}

      {/* ---------------- Inventory ---------------- */}
      {app.screen === "inventory" && (
        <>
          <ScreenHeader
            title="Inventory"
            subtitle={`${items.length} products · ${peso(stockValue)} at cost · 2 warehouses`}
            action={<SmallButton onClick={() => openTransfer()}><ArrowLeftRight size={12} /> New transfer</SmallButton>}
          />
          <div className="mb-3 overflow-x-auto">
            <Segmented id="erp-inv-tab" value={invTab} onChange={setInvTab} options={[{ id: "products", label: "Products" }, { id: "moves", label: "Moves" }, { id: "transfers", label: "Transfers" }, { id: "reorder", label: "Reordering" }, { id: "count", label: "Stock count" }]} />
          </div>

          {invTab === "products" && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SearchBox value={q.items} onChange={search("items")} placeholder="Search product or SKU" />
                <select aria-label="Category" value={catFilter} onChange={(e) => setCatFilter(e.target.value as "all" | Category)} className={cn(inputClass, "w-auto")}>
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Table
                rows={items.filter((i) => (catFilter === "all" || i.category === catFilter) && `${i.name} ${i.sku}`.toLowerCase().includes(q.items.toLowerCase()))}
                rowKey={(r) => r.id}
                onRowClick={(r) => app.open("item", r.id, r.name)}
                empty="No products match."
                columns={[
                  { key: "name", label: "Product", render: (r) => productCell(r.id) },
                  { key: "qc", label: "Quezon City", align: "right", render: (r) => <span className="font-mono">{r.stock["Quezon City"].toLocaleString()}</span> },
                  { key: "pg", label: "Pasig", align: "right", render: (r) => <span className="font-mono">{r.stock.Pasig.toLocaleString()}</span> },
                  { key: "unit", label: "Unit", hideOnMobile: true, render: (r) => <span className="text-mist">{r.unit}</span> },
                  { key: "value", label: "Value", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono">{peso((r.stock["Quezon City"] + r.stock.Pasig) * r.cost)}</span> },
                  { key: "status", label: "Status", render: itemStatus },
                ]}
              />
            </>
          )}

          {invTab === "moves" && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SearchBox value={q.moves} onChange={search("moves")} placeholder="Search reference or product" />
                <Segmented id="erp-moves" value={moveBranch} onChange={setMoveBranch} options={[{ id: "all", label: "Both branches" }, { id: "Quezon City", label: "QC" }, { id: "Pasig", label: "Pasig" }]} />
              </div>
              <Table
                rows={moves.filter((m) => (moveBranch === "all" || branchOf(m.from) === moveBranch || branchOf(m.to) === moveBranch) && `${m.ref} ${item(m.itemId)?.name}`.toLowerCase().includes(q.moves.toLowerCase()))}
                rowKey={(m) => m.id}
                onRowClick={(m) => app.open("item", m.itemId, item(m.itemId)?.name)}
                empty="No moves match."
                columns={[
                  { key: "date", label: "Date", render: (m) => <span className="font-mono text-[0.72rem] text-mist">{day(m.date)}</span> },
                  { key: "ref", label: "Reference", render: (m) => <span className="font-mono text-ink">{m.ref}</span> },
                  { key: "item", label: "Product", render: (m) => <span className="text-ink-soft">{item(m.itemId)?.name}</span> },
                  { key: "route", label: "From → to", hideOnMobile: true, render: (m) => <span className="text-[0.72rem] text-graphite">{`${m.from} → ${m.to}`}</span> },
                  { key: "qty", label: "Qty", align: "right", render: (m) => <span className={cn("font-mono", isStock(m.to) ? "text-good" : "text-ink-soft")}>{signed(isStock(m.to) ? m.qty : -m.qty)}</span> },
                ]}
              />
            </>
          )}

          {invTab === "transfers" && (
            <>
              <p className="mb-3 text-[0.74rem] text-graphite">Ship from one branch, then receive at the other. Stock in transit counts toward the receiving branch forecast.</p>
              <Table
                rows={transfers}
                rowKey={(t) => t.id}
                onRowClick={(t) => app.open("item", t.lines[0].itemId, item(t.lines[0].itemId)?.name)}
                columns={[
                  { key: "id", label: "Transfer", render: (t) => <span><span className="block font-mono text-ink">{t.id}</span><span className="block text-[0.65rem] text-mist">{day(t.date)}</span></span> },
                  { key: "route", label: "Route", render: (t) => <span className="text-ink-soft">{`${t.from} → ${t.to}`}</span> },
                  { key: "lines", label: "Products", hideOnMobile: true, render: (t) => <span className="text-ink-soft">{t.lines.map((l) => `${l.qty} × ${item(l.itemId)?.name}`).join(", ")}</span> },
                  { key: "status", label: "Status", render: (t) => <Status tone={t.status === "Done" ? "good" : t.status === "In transit" ? "warn" : "muted"}>{t.status}</Status> },
                  {
                    key: "act",
                    label: "Action",
                    align: "right",
                    render: (t) =>
                      t.status === "Done" ? null : (
                        <RowActions>
                          {t.status === "Ready" ? <SmallButton onClick={() => shipTransfer(t)}><Truck size={11} /> Ship</SmallButton> : <SmallButton onClick={() => receiveTransfer(t)}><PackageCheck size={11} /> Receive</SmallButton>}
                        </RowActions>
                      ),
                  },
                ]}
              />
            </>
          )}

          {invTab === "reorder" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <Segmented id="erp-reorder" value={reorderView} onChange={setReorderView} options={[{ id: "need", label: "To order" }, { id: "all", label: "All rules" }]} />
                <PrimaryButton onClick={orderAll} disabled={!toOrder.length}><FileText size={14} /> Create RFQs</PrimaryButton>
              </div>
              <p className="mb-3 text-[0.74rem] text-graphite">Forecast is on hand plus incoming, minus reserved. Below the minimum, the rule suggests ordering up to the maximum.</p>
              <Table
                rows={rules.filter((r) => reorderView === "all" || r.need)}
                rowKey={(r) => r.key}
                onRowClick={(r) => app.open("item", r.item.id, r.item.name)}
                empty="Every rule is above its minimum."
                columns={[
                  { key: "item", label: "Product", render: (r) => <span className="min-w-0"><span className="block text-ink truncate">{r.item.name}</span><span className="block text-[0.65rem] text-mist truncate">{nameOf(r.item.supplierId)}</span></span> },
                  { key: "branch", label: "Branch", render: (r) => CODE[r.branch] },
                  { key: "rule", label: "Min / max", align: "right", hideOnMobile: true, render: (r) => <span className="font-mono text-mist">{`${r.min} / ${r.max}`}</span> },
                  { key: "fc", label: "Forecast", align: "right", render: (r) => <span className={cn("font-mono", r.need ? "text-danger" : "text-ink-soft")}>{r.forecast.toLocaleString()}</span> },
                  { key: "qty", label: "Suggested", align: "right", render: (r) => <span className="font-mono text-ink">{r.need ? `${r.qty.toLocaleString()} ${r.item.unit}` : "—"}</span> },
                  {
                    key: "act",
                    label: "Action",
                    align: "right",
                    render: (r) =>
                      r.rfq ? <Status tone="muted">{`In ${r.rfq.id}`}</Status> : r.need ? <RowActions><SmallButton onClick={() => orderOne(r)}><Plus size={11} /> Order</SmallButton></RowActions> : <Status tone="good">OK</Status>,
                  },
                ]}
              />
            </>
          )}

          {invTab === "count" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <Segmented id="erp-count" value={countBranch} onChange={setCountBranch} options={BRANCHES.map((b) => ({ id: b, label: b }))} />
                <PrimaryButton onClick={applyCount}><ClipboardCheck size={14} /> Apply count</PrimaryButton>
              </div>
              <p className="mb-3 text-[0.74rem] text-graphite">Type what is on the shelf. Differences post as one adjustment with its value.</p>
              <Table
                rows={countLines}
                rowKey={(l) => l.item.id}
                columns={[
                  { key: "item", label: "Product", render: (l) => <span className="min-w-0"><span className="block text-ink truncate">{l.item.name}</span><span className="block font-mono text-[0.65rem] text-mist">{l.item.bin[countBranch]}</span></span> },
                  { key: "sys", label: "System", align: "right", render: (l) => <span className="font-mono">{l.system.toLocaleString()}</span> },
                  {
                    key: "count",
                    label: "Counted",
                    align: "right",
                    render: (l) => (
                      <input
                        inputMode="numeric"
                        aria-label={`Counted ${l.item.name}`}
                        placeholder="—"
                        value={counted[`${l.item.id}|${countBranch}`] ?? ""}
                        onChange={(e) => setCounted((c) => ({ ...c, [`${l.item.id}|${countBranch}`]: e.target.value.replace(/\D/g, "") }))}
                        className="w-20 h-7 px-2 rounded-md border border-rule bg-sheet text-right font-mono text-[0.78rem] text-ink outline-none focus:border-gold"
                      />
                    ),
                  },
                  { key: "diff", label: "Difference", align: "right", render: (l) => <span className={cn("font-mono", l.diff < 0 ? "text-danger" : l.diff > 0 ? "text-good" : "text-mist")}>{l.counted === null ? "—" : signed(l.diff)}</span> },
                  { key: "val", label: "Value", align: "right", hideOnMobile: true, render: (l) => <span className="font-mono text-ink-soft">{l.diff ? `${l.diff < 0 ? "−" : "+"}${peso(Math.abs(l.diff * l.item.cost))}` : "—"}</span> },
                ]}
              />
            </>
          )}
        </>
      )}

      {it && (
        <>
          <ScreenHeader
            title={it.name}
            subtitle={`${it.sku} · ${it.category} · ${peso(it.price)} per ${unitOne(it.unit)}`}
            action={
              <>
                <SmallButton onClick={() => openTransfer(it)}><ArrowLeftRight size={12} /> Transfer</SmallButton>
                <PrimaryButton onClick={() => orderMore(it)}><Truck size={14} /> Order more</PrimaryButton>
              </>
            }
          />
          <Heading>Stock by location</Heading>
          <Table
            rows={BRANCHES}
            rowKey={(b) => b}
            columns={[
              { key: "loc", label: "Location", render: (b) => <span><span className="block text-ink">{b}</span><span className="block font-mono text-[0.65rem] text-mist">{it.bin[b]}</span></span> },
              { key: "on", label: "On hand", align: "right", render: (b) => <span className="font-mono text-ink">{it.stock[b].toLocaleString()}</span> },
              { key: "res", label: "Reserved", align: "right", hideOnMobile: true, render: (b) => <span className="font-mono">{(reserved(it.id, b) + outgoing(it.id, b)).toLocaleString()}</span> },
              { key: "in", label: "Incoming", align: "right", hideOnMobile: true, render: (b) => <span className="font-mono">{incoming(it.id, b).toLocaleString()}</span> },
              { key: "fc", label: "Forecast", align: "right", render: (b) => <span className={cn("font-mono", forecast(it, b) < it.rule[b].min ? "text-danger" : "text-ink")}>{forecast(it, b).toLocaleString()}</span> },
              { key: "rule", label: "Min / max", align: "right", hideOnMobile: true, render: (b) => <span className="font-mono text-mist">{`${it.rule[b].min} / ${it.rule[b].max}`}</span> },
            ]}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <Panel title="Product">
              <KeyValues
                items={[
                  ["Supplier", contactLink(it.supplierId)],
                  ["Lead time", `${it.lead} days`],
                  ["Cost", peso(it.cost)],
                  ["Sales price", `${peso(it.price)} before VAT`],
                  ["Margin", `${Math.round(((it.price - it.cost) / it.price) * 100)}%`],
                  ["Stock value", peso((it.stock["Quezon City"] + it.stock.Pasig) * it.cost)],
                ]}
              />
            </Panel>
            <Panel title="Reordering rules" action={<SmallButton onClick={() => openRule(it)}><Pencil size={11} /> Edit rules</SmallButton>}>
              <div className="flex flex-col gap-3">
                {BRANCHES.map((b) => {
                  const f = forecast(it, b);
                  const r = it.rule[b];
                  return (
                    <div key={b}>
                      <div className="flex justify-between text-[0.8rem]"><span className="text-ink-soft">{b}</span><span className="font-mono text-ink">{`${f} of ${r.max} max`}</span></div>
                      <Meter value={Math.max(0, f)} max={r.max} className="mt-1.5" />
                      <div className={cn("mt-1 text-[0.68rem]", f < r.min ? "text-danger" : "text-mist")}>
                        {f < r.min ? `Below the ${r.min} minimum. Suggests ${roundQty(r.max - f)} ${it.unit} from ${nameOf(it.supplierId)}.` : `Reorders when the forecast drops below ${r.min}.`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel title="Stock moves" className="lg:col-span-2">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {moves.filter((m) => m.itemId === it.id).slice(0, 8).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-[0.8rem]">
                    <span className="min-w-0"><span className="block font-mono text-ink-soft truncate">{m.ref}</span><span className="block text-[0.68rem] text-mist">{`${day(m.date)} · ${m.from} → ${m.to}`}</span></span>
                    <span className={cn("font-mono", isStock(m.to) ? "text-good" : "text-ink-soft")}>{signed(isStock(m.to) ? m.qty : -m.qty)}</span>
                  </li>
                ))}
                {moves.every((m) => m.itemId !== it.id) && <li className="py-2 text-[0.8rem] text-graphite">No moves this month.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Deliveries ---------------- */}
      {app.screen === "deliveries" && (
        <>
          <ScreenHeader title="Deliveries" subtitle={`Thursday, October 29 · ${TRUCKS.length} trucks · ${stopsLeft.length} ${stopsLeft.length === 1 ? "stop" : "stops"} to go`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Delivered today" value={`${runs.length - stopsLeft.length} of ${runs.length}`} sub={`${stopsLeft.length} still to go`} tone="good" />
            <Stat label="On the road" value={String(onRoad.length)} sub={`${trucksOut} ${trucksOut === 1 ? "truck" : "trucks"} out`} />
            <Stat label="Loading" value={String(runs.filter((r) => r.status === "Loading").length)} sub="Waiting for the driver" />
            <Stat label="To assign" value={String(unassigned.length)} sub="Confirmed, no truck yet" tone={unassigned.length ? "bad" : undefined} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-3 items-start">
            <div className="flex flex-col gap-3 lg:order-1">
              {TRUCKS.map((t) => {
                const stops = runs.filter((r) => r.truckId === t.id).sort((a, b) => a.eta - b.eta);
                const made = stops.filter((r) => r.status === "Delivered").length;
                return (
                  <Panel
                    key={t.id}
                    title={`${t.name} · ${t.driver}`}
                    action={
                      stops.some((r) => r.status === "Loading") ? (
                        <SmallButton onClick={() => sendOut(t)}><Navigation size={11} /> Send out</SmallButton>
                      ) : stops.some((r) => r.status === "On the road") ? (
                        <Status tone="warn">On the road</Status>
                      ) : (
                        <Status tone={stops.length ? "good" : "muted"}>{stops.length ? "Route done" : "Free"}</Status>
                      )
                    }
                  >
                    <div className="flex justify-between gap-3 text-[0.7rem] text-mist mb-1.5"><span>{`${t.model} · ${t.plate}`}</span><span>{`${made} of ${stops.length} delivered`}</span></div>
                    <Meter value={made} max={Math.max(1, stops.length)} />
                    <ul className="flex flex-col divide-y divide-rule-soft mt-2 -mb-1">
                      {stops.map((r) => {
                        const s = sales.find((x) => x.id === r.saleId);
                        if (!s) return null;
                        return (
                          <li key={r.saleId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                            <div className="flex-1 basis-44 min-w-0">
                              <div className="flex items-baseline gap-2 text-[0.8rem]">
                                <button type="button" onClick={() => app.open("sale", s.id, s.id)} className={cn(linkClass, "font-mono")}>{s.id}</button>
                                <span className="text-ink truncate">{nameOf(s.customerId)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[0.68rem] text-mist"><MapPin size={11} className="shrink-0" aria-hidden /><span className="truncate">{addressOf(s.customerId)}</span></div>
                              {r.status === "Delivered" && (
                                <div className="flex items-center gap-1 mt-0.5 text-[0.68rem] text-good"><Signature size={11} className="shrink-0" aria-hidden /><span className="truncate">{`${r.signedBy ? `Signed by ${r.signedBy}` : "Validated in the office"} · ${r.at}${s.delivery ? ` · ${s.delivery}` : ""}`}</span></div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {r.status === "Delivered" ? r.signedBy && <SignatureMark className="hidden sm:block w-14 h-5" /> : <span className="font-mono text-[0.72rem] text-ink-soft">{clock(r.eta)}</span>}
                              <Status tone={STOP_TONE[r.status]}>{r.status}</Status>
                              {r.status === "Loading" && <SmallButton label={`Take ${s.id} off ${t.name}`} onClick={() => unassignStop(r)}><X size={11} /></SmallButton>}
                              {r.status === "On the road" && <SmallButton onClick={() => openPod(r)}><Signature size={11} /> Confirm delivery</SmallButton>}
                            </div>
                          </li>
                        );
                      })}
                      {stops.length === 0 && <li className="py-3 text-[0.78rem] text-mist">No stops yet. Assign a confirmed order to start this route.</li>}
                    </ul>
                  </Panel>
                );
              })}
            </div>
            <Panel title="Orders to assign" className="order-first lg:order-2" action={<Status tone={unassigned.length ? "bad" : "good"}>{unassigned.length ? `${unassigned.length} waiting` : "All assigned"}</Status>}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {unassigned.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                    <div className="flex-1 basis-32 min-w-0">
                      <button type="button" onClick={() => app.open("sale", s.id, s.id)} className={cn(linkClass, "block max-w-full truncate text-[0.8rem]")}>{`${s.id} · ${nameOf(s.customerId)}`}</button>
                      <div className="text-[0.68rem] text-mist truncate">{`${s.lines.length} ${s.lines.length === 1 ? "product" : "products"} from ${s.branch} · ${contact(s.customerId)?.city}`}</div>
                    </div>
                    <select aria-label={`Assign ${s.id} to a truck`} value="" onChange={(e) => assignStop(s, e.target.value)} className={cn(inputClass, "w-auto h-8 text-[0.76rem]")}>
                      <option value="" disabled>Assign to truck…</option>
                      {TRUCKS.map((t) => <option key={t.id} value={t.id}>{`${t.name} · ${t.driver.split(" ")[0]}`}</option>)}
                    </select>
                  </li>
                ))}
                {unassigned.length === 0 && <li className="py-2 text-[0.8rem] text-graphite">Every confirmed order has a truck.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Point of sale ---------------- */}
      {app.screen === "pos" && (
        <>
          <ScreenHeader
            title="Point of sale"
            subtitle={`${posBranch} counter · opened 8:00 AM by ${posBranch === "Pasig" ? "Aileen Cruz" : "Jun Reyes"} · ${branchReceipts.length} receipts, ${peso(sum(branchReceipts.map((r) => grand(r.lines))))}`}
            action={<Segmented id="erp-pos-branch" value={posBranch} onChange={(b) => { setPosBranch(b); setCart([]); }} options={BRANCHES.map((b) => ({ id: b, label: b }))} />}
          />
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15.5rem] lg:grid-cols-[minmax(0,1fr)_17rem] gap-3">
            <div className="min-w-0">
              <div className="flex mb-2.5"><SearchBox value={q.pos} onChange={search("pos")} placeholder="Search products or scan a barcode" /></div>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {(["All", ...CATEGORIES] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setPosCat(c)} aria-pressed={posCat === c} className={cn("px-2.5 h-7 rounded-full border text-[0.72rem] cursor-pointer transition-colors", posCat === c ? "border-gold bg-gold-wash text-gold font-medium" : "border-rule bg-sheet text-graphite hover:text-ink")}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {posItems.map((i) => {
                  const left = i.stock[posBranch] - inCart(i.id);
                  return (
                    <button key={i.id} type="button" disabled={left <= 0} onClick={() => addToCart(i)} className="flex flex-col items-start min-h-[5.5rem] text-left bg-sheet border border-rule rounded-lg p-2.5 hover:border-gold disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-colors">
                      <span className="text-[0.62rem] text-mist">{i.sku}</span>
                      <span className="mt-0.5 text-[0.78rem] font-medium leading-snug text-ink">{i.name}</span>
                      <span className="mt-auto pt-1.5 flex w-full items-baseline justify-between gap-2">
                        <span className="font-mono text-[0.76rem] text-ink">{peso(i.price)}</span>
                        <span className={cn("text-[0.64rem]", left < i.rule[posBranch].min ? "text-warn" : "text-mist")}>{`${left.toLocaleString()} left`}</span>
                      </span>
                    </button>
                  );
                })}
                {posItems.length === 0 && <p className="col-span-full py-6 text-center text-[0.8rem] text-mist">No products match.</p>}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Current sale" action={cart.length ? <button type="button" onClick={() => setCart([])} className="text-[0.72rem] text-mist hover:text-ink cursor-pointer">Clear</button> : undefined}>
                {cart.length === 0 ? (
                  <p className="py-3 text-center text-[0.78rem] text-mist">Tap a product to add it.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-rule-soft -mt-1 mb-2">
                    {cartLines.map((l) => (
                      <li key={l.itemId} className="py-2">
                        <div className="flex justify-between gap-2 text-[0.76rem]">
                          <span className="text-ink leading-snug">{item(l.itemId)?.name}</span>
                          <span className="font-mono text-ink shrink-0">{peso(l.qty * l.price)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button type="button" aria-label="Remove one" onClick={() => bump(l.itemId, -1)} className="w-6 h-6 rounded-md border border-rule flex items-center justify-center text-graphite hover:bg-raised cursor-pointer"><Minus size={12} /></button>
                          <span className="w-8 text-center font-mono text-[0.76rem] text-ink">{l.qty}</span>
                          <button type="button" aria-label="Add one" onClick={() => bump(l.itemId, 1)} className="w-6 h-6 rounded-md border border-rule flex items-center justify-center text-graphite hover:bg-raised cursor-pointer"><Plus size={12} /></button>
                          <span className="text-[0.66rem] text-mist">{`× ${peso(l.price)}`}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Totals lines={cartLines} />
                <div className="mt-3 flex flex-col gap-2.5">
                  <div>
                    <Segmented id="erp-pos-pay" value={posMethod} onChange={setPosMethod} options={[{ id: "Cash", label: "Cash" }, { id: "GCash", label: "GCash" }, { id: "Card", label: "Card" }]} />
                  </div>
                  {posMethod === "Cash" ? (
                    <>
                      <input inputMode="numeric" aria-label="Cash received" placeholder="Cash received, blank if exact" value={tendered} onChange={(e) => setTendered(e.target.value.replace(/\D/g, ""))} className={inputClass} />
                      <div className="flex gap-1.5">
                        {[1000, 5000, 10000].map((n) => <SmallButton key={n} onClick={() => setTendered(String(n))}>{peso(n)}</SmallButton>)}
                      </div>
                      <div className="flex justify-between text-[0.78rem]"><span className="text-mist">Change</span><span className={cn("font-mono", cashIn >= cartTotal ? "text-ink" : "text-danger")}>{cashIn >= cartTotal ? peso(cashIn - cartTotal) : "Not enough cash"}</span></div>
                    </>
                  ) : (
                    <input aria-label={posMethod === "GCash" ? "GCash reference" : "Card approval code"} placeholder={posMethod === "GCash" ? "GCash ref no., optional" : "Approval code from the terminal"} value={posRef} onChange={(e) => setPosRef(e.target.value)} className={inputClass} />
                  )}
                  <div className="flex justify-end">
                    <PrimaryButton onClick={completeSale} disabled={!canPay}><Printer size={14} /> Complete sale</PrimaryButton>
                  </div>
                </div>
              </Panel>
              <Panel title="Today's receipts">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {branchReceipts.slice(0, 5).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 py-1.5 text-[0.74rem]">
                      <span><span className="block font-mono text-ink">{r.id}</span><span className="block text-[0.64rem] text-mist">{r.time}</span></span>
                      <span className="text-right font-mono text-ink-soft">{`${peso(grand(r.lines))} · ${r.method}`}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Contacts ---------------- */}
      {app.screen === "contacts" && (
        <>
          <ScreenHeader
            title="Contacts"
            subtitle={`${contacts.filter((c) => c.kind === "Customer").length} customers · ${contacts.filter((c) => c.kind === "Supplier").length} suppliers`}
            action={<PrimaryButton onClick={openContact}><Plus size={14} /> New contact</PrimaryButton>}
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={q.contacts} onChange={search("contacts")} placeholder="Search name, person or city" />
            <Segmented id="erp-contacts" value={contactKind} onChange={setContactKind} options={[{ id: "Customer", label: "Customers" }, { id: "Supplier", label: "Suppliers" }]} />
          </div>
          <Table
            rows={contacts.filter((c) => c.kind === contactKind && `${c.name} ${c.person} ${c.city}`.toLowerCase().includes(q.contacts.toLowerCase()))}
            rowKey={(c) => c.id}
            onRowClick={(c) => app.open("contact", c.id, c.name)}
            empty="No contacts match."
            columns={[
              { key: "name", label: "Name", render: (c) => <span className="min-w-0"><span className="block text-ink truncate">{c.name}</span><span className="block text-[0.65rem] text-mist truncate">{c.person}</span></span> },
              { key: "city", label: "City", hideOnMobile: true, render: (c) => c.city },
              { key: "terms", label: "Terms", hideOnMobile: true, render: (c) => `${c.terms} days` },
              { key: "bal", label: contactKind === "Customer" ? "Receivable" : "Payable", align: "right", render: (c) => <span className="font-mono text-ink">{peso(c.kind === "Customer" ? receivable(c.id) : payable(c.id))}</span> },
              { key: "over", label: "Overdue", align: "right", render: (c) => (overdueOf(c.id) ? <span className="font-mono text-danger">{peso(overdueOf(c.id))}</span> : <span className="text-mist">—</span>) },
            ]}
          />
        </>
      )}

      {ct && (() => {
        const isCustomer = ct.kind === "Customer";
        const bal = isCustomer ? receivable(ct.id) : payable(ct.id);
        const history = [
          ...(isCustomer
            ? [
                ...sales.filter((s) => s.customerId === ct.id).map((s) => ({ key: s.id, date: s.date, title: `${sIdx(s.stage) < 2 ? "Quotation" : "Sales order"} ${s.id}`, note: SALE_BADGE[s.stage][0], amount: grand(s.lines), go: () => app.open("sale", s.id, s.id) })),
                ...invoices.filter((i) => i.customerId === ct.id).map((i) => ({ key: i.id, date: i.issued, title: `Invoice ${i.id}`, note: balance(i) > 0 ? `${peso(balance(i))} open, due ${day(i.due)}` : "Paid", amount: grand(i.lines), go: () => app.open("invoice", i.id, i.id) })),
              ]
            : [
                ...purchases.filter((p) => p.supplierId === ct.id).map((p) => ({ key: p.id, date: p.date, title: `${pIdx(p.stage) < 2 ? "RFQ" : "Purchase order"} ${p.id}`, note: PO_BADGE[p.stage][0], amount: grand(p.lines), go: () => app.open("purchase-doc", p.id, p.id) })),
                ...bills.filter((b) => b.supplierId === ct.id).map((b) => ({ key: b.id, date: b.issued, title: `Bill ${b.id}`, note: balance(b) > 0 ? `${peso(balance(b))} open, due ${day(b.due)}` : "Paid", amount: grand(b.lines), go: () => app.open("bill", b.id, b.id) })),
              ]),
          ...payments.filter((p) => p.contactId === ct.id).map((p) => ({ key: p.id, date: p.date, title: `Payment ${p.id}`, note: `${p.method} · ${p.docId}`, amount: p.amount, go: () => app.open(p.dir === "in" ? "invoice" : "bill", p.docId, p.docId) })),
        ].sort((a, b) => b.date - a.date);
        return (
          <>
            <ScreenHeader
              title={ct.name}
              subtitle={`${ct.kind} · ${ct.city}`}
              action={
                isCustomer ? (
                  <>
                    <SmallButton onClick={() => app.notify(`Statement sent to ${ct.name}: ${peso(bal)} open`)}><Send size={12} /> Send statement</SmallButton>
                    <PrimaryButton onClick={() => openDoc("sale", ct.id)}><Plus size={14} /> New quotation</PrimaryButton>
                  </>
                ) : (
                  <PrimaryButton onClick={() => openDoc("purchase", ct.id)}><Plus size={14} /> New RFQ</PrimaryButton>
                )
              }
            />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
              <Stat label={isCustomer ? "Receivable" : "Payable"} value={peso(bal)} sub={`${(isCustomer ? openInv.filter((i) => i.customerId === ct.id) : openBills.filter((b) => b.supplierId === ct.id)).length} open documents`} />
              <Stat label="Overdue" value={peso(overdueOf(ct.id))} sub={overdueOf(ct.id) ? "Reminders running" : "Nothing late"} tone={overdueOf(ct.id) ? "bad" : "good"} />
              <Stat label={isCustomer ? "Invoiced in 2026" : "Billed in 2026"} value={peso(sum((isCustomer ? invoices.filter((i) => i.customerId === ct.id) : bills.filter((b) => b.supplierId === ct.id)).map((d) => grand(d.lines))))} sub={`${ct.terms}-day terms`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-3">
              <Panel title="Details">
                <KeyValues items={[["Contact person", ct.person], ["Phone", ct.phone], ["Address", ct.city], ["TIN", ct.tin], ["Payment terms", `${ct.terms} days`], ...(ct.credit ? ([["Credit limit", peso(ct.credit)]] as [string, React.ReactNode][]) : [])]} />
                {ct.credit && (
                  <div className="mt-3 pt-3 border-t border-rule-soft">
                    <div className="flex justify-between text-[0.72rem] text-mist"><span>Credit used</span><span className="font-mono">{`${Math.round((bal / ct.credit) * 100)}%`}</span></div>
                    <Meter value={bal} max={ct.credit} className="mt-1.5" />
                  </div>
                )}
              </Panel>
              <Panel title="History">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {history.map((h) => (
                    <li key={h.key}>
                      <button type="button" onClick={h.go} className="w-full flex items-center justify-between gap-3 py-2 text-left cursor-pointer group">
                        <span className="min-w-0">
                          <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{h.title}</span>
                          <span className="block text-[0.68rem] text-mist truncate">{`${day(h.date)} · ${h.note}`}</span>
                        </span>
                        <span className="font-mono text-[0.78rem] text-ink-soft shrink-0">{peso(h.amount)}</span>
                      </button>
                    </li>
                  ))}
                  {history.length === 0 && <li className="py-2 text-[0.8rem] text-graphite">No documents yet.</li>}
                </ul>
              </Panel>
            </div>
          </>
        );
      })()}

      {/* ---------------- Invoicing ---------------- */}
      {app.screen === "accounting" && (
        <>
          <ScreenHeader
            title="Invoicing"
            subtitle="Receivables, payables and profit · October 2026"
            action={acctTab === "invoices" && overdueInv.some((i) => !reminded.includes(i.id)) ? <SmallButton onClick={() => remind(overdueInv.filter((i) => !reminded.includes(i.id)))}><Send size={12} /> Remind all overdue</SmallButton> : undefined}
          />
          <div className="mb-3 overflow-x-auto">
            <Segmented id="erp-acct" value={acctTab} onChange={setAcctTab} options={[{ id: "invoices", label: "Customer invoices" }, { id: "bills", label: "Vendor bills" }, { id: "payments", label: "Payments" }, { id: "pnl", label: "Profit and loss" }]} />
          </div>

          {acctTab === "invoices" && (
            <>
              <Heading>Receivables aging</Heading>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {BUCKETS.map(([label, from, to], k) => {
                  const list = openInv.filter((i) => -i.due >= from && -i.due <= to);
                  return <Tile key={label} label={label} value={peso(sum(list.map(balance)))} note={`${list.length} invoices`} on={bucketOn === k} alert={k >= 2 && list.length > 0} onClick={() => { setBucketOn(bucketOn === k ? null : k); setInvFilter("open"); }} />;
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Segmented id="erp-invf" value={invFilter} onChange={(v) => { setInvFilter(v); setBucketOn(null); }} options={[{ id: "open", label: "Open" }, { id: "overdue", label: "Overdue" }, { id: "paid", label: "Paid" }, { id: "all", label: "All" }]} />
                {bucketOn !== null && <SmallButton onClick={() => setBucketOn(null)}><X size={11} /> {BUCKETS[bucketOn][0]}</SmallButton>}
              </div>
              <Table
                rows={invoices.filter((i) => {
                  const open = balance(i) > 0;
                  const byStatus = invFilter === "all" || (invFilter === "paid" ? !open : open && (invFilter === "open" || i.due < 0));
                  const byBucket = bucketOn === null || (open && -i.due >= BUCKETS[bucketOn][1] && -i.due <= BUCKETS[bucketOn][2]);
                  return byStatus && byBucket;
                })}
                rowKey={(r) => r.id}
                onRowClick={(r) => app.open("invoice", r.id, r.id)}
                empty="No invoices here."
                columns={[
                  { key: "id", label: "Invoice", render: (r) => <span className="min-w-0"><span className="block text-ink truncate">{nameOf(r.customerId)}</span><span className="block font-mono text-[0.65rem] text-mist">{`${r.id} · due ${day(r.due)}`}</span></span> },
                  { key: "bal", label: "Balance", align: "right", render: (r) => <span className="font-mono text-ink">{peso(balance(r))}</span> },
                  { key: "status", label: "Status", hideOnMobile: true, render: invStatus },
                  {
                    key: "act",
                    label: "Action",
                    align: "right",
                    render: (r) =>
                      balance(r) <= 0 ? null : (
                        <RowActions>
                          {r.due < 0 && (reminded.includes(r.id) ? <Status tone="muted">Reminded</Status> : <SmallButton onClick={() => remind([r])}><Send size={11} /> Remind</SmallButton>)}
                          <SmallButton onClick={() => openPay("invoice", r.id)}>Register payment</SmallButton>
                        </RowActions>
                      ),
                  },
                ]}
              />
            </>
          )}

          {acctTab === "bills" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <Stat label="Due this week" value={peso(sum(openBills.filter((b) => b.due >= 0 && b.due <= 7).map(balance)))} sub={`${openBills.filter((b) => b.due >= 0 && b.due <= 7).length} bills`} />
                <Stat label="Overdue" value={peso(sum(openBills.filter((b) => b.due < 0).map(balance)))} sub={`${openBills.filter((b) => b.due < 0).length} bills`} tone={openBills.some((b) => b.due < 0) ? "bad" : undefined} />
                <Stat label="Paid in October" value={peso(sum(payments.filter((p) => p.dir === "out" && p.date >= -28).map((p) => p.amount)))} sub="From BDO and BPI" />
              </div>
              <Table
                rows={bills}
                rowKey={(r) => r.id}
                onRowClick={(r) => app.open("bill", r.id, r.id)}
                columns={[
                  { key: "id", label: "Bill", render: (r) => <span className="min-w-0"><span className="block text-ink truncate">{nameOf(r.supplierId)}</span><span className="block font-mono text-[0.65rem] text-mist">{`${r.id} · ${r.ref}`}</span></span> },
                  { key: "po", label: "Matched to", hideOnMobile: true, render: (r) => <span className="font-mono text-[0.74rem] text-ink-soft">{r.poId ?? "—"}</span> },
                  { key: "bal", label: "Balance", align: "right", render: (r) => <span className="font-mono text-ink">{peso(balance(r))}</span> },
                  { key: "status", label: "Status", hideOnMobile: true, render: billStatus },
                  { key: "act", label: "Action", align: "right", render: (r) => (balance(r) > 0 ? <RowActions><SmallButton onClick={() => openPay("bill", r.id)}><Wallet size={11} /> Pay</SmallButton></RowActions> : null) },
                ]}
              />
            </>
          )}

          {acctTab === "payments" && (
            <>
              <div className="mb-3">
                <Segmented id="erp-paydir" value={payDir} onChange={setPayDir} options={[{ id: "all", label: "All" }, { id: "in", label: "Received" }, { id: "out", label: "Sent" }]} />
              </div>
              <Table
                rows={payments.filter((p) => payDir === "all" || p.dir === payDir)}
                rowKey={(p) => p.id}
                onRowClick={(p) => app.open(p.dir === "in" ? "invoice" : "bill", p.docId, p.docId)}
                columns={[
                  { key: "id", label: "Payment", render: (p) => <span><span className="block font-mono text-ink">{p.id}</span><span className="block text-[0.65rem] text-mist">{day(p.date)}</span></span> },
                  { key: "who", label: "Contact", render: (p) => <span className="text-ink-soft">{nameOf(p.contactId)}</span> },
                  { key: "method", label: "Method", hideOnMobile: true, render: (p) => <span><span className="block">{p.method}</span><span className="block font-mono text-[0.65rem] text-mist">{p.ref || "—"}</span></span> },
                  { key: "doc", label: "Applied to", hideOnMobile: true, render: (p) => <span className="font-mono text-[0.74rem]">{p.docId}</span> },
                  { key: "amt", label: "Amount", align: "right", render: (p) => <span className={cn("font-mono", p.dir === "in" ? "text-good" : "text-ink")}>{`${p.dir === "in" ? "+" : "−"}${peso(p.amount)}`}</span> },
                ]}
              />
            </>
          )}

          {acctTab === "pnl" && (
            <Panel title="Profit and loss, October 2026" action={<Status tone="muted">Month to date</Status>}>
              <table className="w-full text-[0.8rem]">
                <thead>
                  <tr className="text-[0.7rem] text-mist">
                    <th className="text-left font-medium pb-2">Account</th>
                    <th className="text-right font-medium pb-2">October</th>
                    <th className="text-right font-medium pb-2 hidden sm:table-cell">September</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Invoiced sales", oct: invoicedRev, sep: SEPT.invoiced },
                    { label: "Counter sales", oct: posRev, sep: SEPT.pos },
                    { label: "Revenue", oct: revenue, sep: septRev, strong: true },
                    { label: "Cost of goods sold", oct: -cogs, sep: -SEPT.cogs },
                    { label: "Gross profit", oct: gross, sep: septGross, strong: true },
                    ...OPEX.map(([label, oct, sep]) => ({ label, oct: -oct, sep: -sep })),
                    { label: "Net income", oct: net, sep: septGross - sum(OPEX.map((o) => o[2])), strong: true },
                  ].map((r) => (
                    <tr key={r.label} className={cn("border-t", "strong" in r && r.strong ? "border-rule" : "border-rule-soft")}>
                      <td className={cn("py-1.5", "strong" in r && r.strong ? "font-semibold text-ink" : "pl-3 text-ink-soft")}>{r.label}</td>
                      <td className={cn("py-1.5 text-right font-mono", "strong" in r && r.strong ? "font-semibold text-ink" : "text-ink-soft")}>{r.oct < 0 ? `−${peso(-r.oct)}` : peso(r.oct)}</td>
                      <td className="py-1.5 text-right font-mono text-mist hidden sm:table-cell">{r.sep < 0 ? `−${peso(-r.sep)}` : peso(r.sep)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 pt-3 border-t border-rule-soft text-[0.72rem] text-mist">{`Gross margin ${Math.round((gross / revenue) * 100)}% · net margin ${Math.round((net / revenue) * 100)}%. October updates as you invoice and sell at the counter.`}</p>
            </Panel>
          )}
        </>
      )}

      {inv && (
        <>
          <ScreenHeader
            title={inv.id}
            subtitle={`${nameOf(inv.customerId)} · issued ${day(inv.issued)} · due ${day(inv.due)}`}
            action={
              balance(inv) > 0 ? (
                <>
                  {reminded.includes(inv.id) ? <Status tone="muted">Reminded today</Status> : <SmallButton onClick={() => remind([inv])}><Send size={12} /> Send reminder</SmallButton>}
                  <PrimaryButton onClick={() => openPay("invoice", inv.id)}><Wallet size={14} /> Register payment</PrimaryButton>
                </>
              ) : (
                <Status tone="good">Paid</Status>
              )
            }
          />
          {linesTable(inv.lines)}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <Panel title="Details">
              <KeyValues
                items={[
                  ["Customer", contactLink(inv.customerId)],
                  ["Source", inv.saleId ? <button key="s" type="button" onClick={() => app.open("sale", inv.saleId, inv.saleId)} className={linkClass}>{inv.saleId}</button> : "Entered directly"],
                  ["Status", invStatus(inv)],
                  ["Payment terms", `${contact(inv.customerId)?.terms ?? 30} days`],
                  ["Pay to", "BDO 0093-4471-28 or GCash"],
                ]}
              />
            </Panel>
            <Panel title="Totals"><Totals lines={inv.lines} paid={inv.paid} /></Panel>
            <Panel title="Activity" className="lg:col-span-2"><TrailList trail={inv.log} /></Panel>
          </div>
        </>
      )}

      {bill && (
        <>
          <ScreenHeader
            title={bill.id}
            subtitle={`${nameOf(bill.supplierId)} · supplier invoice ${bill.ref} · due ${day(bill.due)}`}
            action={balance(bill) > 0 ? <PrimaryButton onClick={() => openPay("bill", bill.id)}><Wallet size={14} /> Pay bill</PrimaryButton> : <Status tone="good">Paid</Status>}
          />
          {linesTable(bill.lines)}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <Panel title="Three-way match" action={billOrder ? <Status tone="good">Quantities match</Status> : <Status tone="muted">No PO</Status>}>
              {billOrder ? (
                <ul className="flex flex-col divide-y divide-rule-soft -my-1 text-[0.8rem]">
                  {([["Purchase order", billOrder.id, "purchase-doc"], ["Receipt", billOrder.receipt ?? "—", ""], ["Vendor bill", bill.id, ""]] as const).map(([label, ref, screen]) => (
                    <li key={label} className="flex items-center justify-between gap-3 py-2">
                      <span className="text-ink-soft">{label}</span>
                      {screen ? <button type="button" onClick={() => app.open(screen, ref, ref)} className={cn(linkClass, "font-mono")}>{ref}</button> : <span className="font-mono text-ink">{ref}</span>}
                      <span className="font-mono text-mist">{`${sum(bill.lines.map((l) => l.qty)).toLocaleString()} units`}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[0.78rem] text-graphite">Entered from the supplier invoice without a purchase order. Check quantities against the delivery receipt.</p>
              )}
            </Panel>
            <Panel title="Totals"><Totals lines={bill.lines} paid={bill.paid} /></Panel>
            <Panel title="Activity" className="lg:col-span-2"><TrailList trail={bill.log} /></Panel>
          </div>
        </>
      )}

      {/* ---------------- Reports ---------------- */}
      {app.screen === "reports" && (
        <>
          <ScreenHeader title="Reports" subtitle="October 2026, month to date · both branches" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Revenue" value={millions(revenue)} sub={`${revenue >= septRev ? "+" : "−"}${Math.abs(Math.round(((revenue - septRev) / septRev) * 100))}% vs September`} tone={revenue >= septRev ? "good" : "bad"} />
            <Stat label="Gross margin" value={`${Math.round((gross / revenue) * 100)}%`} sub={`${millions(gross)} gross profit`} />
            <Stat label="Inventory value" value={millions(stockValue)} sub="At cost, both branches" />
            <Stat label="VAT payable" value={peso(outputVat - inputVat)} sub="Output less input VAT" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Revenue vs costs">
              <PairBars data={[...MONTHS, { label: "Oct", rev: revenue, exp: cogs + opex }]} />
            </Panel>
            <Panel title="Sales by branch">
              <div className="flex flex-col gap-3">
                {BRANCHES.map((b) => {
                  const total = branchSales("Quezon City") + branchSales("Pasig");
                  return (
                    <div key={b}>
                      <div className="flex justify-between text-[0.8rem]"><span className="text-ink-soft">{b}</span><span className="font-mono text-ink">{`${peso(branchSales(b))} · ${Math.round((branchSales(b) / total) * 100)}%`}</span></div>
                      <Meter value={branchSales(b)} max={total} className="mt-1.5" />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-rule-soft text-[0.74rem] font-semibold text-ink mb-2">Margin by category</div>
              <ul className="flex flex-col gap-2">
                {CATEGORIES.map((cat) => {
                  const inCat = items.filter((i) => i.category === cat);
                  const margin = Math.round((sum(inCat.map((i) => (i.price - i.cost) / i.price)) / inCat.length) * 100);
                  return (
                    <li key={cat} className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-[0.76rem]">
                      <span className="text-ink-soft">{cat}</span>
                      <Meter value={margin} max={40} />
                      <span className="font-mono text-ink text-right">{`${margin}%`}</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel title="Top customers, October">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {contacts
                  .filter((c) => c.kind === "Customer")
                  .map((c) => ({ c, total: sum(octInv.filter((i) => i.customerId === c.id).map((i) => sub(i.lines))) }))
                  .filter((x) => x.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5)
                  .map(({ c, total }) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => app.open("contact", c.id, c.name)} className="w-full flex items-center justify-between gap-3 py-2 text-left cursor-pointer group">
                        <span className="text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{c.name}</span>
                        <span className="font-mono text-[0.78rem] text-ink-soft">{peso(total)}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </Panel>
            <Panel title="VAT summary">
              <dl className="flex flex-col gap-1.5 text-[0.8rem]">
                <div className="flex justify-between"><dt className="text-mist">Output VAT on sales</dt><dd className="font-mono text-ink-soft">{peso(outputVat)}</dd></div>
                <div className="flex justify-between"><dt className="text-mist">Input VAT on purchases</dt><dd className="font-mono text-ink-soft">{`−${peso(inputVat)}`}</dd></div>
                <div className="flex justify-between pt-1.5 border-t border-rule-soft"><dt className="text-ink font-medium">Net VAT payable</dt><dd className="font-mono text-ink font-semibold">{peso(outputVat - inputVat)}</dd></div>
              </dl>
              <p className="mt-3 text-[0.7rem] text-mist">Built from posted invoices, counter receipts and vendor bills. Your accountant files from this.</p>
            </Panel>
            <Panel title="Month-end close" className="lg:col-span-2" action={locked ? <Status tone="good">October locked</Status> : <Status tone={closeCount === closeSteps.length ? "good" : "warn"}>{`${closeCount} of ${closeSteps.length} done`}</Status>}>
              <Meter value={closeCount} max={closeSteps.length} className="mb-3" />
              <ul className="flex flex-col divide-y divide-rule-soft">
                {closeSteps.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex items-start gap-2.5 min-w-0">
                      <span className={cn("mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0", s.done ? "bg-good border-good text-sheet" : "border-rule")} aria-hidden>{s.done && <Check size={10} strokeWidth={3} />}</span>
                      <span className="min-w-0">
                        <span className="block text-[0.8rem] text-ink">{s.label}</span>
                        <span className="block text-[0.68rem] text-mist">{s.note}</span>
                      </span>
                    </span>
                    {s.done ? (
                      <Status tone="good">Done</Status>
                    ) : "fix" in s && s.fix ? (
                      <SmallButton onClick={s.fix}>Review</SmallButton>
                    ) : "mark" in s && s.mark ? (
                      <SmallButton disabled={locked} onClick={() => { setCloseDone((d) => [...d, s.id]); app.notify(`${s.label}`); }}>{s.mark}</SmallButton>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-end gap-2 mt-3">
                {closeCount < closeSteps.length && <span className="text-[0.72rem] text-mist">Finish every step to lock the period.</span>}
                <PrimaryButton
                  disabled={closeCount < closeSteps.length || locked}
                  onClick={() => {
                    setLocked(true);
                    app.notify("October locked. P&L, balance sheet and VAT summary sent to Reyes & Co. CPAs.");
                  }}
                >
                  <Lock size={13} /> Lock October
                </PrimaryButton>
              </div>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Slide-over forms ---------------- */}
      <ProtoModal
        open={modal === "doc"}
        title={doc.kind === "sale" ? "New quotation" : "New RFQ"}
        onClose={closeModal}
        footer={<PrimaryButton onClick={createDoc} disabled={!docLines(doc).length}>{doc.kind === "sale" ? "Create quotation" : "Create RFQ"}</PrimaryButton>}
      >
        <Field label={doc.kind === "sale" ? "Customer" : "Supplier"}>
          <select value={doc.partyId} onChange={(e) => setDoc({ ...doc, partyId: e.target.value })} className={inputClass}>
            {contacts.filter((c) => c.kind === (doc.kind === "sale" ? "Customer" : "Supplier")).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label={doc.kind === "sale" ? "Ships from" : "Deliver to"}>
          <select value={doc.branch} onChange={(e) => setDoc({ ...doc, branch: e.target.value as Branch })} className={inputClass}>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.76rem] font-medium text-ink-soft">Products</span>
          {doc.lines.length > 0 && (
            <ul className="rounded-lg border border-rule divide-y divide-rule-soft">
              {docLines({ ...doc, pickQty: "" }).map((l) => (
                <li key={l.itemId} className="flex items-center gap-2 px-2.5 py-2 text-[0.76rem]">
                  <span className="flex-1 min-w-0 text-ink truncate">{`${l.qty} × ${item(l.itemId)?.name}`}</span>
                  <span className="font-mono text-ink-soft">{peso(l.qty * l.price)}</span>
                  <button type="button" aria-label={`Remove ${item(l.itemId)?.name}`} onClick={() => setDoc((d) => ({ ...d, lines: d.lines.filter((x) => x.itemId !== l.itemId) }))} className="w-6 h-6 rounded-md flex items-center justify-center text-mist hover:bg-raised hover:text-ink cursor-pointer"><X size={12} /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <select aria-label="Product" value={doc.pick} onChange={(e) => setDoc({ ...doc, pick: e.target.value })} className={cn(inputClass, "flex-1 min-w-0")}>
              {items.map((i) => <option key={i.id} value={i.id}>{`${i.name} · ${peso(doc.kind === "sale" ? i.price : i.cost)}`}</option>)}
            </select>
            <input inputMode="numeric" aria-label="Quantity" placeholder="Qty" value={doc.pickQty} onChange={(e) => setDoc({ ...doc, pickQty: e.target.value.replace(/\D/g, "") })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDocLine(); } }} className={cn(inputClass, "w-20")} />
            <SmallButton onClick={addDocLine} disabled={!Number(doc.pickQty)}><Plus size={12} /> Add</SmallButton>
          </div>
          <span className="text-[0.7rem] text-mist">{`${free(doc.pick, doc.branch)} ${item(doc.pick)?.unit} free at ${doc.branch} · ${doc.kind === "sale" ? "prices before VAT" : `${item(doc.pick)?.lead}-day lead time`}`}</span>
        </div>
        <div className="pt-3 border-t border-rule">
          <Totals lines={docLines(doc)} />
        </div>
      </ProtoModal>

      <ProtoModal
        open={modal === "pay"}
        title={pay.kind === "invoice" ? "Register payment" : "Pay vendor bill"}
        onClose={closeModal}
        footer={<PrimaryButton onClick={recordPay} disabled={!Number(pay.amount)}>{pay.kind === "invoice" ? "Record payment" : "Record bill payment"}</PrimaryButton>}
      >
        <KeyValues items={[["Document", pay.docId], [pay.kind === "invoice" ? "Customer" : "Supplier", nameOf(payParty)], ["Amount due", payDoc ? peso(balance(payDoc)) : "—"]]} />
        <Field label="Amount (₱)">
          <input inputMode="numeric" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} />
        </Field>
        <Field label="Method">
          <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value as Method })} className={inputClass}>
            {(pay.kind === "invoice" ? (["Bank transfer", "GCash", "Maya", "Check", "Cash", "Card"] as Method[]) : (["Bank transfer", "Check"] as Method[])).map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Reference number">
          <input value={pay.ref} onChange={(e) => setPay({ ...pay, ref: e.target.value })} className={inputClass} placeholder={pay.method === "GCash" || pay.method === "Maya" ? "13-digit ref from the receipt" : pay.method === "Check" ? "Bank and check number" : "Bank reference"} />
        </Field>
        <p className="text-[0.72rem] text-graphite">{`${pay.kind === "invoice" ? "Deposits to" : "Pays from"} ${ACCOUNT_FOR[pay.method]}. A partial amount leaves the rest open.`}</p>
      </ProtoModal>

      <ProtoModal open={modal === "transfer"} title="New transfer" onClose={closeModal} footer={<PrimaryButton onClick={createTransfer} disabled={!Number(tf.qty) || Number(tf.qty) > free(tf.itemId, tf.from)}>Create transfer</PrimaryButton>}>
        <Field label="From">
          <select value={tf.from} onChange={(e) => setTf({ ...tf, from: e.target.value as Branch })} className={inputClass}>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <KeyValues items={[["To", other(tf.from)]]} />
        <Field label="Product">
          <select value={tf.itemId} onChange={(e) => setTf({ ...tf, itemId: e.target.value })} className={inputClass}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </Field>
        <Field label={`Quantity (${item(tf.itemId)?.unit})`}>
          <input inputMode="numeric" value={tf.qty} onChange={(e) => setTf({ ...tf, qty: e.target.value.replace(/\D/g, "") })} className={inputClass} />
        </Field>
        <p className={cn("text-[0.72rem]", Number(tf.qty) > free(tf.itemId, tf.from) ? "text-danger" : "text-graphite")}>
          {`${free(tf.itemId, tf.from)} free at ${tf.from}, ${item(tf.itemId)?.stock[other(tf.from)]} at ${other(tf.from)}.`}
        </p>
      </ProtoModal>

      <ProtoModal open={modal === "pod"} title="Confirm delivery" onClose={closeModal} footer={<PrimaryButton onClick={confirmStop} disabled={!pod.signed || !pod.by.trim()}><Check size={14} /> Confirm delivery</PrimaryButton>}>
        <KeyValues items={[["Order", podSale?.id ?? "—"], ["Customer", nameOf(podSale?.customerId)], ["Address", addressOf(podSale?.customerId ?? "")], ["Products", podSale ? podSale.lines.map((l) => `${l.qty.toLocaleString()} ${item(l.itemId)?.unit}`).join(", ") : "—"]]} />
        <Field label="Received by">
          <input value={pod.by} onChange={(e) => setPod({ ...pod, by: e.target.value })} className={inputClass} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.76rem] font-medium text-ink-soft">Customer signature</span>
          <button type="button" onClick={() => setPod({ ...pod, signed: true })} className="h-24 rounded-lg border border-dashed border-mist bg-paper flex items-center justify-center text-[0.76rem] text-mist cursor-pointer">
            {pod.signed ? <SignatureMark draw className="w-40 h-14" /> : "Tap to sign"}
          </button>
        </div>
        <p className="text-[0.72rem] text-graphite">{`Confirming validates the delivery, takes the stock out of ${podSale?.branch ?? "the branch"}, and leaves the order ready to invoice.`}</p>
      </ProtoModal>

      <ProtoModal open={modal === "rule"} title="Edit reordering rules" onClose={closeModal} footer={<PrimaryButton onClick={saveRule}>Save rules</PrimaryButton>}>
        <p className="text-[0.78rem] text-ink">{item(rf.itemId)?.name}</p>
        {BRANCHES.map((b) => (
          <div key={b} className="grid grid-cols-2 gap-2">
            {(["min", "max"] as const).map((k) => (
              <Field key={k} label={`${b} ${k === "min" ? "minimum" : "maximum"}`}>
                <input inputMode="numeric" value={rf.values[b][k]} onChange={(e) => setRf({ ...rf, values: { ...rf.values, [b]: { ...rf.values[b], [k]: e.target.value.replace(/\D/g, "") } } })} className={inputClass} />
              </Field>
            ))}
          </div>
        ))}
        <p className="text-[0.72rem] text-graphite">{`Tip: a minimum near ${item(rf.itemId)?.lead ?? 3} days of sales plus a buffer keeps the shelf full while the supplier delivers.`}</p>
      </ProtoModal>

      <ProtoModal open={modal === "contact"} title="New contact" onClose={closeModal} footer={<PrimaryButton onClick={saveContact} disabled={!cf.name.trim()}>Save contact</PrimaryButton>}>
        <Field label="Type">
          <select value={cf.kind} onChange={(e) => setCf({ ...cf, kind: e.target.value as "Customer" | "Supplier" })} className={inputClass}>
            <option>Customer</option>
            <option>Supplier</option>
          </select>
        </Field>
        <Field label="Company name">
          <input value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} placeholder="Reyes Hardware Marikina" className={inputClass} />
        </Field>
        <Field label="Contact person">
          <input value={cf.person} onChange={(e) => setCf({ ...cf, person: e.target.value })} placeholder="Allan Reyes" className={inputClass} />
        </Field>
        <Field label="Mobile number">
          <input value={cf.phone} onChange={(e) => setCf({ ...cf, phone: e.target.value })} placeholder="0917 555 0100" className={inputClass} />
        </Field>
        <Field label="City">
          <input value={cf.city} onChange={(e) => setCf({ ...cf, city: e.target.value })} placeholder="Marikina" className={inputClass} />
        </Field>
        <Field label="Payment terms">
          <select value={cf.terms} onChange={(e) => setCf({ ...cf, terms: e.target.value })} className={inputClass}>
            {["0", "7", "15", "30", "45"].map((t) => <option key={t} value={t}>{t === "0" ? "Cash on delivery" : `${t} days`}</option>)}
          </select>
        </Field>
      </ProtoModal>
    </ProtoApp>
  );
}
