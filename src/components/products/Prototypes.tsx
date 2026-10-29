"use client";

import React, { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Columns3,
  Contact as ContactIcon,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Mail,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Bars, Meter, ProtoFrame, ProtoTitle, SmallButton, Stat, Status } from "./ProtoKit";
import { cn } from "@/lib/utils";

const peso = (n: number) => `₱${n.toLocaleString()}`;

// ---- Church Operating System -------------------------------------------------

const MEMBERS = [
  { name: "Ana Reyes", household: "Reyes", ministry: "Worship", status: "Member" },
  { name: "Mark Santos", household: "Santos", ministry: "Youth", status: "Member" },
  { name: "Joy Dela Cruz", household: "Dela Cruz", ministry: "Kids", status: "New" },
  { name: "Paolo Garcia", household: "Garcia", ministry: "Media", status: "Member" },
  { name: "Liza Mendoza", household: "Mendoza", ministry: "Hospitality", status: "Visitor" },
  { name: "Ben Ramos", household: "Ramos", ministry: "Ushers", status: "Member" },
  { name: "Grace Villanueva", household: "Villanueva", ministry: "Prayer", status: "New" },
  { name: "Carlo Bautista", household: "Bautista", ministry: "Youth", status: "Visitor" },
];

export function ChurchOSPrototype() {
  const [tab, setTab] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<"month" | "year">("month");
  const [checkedIn, setCheckedIn] = useState(86);
  const [filled, setFilled] = useState(false);
  const people = MEMBERS.filter((m) => `${m.name} ${m.ministry}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <ProtoFrame
      name="Church Operating System"
      active={tab}
      onTab={setTab}
      tabs={[
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "people", label: "People", icon: Users },
        { id: "giving", label: "Giving", icon: HandCoins },
        { id: "events", label: "Events", icon: CalendarDays },
        { id: "volunteers", label: "Volunteers", icon: HeartHandshake },
      ]}
    >
      {tab === "dashboard" && (
        <>
          <ProtoTitle title="Good morning, Pastor Dan" />
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <Stat label="Sunday" value="412" sub="+6% this month" />
            <Stat label="Giving" value={peso(184200)} sub="This month" />
            <Stat label="New" value="9" sub="First-time guests" />
          </div>
          <div className="annot text-mist mb-2">Attendance, last six Sundays</div>
          <Bars data={[{ label: "Sep 14", value: 368 }, { label: "21", value: 381 }, { label: "28", value: 377 }, { label: "Oct 5", value: 395 }, { label: "12", value: 402 }, { label: "19", value: 412 }]} />
        </>
      )}

      {tab === "people" && (
        <>
          <ProtoTitle title="People" />
          <label className="flex items-center gap-2 px-3 h-9 mb-3 rounded-lg border border-rule bg-sheet focus-within:border-gold">
            <Search size={14} className="text-mist" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ministry"
              aria-label="Search people"
              className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none"
            />
          </label>
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {people.map((m) => (
              <li key={m.name} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-[0.82rem] font-medium text-ink truncate">{m.name}</span>
                  <span className="block text-[0.7rem] text-mist">{m.household} household · {m.ministry}</span>
                </span>
                <Status tone={m.status === "Member" ? "good" : m.status === "New" ? "warn" : "muted"}>{m.status}</Status>
              </li>
            ))}
            {people.length === 0 && <li className="px-3 py-4 text-[0.8rem] text-graphite">No one matches “{query}”.</li>}
          </ul>
        </>
      )}

      {tab === "giving" && (
        <>
          <ProtoTitle
            title="Giving"
            action={
              <div className="flex rounded-md border border-rule overflow-hidden text-[0.72rem]">
                {(["month", "year"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRange(r)} className={cn("px-2.5 py-1 cursor-pointer", range === r ? "bg-gold text-paper" : "text-graphite hover:text-ink")}>
                    {r === "month" ? "This month" : "This year"}
                  </button>
                ))}
              </div>
            }
          />
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <Stat label="Total" value={peso(range === "month" ? 184200 : 1912400)} />
            <Stat label="Recurring givers" value={range === "month" ? "128" : "141"} sub="Monthly or weekly" />
          </div>
          <div className="bg-sheet border border-rule rounded-lg p-3 flex flex-col gap-3">
            {[
              { fund: "General fund", value: range === "month" ? 121000 : 1254000 },
              { fund: "Missions", value: range === "month" ? 41200 : 438400 },
              { fund: "Building", value: range === "month" ? 22000 : 220000 },
            ].map((f) => (
              <div key={f.fund}>
                <div className="flex justify-between text-[0.78rem] mb-1">
                  <span className="text-ink">{f.fund}</span>
                  <span className="font-mono text-graphite">{peso(f.value)}</span>
                </div>
                <Meter value={f.value} max={range === "month" ? 184200 : 1912400} />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "events" && (
        <>
          <ProtoTitle title="Events" />
          <div className="bg-sheet border border-rule rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[0.85rem] font-medium text-ink">Youth Camp 2026</div>
                <div className="text-[0.7rem] text-mist">Nov 14–16 · Tagaytay</div>
              </div>
              <SmallButton onClick={() => setCheckedIn((n) => Math.min(120, n + 1))} disabled={checkedIn >= 120}>
                Check in next
              </SmallButton>
            </div>
            <div className="flex justify-between text-[0.72rem] text-graphite mt-3 mb-1">
              <span>Checked in</span>
              <span className="font-mono tabular-nums">{checkedIn} / 120</span>
            </div>
            <Meter value={checkedIn} max={120} />
          </div>
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {[
              { name: "Couples Night", date: "Nov 7", reg: 34, cap: 40 },
              { name: "Kids Christmas Program", date: "Dec 14", reg: 61, cap: 150 },
              { name: "Leaders Retreat", date: "Jan 10", reg: 18, cap: 25 },
            ].map((e) => (
              <li key={e.name} className="px-3 py-2.5">
                <div className="flex justify-between text-[0.8rem]">
                  <span className="text-ink">{e.name}</span>
                  <span className="text-mist">{e.date}</span>
                </div>
                <Meter value={e.reg} max={e.cap} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "volunteers" && (
        <>
          <ProtoTitle title="This Sunday's team" />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {[
              { role: "Worship", people: "Ana, Paolo, Jem" },
              { role: "Kids church", people: "Joy, Rina" },
              { role: "Ushers", people: "Ben, Marco, Lea" },
              { role: "Livestream", people: filled ? "Carlo" : null },
            ].map((r) => (
              <li key={r.role} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span>
                  <span className="block text-[0.82rem] font-medium text-ink">{r.role}</span>
                  <span className="block text-[0.72rem] text-mist">{r.people ?? "Needs 1 volunteer"}</span>
                </span>
                {r.people ? <Status tone="good">Covered</Status> : <SmallButton onClick={() => setFilled(true)}>Assign Carlo</SmallButton>}
              </li>
            ))}
          </ul>
        </>
      )}
    </ProtoFrame>
  );
}

// ---- Bible Study Group Management ----------------------------------------------

const GROUPS = [
  { name: "Makati Young Pros", leader: "Mark S.", members: 12, day: "Tue", health: "good" as const, plan: 5 },
  { name: "Marikina Moms", leader: "Joy D.", members: 9, day: "Wed", health: "good" as const, plan: 4 },
  { name: "QC Students", leader: "Paolo G.", members: 15, day: "Thu", health: "warn" as const, plan: 2 },
  { name: "Couples Circle", leader: "Ben & Lea R.", members: 8, day: "Fri", health: "good" as const, plan: 6 },
  { name: "Men's Breakfast", leader: "Dan C.", members: 11, day: "Sat", health: "bad" as const, plan: 1 },
];
const HEALTH_LABEL = { good: "Healthy", warn: "Slipping", bad: "Needs care" };

export function BibleStudyPrototype() {
  const [tab, setTab] = useState("groups");
  const [open, setOpen] = useState(GROUPS[0].name);
  const [present, setPresent] = useState<Record<string, boolean>>({ Mark: true, Ana: true, Jem: false, Rina: true, Carlo: false });
  const [count, setCount] = useState(10);
  const [followUp, setFollowUp] = useState(false);
  const [sent, setSent] = useState(false);
  const group = GROUPS.find((g) => g.name === open)!;

  return (
    <ProtoFrame
      name="Bible Study Groups"
      active={tab}
      onTab={setTab}
      tabs={[
        { id: "groups", label: "Groups", icon: Users },
        { id: "attendance", label: "Attendance", icon: CheckSquare },
        { id: "plans", label: "Reading plans", icon: BookOpen },
        { id: "checkin", label: "Leader check-in", icon: ClipboardCheck },
      ]}
    >
      {tab === "groups" && (
        <>
          <ProtoTitle title="Groups" />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule mb-3">
            {GROUPS.map((g) => (
              <li key={g.name}>
                <button type="button" onClick={() => setOpen(g.name)} className={cn("w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer", open === g.name && "bg-gold-wash")}>
                  <span className="min-w-0">
                    <span className="block text-[0.82rem] font-medium text-ink truncate">{g.name}</span>
                    <span className="block text-[0.7rem] text-mist">{g.leader} · {g.members} members · {g.day}</span>
                  </span>
                  <Status tone={g.health}>{HEALTH_LABEL[g.health]}</Status>
                </button>
              </li>
            ))}
          </ul>
          <div className="bg-sheet border border-rule rounded-lg p-3 text-[0.78rem] text-ink-soft">
            <span className="text-ink font-medium">{group.name}</span> meets every {group.day} and is on week {group.plan} of the
            current reading plan.
          </div>
        </>
      )}

      {tab === "attendance" && (
        <>
          <ProtoTitle title="Makati Young Pros" />
          <div className="bg-sheet border border-rule rounded-lg p-3">
            <div className="grid grid-cols-[5rem_repeat(6,minmax(0,1fr))] gap-y-2 items-center text-[0.72rem]">
              <span />
              {["W1", "W2", "W3", "W4", "W5", "Now"].map((w) => (
                <span key={w} className="text-center font-mono text-mist">{w}</span>
              ))}
              {Object.keys(present).map((name, row) => (
                <React.Fragment key={name}>
                  <span className="text-ink">{name}</span>
                  {[0, 1, 2, 3, 4].map((w) => (
                    <span key={w} className="flex justify-center">
                      <span className={cn("w-3 h-3 rounded-full", (row + w) % 4 === 3 ? "border border-rule" : "bg-gold/60")} aria-hidden />
                    </span>
                  ))}
                  <span className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setPresent((p) => ({ ...p, [name]: !p[name] }))}
                      aria-pressed={present[name]}
                      aria-label={`${name} present this week`}
                      className={cn("w-4 h-4 rounded-full border-2 cursor-pointer transition-colors", present[name] ? "bg-gold border-gold" : "border-mist hover:border-gold")}
                    />
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[0.72rem] text-graphite">Tap this week&apos;s circles to mark who came.</p>
        </>
      )}

      {tab === "plans" && (
        <>
          <ProtoTitle title="Gospel of John in six weeks" />
          <div className="bg-sheet border border-rule rounded-lg p-3 flex flex-col gap-3">
            {GROUPS.map((g) => (
              <div key={g.name}>
                <div className="flex justify-between text-[0.78rem] mb-1">
                  <span className="text-ink">{g.name}</span>
                  <span className="font-mono text-graphite">Week {g.plan} of 6</span>
                </div>
                <Meter value={g.plan} max={6} />
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "checkin" && (
        <>
          <ProtoTitle title="Weekly check-in" />
          {sent ? (
            <div className="bg-sheet border border-rule rounded-lg p-4 text-[0.85rem] text-ink">
              Check-in sent to Pastor Dan{followUp ? " with a follow-up request" : ""}.{" "}
              <button type="button" onClick={() => setSent(false)} className="text-gold-bright underline underline-offset-2 cursor-pointer">
                Edit
              </button>
            </div>
          ) : (
            <div className="bg-sheet border border-rule rounded-lg p-3 flex flex-col gap-3 text-[0.8rem]">
              <div className="flex items-center justify-between">
                <span className="text-ink">People who came</span>
                <span className="flex items-center gap-2">
                  <SmallButton onClick={() => setCount((n) => Math.max(0, n - 1))}>−</SmallButton>
                  <span className="font-mono w-6 text-center tabular-nums text-ink">{count}</span>
                  <SmallButton onClick={() => setCount((n) => n + 1)}>+</SmallButton>
                </span>
              </div>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-ink">Someone needs pastoral follow-up</span>
                <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} className="accent-[var(--color-gold)] w-4 h-4" />
              </label>
              <button type="button" onClick={() => setSent(true)} className="self-start px-3 py-1.5 rounded-md bg-gold text-paper text-[0.78rem] font-semibold cursor-pointer hover:bg-gold-bright">
                Send check-in
              </button>
            </div>
          )}
        </>
      )}
    </ProtoFrame>
  );
}

// ---- HubSpot implementation ------------------------------------------------------

const STAGES = ["New", "Engaged", "Pledged", "Given"] as const;
type Stage = (typeof STAGES)[number];

export function HubSpotPrototype() {
  const [tab, setTab] = useState("pipeline");
  const [deals, setDeals] = useState<{ name: string; amount: number; stage: Stage }[]>([
    { name: "Reyes Family Foundation", amount: 250000, stage: "Engaged" },
    { name: "Grace Community Church", amount: 80000, stage: "New" },
    { name: "Santos Hardware", amount: 45000, stage: "Pledged" },
    { name: "Mendoza Trust", amount: 120000, stage: "New" },
    { name: "Bautista & Co.", amount: 60000, stage: "Given" },
  ]);
  const [stageFilter, setStageFilter] = useState("All");

  const advance = (name: string) =>
    setDeals((list) => list.map((d) => (d.name === name && d.stage !== "Given" ? { ...d, stage: STAGES[STAGES.indexOf(d.stage) + 1] } : d)));

  const contacts = [
    { name: "Liza Mendoza", stage: "Donor", last: "Opened October update" },
    { name: "Carlo Bautista", stage: "Volunteer", last: "Registered for outreach" },
    { name: "Ana Reyes", stage: "Major donor", last: "Meeting on Nov 4" },
    { name: "Mark Santos", stage: "Subscriber", last: "Signed up on website" },
    { name: "Joy Dela Cruz", stage: "Donor", last: "Gave ₱5,000" },
  ].filter((c) => stageFilter === "All" || c.stage === stageFilter);

  return (
    <ProtoFrame
      name="HubSpot setup for a ministry"
      active={tab}
      onTab={setTab}
      tabs={[
        { id: "pipeline", label: "Donor pipeline", icon: Columns3 },
        { id: "contacts", label: "Contacts", icon: ContactIcon },
        { id: "email", label: "Email", icon: Mail },
        { id: "reports", label: "Reports", icon: BarChart3 },
      ]}
    >
      {tab === "pipeline" && (
        <>
          <ProtoTitle title="Major gifts pipeline" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {STAGES.map((stage) => {
              const inStage = deals.filter((d) => d.stage === stage);
              return (
                <div key={stage} className="bg-sheet border border-rule rounded-lg p-2 min-h-[10rem]">
                  <div className="flex justify-between items-baseline px-1 mb-2">
                    <span className="text-[0.75rem] font-semibold text-ink">{stage}</span>
                    <span className="font-mono text-[0.62rem] text-mist">{peso(inStage.reduce((s, d) => s + d.amount, 0))}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {inStage.map((d) => (
                      <div key={d.name} className="bg-raised border border-rule rounded-md p-2">
                        <div className="text-[0.72rem] font-medium text-ink leading-tight">{d.name}</div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-mono text-[0.62rem] text-graphite">{peso(d.amount)}</span>
                          {stage !== "Given" && (
                            <button type="button" onClick={() => advance(d.name)} className="text-[0.62rem] text-gold-bright hover:underline cursor-pointer">
                              Move →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "contacts" && (
        <>
          <ProtoTitle
            title="Contacts"
            action={
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                aria-label="Filter by lifecycle stage"
                className="bg-sheet border border-rule rounded-md text-[0.72rem] text-ink px-2 py-1 cursor-pointer"
              >
                {["All", "Subscriber", "Volunteer", "Donor", "Major donor"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            }
          />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {contacts.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-[0.82rem] font-medium text-ink">{c.name}</span>
                  <span className="block text-[0.7rem] text-mist truncate">{c.last}</span>
                </span>
                <span className="text-[0.72rem] text-gold-bright whitespace-nowrap">{c.stage}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "email" && (
        <>
          <ProtoTitle title="Campaigns" />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {[
              { name: "October ministry update", sent: 4820, open: 52, click: 9 },
              { name: "Year-end giving appeal", sent: 4790, open: 47, click: 12 },
              { name: "Volunteer call: outreach", sent: 1260, open: 61, click: 18 },
            ].map((c) => (
              <li key={c.name} className="px-3 py-2.5">
                <div className="flex justify-between text-[0.8rem]">
                  <span className="text-ink">{c.name}</span>
                  <span className="font-mono text-[0.68rem] text-mist">{c.sent.toLocaleString()} sent</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2 text-[0.68rem] text-graphite">
                  <div>
                    Opened {c.open}%<Meter value={c.open} max={100} className="mt-1" />
                  </div>
                  <div>
                    Clicked {c.click}%<Meter value={c.click} max={100} className="mt-1" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "reports" && (
        <>
          <ProtoTitle title="Giving by month" />
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <Stat label="Donor retention" value="68%" sub="Gave again within 12 months" />
            <Stat label="Average gift" value={peso(3450)} />
          </div>
          <Bars
            format={(n) => `${Math.round(n / 1000)}k`}
            data={[{ label: "May", value: 410000 }, { label: "Jun", value: 388000 }, { label: "Jul", value: 452000 }, { label: "Aug", value: 437000 }, { label: "Sep", value: 498000 }, { label: "Oct", value: 531000 }]}
          />
        </>
      )}
    </ProtoFrame>
  );
}

// ---- SME ERP ------------------------------------------------------------------------

export function ErpPrototype() {
  const [tab, setTab] = useState("inventory");
  const [ordered, setOrdered] = useState<string[]>([]);
  const [orderFilter, setOrderFilter] = useState("All");
  const [reminded, setReminded] = useState<string[]>([]);

  const stock = [
    { sku: "TL-0142", name: "Ceramic floor tile 60×60", qty: 340, reorder: 200 },
    { sku: "PT-0031", name: "Interior paint, white 4L", qty: 48, reorder: 60 },
    { sku: "GL-0207", name: "Tempered glass panel", qty: 22, reorder: 15 },
    { sku: "AD-0019", name: "Tile adhesive 25kg", qty: 12, reorder: 40 },
  ];
  const orders = [
    { id: "SO-1043", customer: "Dela Cruz Builders", total: 86400, status: "Pending" },
    { id: "SO-1042", customer: "Ramos Interiors", total: 23150, status: "Shipped" },
    { id: "SO-1041", customer: "Villanueva Home", total: 9800, status: "Delivered" },
    { id: "SO-1040", customer: "Garcia Construction", total: 152000, status: "Shipped" },
  ].filter((o) => orderFilter === "All" || o.status === orderFilter);

  return (
    <ProtoFrame
      name="ERP for a building supplies SME"
      active={tab}
      onTab={setTab}
      tabs={[
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "invoices", label: "Invoices", icon: Receipt },
        { id: "reports", label: "Reports", icon: BarChart3 },
      ]}
    >
      {tab === "inventory" && (
        <>
          <ProtoTitle title="Inventory" />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {stock.map((item) => {
              const low = item.qty < item.reorder;
              const onOrder = ordered.includes(item.sku);
              return (
                <li key={item.sku} className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[0.8rem] font-medium text-ink truncate">{item.name}</span>
                      <span className="block font-mono text-[0.65rem] text-mist">{item.sku} · {item.qty} in stock · reorder at {item.reorder}</span>
                    </span>
                    {low ? (
                      onOrder ? <Status tone="muted">On order</Status> : <SmallButton onClick={() => setOrdered((o) => [...o, item.sku])}>Reorder</SmallButton>
                    ) : (
                      <Status tone="good">OK</Status>
                    )}
                  </div>
                  <Meter value={item.qty} max={Math.max(item.qty, item.reorder * 2)} className="mt-2" />
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === "orders" && (
        <>
          <ProtoTitle
            title="Sales orders"
            action={
              <div className="flex rounded-md border border-rule overflow-hidden text-[0.68rem]">
                {["All", "Pending", "Shipped", "Delivered"].map((f) => (
                  <button key={f} type="button" onClick={() => setOrderFilter(f)} className={cn("px-2 py-1 cursor-pointer", orderFilter === f ? "bg-gold text-paper" : "text-graphite hover:text-ink")}>
                    {f}
                  </button>
                ))}
              </div>
            }
          />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[0.8rem] font-medium text-ink truncate">{o.customer}</span>
                  <span className="block font-mono text-[0.65rem] text-mist">{o.id} · {peso(o.total)}</span>
                </span>
                <Status tone={o.status === "Delivered" ? "good" : o.status === "Shipped" ? "warn" : "muted"}>{o.status}</Status>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "invoices" && (
        <>
          <ProtoTitle title="Invoices" />
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <Stat label="Unpaid" value={peso(118550)} sub="4 invoices" />
            <Stat label="Overdue" value={peso(32300)} sub="2 invoices" />
          </div>
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {[
              { id: "INV-2210", customer: "Ramos Interiors", amount: 23150, state: "overdue" },
              { id: "INV-2207", customer: "Mendoza Kitchens", amount: 9150, state: "overdue" },
              { id: "INV-2212", customer: "Garcia Construction", amount: 86250, state: "due" },
              { id: "INV-2199", customer: "Villanueva Home", amount: 9800, state: "paid" },
            ].map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[0.8rem] font-medium text-ink truncate">{inv.customer}</span>
                  <span className="block font-mono text-[0.65rem] text-mist">{inv.id} · {peso(inv.amount)}</span>
                </span>
                {inv.state === "overdue" ? (
                  reminded.includes(inv.id) ? (
                    <Status tone="muted">Reminder sent</Status>
                  ) : (
                    <SmallButton onClick={() => setReminded((r) => [...r, inv.id])}>Send reminder</SmallButton>
                  )
                ) : (
                  <Status tone={inv.state === "paid" ? "good" : "warn"}>{inv.state === "paid" ? "Paid" : "Due in 9 days"}</Status>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "reports" && (
        <>
          <ProtoTitle title="Revenue by month" />
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <Stat label="Gross margin" value="31%" sub="Last 90 days" />
            <Stat label="Top product" value="Floor tile" sub="22% of revenue" />
          </div>
          <Bars
            format={(n) => `${(n / 1_000_000).toFixed(1)}M`}
            data={[{ label: "May", value: 1_820_000 }, { label: "Jun", value: 1_640_000 }, { label: "Jul", value: 1_950_000 }, { label: "Aug", value: 2_110_000 }, { label: "Sep", value: 2_040_000 }, { label: "Oct", value: 2_380_000 }]}
          />
        </>
      )}
    </ProtoFrame>
  );
}
