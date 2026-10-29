"use client";

import React, { useState } from "react";
import { BookOpen, ClipboardCheck, LayoutDashboard, Megaphone, Minus, Plus, Send, UserPlus, Users } from "lucide-react";
import { Avatar, Bars, Field, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Sample data -------------------------------------------------------------------

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
interface CheckIn { id: string; week: string; count: number; size: number; followUp: string; note: string }
interface Prayer { id: string; text: string; by: string; answered: boolean }
interface Group { id: string; seed: number; name: string; leader: string; area: string; day: Day; time: string; stage: string; members: string[]; joined: string[]; past: number[]; present: string[]; checkedIn: boolean; lastCheckIn: number; planId: string; planWeek: number; prayers: Prayer[]; checkins: CheckIn[] }
interface Seeker { id: string; names: string[]; area: string; day: Day; stage: string; since: string; waited: number }
interface Message { id: string; to: string; body: string; sent: string; read: number; total: number }

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AREAS = ["Makati", "Marikina", "Quezon City", "Pasig", "Mandaluyong", "Taguig", "Parañaque", "Ortigas"];
const STAGES = ["Young pros", "Students", "Couples", "Moms", "Men", "Families", "Seniors", "Shift workers"];
const NEAR: Record<string, string[]> = {
  Makati: ["Taguig", "Mandaluyong"],
  Taguig: ["Makati", "Pasig"],
  Pasig: ["Ortigas", "Marikina", "Mandaluyong", "Taguig"],
  Ortigas: ["Pasig", "Mandaluyong"],
  Mandaluyong: ["Ortigas", "Makati", "Pasig"],
  Marikina: ["Pasig", "Quezon City"],
  "Quezon City": ["Marikina"],
  Parañaque: ["Makati", "Taguig"],
};
const WEEKS = ["Sep 20", "Sep 27", "Oct 4", "Oct 11", "Oct 18"];
const WEEK_SHORT = ["9/20", "9/27", "10/4", "10/11", "10/18"];

const PLANS = [
  { id: "john", title: "Gospel of John in six weeks", readings: ["John 1–3", "John 4–6", "John 7–9", "John 10–12", "John 13–17", "John 18–21"] },
  { id: "psalms", title: "Psalms of Ascent", readings: ["Psalms 120–122", "Psalms 123–125", "Psalms 126–128", "Psalms 129–131", "Psalms 132–134"] },
  { id: "romans", title: "Romans 1–8", readings: ["Romans 1", "Romans 2", "Romans 3", "Romans 4", "Romans 5", "Romans 6", "Romans 7", "Romans 8"] },
];

// past: attendance for the five weeks before this one. last: weeks since the leader's last check-in (0 = this week).
const RAW = [
  { id: "g1", name: "Makati Young Pros", leader: "Mark Santos", area: "Makati", day: "Tue", time: "7:30 PM", stage: "Young pros", members: "Mark Santos, Ana Reyes, Jem Ocampo, Kim Tan, Ria Bautista, Josh Lim, Pia Navarro, Enzo Mendoza, Nikki Cruz, Raffy Torres", past: [9, 8, 9, 8, 9], here: 9, last: 0, planId: "john", planWeek: 5, note: "Good discussion on John 13. Two guests from Kim's office." },
  { id: "g2", name: "Marikina Moms", leader: "Joy Dela Cruz", area: "Marikina", day: "Wed", time: "9:30 AM", stage: "Moms", members: "Joy Dela Cruz, Weng Santos, Marites Gomez, Lyn Pascual, Cecil Robles, Jhoanna Reyes, Bing Morales, Malou Ferrer", past: [7, 7, 6, 7, 6], here: 0, last: 1, planId: "psalms", planWeek: 4, note: "" },
  { id: "g3", name: "QC Students", leader: "Paolo Garcia", area: "Quezon City", day: "Thu", time: "6:00 PM", stage: "Students", members: "Paolo Garcia, Bianca Ramos, Kyle Uy, Trisha Sy, Migs Herrera, Andrei Co, Sam Velasco, Janelle Ong, Gab Dizon, Ella Marquez, Nico Salazar, Fritz Dela Paz", past: [10, 9, 8, 7, 6], here: 0, last: 2, planId: "romans", planWeek: 2, note: "Midterms. Several stayed home to study." },
  { id: "g4", name: "Couples Circle", leader: "Ben and Lea Ramos", area: "Pasig", day: "Fri", time: "7:00 PM", stage: "Couples", members: "Ben Ramos, Lea Ramos, Jun Aquino, Mia Aquino, Rey Santiago, Cora Santiago, Ed Valdez, Tina Valdez", past: [8, 6, 8, 8, 7], here: 8, last: 0, planId: "john", planWeek: 5, note: "" },
  { id: "g5", name: "Men's Breakfast", leader: "Dan Castillo", area: "Mandaluyong", day: "Sat", time: "6:30 AM", stage: "Men", members: "Dan Castillo, Ricky Navarro, Boyet Cruz, Jojo Mercado, Arnel Bautista, Dennis Tan, Ramil Ocampo, Totoy Reyes, Edgar Lim", past: [7, 6, 5, 4, 3], here: 0, last: 3, planId: "romans", planWeek: 1, note: "Three of the men started night shift." },
  { id: "g6", name: "Taguig Families", leader: "Rina Navarro", area: "Taguig", day: "Sun", time: "4:00 PM", stage: "Families", members: "Rina Navarro, Allan Navarro, Mylene Uy, Patrick Uy, Sheila Cortez, Vince Cortez, Karen Lopez, Rodel Lopez, Hazel Tan, Marvin Tan", past: [8, 8, 7, 8, 7], here: 0, last: 1, planId: "john", planWeek: 3, note: "" },
  { id: "g7", name: "Parañaque Seniors", leader: "Grace Villanueva", area: "Parañaque", day: "Wed", time: "2:00 PM", stage: "Seniors", members: "Grace Villanueva, Pilar Ramos, Ernesto Cruz, Nena Santos, Conrado Reyes, Fely Gomez, Rosario Mendoza, Benigno Diaz", past: [6, 6, 6, 5, 5], here: 0, last: 2, planId: "psalms", planWeek: 3, note: "Nena is in the hospital. Visiting on Friday." },
  { id: "g8", name: "Ortigas Night Shift", leader: "Jun Ocampo", area: "Ortigas", day: "Sat", time: "10:00 AM", stage: "Shift workers", members: "Jun Ocampo, Aira Mendoza, Kevin Sison, Lovely Ramos, JM Torres, Precious Lim", past: [5, 4, 3, 3, 2], here: 0, last: 4, planId: "psalms", planWeek: 2, note: "Account moved to a new schedule. Saturday is hard now." },
] as const;

const PRAYERS: Record<string, [string, string, boolean][]> = {
  g1: [["Job interview at BGC on Friday", "Kim Tan", false], ["Healing for Ana's father", "Ana Reyes", true]],
  g3: [["Nursing board exam review", "Bianca Ramos", false]],
  g5: [["Work schedules so the men can come back", "Dan Castillo", false]],
  g7: [["Nena's recovery after surgery", "Grace Villanueva", false]],
};

const GROUPS: Group[] = RAW.map((r, seed) => {
  const members = r.members.split(", ");
  const history: CheckIn[] = r.past.map((count, w) => ({ id: `${r.id}-${w}`, week: WEEKS[w], count, size: members.length, followUp: "", note: "" })).slice(0, 6 - Math.max(r.last, 1)).reverse();
  if (r.last === 0) history.unshift({ id: `${r.id}-5`, week: "This week", count: r.here, size: members.length, followUp: "", note: "" });
  return {
    ...r,
    seed,
    day: r.day as Day,
    members,
    joined: [],
    past: [...r.past],
    present: members.filter((_, i) => (i + 15 + seed) % members.length < r.here),
    checkedIn: r.last === 0,
    lastCheckIn: r.last,
    prayers: (PRAYERS[r.id] ?? []).map(([text, by, answered], i) => ({ id: `${r.id}-p${i}`, text, by, answered })),
    checkins: history.map((c, i) => (i === 0 ? { ...c, note: r.note } : c)),
  };
});

const SEEKERS: Seeker[] = [
  { id: "w1", names: ["Liza Mendoza"], area: "Makati", day: "Tue", stage: "Young pros", since: "Oct 19", waited: 10 },
  { id: "w2", names: ["Carlo Bautista"], area: "Quezon City", day: "Thu", stage: "Students", since: "Oct 12", waited: 17 },
  { id: "w3", names: ["Rico Tolentino", "Jasmine Tolentino"], area: "Pasig", day: "Fri", stage: "Couples", since: "Oct 5", waited: 24 },
  { id: "w4", names: ["Lorna Castro"], area: "Parañaque", day: "Wed", stage: "Seniors", since: "Oct 22", waited: 7 },
  { id: "w5", names: ["Miguel Reyes"], area: "Mandaluyong", day: "Sat", stage: "Men", since: "Oct 26", waited: 3 },
  { id: "w6", names: ["Aileen Sarmiento"], area: "Quezon City", day: "Wed", stage: "Moms", since: "Oct 15", waited: 14 },
];

const MESSAGES: Message[] = [
  { id: "m1", to: "All leaders", body: "Leaders' huddle this Saturday, 9 AM, at the fellowship hall. Breakfast provided.", sent: "Oct 26", read: 7, total: 8 },
  { id: "m2", to: "Slipping and needs care", body: "Pastor Joel would like to visit your group in November. Reply with a good week.", sent: "Oct 20", read: 3, total: 4 },
  { id: "m3", to: "All leaders", body: "Week 4 guide for John is up. Questions on John 10–12.", sent: "Oct 15", read: 8, total: 8 },
];

// ---- Health and matching -----------------------------------------------------------

const planOf = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0];
const first = (name: string) => name.split(" ")[0];
const seekerLabel = (s: Seeker) => (s.names.length > 1 ? `${first(s.names[0])} and ${s.names[1]}` : s.names[0]);
const wasThere = (g: Group, i: number, w: number) => (i + w * 3 + g.seed) % g.members.length < g.past[w];

// 60 points for attendance over the last four weeks, 25 for leader check-ins, 15 for reading plan progress.
function health(g: Group) {
  const weeks = g.checkedIn ? [...g.past.slice(-3), g.present.length] : g.past.slice(-4);
  const capacity = g.members.length * 4 + (g.checkedIn ? g.joined.length : 0);
  const attendance = Math.round((weeks.reduce((s, n) => s + n, 0) / capacity) * 60);
  const checkin = g.checkedIn ? 25 : g.lastCheckIn <= 1 ? 20 : g.lastCheckIn === 2 ? 10 : 0;
  const plan = Math.round((g.planWeek / planOf(g.planId).readings.length) * 15);
  return { attendance, checkin, plan, score: attendance + checkin + plan };
}
const band = (score: number) => (score >= 70 ? { tone: "good" as const, label: "Healthy" } : score >= 50 ? { tone: "warn" as const, label: "Slipping" } : { tone: "bad" as const, label: "Needs care" });

function reasons(g: Group) {
  const out: string[] = [];
  if (!g.checkedIn && g.lastCheckIn >= 2) out.push(`No check-in for ${g.lastCheckIn} weeks`);
  if (g.past[4] <= g.past[0] * 0.7) out.push(`Attendance down from ${g.past[0]} to ${g.past[4]}`);
  return out.length ? out.join(" · ") : `${g.past[4]} of ${g.members.length} came last week`;
}

function matchScore(s: Seeker, g: Group) {
  return (g.area === s.area ? 3 : NEAR[s.area]?.includes(g.area) ? 2 : 0) + (g.day === s.day ? 2 : 0) + (g.stage === s.stage ? 3 : 0);
}
function matchReason(s: Seeker, g: Group) {
  return [g.area === s.area ? "Same area" : NEAR[s.area]?.includes(g.area) ? `Near ${s.area}` : g.area, g.day === s.day ? `meets ${g.day}` : `meets ${g.day}, not ${s.day}`, g.stage === s.stage ? "same life stage" : g.stage.toLowerCase()].join(", ");
}

// Make this week's list match a head count, keeping who was already marked.
function reconcile(roster: string[], present: string[], count: number) {
  const next = roster.filter((m) => present.includes(m)).slice(0, count);
  for (const m of roster) if (next.length < count && !next.includes(m)) next.push(m);
  return next;
}

// ---- App -------------------------------------------------------------------------------

export function BibleStudyPrototype() {
  const app = useProtoApp("dashboard");
  const [groups, setGroups] = useState(GROUPS);
  const [seekers, setSeekers] = useState(SEEKERS);
  const [placed, setPlaced] = useState<{ id: string; label: string; group: string }[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState(MESSAGES);
  const [filter, setFilter] = useState<"all" | "good" | "warn" | "bad">("all");
  const [reminded, setReminded] = useState(false);
  const [modal, setModal] = useState<"checkin" | "announce" | "seeker" | null>(null);
  const [ciGroupId, setCiGroupId] = useState("g1");
  const [ci, setCi] = useState({ count: 0, followUp: "", note: "" });
  const [announce, setAnnounce] = useState({ to: "all", body: "", sms: true });
  const [seekerDraft, setSeekerDraft] = useState({ name: "", area: "Makati", day: "Tue" as Day, stage: "Young pros" });
  const [prayer, setPrayer] = useState("");

  const close = () => setModal(null);
  const scored = groups.map((g) => ({ g, h: health(g) }));
  const count = (tone: "good" | "warn" | "bad") => scored.filter((x) => band(x.h.score).tone === tone).length;
  const atRisk = scored.filter((x) => x.h.score < 70).sort((a, b) => a.h.score - b.h.score);
  const checkedIn = groups.filter((g) => g.checkedIn).length;
  const people = groups.reduce((s, g) => s + g.members.length + g.joined.length, 0);
  const updateGroup = (id: string, change: (g: Group) => Partial<Group>) => setGroups((list) => list.map((x) => (x.id === id ? { ...x, ...change(x) } : x)));

  const grp = app.screen === "group" ? groups.find((g) => g.id === app.id) : undefined;
  const plan = app.screen === "plan" ? PLANS.find((p) => p.id === app.id) : undefined;
  const ciGroup = groups.find((g) => g.id === ciGroupId) ?? groups[0];
  const bestFor = (s: Seeker) => [...scored].sort((a, b) => matchScore(s, b.g) - matchScore(s, a.g) || b.h.score - a.h.score)[0].g;
  const audiences = [{ id: "all", label: "All leaders", total: groups.length }, { id: "care", label: "Slipping and needs care", total: atRisk.length }, ...groups.map((g) => ({ id: g.id, label: `${g.leader}, ${g.name}`, total: 1 }))];
  const audience = audiences.find((a) => a.id === announce.to) ?? audiences[0];
  const draftSeeker: Seeker = { id: "draft", names: [seekerDraft.name], area: seekerDraft.area, day: seekerDraft.day, stage: seekerDraft.stage, since: "Oct 29", waited: 0 };

  const openCheckin = (g: Group) => {
    setCiGroupId(g.id);
    setCi({ count: g.present.length || g.past[4], followUp: "", note: "" });
    setModal("checkin");
  };

  const submitCheckin = () => {
    const roster = [...ciGroup.members, ...ciGroup.joined];
    const entry = { id: `c${Date.now()}`, week: "This week", count: ci.count, size: roster.length, followUp: ci.followUp, note: ci.note.trim() };
    const updated: Group = { ...ciGroup, present: reconcile(roster, ciGroup.present, ci.count), checkedIn: true, lastCheckIn: 0, checkins: [entry, ...ciGroup.checkins.filter((c) => c.week !== "This week")] };
    setGroups((list) => list.map((x) => (x.id === ciGroup.id ? updated : x)));
    close();
    app.notify(`Check-in saved. Health ${health(ciGroup).score} to ${health(updated).score}.${ci.followUp ? ` Pastor Joel will call ${first(ci.followUp)}.` : ""}`);
  };

  const place = (s: Seeker) => {
    const target = groups.find((g) => g.id === (choice[s.id] ?? bestFor(s).id));
    if (!target) return;
    updateGroup(target.id, (g) => ({ joined: [...g.joined, ...s.names] }));
    setSeekers((list) => list.filter((x) => x.id !== s.id));
    setPlaced((list) => [{ id: s.id, label: seekerLabel(s), group: target.name }, ...list]);
    app.notify(`${seekerLabel(s)} placed in ${target.name}. ${target.leader} was notified.`);
  };

  const addSeeker = () => {
    if (!seekerDraft.name.trim()) return;
    // Seekers only move to placed, so this sum only grows and the id stays unique.
    const s = { ...draftSeeker, id: `w${seekers.length + placed.length + 1}`, names: [seekerDraft.name.trim()] };
    setSeekers((list) => [s, ...list]);
    setSeekerDraft({ ...seekerDraft, name: "" });
    close();
    app.notify(`${s.names[0]} added. Best match: ${bestFor(s).name}.`);
  };

  const sendAnnouncement = () => {
    if (!announce.body.trim()) return;
    setMessages((list) => [{ id: `m${Date.now()}`, to: audience.label, body: announce.body.trim(), sent: "Just now", read: 0, total: audience.total }, ...list]);
    setAnnounce({ to: "all", body: "", sms: true });
    close();
    app.notify(`Sent to ${audience.total} ${audience.total === 1 ? "leader" : "leaders"}${announce.sms ? " in the app and by SMS" : " in the app"}`);
  };

  const remind = () => {
    setReminded(true);
    app.notify(`SMS reminder sent to ${groups.length - checkedIn} leaders`);
  };

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "groups", label: "Groups", icon: Users, badge: groups.length },
    { id: "checkins", label: "Check-ins", icon: ClipboardCheck, badge: groups.length - checkedIn || undefined },
    { id: "finder", label: "Group finder", icon: UserPlus, badge: seekers.length || undefined },
    { id: "plans", label: "Reading plans", icon: BookOpen },
    { id: "messages", label: "Messages", icon: Megaphone },
  ];

  const healthCell = (score: number) => (
    <span className="flex items-center gap-2">
      <span className="font-mono text-ink w-6 tabular-nums">{score}</span>
      <Status tone={band(score).tone}>{band(score).label}</Status>
    </span>
  );

  return (
    <ProtoApp app={app} name="Bible Study Groups · Grace Fellowship" user="Pastor Joel Manalo" nav={nav} alerts={count("bad") + seekers.length}>
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="Group health" subtitle={`Week of October 25 · ${groups.length} groups · ${people} people`} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Healthy" value={String(count("good"))} sub="Score 70 or higher" tone="good" />
            <Stat label="Slipping" value={String(count("warn"))} sub="Score 50 to 69" />
            <Stat label="Needs care" value={String(count("bad"))} sub="Score under 50" tone="bad" />
            <Stat label="Waiting for a group" value={String(seekers.length)} sub={seekers.length ? `Longest ${Math.max(...seekers.map((s) => s.waited))} days` : "Everyone placed"} tone={seekers.length ? undefined : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-3">
            <div className="flex flex-col gap-3">
              <Panel title="Attendance, all groups">
                <Bars data={WEEKS.map((w, i) => ({ label: i === 0 || w.endsWith(" 4") ? w : w.split(" ")[1], value: groups.reduce((s, g) => s + g.past[i], 0) }))} height="h-28" />
              </Panel>
              <Panel title="Leader check-ins this week" action={groups.length > checkedIn && (reminded ? <Status tone="good">Reminded</Status> : <SmallButton onClick={remind}><Send size={12} /> Remind the rest</SmallButton>)}>
                <div className="flex justify-between text-[0.78rem] mb-1.5"><span className="text-ink">{checkedIn} of {groups.length} leaders</span><span className="font-mono text-graphite">{Math.round((checkedIn / groups.length) * 100)}%</span></div>
                <Meter value={checkedIn} max={groups.length} />
              </Panel>
            </div>
            <Panel title="Needs care and slipping">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {atRisk.map(({ g, h }) => (
                  <li key={g.id} className="flex items-center gap-2.5 py-2">
                    <span className="font-mono text-[0.9rem] text-ink w-7 tabular-nums">{h.score}</span>
                    <button type="button" onClick={() => app.open("group", g.id, g.name)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{g.name}</span>
                      <span className="block text-[0.68rem] text-mist truncate">{reasons(g)}</span>
                    </button>
                    <Status tone={band(h.score).tone}>{band(h.score).label}</Status>
                  </li>
                ))}
                {atRisk.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Every group is healthy.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "groups" && (
        <>
          <ScreenHeader title="Groups" subtitle={`${groups.length} groups · ${people} people`} action={<Segmented id="bs-health" value={filter} onChange={setFilter} options={[{ id: "all", label: "All" }, { id: "good", label: "Healthy" }, { id: "warn", label: "Slipping" }, { id: "bad", label: "Needs care" }]} />} />
          <Table
            rows={scored.filter((x) => filter === "all" || band(x.h.score).tone === filter)}
            rowKey={(x) => x.g.id}
            onRowClick={(x) => app.open("group", x.g.id, x.g.name)}
            empty="No groups in this band."
            columns={[
              { key: "name", label: "Group", render: ({ g }) => <span><span className="block text-ink">{g.name}</span><span className="block text-[0.7rem] text-mist">{g.area} · {g.day} {g.time}</span></span> },
              { key: "leader", label: "Leader", render: ({ g }) => g.leader, hideOnMobile: true },
              { key: "members", label: "Members", align: "right", render: ({ g }) => <span className="font-mono">{g.members.length + g.joined.length}</span> },
              { key: "health", label: "Health", render: ({ h }) => healthCell(h.score) },
            ]}
          />
        </>
      )}

      {app.screen === "group" && grp && (() => {
        const h = health(grp);
        const p = planOf(grp.planId);
        const roster = [...grp.members, ...grp.joined];
        return (
          <>
            <ScreenHeader
              title={grp.name}
              subtitle={`${grp.leader} · ${grp.day} ${grp.time} · ${grp.area}`}
              action={
                <>
                  <SmallButton onClick={() => app.notify(`Message sent to ${grp.leader}`)}>Message leader</SmallButton>
                  <PrimaryButton onClick={() => openCheckin(grp)}><ClipboardCheck size={14} /> Leader check-in</PrimaryButton>
                </>
              }
            />
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3">
              <Panel title="Attendance, last six weeks">
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(6,2.1rem)] gap-y-1.5 items-center text-[0.75rem]">
                  <span />
                  {[...WEEK_SHORT, "Now"].map((w) => <span key={w} className="text-center font-mono text-[0.6rem] text-mist">{w}</span>)}
                  {roster.map((name, i) => {
                    const isNew = i >= grp.members.length;
                    const here = grp.present.includes(name);
                    return (
                      <React.Fragment key={name}>
                        <span className="truncate text-ink-soft">
                          {name}
                          {isNew ? <span className="ml-1.5 text-[0.62rem] text-gold-bright">New</span> : <span className="sr-only">, came {grp.past.filter((_, w) => wasThere(grp, i, w)).length} of 5 weeks</span>}
                        </span>
                        {grp.past.map((_, w) => <span key={w} className="flex justify-center" aria-hidden>{isNew ? <span className="w-2.5 h-px bg-rule" /> : <span className={cn("w-2.5 h-2.5 rounded-full", wasThere(grp, i, w) ? "bg-gold/60" : "border border-rule")} />}</span>)}
                        <span className="flex justify-center">
                          <button type="button" aria-pressed={here} aria-label={`${name} came this week`} onClick={() => updateGroup(grp.id, (g) => ({ present: here ? g.present.filter((n) => n !== name) : [...g.present, name] }))} className={cn("w-4 h-4 rounded-full border-2 cursor-pointer transition-colors", here ? "bg-gold border-gold" : "border-mist hover:border-gold")} />
                        </span>
                      </React.Fragment>
                    );
                  })}
                  <span className="text-mist pt-1 border-t border-rule-soft">Came</span>
                  {[...grp.past, grp.present.length].map((n, w) => <span key={w} className="text-center font-mono text-[0.65rem] text-graphite pt-1 border-t border-rule-soft">{n}</span>)}
                </div>
                <p className="mt-2.5 text-[0.7rem] text-mist">Tap this week&apos;s circles to mark who came. It counts toward health once the leader checks in.</p>
              </Panel>
              <div className="flex flex-col gap-3">
                <Panel title="Health score">
                  <div className="flex items-baseline gap-2.5 mb-3"><span className="font-display text-[2rem] leading-none font-semibold text-ink tabular-nums">{h.score}</span><Status tone={band(h.score).tone}>{band(h.score).label}</Status></div>
                  {[{ label: "Attendance, last four weeks", value: h.attendance, max: 60 }, { label: grp.checkedIn ? "Leader checked in this week" : `Last check-in ${grp.lastCheckIn} ${grp.lastCheckIn === 1 ? "week" : "weeks"} ago`, value: h.checkin, max: 25 }, { label: "Reading plan", value: h.plan, max: 15 }].map((part) => (
                    <div key={part.max} className="mb-2 last:mb-0">
                      <div className="flex justify-between text-[0.72rem] mb-1"><span className="text-ink-soft">{part.label}</span><span className="font-mono text-graphite">{part.value}/{part.max}</span></div>
                      <Meter value={part.value} max={part.max} />
                    </div>
                  ))}
                </Panel>
                <Panel title="Reading plan" action={<SmallButton onClick={() => app.open("plan", p.id, p.title)}>Open plan</SmallButton>}>
                  <div className="text-[0.8rem] text-ink mb-0.5">{p.title}</div>
                  <div className="text-[0.72rem] text-mist mb-2">{grp.planWeek} of {p.readings.length} weeks done{grp.planWeek < p.readings.length ? ` · Next: ${p.readings[grp.planWeek]}` : ""}</div>
                  <Meter value={grp.planWeek} max={p.readings.length} />
                </Panel>
              </div>
              <Panel title="Prayer requests">
                <ul className="flex flex-col divide-y divide-rule-soft -mt-1 mb-2.5">
                  {grp.prayers.map((pr) => (
                    <li key={pr.id} className="flex items-center gap-2.5 py-2">
                      <span className="flex-1 min-w-0"><span className={cn("block text-[0.8rem]", pr.answered ? "text-graphite" : "text-ink")}>{pr.text}</span><span className="block text-[0.68rem] text-mist">{pr.by}</span></span>
                      {pr.answered ? <Status tone="good">Answered</Status> : <SmallButton onClick={() => { updateGroup(grp.id, (g) => ({ prayers: g.prayers.map((x) => (x.id === pr.id ? { ...x, answered: true } : x)) })); app.notify("Marked answered. The group will see it."); }}>Mark answered</SmallButton>}
                    </li>
                  ))}
                  {grp.prayers.length === 0 && <li className="py-2 text-[0.8rem] text-graphite">No prayer requests yet.</li>}
                </ul>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!prayer.trim()) return; updateGroup(grp.id, (g) => ({ prayers: [...g.prayers, { id: `p${Date.now()}`, text: prayer.trim(), by: grp.leader, answered: false }] })); setPrayer(""); app.notify("Prayer request added"); }}>
                  <input value={prayer} onChange={(e) => setPrayer(e.target.value)} placeholder="Add a prayer request" aria-label="Add a prayer request" className={inputClass} />
                  <PrimaryButton type="submit">Add</PrimaryButton>
                </form>
              </Panel>
              <Panel title="Check-in history">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {grp.checkins.slice(0, 4).map((c) => (
                    <li key={c.id} className="py-2 text-[0.8rem]">
                      <div className="flex justify-between gap-3"><span className="text-ink">{c.week}</span><span className="font-mono text-graphite">{c.count} of {c.size} came</span></div>
                      {(c.note || c.followUp) && <div className="text-[0.7rem] text-mist mt-0.5">{[c.followUp && `Follow up: ${c.followUp}`, c.note].filter(Boolean).join(" · ")}</div>}
                    </li>
                  ))}
                  {!grp.checkedIn && <li className="py-2 text-[0.75rem] text-danger">{grp.lastCheckIn >= 2 ? `No check-in for ${grp.lastCheckIn} weeks` : "This week's check-in is due"}</li>}
                </ul>
              </Panel>
            </div>
          </>
        );
      })()}

      {app.screen === "checkins" && (
        <>
          <ScreenHeader title="Leader check-ins" subtitle={`Week of October 25 · ${checkedIn} of ${groups.length} in · Leaders get an SMS link on meeting day`} action={groups.length > checkedIn && !reminded ? <SmallButton onClick={remind}><Send size={12} /> Remind the rest</SmallButton> : undefined} />
          <Table
            rows={groups}
            rowKey={(g) => g.id}
            onRowClick={(g) => app.open("group", g.id, g.name)}
            columns={[
              { key: "name", label: "Group", render: (g) => <span><span className="block text-ink">{g.name}</span><span className="block text-[0.7rem] text-mist">{g.leader}</span></span> },
              { key: "day", label: "Meets", render: (g) => `${g.day} ${g.time}`, hideOnMobile: true },
              { key: "status", label: "This week", render: (g) => (g.checkedIn ? <Status tone="good">In, {g.present.length} came</Status> : g.lastCheckIn <= 1 ? <Status tone="warn">Due</Status> : <Status tone="bad">None for {g.lastCheckIn} weeks</Status>) },
              { key: "act", label: "", align: "right", render: (g) => <SmallButton onClick={() => openCheckin(g)}>{g.checkedIn ? "Edit" : "Check in"}</SmallButton> },
            ]}
          />
        </>
      )}

      {app.screen === "finder" && (
        <>
          <ScreenHeader title="Group finder" subtitle={`${seekers.length} waiting · Matched by area, meeting day, and life stage`} action={<PrimaryButton onClick={() => setModal("seeker")}><UserPlus size={14} /> Add person</PrimaryButton>} />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule mb-3">
            {seekers.map((s) => {
              const target = groups.find((g) => g.id === (choice[s.id] ?? bestFor(s).id)) ?? bestFor(s);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                  <Avatar name={s.names[0]} size={32} />
                  <span className="flex-1 min-w-[10rem]">
                    <span className="block text-[0.82rem] text-ink">{seekerLabel(s)}</span>
                    <span className={cn("block text-[0.7rem]", s.waited >= 14 ? "text-danger" : "text-mist")}>{s.area} · Prefers {s.day} · {s.stage} · Waiting {s.waited} days</span>
                  </span>
                  <span className="flex flex-col gap-1 min-w-[12rem]">
                    <select aria-label={`Group for ${seekerLabel(s)}`} value={target.id} onChange={(e) => setChoice((c) => ({ ...c, [s.id]: e.target.value }))} className="h-8 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer">
                      {[...groups].sort((a, b) => matchScore(s, b) - matchScore(s, a)).map((g) => <option key={g.id} value={g.id}>{g.name}{g.id === bestFor(s).id ? " (best match)" : ""}</option>)}
                    </select>
                    <span className="text-[0.66rem] text-mist">{matchReason(s, target)}</span>
                  </span>
                  <PrimaryButton onClick={() => place(s)}>Place in group</PrimaryButton>
                </li>
              );
            })}
            {seekers.length === 0 && <li className="px-3.5 py-6 text-center text-[0.8rem] text-graphite">No one is waiting for a group.</li>}
          </ul>
          {placed.length > 0 && (
            <Panel title="Placed this week">
              <ul className="flex flex-col gap-1.5 text-[0.8rem]">
                {placed.map((x) => <li key={x.id} className="flex justify-between gap-3"><span className="text-ink-soft">{x.label} <span className="text-mist">to</span> {x.group}</span><Status tone="good">Leader notified</Status></li>)}
              </ul>
            </Panel>
          )}
        </>
      )}

      {app.screen === "plans" && (
        <>
          <ScreenHeader title="Reading plans" subtitle="Every group follows a plan. Leaders mark each week done." />
          <Table
            rows={PLANS}
            rowKey={(p) => p.id}
            onRowClick={(p) => app.open("plan", p.id, p.title)}
            columns={[
              { key: "title", label: "Plan", render: (p) => <span className="text-ink">{p.title}</span> },
              { key: "weeks", label: "Length", render: (p) => `${p.readings.length} weeks`, hideOnMobile: true },
              { key: "groups", label: "Groups", align: "right", render: (p) => <span className="font-mono">{groups.filter((g) => g.planId === p.id).length}</span> },
              {
                key: "progress",
                label: "Average progress",
                render: (p) => {
                  const on = groups.filter((g) => g.planId === p.id);
                  const avg = on.reduce((s, g) => s + g.planWeek, 0) / Math.max(1, on.length);
                  return <span className="flex items-center gap-2"><Meter value={avg} max={p.readings.length} className="w-20" /><span className="font-mono text-[0.7rem]">{Math.round((avg / p.readings.length) * 100)}%</span></span>;
                },
              },
            ]}
          />
        </>
      )}

      {app.screen === "plan" && plan && (
        <>
          <ScreenHeader title={plan.title} subtitle={`${plan.readings.length} weeks · ${groups.filter((g) => g.planId === plan.id).length} groups`} action={<SmallButton onClick={() => app.notify(`Discussion guide sent to ${groups.filter((g) => g.planId === plan.id).length} leaders`)}><Send size={12} /> Send this week&apos;s guide</SmallButton>} />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3">
            <Panel title="Weekly readings">
              <ol className="flex flex-col gap-1.5 text-[0.8rem]">
                {plan.readings.map((r, i) => <li key={r} className="flex gap-3"><span className="font-mono text-mist w-14 shrink-0">Week {i + 1}</span><span className="text-ink">{r}</span></li>)}
              </ol>
            </Panel>
            <Panel title="Groups on this plan">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {groups.filter((g) => g.planId === plan.id).map((g) => {
                  const finished = g.planWeek >= plan.readings.length;
                  return (
                    <li key={g.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <button type="button" onClick={() => app.open("group", g.id, g.name)} className="flex-1 min-w-[9rem] text-left cursor-pointer">
                        <span className="block text-[0.8rem] text-ink hover:text-gold-bright">{g.name}</span>
                        <span className="block text-[0.68rem] text-mist">{g.planWeek} of {plan.readings.length} weeks done</span>
                      </button>
                      <Meter value={g.planWeek} max={plan.readings.length} className="w-24" />
                      {finished ? <Status tone="good">Finished</Status> : <SmallButton onClick={() => { updateGroup(g.id, (x) => ({ planWeek: x.planWeek + 1 })); app.notify(`${g.name} finished ${plan.readings[g.planWeek]}`); }}>Mark week done</SmallButton>}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "messages" && (
        <>
          <ScreenHeader title="Messages" subtitle="Announcements to group leaders" action={<PrimaryButton onClick={() => setModal("announce")}><Megaphone size={14} /> New announcement</PrimaryButton>} />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {messages.map((m) => (
              <li key={m.id} className="px-3.5 py-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[0.8rem] font-medium text-ink">{m.to}</span>
                  <span className="flex items-center gap-3"><Status tone={m.read === m.total ? "good" : m.read === 0 ? "muted" : "warn"}>{m.read} of {m.total} read</Status><span className="font-mono text-[0.68rem] text-mist">{m.sent}</span></span>
                </div>
                <p className="text-[0.78rem] text-ink-soft">{m.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <ProtoModal open={modal === "checkin"} title={`Leader check-in · ${ciGroup.name}`} onClose={close} footer={<PrimaryButton onClick={submitCheckin}><Send size={14} /> Send check-in</PrimaryButton>}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.8rem] text-ink">People who came</span>
          <span className="flex items-center gap-2">
            <SmallButton onClick={() => setCi({ ...ci, count: Math.max(0, ci.count - 1) })} disabled={ci.count === 0}><Minus size={12} /><span className="sr-only">One fewer</span></SmallButton>
            <span className="font-mono w-14 text-center tabular-nums text-ink" aria-live="polite">{ci.count} of {ciGroup.members.length + ciGroup.joined.length}</span>
            <SmallButton onClick={() => setCi({ ...ci, count: Math.min(ciGroup.members.length + ciGroup.joined.length, ci.count + 1) })} disabled={ci.count >= ciGroup.members.length + ciGroup.joined.length}><Plus size={12} /><span className="sr-only">One more</span></SmallButton>
          </span>
        </div>
        <Field label="Anyone needing follow-up">
          <select value={ci.followUp} onChange={(e) => setCi({ ...ci, followUp: e.target.value })} className={inputClass}>
            <option value="">No one this week</option>
            {[...ciGroup.members, ...ciGroup.joined].map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Note for Pastor Joel">
          <textarea value={ci.note} onChange={(e) => setCi({ ...ci, note: e.target.value })} placeholder="How did the group go?" className={cn(inputClass, "h-20 py-2 resize-none")} />
        </Field>
        <p className="text-[0.72rem] text-mist">Health now {health(ciGroup).score}. This updates attendance and the score.</p>
      </ProtoModal>

      <ProtoModal open={modal === "announce"} title="New announcement" onClose={close} footer={<PrimaryButton onClick={sendAnnouncement} disabled={!announce.body.trim()}><Send size={14} /> Send to {audience.total} {audience.total === 1 ? "leader" : "leaders"}</PrimaryButton>}>
        <Field label="To">
          <select value={announce.to} onChange={(e) => setAnnounce({ ...announce, to: e.target.value })} className={inputClass}>
            {audiences.map((a) => <option key={a.id} value={a.id}>{a.label}{a.total > 1 ? ` (${a.total})` : ""}</option>)}
          </select>
        </Field>
        <Field label="Message">
          <textarea value={announce.body} onChange={(e) => setAnnounce({ ...announce, body: e.target.value })} placeholder="Week 6 guide is ready. Please read before Sunday." className={cn(inputClass, "h-24 py-2 resize-none")} />
        </Field>
        <label className="flex items-center justify-between gap-3 text-[0.8rem] text-ink cursor-pointer">
          Also send by SMS
          <input type="checkbox" checked={announce.sms} onChange={(e) => setAnnounce({ ...announce, sms: e.target.checked })} className="accent-[var(--color-gold)] w-4 h-4" />
        </label>
      </ProtoModal>

      <ProtoModal open={modal === "seeker"} title="Add person to group finder" onClose={close} footer={<PrimaryButton onClick={addSeeker} disabled={!seekerDraft.name.trim()}>Add to waiting list</PrimaryButton>}>
        <Field label="Full name">
          <input value={seekerDraft.name} onChange={(e) => setSeekerDraft({ ...seekerDraft, name: e.target.value })} placeholder="Maria Santos" className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Area">
            <select value={seekerDraft.area} onChange={(e) => setSeekerDraft({ ...seekerDraft, area: e.target.value })} className={inputClass}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select>
          </Field>
          <Field label="Preferred day">
            <select value={seekerDraft.day} onChange={(e) => setSeekerDraft({ ...seekerDraft, day: e.target.value as Day })} className={inputClass}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
          </Field>
        </div>
        <Field label="Life stage">
          <select value={seekerDraft.stage} onChange={(e) => setSeekerDraft({ ...seekerDraft, stage: e.target.value })} className={inputClass}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <p className="text-[0.72rem] text-mist">Best match now: {bestFor(draftSeeker).name}. {matchReason(draftSeeker, bestFor(draftSeeker))}.</p>
      </ProtoModal>
    </ProtoApp>
  );
}
