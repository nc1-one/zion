"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, CalendarDays, ChevronDown, ChevronUp, Layers, Library, PenLine, Plus, RefreshCw, Search, Send, Sparkles, Trash2 } from "lucide-react";
import { Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

type Tab = "outline" | "slides" | "handout" | "guide";
type SermonStatus = "Planned" | "Draft" | "Ready" | "Preached";

interface Point { id: string; text: string; notes: string }
interface Question { id: string; text: string }
interface Sermon { id: string; seriesId: string; date: string; passage: string; title: string; preacher: string; bigIdea: string; points: Point[]; status: SermonStatus; topics: string[]; summary: string; questions: Question[] }
interface Series { id: string; title: string; book: string; notes: string }
interface Sent { id: string; date: string; sermonId: string; what: string; to: string }

const TODAY = "2026-10-28";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}${y === 2026 ? "" : `, ${y}`}`;
};
const SUNDAYS = ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30", "2026-12-07", "2026-12-14", "2026-12-21"];
const PREACHERS = ["Pastor Dan", "Pastor Joel", "Rina Navarro", "Mark Santos"];
const BOOKS = ["James", "Nehemiah", "Mark", "Philippians", "Colossians", "Ruth", "Psalms", "Isaiah"];
const lower = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

let seq = 0;
const pts = (list: (string | [string, string])[]): Point[] => list.map((x) => ({ id: `pt${++seq}`, text: typeof x === "string" ? x : x[0], notes: typeof x === "string" ? "" : x[1] }));
const mk = (id: string, seriesId: string, date: string, passage: string, title: string, preacher: string, topics: string, bigIdea = "", points: (string | [string, string])[] = []): Sermon => ({
  id, seriesId, date, passage, title, preacher, bigIdea, points: pts(points), topics: topics.split(", "), summary: "", questions: [],
  status: date < TODAY ? "Preached" : points.length ? "Draft" : "Planned",
});

const SERIES: Series[] = [
  { id: "phil", title: "Unshaken: Philippians", book: "Philippians", notes: "Theme: joy that does not depend on circumstances. Key verse 4:11–13. Keep illustrations local: traffic, floods, OFW families. Each week ends with one practice for the week." },
  { id: "advent", title: "Advent: The Long Wait", book: "Isaiah", notes: "Four Sundays. Christmas Eve service is planned separately. Kids choir sings on Dec 21." },
  { id: "col", title: "Rooted: Colossians", book: "Colossians", notes: "Five weeks on who Jesus is and how that shapes home and work." },
  { id: "psalms", title: "Psalms for hard weeks", book: "Psalms", notes: "Preached after the July floods in Marikina and Quezon City." },
  { id: "ruth", title: "Ordinary Faith: Ruth", book: "Ruth", notes: "Three weeks. God at work in ordinary loyalty and kindness." },
];

const SERMONS: Sermon[] = [
  mk("u1", "phil", "2026-10-12", "Philippians 1:1–11", "Joy that starts with thanks", "Pastor Dan", "joy, gratitude, prayer", "Gratitude for people comes before joy in circumstances.", ["Paul thanks God for people", "Joy grows from partnership", "Pray for love that grows in knowledge"]),
  mk("u2", "phil", "2026-10-19", "Philippians 1:12–30", "When plans fall apart", "Pastor Dan", "suffering, purpose, work", "God uses detours to move the gospel forward.", ["Prison opened doors", "Rivals still preached Christ", "To live is Christ"]),
  mk("u3", "phil", "2026-10-26", "Philippians 2:1–11", "The mind of Christ", "Pastor Joel", "humility, unity, Jesus", "Humility is choosing others the way Jesus chose us.", ["Same love, same mind", "Count others more significant", "Jesus emptied himself"]),
  mk("u4", "phil", "2026-11-02", "Philippians 2:12–30", "Working out what God works in", "Pastor Dan", "obedience, grace, work", "Obedience is our part of a work God already started.", [
    ["God is already at work in you", "Verse 13. Open with the jeepney driver story from Tuesday."],
    ["Do everything without grumbling", "Verse 14. Where do we complain most? Traffic, work, the family group chat."],
    ["Shine where you already are", "Verse 15. Timothy and Epaphroditus as ordinary examples."],
  ]),
  mk("u5", "phil", "2026-11-09", "Philippians 3:1–14", "Counting it loss", "Pastor Joel", "identity, ambition"),
  mk("u6", "phil", "2026-11-16", "Philippians 4:1–23", "Content in every season", "", "contentment, giving, peace"),
  mk("a1", "advent", "2026-11-30", "Isaiah 9:1–7", "A light for those in darkness", "", "advent, hope"),
  mk("a2", "advent", "2026-12-07", "Isaiah 40:1–11", "Comfort, my people", "Pastor Joel", "advent, comfort"),
  mk("c1", "col", "2026-08-31", "Colossians 1:1–14", "Fruit that grows slowly", "Pastor Dan", "growth, prayer", "Real growth is slow, steady, and from God.", ["The gospel bears fruit", "Pray for knowledge that leads to walking", "Strength to endure with joy"]),
  mk("c2", "col", "2026-09-07", "Colossians 1:15–23", "Firstborn over all", "Pastor Joel", "Jesus, creation, reconciliation", "Jesus holds everything together, including you.", ["Jesus over creation", "Jesus over the church", "Jesus over your past"]),
  mk("c3", "col", "2026-09-14", "Colossians 2:6–15", "Rooted and built up", "Pastor Dan", "faith, false teaching", "You do not need more than Christ. You need more of Christ.", ["Walk the way you received him", "Watch out for empty philosophy", "The record against us is cancelled"]),
  mk("c4", "col", "2026-09-21", "Colossians 3:1–17", "Set your hearts above", "Rina Navarro", "holiness, family, forgiveness", "A new life shows up in old places.", ["Seek the things above", "Put off the old self", "Put on love"]),
  mk("c5", "col", "2026-09-28", "Colossians 3:18–4:6", "Grace at home and at work", "Pastor Dan", "family, work, OFW", "Every relationship is a place to serve the Lord.", ["Homes shaped by love", "Work done for the Lord", "Speech seasoned with salt"]),
  mk("s1", "psalms", "2025-07-27", "Psalm 46", "Our refuge when the water rises", "Pastor Dan", "floods, fear, comfort", "God is our refuge before, during, and after the storm.", ["God is present in the flood", "Be still and know", "The Lord is with us"]),
  mk("s2", "psalms", "2025-08-03", "Psalm 23", "The shepherd in the dark valley", "Mark Santos", "comfort, youth, fear", "The shepherd walks with us through the valley.", ["The Lord leads", "The Lord walks with us", "The Lord prepares a table"]),
  mk("r1", "ruth", "2025-06-08", "Ruth 1", "Staying when it is easier to leave", "Pastor Dan", "loyalty, grief", "God is present in our bitter seasons.", ["Naomi loses everything", "Ruth chooses to stay", "Bitter is not the end"]),
  mk("r2", "ruth", "2025-06-15", "Ruth 2", "Gleaning in hard seasons", "Rina Navarro", "provision, work, kindness", "God provides through ordinary kindness.", ["Ruth works the edges", "Boaz notices", "Kindness beyond the law"]),
  mk("r3", "ruth", "2025-06-22", "Ruth 3–4", "The kinsman redeemer", "Pastor Joel", "redemption, family", "Jesus is the redeemer we could never pay for.", ["A risky request", "A redeemer who pays", "A family line that leads to David"]),
];

const SENT: Sent[] = [
  { id: "x1", date: "Oct 24", sermonId: "u3", what: "Slides", to: "Media team" },
  { id: "x2", date: "Oct 25", sermonId: "u3", what: "Handout", to: "Print team" },
  { id: "x3", date: "Oct 26", sermonId: "u3", what: "Group guide", to: "Life group leaders" },
];

const OUTPUTS = [
  { id: "slides", label: "Slides", to: "Media team" },
  { id: "handout", label: "Handout", to: "Print team" },
  { id: "guide", label: "Group guide", to: "Life group leaders" },
] as const;

const slidesFor = (s: Sermon, series?: Series) => [
  { id: "title", kicker: series?.title ?? "Grace Fellowship", text: s.title || "Untitled sermon", sub: s.preacher },
  { id: "read", kicker: "Read with us", text: s.passage },
  { id: "idea", kicker: "Big idea", text: s.bigIdea || "Add a big idea in the outline" },
  ...s.points.map((p, i) => ({ id: p.id, kicker: `Point ${i + 1}`, text: p.text || "Untitled point" })),
  { id: "close", kicker: "Respond", text: "What is one step you will take this week?" },
];

const blank = (text: string) => {
  const w = text.trim().split(" ");
  return w.length > 2 ? `${w.slice(0, -1).join(" ")} ________` : text;
};

function questionsFor(s: Sermon, round: number): Question[] {
  const p = s.points.map((x) => x.text).filter(Boolean);
  const sets = [
    [
      `Read ${s.passage} out loud together. What word or phrase stands out to you?`,
      s.bigIdea ? `The big idea: "${s.bigIdea}" Where is that hard to believe this week?` : "What does this passage show us about God?",
      ...p.slice(0, 2).map((x) => `"${x}." What would that look like at home or at work?`),
      "What is one step you will take before we meet again? Who will check on you?",
    ],
    [
      `What did you notice in ${s.passage} that you had not seen before?`,
      ...p.slice(0, 3).map((x, i) => (i === 0 ? `Talk about "${x}." When have you seen this in your own life?` : `Which is harder for you right now: "${x}" or the point before it? Why?`)),
      "How can this group pray for each other this week?",
    ],
  ];
  return sets[round % 2].map((text, i) => ({ id: `${s.id}-q${round}-${i}`, text }));
}

function summaryFor(s: Sermon, round: number) {
  const p = s.points.map((x) => x.text).filter(Boolean);
  const text =
    round % 2 === 0
      ? `${s.title}, from ${s.passage}. ${s.bigIdea} The message moves through ${p.length} points: ${p.join("; ")}.`
      : `This week we read ${s.passage}. The main idea: ${s.bigIdea} Groups can start with "${p[0] ?? s.title}" and spend most of the time on application.`;
  return text.replace(/\s+/g, " ");
}

function SermonState({ s }: { s: Sermon }) {
  if (s.status !== "Preached" && !s.preacher) return <Status tone="bad">No preacher</Status>;
  const tone = { Planned: "muted", Draft: "warn", Ready: "good", Preached: "muted" } as const;
  return <Status tone={tone[s.status]}>{s.status === "Planned" ? "Not started" : s.status}</Status>;
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-rule text-graphite hover:text-gold-bright hover:border-gold disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors">
      {children}
    </button>
  );
}

const AiLabel = () => (
  <span className="flex items-center gap-1 text-[0.68rem] text-mist">
    <Sparkles size={11} /> AI draft · review before sending
  </span>
);

export function SermonMakerPrototype() {
  const app = useProtoApp("week");
  const [sermons, setSermons] = useState(SERMONS);
  const [series, setSeries] = useState(SERIES);
  const [sent, setSent] = useState(SENT);
  const [tab, setTab] = useState<Tab>("outline");
  const [blanks, setBlanks] = useState(true);
  const [drafting, setDrafting] = useState<{ id: string; what: "summary" | "questions" } | null>(null);
  const [rounds, setRounds] = useState<Record<string, number>>({});
  const [focusId, setFocusId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [book, setBook] = useState<"All" | "Philippians" | "Colossians" | "Ruth" | "Psalms">("All");
  const [exportId, setExportId] = useState("u4");
  const [outputs, setOutputs] = useState({ slides: true, handout: true, guide: true });
  const [slideFormat, setSlideFormat] = useState("PowerPoint");
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [sundayOpen, setSundayOpen] = useState(false);
  const [seriesDraft, setSeriesDraft] = useState({ title: "", book: "James", start: "2026-11-23", weeks: "4" });
  const [sundayDraft, setSundayDraft] = useState({ date: "", seriesId: "phil", title: "", passage: "", preacher: "" });

  const sorted = [...sermons].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((s) => s.date >= TODAY);
  const preached = sorted.filter((s) => s.date < TODAY).reverse();
  const next = upcoming[0];
  const openSundays = SUNDAYS.filter((d) => !sermons.some((s) => s.date === d));
  const unassigned = upcoming.filter((s) => !s.preacher);
  const seriesOf = (s: Sermon) => series.find((x) => x.id === s.seriesId);
  const inSeries = (id: string) => sorted.filter((s) => s.seriesId === id);

  const update = (id: string, fn: (s: Sermon) => Sermon) => setSermons((l) => l.map((s) => (s.id === id ? fn(s) : s)));
  const setPoints = (id: string, fn: (p: Point[]) => Point[]) => update(id, (s) => ({ ...s, points: fn(s.points), status: s.status === "Planned" ? "Draft" : s.status }));
  const openSermon = (s: Sermon, to: Tab = "outline") => {
    setTab(to);
    setFocusId(null);
    app.open("sermon", s.id, s.title || "Untitled sermon");
  };

  const checks = (s: Sermon) => [
    { label: "Big idea written", ok: !!s.bigIdea.trim() },
    { label: "Outline has 3 or more points", ok: s.points.length >= 3 },
    { label: `Slides built from the outline (${slidesFor(s).length})`, ok: s.points.length > 0 },
    { label: "Handout built from the outline", ok: s.points.length > 0 },
    { label: "Group guide questions reviewed", ok: s.questions.length > 0 },
    { label: "Sent to the teams", ok: sent.some((x) => x.sermonId === s.id) },
  ];

  const draft = (s: Sermon, what: "summary" | "questions") => {
    const key = `${s.id}-${what}`;
    const round = rounds[key] ?? 0;
    setDrafting({ id: s.id, what });
    window.setTimeout(() => {
      update(s.id, (x) => (what === "summary" ? { ...x, summary: summaryFor(x, round) } : { ...x, questions: questionsFor(x, round) }));
      setRounds((r) => ({ ...r, [key]: round + 1 }));
      setDrafting(null);
    }, 850);
  };

  const assign = (s: Sermon, preacher: string) => {
    update(s.id, (x) => ({ ...x, preacher }));
    app.notify(preacher ? `${preacher} is preaching ${fmt(s.date)}. Calendar invite sent.` : `${fmt(s.date)} has no preacher now`);
  };

  const openAddSunday = (seriesId = series[0].id, date = openSundays[0] ?? "") => {
    setSundayDraft({ date, seriesId, title: "", passage: "", preacher: "" });
    setSundayOpen(true);
  };

  const addSunday = () => {
    const d = sundayDraft;
    if (!d.date || !d.title.trim()) return;
    const bk = series.find((x) => x.id === d.seriesId)?.book ?? "";
    setSermons((l) => [...l, { id: `s${Date.now()}`, seriesId: d.seriesId, date: d.date, passage: d.passage.trim() || bk, title: d.title.trim(), preacher: d.preacher, bigIdea: "", points: [], status: "Planned", topics: [], summary: "", questions: [] }]);
    setSundayOpen(false);
    app.notify(`${fmt(d.date)} planned: ${d.title.trim()}${d.preacher ? ` with ${d.preacher}` : ""}`);
  };

  const addSeries = () => {
    const d = seriesDraft;
    const title = d.title.trim();
    if (!title) return;
    const id = `sr${Date.now()}`;
    const dates = openSundays.filter((x) => x >= d.start).slice(0, Number(d.weeks));
    setSeries((l) => [...l, { id, title, book: d.book, notes: "" }]);
    setSermons((l) => [...l, ...dates.map((date, i): Sermon => ({ id: `${id}-${i}`, seriesId: id, date, passage: d.book, title: `Week ${i + 1}`, preacher: "", bigIdea: "", points: [], status: "Planned", topics: [], summary: "", questions: [] }))]);
    setSeriesOpen(false);
    setSeriesDraft({ title: "", book: "James", start: "2026-11-23", weeks: "4" });
    app.notify(`${title} created${dates.length ? ` on ${dates.length} open ${dates.length === 1 ? "Sunday" : "Sundays"}` : ""}`);
    app.open("series-detail", id, title);
  };

  const cur = app.screen === "sermon" ? sermons.find((s) => s.id === app.id) : undefined;
  const sr = app.screen === "series-detail" ? series.find((s) => s.id === app.id) : undefined;
  const ex = sermons.find((s) => s.id === exportId) ?? next;
  const exportChoices = [...upcoming, ...preached.slice(0, 3)];
  if (!exportChoices.includes(ex)) exportChoices.push(ex);
  const picked = OUTPUTS.filter((o) => outputs[o.id] && (o.id !== "guide" || ex.questions.length > 0));
  const libRows = preached.filter((s) => {
    const norm = (v: string) => v.toLowerCase().replace(/–/g, "-");
    const hay = norm(`${s.title} ${s.passage} ${s.topics.join(" ")}`);
    return (book === "All" || seriesOf(s)?.book === book) && hay.includes(norm(query.trim()));
  });

  const send = () => {
    if (!picked.length) return;
    setSent((l) => [...picked.map((o, i) => ({ id: `x${Date.now()}-${i}`, date: "Today", sermonId: ex.id, what: o.label, to: o.to })), ...l]);
    const [lead, ...rest] = picked;
    const label = lead.id === "slides" ? `Slides (${slideFormat})` : lead.label;
    app.notify(`${label} sent to the ${lower(lead.to)}.${rest.length ? ` ${cap(rest.map((o) => lower(o.label)).join(" and "))} sent too.` : ""}`);
  };

  const nav = [
    { id: "week", label: "This Sunday", icon: CalendarCheck },
    { id: "series", label: "Series", icon: Layers },
    { id: "plan", label: "Plan", icon: CalendarDays, badge: openSundays.length + unassigned.length },
    { id: "library", label: "Library", icon: Library },
    { id: "export", label: "Export", icon: Send },
  ];

  const nextChecks = checks(next);
  const nextDone = nextChecks.filter((c) => c.ok).length;
  const nextWeek = inSeries(next.seriesId);

  return (
    <ProtoApp app={app} name="Sermon Maker · Grace Fellowship" user="Pastor Dan Castillo" nav={nav} alerts={openSundays.length + unassigned.length}>
      {app.screen === "week" && (
        <>
          <ScreenHeader title="This Sunday" subtitle={`${fmt(next.date)} · ${next.preacher || "No preacher yet"} · ${seriesOf(next)?.title ?? ""}`} action={<PrimaryButton onClick={() => openSermon(next)}><PenLine size={14} /> Open editor</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Series" value={`Week ${nextWeek.findIndex((s) => s.id === next.id) + 1} of ${nextWeek.length}`} sub={seriesOf(next)?.title} />
            <Stat label="Ready for Sunday" value={`${nextDone}/${nextChecks.length}`} sub="Slides due Friday, 6 PM" tone={nextDone === nextChecks.length ? "good" : undefined} />
            <Stat label="Open Sundays" value={String(openSundays.length)} sub="Next 8 weeks" tone={openSundays.length ? "bad" : "good"} />
            <Stat label="Library" value={String(preached.length)} sub="Past sermons, searchable" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
            <Panel title={next.title}>
              <div className="text-[0.75rem] text-mist">{next.passage}</div>
              {next.bigIdea && <p className="mt-2 border-l-2 border-gold pl-2.5 text-[0.85rem] text-ink">{next.bigIdea}</p>}
              <ol className="mt-3 flex flex-col gap-1.5 text-[0.8rem] text-ink-soft">
                {next.points.map((p, i) => <li key={p.id}><span className="font-mono text-gold-bright mr-2">{i + 1}</span>{p.text}</li>)}
                {next.points.length === 0 && <li className="text-graphite">No outline yet.</li>}
              </ol>
              <div className="flex flex-wrap gap-2 mt-4">
                <SmallButton onClick={() => openSermon(next, "outline")}>Edit outline</SmallButton>
                <SmallButton onClick={() => openSermon(next, "slides")}>Preview slides</SmallButton>
                <SmallButton onClick={() => openSermon(next, "handout")}>Preview handout</SmallButton>
                <SmallButton onClick={() => openSermon(next, "guide")}>Group guide</SmallButton>
              </div>
            </Panel>
            <Panel title="Ready by Friday">
              <Meter value={nextDone} max={nextChecks.length} className="mb-3" />
              <ul className="flex flex-col gap-2">
                {nextChecks.map((c) => <li key={c.label}><Status tone={c.ok ? "good" : "warn"}>{c.label}</Status></li>)}
              </ul>
              <p className="text-[0.68rem] text-mist mt-3">Slides to media by Friday 6 PM. Handout to print by Saturday 10 AM.</p>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "series" && (
        <>
          <ScreenHeader title="Series" subtitle="One workspace per series: notes, outlines, and every Sunday in it" action={<PrimaryButton onClick={() => setSeriesOpen(true)}><Plus size={14} /> New series</PrimaryButton>} />
          <Table
            rows={series}
            rowKey={(s) => s.id}
            onRowClick={(s) => app.open("series-detail", s.id, s.title)}
            columns={[
              { key: "title", label: "Series", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.book}</span></span> },
              { key: "count", label: "Sundays", hideOnMobile: true, render: (s) => inSeries(s.id).length },
              {
                key: "progress",
                label: "Preached",
                render: (s) => {
                  const list = inSeries(s.id);
                  const done = list.filter((x) => x.status === "Preached").length;
                  return <span className="flex items-center gap-2"><Meter value={done} max={Math.max(1, list.length)} className="w-16" /><span className="font-mono text-[0.7rem]">{done}/{list.length}</span></span>;
                },
              },
              {
                key: "state",
                label: "Status",
                render: (s) => {
                  const list = inSeries(s.id);
                  const done = list.filter((x) => x.status === "Preached").length;
                  return list.length && done === list.length ? <Status tone="muted">Complete</Status> : done ? <Status tone="good">Current</Status> : <Status tone="warn">Planning</Status>;
                },
              },
            ]}
          />
        </>
      )}

      {app.screen === "series-detail" && sr && (
        <>
          <ScreenHeader
            title={sr.title}
            subtitle={`${sr.book} · ${inSeries(sr.id).length} Sundays${inSeries(sr.id).length ? ` · ${fmt(inSeries(sr.id)[0].date)} to ${fmt(inSeries(sr.id)[inSeries(sr.id).length - 1].date)}` : ""}`}
            action={<SmallButton onClick={() => openAddSunday(sr.id)} disabled={!openSundays.length}><Plus size={12} /> Add Sunday</SmallButton>}
          />
          <Panel title="Series notes" className="mb-3" action={<SmallButton disabled={notesDraft[sr.id] === undefined || notesDraft[sr.id] === sr.notes} onClick={() => {
            setSeries((l) => l.map((x) => (x.id === sr.id ? { ...x, notes: notesDraft[sr.id] ?? x.notes } : x)));
            setNotesDraft((n) => {
              const copy = { ...n };
              delete copy[sr.id];
              return copy;
            });
            app.notify("Series notes saved for everyone preaching in it");
          }}>Save notes</SmallButton>}>
            <textarea aria-label="Series notes" value={notesDraft[sr.id] ?? sr.notes} onChange={(e) => setNotesDraft((n) => ({ ...n, [sr.id]: e.target.value }))} rows={3} placeholder="Theme, key verse, illustrations to reuse" className={cn(inputClass, "h-auto py-2 resize-none")} />
          </Panel>
          <Table
            rows={inSeries(sr.id)}
            rowKey={(s) => s.id}
            onRowClick={(s) => openSermon(s)}
            empty="No Sundays yet. Add one to start."
            columns={[
              { key: "date", label: "Sunday", render: (s) => <span className="font-mono text-[0.75rem]">{fmt(s.date)}</span> },
              { key: "title", label: "Sermon", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.passage}</span></span> },
              { key: "who", label: "Preacher", hideOnMobile: true, render: (s) => s.preacher || "Unassigned" },
              { key: "state", label: "Status", render: (s) => <SermonState s={s} /> },
            ]}
          />
        </>
      )}

      {app.screen === "sermon" && cur && (
        <>
          <ScreenHeader
            title={cur.title || "Untitled sermon"}
            subtitle={`${cur.passage} · ${fmt(cur.date)} · ${cur.preacher || "No preacher yet"}`}
            action={
              <>
                {cur.status === "Draft" && <PrimaryButton disabled={!cur.bigIdea.trim() || !cur.points.length} onClick={() => { update(cur.id, (s) => ({ ...s, status: "Ready" })); app.notify("Marked ready. The media team can see the slides."); }}>Mark ready</PrimaryButton>}
                {cur.status === "Ready" && <SmallButton onClick={() => update(cur.id, (s) => ({ ...s, status: "Draft" }))}>Back to draft</SmallButton>}
                <SmallButton onClick={() => { setExportId(cur.id); app.section("export"); }}><Send size={12} /> Export</SmallButton>
              </>
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <Segmented id="sm-tab" value={tab} onChange={setTab} options={[{ id: "outline", label: "Outline" }, { id: "slides", label: "Slides" }, { id: "handout", label: "Handout" }, { id: "guide", label: "Group guide" }]} />
            <SermonState s={cur} />
          </div>

          {tab === "outline" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <Field label="Title">
                  <input value={cur.title} onChange={(e) => update(cur.id, (s) => ({ ...s, title: e.target.value }))} className={inputClass} />
                </Field>
                <Field label="Passage">
                  <input value={cur.passage} onChange={(e) => update(cur.id, (s) => ({ ...s, passage: e.target.value }))} className={inputClass} />
                </Field>
              </div>
              <div className="mb-3">
                <Field label="Big idea">
                  <textarea value={cur.bigIdea} onChange={(e) => update(cur.id, (s) => ({ ...s, bigIdea: e.target.value }))} rows={2} placeholder="One sentence people can repeat on Monday" className={cn(inputClass, "h-auto py-2 resize-none")} />
                </Field>
              </div>
              <Panel title={`Outline · ${cur.points.length} points`} action={<SmallButton onClick={() => { const id = `pt${Date.now()}`; setPoints(cur.id, (p) => [...p, { id, text: "", notes: "" }]); setFocusId(id); }}><Plus size={12} /> Add point</SmallButton>}>
                <ol className="flex flex-col divide-y divide-rule-soft -my-2">
                  {cur.points.map((pt, i) => (
                    <motion.li layout key={pt.id} className="flex gap-2.5 py-2.5">
                      <span className="w-4 pt-2 font-mono text-[0.75rem] text-gold-bright">{i + 1}</span>
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <input autoFocus={pt.id === focusId} aria-label={`Point ${i + 1}`} value={pt.text} placeholder="Main point" onChange={(e) => setPoints(cur.id, (l) => l.map((x) => (x.id === pt.id ? { ...x, text: e.target.value } : x)))} className={inputClass} />
                        <textarea aria-label={`Notes for point ${i + 1}`} value={pt.notes} rows={2} placeholder="Notes, illustration, cross references" onChange={(e) => setPoints(cur.id, (l) => l.map((x) => (x.id === pt.id ? { ...x, notes: e.target.value } : x)))} className={cn(inputClass, "h-auto py-2 resize-none text-[0.78rem]")} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <IconButton label={`Move point ${i + 1} up`} disabled={i === 0} onClick={() => setPoints(cur.id, (l) => l.map((x, j) => (j === i - 1 ? l[i] : j === i ? l[i - 1] : x)))}><ChevronUp size={14} /></IconButton>
                        <IconButton label={`Move point ${i + 1} down`} disabled={i === cur.points.length - 1} onClick={() => setPoints(cur.id, (l) => l.map((x, j) => (j === i ? l[i + 1] : j === i + 1 ? l[i] : x)))}><ChevronDown size={14} /></IconButton>
                        <IconButton label={`Remove point ${i + 1}`} onClick={() => { setPoints(cur.id, (l) => l.filter((x) => x.id !== pt.id)); app.notify(`Point ${i + 1} removed`); }}><Trash2 size={13} /></IconButton>
                      </div>
                    </motion.li>
                  ))}
                </ol>
                {cur.points.length === 0 && <p className="text-[0.78rem] text-graphite">No points yet. Add the first one and the slides, handout, and guide build from it.</p>}
              </Panel>
            </>
          )}

          {tab === "slides" && (
            <>
              <p className="text-[0.72rem] text-mist mb-2.5">{slidesFor(cur).length} slides, built from the outline. Change a point and its slide follows.</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {slidesFor(cur, seriesOf(cur)).map((sl, i) => (
                  <motion.div layout key={sl.id} className="relative aspect-video rounded-md border border-rule bg-night p-3 flex flex-col justify-center">
                    <span className="absolute top-1.5 right-2 font-mono text-[0.58rem] text-mist">{i + 1}</span>
                    <span className="text-[0.62rem] font-medium text-gold">{sl.kicker}</span>
                    <span className="font-display text-[1rem] leading-tight font-semibold text-ink mt-1 line-clamp-3">{sl.text}</span>
                    {"sub" in sl && sl.sub && <span className="text-[0.62rem] text-graphite mt-1">{sl.sub}</span>}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {tab === "handout" && (
            <>
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <p className="text-[0.72rem] text-mist">A5 handout, built from the outline.</p>
                <label className="flex items-center gap-2 text-[0.75rem] text-ink-soft cursor-pointer">
                  <input type="checkbox" checked={blanks} onChange={(e) => setBlanks(e.target.checked)} className="accent-gold w-3.5 h-3.5" /> Fill-in blanks
                </label>
              </div>
              <article className="mx-auto max-w-[26rem] rounded-md bg-ink text-night p-5">
                <div className="flex justify-between text-[0.62rem] text-night/60"><span>Grace Fellowship</span><span>{fmt(cur.date)}</span></div>
                <h5 className="font-display text-[1.35rem] leading-tight font-semibold mt-2">{cur.title || "Untitled sermon"}</h5>
                <div className="text-[0.72rem] mt-0.5">{cur.passage}{cur.preacher ? ` · ${cur.preacher}` : ""}</div>
                {cur.bigIdea && <p className="mt-3 border-l-2 border-gold-deep pl-2.5 text-[0.78rem] italic">{cur.bigIdea}</p>}
                <ol className="mt-3 flex flex-col gap-3 text-[0.8rem]">
                  {cur.points.map((pt, i) => (
                    <li key={pt.id}>
                      <span className="font-semibold">{i + 1}. {blanks ? blank(pt.text) : pt.text}</span>
                      <div className="mt-3 h-px bg-night/20" />
                      <div className="mt-3 h-px bg-night/20" />
                    </li>
                  ))}
                </ol>
                <div className="mt-4 text-[0.66rem] text-night/60">{cur.questions.length ? `${cur.questions.length} group questions on the back` : "Group questions print on the back once drafted"}</div>
              </article>
            </>
          )}

          {tab === "guide" && (
            <>
              <p className="text-[0.72rem] text-mist mb-2.5">The sermon is yours. AI only drafts the summary and questions from your outline.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Panel title="Summary" action={cur.summary ? <AiLabel /> : undefined}>
                  {drafting?.id === cur.id && drafting.what === "summary" ? (
                    <p className="text-[0.78rem] text-graphite">Drafting from the outline…</p>
                  ) : cur.summary ? (
                    <textarea aria-label="Summary" value={cur.summary} onChange={(e) => update(cur.id, (s) => ({ ...s, summary: e.target.value }))} rows={5} className={cn(inputClass, "h-auto py-2 resize-none")} />
                  ) : (
                    <p className="text-[0.78rem] text-graphite">No summary yet.</p>
                  )}
                  <div className="mt-2.5">
                    <SmallButton onClick={() => draft(cur, "summary")} disabled={!!drafting || !cur.points.length}><RefreshCw size={12} /> {cur.summary ? "Redraft" : "Draft summary"}</SmallButton>
                  </div>
                </Panel>
                <Panel title={`Discussion questions · ${cur.questions.length}`} action={cur.questions.length ? <AiLabel /> : undefined}>
                  {drafting?.id === cur.id && drafting.what === "questions" ? (
                    <p className="text-[0.78rem] text-graphite">Drafting questions from the outline…</p>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {cur.questions.map((q, i) => (
                        <li key={q.id} className="flex gap-2 items-start">
                          <span className="w-4 pt-2 font-mono text-[0.72rem] text-gold-bright">{i + 1}</span>
                          <textarea aria-label={`Question ${i + 1}`} value={q.text} rows={2} onChange={(e) => update(cur.id, (s) => ({ ...s, questions: s.questions.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)) }))} className={cn(inputClass, "h-auto py-1.5 resize-none text-[0.78rem]")} />
                          <IconButton label={`Remove question ${i + 1}`} onClick={() => update(cur.id, (s) => ({ ...s, questions: s.questions.filter((x) => x.id !== q.id) }))}><Trash2 size={13} /></IconButton>
                        </li>
                      ))}
                      {cur.questions.length === 0 && <li className="text-[0.78rem] text-graphite">No questions yet.</li>}
                    </ol>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {cur.questions.length ? (
                      <>
                        <SmallButton onClick={() => draft(cur, "questions")} disabled={!!drafting}><RefreshCw size={12} /> Redraft</SmallButton>
                        <SmallButton onClick={() => update(cur.id, (s) => ({ ...s, questions: [...s.questions, { id: `q${Date.now()}`, text: "" }] }))}><Plus size={12} /> Add question</SmallButton>
                      </>
                    ) : (
                      <PrimaryButton onClick={() => draft(cur, "questions")} disabled={!!drafting || !cur.points.length}><Sparkles size={13} /> Draft questions</PrimaryButton>
                    )}
                  </div>
                </Panel>
              </div>
            </>
          )}
        </>
      )}

      {app.screen === "plan" && (
        <>
          <ScreenHeader title="Preaching plan" subtitle={`Next ${SUNDAYS.length} Sundays · ${openSundays.length} open · ${unassigned.length} without a preacher`} action={<PrimaryButton onClick={() => openAddSunday()} disabled={!openSundays.length}><Plus size={14} /> Add Sunday</PrimaryButton>} />
          <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
            {SUNDAYS.map((d) => {
              const s = sermons.find((x) => x.date === d);
              return (
                <li key={d} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                  <span className="w-12 font-mono text-[0.72rem] text-graphite">{fmt(d)}</span>
                  {s ? (
                    <>
                      <button type="button" onClick={() => openSermon(s)} className="group flex-1 min-w-[10rem] text-left cursor-pointer">
                        <span className="block text-[0.82rem] font-medium text-ink group-hover:text-gold-bright">{s.title || "Untitled sermon"}</span>
                        <span className="block text-[0.7rem] text-mist">{s.passage} · {seriesOf(s)?.title}</span>
                      </button>
                      <select aria-label={`Preacher for ${fmt(d)}`} value={s.preacher} onChange={(e) => assign(s, e.target.value)} className="h-8 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer">
                        <option value="">Unassigned</option>
                        {PREACHERS.map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <span className="w-24"><SermonState s={s} /></span>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[0.8rem] text-danger">Open Sunday</span>
                      <SmallButton onClick={() => openAddSunday(undefined, d)}>Plan this Sunday</SmallButton>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {app.screen === "library" && (
        <>
          <ScreenHeader title="Library" subtitle={`${preached.length} sermons preached · search by title, passage, or topic`} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
              <Search size={14} className="text-mist" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try floods, Ruth 2, or humility" aria-label="Search sermons" className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
            </label>
            <Segmented id="sm-book" value={book} onChange={setBook} options={(["All", "Philippians", "Colossians", "Ruth", "Psalms"] as const).map((b) => ({ id: b, label: b }))} />
          </div>
          <Table
            rows={libRows}
            rowKey={(s) => s.id}
            onRowClick={(s) => openSermon(s)}
            empty={query ? `No sermons match "${query}".` : "No sermons in this book yet."}
            columns={[
              { key: "date", label: "Preached", render: (s) => <span className="font-mono text-[0.72rem]">{fmt(s.date)}</span> },
              { key: "title", label: "Sermon", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.topics.join(", ")}</span></span> },
              { key: "passage", label: "Passage", hideOnMobile: true, render: (s) => s.passage },
              { key: "who", label: "Preacher", hideOnMobile: true, render: (s) => s.preacher },
            ]}
          />
        </>
      )}

      {app.screen === "export" && (
        <>
          <ScreenHeader title="Export" subtitle="One outline, three outputs, each to the team that needs it" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3">
            <Panel title="Send outputs">
              <Field label="Sermon">
                <select value={ex.id} onChange={(e) => setExportId(e.target.value)} className={inputClass}>
                  {exportChoices.map((s) => <option key={s.id} value={s.id}>{fmt(s.date)} · {s.title}</option>)}
                </select>
              </Field>
              <ul className="flex flex-col divide-y divide-rule-soft mt-2">
                {OUTPUTS.map((o) => {
                  const needs = o.id === "guide" && !ex.questions.length;
                  const detail = o.id === "slides" ? `${slidesFor(ex).length} slides, 16:9` : o.id === "handout" ? "A5, 180 copies" : needs ? "No questions yet" : `${ex.questions.length} questions, 14 groups via Messenger`;
                  return (
                    <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <input id={`sm-out-${o.id}`} type="checkbox" disabled={needs} checked={outputs[o.id] && !needs} onChange={(e) => setOutputs({ ...outputs, [o.id]: e.target.checked })} className="accent-gold w-4 h-4 cursor-pointer disabled:cursor-default" />
                      <label htmlFor={`sm-out-${o.id}`} className="flex-1 min-w-0 cursor-pointer">
                        <span className="block text-[0.82rem] font-medium text-ink">{o.label}</span>
                        <span className={cn("block text-[0.7rem]", needs ? "text-danger" : "text-mist")}>{o.to} · {detail}</span>
                      </label>
                      {o.id === "slides" && (
                        <select aria-label="Slide format" value={slideFormat} onChange={(e) => setSlideFormat(e.target.value)} className="h-8 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer">
                          {["PowerPoint", "PDF", "ProPresenter"].map((f) => <option key={f}>{f}</option>)}
                        </select>
                      )}
                      {needs && <SmallButton onClick={() => openSermon(ex, "guide")}>Draft questions</SmallButton>}
                    </li>
                  );
                })}
              </ul>
              {!ex.points.length && <div className="mt-2"><Status tone="bad">Outline is empty. Nothing to build yet.</Status></div>}
              <div className="flex justify-end mt-3">
                <PrimaryButton onClick={send} disabled={!picked.length || !ex.points.length}><Send size={13} /> Send {picked.length} {picked.length === 1 ? "output" : "outputs"}</PrimaryButton>
              </div>
            </Panel>
            <Panel title={`Sent · ${sent.length}`}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {sent.map((x) => (
                  <li key={x.id} className="py-2">
                    <span className="block text-[0.8rem] text-ink">{x.what} · {sermons.find((s) => s.id === x.sermonId)?.title}</span>
                    <span className="block text-[0.68rem] text-mist">{x.date} · {x.to}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      <ProtoModal open={seriesOpen} title="New series" onClose={() => setSeriesOpen(false)} footer={<PrimaryButton onClick={addSeries} disabled={!seriesDraft.title.trim()}>Create series</PrimaryButton>}>
        <Field label="Series title">
          <input autoFocus value={seriesDraft.title} onChange={(e) => setSeriesDraft({ ...seriesDraft, title: e.target.value })} className={inputClass} placeholder="Faith that works: James" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Book">
            <select value={seriesDraft.book} onChange={(e) => setSeriesDraft({ ...seriesDraft, book: e.target.value })} className={inputClass}>
              {BOOKS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Starts">
            <select value={seriesDraft.start} onChange={(e) => setSeriesDraft({ ...seriesDraft, start: e.target.value })} className={inputClass}>
              {SUNDAYS.map((d) => <option key={d} value={d}>{fmt(d)}</option>)}
            </select>
          </Field>
          <Field label="Weeks">
            <select value={seriesDraft.weeks} onChange={(e) => setSeriesDraft({ ...seriesDraft, weeks: e.target.value })} className={inputClass}>
              {["2", "3", "4", "5", "6", "8"].map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
        </div>
        <KeyValues items={[["Open Sundays", `${openSundays.filter((d) => d >= seriesDraft.start).length} from ${fmt(seriesDraft.start)}`], ["Fills", "Open Sundays only. Planned ones stay."]]} />
      </ProtoModal>

      <ProtoModal open={sundayOpen} title="Add a Sunday" onClose={() => setSundayOpen(false)} footer={<PrimaryButton onClick={addSunday} disabled={!sundayDraft.date || !sundayDraft.title.trim()}>Add to plan</PrimaryButton>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sunday">
            <select value={sundayDraft.date} onChange={(e) => setSundayDraft({ ...sundayDraft, date: e.target.value })} className={inputClass}>
              {openSundays.map((d) => <option key={d} value={d}>{fmt(d)}</option>)}
            </select>
          </Field>
          <Field label="Series">
            <select value={sundayDraft.seriesId} onChange={(e) => setSundayDraft({ ...sundayDraft, seriesId: e.target.value })} className={inputClass}>
              {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Sermon title">
          <input autoFocus value={sundayDraft.title} onChange={(e) => setSundayDraft({ ...sundayDraft, title: e.target.value })} className={inputClass} placeholder="Peace that guards your heart" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Passage">
            <input value={sundayDraft.passage} onChange={(e) => setSundayDraft({ ...sundayDraft, passage: e.target.value })} className={inputClass} placeholder="Philippians 4:4–9" />
          </Field>
          <Field label="Preacher">
            <select value={sundayDraft.preacher} onChange={(e) => setSundayDraft({ ...sundayDraft, preacher: e.target.value })} className={inputClass}>
              <option value="">Unassigned</option>
              {PREACHERS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
        </div>
      </ProtoModal>
    </ProtoApp>
  );
}
