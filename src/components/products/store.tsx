"use client";

import React, { useCallback, useState } from "react";
import {
  Archive,
  BarChart3,
  Boxes,
  Check,
  ChevronRight,
  Copy,
  Download,
  Home,
  Megaphone,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Tag,
  Truck,
  UserPlus,
  Users,
  X,
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
import { ProductArt, artFor } from "./store-art";

const peso = (n: number) => `₱${Math.round(n).toLocaleString("en-US")}`;
const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const pct = (part: number, whole: number) => `${whole ? ((part / whole) * 100).toFixed(1) : "0.0"}%`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const TODAY = "Oct 29";
const LOW = 12; // a variant is low when fewer than this many are available
const SESSIONS_TODAY = 412;

// ---- Types -----------------------------------------------------------------------

type Loc = "Cubao roastery" | "Maginhawa café";
const LOCS: Loc[] = ["Cubao roastery", "Maginhawa café"];
type ProductType = "Whole bean" | "Drip bags" | "Merch" | "Gift box";
const TYPES: ProductType[] = ["Whole bean", "Drip bags", "Merch", "Gift box"];
type Zone = "Metro Manila" | "Luzon" | "Visayas" | "Mindanao";
const ZONE_NAMES: Zone[] = ["Metro Manila", "Luzon", "Visayas", "Mindanao"];
type Method = "GCash" | "Maya" | "Card" | "Cash on delivery" | "Bank transfer";
type Channel = "Online store" | "Social shop" | "Café POS" | "Draft order";
type Courier = "LBC Express" | "J&T Express" | "Grab Express" | "Kapwa rider";
type PayStatus = "Paid" | "Pending" | "Partially refunded" | "Refunded";
type DiscountType = "Percentage" | "Fixed amount" | "Free shipping" | "Buy X get Y";
type Audience = "All subscribers" | "Repeat buyers" | "Lapsed customers" | "Kapwa Monthly members";
type Range = "7d" | "30d" | "90d";

interface Variant { id: string; name: string; sku: string; price: number; compareAt?: number; stock: Record<Loc, number> }
interface Product { id: string; title: string; type: ProductType; status: "Active" | "Draft"; tags: string[]; description: string; handle: string; seoTitle: string; seoDescription: string; media: string[]; tone: number; sold30: number; variants: Variant[] }
interface Line { variantId: string; qty: number; price: number }
interface Note { text: string; at: string }
interface Order { id: string; date: string; time: string; customerId: string; lines: Line[]; zone: Zone; address: string; method: Method; payment: PayStatus; fulfilled: boolean; courier?: Courier; tracking?: string; code?: string; discount: number; shipping: number; channel: Channel; archived: boolean; refunded: number; timeline: Note[] }
interface Draft { id: string; customerId: string; lines: Line[]; pct: number; status: "Open" | "Invoice sent" | "Completed"; created: string; orderId?: string }
interface Checkout { id: string; name: string; email: string; items: string; total: number; when: string; status: "Not sent" | "Email sent" | "Recovered" }
interface Customer { id: string; name: string; email: string; phone: string; address: string; city: string; zone: Zone; since: string; pastOrders: number; pastSpent: number; lastDays: number; marketing: boolean; tags: string[]; notes: Note[] }
interface Rule { field: "Tag" | "Type" | "Price"; value: string }
interface Collection { id: string; title: string; kind: "Manual" | "Automatic"; productIds: string[]; rule?: Rule }
interface Discount { id: string; code: string; method: "Code" | "Automatic"; type: DiscountType; value: number; getItem?: string; appliesTo: string; minimum: number; eligibility: string; used: number; limit?: number; sales: number; status: "Active" | "Scheduled" | "Expired"; dates: string }
interface Campaign { id: string; name: string; subject: string; audience: Audience; status: "Sent" | "Scheduled" | "Draft"; when: string; recipients: number; opens?: number; clicks?: number; orders?: number; sales?: number; hero: string; body: string }
interface Sub { id: string; customerId: string; plan: string; coffee: string; grind: string; price: number; next: string; status: "Active" | "Paused" | "Payment failed"; method: Method; renewals: number }
interface Adjustment { id: string; variantId: string; loc: Loc; delta: number; reason: string; at: string; by: string }
interface PayMethod { id: string; name: string; detail: string; fee: string; on: boolean }
interface Rate { id: string; name: string; eta: string; price: number; freeOver?: number }
interface ShipZone { zone: Zone; areas: string; cod: boolean; rates: Rate[] }

// ---- Sample data: Kapwa Coffee Co., Cubao, Quezon City ------------------------------

const MEDIA: Record<ProductType, string[]> = {
  "Whole bean": ["Front of bag", "Whole beans", "Brewed cup"],
  "Drip bags": ["Box front", "Drip bag", "Brewing"],
  Merch: ["Product photo", "In use"],
  "Gift box": ["Box closed", "Box open", "Card inside"],
};

const v = (id: string, name: string, sku: string, price: number, cubao: number, cafe: number, compareAt?: number): Variant => ({
  id,
  name,
  sku,
  price,
  compareAt,
  stock: { "Cubao roastery": cubao, "Maginhawa café": cafe },
});

function makeProduct(id: string, title: string, type: ProductType, tags: string[], description: string, sold30: number, variants: Variant[], status: Product["status"] = "Active"): Product {
  return { id, title, type, status, tags, description, handle: slug(title), seoTitle: `${title} | Kapwa Coffee Co.`, seoDescription: description, media: MEDIA[type], tone: Number(id.slice(1)) % 6, sold30, variants };
}

const PRODUCTS: Product[] = [
  makeProduct("p1", "Benguet Highland Arabica", "Whole bean", ["single-origin", "light-roast"], "Washed Typica from Atok, Benguet. Citrus, brown sugar, clean finish.", 46, [v("p1a", "250g / Whole bean", "BHA-250-WB", 480, 34, 12), v("p1b", "250g / Ground", "BHA-250-GR", 480, 18, 6), v("p1c", "500g / Whole bean", "BHA-500-WB", 890, 12, 3)]),
  makeProduct("p2", "Sagada Heirloom Arabica", "Whole bean", ["single-origin", "medium-roast", "staff-pick"], "Heirloom Arabica from the Sagada farmers' cooperative. Red apple, honey, cocoa.", 71, [v("p2a", "250g / Whole bean", "SHA-250-WB", 560, 22, 8, 620), v("p2b", "250g / Ground", "SHA-250-GR", 560, 6, 3, 620), v("p2c", "500g / Whole bean", "SHA-500-WB", 1040, 11, 4, 1150)]),
  makeProduct("p3", "Batangas Barako Liberica", "Whole bean", ["single-origin", "dark-roast"], "Bold Liberica from Lipa, Batangas. Dark chocolate, jackfruit, a long finish.", 58, [v("p3a", "250g / Whole bean", "BBL-250-WB", 390, 40, 16), v("p3b", "250g / Ground", "BBL-250-GR", 390, 28, 10), v("p3c", "500g / Ground", "BBL-500-GR", 720, 14, 5)]),
  makeProduct("p4", "Mt. Apo Natural", "Whole bean", ["single-origin", "light-roast"], "Natural-process Arabica from Kapatagan, Davao del Sur. Berry, cacao nib, syrupy body.", 33, [v("p4a", "250g / Whole bean", "MAN-250-WB", 520, 7, 2), v("p4b", "250g / Ground", "MAN-250-GR", 520, 12, 4)]),
  makeProduct("p5", "Kalinga Robusta", "Whole bean", ["single-origin", "dark-roast"], "Robusta from Tabuk, Kalinga. Earthy and strong, made for milk drinks.", 21, [v("p5a", "250g / Ground", "KRB-250-GR", 340, 26, 9)]),
  makeProduct("p6", "Kapwa House Blend", "Whole bean", ["blend", "medium-roast", "bestseller"], "Our everyday blend of Benguet Arabica and Batangas Liberica. Chocolate, toasted nuts.", 128, [v("p6a", "250g / Whole bean", "KHB-250-WB", 420, 52, 20), v("p6b", "250g / Ground", "KHB-250-GR", 420, 44, 18), v("p6c", "1kg / Whole bean", "KHB-1K-WB", 1480, 16, 3)]),
  makeProduct("p7", "Fellowship Espresso Blend", "Whole bean", ["blend", "dark-roast"], "Built for espresso and milk. Caramel, dark cocoa. Poured at our partner church cafés.", 64, [v("p7a", "250g / Whole bean", "FEB-250-WB", 450, 30, 14), v("p7b", "1kg / Whole bean", "FEB-1K-WB", 1620, 8, 0)]),
  makeProduct("p8", "House Blend drip bags", "Drip bags", ["drip", "bestseller"], "Ten single-serve drip bags. Hot water, three minutes, done.", 152, [v("p8a", "Box of 10", "KDB-HB-10", 350, 60, 24)]),
  makeProduct("p9", "Origins drip bag sampler", "Drip bags", ["drip", "gift"], "Twelve drip bags, three from each origin: Benguet, Sagada, Batangas, Mt. Apo.", 39, [v("p9a", "Box of 12", "KDB-OS-12", 480, 4, 6, 540)]),
  makeProduct("p10", "Kapwa stoneware mug", "Merch", ["merch"], "12 oz stoneware mug, handmade in Pampanga. Dishwasher safe.", 27, [v("p10a", "Cream", "KSM-CRM", 650, 18, 7), v("p10b", "Charcoal", "KSM-CHR", 650, 3, 2)]),
  makeProduct("p11", "Enamel camp mug", "Merch", ["merch"], "Enamel mug for retreats and camps. Launching with the youth camp bundle.", 0, [v("p11a", "White", "KEM-WHT", 420, 40, 0)], "Draft"),
  makeProduct("p12", "Pasasalamat gift box", "Gift box", ["gift"], "Two 250g bags, a box of drip bags and a handwritten card, for the people you're thankful for.", 44, [v("p12a", "Standard", "GB-PAS", 1850, 16, 5, 2100)]),
  makeProduct("p13", "Noche Buena gift box", "Gift box", ["gift", "holiday"], "Sagada Heirloom, House Blend drip bags, a stoneware mug and a Christmas card.", 0, [v("p13a", "Standard", "GB-NB", 2450, 30, 0), v("p13b", "Family, 4 bags", "GB-NB-FAM", 3650, 15, 0)], "Draft"),
  makeProduct("p14", "Ceramic hand grinder", "Merch", ["merch", "brew-gear"], "Adjustable ceramic burrs. Fits in a backpack for retreats and road trips.", 12, [v("p14a", "Standard", "KHG-01", 1950, 9, 4)]),
];

const PRICE = Object.fromEntries(PRODUCTS.flatMap((p) => p.variants.map((x) => [x.id, x.price]))) as Record<string, number>;
const ln = (variantId: string, qty: number): Line => ({ variantId, qty, price: PRICE[variantId] });
const sum = (lines: Line[]) => lines.reduce((s, l) => s + l.qty * l.price, 0);
const qtyOf = (lines: Line[]) => lines.reduce((s, l) => s + l.qty, 0);
const totalOf = (o: { lines: Line[]; discount: number; shipping: number }) => sum(o.lines) - o.discount + o.shipping;

const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Joy Santiago", email: "joy.santiago@gmail.com", phone: "0917 555 0142", address: "18 Maginhawa St, Teachers Village, Quezon City", city: "Quezon City", zone: "Metro Manila", since: "Mar 2023", pastOrders: 11, pastSpent: 9840, lastDays: 0, marketing: true, tags: ["Kapwa Monthly", "Regular"], notes: [{ text: "Prefers whole bean. Leave parcels with the guard.", at: "Aug 14 · Rhea Domingo" }] },
  { id: "c2", name: "Paolo Reyes", email: "paolo.reyes@gmail.com", phone: "0918 555 0193", address: "Unit 1207, Rockwell Center, Makati City", city: "Makati", zone: "Metro Manila", since: "Jan 2025", pastOrders: 3, pastSpent: 2960, lastDays: 0, marketing: true, tags: ["Social shop"], notes: [] },
  { id: "c3", name: "Liza Mendoza", email: "liza.mendoza@yahoo.com", phone: "0927 555 0110", address: "45 Kapitolyo St, Pasig City", city: "Pasig", zone: "Metro Manila", since: "Jun 2024", pastOrders: 5, pastSpent: 4410, lastDays: 0, marketing: true, tags: ["Gift buyer"], notes: [{ text: "Orders gift boxes for her small group every quarter.", at: "Sep 3 · Rhea Domingo" }] },
  { id: "c4", name: "Marco dela Cruz", email: "marco.dc@gmail.com", phone: "0995 555 0177", address: "22 Gorordo Ave, Lahug, Cebu City", city: "Cebu City", zone: "Visayas", since: "Feb 2026", pastOrders: 2, pastSpent: 1780, lastDays: 0, marketing: true, tags: [], notes: [] },
  { id: "c5", name: "Bea Villanueva", email: "bea.villanueva@gmail.com", phone: "0906 555 0128", address: "14 Lanang Rd, Davao City", city: "Davao City", zone: "Mindanao", since: "Sep 2024", pastOrders: 4, pastSpent: 3920, lastDays: 0, marketing: true, tags: ["Kapwa Monthly"], notes: [] },
  { id: "c6", name: "Ramon Aquino", email: "cafe@gracefellowship.ph", phone: "0917 555 0119", address: "Grace Fellowship, 88 Shaw Blvd, Mandaluyong City", city: "Mandaluyong", zone: "Metro Manila", since: "Mar 2026", pastOrders: 9, pastSpent: 38600, lastDays: 0, marketing: false, tags: ["Wholesale", "Church café"], notes: [{ text: "Grace Fellowship café. Invoice monthly, pays by bank transfer within 7 days.", at: "Mar 2 · Rhea Domingo" }] },
  { id: "c7", name: "Trisha Gonzales", email: "trisha.g@gmail.com", phone: "0919 555 0105", address: "Session Rd, Baguio City, Benguet", city: "Baguio", zone: "Luzon", since: "Aug 2026", pastOrders: 1, pastSpent: 560, lastDays: 0, marketing: true, tags: [], notes: [] },
  { id: "c8", name: "Miguel Fernandez", email: "miguel.fernandez@gmail.com", phone: "0945 555 0136", address: "Sumulong Hwy, Antipolo, Rizal", city: "Antipolo", zone: "Luzon", since: "Nov 2024", pastOrders: 6, pastSpent: 5230, lastDays: 0, marketing: true, tags: ["Kapwa Monthly"], notes: [] },
  { id: "c9", name: "Carla Bautista", email: "carla.bautista@gmail.com", phone: "0928 555 0187", address: "Jaro, Iloilo City, Iloilo", city: "Iloilo City", zone: "Visayas", since: "Oct 2026", pastOrders: 0, pastSpent: 0, lastDays: 0, marketing: true, tags: ["First order"], notes: [] },
  { id: "c10", name: "Nico Ramos", email: "nico.ramos@gmail.com", phone: "0917 555 0161", address: "Bonifacio Global City, Taguig", city: "Taguig", zone: "Metro Manila", since: "Apr 2024", pastOrders: 7, pastSpent: 6980, lastDays: 0, marketing: false, tags: ["Kapwa Monthly", "Espresso"], notes: [] },
  { id: "c11", name: "Hannah Lim", email: "hannah.lim@limlaw.ph", phone: "0918 555 0172", address: "Greenhills, San Juan City", city: "San Juan", zone: "Metro Manila", since: "Dec 2024", pastOrders: 4, pastSpent: 14800, lastDays: 0, marketing: true, tags: ["Corporate gifts"], notes: [{ text: "Buys gift boxes for her firm's clients. Needs invoices with TIN.", at: "Oct 2 · Rhea Domingo" }] },
  { id: "c12", name: "Jerome Castillo", email: "jerome.castillo@gmail.com", phone: "0916 555 0154", address: "Carmen, Cagayan de Oro", city: "Cagayan de Oro", zone: "Mindanao", since: "May 2026", pastOrders: 2, pastSpent: 1620, lastDays: 0, marketing: true, tags: ["Kapwa Monthly"], notes: [] },
  { id: "c13", name: "Kristine Navarro", email: "kristine.navarro@gmail.com", phone: "0927 555 0133", address: "Concepcion Uno, Marikina City", city: "Marikina", zone: "Metro Manila", since: "Jul 2024", pastOrders: 8, pastSpent: 7450, lastDays: 0, marketing: true, tags: ["Kapwa Monthly"], notes: [] },
  { id: "c14", name: "Elijah Torres", email: "elijah.torres@up.edu.ph", phone: "0995 555 0108", address: "UP Diliman, Quezon City", city: "Quezon City", zone: "Metro Manila", since: "Sep 2026", pastOrders: 1, pastSpent: 390, lastDays: 0, marketing: false, tags: ["Student"], notes: [] },
  { id: "c15", name: "Ruth Pascual", email: "ruth.pascual@gmail.com", phone: "0917 555 0124", address: "Batong Malake, Los Baños, Laguna", city: "Los Baños", zone: "Luzon", since: "Feb 2024", pastOrders: 6, pastSpent: 4880, lastDays: 128, marketing: true, tags: [], notes: [] },
  { id: "c16", name: "Daniel Uy", email: "daniel.uy@gmail.com", phone: "0918 555 0147", address: "Wack-Wack, Mandaluyong City", city: "Mandaluyong", zone: "Metro Manila", since: "Oct 2024", pastOrders: 3, pastSpent: 2540, lastDays: 104, marketing: true, tags: [], notes: [] },
  { id: "c17", name: "Grace Tan", email: "grace.tan@yahoo.com", phone: "0919 555 0181", address: "Lacson St, Bacolod City", city: "Bacolod", zone: "Visayas", since: "Mar 2025", pastOrders: 2, pastSpent: 1460, lastDays: 152, marketing: false, tags: [], notes: [] },
  { id: "c18", name: "Samuel Ocampo", email: "sam.ocampo@gmail.com", phone: "0906 555 0199", address: "BF Homes, Parañaque City", city: "Parañaque", zone: "Metro Manila", since: "Jun 2025", pastOrders: 1, pastSpent: 480, lastDays: 96, marketing: true, tags: [], notes: [] },
  { id: "c19", name: "Faith Mercado", email: "faith.mercado@gmail.com", phone: "0945 555 0115", address: "Barasoain, Malolos, Bulacan", city: "Malolos", zone: "Luzon", since: "Jan 2026", pastOrders: 3, pastSpent: 2890, lastDays: 41, marketing: true, tags: ["Kapwa Monthly"], notes: [] },
];

interface Seed { id: string; date: string; time: string; c: string; lines: Line[]; ship: number; method: Method; paid?: boolean; sent?: [Courier, string]; code?: [string, number]; channel?: Channel; archived?: boolean; refund?: [number, string] }

const CHANNEL_TEXT: Record<Channel, string> = { "Online store": "the online store", "Social shop": "the social shop", "Café POS": "the café POS", "Draft order": "a draft order" };

function seedOrder(s: Seed): Order {
  const who = CUSTOMERS.find((c) => c.id === s.c)!;
  const discount = s.code?.[1] ?? 0;
  const total = sum(s.lines) - discount + s.ship;
  const paid = s.paid ?? true;
  const channel = s.channel ?? "Online store";
  const at = `${s.date}, ${s.time}`;
  const refunded = s.refund?.[0] ?? 0;
  const timeline: Note[] = [];
  if (s.refund) timeline.push({ text: `Refunded ${peso(s.refund[0])}. ${s.refund[1]}`, at: s.date });
  if (s.sent) timeline.push({ text: `Fulfilled via ${s.sent[0]}. Tracking ${s.sent[1]}.`, at: s.date });
  if (paid) timeline.push({ text: s.method === "Cash on delivery" ? `${peso(total)} collected on delivery.` : `${peso(total)} paid via ${s.method}.`, at });
  else timeline.push({ text: s.method === "Cash on delivery" ? `Cash on delivery. Courier collects ${peso(total)}.` : `Waiting for a bank transfer of ${peso(total)}.`, at });
  timeline.push({ text: `Order placed on ${CHANNEL_TEXT[channel]}.`, at });
  return {
    id: s.id,
    date: s.date,
    time: s.time,
    customerId: s.c,
    lines: s.lines,
    zone: who.zone,
    address: who.address,
    method: s.method,
    payment: refunded >= total ? "Refunded" : refunded > 0 ? "Partially refunded" : paid ? "Paid" : "Pending",
    fulfilled: !!s.sent,
    courier: s.sent?.[0],
    tracking: s.sent?.[1],
    code: s.code?.[0],
    discount,
    shipping: s.ship,
    channel,
    archived: !!s.archived,
    refunded,
    timeline,
  };
}

const SEEDS: Seed[] = [
  { id: "#1052", date: TODAY, time: "9:42 AM", c: "c1", lines: [ln("p2a", 2), ln("p8a", 1)], ship: 120, method: "GCash" },
  { id: "#1051", date: TODAY, time: "9:15 AM", c: "c10", lines: [ln("p6c", 1), ln("p7a", 1)], ship: 0, method: "Card" },
  { id: "#1050", date: TODAY, time: "8:58 AM", c: "c4", lines: [ln("p3a", 2), ln("p5a", 1)], ship: 240, method: "Maya" },
  { id: "#1049", date: TODAY, time: "8:31 AM", c: "c13", lines: [ln("p12a", 2)], ship: 0, method: "Bank transfer", paid: false, code: ["PASASALAMAT200", 200] },
  { id: "#1048", date: TODAY, time: "7:54 AM", c: "c9", lines: [ln("p1a", 1), ln("p9a", 1)], ship: 240, method: "GCash", code: ["KAPWA10", 96] },
  { id: "#1047", date: TODAY, time: "7:20 AM", c: "c14", lines: [ln("p3b", 1), ln("p10a", 1)], ship: 120, method: "Cash on delivery", paid: false },
  { id: "#1046", date: TODAY, time: "6:45 AM", c: "c2", lines: [ln("p4b", 2)], ship: 120, method: "Maya", channel: "Social shop" },
  { id: "#1045", date: "Oct 28", time: "5:12 PM", c: "c5", lines: [ln("p6a", 2), ln("p8a", 2)], ship: 280, method: "GCash", sent: ["LBC Express", "LBC 1849 2201 7734"] },
  { id: "#1044", date: "Oct 28", time: "3:40 PM", c: "c11", lines: [ln("p12a", 4)], ship: 0, method: "Bank transfer", channel: "Draft order" },
  { id: "#1043", date: "Oct 28", time: "1:05 PM", c: "c3", lines: [ln("p10a", 1), ln("p10b", 1), ln("p8a", 1)], ship: 0, method: "Card", sent: ["Grab Express", "GRB-1028-4471"] },
  { id: "#1042", date: "Oct 28", time: "10:22 AM", c: "c7", lines: [ln("p2c", 1)], ship: 180, method: "Cash on delivery", paid: false },
  { id: "#1041", date: "Oct 27", time: "6:30 PM", c: "c8", lines: [ln("p7b", 1)], ship: 180, method: "GCash", sent: ["J&T Express", "JT7710 4419 0827"] },
  { id: "#1040", date: "Oct 27", time: "2:14 PM", c: "c12", lines: [ln("p3c", 1), ln("p5a", 1)], ship: 280, method: "Maya", sent: ["LBC Express", "LBC 1849 2195 3307"] },
  { id: "#1039", date: "Oct 27", time: "9:03 AM", c: "c1", lines: [ln("p8a", 2)], ship: 120, method: "GCash", sent: ["Grab Express", "GRB-1027-3390"] },
  { id: "#1038", date: "Oct 26", time: "4:48 PM", c: "c6", lines: [ln("p6c", 3), ln("p7b", 2)], ship: 0, method: "Bank transfer", channel: "Draft order", code: ["CHURCHCAFE", 922], sent: ["Kapwa rider", "KR-1026-02"] },
  { id: "#1037", date: "Oct 26", time: "11:20 AM", c: "c10", lines: [ln("p1b", 1)], ship: 120, method: "Card", sent: ["J&T Express", "JT7710 4417 3361"], refund: [120, "Shipping refunded for a late delivery."] },
  { id: "#1036", date: "Oct 26", time: "8:15 AM", c: "c13", lines: [ln("p6b", 2)], ship: 120, method: "Cash on delivery", sent: ["LBC Express", "LBC 1849 2199 0418"] },
  { id: "#1035", date: "Oct 25", time: "7:41 PM", c: "c3", lines: [ln("p12a", 1)], ship: 0, method: "GCash", sent: ["Grab Express", "GRB-1025-1186"], archived: true },
  { id: "#1034", date: "Oct 25", time: "10:09 AM", c: "c5", lines: [ln("p2a", 1)], ship: 280, method: "Maya", sent: ["LBC Express", "LBC 1849 2187 5520"], archived: true },
  { id: "#1033", date: "Oct 24", time: "3:27 PM", c: "c2", lines: [ln("p3a", 1)], ship: 120, method: "Card", sent: ["J&T Express", "JT7710 4409 1175"], refund: [510, "Wrong grind sent. Replacement shipped free."], archived: true },
  { id: "#1032", date: "Oct 23", time: "12:52 PM", c: "c8", lines: [ln("p6a", 2)], ship: 180, method: "GCash", sent: ["J&T Express", "JT7710 4402 6683"], archived: true },
  { id: "#1031", date: "Oct 22", time: "9:30 AM", c: "c11", lines: [ln("p9a", 5)], ship: 0, method: "Bank transfer", channel: "Draft order", sent: ["Grab Express", "GRB-1022-0904"], archived: true },
];
const ORDERS = SEEDS.map(seedOrder);

const DRAFTS: Draft[] = [
  { id: "#D18", customerId: "c6", lines: [ln("p6c", 4), ln("p7b", 2)], pct: 12, status: "Open", created: TODAY },
  { id: "#D17", customerId: "c11", lines: [ln("p12a", 15)], pct: 5, status: "Invoice sent", created: "Oct 28" },
  { id: "#D16", customerId: "c19", lines: [ln("p9a", 6)], pct: 0, status: "Open", created: "Oct 27" },
  { id: "#D15", customerId: "c6", lines: [ln("p6c", 3), ln("p7b", 2)], pct: 12, status: "Completed", created: "Oct 26", orderId: "#1038" },
];

const CHECKOUTS: Checkout[] = [
  { id: "ac1", name: "Andrea Flores", email: "andrea.flores@gmail.com", items: "Sagada Heirloom Arabica × 2", total: 1240, when: "Today, 8:12 AM", status: "Not sent" },
  { id: "ac2", name: "Ken Morales", email: "ken.morales@yahoo.com", items: "Pasasalamat gift box × 3", total: 5550, when: "Today, 6:30 AM", status: "Not sent" },
  { id: "ac3", name: "Lea Santos", email: "lea.santos@gmail.com", items: "Kapwa House Blend, 1kg × 1", total: 1480, when: "Yesterday, 9:48 PM", status: "Email sent" },
  { id: "ac4", name: "Ivan Cruz", email: "ivan.cruz@gmail.com", items: "Origins drip bag sampler × 2", total: 1200, when: "Yesterday, 4:15 PM", status: "Not sent" },
  { id: "ac5", name: "Mae Rivera", email: "mae.rivera@gmail.com", items: "Ceramic hand grinder, Fellowship Espresso Blend", total: 2400, when: "Oct 27, 11:02 AM", status: "Recovered" },
  { id: "ac6", name: "Josh Valdez", email: "josh.valdez@gmail.com", items: "Batangas Barako Liberica × 1", total: 510, when: "Oct 27, 8:40 PM", status: "Email sent" },
];

const COLLECTIONS: Collection[] = [
  { id: "k1", title: "Single origin", kind: "Automatic", productIds: [], rule: { field: "Tag", value: "single-origin" } },
  { id: "k2", title: "Dark roasts", kind: "Automatic", productIds: [], rule: { field: "Tag", value: "dark-roast" } },
  { id: "k3", title: "Drip bags", kind: "Automatic", productIds: [], rule: { field: "Type", value: "Drip bags" } },
  { id: "k4", title: "Under ₱500", kind: "Automatic", productIds: [], rule: { field: "Price", value: "500" } },
  { id: "k5", title: "Christmas gifting", kind: "Manual", productIds: ["p12", "p13", "p9", "p10", "p14"] },
  { id: "k6", title: "Staff picks", kind: "Manual", productIds: ["p2", "p4", "p7"] },
  { id: "k7", title: "Church café wholesale", kind: "Manual", productIds: ["p6", "p7"] },
];

const DISCOUNTS: Discount[] = [
  { id: "d1", code: "KAPWA10", method: "Code", type: "Percentage", value: 10, appliesTo: "Entire order", minimum: 0, eligibility: "First order only", used: 142, sales: 98420, status: "Active", dates: "Jan 5, 2026, no end date" },
  { id: "d2", code: "LIBRESHIP", method: "Code", type: "Free shipping", value: 0, appliesTo: "Metro Manila", minimum: 1000, eligibility: "All customers", used: 88, sales: 74100, status: "Active", dates: "Oct 1 – Oct 31" },
  { id: "d3", code: "PASASALAMAT200", method: "Code", type: "Fixed amount", value: 200, appliesTo: "Entire order", minimum: 2000, eligibility: "All customers", used: 37, limit: 100, sales: 81400, status: "Active", dates: "Oct 1 – Nov 30" },
  { id: "d4", code: "Buy 2 bags, get drip bags free", method: "Automatic", type: "Buy X get Y", value: 2, getItem: "House Blend drip bags", appliesTo: "Bags of whole bean", minimum: 0, eligibility: "All customers", used: 54, sales: 52180, status: "Active", dates: "Oct 15 – Nov 15" },
  { id: "d5", code: "Free shipping over ₱2,500", method: "Automatic", type: "Free shipping", value: 0, appliesTo: "All zones", minimum: 2500, eligibility: "All customers", used: 61, sales: 214600, status: "Active", dates: "Always on" },
  { id: "d6", code: "CHURCHCAFE", method: "Code", type: "Percentage", value: 12, appliesTo: "Entire order", minimum: 5000, eligibility: "Customers tagged Church café", used: 19, sales: 141300, status: "Active", dates: "Mar 1, 2026, no end date" },
  { id: "d7", code: "SIMBANG15", method: "Code", type: "Percentage", value: 15, appliesTo: "Gift boxes", minimum: 0, eligibility: "All customers", used: 0, limit: 300, sales: 0, status: "Scheduled", dates: "Dec 16 – Dec 24" },
  { id: "d8", code: "BALIKESKWELA", method: "Code", type: "Percentage", value: 10, appliesTo: "Drip bags", minimum: 0, eligibility: "All customers", used: 63, sales: 27930, status: "Expired", dates: "Aug 1 – Aug 31" },
  { id: "d9", code: "Coffee day ₱100 off", method: "Automatic", type: "Fixed amount", value: 100, appliesTo: "Entire order", minimum: 800, eligibility: "All customers", used: 96, sales: 104200, status: "Expired", dates: "Oct 1" },
];

const AUDIENCES: Record<Audience, number> = { "All subscribers": 2846, "Repeat buyers": 1120, "Lapsed customers": 412, "Kapwa Monthly members": 186 };

const CAMPAIGNS: Campaign[] = [
  { id: "m1", name: "October roast: Sagada Heirloom", subject: "Fresh from the Sagada terraces", audience: "All subscribers", status: "Sent", when: "Oct 22", recipients: 2812, opens: 1294, clicks: 219, orders: 64, sales: 48320, hero: "Sagada harvest", body: "This month's roast comes from 38 farming families in Sagada. Red apple, honey, cocoa. Roasted Monday, shipped Tuesday." },
  { id: "m2", name: "Pasasalamat gift boxes", subject: "Say thank you with coffee", audience: "All subscribers", status: "Sent", when: "Oct 8", recipients: 2790, opens: 1144, clicks: 145, orders: 38, sales: 71060, hero: "Gift box, open", body: "Two bags, drip bags and a handwritten card. Every box funds a week of school meals at our partner school in Kalinga." },
  { id: "m3", name: "We miss you", subject: "Your next bag is 15% off", audience: "Lapsed customers", status: "Sent", when: "Sep 30", recipients: 412, opens: 157, clicks: 25, orders: 19, sales: 11880, hero: "Coffee and a note", body: "It's been a while. Take 15% off your next order, applied at checkout until Oct 31." },
  { id: "m4", name: "Youth camp drip bags", subject: "Coffee for camp leaders", audience: "Repeat buyers", status: "Sent", when: "Sep 12", recipients: 1084, opens: 421, clicks: 52, orders: 21, sales: 9450, hero: "Camp morning", body: "Bulk drip bags for retreats and youth camps. Ten boxes or more ship free in Luzon." },
  { id: "m5", name: "Noche Buena preorders", subject: "Christmas boxes are open for preorder", audience: "All subscribers", status: "Scheduled", when: "Nov 1, 8:00 AM", recipients: 2846, hero: "Noche Buena box", body: "Sagada Heirloom, House Blend drip bags, a stoneware mug and a card. Preorder by Dec 10 for delivery before Christmas Eve." },
  { id: "m6", name: "November roaster's choice", subject: "What's in your November bag", audience: "Kapwa Monthly members", status: "Draft", when: "Not scheduled", recipients: 186, hero: "Mt. Apo farm", body: "November's bag is Mt. Apo Natural from Kapatagan. Berry, cacao nib. Renewals run Nov 1 to 8." },
];

const PLANS = [
  { name: "Monthly · 250g", price: 450, members: 112 },
  { name: "Monthly · 500g", price: 820, members: 46 },
  { name: "Every 2 weeks · 250g", price: 450, members: 28 },
];
const BASE_ACTIVE = 179; // subscribers not listed in the renewals table
const BASE_MRR = 85620;

const SUBS: Sub[] = [
  { id: "s1", customerId: "c1", plan: "Monthly · 250g", coffee: "Roaster's choice", grind: "Whole bean", price: 450, next: "Nov 1", status: "Active", method: "GCash", renewals: 14 },
  { id: "s2", customerId: "c5", plan: "Monthly · 500g", coffee: "Kapwa House Blend", grind: "Ground", price: 820, next: "Nov 1", status: "Active", method: "Card", renewals: 9 },
  { id: "s3", customerId: "c8", plan: "Every 2 weeks · 250g", coffee: "Fellowship Espresso Blend", grind: "Whole bean", price: 450, next: "Oct 31", status: "Active", method: "GCash", renewals: 22 },
  { id: "s4", customerId: "c13", plan: "Monthly · 250g", coffee: "Roaster's choice", grind: "Ground", price: 450, next: "Oct 30", status: "Payment failed", method: "Card", renewals: 7 },
  { id: "s5", customerId: "c3", plan: "Monthly · 250g", coffee: "Sagada Heirloom Arabica", grind: "Ground", price: 450, next: "Dec 3", status: "Paused", method: "Maya", renewals: 5 },
  { id: "s6", customerId: "c10", plan: "Monthly · 500g", coffee: "Roaster's choice", grind: "Whole bean", price: 820, next: "Nov 4", status: "Active", method: "Card", renewals: 11 },
  { id: "s7", customerId: "c11", plan: "Monthly · 250g", coffee: "Kapwa House Blend", grind: "Ground", price: 450, next: "Nov 5", status: "Active", method: "GCash", renewals: 6 },
  { id: "s8", customerId: "c2", plan: "Every 2 weeks · 250g", coffee: "Batangas Barako Liberica", grind: "Ground", price: 450, next: "Nov 6", status: "Active", method: "Maya", renewals: 3 },
  { id: "s9", customerId: "c19", plan: "Monthly · 250g", coffee: "Roaster's choice", grind: "Ground", price: 450, next: "Oct 30", status: "Payment failed", method: "GCash", renewals: 4 },
  { id: "s10", customerId: "c12", plan: "Monthly · 250g", coffee: "Mt. Apo Natural", grind: "Whole bean", price: 450, next: "Nov 8", status: "Active", method: "Maya", renewals: 2 },
];

const ADJUSTMENTS: Adjustment[] = [
  { id: "a4", variantId: "p6a", loc: "Cubao roastery", delta: 40, reason: "Roast batch received", at: "Today, 7:10 AM", by: "Rhea Domingo" },
  { id: "a3", variantId: "p8a", loc: "Maginhawa café", delta: 12, reason: "Transfer from Cubao roastery", at: "Oct 28", by: "Jun Pascual" },
  { id: "a2", variantId: "p10b", loc: "Cubao roastery", delta: -1, reason: "Damaged or expired", at: "Oct 27", by: "Rhea Domingo" },
  { id: "a1", variantId: "p3a", loc: "Cubao roastery", delta: 30, reason: "Roast batch received", at: "Oct 27", by: "Jun Pascual" },
];
const REASONS = ["Roast batch received", "Count correction", "Damaged or expired", "Transfer between locations"];

const PAYMENTS: PayMethod[] = [
  { id: "gcash", name: "GCash", detail: "E-wallet · settles next banking day", fee: "2.0% per order", on: true },
  { id: "maya", name: "Maya", detail: "E-wallet and QR · settles next banking day", fee: "2.0% per order", on: true },
  { id: "card", name: "Credit and debit cards", detail: "3D Secure · settles in 2 banking days", fee: "3.1% + ₱15", on: true },
  { id: "cod", name: "Cash on delivery", detail: "Collected by the courier · Metro Manila and Luzon", fee: "₱25 per order", on: true },
  { id: "bank", name: "Bank transfer", detail: "Manual · mark orders paid when the deposit clears", fee: "No fee", on: true },
  { id: "qr", name: "InstaPay QR", detail: "Any bank app · settles instantly", fee: "₱15 per order", on: false },
];

const ZONES: ShipZone[] = [
  { zone: "Metro Manila", areas: "All 17 cities and municipalities", cod: true, rates: [{ id: "r1", name: "Standard", eta: "1–2 days · J&T Express", price: 120, freeOver: 1500 }, { id: "r2", name: "Same day", eta: "Order by 2 PM · Grab Express", price: 220 }, { id: "r3", name: "Pickup at Maginhawa café", eta: "Ready in 2 hours", price: 0 }] },
  { zone: "Luzon", areas: "Provinces outside Metro Manila", cod: true, rates: [{ id: "r4", name: "Standard", eta: "2–4 days · J&T Express", price: 180, freeOver: 2500 }, { id: "r5", name: "Express", eta: "1–2 days · LBC Express", price: 260 }] },
  { zone: "Visayas", areas: "Cebu, Iloilo, Bacolod, Tacloban and more", cod: false, rates: [{ id: "r6", name: "Standard", eta: "3–5 days · LBC Express", price: 240, freeOver: 2500 }] },
  { zone: "Mindanao", areas: "Davao, Cagayan de Oro, Zamboanga and more", cod: false, rates: [{ id: "r7", name: "Standard", eta: "4–7 days · LBC Express", price: 280, freeOver: 2500 }] },
];

const COURIERS: { name: Courier; eta: string; metroOnly?: boolean }[] = [
  { name: "LBC Express", eta: "2–4 days nationwide · pickup at 3 PM" },
  { name: "J&T Express", eta: "1–3 days nationwide · pickup at 4 PM" },
  { name: "Grab Express", eta: "Same day · Metro Manila only", metroOnly: true },
  { name: "Kapwa rider", eta: "Our own rider · Quezon City and nearby", metroOnly: true },
];

const trackingFor = (c: Courier, id: string) => {
  const n = id.replace("#", "");
  return { "LBC Express": `LBC 1849 ${n} 2910`, "J&T Express": `JT7710 ${n} 1029`, "Grab Express": `GRB-1029-${n}`, "Kapwa rider": `KR-1029-${n.slice(-2)}` }[c];
};

// Analytics. Today's bar comes from live orders so the numbers move as visitors act.
const WEEK = [
  { label: "Oct 23", value: 7820 },
  { label: "24", value: 8410 },
  { label: "25", value: 9960 },
  { label: "26", value: 12140 },
  { label: "27", value: 8730 },
  { label: "28", value: 11990 },
];
const RANGES: Record<Range, { ordersBase: number; sessions: number; cart: number; checkout: number; factor: number }> = {
  "7d": { ordersBase: 48, sessions: 3080, cart: 436, checkout: 171, factor: 0.25 },
  "30d": { ordersBase: 207, sessions: 12480, cart: 1710, checkout: 702, factor: 1 },
  "90d": { ordersBase: 579, sessions: 35900, cart: 4860, checkout: 1990, factor: 2.7 },
};
const CHANNEL_SPLIT: [string, number][] = [["Online store", 0.68], ["Social shop", 0.14], ["Café POS", 0.11], ["Draft orders", 0.07]];

// ---- Helpers -----------------------------------------------------------------------


const ruleText = (r: Rule) => (r.field === "Tag" ? `Product tag is ${r.value}` : r.field === "Type" ? `Product type is ${r.value}` : `Price is less than ${peso(Number(r.value))}`);
const minPrice = (p: Product) => Math.min(...p.variants.map((x) => x.price));
const matches = (p: Product, r: Rule) => (r.field === "Tag" ? p.tags.includes(r.value) : r.field === "Type" ? p.type === r.value : minPrice(p) < Number(r.value));
const priceRange = (p: Product) => {
  const prices = p.variants.map((x) => x.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? peso(lo) : `${peso(lo)} – ${peso(hi)}`;
};
const refundTo = (m: Method) => (m === "Cash on delivery" || m === "Bank transfer" ? "bank transfer" : m === "Card" ? "the card" : m);
const otherLoc = (l: Loc): Loc => (l === "Cubao roastery" ? "Maginhawa café" : "Cubao roastery");
const deltaFor = (reason: string, qty: string) => {
  const n = Number(qty) || 0;
  return reason === "Count correction" ? n : reason === "Damaged or expired" ? -Math.abs(n) : Math.abs(n);
};

function summary(d: Pick<Discount, "type" | "value" | "appliesTo" | "minimum" | "getItem">) {
  const what =
    d.type === "Percentage"
      ? `${d.value}% off ${d.appliesTo.toLowerCase()}`
      : d.type === "Fixed amount"
        ? `${peso(d.value)} off ${d.appliesTo.toLowerCase()}`
        : d.type === "Free shipping"
          ? `Free shipping · ${d.appliesTo}`
          : `Buy ${d.value} ${d.appliesTo.toLowerCase()}, get ${d.getItem ?? "an item"} free`;
  return d.minimum ? `${what} · min. ${peso(d.minimum)}` : what;
}

const APPLIES: Record<DiscountType, string[]> = {
  Percentage: ["Entire order", "Single origin", "Gift boxes", "Drip bags", "Merch"],
  "Fixed amount": ["Entire order", "Single origin", "Gift boxes", "Drip bags", "Merch"],
  "Free shipping": ["All zones", "Metro Manila", "Luzon", "Visayas", "Mindanao"],
  "Buy X get Y": ["Bags of whole bean", "Drip bags", "Gift boxes"],
};

// Renewal dates around late 2026.
const MONTHS = ["Oct", "Nov", "Dec", "Jan"];
const MONTH_DAYS = [31, 30, 31, 31];
function nextRenewal(s: Sub) {
  const [mon, d] = s.next.split(" ");
  let m = MONTHS.indexOf(mon);
  let day = Number(d);
  if (s.plan.startsWith("Every 2 weeks")) {
    day += 14;
    if (day > MONTH_DAYS[m]) {
      day -= MONTH_DAYS[m];
      m += 1;
    }
  } else m += 1;
  return `${MONTHS[Math.min(m, 3)]} ${day}`;
}
const daysUntil = (date: string) => {
  const [mon, d] = date.split(" ");
  const m = MONTHS.indexOf(mon);
  return m === 0 ? Number(d) - 29 : m === 1 ? Number(d) + 2 : 32 + Number(d);
};

// Product image: the drawn packaging for that product.
function Thumb({ tone, label, size = 32 }: { tone: number; label: string; size?: number }) {
  const type = PRODUCTS.find((p) => p.title === label)?.type ?? "Whole bean";
  return (
    <span className="inline-flex rounded-md overflow-hidden shrink-0 ring-1 ring-rule" style={{ width: size, height: size }} aria-hidden>
      <ProductArt kind={artFor(type)} tone={tone} className="w-full h-full" />
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

// Buttons inside a clickable table row. Rows open on Enter and Space, so key
// presses on these buttons must not bubble up and open the row too.
function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex justify-end gap-1.5" onKeyDown={(e) => e.stopPropagation()}>
      {children}
    </span>
  );
}

function SumRow({ label, sub, value, strong, muted }: { label: string; sub?: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 text-[0.8rem]">
      <span className={cn(strong ? "font-semibold text-ink" : muted ? "text-mist" : "text-graphite")}>{label}</span>
      {sub && <span className="text-[0.7rem] text-mist truncate">{sub}</span>}
      <span className={cn("ml-auto font-mono tabular-nums", strong ? "font-semibold text-ink" : muted ? "text-mist" : "text-ink-soft")}>{value}</span>
    </div>
  );
}

function Pick({ on, title, sub, onClick, disabled }: { on: boolean; title: string; sub?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", on ? "border-gold bg-gold-wash" : "border-rule bg-sheet hover:border-mist")}
    >
      <span className={cn("w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center shrink-0", on ? "border-gold" : "border-rule")}>{on && <span className="w-2 h-2 rounded-full bg-gold" />}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[0.8rem] font-medium text-ink">{title}</span>
        {sub && <span className="block text-[0.7rem] text-mist">{sub}</span>}
      </span>
    </button>
  );
}

function CheckRow({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={onClick} className="w-full flex items-center gap-2.5 py-2 text-left cursor-pointer">
      <span className={cn("w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0", on ? "bg-gold border-gold text-sheet" : "border-rule bg-sheet")}>{on && <Check size={10} strokeWidth={3.5} />}</span>
      <span className="flex-1 min-w-0 flex items-center gap-2 text-[0.78rem] text-ink">{children}</span>
    </button>
  );
}

function ToggleRow({ title, sub, on, onChange }: { title: string; sub?: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block text-[0.8rem] font-medium text-ink">{title}</span>
        {sub && <span className="block text-[0.7rem] text-mist">{sub}</span>}
      </span>
      <Toggle on={on} onChange={onChange} label={title} />
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-raised text-[0.7rem] text-ink-soft">
      {label}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="text-mist hover:text-ink cursor-pointer">
          <X size={11} />
        </button>
      )}
    </span>
  );
}

// Compact table that sits flush inside a Panel.
function MiniTable({ cols, rows, empty }: { cols: { label: string; right?: boolean; hide?: boolean }[]; rows: { key: string; cells: React.ReactNode[]; onClick?: () => void }[]; empty?: string }) {
  return (
    <div className="-m-3.5 overflow-x-auto">
      <table className="w-full text-[0.78rem]">
        <thead>
          <tr className="border-b border-rule bg-paper">
            {cols.map((c, i) => (
              <th key={i} className={cn("px-3 py-2 text-[0.68rem] font-medium text-mist whitespace-nowrap", c.right ? "text-right" : "text-left", c.hide && "hidden md:table-cell")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} onClick={r.onClick} className={cn("border-b border-rule-soft last:border-0", r.onClick && "cursor-pointer hover:bg-paper")}>
              {r.cells.map((cell, i) => (
                <td key={i} className={cn("px-3 py-2 text-ink-soft align-middle", cols[i].right && "text-right", cols[i].hide && "hidden md:table-cell")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-3 py-6 text-center text-mist">
                {empty ?? "Nothing here yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const payTone = (s: PayStatus) => (s === "Paid" ? "good" : s === "Pending" ? "warn" : "muted");
const payLabel = (s: PayStatus) => (s === "Pending" ? "Payment pending" : s);
const PayBadge = ({ o }: { o: Order }) => <Status tone={payTone(o.payment)}>{payLabel(o.payment)}</Status>;
const FulfilBadge = ({ o }: { o: Order }) => <Status tone={o.fulfilled ? "muted" : "warn"}>{o.fulfilled ? "Fulfilled" : "Unfulfilled"}</Status>;

type ModalKind = "fulfill" | "refund" | "draft" | "viewDraft" | "product" | "variant" | "seo" | "adjust" | "collection" | "customer" | "discount" | "campaign" | "rate";

// ---- The app -----------------------------------------------------------------------

export function StorePrototype() {
  const app = useProtoApp("home");
  const [products, setProducts] = useState(PRODUCTS);
  const [orders, setOrders] = useState(ORDERS);
  const [drafts, setDrafts] = useState(DRAFTS);
  const [checkouts, setCheckouts] = useState(CHECKOUTS);
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [collections, setCollections] = useState(COLLECTIONS);
  const [discounts, setDiscounts] = useState(DISCOUNTS);
  const [campaigns, setCampaigns] = useState(CAMPAIGNS);
  const [subs, setSubs] = useState(SUBS);
  const [adjustments, setAdjustments] = useState(ADJUSTMENTS);
  const [payments, setPayments] = useState(PAYMENTS);
  const [zones, setZones] = useState(ZONES);
  const [vat, setVat] = useState({ included: true, shipping: true });

  const [orderTab, setOrderTab] = useState<"orders" | "drafts" | "abandoned">("orders");
  const [orderFilter, setOrderFilter] = useState<"all" | "unfulfilled" | "unpaid" | "open" | "archived">("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | Product["status"]>("all");
  const [productQuery, setProductQuery] = useState("");
  const [invTab, setInvTab] = useState<"stock" | "collections">("stock");
  const [invFilter, setInvFilter] = useState<"all" | "low" | "committed">("all");
  const [invQuery, setInvQuery] = useState("");
  const [segment, setSegment] = useState<"all" | "repeat" | "subscribers" | "lapsed">("all");
  const [customerQuery, setCustomerQuery] = useState("");
  const [discountFilter, setDiscountFilter] = useState<"all" | Discount["status"]>("all");
  const [discountQuery, setDiscountQuery] = useState("");
  const [range, setRange] = useState<Range>("30d");
  const [mktTab, setMktTab] = useState<"campaigns" | "subscriptions">("campaigns");
  const [settingsTab, setSettingsTab] = useState<"payments" | "shipping" | "taxes">("payments");

  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [tagDraft, setTagDraft] = useState("");

  // One slide-over at a time. A stable close keeps the panel's focus handling steady.
  const [modal, setModal] = useState<ModalKind | null>(null);
  const close = useCallback(() => setModal(null), []);
  const [fulfillForm, setFulfillForm] = useState({ courier: "LBC Express" as Courier, tracking: "", notify: true });
  const [refundForm, setRefundForm] = useState({ picked: [] as string[], shipping: false, restock: true, reason: "" });
  const [draftForm, setDraftForm] = useState({ customerId: "c1", variantId: "p6a", qty: "1", pct: "0" });
  const [viewDraftId, setViewDraftId] = useState("");
  const [productForm, setProductForm] = useState({ title: "", description: "", type: "Whole bean" as ProductType, price: "", compareAt: "", sku: "", stock: "0", status: "Draft" as Product["status"] });
  const [variantForm, setVariantForm] = useState({ variantId: "", name: "", price: "", compareAt: "", sku: "" });
  const [seoForm, setSeoForm] = useState({ title: "", description: "" });
  const [adjustForm, setAdjustForm] = useState({ variantId: "p2b", loc: "Cubao roastery" as Loc, reason: REASONS[0], qty: "20" });
  const [collectionForm, setCollectionForm] = useState({ title: "", kind: "Automatic" as Collection["kind"], field: "Tag" as Rule["field"], value: "single-origin", picked: [] as string[] });
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", city: "", zone: "Metro Manila" as Zone, marketing: true });
  const [discountForm, setDiscountForm] = useState({ method: "Code" as Discount["method"], code: "", type: "Percentage" as DiscountType, value: "10", getItem: "House Blend drip bags", appliesTo: "Entire order", minimum: "0", limit: "", starts: "Today" });
  const [campaignForm, setCampaignForm] = useState({ name: "", subject: "", audience: "All subscribers" as Audience, when: "now" as "now" | "later" });
  const [rateForm, setRateForm] = useState({ zone: "Metro Manila" as Zone, rateId: "", name: "", eta: "", price: "", freeOver: "" });

  // ---- Derived data ----
  const allVariants = products.flatMap((p) => p.variants.map((x) => ({ p, v: x })));
  const find = (variantId: string) => allVariants.find((x) => x.v.id === variantId);
  // Units in unfulfilled orders are committed: still on the shelf, but already sold.
  const committedMap = orders
    .filter((o) => !o.fulfilled && !o.archived && o.payment !== "Refunded")
    .flatMap((o) => o.lines)
    .reduce<Record<string, number>>((m, l) => ({ ...m, [l.variantId]: (m[l.variantId] ?? 0) + l.qty }), {});
  const committed = (id: string) => committedMap[id] ?? 0;
  const onHand = (x: Variant) => LOCS.reduce((s, l) => s + x.stock[l], 0);
  const available = (x: Variant) => onHand(x) - committed(x.id);
  const lowVariants = allVariants.filter(({ v: x }) => available(x) < LOW);
  const customer = (id?: string) => customers.find((c) => c.id === id);
  const ordersOf = (id: string) => orders.filter((o) => o.customerId === id);
  const net = (o: Order) => totalOf(o) - o.refunded;
  const spent = (c: Customer) => c.pastSpent + ordersOf(c.id).reduce((s, o) => s + net(o), 0);
  const orderCount = (c: Customer) => c.pastOrders + ordersOf(c.id).length;
  const subOf = (id: string) => subs.find((s) => s.customerId === id);
  const isLapsed = (c: Customer) => ordersOf(c.id).length === 0 && c.lastDays >= 90;
  const shipFor = (zone: Zone, subtotal: number) => {
    const r = zones.find((z) => z.zone === zone)!.rates[0];
    return r.freeOver && subtotal >= r.freeOver ? 0 : r.price;
  };
  const members = (c: Collection) => (c.kind === "Manual" ? products.filter((p) => c.productIds.includes(p.id)) : products.filter((p) => matches(p, c.rule!)));
  const collectionsOf = (p: Product) => collections.filter((c) => members(c).some((m) => m.id === p.id));
  const draftTotal = (d: Draft) => {
    const subtotal = sum(d.lines);
    return subtotal - Math.round((subtotal * d.pct) / 100) + shipFor(customer(d.customerId)?.zone ?? "Metro Manila", subtotal);
  };

  const todayOrders = orders.filter((o) => o.date === TODAY);
  const salesToday = todayOrders.reduce((s, o) => s + net(o), 0);
  const unfulfilled = orders.filter((o) => !o.fulfilled && !o.archived);
  const unpaid = orders.filter((o) => o.payment === "Pending" && !o.archived);
  const openCheckouts = checkouts.filter((c) => c.status === "Not sent");
  const failedSubs = subs.filter((s) => s.status === "Payment failed");
  const activeSubs = subs.filter((s) => s.status === "Active");
  const monthly = (s: Sub) => (s.plan.startsWith("Every 2 weeks") ? s.price * 2 : s.price);

  const order = orders.find((o) => o.id === app.id);
  const oc = order ? customer(order.customerId) : undefined;
  const product = products.find((p) => p.id === app.id);
  const collection = collections.find((c) => c.id === app.id);
  const person = customers.find((c) => c.id === app.id);
  const discount = discounts.find((d) => d.id === app.id);
  const campaign = campaigns.find((c) => c.id === app.id);
  const viewDraft = drafts.find((d) => d.id === viewDraftId);

  const bars: Record<Range, { label: string; value: number }[]> = {
    "7d": [...WEEK, { label: "29", value: salesToday }],
    "30d": [{ label: "Oct 1–7", value: 58200 }, { label: "8–14", value: 63900 }, { label: "15–21", value: 61410 }, { label: "22–29", value: 73136 + salesToday }],
    "90d": [{ label: "Aug", value: 198400 }, { label: "Sep", value: 245450 }, { label: "Oct", value: 256646 + salesToday }],
  };
  const R = RANGES[range];
  const rangeSales = bars[range].reduce((s, b) => s + b.value, 0);
  const rangeOrders = R.ordersBase + todayOrders.length;

  // ---- Navigation helpers ----
  const goOrders = (filter: typeof orderFilter) => {
    setOrderTab("orders");
    setOrderFilter(filter);
    app.section("orders");
  };
  // Swap the record on screen for another (after duplicating) without growing the breadcrumb.
  const replace = (screen: string, id: string, label: string) => {
    app.back();
    app.open(screen, id, label);
  };

  // ---- Orders ----
  const updateOrder = (id: string, fn: (o: Order) => Order) => setOrders((list) => list.map((o) => (o.id === id ? fn(o) : o)));
  const log = (o: Order, ...texts: string[]): Note[] => [...texts.map((text) => ({ text, at: "Today" })), ...o.timeline];
  const moveStock = (lines: Line[], loc: Loc, sign: 1 | -1) =>
    setProducts((list) =>
      list.map((p) => ({
        ...p,
        variants: p.variants.map((x) => {
          const qty = lines.filter((l) => l.variantId === x.id).reduce((s, l) => s + l.qty, 0);
          return qty ? { ...x, stock: { ...x.stock, [loc]: Math.max(0, x.stock[loc] + sign * qty) } } : x;
        }),
      })),
    );

  const pickCourier = (courier: Courier, id: string) => setFulfillForm((f) => ({ ...f, courier, tracking: trackingFor(courier, id) }));
  const openFulfill = (o: Order) => {
    setFulfillForm({ courier: "LBC Express", tracking: trackingFor("LBC Express", o.id), notify: true });
    setModal("fulfill");
  };
  const fulfillOrder = () => {
    if (!order || !oc || !fulfillForm.tracking.trim()) return;
    const { courier, notify } = fulfillForm;
    const tracking = fulfillForm.tracking.trim();
    moveStock(order.lines, "Cubao roastery", -1); // parcels leave from the roastery
    updateOrder(order.id, (o) => ({ ...o, fulfilled: true, courier, tracking, timeline: log(o, ...(notify ? [`Shipping confirmation sent to ${oc.email}.`] : []), `Fulfilled via ${courier}. Tracking ${tracking}.`) }));
    close();
    app.notify(`${order.id} fulfilled via ${courier}${notify ? `. Tracking sent to ${oc.name.split(" ")[0]}.` : "."}`);
  };

  const openRefund = (o: Order) => {
    setRefundForm({ picked: o.lines.map((l) => l.variantId), shipping: false, restock: true, reason: "" });
    setModal("refund");
  };
  const refundAmount = order
    ? Math.max(
        0,
        Math.min(
          totalOf(order) - order.refunded,
          sum(order.lines.filter((l) => refundForm.picked.includes(l.variantId))) - (refundForm.picked.length === order.lines.length ? order.discount : 0) + (refundForm.shipping ? order.shipping : 0),
        ),
      )
    : 0;
  const refundOrder = () => {
    if (!order || refundAmount <= 0) return;
    const full = order.refunded + refundAmount >= totalOf(order);
    const restock = refundForm.restock && order.fulfilled;
    if (restock) moveStock(order.lines.filter((l) => refundForm.picked.includes(l.variantId)), "Cubao roastery", 1);
    const reason = refundForm.reason.trim();
    updateOrder(order.id, (o) => ({
      ...o,
      refunded: o.refunded + refundAmount,
      payment: full ? "Refunded" : "Partially refunded",
      timeline: log(o, `Refunded ${peso(refundAmount)} to ${refundTo(o.method)}.${reason ? ` ${reason}` : ""}${restock ? " Items restocked at Cubao roastery." : ""}`),
    }));
    close();
    app.notify(`Refunded ${peso(refundAmount)} to ${refundTo(order.method)}`);
  };

  const markPaid = (o: Order) => {
    updateOrder(o.id, (x) => ({ ...x, payment: "Paid", timeline: log(x, `${peso(totalOf(x))} ${x.method === "Cash on delivery" ? "collected on delivery" : "bank transfer confirmed"}. Marked as paid by Rhea Domingo.`) }));
    app.notify(`${o.id} marked as paid`);
  };
  const toggleArchive = (o: Order) => {
    updateOrder(o.id, (x) => ({ ...x, archived: !x.archived, timeline: log(x, x.archived ? "Order unarchived." : "Order archived.") }));
    app.notify(o.archived ? `${o.id} unarchived` : `${o.id} archived`);
  };
  const postComment = () => {
    if (!order || !comment.trim()) return;
    updateOrder(order.id, (o) => ({ ...o, timeline: [{ text: comment.trim(), at: "Today · Rhea Domingo" }, ...o.timeline] }));
    setComment("");
    app.notify("Comment posted");
  };

  const openDraft = (customerId = "c1") => {
    setDraftForm({ customerId, variantId: "p6a", qty: "1", pct: "0" });
    setModal("draft");
  };
  const dfHit = find(draftForm.variantId);
  const dfSubtotal = (dfHit?.v.price ?? 0) * (Number(draftForm.qty) || 0);
  const dfDiscount = Math.round((dfSubtotal * (Number(draftForm.pct) || 0)) / 100);
  const dfShipping = shipFor(customer(draftForm.customerId)?.zone ?? "Metro Manila", dfSubtotal);
  const saveDraft = () => {
    const qty = Number(draftForm.qty);
    if (!qty || !dfHit) return;
    const id = `#D${Math.max(...drafts.map((d) => Number(d.id.slice(2)))) + 1}`;
    setDrafts((list) => [{ id, customerId: draftForm.customerId, lines: [{ variantId: dfHit.v.id, qty, price: dfHit.v.price }], pct: Math.min(100, Number(draftForm.pct) || 0), status: "Open", created: TODAY }, ...list]);
    close();
    setOrderTab("drafts");
    app.section("orders");
    app.notify(`Draft ${id} saved for ${customer(draftForm.customerId)?.name}`);
  };
  const sendInvoice = (d: Draft) => {
    setDrafts((list) => list.map((x) => (x.id === d.id ? { ...x, status: "Invoice sent" } : x)));
    app.notify(`Invoice for ${d.id} sent to ${customer(d.customerId)?.email}`);
  };
  const markDraftPaid = (d: Draft) => {
    const who = customer(d.customerId);
    if (!who) return;
    const id = `#${Math.max(...orders.map((o) => Number(o.id.slice(1)))) + 1}`;
    const subtotal = sum(d.lines);
    const disc = Math.round((subtotal * d.pct) / 100);
    const shipping = shipFor(who.zone, subtotal);
    const created: Order = {
      id,
      date: TODAY,
      time: "Just now",
      customerId: who.id,
      lines: d.lines,
      zone: who.zone,
      address: who.address,
      method: "Bank transfer",
      payment: "Paid",
      fulfilled: false,
      code: d.pct ? `${d.pct}% wholesale discount` : undefined,
      discount: disc,
      shipping,
      channel: "Draft order",
      archived: false,
      refunded: 0,
      timeline: [{ text: `${peso(subtotal - disc + shipping)} paid via bank transfer.`, at: "Today" }, { text: `Created from draft ${d.id}.`, at: "Today" }],
    };
    setOrders((list) => [created, ...list]);
    setDrafts((list) => list.map((x) => (x.id === d.id ? { ...x, status: "Completed", orderId: id } : x)));
    app.notify(`Draft ${d.id} paid. Order ${id} is ready to fulfill.`);
  };
  const sendRecovery = (c: Checkout) => {
    setCheckouts((list) => list.map((x) => (x.id === c.id ? { ...x, status: "Email sent" } : x)));
    app.notify(`Recovery email sent to ${c.email}`);
  };

  // ---- Products ----
  const updateProduct = (id: string, fn: (p: Product) => Product) => setProducts((list) => list.map((p) => (p.id === id ? fn(p) : p)));
  const openCreateProduct = () => {
    setProductForm({ title: "", description: "", type: "Whole bean", price: "", compareAt: "", sku: "", stock: "0", status: "Draft" });
    setModal("product");
  };
  const createProduct = () => {
    const title = productForm.title.trim();
    const price = Number(productForm.price);
    if (!title || !price) return;
    const id = `p${products.length + 1}`;
    const variant: Variant = { id: `${id}a`, name: "Default", sku: productForm.sku.trim() || `KCC-${id.toUpperCase()}`, price, compareAt: Number(productForm.compareAt) || undefined, stock: { "Cubao roastery": Number(productForm.stock) || 0, "Maginhawa café": 0 } };
    setProducts((list) => [makeProduct(id, title, productForm.type, [], productForm.description.trim(), 0, [variant], productForm.status), ...list]);
    close();
    app.open("product", id, title);
    app.notify(`${title} created as ${productForm.status.toLowerCase()}`);
  };
  const duplicate = (p: Product) => {
    const id = `p${products.length + 1}`;
    const title = `${p.title} (copy)`;
    setProducts((list) => [
      { ...p, id, title, status: "Draft", handle: `${p.handle}-copy`, seoTitle: `${title} | Kapwa Coffee Co.`, sold30: 0, variants: p.variants.map((x, i) => ({ ...x, id: `${id}-${i + 1}`, sku: `${x.sku}-C`, stock: { "Cubao roastery": 0, "Maginhawa café": 0 } })) },
      ...list,
    ]);
    replace("product", id, title);
    app.notify(`Duplicated as a draft: ${title}`);
  };
  const setStatus = (p: Product, status: Product["status"]) => {
    if (p.status === status) return;
    updateProduct(p.id, (x) => ({ ...x, status }));
    app.notify(status === "Active" ? `${p.title} is live on the online store` : `${p.title} set to draft and hidden from the store`);
  };
  const openVariant = (x?: Variant) => {
    setVariantForm(x ? { variantId: x.id, name: x.name, price: String(x.price), compareAt: x.compareAt ? String(x.compareAt) : "", sku: x.sku } : { variantId: "", name: "", price: "", compareAt: "", sku: "" });
    setModal("variant");
  };
  const saveVariant = () => {
    if (!product) return;
    const name = variantForm.name.trim();
    const price = Number(variantForm.price);
    if (!name || !price) return;
    const compareAt = Number(variantForm.compareAt) || undefined;
    if (variantForm.variantId) {
      updateProduct(product.id, (p) => ({ ...p, variants: p.variants.map((x) => (x.id === variantForm.variantId ? { ...x, name, price, compareAt, sku: variantForm.sku.trim() || x.sku } : x)) }));
      app.notify(`${name} saved at ${peso(price)}`);
    } else {
      updateProduct(product.id, (p) => ({ ...p, variants: [...p.variants, { id: `${p.id}-v${p.variants.length + 1}`, name, sku: variantForm.sku.trim() || `${p.variants[0].sku}-${p.variants.length + 1}`, price, compareAt, stock: { "Cubao roastery": 0, "Maginhawa café": 0 } }] }));
      app.notify(`Variant ${name} added`);
    }
    close();
  };
  const openSeo = (p: Product) => {
    setSeoForm({ title: p.seoTitle, description: p.seoDescription });
    setModal("seo");
  };
  const saveSeo = () => {
    if (!product) return;
    updateProduct(product.id, (p) => ({ ...p, seoTitle: seoForm.title.trim() || p.seoTitle, seoDescription: seoForm.description.trim() }));
    close();
    app.notify("Search engine listing saved");
  };

  // ---- Inventory ----
  const openAdjust = (variantId: string) => {
    setAdjustForm({ variantId, loc: "Cubao roastery", reason: REASONS[0], qty: "20" });
    setModal("adjust");
  };
  const adjHit = find(adjustForm.variantId);
  const adjTransfer = adjustForm.reason === "Transfer between locations";
  const adjFrom = otherLoc(adjustForm.loc);
  const adjDelta = adjHit ? (adjTransfer ? Math.min(deltaFor(adjustForm.reason, adjustForm.qty), adjHit.v.stock[adjFrom]) : deltaFor(adjustForm.reason, adjustForm.qty)) : 0;
  const saveAdjust = () => {
    if (!adjHit || !adjDelta) return;
    const { loc, reason } = adjustForm;
    const stock = { ...adjHit.v.stock };
    stock[loc] = Math.max(0, stock[loc] + adjDelta);
    if (adjTransfer) stock[adjFrom] -= adjDelta;
    setProducts((list) => list.map((p) => ({ ...p, variants: p.variants.map((x) => (x.id === adjHit.v.id ? { ...x, stock } : x)) })));
    setAdjustments((list) => [{ id: `a${list.length + 1}`, variantId: adjHit.v.id, loc, delta: adjDelta, reason: adjTransfer ? `Transfer from ${adjFrom}` : reason, at: "Today", by: "Rhea Domingo" }, ...list]);
    close();
    app.notify(adjTransfer ? `Moved ${adjDelta} × ${adjHit.p.title} to ${loc}` : `${adjHit.p.title}, ${adjHit.v.name}: ${loc} now has ${stock[loc]}`);
  };
  const openCollection = () => {
    setCollectionForm({ title: "", kind: "Automatic", field: "Tag", value: "single-origin", picked: [] });
    setModal("collection");
  };
  const draftCollection: Collection =
    collectionForm.kind === "Manual"
      ? { id: "new", title: collectionForm.title, kind: "Manual", productIds: collectionForm.picked }
      : { id: "new", title: collectionForm.title, kind: "Automatic", productIds: [], rule: { field: collectionForm.field, value: collectionForm.value } };
  const saveCollection = () => {
    const title = collectionForm.title.trim();
    if (!title) return;
    const id = `k${collections.length + 1}`;
    setCollections((list) => [...list, { ...draftCollection, id, title }]);
    close();
    app.open("collection", id, title);
    app.notify(`${title} created with ${count(members(draftCollection).length, "product")}`);
  };
  const setMembers = (c: Collection, ids: string[]) => setCollections((list) => list.map((x) => (x.id === c.id ? { ...x, productIds: ids } : x)));
  const allTags = [...new Set(products.flatMap((p) => p.tags))].sort();

  // ---- Customers ----
  const updateCustomer = (id: string, fn: (c: Customer) => Customer) => setCustomers((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  const openCustomer = () => {
    setCustomerForm({ name: "", email: "", phone: "", city: "", zone: "Metro Manila", marketing: true });
    setModal("customer");
  };
  const saveCustomer = () => {
    const name = customerForm.name.trim();
    if (!name) return;
    const id = `c${customers.length + 1}`;
    const city = customerForm.city.trim() || "—";
    setCustomers((list) => [{ id, name, email: customerForm.email.trim() || "—", phone: customerForm.phone.trim() || "—", address: city, city, zone: customerForm.zone, since: "Oct 2026", pastOrders: 0, pastSpent: 0, lastDays: 0, marketing: customerForm.marketing, tags: [], notes: [] }, ...list]);
    close();
    app.open("customer", id, name);
    app.notify(`${name} added to customers`);
  };
  const updateSub = (id: string, fn: (s: Sub) => Sub) => setSubs((list) => list.map((s) => (s.id === id ? fn(s) : s)));
  const firstName = (customerId: string) => customer(customerId)?.name.split(" ")[0] ?? "Customer";
  const skipSub = (s: Sub) => {
    const next = nextRenewal(s);
    updateSub(s.id, (x) => ({ ...x, next }));
    app.notify(`Skipped. ${firstName(s.customerId)}'s next renewal is ${next}.`);
  };
  const pauseSub = (s: Sub) => {
    updateSub(s.id, (x) => ({ ...x, status: "Paused" }));
    app.notify(`${firstName(s.customerId)}'s subscription paused`);
  };
  const resumeSub = (s: Sub) => {
    updateSub(s.id, (x) => ({ ...x, status: "Active" }));
    app.notify(`${firstName(s.customerId)}'s subscription resumed. Next renewal ${s.next}.`);
  };
  const retrySub = (s: Sub) => {
    const next = nextRenewal(s);
    updateSub(s.id, (x) => ({ ...x, status: "Active", renewals: x.renewals + 1, next }));
    app.notify(`${peso(s.price)} collected from ${firstName(s.customerId)} via ${s.method === "Card" ? "card" : s.method}. Next renewal ${next}.`);
  };
  const subActions = (s: Sub) =>
    s.status === "Payment failed" ? (
      <SmallButton onClick={() => retrySub(s)}>Retry payment</SmallButton>
    ) : s.status === "Paused" ? (
      <SmallButton onClick={() => resumeSub(s)}>Resume</SmallButton>
    ) : (
      <>
        <SmallButton onClick={() => skipSub(s)}>Skip next</SmallButton>
        <SmallButton onClick={() => pauseSub(s)}>Pause</SmallButton>
      </>
    );
  const subTone = (s: Sub) => (s.status === "Active" ? "good" : s.status === "Paused" ? "muted" : "bad");

  // ---- Discounts ----
  const openDiscount = () => {
    setDiscountForm({ method: "Code", code: "", type: "Percentage", value: "10", getItem: "House Blend drip bags", appliesTo: "Entire order", minimum: "0", limit: "", starts: "Today" });
    setModal("discount");
  };
  const discountPreview = { type: discountForm.type, value: Number(discountForm.value) || 0, appliesTo: discountForm.appliesTo, minimum: Number(discountForm.minimum) || 0, getItem: discountForm.getItem };
  const saveDiscount = () => {
    const f = discountForm;
    const code = f.method === "Code" ? f.code.trim().toUpperCase() : f.code.trim() || summary(discountPreview);
    if (!code || (f.type !== "Free shipping" && !discountPreview.value)) return;
    const id = `d${discounts.length + 1}`;
    setDiscounts((list) => [
      { id, code, method: f.method, type: f.type, value: discountPreview.value, getItem: f.type === "Buy X get Y" ? f.getItem : undefined, appliesTo: f.appliesTo, minimum: discountPreview.minimum, eligibility: "All customers", used: 0, limit: Number(f.limit) || undefined, sales: 0, status: f.starts === "Today" ? "Active" : "Scheduled", dates: f.starts === "Today" ? "Starts today" : `Starts ${f.starts}` },
      ...list,
    ]);
    close();
    app.open("discount", id, code);
    app.notify(`Discount ${code} created`);
  };
  const toggleDiscount = (d: Discount) => {
    const status = d.status === "Active" ? "Expired" : "Active";
    setDiscounts((list) => list.map((x) => (x.id === d.id ? { ...x, status, dates: status === "Expired" ? "Ended Oct 29" : x.dates === "Ended Oct 29" ? "Reactivated Oct 29" : x.dates } : x)));
    app.notify(status === "Active" ? `${d.code} activated` : `${d.code} deactivated`);
  };

  // ---- Marketing ----
  const openCampaign = () => {
    setCampaignForm({ name: "", subject: "", audience: "All subscribers", when: "now" });
    setModal("campaign");
  };
  const saveCampaign = () => {
    const f = campaignForm;
    if (!f.name.trim() || !f.subject.trim()) return;
    const now = f.when === "now";
    setCampaigns((list) => [{ id: `m${list.length + 1}`, name: f.name.trim(), subject: f.subject.trim(), audience: f.audience, status: now ? "Sent" : "Scheduled", when: now ? "Today" : "Nov 1, 8:00 AM", recipients: AUDIENCES[f.audience], hero: "Hero image", body: "Fresh roasts every Monday from our Cubao roastery." }, ...list]);
    close();
    app.notify(now ? `Campaign sent to ${count(AUDIENCES[f.audience], "person", "people")}` : "Campaign scheduled for Nov 1, 8:00 AM");
  };
  const sendCampaign = (c: Campaign) => {
    setCampaigns((list) => list.map((x) => (x.id === c.id ? { ...x, status: "Sent", when: "Today", recipients: AUDIENCES[c.audience] } : x)));
    app.notify(`${c.name} sent to ${count(AUDIENCES[c.audience], "person", "people")}`);
  };
  const duplicateCampaign = (c: Campaign) => {
    const id = `m${campaigns.length + 1}`;
    const name = `${c.name} (copy)`;
    setCampaigns((list) => [{ ...c, id, name, status: "Draft", when: "Not scheduled", opens: undefined, clicks: undefined, orders: undefined, sales: undefined }, ...list]);
    replace("campaign", id, name);
    app.notify("Campaign duplicated as a draft");
  };

  // ---- Settings ----
  const togglePayment = (m: PayMethod) => {
    setPayments((list) => list.map((x) => (x.id === m.id ? { ...x, on: !x.on } : x)));
    app.notify(m.on ? `${m.name} turned off at checkout` : `${m.name} turned on at checkout`);
  };
  const openRate = (zone: Zone, r?: Rate) => {
    setRateForm(r ? { zone, rateId: r.id, name: r.name, eta: r.eta, price: String(r.price), freeOver: r.freeOver ? String(r.freeOver) : "" } : { zone, rateId: "", name: "", eta: "", price: "", freeOver: "" });
    setModal("rate");
  };
  const saveRate = () => {
    const f = rateForm;
    if (!f.name.trim() || f.price === "") return;
    const rate: Rate = { id: f.rateId || `r${zones.reduce((s, z) => s + z.rates.length, 0) + 1}`, name: f.name.trim(), eta: f.eta.trim() || "—", price: Number(f.price) || 0, freeOver: Number(f.freeOver) || undefined };
    setZones((list) => list.map((z) => (z.zone !== f.zone ? z : { ...z, rates: f.rateId ? z.rates.map((r) => (r.id === f.rateId ? rate : r)) : [...z.rates, rate] })));
    close();
    app.notify(`${f.zone} · ${rate.name} rate saved`);
  };
  const vatOctober = orders.filter((o) => o.date.startsWith("Oct")).reduce((s, o) => s + net(o), 0) + 210400;

  // ---- Lists ----
  const visibleOrders = orders.filter((o) => {
    const text = `${o.id} ${customer(o.customerId)?.name ?? ""}`.toLowerCase().includes(orderQuery.toLowerCase());
    const inFilter =
      orderFilter === "all" ||
      (orderFilter === "unfulfilled" && !o.fulfilled && !o.archived) ||
      (orderFilter === "unpaid" && o.payment === "Pending") ||
      (orderFilter === "open" && !o.archived) ||
      (orderFilter === "archived" && o.archived);
    return text && inFilter;
  });
  const visibleProducts = products.filter((p) => (productFilter === "all" || p.status === productFilter) && `${p.title} ${p.type} ${p.tags.join(" ")} ${p.variants.map((x) => x.sku).join(" ")}`.toLowerCase().includes(productQuery.toLowerCase()));
  const visibleStock = allVariants.filter(({ p, v: x }) => `${p.title} ${x.name} ${x.sku}`.toLowerCase().includes(invQuery.toLowerCase()) && (invFilter === "all" || (invFilter === "low" && available(x) < LOW) || (invFilter === "committed" && committed(x.id) > 0)));
  const visibleCustomers = customers.filter((c) => {
    const text = `${c.name} ${c.email} ${c.city} ${c.tags.join(" ")}`.toLowerCase().includes(customerQuery.toLowerCase());
    const inSegment = segment === "all" || (segment === "repeat" && orderCount(c) >= 2) || (segment === "subscribers" && !!subOf(c.id)) || (segment === "lapsed" && isLapsed(c));
    return text && inSegment;
  });
  const visibleDiscounts = discounts.filter((d) => (discountFilter === "all" || d.status === discountFilter) && `${d.code} ${d.type}`.toLowerCase().includes(discountQuery.toLowerCase()));
  const topProducts = [...products].sort((a, b) => b.sold30 - a.sold30);
  const todos = [
    { n: unfulfilled.length, text: `${count(unfulfilled.length, "order")} to fulfill`, sub: "Ship from Cubao roastery", urgent: false, go: () => goOrders("unfulfilled") },
    { n: unpaid.length, text: `${count(unpaid.length, "payment")} to collect`, sub: "Cash on delivery and bank transfers", urgent: false, go: () => goOrders("unpaid") },
    {
      n: lowVariants.length,
      text: `${count(lowVariants.length, "variant")} low on stock`,
      sub: `Fewer than ${LOW} available`,
      urgent: true,
      go: () => {
        setInvTab("stock");
        setInvFilter("low");
        app.section("inventory");
      },
    },
    {
      n: openCheckouts.length,
      text: `${count(openCheckouts.length, "abandoned checkout")} to recover`,
      sub: `${peso(openCheckouts.reduce((s, c) => s + c.total, 0))} left in carts`,
      urgent: false,
      go: () => {
        setOrderTab("abandoned");
        app.section("orders");
      },
    },
    {
      n: failedSubs.length,
      text: `${count(failedSubs.length, "subscription renewal")} failed`,
      sub: "Wallet or card declined",
      urgent: true,
      go: () => {
        setMktTab("subscriptions");
        app.section("marketing");
      },
    },
  ].filter((t) => t.n > 0);

  const nav = [
    { id: "home", label: "Home", icon: Home },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: unfulfilled.length },
    { id: "products", label: "Products", icon: Tag },
    { id: "inventory", label: "Inventory", icon: Boxes, badge: lowVariants.length },
    { id: "customers", label: "Customers", icon: Users },
    { id: "discounts", label: "Discounts", icon: Percent },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const lineRow = (l: Line) => {
    const hit = find(l.variantId);
    return (
      <li key={l.variantId} className="flex items-center gap-3 py-2">
        <Thumb tone={hit?.p.tone ?? 0} label={hit?.p.title ?? "?"} size={36} />
        <span className="flex-1 min-w-0">
          <span className="block text-[0.8rem] text-ink truncate">{hit?.p.title}</span>
          <span className="block text-[0.7rem] text-mist">{`${hit?.v.name} · SKU ${hit?.v.sku}`}</span>
        </span>
        <span className="hidden sm:inline font-mono text-[0.74rem] text-graphite">{`${peso(l.price)} × ${l.qty}`}</span>
        <span className="w-20 text-right font-mono text-[0.78rem] text-ink">{peso(l.price * l.qty)}</span>
      </li>
    );
  };

  return (
    <ProtoApp app={app} name="Online Store · Kapwa Coffee Co." user="Rhea Domingo" nav={nav} alerts={lowVariants.length + failedSubs.length}>
      {/* ---------------- Home ---------------- */}
      {app.screen === "home" && (
        <>
          <ScreenHeader
            title="Home"
            subtitle="Thursday, October 29 · Kapwa Coffee Co."
            action={
              <SmallButton onClick={() => app.section("analytics")}>
                <BarChart3 size={12} /> View analytics
              </SmallButton>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Sales today" value={peso(salesToday)} sub="+18% vs last Thursday" tone="good" />
            <Stat label="Orders" value={String(todayOrders.length)} sub={`${unfulfilled.length} to fulfill`} />
            <Stat label="Sessions" value={SESSIONS_TODAY.toLocaleString("en-US")} sub="64% on mobile" />
            <Stat label="Conversion rate" value={pct(todayOrders.length, SESSIONS_TODAY)} sub="+0.3 pts vs last week" tone="good" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="To do">
                {todos.length === 0 ? (
                  <p className="text-[0.8rem] text-graphite">All caught up. Nothing needs you right now.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
                    {todos.map((t) => (
                      <li key={t.sub}>
                        <button type="button" onClick={t.go} className="group w-full flex items-center gap-3 py-2 text-left cursor-pointer">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.urgent ? "bg-danger" : "bg-warn")} aria-hidden />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[0.8rem] font-medium text-ink group-hover:text-gold">{t.text}</span>
                            <span className="block text-[0.7rem] text-mist">{t.sub}</span>
                          </span>
                          <ChevronRight size={14} className="text-mist" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title="Sales, last 7 days">
                <Bars data={bars["7d"]} format={(n) => `${(n / 1000).toFixed(1)}k`} />
              </Panel>
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Top products" action={<span className="text-[0.7rem] text-mist">Last 30 days</span>}>
                <ul className="flex flex-col gap-2.5">
                  {topProducts.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => app.open("product", p.id, p.title)} className="group w-full flex items-center gap-2.5 text-left cursor-pointer">
                        <Thumb tone={p.tone} label={p.title} size={30} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[0.78rem] text-ink truncate group-hover:text-gold">{p.title}</span>
                          <Meter value={p.sold30} max={topProducts[0].sold30} className="mt-1" />
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block font-mono text-[0.74rem] text-ink">{peso(p.sold30 * minPrice(p))}</span>
                          <span className="block text-[0.66rem] text-mist">{`${p.sold30} sold`}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Recent orders" action={<SmallButton onClick={() => goOrders("all")}>View all</SmallButton>}>
                <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
                  {orders.slice(0, 5).map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => app.open("order", o.id, o.id)} className="group w-full flex items-center gap-2.5 py-2 text-left cursor-pointer">
                        <span className="w-12 text-[0.78rem] font-medium text-ink group-hover:text-gold">{o.id}</span>
                        <span className="flex-1 min-w-0 text-[0.76rem] text-ink-soft truncate">{customer(o.customerId)?.name}</span>
                        <FulfilBadge o={o} />
                        <span className="w-16 text-right font-mono text-[0.74rem] text-ink">{peso(totalOf(o))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Orders ---------------- */}
      {app.screen === "orders" && (
        <>
          <ScreenHeader
            title="Orders"
            subtitle={`${count(orders.filter((o) => !o.archived).length, "open order")} · ${peso(salesToday)} today`}
            action={
              <>
                <SmallButton onClick={() => app.notify(`Exported ${count(visibleOrders.length, "order")} to CSV`)}>
                  <Download size={12} /> Export
                </SmallButton>
                <PrimaryButton onClick={() => openDraft()}>
                  <Plus size={14} /> Create order
                </PrimaryButton>
              </>
            }
          />
          <div className="mb-3">
            <Segmented
              id="st-otab"
              value={orderTab}
              onChange={setOrderTab}
              options={[
                { id: "orders", label: "Orders" },
                { id: "drafts", label: "Drafts" },
                { id: "abandoned", label: "Abandoned checkouts" },
              ]}
            />
          </div>

          {orderTab === "orders" && (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SearchBox value={orderQuery} onChange={setOrderQuery} placeholder="Search order number or customer" />
                <Segmented
                  id="st-ofilter"
                  value={orderFilter}
                  onChange={setOrderFilter}
                  options={[
                    { id: "all", label: "All" },
                    { id: "unfulfilled", label: "Unfulfilled" },
                    { id: "unpaid", label: "Unpaid" },
                    { id: "open", label: "Open" },
                    { id: "archived", label: "Archived" },
                  ]}
                />
              </div>
              <Table
                rows={visibleOrders}
                rowKey={(o) => o.id}
                onRowClick={(o) => app.open("order", o.id, o.id)}
                empty="No orders match."
                columns={[
                  { key: "id", label: "Order", render: (o) => <span className="font-medium text-ink">{o.id}</span> },
                  { key: "date", label: "Date", render: (o) => (o.date === TODAY ? `Today, ${o.time}` : o.date), hideOnMobile: true },
                  { key: "who", label: "Customer", render: (o) => customer(o.customerId)?.name },
                  { key: "total", label: "Total", align: "right", render: (o) => <span className="font-mono text-ink">{peso(totalOf(o))}</span> },
                  { key: "pay", label: "Payment", render: (o) => <PayBadge o={o} /> },
                  { key: "ful", label: "Fulfillment", render: (o) => <FulfilBadge o={o} />, hideOnMobile: true },
                  { key: "items", label: "Items", render: (o) => count(qtyOf(o.lines), "item"), hideOnMobile: true },
                ]}
              />
            </>
          )}

          {orderTab === "drafts" && (
            <Table
              rows={drafts}
              rowKey={(d) => d.id}
              onRowClick={(d) => {
                setViewDraftId(d.id);
                setModal("viewDraft");
              }}
              columns={[
                { key: "id", label: "Draft", render: (d) => <span className="font-medium text-ink">{d.id}</span> },
                { key: "who", label: "Customer", render: (d) => customer(d.customerId)?.name },
                { key: "items", label: "Items", render: (d) => d.lines.map((l) => `${find(l.variantId)?.p.title} × ${l.qty}`).join(", "), hideOnMobile: true },
                { key: "total", label: "Total", align: "right", render: (d) => <span className="font-mono text-ink">{peso(draftTotal(d))}</span> },
                { key: "status", label: "Status", render: (d) => <Status tone={d.status === "Completed" ? "good" : d.status === "Invoice sent" ? "warn" : "muted"}>{d.status}</Status> },
                {
                  key: "act",
                  label: "",
                  align: "right",
                  render: (d) =>
                    d.status === "Completed" ? (
                      <span className="text-[0.72rem] text-mist">{`Order ${d.orderId}`}</span>
                    ) : (
                      <RowActions>
                        {d.status === "Open" && <SmallButton onClick={() => sendInvoice(d)}>Send invoice</SmallButton>}
                        <SmallButton onClick={() => markDraftPaid(d)}>Mark as paid</SmallButton>
                      </RowActions>
                    ),
                },
              ]}
            />
          )}

          {orderTab === "abandoned" && (
            <>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <Stat label="Abandoned, 7 days" value={peso(checkouts.reduce((s, c) => s + c.total, 0))} sub={count(checkouts.length, "checkout")} />
                <Stat label="Recovery emails sent" value={String(checkouts.filter((c) => c.status !== "Not sent").length)} sub="Sent 1 hour after leaving" />
                <Stat label="Recovered, October" value={peso(18240)} sub="23 orders came back" tone="good" />
              </div>
              <Table
                rows={checkouts}
                rowKey={(c) => c.id}
                columns={[
                  {
                    key: "who",
                    label: "Customer",
                    render: (c) => (
                      <span className="block">
                        <span className="block text-ink">{c.name}</span>
                        <span className="block text-[0.7rem] text-mist">{c.email}</span>
                      </span>
                    ),
                  },
                  { key: "items", label: "Cart", render: (c) => c.items, hideOnMobile: true },
                  { key: "total", label: "Total", align: "right", render: (c) => <span className="font-mono text-ink">{peso(c.total)}</span> },
                  { key: "when", label: "Left", render: (c) => c.when, hideOnMobile: true },
                  {
                    key: "act",
                    label: "Recovery",
                    align: "right",
                    render: (c) =>
                      c.status === "Not sent" ? (
                        <RowActions>
                          <SmallButton onClick={() => sendRecovery(c)}>
                            <Send size={11} /> Send recovery email
                          </SmallButton>
                        </RowActions>
                      ) : (
                        <Status tone={c.status === "Recovered" ? "good" : "warn"}>{c.status}</Status>
                      ),
                  },
                ]}
              />
            </>
          )}
        </>
      )}

      {/* ---------------- Order detail ---------------- */}
      {app.screen === "order" && order && oc && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[1.2rem] leading-tight font-semibold text-ink tracking-[-0.01em]">{order.id}</h4>
                <PayBadge o={order} />
                <FulfilBadge o={order} />
                {order.archived && <Status tone="muted">Archived</Status>}
              </div>
              <p className="text-[0.78rem] text-mist mt-0.5">{`${order.date === TODAY ? "Today" : order.date}, ${order.time} · ${order.channel}`}</p>
            </div>
            <div className="flex gap-2">
              <SmallButton onClick={() => openRefund(order)} disabled={order.payment === "Pending" || order.payment === "Refunded"}>
                <RotateCcw size={12} /> Refund
              </SmallButton>
              <SmallButton onClick={() => toggleArchive(order)}>
                <Archive size={12} /> {order.archived ? "Unarchive" : "Archive"}
              </SmallButton>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title={order.fulfilled ? `Fulfilled · ${order.courier}` : `Unfulfilled · ${count(qtyOf(order.lines), "item")}`}>
                <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">{order.lines.map(lineRow)}</ul>
                <div className="mt-3 pt-3 border-t border-rule flex flex-wrap items-center justify-between gap-2">
                  {order.fulfilled ? (
                    <>
                      <span className="text-[0.74rem] text-graphite">{`Tracking ${order.tracking}`}</span>
                      <SmallButton onClick={() => app.notify(`Tracking link sent to ${oc.email}`)}>
                        <Send size={11} /> Resend tracking
                      </SmallButton>
                    </>
                  ) : (
                    <>
                      <span className="text-[0.74rem] text-graphite">{`Ships from Cubao roastery to ${order.zone}`}</span>
                      <PrimaryButton onClick={() => openFulfill(order)}>
                        <Truck size={14} /> Fulfill items
                      </PrimaryButton>
                    </>
                  )}
                </div>
              </Panel>
              <Panel title={payLabel(order.payment)}>
                <div className="flex flex-col gap-1.5">
                  <SumRow label="Subtotal" sub={count(qtyOf(order.lines), "item")} value={peso(sum(order.lines))} />
                  {order.discount > 0 && <SumRow label="Discount" sub={order.code} value={`−${peso(order.discount)}`} />}
                  <SumRow label="Shipping" sub={order.zone} value={order.shipping ? peso(order.shipping) : "Free"} />
                  <SumRow label="Total" value={peso(totalOf(order))} strong />
                  <SumRow label="Includes VAT (12%)" value={peso((totalOf(order) * 12) / 112)} muted />
                  <div className="border-t border-rule my-1" />
                  <SumRow label={order.payment === "Pending" ? "Balance due" : "Paid by customer"} sub={order.method} value={peso(totalOf(order))} strong />
                  {order.refunded > 0 && <SumRow label="Refunded" value={`−${peso(order.refunded)}`} />}
                  {order.refunded > 0 && <SumRow label="Net payment" value={peso(net(order))} strong />}
                </div>
                {order.payment === "Pending" && (
                  <div className="mt-3 flex justify-end">
                    <PrimaryButton onClick={() => markPaid(order)}>Mark as paid</PrimaryButton>
                  </div>
                )}
              </Panel>
              <Panel title="Timeline">
                <form
                  className="flex gap-2 mb-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    postComment();
                  }}
                >
                  <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a comment for the team" aria-label="Comment" className={inputClass} />
                  <PrimaryButton type="submit" disabled={!comment.trim()}>
                    Post
                  </PrimaryButton>
                </form>
                <ol className="flex flex-col gap-3 ml-1 pl-4 border-l border-rule">
                  {order.timeline.map((t, i) => (
                    <li key={`${t.text}-${i}`} className="relative">
                      <span className={cn("absolute -left-[1.3rem] top-1 w-2 h-2 rounded-full ring-2 ring-sheet", i === 0 ? "bg-gold" : "bg-mist")} aria-hidden />
                      <span className="block text-[0.78rem] text-ink-soft">{t.text}</span>
                      <span className="block text-[0.66rem] text-mist">{t.at}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Customer">
                <button type="button" onClick={() => app.open("customer", oc.id, oc.name)} className="group flex items-center gap-2.5 text-left cursor-pointer">
                  <Avatar name={oc.name} size={32} />
                  <span>
                    <span className="block text-[0.82rem] font-medium text-ink group-hover:text-gold">{oc.name}</span>
                    <span className="block text-[0.7rem] text-mist">{`${count(orderCount(oc), "order")} · ${peso(spent(oc))} spent`}</span>
                  </span>
                </button>
                <div className="mt-3 flex flex-col gap-1 text-[0.76rem] text-ink-soft">
                  <span>{oc.email}</span>
                  <span>{oc.phone}</span>
                </div>
                {oc.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {oc.tags.map((t) => (
                      <Chip key={t} label={t} />
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="Shipping address">
                <p className="text-[0.78rem] text-ink-soft leading-relaxed">
                  {oc.name}
                  <br />
                  {order.address}
                  <br />
                  {order.zone}
                </p>
                <p className="mt-2 text-[0.72rem] text-mist">{order.shipping === 0 ? "Free standard shipping" : `${peso(order.shipping)} standard shipping`}</p>
              </Panel>
              {subOf(oc.id) && (
                <Panel title="Kapwa Monthly">
                  <KeyValues
                    items={[
                      ["Plan", subOf(oc.id)!.plan],
                      ["Next renewal", subOf(oc.id)!.next],
                      ["Status", <Status key="s" tone={subTone(subOf(oc.id)!)}>{subOf(oc.id)!.status}</Status>],
                    ]}
                  />
                </Panel>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---------------- Products ---------------- */}
      {app.screen === "products" && (
        <>
          <ScreenHeader
            title="Products"
            subtitle={`${products.filter((p) => p.status === "Active").length} active · ${products.filter((p) => p.status === "Draft").length} draft`}
            action={
              <PrimaryButton onClick={openCreateProduct}>
                <Plus size={14} /> Add product
              </PrimaryButton>
            }
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={productQuery} onChange={setProductQuery} placeholder="Search products, tags or SKU" />
            <Segmented
              id="st-pfilter"
              value={productFilter}
              onChange={setProductFilter}
              options={[
                { id: "all", label: "All" },
                { id: "Active", label: "Active" },
                { id: "Draft", label: "Draft" },
              ]}
            />
          </div>
          <Table
            rows={visibleProducts}
            rowKey={(p) => p.id}
            onRowClick={(p) => app.open("product", p.id, p.title)}
            empty={`No products match "${productQuery}".`}
            columns={[
              {
                key: "title",
                label: "Product",
                render: (p) => (
                  <span className="flex items-center gap-2.5">
                    <Thumb tone={p.tone} label={p.title} size={28} />
                    <span className="text-ink">{p.title}</span>
                  </span>
                ),
              },
              { key: "status", label: "Status", render: (p) => <Status tone={p.status === "Active" ? "good" : "muted"}>{p.status}</Status> },
              {
                key: "inv",
                label: "Inventory",
                render: (p) => {
                  const low = p.variants.some((x) => available(x) < LOW);
                  return <span className={cn(low && "text-warn")}>{`${p.variants.reduce((s, x) => s + available(x), 0)} in stock${p.variants.length > 1 ? ` · ${p.variants.length} variants` : ""}`}</span>;
                },
              },
              { key: "type", label: "Type", render: (p) => p.type, hideOnMobile: true },
              { key: "price", label: "Price", align: "right", render: (p) => <span className="font-mono text-ink">{priceRange(p)}</span>, hideOnMobile: true },
            ]}
          />
        </>
      )}

      {/* ---------------- Product detail ---------------- */}
      {app.screen === "product" && product && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <Thumb tone={product.tone} label={product.title} size={40} />
              <div className="min-w-0">
                <h4 className="text-[1.2rem] leading-tight font-semibold text-ink tracking-[-0.01em] truncate">{product.title}</h4>
                <div className="mt-1 flex items-center gap-2">
                  <Status tone={product.status === "Active" ? "good" : "muted"}>{product.status}</Status>
                  <span className="text-[0.74rem] text-mist">{`${product.type} · ${count(product.variants.length, "variant")}`}</span>
                </div>
              </div>
            </div>
            <SmallButton onClick={() => duplicate(product)}>
              <Copy size={12} /> Duplicate
            </SmallButton>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Details">
                <div className="text-[0.82rem] font-medium text-ink">{product.title}</div>
                <p className="mt-1 text-[0.78rem] text-ink-soft leading-relaxed">{product.description || "No description yet."}</p>
              </Panel>
              <Panel
                title="Media"
                action={
                  <SmallButton onClick={() => {
                    updateProduct(product.id, (p) => ({ ...p, media: [...p.media, `Image ${p.media.length + 1}`] }));
                    app.notify("Image added to media");
                  }}>
                    <Plus size={12} /> Add media
                  </SmallButton>
                }
              >
                <div className="grid grid-cols-4 gap-2">
                  {product.media.map((m, i) => (
                    <div key={`${m}-${i}`} className={cn("relative aspect-square rounded-lg overflow-hidden ring-1 ring-rule", i === 0 && "col-span-2 row-span-2")}>
                      <ProductArt kind={i === 0 ? artFor(product.type) : artFor(product.type, m)} tone={product.tone} className="w-full h-full" />
                      <span className="sr-only">{m}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel
                title="Variants"
                action={
                  <SmallButton onClick={() => openVariant()}>
                    <Plus size={12} /> Add variant
                  </SmallButton>
                }
              >
                <MiniTable
                  cols={[{ label: "Variant" }, { label: "Price", right: true }, { label: "Compare-at", right: true }, { label: "SKU", hide: true }, { label: "Available", right: true }, { label: "", right: true }]}
                  rows={product.variants.map((x) => ({
                    key: x.id,
                    cells: [
                      <span key="n" className="text-ink">{x.name}</span>,
                      <span key="p" className="font-mono text-ink">{peso(x.price)}</span>,
                      <span key="c" className="font-mono text-mist line-through">{x.compareAt ? peso(x.compareAt) : ""}</span>,
                      <span key="s" className="font-mono text-[0.7rem] text-graphite">{x.sku}</span>,
                      <span key="a" className={cn("tabular-nums", available(x) < LOW ? "text-warn font-medium" : "text-ink-soft")}>{available(x)}</span>,
                      <SmallButton key="e" onClick={() => openVariant(x)}>Edit</SmallButton>,
                    ],
                  }))}
                />
              </Panel>
              <Panel title="Inventory by location">
                <MiniTable
                  cols={[{ label: "Variant" }, { label: "Cubao roastery", right: true }, { label: "Maginhawa café", right: true }, { label: "Committed", right: true, hide: true }, { label: "Available", right: true }, { label: "", right: true }]}
                  rows={product.variants.map((x) => ({
                    key: x.id,
                    cells: [
                      <span key="n" className="text-ink">{x.name}</span>,
                      <span key="a" className="tabular-nums">{x.stock["Cubao roastery"]}</span>,
                      <span key="b" className="tabular-nums">{x.stock["Maginhawa café"]}</span>,
                      <span key="c" className="tabular-nums text-mist">{committed(x.id)}</span>,
                      <span key="d" className={cn("tabular-nums font-medium", available(x) < LOW ? "text-warn" : "text-ink")}>{available(x)}</span>,
                      <SmallButton key="e" onClick={() => openAdjust(x.id)}>Adjust</SmallButton>,
                    ],
                  }))}
                />
              </Panel>
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Status">
                <Segmented id="st-pstatus" value={product.status} onChange={(s) => setStatus(product, s)} options={[{ id: "Active", label: "Active" }, { id: "Draft", label: "Draft" }]} />
                <p className="mt-2 text-[0.72rem] text-mist">{product.status === "Active" ? "Live on the online store, social shop and café POS." : "Hidden from every sales channel."}</p>
              </Panel>
              <Panel title="Product organization">
                <KeyValues
                  items={[
                    ["Type", product.type],
                    ["Vendor", "Kapwa Coffee Co."],
                    ["Collections", collectionsOf(product).map((c) => c.title).join(", ") || "None"],
                    [
                      "Tags",
                      <span key="t" className="flex flex-wrap gap-1">
                        {product.tags.length ? product.tags.map((t) => <Chip key={t} label={t} />) : "None"}
                      </span>,
                    ],
                  ]}
                />
              </Panel>
              <Panel title="Search engine listing" action={<SmallButton onClick={() => openSeo(product)}>Edit</SmallButton>}>
                <div className="text-[0.7rem] text-good truncate">{`kapwacoffee.ph › products › ${product.handle}`}</div>
                <div className="mt-0.5 text-[0.86rem] text-trace font-medium leading-snug">{product.seoTitle}</div>
                <p className="mt-1 text-[0.74rem] text-graphite leading-relaxed">{product.seoDescription || "Add a description to show in search results."}</p>
              </Panel>
              <Panel title="Last 30 days">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[1.15rem] font-semibold text-ink tabular-nums">{product.sold30}</div>
                    <div className="text-[0.7rem] text-mist">Units sold</div>
                  </div>
                  <div>
                    <div className="text-[1.15rem] font-semibold text-ink tabular-nums">{peso(product.sold30 * minPrice(product))}</div>
                    <div className="text-[0.7rem] text-mist">Sales</div>
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Inventory ---------------- */}
      {app.screen === "inventory" && (
        <>
          <ScreenHeader
            title="Inventory"
            subtitle={invTab === "stock" ? `${count(allVariants.length, "variant")} · Cubao roastery and Maginhawa café` : `${count(collections.length, "collection")}`}
            action={
              invTab === "collections" ? (
                <PrimaryButton onClick={openCollection}>
                  <Plus size={14} /> Create collection
                </PrimaryButton>
              ) : (
                <SmallButton onClick={() => app.notify("Stock count sheet exported for both locations")}>
                  <Download size={12} /> Export count sheet
                </SmallButton>
              )
            }
          />
          <div className="mb-3">
            <Segmented id="st-inv" value={invTab} onChange={setInvTab} options={[{ id: "stock", label: "Stock" }, { id: "collections", label: "Collections" }]} />
          </div>

          {invTab === "stock" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="On hand" value={allVariants.reduce((s, { v: x }) => s + onHand(x), 0).toLocaleString("en-US")} sub="Units, both locations" />
                <Stat label="Committed" value={String(Object.values(committedMap).reduce((s, n) => s + n, 0))} sub="In unfulfilled orders" />
                <Stat label="Low stock" value={String(lowVariants.length)} sub={`Fewer than ${LOW} available`} tone={lowVariants.length ? "bad" : undefined} />
                <Stat label="Retail value" value={peso(allVariants.reduce((s, { v: x }) => s + onHand(x) * x.price, 0))} />
              </div>
              {lowVariants.length > 0 && (
                <Panel title="Low stock alerts" className="mb-3">
                  <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
                    {lowVariants.map(({ p, v: x }) => (
                      <li key={x.id} className="flex items-center gap-2.5 py-2">
                        <Thumb tone={p.tone} label={p.title} size={28} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-[0.78rem] text-ink truncate">{`${p.title} · ${x.name}`}</span>
                          <span className="block text-[0.68rem] text-mist">{`Cubao ${x.stock["Cubao roastery"]} · Maginhawa ${x.stock["Maginhawa café"]} · ${committed(x.id)} committed`}</span>
                        </span>
                        <Status tone={available(x) <= 0 ? "bad" : "warn"}>{available(x) <= 0 ? "Out of stock" : `${available(x)} left`}</Status>
                        <SmallButton onClick={() => openAdjust(x.id)}>Adjust</SmallButton>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SearchBox value={invQuery} onChange={setInvQuery} placeholder="Search product, variant or SKU" />
                <Segmented
                  id="st-ifilter"
                  value={invFilter}
                  onChange={setInvFilter}
                  options={[
                    { id: "all", label: "All" },
                    { id: "low", label: "Low stock" },
                    { id: "committed", label: "Committed" },
                  ]}
                />
              </div>
              <Table
                rows={visibleStock}
                rowKey={(r) => r.v.id}
                onRowClick={(r) => app.open("product", r.p.id, r.p.title)}
                empty="No variants match."
                columns={[
                  {
                    key: "name",
                    label: "Variant",
                    render: ({ p, v: x }) => (
                      <span className="flex items-center gap-2.5">
                        <Thumb tone={p.tone} label={p.title} size={26} />
                        <span className="min-w-0">
                          <span className="block text-ink truncate">{p.title}</span>
                          <span className="block text-[0.7rem] text-mist">{x.name}</span>
                        </span>
                      </span>
                    ),
                  },
                  { key: "sku", label: "SKU", render: ({ v: x }) => <span className="font-mono text-[0.7rem]">{x.sku}</span>, hideOnMobile: true },
                  { key: "cubao", label: "Cubao", align: "right", render: ({ v: x }) => <span className="tabular-nums">{x.stock["Cubao roastery"]}</span> },
                  { key: "cafe", label: "Maginhawa", align: "right", render: ({ v: x }) => <span className="tabular-nums">{x.stock["Maginhawa café"]}</span> },
                  { key: "com", label: "Committed", align: "right", render: ({ v: x }) => <span className="tabular-nums text-mist">{committed(x.id)}</span>, hideOnMobile: true },
                  { key: "avail", label: "Available", align: "right", render: ({ v: x }) => <span className={cn("tabular-nums font-medium", available(x) < LOW ? "text-warn" : "text-ink")}>{available(x)}</span> },
                  {
                    key: "act",
                    label: "",
                    align: "right",
                    render: ({ v: x }) => (
                      <RowActions>
                        <SmallButton onClick={() => openAdjust(x.id)}>Adjust</SmallButton>
                      </RowActions>
                    ),
                  },
                ]}
              />
              <Panel title="Recent adjustments" className="mt-3">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
                  {adjustments.slice(0, 6).map((a) => {
                    const hit = find(a.variantId);
                    return (
                      <li key={a.id} className="flex items-center gap-3 py-2 text-[0.78rem]">
                        <span className={cn("w-12 font-mono tabular-nums", a.delta > 0 ? "text-good" : "text-danger")}>{a.delta > 0 ? `+${a.delta}` : `−${-a.delta}`}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-ink truncate">{`${hit?.p.title} · ${hit?.v.name}`}</span>
                          <span className="block text-[0.68rem] text-mist">{`${a.reason} · ${a.loc}`}</span>
                        </span>
                        <span className="text-right text-[0.68rem] text-mist">{`${a.at} · ${a.by}`}</span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </>
          )}

          {invTab === "collections" && (
            <Table
              rows={collections}
              rowKey={(c) => c.id}
              onRowClick={(c) => app.open("collection", c.id, c.title)}
              columns={[
                { key: "title", label: "Collection", render: (c) => <span className="text-ink">{c.title}</span> },
                { key: "kind", label: "Type", render: (c) => <Status tone={c.kind === "Automatic" ? "good" : "muted"}>{c.kind}</Status> },
                { key: "rule", label: "Conditions", render: (c) => (c.rule ? ruleText(c.rule) : "Picked by hand"), hideOnMobile: true },
                { key: "n", label: "Products", align: "right", render: (c) => <span className="tabular-nums">{members(c).length}</span> },
              ]}
            />
          )}
        </>
      )}

      {/* ---------------- Collection detail ---------------- */}
      {app.screen === "collection" && collection && (
        <>
          <ScreenHeader
            title={collection.title}
            subtitle={`${collection.kind} collection · ${count(members(collection).length, "product")}`}
            action={
              <SmallButton onClick={() => app.notify(`Link copied: kapwacoffee.ph/collections/${slug(collection.title)}`)}>
                <Copy size={12} /> Copy link
              </SmallButton>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
            <Panel
              title="Products"
              action={
                collection.kind === "Manual" ? (
                  <select
                    aria-label="Add product to collection"
                    value=""
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      if (!p) return;
                      setMembers(collection, [...collection.productIds, p.id]);
                      app.notify(`${p.title} added to ${collection.title}`);
                    }}
                    className="h-7 px-2 rounded-md bg-sheet border border-rule text-[0.72rem] text-ink cursor-pointer"
                  >
                    <option value="" disabled>
                      Add product…
                    </option>
                    {products
                      .filter((p) => !collection.productIds.includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                  </select>
                ) : undefined
              }
            >
              <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
                {members(collection).map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5 py-2">
                    <Thumb tone={p.tone} label={p.title} size={28} />
                    <button type="button" onClick={() => app.open("product", p.id, p.title)} className="flex-1 min-w-0 text-left text-[0.8rem] text-ink hover:text-gold truncate cursor-pointer">
                      {p.title}
                    </button>
                    <Status tone={p.status === "Active" ? "good" : "muted"}>{p.status}</Status>
                    <span className="w-24 text-right font-mono text-[0.74rem] text-ink-soft">{priceRange(p)}</span>
                    {collection.kind === "Manual" && (
                      <button
                        type="button"
                        aria-label={`Remove ${p.title}`}
                        onClick={() => {
                          setMembers(collection, collection.productIds.filter((id) => id !== p.id));
                          app.notify(`${p.title} removed from ${collection.title}`);
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-mist hover:bg-raised hover:text-ink cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </li>
                ))}
                {members(collection).length === 0 && <li className="py-4 text-[0.8rem] text-mist">No products yet.</li>}
              </ul>
            </Panel>
            <Panel title={collection.kind === "Automatic" ? "Conditions" : "Collection type"}>
              {collection.rule ? (
                <>
                  <p className="text-[0.76rem] text-graphite">Products must match:</p>
                  <div className="mt-2 px-3 py-2 rounded-lg border border-rule bg-paper text-[0.8rem] text-ink">{ruleText(collection.rule)}</div>
                  <p className="mt-2 text-[0.72rem] text-mist">New products that match join this collection on their own.</p>
                </>
              ) : (
                <p className="text-[0.78rem] text-graphite leading-relaxed">Manual. Products are added and removed by hand, in the order shown on the store.</p>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Customers ---------------- */}
      {app.screen === "customers" && (
        <>
          <ScreenHeader
            title="Customers"
            subtitle={`${count(customers.length, "customer")} · ${customers.filter((c) => c.marketing).length} subscribed to email`}
            action={
              <PrimaryButton onClick={openCustomer}>
                <UserPlus size={14} /> Add customer
              </PrimaryButton>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Repeat customer rate" value={pct(customers.filter((c) => orderCount(c) >= 2).length, customers.length)} sub="2 or more orders" tone="good" />
            <Stat label="Average lifetime value" value={peso(customers.reduce((s, c) => s + spent(c), 0) / customers.length)} />
            <Stat label="Kapwa Monthly" value={String(customers.filter((c) => subOf(c.id)).length)} sub="Coffee subscribers" />
            <Stat label="Lapsed" value={String(customers.filter(isLapsed).length)} sub="No order in 90 days" tone="bad" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={customerQuery} onChange={setCustomerQuery} placeholder="Search name, email, city or tag" />
            <Segmented
              id="st-seg"
              value={segment}
              onChange={setSegment}
              options={[
                { id: "all", label: "All" },
                { id: "repeat", label: "Repeat buyers" },
                { id: "subscribers", label: "Subscribers" },
                { id: "lapsed", label: "Lapsed" },
              ]}
            />
          </div>
          <Table
            rows={visibleCustomers}
            rowKey={(c) => c.id}
            onRowClick={(c) => app.open("customer", c.id, c.name)}
            empty="No customers in this segment."
            columns={[
              {
                key: "name",
                label: "Customer",
                render: (c) => (
                  <span className="flex items-center gap-2">
                    <Avatar name={c.name} size={24} />
                    <span className="text-ink">{c.name}</span>
                  </span>
                ),
              },
              { key: "mkt", label: "Email", render: (c) => <Status tone={c.marketing ? "good" : "muted"}>{c.marketing ? "Subscribed" : "Not subscribed"}</Status>, hideOnMobile: true },
              { key: "city", label: "Location", render: (c) => c.city, hideOnMobile: true },
              { key: "orders", label: "Orders", align: "right", render: (c) => <span className="tabular-nums">{orderCount(c)}</span> },
              { key: "spent", label: "Amount spent", align: "right", render: (c) => <span className="font-mono text-ink">{peso(spent(c))}</span> },
            ]}
          />
        </>
      )}

      {/* ---------------- Customer profile ---------------- */}
      {app.screen === "customer" && person && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Avatar name={person.name} size={48} />
            <div className="flex-1 min-w-0">
              <h4 className="text-[1.2rem] leading-tight font-semibold text-ink tracking-[-0.01em]">{person.name}</h4>
              <p className="text-[0.76rem] text-mist mt-0.5">{`${person.city} · Customer since ${person.since}`}</p>
            </div>
            <SmallButton onClick={() => openDraft(person.id)}>
              <Plus size={12} /> Create order
            </SmallButton>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Amount spent" value={peso(spent(person))} sub="Lifetime value" />
            <Stat label="Orders" value={String(orderCount(person))} />
            <Stat label="Average order" value={orderCount(person) ? peso(spent(person) / orderCount(person)) : "—"} />
            <Stat
              label="Last order"
              value={ordersOf(person.id).length ? ordersOf(person.id)[0].date : orderCount(person) ? `${person.lastDays} days ago` : "None yet"}
              sub={isLapsed(person) ? "Lapsed" : undefined}
              tone={isLapsed(person) ? "bad" : undefined}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Orders">
                {ordersOf(person.id).length ? (
                  <MiniTable
                    cols={[{ label: "Order" }, { label: "Date" }, { label: "Payment", hide: true }, { label: "Fulfillment" }, { label: "Total", right: true }]}
                    rows={ordersOf(person.id).map((o) => ({
                      key: o.id,
                      onClick: () => app.open("order", o.id, o.id),
                      cells: [<span key="i" className="font-medium text-ink">{o.id}</span>, o.date, <PayBadge key="p" o={o} />, <FulfilBadge key="f" o={o} />, <span key="t" className="font-mono text-ink">{peso(totalOf(o))}</span>],
                    }))}
                  />
                ) : (
                  <p className="text-[0.78rem] text-graphite">{person.pastOrders ? `${count(person.pastOrders, "earlier order")}. Last one ${person.lastDays} days ago.` : "No orders yet."}</p>
                )}
              </Panel>
              {subOf(person.id) && (
                <Panel title="Kapwa Monthly" action={<span className="flex gap-1.5">{subActions(subOf(person.id)!)}</span>}>
                  <KeyValues
                    items={[
                      ["Plan", `${subOf(person.id)!.plan} · ${peso(subOf(person.id)!.price)}`],
                      ["Coffee", `${subOf(person.id)!.coffee} · ${subOf(person.id)!.grind}`],
                      ["Next renewal", subOf(person.id)!.next],
                      ["Pays with", subOf(person.id)!.method],
                      ["Renewals", String(subOf(person.id)!.renewals)],
                      ["Status", <Status key="s" tone={subTone(subOf(person.id)!)}>{subOf(person.id)!.status}</Status>],
                    ]}
                  />
                </Panel>
              )}
              <Panel title="Notes">
                <ul className="flex flex-col gap-2 mb-3">
                  {person.notes.map((n, i) => (
                    <li key={i} className="text-[0.78rem]">
                      <span className="block text-ink-soft">{n.text}</span>
                      <span className="block text-[0.66rem] text-mist">{n.at}</span>
                    </li>
                  ))}
                  {person.notes.length === 0 && <li className="text-[0.78rem] text-graphite">No notes yet.</li>}
                </ul>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!note.trim()) return;
                    updateCustomer(person.id, (c) => ({ ...c, notes: [...c.notes, { text: note.trim(), at: "Today · Rhea Domingo" }] }));
                    setNote("");
                    app.notify("Note saved");
                  }}
                >
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" aria-label="Add a note" className={inputClass} />
                  <PrimaryButton type="submit" disabled={!note.trim()}>
                    Save
                  </PrimaryButton>
                </form>
              </Panel>
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Contact">
                <KeyValues items={[["Email", person.email], ["Phone", person.phone], ["Address", person.address], ["Shipping zone", person.zone]]} />
                <div className="mt-2 border-t border-rule">
                  <ToggleRow
                    title="Email marketing"
                    sub={person.marketing ? "Subscribed" : "Not subscribed"}
                    on={person.marketing}
                    onChange={(on) => {
                      updateCustomer(person.id, (c) => ({ ...c, marketing: on }));
                      app.notify(on ? `${person.name} subscribed to email` : `${person.name} unsubscribed from email`);
                    }}
                  />
                </div>
              </Panel>
              <Panel title="Tags">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {person.tags.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      onRemove={() => {
                        updateCustomer(person.id, (c) => ({ ...c, tags: c.tags.filter((x) => x !== t) }));
                        app.notify(`Tag ${t} removed`);
                      }}
                    />
                  ))}
                  {person.tags.length === 0 && <span className="text-[0.76rem] text-graphite">No tags.</span>}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = tagDraft.trim();
                    if (!t || person.tags.includes(t)) return;
                    updateCustomer(person.id, (c) => ({ ...c, tags: [...c.tags, t] }));
                    setTagDraft("");
                    app.notify(`Tag ${t} added`);
                  }}
                >
                  <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="Wholesale, Gift buyer…" aria-label="Add a tag" className={inputClass} />
                  <SmallButton
                    onClick={() => {
                      const t = tagDraft.trim();
                      if (!t || person.tags.includes(t)) return;
                      updateCustomer(person.id, (c) => ({ ...c, tags: [...c.tags, t] }));
                      setTagDraft("");
                      app.notify(`Tag ${t} added`);
                    }}
                  >
                    Add
                  </SmallButton>
                </form>
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Discounts ---------------- */}
      {app.screen === "discounts" && (
        <>
          <ScreenHeader
            title="Discounts"
            subtitle={`${discounts.filter((d) => d.status === "Active").length} active · ${discounts.filter((d) => d.status === "Scheduled").length} scheduled`}
            action={
              <PrimaryButton onClick={openDiscount}>
                <Plus size={14} /> Create discount
              </PrimaryButton>
            }
          />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Uses, active discounts" value={String(discounts.filter((d) => d.status === "Active").reduce((s, d) => s + d.used, 0))} />
            <Stat label="Sales with a discount" value={peso(discounts.filter((d) => d.status === "Active").reduce((s, d) => s + d.sales, 0))} sub="Active discounts, all time" />
            <Stat label="Most used code" value="KAPWA10" sub="142 first orders" tone="good" />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={discountQuery} onChange={setDiscountQuery} placeholder="Search codes and titles" />
            <Segmented
              id="st-dfilter"
              value={discountFilter}
              onChange={setDiscountFilter}
              options={[
                { id: "all", label: "All" },
                { id: "Active", label: "Active" },
                { id: "Scheduled", label: "Scheduled" },
                { id: "Expired", label: "Expired" },
              ]}
            />
          </div>
          <Table
            rows={visibleDiscounts}
            rowKey={(d) => d.id}
            onRowClick={(d) => app.open("discount", d.id, d.code)}
            empty="No discounts match."
            columns={[
              {
                key: "code",
                label: "Discount",
                render: (d) => (
                  <span className="block min-w-0">
                    <span className={cn("block text-ink", d.method === "Code" && "font-mono font-medium")}>{d.code}</span>
                    <span className="block text-[0.7rem] text-mist">{summary(d)}</span>
                  </span>
                ),
              },
              { key: "method", label: "Method", render: (d) => d.method, hideOnMobile: true },
              { key: "status", label: "Status", render: (d) => <Status tone={d.status === "Active" ? "good" : d.status === "Scheduled" ? "warn" : "muted"}>{d.status}</Status> },
              { key: "used", label: "Used", align: "right", render: (d) => <span className="tabular-nums">{d.limit ? `${d.used} / ${d.limit}` : d.used}</span> },
              { key: "sales", label: "Sales", align: "right", render: (d) => <span className="font-mono">{peso(d.sales)}</span>, hideOnMobile: true },
            ]}
          />
        </>
      )}

      {/* ---------------- Discount detail ---------------- */}
      {app.screen === "discount" && discount && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn("text-[1.2rem] leading-tight font-semibold text-ink", discount.method === "Code" && "font-mono")}>{discount.code}</h4>
                <Status tone={discount.status === "Active" ? "good" : discount.status === "Scheduled" ? "warn" : "muted"}>{discount.status}</Status>
              </div>
              <p className="text-[0.78rem] text-mist mt-0.5">{summary(discount)}</p>
            </div>
            <div className="flex gap-2">
              {discount.method === "Code" && (
                <SmallButton onClick={() => app.notify(`Link copied: kapwacoffee.ph/discount/${discount.code}`)}>
                  <Copy size={12} /> Copy link
                </SmallButton>
              )}
              <SmallButton onClick={() => toggleDiscount(discount)}>{discount.status === "Active" ? "Deactivate" : "Activate"}</SmallButton>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Summary">
                <KeyValues
                  items={[
                    ["Method", discount.method === "Code" ? "Discount code" : "Automatic, no code needed"],
                    ["Type", discount.type],
                    ["Applies to", discount.type === "Buy X get Y" ? `Buy ${discount.value} ${discount.appliesTo.toLowerCase()}, get ${discount.getItem}` : discount.appliesTo],
                    ["Minimum purchase", discount.minimum ? peso(discount.minimum) : "None"],
                    ["Eligibility", discount.eligibility],
                    ["Usage limit", discount.limit ? `${discount.limit} uses in total` : "No limit"],
                    ["Active dates", discount.dates],
                  ]}
                />
              </Panel>
              <Panel title="Recent orders with this discount">
                {orders.filter((o) => o.code === discount.code).length ? (
                  <MiniTable
                    cols={[{ label: "Order" }, { label: "Customer" }, { label: "Discount", right: true }, { label: "Total", right: true }]}
                    rows={orders
                      .filter((o) => o.code === discount.code)
                      .map((o) => ({
                        key: o.id,
                        onClick: () => app.open("order", o.id, o.id),
                        cells: [<span key="i" className="font-medium text-ink">{o.id}</span>, customer(o.customerId)?.name, <span key="d" className="font-mono">{`−${peso(o.discount)}`}</span>, <span key="t" className="font-mono text-ink">{peso(totalOf(o))}</span>],
                      }))}
                  />
                ) : (
                  <p className="text-[0.78rem] text-graphite">No orders this week used it.</p>
                )}
              </Panel>
            </div>
            <Panel title="Performance">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[1.3rem] font-semibold text-ink tabular-nums">{discount.used}</div>
                  <div className="text-[0.7rem] text-mist">Times used</div>
                </div>
                <div>
                  <div className="text-[1.3rem] font-semibold text-ink tabular-nums">{peso(discount.sales)}</div>
                  <div className="text-[0.7rem] text-mist">Sales</div>
                </div>
              </div>
              {discount.limit && (
                <div className="mt-4">
                  <div className="flex justify-between text-[0.72rem] text-graphite mb-1.5">
                    <span>{`${discount.used} of ${discount.limit} uses`}</span>
                    <span>{`${discount.limit - discount.used} left`}</span>
                  </div>
                  <Meter value={discount.used} max={discount.limit} />
                </div>
              )}
              <p className="mt-4 text-[0.72rem] text-mist">{discount.used ? `Average order with this discount: ${peso(discount.sales / discount.used)}` : "No uses yet."}</p>
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Analytics ---------------- */}
      {app.screen === "analytics" && (
        <>
          <ScreenHeader
            title="Analytics"
            subtitle="Compared with the previous period"
            action={
              <Segmented
                id="st-range"
                value={range}
                onChange={setRange}
                options={[
                  { id: "7d", label: "7 days" },
                  { id: "30d", label: "30 days" },
                  { id: "90d", label: "90 days" },
                ]}
              />
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Total sales" value={peso(rangeSales)} sub={range === "90d" ? "+22% vs prior 90 days" : "+14% vs prior period"} tone="good" />
            <Stat label="Orders" value={rangeOrders.toLocaleString("en-US")} sub="+9%" tone="good" />
            <Stat label="Conversion rate" value={pct(rangeOrders, R.sessions)} sub={`${R.sessions.toLocaleString("en-US")} sessions`} />
            <Stat label="Average order value" value={peso(rangeSales / rangeOrders)} sub="+4%" tone="good" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3 mb-3">
            <Panel title="Sales over time">
              <Bars data={bars[range]} format={(n) => `${Math.round(n / 1000)}k`} height="h-36" />
            </Panel>
            <Panel title="Conversion funnel">
              <ul className="flex flex-col gap-3">
                {[
                  ["Sessions", R.sessions],
                  ["Added to cart", R.cart],
                  ["Reached checkout", R.checkout],
                  ["Purchased", rangeOrders],
                ].map(([label, n]) => (
                  <li key={label}>
                    <div className="flex justify-between text-[0.76rem] mb-1">
                      <span className="text-ink-soft">{label}</span>
                      <span className="font-mono text-ink">{`${Number(n).toLocaleString("en-US")} · ${pct(Number(n), R.sessions)}`}</span>
                    </div>
                    <Meter value={Number(n)} max={R.sessions} />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-3">
            <Panel title="Sales by channel">
              <ul className="flex flex-col gap-3">
                {CHANNEL_SPLIT.map(([label, share]) => (
                  <li key={label}>
                    <div className="flex justify-between text-[0.76rem] mb-1">
                      <span className="text-ink-soft">{label}</span>
                      <span className="font-mono text-ink">{`${peso(rangeSales * share)} · ${Math.round(share * 100)}%`}</span>
                    </div>
                    <Meter value={share} max={CHANNEL_SPLIT[0][1]} />
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Sales by product">
              <MiniTable
                cols={[{ label: "Product" }, { label: "Units", right: true }, { label: "Sales", right: true }]}
                rows={topProducts.slice(0, 6).map((p) => {
                  const units = Math.round(p.sold30 * R.factor);
                  return {
                    key: p.id,
                    onClick: () => app.open("product", p.id, p.title),
                    cells: [<span key="t" className="text-ink">{p.title}</span>, <span key="u" className="tabular-nums">{units}</span>, <span key="s" className="font-mono text-ink">{peso(units * minPrice(p))}</span>],
                  };
                })}
              />
            </Panel>
          </div>
        </>
      )}

      {/* ---------------- Marketing ---------------- */}
      {app.screen === "marketing" && (
        <>
          <ScreenHeader
            title="Marketing"
            subtitle={mktTab === "campaigns" ? `${AUDIENCES["All subscribers"].toLocaleString("en-US")} email subscribers` : "Kapwa Monthly coffee subscription"}
            action={
              mktTab === "campaigns" ? (
                <PrimaryButton onClick={openCampaign}>
                  <Plus size={14} /> Create campaign
                </PrimaryButton>
              ) : undefined
            }
          />
          <div className="mb-3">
            <Segmented id="st-mkt" value={mktTab} onChange={setMktTab} options={[{ id: "campaigns", label: "Campaigns" }, { id: "subscriptions", label: "Subscriptions" }]} />
          </div>

          {mktTab === "campaigns" && (
            <>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <Stat label="Average open rate" value="42.6%" sub="Retail average is 33%" tone="good" />
                <Stat label="Average click rate" value="6.4%" />
                <Stat label="Sales from email, 30 days" value={peso(campaigns.filter((c) => c.when.startsWith("Oct")).reduce((s, c) => s + (c.sales ?? 0), 0))} tone="good" sub="Last-click attribution" />
              </div>
              <Table
                rows={campaigns}
                rowKey={(c) => c.id}
                onRowClick={(c) => app.open("campaign", c.id, c.name)}
                columns={[
                  {
                    key: "name",
                    label: "Campaign",
                    render: (c) => (
                      <span className="block min-w-0">
                        <span className="block text-ink">{c.name}</span>
                        <span className="block text-[0.7rem] text-mist truncate">{c.subject}</span>
                      </span>
                    ),
                  },
                  { key: "status", label: "Status", render: (c) => <Status tone={c.status === "Sent" ? "good" : c.status === "Scheduled" ? "warn" : "muted"}>{c.status}</Status> },
                  { key: "aud", label: "Audience", render: (c) => c.audience, hideOnMobile: true },
                  { key: "when", label: "Date", render: (c) => c.when, hideOnMobile: true },
                  { key: "open", label: "Open rate", align: "right", render: (c) => <span className="tabular-nums">{c.opens !== undefined ? pct(c.opens, c.recipients) : "—"}</span> },
                  { key: "sales", label: "Sales", align: "right", render: (c) => <span className="font-mono">{c.sales !== undefined ? peso(c.sales) : "—"}</span> },
                ]}
              />
            </>
          )}

          {mktTab === "subscriptions" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                <Stat label="Active subscribers" value={String(BASE_ACTIVE + activeSubs.length)} sub="+12 this month" tone="good" />
                <Stat label="Monthly recurring revenue" value={peso(BASE_MRR + activeSubs.reduce((s, x) => s + monthly(x), 0))} />
                <Stat label="Renewals, next 7 days" value={String(subs.filter((s) => s.status !== "Paused" && daysUntil(s.next) <= 7).length + 41)} sub="Roast day is Monday" />
                <Stat label="Failed payments" value={String(failedSubs.length)} sub={failedSubs.length ? "Retry or reach out" : "All clear"} tone={failedSubs.length ? "bad" : "good"} />
              </div>
              <Panel title="Plans" className="mb-3">
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PLANS.map((p) => (
                    <li key={p.name} className="rounded-lg border border-rule bg-paper px-3 py-2.5">
                      <div className="text-[0.8rem] font-medium text-ink">{p.name}</div>
                      <div className="text-[0.72rem] text-mist">{`${peso(p.price)} per delivery · ${p.members} members`}</div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 text-[0.72rem] text-graphite">November roaster&apos;s choice: Mt. Apo Natural. Renewals charge on the date shown and ship the next roast day.</p>
              </Panel>
              <Table
                rows={[...subs].sort((a, b) => daysUntil(a.next) - daysUntil(b.next))}
                rowKey={(s) => s.id}
                onRowClick={(s) => app.open("customer", s.customerId, customer(s.customerId)?.name)}
                columns={[
                  {
                    key: "who",
                    label: "Subscriber",
                    render: (s) => (
                      <span className="flex items-center gap-2">
                        <Avatar name={customer(s.customerId)?.name ?? ""} size={24} />
                        <span className="text-ink">{customer(s.customerId)?.name}</span>
                      </span>
                    ),
                  },
                  { key: "plan", label: "Plan", render: (s) => s.plan, hideOnMobile: true },
                  { key: "coffee", label: "Coffee", render: (s) => `${s.coffee} · ${s.grind}`, hideOnMobile: true },
                  { key: "next", label: "Next renewal", render: (s) => s.next },
                  { key: "status", label: "Status", render: (s) => <Status tone={subTone(s)}>{s.status}</Status> },
                  { key: "act", label: "", align: "right", render: (s) => <RowActions>{subActions(s)}</RowActions> },
                ]}
              />
            </>
          )}
        </>
      )}

      {/* ---------------- Campaign detail ---------------- */}
      {app.screen === "campaign" && campaign && (
        <>
          <ScreenHeader
            title={campaign.name}
            subtitle={`${campaign.status === "Sent" ? `Sent ${campaign.when}` : campaign.status === "Scheduled" ? `Scheduled for ${campaign.when}` : "Draft"} · ${campaign.audience}`}
            action={
              <>
                <SmallButton onClick={() => duplicateCampaign(campaign)}>
                  <Copy size={12} /> Duplicate
                </SmallButton>
                {campaign.status !== "Sent" && (
                  <PrimaryButton onClick={() => sendCampaign(campaign)}>
                    <Send size={14} /> Send now
                  </PrimaryButton>
                )}
              </>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Email preview">
              <div className="rounded-lg border border-rule overflow-hidden">
                <div className="px-3 py-2 border-b border-rule bg-paper">
                  <div className="text-[0.68rem] text-mist">From Kapwa Coffee Co.</div>
                  <div className="text-[0.8rem] font-medium text-ink">{campaign.subject}</div>
                </div>
                <div className="h-28 bg-gold-wash text-gold text-[0.7rem] font-medium flex items-end p-2.5">{campaign.hero}</div>
                <div className="p-3">
                  <p className="text-[0.78rem] text-ink-soft leading-relaxed">{campaign.body}</p>
                  <span className="mt-3 inline-block px-3 py-1.5 rounded-md bg-gold text-sheet text-[0.72rem] font-semibold">Shop the roast</span>
                </div>
              </div>
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Results">
                {campaign.opens !== undefined ? (
                  <ul className="flex flex-col gap-3">
                    {[
                      ["Delivered", campaign.recipients, campaign.recipients],
                      ["Opened", campaign.opens, campaign.recipients],
                      ["Clicked", campaign.clicks ?? 0, campaign.recipients],
                    ].map(([label, n, of]) => (
                      <li key={String(label)}>
                        <div className="flex justify-between text-[0.76rem] mb-1">
                          <span className="text-ink-soft">{label}</span>
                          <span className="font-mono text-ink">{`${Number(n).toLocaleString("en-US")} · ${pct(Number(n), Number(of))}`}</span>
                        </div>
                        <Meter value={Number(n)} max={Number(of)} />
                      </li>
                    ))}
                    <li className="grid grid-cols-2 gap-3 pt-2 border-t border-rule">
                      <div>
                        <div className="text-[1.15rem] font-semibold text-ink tabular-nums">{campaign.orders}</div>
                        <div className="text-[0.7rem] text-mist">Orders</div>
                      </div>
                      <div>
                        <div className="text-[1.15rem] font-semibold text-ink tabular-nums">{peso(campaign.sales ?? 0)}</div>
                        <div className="text-[0.7rem] text-mist">Sales</div>
                      </div>
                    </li>
                  </ul>
                ) : (
                  <p className="text-[0.78rem] text-graphite">{campaign.status === "Sent" ? "Sent just now. Opens and clicks appear within the hour." : `Results appear here once it goes to ${count(AUDIENCES[campaign.audience], "person", "people")}.`}</p>
                )}
              </Panel>
              <Panel title="Audience">
                <KeyValues items={[["Segment", campaign.audience], ["Recipients", AUDIENCES[campaign.audience].toLocaleString("en-US")], ["Excludes", "Unsubscribed and bounced"]]} />
              </Panel>
            </div>
          </div>
        </>
      )}

      {/* ---------------- Settings ---------------- */}
      {app.screen === "settings" && (
        <>
          <ScreenHeader title="Settings" subtitle="Kapwa Coffee Co. · 25 Gen. Romulo Ave, Cubao, Quezon City" />
          <div className="mb-3">
            <Segmented
              id="st-settings"
              value={settingsTab}
              onChange={setSettingsTab}
              options={[
                { id: "payments", label: "Payments" },
                { id: "shipping", label: "Shipping and delivery" },
                { id: "taxes", label: "Taxes" },
              ]}
            />
          </div>

          {settingsTab === "payments" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
              <Panel title="Payment methods">
                <ul className="flex flex-col divide-y divide-rule-soft -my-2">
                  {payments.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex-1 min-w-0">
                        <span className="block text-[0.8rem] font-medium text-ink">{m.name}</span>
                        <span className="block text-[0.7rem] text-mist">{m.detail}</span>
                      </span>
                      <span className="hidden sm:inline text-[0.72rem] text-graphite">{m.fee}</span>
                      <Toggle on={m.on} onChange={() => togglePayment(m)} label={m.name} />
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="Payouts">
                <KeyValues items={[["Account", "Kapwa Coffee Co. •• 2218"], ["Schedule", "Daily, next banking day"], ["Next payout", `${peso(salesToday * 0.97 + 9420)} · Oct 30`], ["Currency", "Philippine peso"]]} />
                <div className="mt-3">
                  <SmallButton onClick={() => app.notify("Payout report for October downloaded")}>
                    <Download size={12} /> Payout report
                  </SmallButton>
                </div>
              </Panel>
            </div>
          )}

          {settingsTab === "shipping" && (
            <div className="flex flex-col gap-3">
              {zones.map((z) => (
                <Panel
                  key={z.zone}
                  title={z.zone}
                  action={
                    <SmallButton onClick={() => openRate(z.zone)}>
                      <Plus size={12} /> Add rate
                    </SmallButton>
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.74rem] text-mist">{z.areas}</span>
                    <span className="flex items-center gap-2 text-[0.72rem] text-graphite">
                      Cash on delivery
                      <Toggle
                        on={z.cod}
                        label={`Cash on delivery in ${z.zone}`}
                        onChange={(on) => {
                          setZones((list) => list.map((x) => (x.zone === z.zone ? { ...x, cod: on } : x)));
                          app.notify(on ? `Cash on delivery on for ${z.zone}` : `Cash on delivery off for ${z.zone}`);
                        }}
                      />
                    </span>
                  </div>
                  <div className="-mx-3.5 -mb-3.5 mt-3 p-3.5 border-t border-rule">
                    <MiniTable
                      cols={[{ label: "Rate" }, { label: "Delivery", hide: true }, { label: "Free over", right: true }, { label: "Price", right: true }, { label: "", right: true }]}
                      rows={z.rates.map((r) => ({
                        key: r.id,
                        cells: [
                          <span key="n" className="text-ink">{r.name}</span>,
                          r.eta,
                          <span key="f" className="font-mono">{r.freeOver ? peso(r.freeOver) : "—"}</span>,
                          <span key="p" className="font-mono text-ink">{r.price ? peso(r.price) : "Free"}</span>,
                          <SmallButton key="e" onClick={() => openRate(z.zone, r)}>Edit</SmallButton>,
                        ],
                      }))}
                    />
                  </div>
                </Panel>
              ))}
            </div>
          )}

          {settingsTab === "taxes" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Panel title="Value-added tax">
                <KeyValues items={[["Registration", "VAT-registered"], ["TIN", "009-245-871-000"], ["Rate", "12%"], ["Filing", "Quarterly, 2550Q"]]} />
                <div className="mt-2 border-t border-rule divide-y divide-rule-soft">
                  <ToggleRow
                    title="Prices include VAT"
                    sub="Customers see one final price"
                    on={vat.included}
                    onChange={(on) => {
                      setVat((x) => ({ ...x, included: on }));
                      app.notify(on ? "Prices now include VAT" : "VAT now added at checkout");
                    }}
                  />
                  <ToggleRow
                    title="Charge VAT on shipping"
                    sub="Applies to every shipping rate"
                    on={vat.shipping}
                    onChange={(on) => {
                      setVat((x) => ({ ...x, shipping: on }));
                      app.notify(on ? "VAT charged on shipping" : "Shipping is now VAT-free");
                    }}
                  />
                </div>
              </Panel>
              <Panel title="VAT, October to date">
                <div className="flex flex-col gap-1.5">
                  <SumRow label="Gross sales" value={peso(vatOctober)} />
                  <SumRow label="Output VAT (12/112)" value={peso((vatOctober * 12) / 112)} />
                  <SumRow label="Net of VAT" value={peso((vatOctober * 100) / 112)} strong />
                </div>
                <div className="mt-3">
                  <SmallButton onClick={() => app.notify("October VAT summary exported")}>
                    <Download size={12} /> Export VAT summary
                  </SmallButton>
                </div>
              </Panel>
            </div>
          )}
        </>
      )}

      {/* ================= Slide-overs ================= */}

      <ProtoModal open={modal === "fulfill"} title={`Fulfill ${order?.id ?? "order"}`} onClose={close} footer={<PrimaryButton onClick={fulfillOrder} disabled={!fulfillForm.tracking.trim()}>Mark as fulfilled</PrimaryButton>}>
        {order && (
          <>
            <div className="rounded-lg border border-rule divide-y divide-rule-soft">
              {order.lines.map((l) => {
                const hit = find(l.variantId);
                return (
                  <div key={l.variantId} className="flex items-center gap-2.5 px-3 py-2">
                    <Thumb tone={hit?.p.tone ?? 0} label={hit?.p.title ?? "?"} size={26} />
                    <span className="flex-1 min-w-0 text-[0.76rem] text-ink truncate">{`${hit?.p.title} · ${hit?.v.name}`}</span>
                    <span className="font-mono text-[0.74rem] text-graphite">{`× ${l.qty}`}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[0.74rem] text-graphite">{`Ship from Cubao roastery to ${order.zone}`}</div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.76rem] font-medium text-ink-soft">Courier</span>
              {COURIERS.map((c) => (
                <Pick key={c.name} on={fulfillForm.courier === c.name} title={c.name} sub={c.eta} disabled={c.metroOnly && order.zone !== "Metro Manila"} onClick={() => pickCourier(c.name, order.id)} />
              ))}
            </div>
            <Field label="Tracking number">
              <input value={fulfillForm.tracking} onChange={(e) => setFulfillForm((f) => ({ ...f, tracking: e.target.value }))} className={inputClass} />
            </Field>
            <ToggleRow title="Send shipping confirmation" sub={oc?.email} on={fulfillForm.notify} onChange={(notify) => setFulfillForm((f) => ({ ...f, notify }))} />
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "refund"} title={`Refund ${order?.id ?? "order"}`} onClose={close} footer={<PrimaryButton onClick={refundOrder} disabled={refundAmount <= 0}>{`Refund ${peso(refundAmount)}`}</PrimaryButton>}>
        {order && (
          <>
            <div className="text-[0.76rem] font-medium text-ink-soft">Items to refund</div>
            <div className="rounded-lg border border-rule px-3 divide-y divide-rule-soft">
              {order.lines.map((l) => {
                const hit = find(l.variantId);
                const on = refundForm.picked.includes(l.variantId);
                return (
                  <CheckRow key={l.variantId} on={on} onClick={() => setRefundForm((f) => ({ ...f, picked: on ? f.picked.filter((x) => x !== l.variantId) : [...f.picked, l.variantId] }))}>
                    <span className="flex-1 min-w-0 truncate">{`${hit?.p.title} · ${hit?.v.name} × ${l.qty}`}</span>
                    <span className="font-mono text-[0.74rem] text-graphite">{peso(l.price * l.qty)}</span>
                  </CheckRow>
                );
              })}
            </div>
            <div className="divide-y divide-rule-soft">
              <ToggleRow title="Refund shipping" sub={order.shipping ? peso(order.shipping) : "Shipping was free"} on={refundForm.shipping} onChange={(on) => setRefundForm((f) => ({ ...f, shipping: on }))} />
              {order.fulfilled && <ToggleRow title="Restock items" sub="Return them to Cubao roastery" on={refundForm.restock} onChange={(on) => setRefundForm((f) => ({ ...f, restock: on }))} />}
            </div>
            <Field label="Reason (shown on the timeline)">
              <input value={refundForm.reason} onChange={(e) => setRefundForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Wrong grind sent" className={inputClass} />
            </Field>
            <div className="rounded-lg border border-rule bg-paper p-3 text-[0.74rem] text-graphite">{`Goes back to ${refundTo(order.method)}. ${peso(totalOf(order) - order.refunded)} can still be refunded.`}</div>
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "draft"} title="Create order" onClose={close} footer={<PrimaryButton onClick={saveDraft} disabled={!Number(draftForm.qty)}>Save draft</PrimaryButton>}>
        <Field label="Customer">
          <select value={draftForm.customerId} onChange={(e) => setDraftForm({ ...draftForm, customerId: e.target.value })} className={inputClass}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product">
          <select value={draftForm.variantId} onChange={(e) => setDraftForm({ ...draftForm, variantId: e.target.value })} className={inputClass}>
            {products.map((p) => (
              <optgroup key={p.id} label={p.title}>
                {p.variants.map((x) => (
                  <option key={x.id} value={x.id}>{`${x.name} · ${peso(x.price)}`}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input inputMode="numeric" value={draftForm.qty} onChange={(e) => setDraftForm({ ...draftForm, qty: e.target.value.replace(/\D/g, "") })} className={inputClass} />
          </Field>
          <Field label="Discount (%)">
            <input inputMode="numeric" value={draftForm.pct} onChange={(e) => setDraftForm({ ...draftForm, pct: e.target.value.replace(/\D/g, "").slice(0, 2) })} className={inputClass} />
          </Field>
        </div>
        <div className="rounded-lg border border-rule bg-paper p-3 flex flex-col gap-1.5">
          <SumRow label="Subtotal" value={peso(dfSubtotal)} />
          {dfDiscount > 0 && <SumRow label="Discount" value={`−${peso(dfDiscount)}`} />}
          <SumRow label="Shipping" sub={customer(draftForm.customerId)?.zone} value={dfShipping ? peso(dfShipping) : "Free"} />
          <SumRow label="Total" value={peso(dfSubtotal - dfDiscount + dfShipping)} strong />
        </div>
        <p className="text-[0.72rem] text-mist">Send an invoice from Drafts, or mark it paid when the transfer clears.</p>
      </ProtoModal>

      <ProtoModal
        open={modal === "viewDraft" && !!viewDraft}
        title={`Draft ${viewDraft?.id ?? ""}`}
        onClose={close}
        footer={
          viewDraft && viewDraft.status !== "Completed" ? (
            <>
              {viewDraft.status === "Open" && (
                <SmallButton
                  onClick={() => {
                    sendInvoice(viewDraft);
                    close();
                  }}
                >
                  Send invoice
                </SmallButton>
              )}
              <PrimaryButton
                onClick={() => {
                  markDraftPaid(viewDraft);
                  close();
                }}
              >
                Mark as paid
              </PrimaryButton>
            </>
          ) : undefined
        }
      >
        {viewDraft && (
          <>
            <KeyValues items={[["Customer", customer(viewDraft.customerId)?.name], ["Created", viewDraft.created], ["Status", <Status key="s" tone={viewDraft.status === "Completed" ? "good" : viewDraft.status === "Invoice sent" ? "warn" : "muted"}>{viewDraft.status}</Status>]]} />
            <ul className="rounded-lg border border-rule px-3 divide-y divide-rule-soft">{viewDraft.lines.map(lineRow)}</ul>
            <div className="flex flex-col gap-1.5">
              <SumRow label="Subtotal" value={peso(sum(viewDraft.lines))} />
              {viewDraft.pct > 0 && <SumRow label="Discount" sub={`${viewDraft.pct}% wholesale`} value={`−${peso(Math.round((sum(viewDraft.lines) * viewDraft.pct) / 100))}`} />}
              <SumRow label="Total with shipping" value={peso(draftTotal(viewDraft))} strong />
            </div>
            {viewDraft.orderId && (
              <SmallButton
                onClick={() => {
                  close();
                  app.open("order", viewDraft.orderId!, viewDraft.orderId);
                }}
              >
                {`Open order ${viewDraft.orderId}`}
              </SmallButton>
            )}
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "product"} title="Add product" onClose={close} footer={<PrimaryButton onClick={createProduct} disabled={!productForm.title.trim() || !Number(productForm.price)}>Save product</PrimaryButton>}>
        <Field label="Title">
          <input value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} placeholder="Ifugao Heirloom Arabica" className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Origin, process, tasting notes" className={textareaClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={productForm.type} onChange={(e) => setProductForm({ ...productForm, type: e.target.value as ProductType })} className={inputClass}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value as Product["status"] })} className={inputClass}>
              <option>Draft</option>
              <option>Active</option>
            </select>
          </Field>
          <Field label="Price (₱)">
            <input inputMode="numeric" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value.replace(/\D/g, "") })} placeholder="520" className={inputClass} />
          </Field>
          <Field label="Compare-at price (₱)">
            <input inputMode="numeric" value={productForm.compareAt} onChange={(e) => setProductForm({ ...productForm, compareAt: e.target.value.replace(/\D/g, "") })} placeholder="Optional" className={inputClass} />
          </Field>
          <Field label="SKU">
            <input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })} placeholder="IHA-250-WB" className={inputClass} />
          </Field>
          <Field label="Stock at Cubao roastery">
            <input inputMode="numeric" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value.replace(/\D/g, "") })} className={inputClass} />
          </Field>
        </div>
        <p className="text-[0.72rem] text-mist">Add sizes and grinds as variants after you save.</p>
      </ProtoModal>

      <ProtoModal open={modal === "variant"} title={variantForm.variantId ? "Edit variant" : "Add variant"} onClose={close} footer={<PrimaryButton onClick={saveVariant} disabled={!variantForm.name.trim() || !Number(variantForm.price)}>Save variant</PrimaryButton>}>
        <Field label="Variant name">
          <input value={variantForm.name} onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })} placeholder="1kg / Whole bean" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₱)">
            <input inputMode="numeric" value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value.replace(/\D/g, "") })} className={inputClass} />
          </Field>
          <Field label="Compare-at price (₱)">
            <input inputMode="numeric" value={variantForm.compareAt} onChange={(e) => setVariantForm({ ...variantForm, compareAt: e.target.value.replace(/\D/g, "") })} placeholder="Optional" className={inputClass} />
          </Field>
        </div>
        {Number(variantForm.compareAt) > 0 && Number(variantForm.compareAt) <= Number(variantForm.price) && <p className="text-[0.72rem] text-warn">Compare-at price should be higher than the price to show as a sale.</p>}
        {Number(variantForm.compareAt) > Number(variantForm.price) && Number(variantForm.price) > 0 && <p className="text-[0.72rem] text-good">{`Shows as ${Math.round((1 - Number(variantForm.price) / Number(variantForm.compareAt)) * 100)}% off on the store.`}</p>}
        <Field label="SKU">
          <input value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })} className={inputClass} />
        </Field>
      </ProtoModal>

      <ProtoModal open={modal === "seo"} title="Search engine listing" onClose={close} footer={<PrimaryButton onClick={saveSeo}>Save listing</PrimaryButton>}>
        <Field label="Page title">
          <input value={seoForm.title} onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })} className={inputClass} />
        </Field>
        <span className={cn("-mt-2 text-[0.7rem]", seoForm.title.length > 70 ? "text-warn" : "text-mist")}>{`${seoForm.title.length} of 70 characters used`}</span>
        <Field label="Meta description">
          <textarea value={seoForm.description} onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })} className={textareaClass} />
        </Field>
        <span className={cn("-mt-2 text-[0.7rem]", seoForm.description.length > 160 ? "text-warn" : "text-mist")}>{`${seoForm.description.length} of 160 characters used`}</span>
        <div className="rounded-lg border border-rule bg-paper p-3">
          <div className="text-[0.68rem] text-good truncate">{`kapwacoffee.ph › products › ${product?.handle ?? ""}`}</div>
          <div className="text-[0.82rem] text-trace font-medium">{seoForm.title || "Page title"}</div>
          <p className="text-[0.72rem] text-graphite">{seoForm.description || "Meta description"}</p>
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "adjust"} title="Adjust inventory" onClose={close} footer={<PrimaryButton onClick={saveAdjust} disabled={!adjDelta}>Save adjustment</PrimaryButton>}>
        <Field label="Variant">
          <select value={adjustForm.variantId} onChange={(e) => setAdjustForm({ ...adjustForm, variantId: e.target.value })} className={inputClass}>
            {allVariants.map(({ p, v: x }) => (
              <option key={x.id} value={x.id}>{`${p.title} · ${x.name}`}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={adjTransfer ? "Move to" : "Location"}>
            <select value={adjustForm.loc} onChange={(e) => setAdjustForm({ ...adjustForm, loc: e.target.value as Loc })} className={inputClass}>
              {LOCS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label={adjustForm.reason === "Count correction" ? "Change (+ or −)" : "Quantity"}>
            <input value={adjustForm.qty} onChange={(e) => setAdjustForm({ ...adjustForm, qty: e.target.value.replace(/[^\d-]/g, "") })} className={inputClass} />
          </Field>
        </div>
        <Field label="Reason">
          <select value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className={inputClass}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        {adjHit && (
          <div className="rounded-lg border border-rule bg-paper p-3 flex flex-col gap-1.5">
            <SumRow label={adjustForm.loc} value={`${adjHit.v.stock[adjustForm.loc]} → ${Math.max(0, adjHit.v.stock[adjustForm.loc] + adjDelta)}`} />
            {adjTransfer && <SumRow label={adjFrom} value={`${adjHit.v.stock[adjFrom]} → ${adjHit.v.stock[adjFrom] - adjDelta}`} />}
            <SumRow label="Committed to orders" value={String(committed(adjHit.v.id))} muted />
          </div>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "collection"} title="Create collection" onClose={close} footer={<PrimaryButton onClick={saveCollection} disabled={!collectionForm.title.trim()}>Save collection</PrimaryButton>}>
        <Field label="Title">
          <input value={collectionForm.title} onChange={(e) => setCollectionForm({ ...collectionForm, title: e.target.value })} placeholder="Light roasts" className={inputClass} />
        </Field>
        <div>
          <Segmented id="st-ckind" value={collectionForm.kind} onChange={(kind) => setCollectionForm({ ...collectionForm, kind })} options={[{ id: "Automatic", label: "Automatic" }, { id: "Manual", label: "Manual" }]} />
        </div>
        {collectionForm.kind === "Automatic" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Condition">
                <select
                  value={collectionForm.field}
                  onChange={(e) => {
                    const field = e.target.value as Rule["field"];
                    setCollectionForm({ ...collectionForm, field, value: field === "Tag" ? "single-origin" : field === "Type" ? "Whole bean" : "500" });
                  }}
                  className={inputClass}
                >
                  <option value="Tag">Product tag is</option>
                  <option value="Type">Product type is</option>
                  <option value="Price">Price is less than</option>
                </select>
              </Field>
              <Field label="Value">
                {collectionForm.field === "Price" ? (
                  <input inputMode="numeric" value={collectionForm.value} onChange={(e) => setCollectionForm({ ...collectionForm, value: e.target.value.replace(/\D/g, "") })} className={inputClass} />
                ) : (
                  <select value={collectionForm.value} onChange={(e) => setCollectionForm({ ...collectionForm, value: e.target.value })} className={inputClass}>
                    {(collectionForm.field === "Tag" ? allTags : TYPES).map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <div className="rounded-lg border border-rule bg-paper p-3 text-[0.76rem] text-graphite">
              {`${count(members(draftCollection).length, "product")} match now: ${members(draftCollection).map((p) => p.title).slice(0, 4).join(", ") || "none"}${members(draftCollection).length > 4 ? "…" : ""}`}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-rule px-3 divide-y divide-rule-soft">
            {products.map((p) => {
              const on = collectionForm.picked.includes(p.id);
              return (
                <CheckRow key={p.id} on={on} onClick={() => setCollectionForm({ ...collectionForm, picked: on ? collectionForm.picked.filter((x) => x !== p.id) : [...collectionForm.picked, p.id] })}>
                  <Thumb tone={p.tone} label={p.title} size={22} />
                  <span className="truncate">{p.title}</span>
                </CheckRow>
              );
            })}
          </div>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "customer"} title="Add customer" onClose={close} footer={<PrimaryButton onClick={saveCustomer} disabled={!customerForm.name.trim()}>Add customer</PrimaryButton>}>
        <Field label="Full name">
          <input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Maria Santos" className={inputClass} />
        </Field>
        <Field label="Email">
          <input type="email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="maria@gmail.com" className={inputClass} />
        </Field>
        <Field label="Mobile number">
          <input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="0917 000 0000" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input value={customerForm.city} onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })} placeholder="Quezon City" className={inputClass} />
          </Field>
          <Field label="Shipping zone">
            <select value={customerForm.zone} onChange={(e) => setCustomerForm({ ...customerForm, zone: e.target.value as Zone })} className={inputClass}>
              {ZONE_NAMES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </Field>
        </div>
        <ToggleRow title="Email marketing" sub="Customer agreed to receive emails" on={customerForm.marketing} onChange={(marketing) => setCustomerForm({ ...customerForm, marketing })} />
      </ProtoModal>

      <ProtoModal
        open={modal === "discount"}
        title="Create discount"
        onClose={close}
        footer={
          <PrimaryButton onClick={saveDiscount} disabled={(discountForm.method === "Code" && !discountForm.code.trim()) || (discountForm.type !== "Free shipping" && !Number(discountForm.value))}>
            Save discount
          </PrimaryButton>
        }
      >
        <div>
          <Segmented id="st-dmethod" value={discountForm.method} onChange={(method) => setDiscountForm({ ...discountForm, method })} options={[{ id: "Code", label: "Discount code" }, { id: "Automatic", label: "Automatic" }]} />
        </div>
        <Field label={discountForm.method === "Code" ? "Code" : "Title (shown at checkout)"}>
          <span className="flex gap-2">
            <input value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: discountForm.method === "Code" ? e.target.value.toUpperCase().replace(/\s/g, "") : e.target.value })} placeholder={discountForm.method === "Code" ? "UNDAS15" : "Free mug over ₱3,000"} className={cn(inputClass, discountForm.method === "Code" && "font-mono")} />
            {discountForm.method === "Code" && <SmallButton onClick={() => setDiscountForm({ ...discountForm, code: `KAPWA${(discounts.length * 7) % 40 + 11}` })}>Generate</SmallButton>}
          </span>
        </Field>
        <Field label="Type">
          <select value={discountForm.type} onChange={(e) => { const type = e.target.value as DiscountType; setDiscountForm({ ...discountForm, type, appliesTo: APPLIES[type][0], value: type === "Buy X get Y" ? "2" : type === "Fixed amount" ? "100" : "10" }); }} className={inputClass}>
            <option>Percentage</option>
            <option>Fixed amount</option>
            <option>Free shipping</option>
            <option>Buy X get Y</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {discountForm.type !== "Free shipping" && (
            <Field label={discountForm.type === "Percentage" ? "Percent off" : discountForm.type === "Fixed amount" ? "Amount off (₱)" : "Customer buys"}>
              <input inputMode="numeric" value={discountForm.value} onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value.replace(/\D/g, "").slice(0, 4) })} className={inputClass} />
            </Field>
          )}
          <Field label={discountForm.type === "Free shipping" ? "Zones" : "Applies to"}>
            <select value={discountForm.appliesTo} onChange={(e) => setDiscountForm({ ...discountForm, appliesTo: e.target.value })} className={inputClass}>
              {APPLIES[discountForm.type].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
        </div>
        {discountForm.type === "Buy X get Y" && (
          <Field label="Customer gets, free">
            <select value={discountForm.getItem} onChange={(e) => setDiscountForm({ ...discountForm, getItem: e.target.value })} className={inputClass}>
              {products.filter((p) => p.type !== "Gift box").map((p) => (
                <option key={p.id}>{p.title}</option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum purchase (₱)">
            <input inputMode="numeric" value={discountForm.minimum} onChange={(e) => setDiscountForm({ ...discountForm, minimum: e.target.value.replace(/\D/g, "") })} className={inputClass} />
          </Field>
          <Field label="Total usage limit">
            <input inputMode="numeric" value={discountForm.limit} onChange={(e) => setDiscountForm({ ...discountForm, limit: e.target.value.replace(/\D/g, "") })} placeholder="No limit" className={inputClass} />
          </Field>
        </div>
        <Field label="Starts">
          <select value={discountForm.starts} onChange={(e) => setDiscountForm({ ...discountForm, starts: e.target.value })} className={inputClass}>
            <option>Today</option>
            <option>Nov 1</option>
            <option>Dec 16</option>
          </select>
        </Field>
        <div className="rounded-lg border border-rule bg-paper p-3 text-[0.76rem] text-graphite">{`Summary: ${summary(discountPreview)} · ${discountForm.starts === "Today" ? "starts today" : `starts ${discountForm.starts}`}`}</div>
      </ProtoModal>

      <ProtoModal
        open={modal === "campaign"}
        title="Create campaign"
        onClose={close}
        footer={
          <PrimaryButton onClick={saveCampaign} disabled={!campaignForm.name.trim() || !campaignForm.subject.trim()}>
            {campaignForm.when === "now" ? `Send to ${count(AUDIENCES[campaignForm.audience], "person", "people")}` : "Schedule campaign"}
          </PrimaryButton>
        }
      >
        <Field label="Campaign name">
          <input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="All Saints' week roast" className={inputClass} />
        </Field>
        <Field label="Subject line">
          <input value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="A slow coffee for a long weekend" className={inputClass} />
        </Field>
        <Field label="Audience">
          <select value={campaignForm.audience} onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value as Audience })} className={inputClass}>
            {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
              <option key={a} value={a}>{`${a} · ${AUDIENCES[a].toLocaleString("en-US")}`}</option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.76rem] font-medium text-ink-soft">When</span>
          <Pick on={campaignForm.when === "now"} title="Send now" sub="Goes out within 5 minutes" onClick={() => setCampaignForm({ ...campaignForm, when: "now" })} />
          <Pick on={campaignForm.when === "later"} title="Schedule" sub="Sunday, Nov 1 at 8:00 AM" onClick={() => setCampaignForm({ ...campaignForm, when: "later" })} />
        </div>
      </ProtoModal>

      <ProtoModal open={modal === "rate"} title={rateForm.rateId ? `Edit rate · ${rateForm.zone}` : `Add rate · ${rateForm.zone}`} onClose={close} footer={<PrimaryButton onClick={saveRate} disabled={!rateForm.name.trim() || rateForm.price === ""}>Save rate</PrimaryButton>}>
        <Field label="Rate name">
          <input value={rateForm.name} onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })} placeholder="Next day" className={inputClass} />
        </Field>
        <Field label="Delivery time and courier">
          <input value={rateForm.eta} onChange={(e) => setRateForm({ ...rateForm, eta: e.target.value })} placeholder="1 day · J&T Express" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₱)">
            <input inputMode="numeric" value={rateForm.price} onChange={(e) => setRateForm({ ...rateForm, price: e.target.value.replace(/\D/g, "") })} className={inputClass} />
          </Field>
          <Field label="Free over (₱)">
            <input inputMode="numeric" value={rateForm.freeOver} onChange={(e) => setRateForm({ ...rateForm, freeOver: e.target.value.replace(/\D/g, "") })} placeholder="Optional" className={inputClass} />
          </Field>
        </div>
        <p className="text-[0.72rem] text-mist">The first rate in each zone is the default at checkout and on draft orders.</p>
      </ProtoModal>
    </ProtoApp>
  );
}
