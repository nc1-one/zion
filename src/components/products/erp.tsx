"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, ClipboardList, LayoutDashboard, Package, PackageCheck, Receipt, Search, Send, ShoppingCart, Truck } from "lucide-react";
import { Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

const peso = (n: number) => `₱${n.toLocaleString()}`;
const millions = (n: number) => `₱${(n / 1_000_000).toFixed(2)}M`;

type Branch = "Quezon City" | "Pasig";
const BRANCHES: Branch[] = ["Quezon City", "Pasig"];
type Category = "Cement" | "Steel" | "Tiles" | "Paint" | "Plumbing" | "Lumber";
type OrderStatus = "Pending" | "Shipped" | "Delivered";

interface Item { id: string; sku: string; name: string; unit: string; category: Category; stock: Record<Branch, number>; reorder: number; cost: number; price: number; supplier: string; lead: number; daily: number }
interface Move { id: string; itemId: string; date: string; text: string; qty: number; branch: Branch }
interface Line { itemId: string; qty: number; price: number }
interface Order { id: string; customer: string; branch: Branch; date: string; deliver: string; status: OrderStatus; lines: Line[]; invoice?: string }
interface PO { id: string; supplier: string; itemId: string; qty: number; branch: Branch; expected: string; status: "Ordered" | "Received" }
interface Invoice { id: string; customer: string; balance: number; issued: string; due: string; late: number; paid: boolean; log: string[] }
interface CloseStep { id: string; label: string; note: string; auto: boolean; done: boolean }

// Ids for records created in the prototype. Only called from event handlers.
let seq = 100;
const nextId = (prefix: string) => `${prefix}${++seq}`;

const ITEMS: Item[] = [
  { id: "i1", sku: "CEM-040", name: "Portland cement 40kg", unit: "bags", category: "Cement", stock: { "Quezon City": 180, Pasig: 64 }, reorder: 300, cost: 235, price: 265, supplier: "Rizal Cement Trading", lead: 3, daily: 38 },
  { id: "i2", sku: "RB-010", name: "Deformed bar 10mm × 6m", unit: "pcs", category: "Steel", stock: { "Quezon City": 420, Pasig: 260 }, reorder: 400, cost: 168, price: 195, supplier: "Valenzuela Steel Corp.", lead: 5, daily: 40 },
  { id: "i3", sku: "RB-012", name: "Deformed bar 12mm × 6m", unit: "pcs", category: "Steel", stock: { "Quezon City": 95, Pasig: 40 }, reorder: 250, cost: 245, price: 285, supplier: "Valenzuela Steel Corp.", lead: 5, daily: 22 },
  { id: "i4", sku: "TL-6060", name: "Ceramic floor tile 60×60", unit: "boxes", category: "Tiles", stock: { "Quezon City": 340, Pasig: 210 }, reorder: 200, cost: 410, price: 520, supplier: "Laguna Tile Center", lead: 7, daily: 18 },
  { id: "i5", sku: "PT-W04", name: "Latex paint, white 4L", unit: "cans", category: "Paint", stock: { "Quezon City": 26, Pasig: 22 }, reorder: 60, cost: 520, price: 680, supplier: "Pasig Paint Supply", lead: 2, daily: 9 },
  { id: "i6", sku: "PV-075", name: "PVC pipe ¾ in × 3m", unit: "pcs", category: "Plumbing", stock: { "Quezon City": 310, Pasig: 190 }, reorder: 150, cost: 85, price: 115, supplier: "Caloocan Pipe & Fittings", lead: 4, daily: 20 },
  { id: "i7", sku: "PW-012", name: "Marine plywood ½ in", unit: "sheets", category: "Lumber", stock: { "Quezon City": 48, Pasig: 31 }, reorder: 80, cost: 890, price: 1080, supplier: "Bulacan Lumber Yard", lead: 6, daily: 7 },
  { id: "i8", sku: "GI-026", name: "GI roofing sheet, gauge 26", unit: "sheets", category: "Steel", stock: { "Quezon City": 140, Pasig: 95 }, reorder: 120, cost: 380, price: 465, supplier: "Valenzuela Steel Corp.", lead: 5, daily: 9 },
];

const MOVES: Move[] = [
  { id: "m1", itemId: "i1", date: "Oct 28", text: "Shipped SO-2416", qty: -80, branch: "Quezon City" },
  { id: "m2", itemId: "i1", date: "Oct 27", text: "Shipped SO-2414", qty: -50, branch: "Quezon City" },
  { id: "m3", itemId: "i1", date: "Oct 26", text: "Counter sales", qty: -42, branch: "Pasig" },
  { id: "m4", itemId: "i1", date: "Oct 22", text: "Received PO-0866", qty: 300, branch: "Quezon City" },
  { id: "m5", itemId: "i2", date: "Oct 28", text: "Shipped SO-2416", qty: -200, branch: "Quezon City" },
  { id: "m6", itemId: "i2", date: "Oct 24", text: "Received PO-0868", qty: 300, branch: "Quezon City" },
  { id: "m7", itemId: "i3", date: "Oct 27", text: "Transfer to Pasig", qty: -40, branch: "Quezon City" },
  { id: "m8", itemId: "i3", date: "Oct 25", text: "Counter sales", qty: -36, branch: "Quezon City" },
  { id: "m9", itemId: "i4", date: "Oct 27", text: "Shipped SO-2413", qty: -25, branch: "Pasig" },
  { id: "m10", itemId: "i5", date: "Oct 28", text: "Shipped SO-2415", qty: -4, branch: "Pasig" },
  { id: "m11", itemId: "i5", date: "Oct 26", text: "Counter sales", qty: -11, branch: "Quezon City" },
  { id: "m12", itemId: "i6", date: "Oct 28", text: "Shipped SO-2415", qty: -60, branch: "Pasig" },
  { id: "m13", itemId: "i6", date: "Oct 27", text: "Received PO-0869", qty: 200, branch: "Quezon City" },
  { id: "m14", itemId: "i7", date: "Oct 27", text: "Shipped SO-2414", qty: -30, branch: "Quezon City" },
  { id: "m15", itemId: "i8", date: "Oct 28", text: "Shipped SO-2416", qty: -50, branch: "Quezon City" },
];

const ORDERS: Order[] = [
  { id: "SO-2418", customer: "Dela Cruz Builders", branch: "Quezon City", date: "Oct 29", deliver: "Fairview, Quezon City", status: "Pending", lines: [{ itemId: "i1", qty: 120, price: 265 }, { itemId: "i3", qty: 60, price: 285 }] },
  { id: "SO-2417", customer: "Ramos Interiors", branch: "Pasig", date: "Oct 29", deliver: "Kapitolyo, Pasig", status: "Pending", lines: [{ itemId: "i4", qty: 40, price: 520 }, { itemId: "i5", qty: 6, price: 680 }] },
  { id: "SO-2416", customer: "Garcia Construction", branch: "Quezon City", date: "Oct 28", deliver: "Batasan Hills, Quezon City", status: "Shipped", lines: [{ itemId: "i2", qty: 200, price: 195 }, { itemId: "i8", qty: 50, price: 465 }, { itemId: "i1", qty: 80, price: 265 }] },
  { id: "SO-2415", customer: "Villanueva Hardware", branch: "Pasig", date: "Oct 28", deliver: "Rosario, Pasig", status: "Delivered", lines: [{ itemId: "i6", qty: 60, price: 115 }, { itemId: "i5", qty: 4, price: 680 }] },
  { id: "SO-2414", customer: "Santos & Sons Contractors", branch: "Quezon City", date: "Oct 27", deliver: "Novaliches, Quezon City", status: "Delivered", lines: [{ itemId: "i7", qty: 30, price: 1080 }, { itemId: "i1", qty: 50, price: 265 }] },
  { id: "SO-2413", customer: "Mendoza Kitchens", branch: "Pasig", date: "Oct 27", deliver: "Ugong, Pasig", status: "Shipped", lines: [{ itemId: "i4", qty: 25, price: 520 }] },
];

const POS: PO[] = [
  { id: "PO-0871", supplier: "Bulacan Lumber Yard", itemId: "i7", qty: 120, branch: "Quezon City", expected: "Oct 30", status: "Ordered" },
  { id: "PO-0870", supplier: "Laguna Tile Center", itemId: "i4", qty: 150, branch: "Pasig", expected: "Oct 31", status: "Ordered" },
  { id: "PO-0869", supplier: "Caloocan Pipe & Fittings", itemId: "i6", qty: 200, branch: "Quezon City", expected: "Oct 27", status: "Received" },
  { id: "PO-0868", supplier: "Valenzuela Steel Corp.", itemId: "i2", qty: 300, branch: "Quezon City", expected: "Oct 24", status: "Received" },
];

const INVOICES: Invoice[] = [
  { id: "INV-3051", customer: "Garcia Construction", balance: 412300, issued: "Oct 28", due: "Nov 27", late: -29, paid: false, log: ["Sent with delivery · Oct 28"] },
  { id: "INV-3048", customer: "Dela Cruz Builders", balance: 96800, issued: "Oct 6", due: "Nov 5", late: -7, paid: false, log: ["Sent with delivery · Oct 6"] },
  { id: "INV-3044", customer: "Ramos Interiors", balance: 23150, issued: "Sep 15", due: "Oct 15", late: 14, paid: false, log: ["Auto reminder, 3 days before due · Oct 12", "Auto reminder, due today · Oct 15", "Auto reminder, 7 days late · Oct 22"] },
  { id: "INV-3040", customer: "Villanueva Hardware", balance: 18720, issued: "Sep 24", due: "Oct 24", late: 5, paid: false, log: ["Auto reminder, 3 days before due · Oct 21", "Auto reminder, due today · Oct 24"] },
  { id: "INV-3032", customer: "Mendoza Kitchens", balance: 9150, issued: "Aug 21", due: "Sep 20", late: 39, paid: false, log: ["Auto reminder, due today · Sep 20", "Auto reminder, 7 days late · Sep 27", "Auto reminder, 14 days late · Oct 4", "Call task created for Marites · Oct 20"] },
  { id: "INV-3019", customer: "Santos & Sons Contractors", balance: 186400, issued: "Jul 26", due: "Aug 25", late: 65, paid: false, log: ["Auto reminder, due today · Aug 25", "Auto reminder, 7 days late · Sep 1", "Statement sent · Oct 1", "Auto reminder, 60 days late · Oct 24"] },
  { id: "INV-3029", customer: "Bayani Homes Marikina", balance: 54000, issued: "Sep 10", due: "Oct 10", late: 0, paid: true, log: ["Auto reminder, 3 days before due · Oct 7", "Paid by bank transfer · Oct 9"] },
];

const CLOSE: CloseStep[] = [
  { id: "bank", label: "Bank feeds reconciled", note: "BDO and BPI matched daily", auto: true, done: true },
  { id: "sales", label: "Sales and invoices posted", note: "Posted as each order ships", auto: true, done: true },
  { id: "bills", label: "Supplier bills matched to POs", note: "Matched when stock is received", auto: true, done: true },
  { id: "stock", label: "Inventory valued at both branches", note: "Runs Oct 31, 11:59 PM", auto: true, done: false },
  { id: "vat", label: "VAT summary drafted", note: "Runs Oct 31, 11:59 PM", auto: true, done: false },
  { id: "review", label: "Owner review", note: "Marites signs off", auto: false, done: false },
];

const MONTHS = [
  { label: "May", rev: 1820000, exp: 1410000 },
  { label: "Jun", rev: 1640000, exp: 1330000 },
  { label: "Jul", rev: 1950000, exp: 1490000 },
  { label: "Aug", rev: 2110000, exp: 1580000 },
  { label: "Sep", rev: 2040000, exp: 1550000 },
  { label: "Oct", rev: 2380000, exp: 1710000 },
];

const total = (i: Item) => i.stock["Quezon City"] + i.stock.Pasig;
const subtotal = (o: Order) => o.lines.reduce((s, l) => s + l.qty * l.price, 0);
const withVat = (n: number) => Math.round(n * 1.12);
const inDays = (n: number) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);
const arrival = (lead: number) => (29 + lead > 31 ? `Nov ${29 + lead - 31}` : `Oct ${29 + lead}`);

// Buttons inside a clickable table row. Table rows act on Enter and Space, so key
// presses on these buttons must not bubble up and open the row instead.
function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex gap-1.5" onKeyDown={(e) => e.stopPropagation()}>
      {children}
    </span>
  );
}

// Paired bars for revenue against expenses.
function PairBars({ data }: { data: typeof MONTHS }) {
  const max = Math.max(...data.map((d) => d.rev));
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
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-trace/45" aria-hidden />Expenses</span>
      </div>
    </div>
  );
}

export function ErpPrototype() {
  const app = useProtoApp("dashboard");
  const [items, setItems] = useState(ITEMS);
  const [moves, setMoves] = useState(MOVES);
  const [orders, setOrders] = useState(ORDERS);
  const [pos, setPos] = useState(POS);
  const [invoices, setInvoices] = useState(INVOICES);
  const [close, setClose] = useState(CLOSE);
  const [cash, setCash] = useState(1284500);
  const [reminded, setReminded] = useState<string[]>([]);
  const [closeSent, setCloseSent] = useState(false);

  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "order">("all");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [invFilter, setInvFilter] = useState<"open" | "overdue" | "paid">("open");
  const [reorderDrafts, setReorderDrafts] = useState<Record<string, string>>({});
  const [poOpen, setPoOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [po, setPo] = useState({ itemId: "i1", qty: "300", branch: "Quezon City" as Branch });
  const [pay, setPay] = useState({ invoiceId: "INV-3044", amount: "", method: "Bank transfer", ref: "" });

  const item = (id?: string) => items.find((i) => i.id === id);
  const onOrder = (id: string) => pos.find((p) => p.itemId === id && p.status === "Ordered");
  const isLow = (i: Item) => total(i) < i.reorder;
  const low = items.filter(isLow);
  const unpaid = invoices.filter((i) => !i.paid);
  const overdue = unpaid.filter((i) => i.late > 0);
  const salesToday = 86450 + orders.filter((o) => o.date === "Oct 29").reduce((s, o) => s + withVat(subtotal(o)), 0);
  const stockStatus = (i: Item) =>
    isLow(i) ? (onOrder(i.id) ? <Status tone="warn">On order</Status> : <Status tone="bad">Low stock</Status>) : <Status tone="good">In stock</Status>;
  const invStatus = (i: Invoice) =>
    i.paid ? <Status tone="good">Paid</Status> : i.late > 0 ? <Status tone={i.late > 30 ? "bad" : "warn"}>{i.late} days overdue</Status> : <Status tone="muted">Due {inDays(-i.late)}</Status>;

  const visibleItems = items.filter(
    (i) => `${i.name} ${i.sku} ${i.category}`.toLowerCase().includes(query.toLowerCase()) && (stockFilter === "all" || (stockFilter === "low" && isLow(i)) || (stockFilter === "order" && !!onOrder(i.id))),
  );

  const addMove = (itemId: string, text: string, qty: number, branch: Branch) => setMoves((list) => [{ id: nextId("m"), itemId, date: "Today", text, qty, branch }, ...list]);
  const adjustStock = (itemId: string, branch: Branch, delta: number) =>
    setItems((list) => list.map((i) => (i.id === itemId ? { ...i, stock: { ...i.stock, [branch]: Math.max(0, i.stock[branch] + delta) } } : i)));

  const openPo = (i: Item) => {
    setPo({ itemId: i.id, qty: String(Math.ceil(Math.max(i.daily * 14, i.reorder * 2 - total(i)) / 10) * 10), branch: i.stock.Pasig < i.stock["Quezon City"] ? "Pasig" : "Quezon City" });
    setPoOpen(true);
  };

  const createPo = () => {
    const i = item(po.itemId);
    const qty = Number(po.qty);
    if (!i || !qty) return;
    const id = `PO-${String(868 + pos.length).padStart(4, "0")}`;
    setPos((list) => [{ id, supplier: i.supplier, itemId: i.id, qty, branch: po.branch, expected: arrival(i.lead), status: "Ordered" }, ...list]);
    setPoOpen(false);
    app.notify(`${id} sent to ${i.supplier}. ${qty} ${i.unit} arriving ${arrival(i.lead)}.`);
  };

  const receive = (p: PO) => {
    const i = item(p.itemId)!;
    setPos((list) => list.map((x) => (x.id === p.id ? { ...x, status: "Received", expected: "Today" } : x)));
    adjustStock(p.itemId, p.branch, p.qty);
    addMove(p.itemId, `Received ${p.id}`, p.qty, p.branch);
    app.notify(`${p.id} received. ${p.qty} ${i.unit} added to ${p.branch} stock.`);
  };

  const advanceOrder = (o: Order) => {
    if (o.status === "Pending") {
      o.lines.forEach((l) => {
        adjustStock(l.itemId, o.branch, -l.qty);
        addMove(l.itemId, `Shipped ${o.id}`, -l.qty, o.branch);
      });
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status: "Shipped" } : x)));
      const nowLow = o.lines.map((l) => item(l.itemId)!).filter((i) => total(i) - (o.lines.find((l) => l.itemId === i.id)?.qty ?? 0) < i.reorder);
      app.notify(`${o.id} shipped from ${o.branch}. Stock updated${nowLow.length ? `, reorder alert on ${nowLow[0].name}` : ""}.`);
    } else if (o.status === "Shipped") {
      const inv = `INV-${3045 + invoices.length}`;
      setInvoices((list) => [{ id: inv, customer: o.customer, balance: withVat(subtotal(o)), issued: "Today", due: "Nov 28", late: -30, paid: false, log: ["Sent with delivery · Today"] }, ...list]);
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status: "Delivered", invoice: inv } : x)));
      app.notify(`Delivered. ${inv} sent to ${o.customer}, due Nov 28. Reminders scheduled.`);
    }
  };

  const sendReminder = (i: Invoice) => {
    setReminded((r) => [...r, i.id]);
    setInvoices((list) => list.map((x) => (x.id === i.id ? { ...x, log: [...x.log, "Reminder sent by Marites · Today"] } : x)));
    app.notify(`Reminder sent to ${i.customer} by email and SMS`);
  };

  const openPay = (i: Invoice) => {
    setPay({ invoiceId: i.id, amount: String(i.balance), method: "Bank transfer", ref: "" });
    setPayOpen(true);
  };

  const recordPayment = () => {
    const inv = invoices.find((i) => i.id === pay.invoiceId);
    const amt = Number(pay.amount);
    if (!inv || !amt) return;
    const full = amt >= inv.balance;
    setInvoices((list) => list.map((x) => (x.id === inv.id ? { ...x, balance: full ? x.balance : x.balance - amt, paid: full, log: [...x.log, `${peso(amt)} paid by ${pay.method.toLowerCase()}${pay.ref ? `, ref ${pay.ref}` : ""} · Today`] } : x)));
    setCash((c) => c + amt);
    setPayOpen(false);
    app.notify(full ? `${inv.id} marked paid. Reminders stopped.` : `${peso(amt)} recorded. ${peso(inv.balance - amt)} still open on ${inv.id}.`);
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package, badge: low.filter((i) => !onOrder(i.id)).length },
    { id: "orders", label: "Sales orders", icon: ShoppingCart, badge: orders.filter((o) => o.status === "Pending").length },
    { id: "purchasing", label: "Purchasing", icon: Truck },
    { id: "invoices", label: "Invoices", icon: Receipt, badge: overdue.length },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const it = item(app.id);
  const o = orders.find((x) => x.id === app.id);
  const inv = invoices.find((x) => x.id === app.id);
  const bucket = (from: number, to: number) => unpaid.filter((i) => i.late >= from && i.late <= to);
  const closeDone = close.filter((s) => s.done).length;

  return (
    <ProtoApp app={app} name="ERP · Bautista Builders Supply" user="Marites Bautista" nav={nav} alerts={low.filter((i) => !onOrder(i.id)).length + overdue.length}>
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Dashboard" subtitle="Thursday, October 29 · Quezon City and Pasig" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Sales today" value={peso(salesToday)} sub="+9% vs last Thursday" tone="good" />
            <Stat label="Low stock" value={String(low.length)} sub={`${low.filter((i) => onOrder(i.id)).length} already on order`} tone={low.some((i) => !onOrder(i.id)) ? "bad" : undefined} />
            <Stat label="Overdue invoices" value={peso(overdue.reduce((s, i) => s + i.balance, 0))} sub={`${overdue.length} invoices · reminders running`} />
            <Stat label="Cash on hand" value={peso(cash)} sub="BDO and BPI, synced 8:00 AM" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3">
            <Panel title="Needs attention">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {low.map((i) => (
                  <li key={i.id}>
                    <button type="button" onClick={() => app.open("item", i.id, i.name)} className="w-full flex items-start gap-2.5 py-2 text-left cursor-pointer group">
                      <Package size={14} className="mt-0.5 text-gold-bright shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{i.name}</span>
                        <span className="block text-[0.68rem] text-mist">{total(i)} {i.unit} left, about {Math.floor(total(i) / i.daily)} days of sales · reorder at {i.reorder}</span>
                      </span>
                      {onOrder(i.id) ? <Status tone="warn">On order</Status> : <Status tone="bad">Reorder</Status>}
                    </button>
                  </li>
                ))}
                {overdue.map((i) => (
                  <li key={i.id}>
                    <button type="button" onClick={() => app.open("invoice", i.id, i.id)} className="w-full flex items-start gap-2.5 py-2 text-left cursor-pointer group">
                      <Receipt size={14} className="mt-0.5 text-gold-bright shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8rem] text-ink group-hover:text-gold-bright truncate">{i.customer}</span>
                        <span className="block text-[0.68rem] text-mist">{i.id} · {peso(i.balance)} · {i.log.filter((l) => l.includes("eminder")).length} reminders sent</span>
                      </span>
                      <Status tone={i.late > 30 ? "bad" : "warn"}>{i.late}d late</Status>
                    </button>
                  </li>
                ))}
                {low.length + overdue.length === 0 && <li className="py-2 text-[0.8rem] text-graphite">Nothing needs attention.</li>}
              </ul>
            </Panel>
            <Panel title="Sales, last 7 days">
              <Bars format={(n) => `${Math.round(n / 1000)}k`} data={[{ label: "Fri", value: 214000 }, { label: "Sat", value: 236000 }, { label: "Sun", value: 88000 }, { label: "Mon", value: 198000 }, { label: "Tue", value: 221000 }, { label: "Wed", value: 247000 }, { label: "Thu", value: salesToday }]} />
            </Panel>
          </div>
        </>
      )}

      {app.screen === "inventory" && (
        <>
          <ScreenHeader title="Inventory" subtitle={`${items.length} items · 2 branches · alerts fire at the reorder point`} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
              <Search size={14} className="text-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search item, SKU, category" aria-label="Search inventory" className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
            </label>
            <Segmented id="erp-stock" value={stockFilter} onChange={setStockFilter} options={[{ id: "all", label: "All" }, { id: "low", label: "Low stock" }, { id: "order", label: "On order" }]} />
          </div>
          <Table
            rows={visibleItems}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("item", r.id, r.name)}
            empty="No items match."
            columns={[
              { key: "name", label: "Item", render: (r) => <span className="min-w-0"><span className="block text-ink truncate">{r.name}</span><span className="block font-mono text-[0.65rem] text-mist">{r.sku}</span></span> },
              { key: "cat", label: "Category", render: (r) => r.category, hideOnMobile: true },
              { key: "stock", label: "Stock vs reorder", render: (r) => <span className="flex items-center gap-2"><Meter value={total(r)} max={r.reorder * 2} className="w-16 hidden md:block" /><span className="font-mono text-[0.72rem]">{total(r)} / {r.reorder}</span></span> },
              { key: "status", label: "Status", render: stockStatus },
            ]}
          />
        </>
      )}

      {app.screen === "item" && it && (
        <>
          <ScreenHeader title={it.name} subtitle={`${it.sku} · ${it.category} · ${peso(it.price)} per ${it.unit.replace(/e?s$/, "")}`} action={<PrimaryButton onClick={() => openPo(it)}><Truck size={14} /> Create purchase order</PrimaryButton>} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Stock by branch" action={stockStatus(it)}>
              <div className="flex flex-col gap-3">
                {BRANCHES.map((b) => (
                  <div key={b}>
                    <div className="flex justify-between text-[0.8rem]"><span className="text-ink-soft">{b}</span><span className="font-mono text-ink">{it.stock[b]} {it.unit}</span></div>
                    <Meter value={it.stock[b]} max={Math.max(total(it), it.reorder)} className="mt-1.5" />
                  </div>
                ))}
              </div>
              <p className="mt-3 pt-3 border-t border-rule-soft text-[0.72rem] text-graphite">
                About {Math.floor(total(it) / it.daily)} days left at {it.daily} {it.unit} a day. {it.supplier} delivers in {it.lead} days.
                {onOrder(it.id) && <span className="block mt-1 text-gold-bright">{onOrder(it.id)!.id} · {onOrder(it.id)!.qty} {it.unit} arriving {onOrder(it.id)!.expected}</span>}
              </p>
            </Panel>
            <Panel title="Reorder point">
              <p className="text-[0.75rem] text-graphite mb-2.5">You get an alert when total stock drops below this, before customers find the shelf empty.</p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(reorderDrafts[it.id] ?? it.reorder);
                  if (!n) return;
                  setItems((list) => list.map((x) => (x.id === it.id ? { ...x, reorder: n } : x)));
                  setReorderDrafts((d) => ({ ...d, [it.id]: String(n) }));
                  app.notify(`Reorder point set to ${n} ${it.unit}`);
                }}
              >
                <input inputMode="numeric" aria-label="Reorder point" value={reorderDrafts[it.id] ?? String(it.reorder)} onChange={(e) => setReorderDrafts((d) => ({ ...d, [it.id]: e.target.value.replace(/\D/g, "") }))} className={inputClass} />
                <PrimaryButton type="submit">Save</PrimaryButton>
              </form>
              <div className="flex items-center justify-between gap-2 mt-2.5 text-[0.72rem] text-mist">
                <span>Suggested: {it.daily * (it.lead + 5)} (lead time plus 5 days)</span>
                <SmallButton onClick={() => setReorderDrafts((d) => ({ ...d, [it.id]: String(it.daily * (it.lead + 5)) }))}>Use</SmallButton>
              </div>
            </Panel>
            <Panel title="Movement history" className="lg:col-span-2">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {moves.filter((m) => m.itemId === it.id).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-[0.8rem]">
                    <span className="min-w-0"><span className="block text-ink-soft truncate">{m.text}</span><span className="block text-[0.68rem] text-mist">{m.date} · {m.branch}</span></span>
                    <span className={cn("font-mono", m.qty > 0 ? "text-gold-bright" : "text-ink-soft")}>{m.qty > 0 ? `+${m.qty}` : m.qty}</span>
                  </li>
                ))}
                {moves.every((m) => m.itemId !== it.id) && <li className="py-2 text-[0.8rem] text-graphite">No movement this week.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "orders" && (
        <>
          <ScreenHeader title="Sales orders" subtitle={`${orders.filter((x) => x.status === "Pending").length} waiting to ship`} />
          <div className="mb-3">
            <Segmented id="erp-orders" value={orderFilter} onChange={setOrderFilter} options={[{ id: "all", label: "All" }, { id: "Pending", label: "Pending" }, { id: "Shipped", label: "Shipped" }, { id: "Delivered", label: "Delivered" }]} />
          </div>
          <Table
            rows={orders.filter((x) => orderFilter === "all" || x.status === orderFilter)}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("order", r.id, r.id)}
            empty="No orders with this status."
            columns={[
              { key: "id", label: "Order", render: (r) => <span className="font-mono text-ink">{r.id}</span> },
              { key: "customer", label: "Customer", render: (r) => <span className="text-ink-soft">{r.customer}</span> },
              { key: "branch", label: "Branch", render: (r) => r.branch, hideOnMobile: true },
              { key: "date", label: "Date", render: (r) => r.date, hideOnMobile: true },
              { key: "total", label: "Total", align: "right", render: (r) => <span className="font-mono text-ink">{peso(withVat(subtotal(r)))}</span> },
              { key: "status", label: "Status", render: (r) => <Status tone={r.status === "Delivered" ? "good" : r.status === "Shipped" ? "warn" : "muted"}>{r.status}</Status> },
            ]}
          />
        </>
      )}

      {app.screen === "order" && o && (
        <>
          <ScreenHeader
            title={`${o.id} · ${o.customer}`}
            subtitle={`${o.branch} branch · ordered ${o.date} · deliver to ${o.deliver}`}
            action={o.status === "Delivered" ? <Status tone="good">Delivered</Status> : <PrimaryButton onClick={() => advanceOrder(o)}>{o.status === "Pending" ? <><Truck size={14} /> Mark shipped</> : <><PackageCheck size={14} /> Mark delivered</>}</PrimaryButton>}
          />
          <Table
            rows={o.lines}
            rowKey={(l) => l.itemId}
            onRowClick={(l) => app.open("item", l.itemId, item(l.itemId)?.name)}
            columns={[
              { key: "item", label: "Item", render: (l) => <span className="text-ink">{item(l.itemId)?.name}</span> },
              { key: "qty", label: "Qty", align: "right", render: (l) => <span className="font-mono">{l.qty} {item(l.itemId)?.unit}</span> },
              { key: "price", label: "Price", align: "right", hideOnMobile: true, render: (l) => <span className="font-mono">{peso(l.price)}</span> },
              { key: "amount", label: "Amount", align: "right", render: (l) => <span className="font-mono text-ink">{peso(l.qty * l.price)}</span> },
            ]}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
            <Panel title="Order">
              <KeyValues
                items={[
                  ["Status", <Status key="s" tone={o.status === "Delivered" ? "good" : o.status === "Shipped" ? "warn" : "muted"}>{o.status}</Status>],
                  ["Ships from", `${o.branch} branch`],
                  ["Terms", "30 days"],
                  ["Invoice", o.invoice ? <button key="i" type="button" onClick={() => app.open("invoice", o.invoice, o.invoice)} className="text-gold-bright hover:text-ink cursor-pointer">{o.invoice}</button> : o.status === "Delivered" ? "On the October statement" : "Sent automatically on delivery"],
                ]}
              />
            </Panel>
            <Panel title="Totals">
              <dl className="flex flex-col gap-1.5 text-[0.8rem]">
                <div className="flex justify-between"><dt className="text-mist">Subtotal</dt><dd className="font-mono text-ink-soft">{peso(subtotal(o))}</dd></div>
                <div className="flex justify-between"><dt className="text-mist">VAT 12%</dt><dd className="font-mono text-ink-soft">{peso(withVat(subtotal(o)) - subtotal(o))}</dd></div>
                <div className="flex justify-between pt-1.5 border-t border-rule-soft"><dt className="text-ink font-medium">Total</dt><dd className="font-mono text-ink font-semibold">{peso(withVat(subtotal(o)))}</dd></div>
              </dl>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "purchasing" && (
        <>
          <ScreenHeader title="Purchase orders" subtitle={`${pos.filter((p) => p.status === "Ordered").length} open · ${peso(pos.filter((p) => p.status === "Ordered").reduce((s, p) => s + p.qty * (item(p.itemId)?.cost ?? 0), 0))} on order`} />
          <Table
            rows={pos}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("item", r.itemId, item(r.itemId)?.name)}
            columns={[
              { key: "id", label: "PO", render: (r) => <span className="min-w-0"><span className="block font-mono text-ink">{r.id}</span><span className="block text-[0.68rem] text-mist truncate">{r.supplier}</span></span> },
              { key: "item", label: "Item", render: (r) => <span className="text-ink-soft">{r.qty} × {item(r.itemId)?.name}</span> },
              { key: "branch", label: "Deliver to", render: (r) => r.branch, hideOnMobile: true },
              { key: "exp", label: "Expected", render: (r) => r.expected, hideOnMobile: true },
              { key: "status", label: "Status", align: "right", render: (r) => (r.status === "Ordered" ? <RowActions><SmallButton onClick={() => receive(r)}><PackageCheck size={12} /> Receive</SmallButton></RowActions> : <Status tone="good">Received</Status>) },
            ]}
          />
          <p className="mt-3 text-[0.72rem] text-mist">Receiving a PO adds the stock to its branch and matches the supplier bill.</p>
        </>
      )}

      {app.screen === "invoices" && (
        <>
          <ScreenHeader title="Invoices" subtitle="Reminders go out 3 days before due, on the due date, then weekly" action={<Status tone="good">Auto reminders on</Status>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            {([["Current", -999, 0], ["1–30 days", 1, 30], ["31–60 days", 31, 60], ["60+ days", 61, 9999]] as const).map(([label, from, to]) => (
              <Stat key={label} label={label} value={peso(bucket(from, to).reduce((s, i) => s + i.balance, 0))} sub={`${bucket(from, to).length} invoices`} tone={from > 30 && bucket(from, to).length ? "bad" : undefined} />
            ))}
          </div>
          <div className="mb-3">
            <Segmented id="erp-inv" value={invFilter} onChange={setInvFilter} options={[{ id: "open", label: "Open" }, { id: "overdue", label: "Overdue" }, { id: "paid", label: "Paid" }]} />
          </div>
          <Table
            rows={invoices.filter((i) => (invFilter === "paid" ? i.paid : !i.paid && (invFilter === "open" || i.late > 0)))}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("invoice", r.id, r.id)}
            empty="No invoices here."
            columns={[
              { key: "id", label: "Invoice", render: (r) => <span className="min-w-0"><span className="block text-ink truncate">{r.customer}</span><span className="block font-mono text-[0.65rem] text-mist">{r.id} · due {r.due}</span></span> },
              { key: "amount", label: "Balance", align: "right", render: (r) => <span className="font-mono text-ink">{peso(r.balance)}</span> },
              { key: "status", label: "Status", render: invStatus, hideOnMobile: true },
              {
                key: "act",
                label: "Action",
                align: "right",
                render: (r) =>
                  r.paid ? null : (
                    <RowActions>
                      {r.late > 0 && (reminded.includes(r.id) ? <Status tone="muted">Reminded</Status> : <SmallButton onClick={() => sendReminder(r)}><Send size={11} /> Remind</SmallButton>)}
                      <SmallButton onClick={() => openPay(r)}>Record payment</SmallButton>
                    </RowActions>
                  ),
              },
            ]}
          />
        </>
      )}

      {app.screen === "invoice" && inv && (
        <>
          <ScreenHeader
            title={inv.customer}
            subtitle={`${inv.id} · issued ${inv.issued} · due ${inv.due}`}
            action={
              !inv.paid && (
                <>
                  {reminded.includes(inv.id) ? <Status tone="muted">Reminded today</Status> : <SmallButton onClick={() => sendReminder(inv)}><Send size={12} /> Send reminder</SmallButton>}
                  <PrimaryButton onClick={() => openPay(inv)}>Record payment</PrimaryButton>
                </>
              )
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Invoice">
              <KeyValues items={[["Balance", <span key="b" className="font-mono">{peso(inv.balance)}</span>], ["Status", invStatus(inv)], ["Terms", "30 days"], ["Reminders", "Email and SMS to accounts payable"]]} />
            </Panel>
            <Panel title="Reminders and payments">
              <ol className="flex flex-col gap-2 text-[0.8rem]">
                {inv.log.map((l, i) => {
                  const [text, date] = l.split(" · ");
                  return (
                    <li key={`${i}-${l}`} className="flex justify-between gap-3">
                      <span className="text-ink-soft">{text}</span>
                      <span className="font-mono text-[0.7rem] text-mist shrink-0">{date}</span>
                    </li>
                  );
                })}
              </ol>
              {!inv.paid && <p className="mt-3 pt-3 border-t border-rule-soft text-[0.7rem] text-mist">Next automatic reminder goes out {inDays(inv.late > 0 ? 7 - (inv.late % 7) : Math.max(0, -inv.late - 3))}.</p>}
            </Panel>
          </div>
        </>
      )}

      {app.screen === "reports" && (
        <>
          <ScreenHeader title="Reports" subtitle="October 2026 · books close automatically on the 1st" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Revenue, October" value={millions(MONTHS[5].rev)} sub="+17% vs September" tone="good" />
            <Stat label="Expenses" value={millions(MONTHS[5].exp)} />
            <Stat label="Net income" value={millions(MONTHS[5].rev - MONTHS[5].exp)} sub={`${Math.round(((MONTHS[5].rev - MONTHS[5].exp) / MONTHS[5].rev) * 100)}% of revenue`} />
            <Stat label="September close" value="Oct 1" sub="Ready by 8:12 AM" tone="good" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Revenue vs expenses">
              <PairBars data={MONTHS} />
            </Panel>
            <Panel title="Gross margin by category">
              <ul className="flex flex-col gap-2.5">
                {(["Plumbing", "Paint", "Tiles", "Lumber", "Steel", "Cement"] as Category[]).map((cat) => {
                  const inCat = items.filter((i) => i.category === cat);
                  const margin = Math.round((inCat.reduce((s, i) => s + (i.price - i.cost) / i.price, 0) / inCat.length) * 100);
                  return (
                    <li key={cat}>
                      <div className="flex justify-between text-[0.78rem]"><span className="text-ink-soft">{cat}</span><span className="font-mono text-ink">{margin}%</span></div>
                      <Meter value={margin} max={30} className="mt-1" />
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel
              title={`October close · ${closeDone} of ${close.length} done`}
              className="lg:col-span-2"
              action={closeSent ? <Status tone="good">Sent to accountant</Status> : <Status tone={closeDone === close.length ? "good" : "warn"}>{closeDone === close.length ? "Ready" : "Ready Nov 1"}</Status>}
            >
              <Meter value={closeDone} max={close.length} className="mb-3" />
              <ul className="flex flex-col divide-y divide-rule-soft">
                {close.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-[0.8rem] text-ink">{s.label}</span>
                      <span className="block text-[0.68rem] text-mist">{s.auto ? "Automatic" : "Manual"} · {s.note}</span>
                    </span>
                    {s.done ? (
                      <Status tone="good">Done</Status>
                    ) : s.auto ? (
                      <Status tone="muted">Scheduled</Status>
                    ) : (
                      <SmallButton onClick={() => { setClose((list) => list.map((x) => (x.id === s.id ? { ...x, done: true } : x))); app.notify("October marked reviewed"); }}>Mark reviewed</SmallButton>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap justify-end gap-2 mt-3">
                <SmallButton
                  disabled={close.every((s) => !s.auto || s.done)}
                  onClick={() => {
                    setClose((list) => list.map((x) => (x.auto ? { ...x, done: true, note: "Preview run today" } : x)));
                    app.notify("Preview ready: P&L, balance sheet, and VAT summary for October");
                  }}
                >
                  <ClipboardList size={12} /> Run preview now
                </SmallButton>
                <PrimaryButton
                  disabled={closeDone < close.length || closeSent}
                  onClick={() => {
                    setCloseSent(true);
                    app.notify("October reports sent to Reyes & Co. CPAs");
                  }}
                >
                  <Send size={13} /> Send to accountant
                </PrimaryButton>
              </div>
            </Panel>
          </div>
        </>
      )}

      <ProtoModal open={poOpen} title="Create purchase order" onClose={() => setPoOpen(false)} footer={<PrimaryButton onClick={createPo} disabled={!Number(po.qty)}>Send to supplier</PrimaryButton>}>
        {(() => {
          const i = item(po.itemId);
          if (!i) return null;
          return (
            <>
              <KeyValues items={[["Item", i.name], ["Supplier", i.supplier], ["In stock", `${total(i)} ${i.unit}, reorder at ${i.reorder}`]]} />
              <Field label={`Quantity (${i.unit})`}>
                <input autoFocus inputMode="numeric" value={po.qty} onChange={(e) => setPo({ ...po, qty: e.target.value.replace(/\D/g, "") })} className={inputClass} />
              </Field>
              <Field label="Deliver to">
                <select value={po.branch} onChange={(e) => setPo({ ...po, branch: e.target.value as Branch })} className={inputClass}>
                  {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <p className="text-[0.72rem] text-graphite">
                Cost {peso(Number(po.qty) * i.cost)} · arrives about {arrival(i.lead)}
              </p>
            </>
          );
        })()}
      </ProtoModal>

      <ProtoModal open={payOpen} title="Record payment" onClose={() => setPayOpen(false)} footer={<PrimaryButton onClick={recordPayment} disabled={!Number(pay.amount)}>Record payment</PrimaryButton>}>
        <Field label="Invoice">
          <select value={pay.invoiceId} onChange={(e) => setPay({ ...pay, invoiceId: e.target.value, amount: String(invoices.find((i) => i.id === e.target.value)?.balance ?? "") })} className={inputClass}>
            {unpaid.map((i) => <option key={i.id} value={i.id}>{i.id} · {i.customer} · {peso(i.balance)}</option>)}
          </select>
        </Field>
        <Field label="Amount received (₱)">
          <input autoFocus inputMode="numeric" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} />
        </Field>
        <Field label="Method">
          <select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} className={inputClass}>
            <option>Bank transfer</option>
            <option>Check</option>
            <option>GCash</option>
            <option>Cash</option>
          </select>
        </Field>
        <Field label="Reference number">
          <input value={pay.ref} onChange={(e) => setPay({ ...pay, ref: e.target.value })} className={inputClass} placeholder="BDO 0093 4471" />
        </Field>
      </ProtoModal>
    </ProtoApp>
  );
}
