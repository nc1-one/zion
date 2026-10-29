"use client";

import React, { useState } from "react";
import { BarChart3, CalendarDays, HandCoins, HeartHandshake, LayoutDashboard, MessageSquare, Plus, Search, UserPlus, Users } from "lucide-react";
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
  useProtoApp,
} from "./ProtoKit";
import { cn } from "@/lib/utils";

const peso = (n: number) => `₱${n.toLocaleString()}`;

interface Person {
  id: string;
  name: string;
  household: string;
  phone: string;
  status: "Member" | "Regular" | "Guest";
  ministry: string;
  joined: string;
  weeksAway: number;
  notes: string[];
}

interface Gift {
  id: string;
  personId: string;
  fund: "General" | "Missions" | "Building";
  method: "GCash" | "Card" | "Bank" | "Cash";
  amount: number;
  date: string;
}

interface ChurchEvent {
  id: string;
  name: string;
  date: string;
  capacity: number;
  registered: string[];
  checkedIn: string[];
}

const PEOPLE: Person[] = [
  { id: "p1", name: "Ana Reyes", household: "Reyes", phone: "0917 555 0142", status: "Member", ministry: "Worship", joined: "2019", weeksAway: 0, notes: ["Leads Sunday 9 AM worship team."] },
  { id: "p2", name: "Mark Santos", household: "Santos", phone: "0918 555 0193", status: "Member", ministry: "Youth", joined: "2021", weeksAway: 0, notes: [] },
  { id: "p3", name: "Joy Dela Cruz", household: "Dela Cruz", phone: "0927 555 0110", status: "Regular", ministry: "Kids", joined: "2025", weeksAway: 1, notes: [] },
  { id: "p4", name: "Paolo Garcia", household: "Garcia", phone: "0995 555 0177", status: "Member", ministry: "Media", joined: "2020", weeksAway: 6, notes: ["Moved to night shift in September."] },
  { id: "p5", name: "Liza Mendoza", household: "Mendoza", phone: "0906 555 0128", status: "Guest", ministry: "—", joined: "2026", weeksAway: 0, notes: ["First visit Oct 19, came with Joy."] },
  { id: "p6", name: "Ben Ramos", household: "Ramos", phone: "0917 555 0161", status: "Member", ministry: "Ushers", joined: "2018", weeksAway: 5, notes: [] },
  { id: "p7", name: "Grace Villanueva", household: "Villanueva", phone: "0919 555 0105", status: "Regular", ministry: "Prayer", joined: "2024", weeksAway: 0, notes: [] },
  { id: "p8", name: "Carlo Bautista", household: "Bautista", phone: "0945 555 0136", status: "Guest", ministry: "—", joined: "2026", weeksAway: 2, notes: [] },
  { id: "p9", name: "Rina Navarro", household: "Navarro", phone: "0928 555 0187", status: "Member", ministry: "Kids", joined: "2017", weeksAway: 0, notes: [] },
  { id: "p10", name: "Dan Castillo", household: "Castillo", phone: "0917 555 0119", status: "Member", ministry: "Men's", joined: "2016", weeksAway: 8, notes: ["Caring for his mother in Batangas."] },
];

const GIFTS: Gift[] = [
  { id: "g1", personId: "p1", fund: "General", method: "GCash", amount: 5000, date: "Oct 26" },
  { id: "g2", personId: "p9", fund: "Missions", method: "Card", amount: 2500, date: "Oct 26" },
  { id: "g3", personId: "p2", fund: "General", method: "Bank", amount: 3000, date: "Oct 25" },
  { id: "g4", personId: "p7", fund: "Building", method: "GCash", amount: 1000, date: "Oct 19" },
  { id: "g5", personId: "p3", fund: "General", method: "Cash", amount: 500, date: "Oct 19" },
  { id: "g6", personId: "p1", fund: "Missions", method: "GCash", amount: 2000, date: "Oct 12" },
];

const EVENTS: ChurchEvent[] = [
  { id: "e1", name: "Youth Camp 2026", date: "Nov 14–16", capacity: 60, registered: ["p2", "p3", "p8", "p9"], checkedIn: [] },
  { id: "e2", name: "Couples Night", date: "Nov 7", capacity: 40, registered: ["p1", "p6", "p7"], checkedIn: [] },
  { id: "e3", name: "Kids Christmas Program", date: "Dec 14", capacity: 150, registered: ["p3", "p9"], checkedIn: [] },
];

const ROLES = ["Worship", "Kids church", "Ushers", "Livestream", "Welcome team"];

export function ChurchOSPrototype() {
  const app = useProtoApp("dashboard");
  const [people, setPeople] = useState(PEOPLE);
  const [gifts, setGifts] = useState(GIFTS);
  const [events, setEvents] = useState(EVENTS);
  const [schedule, setSchedule] = useState<Record<string, Record<string, string | null>>>({
    "9 AM": { Worship: "Ana Reyes", "Kids church": "Rina Navarro", Ushers: "Ben Ramos", Livestream: null, "Welcome team": "Grace Villanueva" },
    "11 AM": { Worship: "Mark Santos", "Kids church": null, Ushers: null, Livestream: "Paolo Garcia", "Welcome team": "Joy Dela Cruz" },
  });
  const [assigned, setAssigned] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "members" | "guests" | "drifting">("all");
  const [range, setRange] = useState<"month" | "year">("month");
  const [service, setService] = useState<"9 AM" | "11 AM">("9 AM");
  const [addOpen, setAddOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", phone: "", status: "Guest" as Person["status"] });
  const [giftDraft, setGiftDraft] = useState({ personId: "p1", amount: "1000", fund: "General" as Gift["fund"] });
  const [note, setNote] = useState("");

  const person = (id?: string) => people.find((p) => p.id === id);
  const drifting = people.filter((p) => p.weeksAway >= 4);
  const monthTotal = gifts.reduce((s, g) => s + g.amount, 0) + 171200;

  const visible = people.filter((p) => {
    const matches = `${p.name} ${p.ministry} ${p.household}`.toLowerCase().includes(query.toLowerCase());
    const inFilter =
      filter === "all" || (filter === "members" && p.status === "Member") || (filter === "guests" && p.status === "Guest") || (filter === "drifting" && p.weeksAway >= 4);
    return matches && inFilter;
  });

  const addPerson = () => {
    if (!draft.name.trim()) return;
    const id = `p${Date.now()}`;
    const last = draft.name.trim().split(" ").slice(-1)[0];
    setPeople((list) => [
      { id, name: draft.name.trim(), household: last, phone: draft.phone || "—", status: draft.status, ministry: "—", joined: "2026", weeksAway: 0, notes: [] },
      ...list,
    ]);
    setAddOpen(false);
    setDraft({ name: "", phone: "", status: "Guest" });
    app.notify(`${draft.name.trim()} added to People`);
  };

  const recordGift = () => {
    const amount = Number(giftDraft.amount);
    if (!amount) return;
    setGifts((list) => [{ id: `g${Date.now()}`, personId: giftDraft.personId, fund: giftDraft.fund, method: "Cash", amount, date: "Today" }, ...list]);
    setGiftOpen(false);
    app.notify(`Gift of ${peso(amount)} recorded. Receipt emailed.`);
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "people", label: "People", icon: Users, badge: people.length },
    { id: "giving", label: "Giving", icon: HandCoins },
    { id: "events", label: "Events", icon: CalendarDays },
    { id: "volunteers", label: "Volunteers", icon: HeartHandshake },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const p = person(app.id);
  const ev = events.find((e) => e.id === app.id);

  return (
    <ProtoApp app={app} name="Church OS · Grace Fellowship" user="Pastor Dan Castillo" nav={nav} alerts={drifting.length - assigned.length}>
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Dashboard" subtitle="Sunday, October 26" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Attendance" value="412" sub="+6% vs last month" tone="good" />
            <Stat label="Giving, October" value={peso(monthTotal)} sub="128 recurring givers" />
            <Stat label="First-time guests" value="9" sub="3 came back" />
            <Stat label="Drifting" value={String(drifting.length)} sub="Away 4+ weeks" tone="bad" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
            <Panel title="Attendance, last eight Sundays">
              <Bars data={[{ label: "Sep 7", value: 362 }, { label: "14", value: 368 }, { label: "21", value: 381 }, { label: "28", value: 377 }, { label: "Oct 5", value: 395 }, { label: "12", value: 402 }, { label: "19", value: 398 }, { label: "26", value: 412 }]} />
            </Panel>
            <Panel title="Needs a call this week">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {drifting.map((d) => (
                  <li key={d.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={d.name} size={28} />
                    <button type="button" onClick={() => app.open("person", d.id, d.name)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{d.name}</span>
                      <span className="block text-[0.68rem] text-mist">Away {d.weeksAway} weeks · {d.ministry}</span>
                    </button>
                    {assigned.includes(d.id) ? (
                      <Status tone="good">Assigned</Status>
                    ) : (
                      <SmallButton
                        onClick={() => {
                          setAssigned((a) => [...a, d.id]);
                          app.notify(`Follow-up for ${d.name} assigned to Pastor Joel`);
                        }}
                      >
                        Assign
                      </SmallButton>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "people" && (
        <>
          <ScreenHeader
            title="People"
            subtitle={`${people.length} people · ${new Set(people.map((x) => x.household)).size} households`}
            action={
              <PrimaryButton onClick={() => setAddOpen(true)}>
                <UserPlus size={14} /> Add person
              </PrimaryButton>
            }
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
              <Search size={14} className="text-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, ministry, household" aria-label="Search people" className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
            </label>
            <Segmented
              id="cos-people"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All" },
                { id: "members", label: "Members" },
                { id: "guests", label: "Guests" },
                { id: "drifting", label: "Drifting" },
              ]}
            />
          </div>
          <Table
            rows={visible}
            rowKey={(r) => r.id}
            onRowClick={(r) => app.open("person", r.id, r.name)}
            empty={`No one matches "${query}".`}
            columns={[
              { key: "name", label: "Name", render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={24} /><span className="text-ink">{r.name}</span></span> },
              { key: "ministry", label: "Ministry", render: (r) => r.ministry, hideOnMobile: true },
              { key: "last", label: "Last seen", render: (r) => (r.weeksAway === 0 ? "This Sunday" : `${r.weeksAway} wk ago`), hideOnMobile: true },
              { key: "status", label: "Status", render: (r) => <Status tone={r.weeksAway >= 4 ? "bad" : r.status === "Guest" ? "warn" : "good"}>{r.weeksAway >= 4 ? "Drifting" : r.status}</Status> },
            ]}
          />
        </>
      )}

      {app.screen === "person" && p && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={p.name} size={48} />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-[1.5rem] leading-tight font-semibold text-ink">{p.name}</h4>
              <Status tone={p.weeksAway >= 4 ? "bad" : p.status === "Guest" ? "warn" : "good"}>{p.weeksAway >= 4 ? `Away ${p.weeksAway} weeks` : p.status}</Status>
            </div>
            <SmallButton onClick={() => app.notify(`Text sent to ${p.name.split(" ")[0]}`)}>
              <MessageSquare size={12} /> Text
            </SmallButton>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Details">
              <KeyValues items={[["Household", `${p.household} family`], ["Phone", p.phone], ["Ministry", p.ministry], ["With us since", p.joined]]} />
            </Panel>
            <Panel title="Giving this year">
              <ul className="flex flex-col gap-1.5 text-[0.8rem]">
                {gifts.filter((g) => g.personId === p.id).map((g) => (
                  <li key={g.id} className="flex justify-between"><span className="text-ink-soft">{g.date} · {g.fund}</span><span className="font-mono text-ink">{peso(g.amount)}</span></li>
                ))}
                {gifts.every((g) => g.personId !== p.id) && <li className="text-graphite">No gifts recorded.</li>}
              </ul>
            </Panel>
            <Panel title="Pastoral notes" className="lg:col-span-2">
              <ul className="flex flex-col gap-1.5 mb-3 text-[0.8rem] text-ink-soft">
                {p.notes.map((n, i) => <li key={i}>· {n}</li>)}
                {p.notes.length === 0 && <li className="text-graphite">No notes yet.</li>}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  setPeople((list) => list.map((x) => (x.id === p.id ? { ...x, notes: [...x.notes, note.trim()] } : x)));
                  setNote("");
                  app.notify("Note saved");
                }}
              >
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" aria-label="Add a note" className={inputClass} />
                <PrimaryButton type="submit">Save</PrimaryButton>
              </form>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "giving" && (
        <>
          <ScreenHeader
            title="Giving"
            action={
              <>
                <Segmented id="cos-range" value={range} onChange={setRange} options={[{ id: "month", label: "October" }, { id: "year", label: "2026" }]} />
                <PrimaryButton onClick={() => setGiftOpen(true)}><Plus size={14} /> Record gift</PrimaryButton>
              </>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
            <Stat label="Total" value={peso(range === "month" ? monthTotal : 1912400)} sub={range === "month" ? "+8% vs September" : "+11% vs 2025"} tone="good" />
            <Stat label="Recurring givers" value={range === "month" ? "128" : "141"} />
            <Stat label="Reconciled" value="100%" sub="Matched to bank deposits" tone="good" />
          </div>
          <Table
            rows={gifts}
            rowKey={(g) => g.id}
            onRowClick={(g) => app.open("person", g.personId, person(g.personId)?.name)}
            columns={[
              { key: "who", label: "Giver", render: (g) => <span className="text-ink">{person(g.personId)?.name}</span> },
              { key: "fund", label: "Fund", render: (g) => g.fund },
              { key: "method", label: "Method", render: (g) => g.method, hideOnMobile: true },
              { key: "date", label: "Date", render: (g) => g.date, hideOnMobile: true },
              { key: "amount", label: "Amount", align: "right", render: (g) => <span className="font-mono text-ink">{peso(g.amount)}</span> },
            ]}
          />
        </>
      )}

      {app.screen === "events" && (
        <>
          <ScreenHeader title="Events" subtitle="Registration and check-in" />
          <Table
            rows={events}
            rowKey={(e) => e.id}
            onRowClick={(e) => app.open("event", e.id, e.name)}
            columns={[
              { key: "name", label: "Event", render: (e) => <span className="text-ink">{e.name}</span> },
              { key: "date", label: "Date", render: (e) => e.date },
              { key: "reg", label: "Registered", render: (e) => <span className="flex items-center gap-2"><Meter value={e.registered.length} max={e.capacity} className="w-16" /><span className="font-mono text-[0.7rem]">{e.registered.length}/{e.capacity}</span></span> },
            ]}
          />
        </>
      )}

      {app.screen === "event" && ev && (
        <>
          <ScreenHeader title={ev.name} subtitle={`${ev.date} · ${ev.registered.length} registered of ${ev.capacity}`} />
          <Panel title={`Check-in · ${ev.checkedIn.length} of ${ev.registered.length}`}>
            <Meter value={ev.checkedIn.length} max={Math.max(1, ev.registered.length)} className="mb-3" />
            <ul className="flex flex-col divide-y divide-rule-soft">
              {ev.registered.map((pid) => {
                const who = person(pid)!;
                const inside = ev.checkedIn.includes(pid);
                return (
                  <li key={pid} className="flex items-center gap-2.5 py-2">
                    <Avatar name={who.name} size={26} />
                    <span className="flex-1 text-[0.8rem] text-ink">{who.name}</span>
                    <button
                      type="button"
                      aria-pressed={inside}
                      onClick={() => setEvents((list) => list.map((x) => (x.id === ev.id ? { ...x, checkedIn: inside ? x.checkedIn.filter((c) => c !== pid) : [...x.checkedIn, pid] } : x)))}
                      className={cn("px-2.5 py-1 rounded-md text-[0.72rem] font-medium border transition-colors cursor-pointer", inside ? "bg-gold border-gold text-paper" : "border-rule text-ink hover:border-gold")}
                    >
                      {inside ? "Checked in" : "Check in"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      )}

      {app.screen === "volunteers" && (
        <>
          <ScreenHeader title="Sunday team" subtitle="October 26" action={<Segmented id="cos-service" value={service} onChange={setService} options={[{ id: "9 AM", label: "9 AM" }, { id: "11 AM", label: "11 AM" }]} />} />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {ROLES.map((role) => {
              const who = schedule[service][role];
              return (
                <li key={role} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <span>
                    <span className="block text-[0.82rem] font-medium text-ink">{role}</span>
                    <span className={cn("block text-[0.72rem]", who ? "text-mist" : "text-danger")}>{who ?? "Open slot"}</span>
                  </span>
                  {who ? (
                    <Status tone="good">Confirmed</Status>
                  ) : (
                    <select
                      aria-label={`Assign ${role}`}
                      defaultValue=""
                      onChange={(e) => {
                        const name = e.target.value;
                        setSchedule((s) => ({ ...s, [service]: { ...s[service], [role]: name } }));
                        app.notify(`${name} asked to serve on ${role}. Reminder sent.`);
                      }}
                      className="h-8 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer"
                    >
                      <option value="" disabled>Assign…</option>
                      {people.filter((x) => x.status !== "Guest").map((x) => <option key={x.id}>{x.name}</option>)}
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {app.screen === "reports" && (
        <>
          <ScreenHeader title="Reports" subtitle="Last 12 weeks" />
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <Stat label="Guests who returned" value="34%" sub="+9 points since April" tone="good" />
            <Stat label="Members serving" value="61%" sub="Goal: 70%" />
          </div>
          <Panel title="Giving by fund, 2026">
            <Bars format={(n) => `${Math.round(n / 1000)}k`} data={[{ label: "General", value: 1254000 }, { label: "Missions", value: 438400 }, { label: "Building", value: 220000 }]} />
          </Panel>
        </>
      )}

      <ProtoModal
        open={addOpen}
        title="Add person"
        onClose={() => setAddOpen(false)}
        footer={<PrimaryButton onClick={addPerson} disabled={!draft.name.trim()}>Add to People</PrimaryButton>}
      >
        <Field label="Full name">
          <input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Maria Santos" />
        </Field>
        <Field label="Mobile number">
          <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClass} placeholder="0917 000 0000" />
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Person["status"] })} className={inputClass}>
            <option>Guest</option>
            <option>Regular</option>
            <option>Member</option>
          </select>
        </Field>
      </ProtoModal>

      <ProtoModal
        open={giftOpen}
        title="Record a gift"
        onClose={() => setGiftOpen(false)}
        footer={<PrimaryButton onClick={recordGift}>Record and send receipt</PrimaryButton>}
      >
        <Field label="Giver">
          <select value={giftDraft.personId} onChange={(e) => setGiftDraft({ ...giftDraft, personId: e.target.value })} className={inputClass}>
            {people.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </Field>
        <Field label="Amount (₱)">
          <input inputMode="numeric" value={giftDraft.amount} onChange={(e) => setGiftDraft({ ...giftDraft, amount: e.target.value.replace(/\D/g, "") })} className={inputClass} />
        </Field>
        <Field label="Fund">
          <select value={giftDraft.fund} onChange={(e) => setGiftDraft({ ...giftDraft, fund: e.target.value as Gift["fund"] })} className={inputClass}>
            <option>General</option>
            <option>Missions</option>
            <option>Building</option>
          </select>
        </Field>
      </ProtoModal>
    </ProtoApp>
  );
}
