"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { AArrowDown, AArrowUp, CalendarCheck, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, GripVertical, Layers, Library, Lightbulb, MessageSquare, MessagesSquare, Minus, Pause, PenLine, Play, Plus, Presentation, RefreshCw, RotateCcw, Search, Send, Sparkles, Trash2, X } from "lucide-react";
import { Avatar, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, inputClass, textareaClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Types ------------------------------------------------------------------------

type Tab = "outline" | "slides" | "handout" | "guide";
type SermonStatus = "Planned" | "Draft" | "In review" | "Ready" | "Preached";
type Kind = "intro" | "point" | "scripture" | "illustration" | "application" | "conclusion";
type SlideTheme = "dark" | "light" | "brand";
type Modal = "new" | "series" | "request" | "comments" | "reuse" | "ill" | "ill-insert" | "ill-pick";

interface Block { id: string; kind: Kind; title: string; body: string; minutes: number; slide: boolean; blank?: string }
interface Question { id: string; text: string; draft: boolean }
interface Sermon {
  id: string; seriesId: string; date: string; passage: string; title: string; preacher: string; bigIdea: string; target: number;
  blocks: Block[]; status: SermonStatus; reviewer: string; topics: string[]; summary: string; summaryDraft: boolean; questions: Question[];
  notes: string[]; studyRef: string; rehearsal?: number; reuseOf?: string;
}
interface Series { id: string; title: string; book: string; keyVerse: string; notes: string }
interface Reply { id: string; author: string; text: string; when: string }
interface Thread { id: string; sermonId: string; blockId: string; author: string; text: string; when: string; resolved: boolean; replies: Reply[] }
interface Illustration { id: string; title: string; body: string; tags: string[]; source: string; used: string[] }
interface Sent { id: string; when: string; sermonId: string; what: string; to: string }

// ---- Dates and people -----------------------------------------------------------------

const TODAY = "2026-10-29";
const ME = "Pastor Dan";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmt = (iso: string) => {
  if (!iso) return "No date";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}${y === 2026 ? "" : `, ${y}`}`;
};
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

// The next quarter of Sundays, plus the one weekday service.
const SUNDAYS = ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29", "2026-12-06", "2026-12-13", "2026-12-20", "2026-12-27", "2027-01-03", "2027-01-10", "2027-01-17", "2027-01-24"];
const SPECIAL: Record<string, string> = { "2026-12-24": "Christmas Eve, 7 PM" };
const PLAN_DATES = [...SUNDAYS, ...Object.keys(SPECIAL)].sort();

const MONTH_VIEWS = [[2026, 10], [2026, 11], [2027, 0]].map(([y, m]) => {
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const trail = (7 - ((first + days) % 7)) % 7;
  return { label: `${FULL_MONTHS[m]} ${y}`, cells: [...Array<string>(first).fill(""), ...Array.from({ length: days }, (_, i) => iso(y, m, i + 1)), ...Array<string>(trail).fill("")] };
});

const PREACHERS: { name: string; role: string; away: Record<string, string> }[] = [
  { name: "Pastor Dan", role: "Lead pastor", away: {} },
  { name: "Pastor Joel", role: "Associate pastor", away: { "2026-11-22": "Pastors' conference, Baguio" } },
  { name: "Rina Navarro", role: "Women's ministry", away: { "2026-12-27": "Family in Iloilo" } },
  { name: "Mark Santos", role: "Youth pastor", away: { "2026-11-15": "Youth camp, Tagaytay" } },
];
const awayOn = (name: string, date: string) => PREACHERS.find((p) => p.name === name)?.away[date];
const BOOK_CHOICES = ["James", "Nehemiah", "Mark", "Jonah", "1 Peter", "Psalms", "Habakkuk", "Romans"];

// ---- Scripture: a small World English Bible verse set (public domain) ----------------

const WEB: Record<string, string> = {
  "Philippians 1:6": "being confident of this very thing, that he who began a good work in you will complete it until the day of Jesus Christ.",
  "Philippians 1:21": "For to me to live is Christ, and to die is gain.",
  "Philippians 2:3": "doing nothing through rivalry or through conceit, but in humility, each counting others better than himself;",
  "Philippians 2:4": "each of you not just looking to his own things, but each of you also to the things of others.",
  "Philippians 2:5": "Have this in your mind, which was also in Christ Jesus,",
  "Philippians 2:12": "So then, my beloved, even as you have always obeyed, not only in my presence, but now much more in my absence, work out your own salvation with fear and trembling.",
  "Philippians 2:13": "For it is God who works in you both to will and to work, for his good pleasure.",
  "Philippians 2:14": "Do all things without complaining and arguing,",
  "Philippians 2:15": "that you may become blameless and harmless, children of God without defect in the middle of a crooked and perverse generation, among whom you are seen as lights in the world,",
  "Philippians 2:16": "holding up the word of life, that I may have something to boast in the day of Christ, that I didn't run in vain nor labor in vain.",
  "Philippians 3:13": "Brothers, I don't regard myself as yet having taken hold, but one thing I do. Forgetting the things which are behind, and stretching forward to the things which are before,",
  "Philippians 3:14": "I press on toward the goal for the prize of the high calling of God in Christ Jesus.",
  "Philippians 4:6": "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.",
  "Philippians 4:7": "And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.",
  "Philippians 4:11": "Not that I speak because of lack, for I have learned in whatever state I am, to be content in it.",
  "Philippians 4:13": "I can do all things through Christ, who strengthens me.",
  "Ephesians 2:8": "for by grace you have been saved through faith, and that not of yourselves; it is the gift of God,",
  "Ephesians 2:9": "not of works, that no one would boast.",
  "Ephesians 2:10": "For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.",
  "Matthew 5:14": "You are the light of the world. A city located on a hill can't be hidden.",
  "Matthew 5:15": "Neither do you light a lamp and put it under a measuring basket, but on a stand; and it shines to all who are in the house.",
  "Matthew 5:16": "Even so, let your light shine before men, that they may see your good works, and glorify your Father who is in heaven.",
  "1 Corinthians 10:10": "Don't grumble, as some of them also grumbled, and perished by the destroyer.",
  "John 15:5": "I am the vine. You are the branches. He who remains in me, and I in him, the same bears much fruit, for apart from me you can do nothing.",
  "Hebrews 13:21": "make you complete in every good work to do his will, working in you that which is well pleasing in his sight, through Jesus Christ, to whom be the glory forever and ever. Amen.",
  "Ezekiel 36:26": "I will also give you a new heart, and I will put a new spirit within you. I will take away the stony heart out of your flesh, and I will give you a heart of flesh.",
  "Ezekiel 36:27": "I will put my Spirit within you, and cause you to walk in my statutes. You will keep my ordinances and do them.",
  "Psalm 46:1": "God is our refuge and strength, a very present help in trouble.",
  "Psalm 46:10": "Be still, and know that I am God. I will be exalted among the nations. I will be exalted in the earth.",
  "Psalm 23:4": "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.",
  "Isaiah 9:2": "The people who walked in darkness have seen a great light. The light has shined on those who lived in the land of the shadow of death.",
  "Isaiah 40:31": "But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.",
  "Colossians 3:23": "And whatever you do, work heartily, as for the Lord, and not for men,",
  "Romans 8:28": "We know that all things work together for good for those who love God, for those who are called according to his purpose.",
  "James 1:22": "But be doers of the word, and not only hearers, deluding your own selves.",
};
const SAMPLE_REFS = "Philippians 2:13, Ephesians 2:10, or Psalm 46:1";

const BOOK_NAMES: Record<string, string> = {
  phil: "Philippians", php: "Philippians", philippians: "Philippians", eph: "Ephesians", ephesians: "Ephesians", matt: "Matthew", mt: "Matthew", matthew: "Matthew",
  "1cor": "1 Corinthians", "1corinthians": "1 Corinthians", john: "John", jn: "John", heb: "Hebrews", hebrews: "Hebrews", ezek: "Ezekiel", ezekiel: "Ezekiel",
  ps: "Psalm", psa: "Psalm", psalm: "Psalm", psalms: "Psalm", isa: "Isaiah", isaiah: "Isaiah", col: "Colossians", colossians: "Colossians", rom: "Romans", romans: "Romans", jas: "James", james: "James",
};

interface Passage { ref: string; verses: [number, string][] }

// "Phil 2:13", "philippians 2:12-13" and "Philippians 2:12–13" all resolve.
function lookup(input: string): Passage | null {
  const m = input.trim().toLowerCase().replace(/[–—]/g, "-").match(/^([1-3]?\s*[a-z]+)\.?\s*(\d+)\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?$/);
  if (!m) return null;
  const book = BOOK_NAMES[m[1].replace(/\s+/g, "")];
  const ch = Number(m[2]);
  const from = Number(m[3]);
  const to = m[4] ? Number(m[4]) : from;
  if (!book || to < from || to - from > 6) return null;
  const verses: [number, string][] = [];
  for (let v = from; v <= to; v++) {
    const text = WEB[`${book} ${ch}:${v}`];
    if (!text) return null;
    verses.push([v, text]);
  }
  return { ref: `${book} ${ch}:${from}${to > from ? `–${to}` : ""}`, verses };
}
const textOf = (p: Passage) => p.verses.map(([, t]) => t).join(" ");

const CROSS: Record<string, { ref: string; why: string }[]> = {
  "Philippians 2": [
    { ref: "Philippians 1:6", why: "God finishes what he starts" },
    { ref: "Ephesians 2:10", why: "Created for good works" },
    { ref: "Hebrews 13:21", why: "God working in us what pleases him" },
    { ref: "Ezekiel 36:26-27", why: "A new heart that walks in his ways" },
    { ref: "1 Corinthians 10:10", why: "Grumbling in the wilderness" },
    { ref: "Matthew 5:14-16", why: "The light of the world" },
    { ref: "John 15:5", why: "Apart from me, nothing" },
  ],
  "Philippians 3": [
    { ref: "Philippians 3:13-14", why: "Forgetting what is behind" },
    { ref: "Ephesians 2:8-9", why: "Saved by grace, not works" },
    { ref: "Philippians 1:21", why: "To live is Christ" },
    { ref: "Romans 8:28", why: "All things work together" },
  ],
  "Philippians 4": [
    { ref: "Philippians 4:6-7", why: "Peace that guards your heart" },
    { ref: "Philippians 4:11", why: "Content in any state" },
    { ref: "Philippians 4:13", why: "Strength in Christ" },
    { ref: "Psalm 23:4", why: "With us in the valley" },
  ],
  Isaiah: [
    { ref: "Isaiah 9:2", why: "A great light in the darkness" },
    { ref: "Matthew 5:14-16", why: "Light of the world" },
    { ref: "Isaiah 40:31", why: "Those who wait renew their strength" },
    { ref: "Psalm 46:1", why: "A very present help" },
  ],
};
const DEFAULT_CROSS = [
  { ref: "Romans 8:28", why: "All things work together" },
  { ref: "James 1:22", why: "Doers of the word" },
  { ref: "Psalm 46:1", why: "A very present help" },
  { ref: "Colossians 3:23", why: "Work as for the Lord" },
];
const crossFor = (passage: string) => CROSS[passage.split(":")[0]] ?? CROSS[passage.split(" ")[0]] ?? DEFAULT_CROSS;

// ---- Sermon blocks ------------------------------------------------------------------------

const KINDS: Record<Kind, { label: string; tone: string; minutes: number; slide: boolean; hint: string }> = {
  intro: { label: "Intro", tone: "bg-raised text-ink-soft", minutes: 3, slide: false, hint: "Opening story or question" },
  point: { label: "Point", tone: "bg-gold-wash text-gold", minutes: 7, slide: true, hint: "Main point, in one sentence" },
  scripture: { label: "Scripture", tone: "bg-trace-wash text-trace", minutes: 2, slide: true, hint: "Type a reference, like Philippians 2:13" },
  illustration: { label: "Illustration", tone: "bg-warn/10 text-warn", minutes: 3, slide: false, hint: "Story or picture" },
  application: { label: "Application", tone: "bg-good/10 text-good", minutes: 3, slide: true, hint: "What changes this week" },
  conclusion: { label: "Conclusion", tone: "bg-raised text-ink-soft", minutes: 2, slide: false, hint: "Close and call to respond" },
};
const KIND_ORDER: Kind[] = ["intro", "point", "scripture", "illustration", "application", "conclusion"];
const labelOf = (blocks: Block[], i: number) => (blocks[i].kind === "point" ? `Point ${blocks.slice(0, i + 1).filter((b) => b.kind === "point").length}` : KINDS[blocks[i].kind].label);
const minutesOf = (s: Sermon) => s.blocks.reduce((n, b) => n + b.minutes, 0);
const pointsOf = (s: Sermon) => s.blocks.filter((b) => b.kind === "point");

let seq = 0;
const blk = (kind: Kind, title: string, body = "", minutes = KINDS[kind].minutes, blank?: string): Block => ({ id: `b${++seq}`, kind, title, body, minutes, slide: KINDS[kind].slide, blank });
const scripture = (ref: string, minutes = 2) => {
  const p = lookup(ref);
  return blk("scripture", p?.ref ?? ref, p ? textOf(p) : "", minutes);
};
const past = (points: string[], app: string, ref?: string) => [
  blk("intro", "Opening story"),
  ...(ref ? [scripture(ref)] : []),
  ...points.map((p) => blk("point", p, "", 8)),
  blk("application", "This week", app),
  blk("conclusion", "Close and pray"),
];

function questionsFor(s: Sermon, round: number): Question[] {
  const p = pointsOf(s).map((b) => b.title).filter(Boolean);
  const app = s.blocks.find((b) => b.kind === "application" && b.body);
  const sets = [
    [
      `Read ${s.passage} out loud together. What word or phrase stands out to you?`,
      s.bigIdea ? `The big idea was "${s.bigIdea}" Where is that hard to believe this week?` : "What does this passage show us about God?",
      ...p.slice(0, 2).map((x) => `"${x}." What would that look like at home, at school, or at work?`),
      app ? `This week's challenge: ${app.body} What could get in the way?` : "What is one step you will take before we meet again?",
      "How can this group pray for each other this week?",
    ],
    [
      `What did you notice in ${s.passage} that you had not seen before?`,
      ...p.slice(0, 3).map((x, i) => (i === 0 ? `Talk about "${x}." When have you seen this in your own life?` : `Which is harder for you right now: "${x}" or the point before it? Why?`)),
      "Who outside this group needs to hear this message? How could you share it?",
      "Pair up and pray for one specific need before next week.",
    ],
  ];
  return sets[round % 2].map((text, i) => ({ id: `${s.id}-q${round}-${i}`, text, draft: true }));
}

function summaryFor(s: Sermon, round: number) {
  const p = pointsOf(s).map((b) => b.title).filter(Boolean);
  const text =
    round % 2 === 0
      ? `${s.title}, from ${s.passage}. ${s.bigIdea} The message moves through ${p.length} points: ${p.join("; ")}.`
      : `This week we read ${s.passage}. The main idea: ${s.bigIdea} Groups can start with "${p[0] ?? s.title}" and spend most of the time on application.`;
  return text.replace(/\s+/g, " ");
}

// ---- Sample data ------------------------------------------------------------------------

const S = (id: string, seriesId: string, date: string, passage: string, title: string, preacher: string, topics: string, bigIdea = "", blocks: Block[] = [], extra: Partial<Sermon> = {}): Sermon => ({
  id, seriesId, date, passage, title, preacher, bigIdea, blocks, topics: topics ? topics.split(", ") : [], target: 35, reviewer: "", summary: "", summaryDraft: false, questions: [], notes: [], studyRef: "",
  status: date && date < TODAY ? "Preached" : blocks.length ? "Draft" : "Planned",
  ...extra,
});

const U4 = {
  intro: blk("intro", "Mang Ernie's jeepney prayer", "Open with Mang Ernie, the jeepney driver on the Cubao route who prays over his jeep before every first trip. “The route is mine to drive. The road is God's.”", 3),
  read: scripture("Philippians 2:12-13"),
  p1: blk("point", "God is already at work in you", "Verse 13 before verse 12. We don't start the work, we join it. He who began a good work will finish it.", 7, "at work"),
  ill: blk("illustration", "Banaue rice terraces", "Carved by hand over generations. Each family works a terrace the family before them started. We work out what God already started.", 3),
  p2: blk("point", "Do everything without grumbling", "Verse 14. Where do we complain most? Traffic, the office, the family group chat. Grumbling says God isn't working here.", 6, "grumbling"),
  p3: blk("point", "Shine where you already are", "Timothy and Epaphroditus were ordinary. No platform. They showed up, cared, and risked their health for the work.", 6, "already are"),
  app: blk("application", "This week", "Pick one place you usually complain: the commute, the office, the kitchen. Thank God there out loud, once a day, for seven days.", 3),
  close: blk("conclusion", "The road is God's", "Back to Mang Ernie. The route is ours; the road is God's. Pray for workers, students, and OFW families.", 2),
};

const U5 = [
  blk("intro", "Resume or eulogy", "What would you list on a resume? What would you want said at your funeral? Paul had both lists.", 3),
  blk("point", "Confidence in the flesh", "Verses 4–6. Paul's resume: tribe, training, zeal. Ours: school, job title, family name.", 8, "flesh"),
  blk("point", "Loss for the sake of Christ", "Verses 7–8. The list wasn't bad. It just can't compare to knowing him.", 8, "Loss"),
  scripture("Philippians 3:13-14"),
  blk("point", "Press on", "", 7),
];

const SERMONS: Sermon[] = [
  S("u1", "phil", "2026-10-04", "Philippians 1:1–11", "Joy that starts with thanks", "Pastor Dan", "joy, gratitude, prayer", "Gratitude for people comes before joy in circumstances.", past(["Paul thanks God for people", "Joy grows from partnership", "Pray for love that grows in knowledge"], "Send one thank-you message to someone who shaped your faith.", "Philippians 1:6"), { studyRef: "Philippians 1:6", rehearsal: 2040 }),
  S("u2", "phil", "2026-10-11", "Philippians 1:12–26", "When plans fall apart", "Pastor Dan", "suffering, purpose, work", "God uses detours to move the gospel forward.", past(["Prison opened doors", "Rivals still preached Christ", "To live is Christ"], "Name one detour this year. Ask what God might be doing through it.", "Philippians 1:21"), { studyRef: "Philippians 1:21" }),
  S("u7", "phil", "2026-10-18", "Philippians 1:27–30", "Standing together", "Rina Navarro", "unity, courage, church", "A church that stands together does not scare easily.", past(["Live worthy of the gospel", "Strive side by side", "Suffering is part of the calling"], "Sit with someone new at the fellowship lunch.")),
  S("u3", "phil", "2026-10-25", "Philippians 2:1–11", "The mind of Christ", "Pastor Joel", "humility, unity, Jesus", "Humility is choosing others the way Jesus chose us.", past(["Same love, same mind", "Count others more significant", "Jesus emptied himself"], "Do one unseen act of service at home.", "Philippians 2:3-5"), { studyRef: "Philippians 2:3-5" }),
  S("u4", "phil", "2026-11-01", "Philippians 2:12–30", "Working out what God works in", "Pastor Dan", "obedience, grace, work", "Obedience is our part of a work God already started.", Object.values(U4), {
    status: "In review",
    reviewer: "Pastor Joel",
    studyRef: "Philippians 2:14-16",
    rehearsal: 1985,
    notes: [
      "Work out (katergazesthe): bring to completion. Not work for.",
      "Fear and trembling: reverence, not anxiety. Same phrase in 2 Corinthians 7:15.",
      "Verse 13: God gives both the wanting and the doing.",
      "Epaphroditus came from Philippi with their gift (4:18) and nearly died serving Paul.",
    ],
  }),
  S("u5", "phil", "2026-11-08", "Philippians 3:1–14", "Counting it loss", "Pastor Joel", "identity, ambition, Jesus", "Everything I count as gain is loss next to knowing Christ.", U5, { status: "In review", reviewer: "Pastor Dan", studyRef: "Philippians 3:13-14" }),
  S("u6", "phil", "2026-11-15", "Philippians 3:15–4:1", "Citizens of heaven", "Pastor Dan", "identity, hope, heaven", "", [], { studyRef: "Philippians 3:14" }),
  S("u8", "phil", "2026-11-22", "Philippians 4:2–23", "Content in every season", "", "contentment, giving, peace", "", [], { studyRef: "Philippians 4:11" }),
  S("a1", "advent", "2026-11-29", "Isaiah 9:1–7", "A light for those in darkness", "", "advent, hope, light", "", [], { studyRef: "Isaiah 9:2" }),
  S("a2", "advent", "2026-12-06", "Isaiah 40:1–11", "Comfort, my people", "Pastor Joel", "advent, comfort", "God's comfort comes as a person, not a feeling.", [
    blk("intro", "Waiting at NAIA arrivals", "Families waiting at the arrivals gate for OFWs coming home for Christmas.", 3),
    blk("point", "Comfort is spoken", "Verses 1–2. God speaks tenderly before anything changes.", 8, "spoken"),
    blk("point", "The way is prepared", "Verses 3–5. Valleys lifted, mountains made low.", 8, "prepared"),
  ], { studyRef: "Isaiah 40:31" }),
  S("a3", "advent", "2026-12-20", "Isaiah 7:10–14", "God with us", "Pastor Dan", "advent, Immanuel, Christmas", "", [], { studyRef: "Isaiah 9:2" }),
  S("a4", "advent", "2026-12-24", "Luke 2:1–20", "Good news of great joy", "Pastor Dan", "Christmas, joy", "", [], { target: 20 }),
  S("v1", "single", "2027-01-03", "Habakkuk 2:1–4", "Write the vision", "Pastor Dan", "vision, prayer, faith", "", [], { target: 40 }),
  S("c1", "col", "2026-08-30", "Colossians 1:1–14", "Fruit that grows slowly", "Pastor Dan", "growth, prayer", "Real growth is slow, steady, and from God.", past(["The gospel bears fruit", "Pray for knowledge that leads to walking", "Strength to endure with joy"], "Pray Colossians 1:9–12 for one person every morning.")),
  S("c2", "col", "2026-09-06", "Colossians 1:15–23", "Firstborn over all", "Pastor Joel", "Jesus, creation, reconciliation", "Jesus holds everything together, including you.", past(["Jesus over creation", "Jesus over the church", "Jesus over your past"], "Write down one thing you are trying to hold together yourself.")),
  S("c3", "col", "2026-09-13", "Colossians 2:6–15", "Rooted and built up", "Pastor Dan", "faith, grace, forgiveness", "You do not need more than Christ. You need more of Christ.", past(["Walk the way you received him", "Watch out for empty philosophy", "The record against us is cancelled"], "Read Colossians 2 each day this week.")),
  S("c4", "col", "2026-09-20", "Colossians 3:1–17", "Set your hearts above", "Rina Navarro", "holiness, family, forgiveness", "A new life shows up in old places.", past(["Seek the things above", "Put off the old self", "Put on love"], "Forgive one person by name in prayer.")),
  S("c5", "col", "2026-09-27", "Colossians 3:18–4:6", "Grace at home and at work", "Pastor Dan", "family, work, OFW", "Every relationship is a place to serve the Lord.", past(["Homes shaped by love", "Work done for the Lord", "Speech seasoned with salt"], "Call or message a family member abroad this week.", "Colossians 3:23"), { studyRef: "Colossians 3:23" }),
  S("e1", "single", "2026-04-05", "Luke 24:1–12", "He is not here", "Pastor Dan", "Easter, resurrection, hope", "The empty tomb means your worst day is not your last day.", past(["The women came expecting a body", "The angels asked a question", "The disciples did not believe yet"], "Invite one person to the Easter lunch.")),
  S("m1", "single", "2026-05-10", "Proverbs 31:10–31", "The women who raised us", "Rina Navarro", "family, mothers, faithfulness", "Faithfulness in small things is strength in God's eyes.", past(["Strength that looks ordinary", "Work done with open hands", "Praise at the city gate"], "Thank the woman who raised you, in person or by call.")),
  S("s1", "psalms", "2025-07-27", "Psalm 46", "Our refuge when the water rises", "Pastor Dan", "floods, fear, comfort", "God is our refuge before, during, and after the storm.", past(["God is present in the flood", "Be still and know", "The Lord is with us"], "Check on one neighbor who lost something in the flood.", "Psalm 46:1"), { studyRef: "Psalm 46:10" }),
  S("s2", "psalms", "2025-08-03", "Psalm 23", "The shepherd in the dark valley", "Mark Santos", "comfort, youth, fear", "The shepherd walks with us through the valley.", past(["The Lord leads", "The Lord walks with us", "The Lord prepares a table"], "Memorize Psalm 23:4.", "Psalm 23:4"), { studyRef: "Psalm 23:4" }),
  S("r1", "ruth", "2025-06-08", "Ruth 1", "Staying when it is easier to leave", "Pastor Dan", "loyalty, grief", "God is present in our bitter seasons.", past(["Naomi loses everything", "Ruth chooses to stay", "Bitter is not the end"], "Stay with someone who is grieving.")),
  S("r2", "ruth", "2025-06-15", "Ruth 2", "Gleaning in hard seasons", "Rina Navarro", "provision, work, kindness", "God provides through ordinary kindness.", past(["Ruth works the edges", "Boaz notices", "Kindness beyond the law"], "Leave something at the edge for someone else.")),
  S("r3", "ruth", "2025-06-22", "Ruth 3–4", "The kinsman redeemer", "Pastor Joel", "redemption, family", "Jesus is the redeemer we could never pay for.", past(["A risky request", "A redeemer who pays", "A family line that leads to David"], "Thank Jesus for one debt he paid for you.")),
].map((s) => (s.status === "Preached" ? { ...s, questions: questionsFor(s, 0).map((q) => ({ ...q, draft: false })) } : s));

const SERIES: Series[] = [
  { id: "phil", title: "Unshaken: Philippians", book: "Philippians", keyVerse: "Philippians 4:13", notes: "Joy that does not depend on circumstances. Keep illustrations local: traffic, floods, OFW families. Each week ends with one practice for the week." },
  { id: "advent", title: "Advent: The Long Wait", book: "Isaiah", keyVerse: "Isaiah 9:2", notes: "Four Sundays and Christmas Eve. Kids choir sings Dec 20. A different family lights the candle each week." },
  { id: "col", title: "Rooted: Colossians", book: "Colossians", keyVerse: "Colossians 3:23", notes: "Five weeks on who Jesus is and how that shapes home and work." },
  { id: "single", title: "Special Sundays", book: "Various", keyVerse: "Romans 8:28", notes: "Easter, Mother's Day, Vision Sunday, and one-off messages." },
  { id: "psalms", title: "Psalms for hard weeks", book: "Psalms", keyVerse: "Psalm 46:1", notes: "Preached after the July 2025 floods in Marikina and Quezon City." },
  { id: "ruth", title: "Ordinary Faith: Ruth", book: "Ruth", keyVerse: "", notes: "Three weeks. God at work in ordinary loyalty and kindness." },
];

const THREADS: Thread[] = [
  { id: "t1", sermonId: "u4", blockId: U4.p1.id, author: "Pastor Joel", text: "Strong start. Read Philippians 1:6 out loud here instead of only citing it.", when: "Oct 28, 4:12 PM", resolved: false, replies: [] },
  { id: "t2", sermonId: "u4", blockId: U4.ill.id, author: "Pastor Joel", text: "We used the Banaue terraces on Aug 30 in Colossians. Maybe lean on the jeepney story instead?", when: "Oct 28, 4:15 PM", resolved: false, replies: [] },
  { id: "t3", sermonId: "u4", blockId: U4.p2.id, author: "Pastor Joel", text: "The group chat line will land. Watch the time; this point ran long in the Colossians series.", when: "Oct 28, 4:20 PM", resolved: false, replies: [{ id: "r1", author: "Pastor Dan", text: "Cutting the second traffic example.", when: "Oct 28, 9:02 PM" }] },
  { id: "t4", sermonId: "u4", blockId: U4.app.id, author: "Rina Navarro", text: "Could we add a Tagalog line here? Something like: Magpasalamat ka doon mismo.", when: "Oct 29, 8:40 AM", resolved: false, replies: [] },
  { id: "t5", sermonId: "u4", blockId: "", author: "Pastor Joel", text: "Big idea is clear and easy to repeat. Keep it.", when: "Oct 28, 4:10 PM", resolved: true, replies: [] },
  { id: "t6", sermonId: "u5", blockId: U5[4].id, author: "Pastor Dan", text: "Point 3 needs a body. What does pressing on look like for a student or a jeepney driver?", when: "Oct 29, 7:15 AM", resolved: false, replies: [] },
  { id: "t7", sermonId: "u3", blockId: "", author: "Pastor Dan", text: "Great close. The bayanihan picture worked at both services.", when: "Oct 23, 6:30 PM", resolved: true, replies: [] },
];

const ILLUSTRATIONS: Illustration[] = [
  { id: "i1", title: "Mang Ernie's jeepney prayer", source: "Personal", tags: ["work", "prayer", "faithfulness"], used: ["u4"], body: "Mang Ernie drives the Cubao to Fairview route. Before his first trip he prays over the jeepney. He told me, “The route is mine to drive. The road is God's.”" },
  { id: "i2", title: "Banaue rice terraces", source: "History", tags: ["perseverance", "generations", "work"], used: ["c1", "u4"], body: "Ifugao families carved the terraces by hand over generations. Each family works a terrace the family before them started, and keeps it for the family after." },
  { id: "i3", title: "Brownout during exam week", source: "Personal", tags: ["light", "witness", "students"], used: [], body: "When the power went out in our barangay during exam week, one house had a generator. By nine, half the street's students were studying on that family's porch." },
  { id: "i4", title: "Bayanihan: carrying the house", source: "Culture", tags: ["community", "unity", "service"], used: ["u3"], body: "Neighbors lift a nipa hut on bamboo poles and walk it to its new lot. No one can carry it alone. No one is paid. Everyone eats together after." },
  { id: "i5", title: "The 3 AM video call", source: "Member story, shared with permission", tags: ["family", "sacrifice", "OFW"], used: ["c5"], body: "Tess works as a nurse in Riyadh. She sets an alarm for 3 AM her time so she can help her son with homework before school in Manila." },
  { id: "i6", title: "Floodwater on the second floor", source: "Member story, shared with permission", tags: ["suffering", "refuge", "comfort"], used: ["s1"], body: "During the July 2025 floods the Ramos family moved to their second floor, then their roof. A neighbor's church group brought food by boat for four days." },
  { id: "i7", title: "Three hours on EDSA", source: "Personal", tags: ["patience", "grumbling", "contentment"], used: [], body: "Friday, 6 PM, EDSA northbound. Three hours to go eleven kilometers. I counted how many times I complained. Then I counted how many times I prayed." },
  { id: "i8", title: "The sari-sari store notebook", source: "Culture", tags: ["grace", "debt", "forgiveness"], used: ["c3"], body: "Aling Nena keeps a notebook of who owes what. When a family on her street lost their father, she tore out their page in front of them." },
  { id: "i9", title: "Fiesta in Pakil", source: "Culture", tags: ["joy", "hospitality", "generosity"], used: [], body: "During the town fiesta every door is open. Strangers are fed like cousins. No one asks if you were invited." },
  { id: "i10", title: "Signal No. 4", source: "News", tags: ["fear", "preparation", "trust"], used: ["s2"], body: "When the typhoon signal went up to No. 4, the families who had prepared were not less afraid. They were just ready." },
  { id: "i11", title: "Lola's handwritten recipe", source: "Personal", tags: ["legacy", "faithfulness", "family"], used: ["m1"], body: "My lola's adobo recipe is on an index card, stained and taped. The measurements are vague. The faithfulness is not: she cooked it every Sunday for forty years." },
  { id: "i12", title: "The night-shift agent", source: "Member story, shared with permission", tags: ["work", "rest", "witness"], used: [], body: "Paolo takes calls from Ohio from 10 PM to 7 AM. His team knows he prays on his break. Two of them asked him to pray for their families this month." },
  { id: "i13", title: "Cape Bojeador lighthouse", source: "History", tags: ["light", "witness", "guidance"], used: [], body: "Built in 1892 on a hill in Burgos, Ilocos Norte, it still guides ships. It doesn't move or shout. It shines where it was put." },
  { id: "i14", title: "William Carey's cobbler shop", source: "Church history", tags: ["missions", "work", "faithfulness"], used: [], body: "Carey kept a map of the world on the wall of his shoe shop and prayed over it while he worked. Ordinary work, global prayer." },
];

const SENT: Sent[] = [
  { id: "x1", when: "Oct 23, 5:40 PM", sermonId: "u3", what: "Slides", to: "Media team" },
  { id: "x2", when: "Oct 24, 9:15 AM", sermonId: "u3", what: "Handout", to: "Print team" },
  { id: "x3", when: "Oct 24, 1:30 PM", sermonId: "u3", what: "Group guide", to: "Life group leaders" },
  { id: "x4", when: "Oct 25, 8:00 AM", sermonId: "u3", what: "Sunday notes", to: "Congregation app" },
  { id: "x5", when: "Oct 16, 6:02 PM", sermonId: "u7", what: "Slides", to: "Media team" },
  { id: "x6", when: "Oct 17, 10:00 AM", sermonId: "u7", what: "Handout", to: "Print team" },
];

const OUTPUTS = [
  { id: "slides", label: "Slides", to: "Media team", who: "Paolo Garcia and Jun Ramirez", due: "Due Fri, 6 PM" },
  { id: "handout", label: "Handout", to: "Print team", who: "Lorna Bautista", due: "Due Sat, 10 AM" },
  { id: "guide", label: "Group guide", to: "Life group leaders", who: "14 leaders by email and SMS", due: "Due Sun, 6 PM" },
  { id: "notes", label: "Sunday notes", to: "Congregation app", who: "Fill-in notes on members' phones", due: "Live Sun, 8 AM" },
] as const;
type OutputId = (typeof OUTPUTS)[number]["id"];

// ---- Outputs built from the outline --------------------------------------------------------

interface Slide { id: string; kicker: string; text: string; sub?: string; small?: boolean }

function slidesFor(s: Sermon, seriesTitle = ""): Slide[] {
  const out: Slide[] = [{ id: "title", kicker: seriesTitle || "Grace Fellowship", text: s.title || "Untitled sermon", sub: `${s.passage}${s.preacher ? ` · ${s.preacher}` : ""}` }];
  if (s.bigIdea) out.push({ id: "idea", kicker: "Big idea", text: s.bigIdea });
  s.blocks.forEach((b, i) => {
    if (!b.slide) return;
    if (b.kind === "point") out.push({ id: b.id, kicker: labelOf(s.blocks, i), text: b.title || "Untitled point" });
    else if (b.kind === "scripture") out.push({ id: b.id, kicker: b.title, text: b.body || "Passage text", small: true });
    else if (b.kind === "application") out.push({ id: b.id, kicker: "This week", text: b.body || b.title, small: true });
    else out.push({ id: b.id, kicker: KINDS[b.kind].label, text: b.title });
  });
  return out;
}

const THEMES: Record<SlideTheme, string> = { dark: "bg-ink text-sheet", light: "bg-sheet text-ink border border-rule", brand: "bg-gold text-sheet" };

function SlideCard({ slide, theme, n, large }: { slide: Slide; theme: SlideTheme; n?: number; large?: boolean }) {
  return (
    <div className={cn("relative aspect-video rounded-md flex flex-col justify-center overflow-hidden text-left", THEMES[theme], large ? "p-8" : "p-2.5")}>
      {n !== undefined && <span className="absolute top-1 right-1.5 font-mono text-[0.55rem] opacity-60">{n}</span>}
      <span className={cn("font-medium opacity-70", large ? "text-[0.8rem]" : "text-[0.55rem]")}>{slide.kicker}</span>
      <span className={cn("mt-1 leading-tight", slide.small ? (large ? "text-[1.05rem] leading-relaxed" : "text-[0.55rem] line-clamp-4") : large ? "text-[1.75rem] font-semibold" : "text-[0.76rem] font-semibold line-clamp-3")}>{slide.text}</span>
      {slide.sub && <span className={cn("mt-1 opacity-70", large ? "text-[0.8rem]" : "text-[0.52rem]")}>{slide.sub}</span>}
    </div>
  );
}

// The handout blanks the point's fill-in word, or its last word.
function Blanked({ text, blank, show }: { text: string; blank?: string; show: boolean }) {
  const word = blank && text.includes(blank) ? blank : (text.trim().split(" ").pop() ?? "");
  const at = blank && text.includes(blank) ? text.indexOf(blank) : text.lastIndexOf(word);
  if (!word || at < 0 || text.trim().split(" ").length < 2) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className={cn("inline-block min-w-[4.5rem] px-1 border-b border-ink text-center", show ? "text-gold" : "text-transparent")}>{word}</span>
      {text.slice(at + word.length)}
    </>
  );
}

// ---- Small pieces ----------------------------------------------------------------------------

function SermonState({ s }: { s: Sermon }) {
  if (s.status !== "Preached" && !s.preacher) return <Status tone="bad">No preacher</Status>;
  const tone = { Planned: "muted", Draft: "warn", "In review": "warn", Ready: "good", Preached: "muted" } as const;
  return <Status tone={tone[s.status]}>{s.status === "Planned" ? "Not started" : s.status}</Status>;
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="w-7 h-7 inline-flex items-center justify-center rounded-md border border-rule text-graphite hover:text-gold hover:border-gold disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors">
      {children}
    </button>
  );
}

const AiDraft = () => <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.64rem] font-medium bg-raised text-graphite">AI draft</span>;

function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className="flex items-center gap-2 px-3 h-9 flex-1 min-w-[12rem] rounded-lg border border-rule bg-sheet focus-within:border-gold">
      <Search size={14} className="text-mist" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} className="flex-1 bg-transparent text-[0.82rem] text-ink placeholder:text-mist outline-none" />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="text-mist hover:text-ink cursor-pointer"><X size={13} /></button>
      )}
    </label>
  );
}

const selectClass = "h-8 px-2 rounded-md bg-sheet border border-rule text-[0.75rem] text-ink cursor-pointer";

// One block of the outline. Drag by the handle or use the arrows.
function BlockCard({ b, label, comments, active, autoFocus, first, last, onChange, onMove, onRemove, onFocus, onComments }: {
  b: Block; label: string; comments: number; active: boolean; autoFocus: boolean; first: boolean; last: boolean;
  onChange: (patch: Partial<Block>) => void; onMove: (dir: -1 | 1) => void; onRemove: () => void; onFocus: () => void; onComments: () => void;
}) {
  const drag = useDragControls();
  const k = KINDS[b.kind];
  const found = b.kind === "scripture" ? lookup(b.title) : null;
  const lastWord = b.title.trim().split(" ").pop() ?? "";
  return (
    <Reorder.Item
      value={b}
      dragListener={false}
      dragControls={drag}
      onFocusCapture={onFocus}
      onClick={onFocus}
      whileDrag={{ scale: 1.01, boxShadow: "0 12px 24px -12px rgba(16,24,40,0.3)" }}
      className={cn("relative bg-sheet border rounded-lg p-2.5 flex gap-2 transition-[border-color,box-shadow]", active ? "border-gold shadow-[0_0_0_3px_var(--color-gold-wash)]" : "border-rule")}
    >
      <button type="button" aria-label={`Drag ${label} to reorder`} onPointerDown={(e) => drag.start(e)} className="self-start mt-1.5 text-mist hover:text-ink cursor-grab active:cursor-grabbing touch-none">
        <GripVertical size={15} />
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-[0.66rem] font-semibold", k.tone)}>{label}</span>
          <input
            autoFocus={autoFocus}
            aria-label={`${label} title`}
            value={b.title}
            placeholder={k.hint}
            onChange={(e) => {
              const p = b.kind === "scripture" ? lookup(e.target.value) : null;
              onChange(p ? { title: e.target.value, body: textOf(p) } : { title: e.target.value });
            }}
            onBlur={() => found && found.ref !== b.title && onChange({ title: found.ref })}
            className="flex-1 min-w-0 h-8 px-2 rounded-md bg-transparent border border-transparent hover:border-rule focus:border-gold text-[0.85rem] font-medium text-ink placeholder:text-mist placeholder:font-normal outline-none"
          />
          <span className="shrink-0 flex items-center rounded-md border border-rule text-[0.7rem] text-graphite">
            <button type="button" aria-label={`Less time for ${label}`} onClick={() => onChange({ minutes: Math.max(1, b.minutes - 1) })} className="w-6 h-6 inline-flex items-center justify-center hover:text-ink cursor-pointer">
              <Minus size={11} />
            </button>
            <span className="w-12 text-center font-mono tabular-nums">{b.minutes} min</span>
            <button type="button" aria-label={`More time for ${label}`} onClick={() => onChange({ minutes: b.minutes + 1 })} className="w-6 h-6 inline-flex items-center justify-center hover:text-ink cursor-pointer">
              <Plus size={11} />
            </button>
          </span>
        </div>
        {b.kind === "scripture" && b.title.trim() && !found && !b.body && <p className="text-[0.7rem] text-mist px-2">Not in this demo&apos;s verse set. Try {SAMPLE_REFS}.</p>}
        <textarea
          aria-label={`${label} notes`}
          value={b.body}
          rows={Math.min(5, Math.max(2, Math.ceil(b.body.length / 80)))}
          placeholder={b.kind === "scripture" ? "The passage fills in from the reference" : "Notes, manuscript, or talking points"}
          onChange={(e) => onChange({ body: e.target.value })}
          className={cn(textareaClass, "min-h-0 py-1.5 text-[0.78rem] leading-relaxed resize-none", b.kind === "scripture" && "bg-trace-wash")}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <label className="flex items-center gap-1.5 text-[0.7rem] text-graphite cursor-pointer">
            <input type="checkbox" checked={b.slide} onChange={(e) => onChange({ slide: e.target.checked })} className="accent-gold w-3.5 h-3.5" /> On slides
          </label>
          {b.kind === "point" && (
            <label className="flex items-center gap-1.5 text-[0.7rem] text-graphite">
              Handout blank
              <input value={b.blank ?? ""} placeholder={lastWord} onChange={(e) => onChange({ blank: e.target.value })} className="h-6 w-28 px-1.5 rounded border border-rule bg-sheet text-[0.72rem] text-ink placeholder:text-mist outline-none focus:border-gold" />
            </label>
          )}
          {found && <span className="text-[0.66rem] text-trace">World English Bible</span>}
          <span className="ml-auto flex items-center gap-1">
            <button type="button" onClick={onComments} aria-label={`${comments} open comments on ${label}`} className={cn("h-7 px-2 inline-flex items-center gap-1 rounded-md border text-[0.7rem] font-medium cursor-pointer", comments ? "border-warn/30 bg-warn/10 text-warn" : "border-rule text-graphite hover:text-ink")}>
              <MessageSquare size={12} />
              {comments > 0 && comments}
            </button>
            <IconButton label={`Move ${label} up`} disabled={first} onClick={() => onMove(-1)}><ChevronUp size={14} /></IconButton>
            <IconButton label={`Move ${label} down`} disabled={last} onClick={() => onMove(1)}><ChevronDown size={14} /></IconButton>
            <IconButton label={`Remove ${label}`} onClick={onRemove}><Trash2 size={13} /></IconButton>
          </span>
        </div>
      </div>
    </Reorder.Item>
  );
}

// Passage lookup, cross-references and study notes, beside the editor.
function StudyPanel({ s, seriesNotes, onInsert, onNotes }: { s: Sermon; seriesNotes: string; onInsert: (p: Passage) => void; onNotes: (notes: string[]) => void }) {
  const [tab, setTab] = useState<"passage" | "cross" | "notes">("passage");
  const [query, setQuery] = useState(s.studyRef);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const found = lookup(query);
  const addNote = () => {
    if (!note.trim()) return;
    onNotes([...s.notes, note.trim()]);
    setNote("");
  };
  return (
    <aside className="bg-sheet border border-rule rounded-lg self-start lg:sticky lg:top-0 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between gap-2 px-3 h-10 border-b border-rule">
        <span className="text-[0.8rem] font-semibold text-ink">Study</span>
        <span className="text-[0.64rem] text-mist">World English Bible</span>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <Segmented id="sm-study" value={tab} onChange={setTab} options={[{ id: "passage", label: "Passage" }, { id: "cross", label: "Cross-refs" }, { id: "notes", label: `Notes · ${s.notes.length}` }]} />
        {tab === "passage" && (
          <>
            <SearchBox value={query} onChange={setQuery} placeholder="Philippians 2:13" label="Look up a passage" />
            {found ? (
              <>
                <div className="text-[0.8rem] font-semibold text-ink">{found.ref}</div>
                <p className="text-[0.8rem] leading-relaxed text-ink-soft">
                  {found.verses.map(([v, t]) => (
                    <span key={v}><sup className="text-[0.6rem] font-semibold text-gold mr-0.5">{v}</sup>{t}{" "}</span>
                  ))}
                </p>
                <div>
                  <PrimaryButton onClick={() => onInsert(found)}><Plus size={13} /> Insert passage</PrimaryButton>
                </div>
              </>
            ) : (
              <p className="text-[0.74rem] text-mist">{query.trim() ? "Not in this demo's verse set." : "Type a reference."} Try {SAMPLE_REFS}.</p>
            )}
          </>
        )}
        {tab === "cross" && (
          <ul className="flex flex-col divide-y divide-rule-soft -my-1">
            {crossFor(s.passage).map((c) => {
              const p = lookup(c.ref);
              const open = openRef === c.ref;
              return (
                <li key={c.ref} className="py-2">
                  <button type="button" onClick={() => setOpenRef(open ? null : c.ref)} aria-expanded={open} className="group w-full flex items-start justify-between gap-2 text-left cursor-pointer">
                    <span>
                      <span className="block text-[0.78rem] font-medium text-ink group-hover:text-gold">{p?.ref ?? c.ref}</span>
                      <span className="block text-[0.7rem] text-mist">{c.why}</span>
                    </span>
                    <ChevronDown size={13} className={cn("mt-0.5 text-mist transition-transform", open && "rotate-180")} />
                  </button>
                  {open && p && (
                    <>
                      <p className="mt-1.5 text-[0.76rem] leading-relaxed text-ink-soft">{textOf(p)}</p>
                      <div className="mt-1.5"><SmallButton onClick={() => onInsert(p)}><Plus size={11} /> Insert</SmallButton></div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {tab === "notes" && (
          <>
            <ul className="flex flex-col gap-1.5">
              {s.notes.map((n, i) => (
                <li key={`${i}-${n}`} className="group flex items-start gap-2 rounded-md bg-paper px-2 py-1.5 text-[0.76rem] leading-relaxed text-ink-soft">
                  <span className="flex-1">{n}</span>
                  <button type="button" aria-label="Remove note" onClick={() => onNotes(s.notes.filter((_, j) => j !== i))} className="text-mist hover:text-danger cursor-pointer">
                    <X size={12} />
                  </button>
                </li>
              ))}
              {s.notes.length === 0 && <li className="text-[0.74rem] text-mist">Word studies, commentary, and ideas go here.</li>}
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); addNote(); }} className="flex gap-1.5">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a study note" aria-label="Add a study note" className={cn(inputClass, "h-8 text-[0.78rem]")} />
              <SmallButton onClick={addNote} disabled={!note.trim()}>Add note</SmallButton>
            </form>
            {seriesNotes && (
              <div className="border-t border-rule pt-2.5">
                <div className="text-[0.7rem] font-medium text-mist">Series notes</div>
                <p className="mt-1 text-[0.74rem] leading-relaxed text-graphite">{seriesNotes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function ThreadCard({ t, context, onReply, onToggle, onOpen }: { t: Thread; context: string; onReply: (text: string) => void; onToggle: () => void; onOpen?: () => void }) {
  const [reply, setReply] = useState("");
  const send = () => {
    if (!reply.trim()) return;
    onReply(reply.trim());
    setReply("");
  };
  return (
    <li className={cn("bg-sheet border border-rule rounded-lg p-3 list-none", t.resolved && "opacity-75")}>
      <div className="flex items-center gap-2">
        <Avatar name={t.author} size={24} />
        <span className="text-[0.8rem] font-medium text-ink">{t.author}</span>
        <span className="text-[0.68rem] text-mist">{t.when}</span>
        <span className="ml-auto">{t.resolved ? <Status tone="good">Resolved</Status> : <Status tone="warn">Open</Status>}</span>
      </div>
      <div className="mt-2 text-[0.7rem] text-mist">{context}</div>
      <p className="mt-0.5 text-[0.82rem] leading-relaxed text-ink-soft">{t.text}</p>
      {t.replies.map((r) => (
        <div key={r.id} className="mt-2 ml-3 pl-2.5 border-l-2 border-rule">
          <span className="text-[0.74rem] font-medium text-ink">{r.author}</span> <span className="text-[0.66rem] text-mist">{r.when}</span>
          <p className="text-[0.78rem] text-ink-soft">{r.text}</p>
        </div>
      ))}
      {!t.resolved && (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-2.5 flex gap-1.5">
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply" aria-label={`Reply to ${t.author}`} className={cn(inputClass, "h-8 text-[0.78rem]")} />
          <SmallButton onClick={send} disabled={!reply.trim()}>Reply</SmallButton>
        </form>
      )}
      <div className="mt-2.5 flex flex-wrap gap-2">
        <SmallButton onClick={onToggle}>{t.resolved ? <><RotateCcw size={11} /> Reopen</> : <><Check size={12} /> Resolve</>}</SmallButton>
        {onOpen && <SmallButton onClick={onOpen}>Open draft</SmallButton>}
      </div>
    </li>
  );
}

// Large-type teleprompter: one block at a time, a running clock, and pace against the plan.
const TITLE_SIZES = ["text-[1.45rem]", "text-[1.9rem]", "text-[2.35rem]"];
const BODY_SIZES = ["text-[0.95rem]", "text-[1.12rem]", "text-[1.3rem]"];

function PreachMode({ s, seriesTitle, onEnd }: { s: Sermon; seriesTitle: string; onEnd: (secs: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const [size, setSize] = useState(1);
  const count = s.blocks.length;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSecs((x) => x + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("input, textarea, select")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") setIdx((i) => Math.min(count - 1, i + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  if (!count) return <Panel title="Preaching mode"><p className="text-[0.8rem] text-graphite">Add blocks to the outline first.</p></Panel>;
  const b = s.blocks[Math.min(idx, count - 1)];
  const planned = s.blocks.slice(0, idx + 1).reduce((n, x) => n + x.minutes, 0) * 60;
  const over = secs - planned;
  const nextB = s.blocks[idx + 1];
  const dark = "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sheet/10 text-sheet text-[0.76rem] font-medium hover:bg-sheet/20 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors";

  return (
    <div className="h-[32rem] rounded-lg bg-ink text-sheet flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-sheet/10">
        <span className="min-w-0 flex-1 text-[0.72rem] text-sheet/60 truncate">{seriesTitle} · {s.title}</span>
        <span className="font-mono text-[1.2rem] font-semibold tabular-nums">{mmss(secs)}</span>
        <span className="text-[0.7rem] text-sheet/50">of {s.target}:00</span>
        <span className={cn("px-1.5 py-0.5 rounded text-[0.66rem] font-semibold", !secs ? "bg-sheet/10 text-sheet/60" : over > 0 ? "bg-warn text-sheet" : "bg-good text-sheet")}>{!secs ? "Not started" : over > 0 ? `${mmss(over)} over` : "On pace"}</span>
        <button type="button" onClick={() => setRunning((r) => !r)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-sheet text-ink text-[0.76rem] font-semibold cursor-pointer">
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? "Pause" : secs ? "Resume" : "Start timer"}
        </button>
        <button type="button" onClick={() => { setRunning(false); setSecs(0); }} className={dark} aria-label="Reset timer"><RotateCcw size={13} /></button>
        <button type="button" onClick={() => setSize((x) => Math.max(0, x - 1))} disabled={size === 0} className={dark} aria-label="Smaller text"><AArrowDown size={14} /></button>
        <button type="button" onClick={() => setSize((x) => Math.min(2, x + 1))} disabled={size === 2} className={dark} aria-label="Larger text"><AArrowUp size={14} /></button>
        <button type="button" onClick={() => onEnd(secs)} className={dark}>End</button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 py-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="text-[0.74rem] font-semibold text-sheet/55">{labelOf(s.blocks, idx)} · {b.minutes} min planned</div>
            <div className={cn("mt-2 font-semibold leading-tight tracking-[-0.01em]", TITLE_SIZES[size])}>{b.title || "Untitled"}</div>
            {b.body && <p className={cn("mt-4 leading-relaxed text-sheet/80 max-w-[44rem]", BODY_SIZES[size], b.kind === "scripture" && "italic")}>{b.body}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-4 pt-2.5 pb-3 border-t border-sheet/10">
        <div className="flex gap-1 mb-2.5">
          {s.blocks.map((x, i) => (
            <button key={x.id} type="button" aria-label={`Go to ${labelOf(s.blocks, i)}`} onClick={() => setIdx(i)} style={{ flexGrow: x.minutes }} className={cn("h-1.5 basis-0 rounded-full cursor-pointer transition-colors", i === idx ? "bg-sheet" : i < idx ? "bg-sheet/50" : "bg-sheet/15 hover:bg-sheet/30")} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className={dark}><ChevronLeft size={14} /> Previous</button>
          <span className="flex-1 min-w-0 text-center text-[0.72rem] text-sheet/60 truncate">{nextB ? `Up next: ${labelOf(s.blocks, idx + 1)} · ${nextB.title}` : "Last block. End to save your run time."}</span>
          {nextB ? (
            <button type="button" onClick={() => setIdx((i) => Math.min(count - 1, i + 1))} className={dark}>Next <ChevronRight size={14} /></button>
          ) : (
            <button type="button" onClick={() => onEnd(secs)} className={dark}>Finish <Check size={13} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- The app --------------------------------------------------------------------------------

export function SermonMakerPrototype() {
  const app = useProtoApp("week");
  const [sermons, setSermons] = useState(SERMONS);
  const [series, setSeries] = useState(SERIES);
  const [threads, setThreads] = useState(THREADS);
  const [ills, setIlls] = useState(ILLUSTRATIONS);
  const [sent, setSent] = useState(SENT);

  // Editor
  const [tab, setTab] = useState<Tab>("outline");
  const [entryTab, setEntryTab] = useState<Tab>("outline");
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [slideTheme, setSlideTheme] = useState<SlideTheme>("dark");
  const [slideSel, setSlideSel] = useState(0);
  const [answers, setAnswers] = useState(false);
  const [drafting, setDrafting] = useState<{ id: string; what: "summary" | "questions" } | null>(null);
  const [rounds, setRounds] = useState<Record<string, number>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  // Lists and filters
  const [sFilter, setSFilter] = useState<"all" | SermonStatus>("all");
  const [sQuery, setSQuery] = useState("");
  const [sWho, setSWho] = useState("");
  const [planView, setPlanView] = useState<"list" | "month">("list");
  const [planWho, setPlanWho] = useState("");
  const [month, setMonth] = useState(0);
  const [illQuery, setIllQuery] = useState("");
  const [illTag, setIllTag] = useState("");
  const [illUse, setIllUse] = useState<"all" | "unused">("all");
  const [reviewFilter, setReviewFilter] = useState<"open" | "resolved" | "all">("open");
  const [libQuery, setLibQuery] = useState("");
  const [libWho, setLibWho] = useState("");
  const [libBook, setLibBook] = useState("");
  const [exportId, setExportId] = useState("u4");
  const [outputs, setOutputs] = useState<Record<OutputId, boolean>>({ slides: true, handout: true, guide: true, notes: true });
  const [slideFormat, setSlideFormat] = useState("PPTX");
  const [copies, setCopies] = useState("180");
  const [exportNote, setExportNote] = useState("");

  // Slide-overs
  const [modal, setModal] = useState<Modal | null>(null);
  const [newDraft, setNewDraft] = useState({ date: "", seriesId: "phil", title: "", passage: "", preacher: "", go: false });
  const [seriesDraft, setSeriesDraft] = useState({ title: "", book: "James", start: "2027-01-10", weeks: "3", keyVerse: "James 1:22" });
  const [reviewDraft, setReviewDraft] = useState({ reviewer: "Pastor Joel", due: "Fri, Oct 30", note: "" });
  const [commentDraft, setCommentDraft] = useState({ blockId: "", text: "" });
  const [commentBlock, setCommentBlock] = useState<string | null>(null);
  const [reuseDraft, setReuseDraft] = useState({ id: "", date: "", preacher: ME, questions: true, notes: true });
  const [illDraft, setIllDraft] = useState({ id: "", title: "", source: "Personal", tags: "", body: "" });
  const [insertDraft, setInsertDraft] = useState({ illId: "", sermonId: "u4", after: "" });
  const [pickQuery, setPickQuery] = useState("");

  // Entering a sermon (by click or by the guided tour) starts on the chosen tab.
  const sermonKey = app.screen === "sermon" ? (app.id ?? "") : "";
  const [lastSermon, setLastSermon] = useState(sermonKey);
  if (sermonKey !== lastSermon) {
    setLastSermon(sermonKey);
    if (sermonKey) {
      setTab(entryTab);
      setEntryTab("outline");
      setActiveBlock(null);
      setSlideSel(0);
    }
  }

  const byDate = (a: Sermon, b: Sermon) => (a.date || "9999").localeCompare(b.date || "9999");
  const sorted = [...sermons].sort(byDate);
  const upcoming = sorted.filter((s) => s.status !== "Preached");
  const preached = sorted.filter((s) => s.status === "Preached").reverse();
  const next = upcoming.find((s) => s.date >= TODAY) ?? upcoming[0];
  const sermonOn = (d: string) => sermons.find((s) => s.date === d);
  const sermon = (id: string) => sermons.find((s) => s.id === id);
  const openSundays = SUNDAYS.filter((d) => !sermonOn(d));
  const unassigned = upcoming.filter((s) => s.date && !s.preacher);
  const seriesOf = (s: Sermon) => series.find((x) => x.id === s.seriesId);
  const inSeries = (id: string) => sorted.filter((s) => s.seriesId === id);
  const openThreads = (id: string) => threads.filter((t) => t.sermonId === id && !t.resolved);
  const reviewQueue = upcoming.filter((s) => s.status === "In review" && s.reviewer === ME);
  const myOpen = threads.filter((t) => !t.resolved && sermon(t.sermonId)?.preacher === ME && t.author !== ME);

  const update = (id: string, fn: (s: Sermon) => Sermon) => setSermons((l) => l.map((s) => (s.id === id ? fn(s) : s)));
  const setBlocks = (id: string, fn: (b: Block[]) => Block[]) => update(id, (s) => ({ ...s, blocks: fn(s.blocks), status: s.status === "Planned" ? "Draft" : s.status }));
  const editBlock = (sid: string, bid: string, patch: Partial<Block>) => setBlocks(sid, (l) => l.map((b) => (b.id === bid ? { ...b, ...patch } : b)));
  const insertBlock = (sid: string, block: Block, after: string | null) =>
    setBlocks(sid, (l) => {
      const i = after ? l.findIndex((b) => b.id === after) : -1;
      return i < 0 ? [...l, block] : [...l.slice(0, i + 1), block, ...l.slice(i + 1)];
    });
  // New blocks land after the selected block, or after the last point.
  const anchorFor = (s: Sermon) => (activeBlock && s.blocks.some((b) => b.id === activeBlock) ? activeBlock : ([...s.blocks].reverse().find((b) => b.kind === "point")?.id ?? s.blocks[s.blocks.length - 1]?.id ?? null));
  const afterLabel = (s: Sermon, after: string | null) => {
    const i = after ? s.blocks.findIndex((b) => b.id === after) : -1;
    return i >= 0 ? `after ${labelOf(s.blocks, i)}` : "at the end";
  };
  const blockLabel = (s: Sermon | undefined, blockId: string) => {
    if (!s || !blockId) return "Whole sermon";
    const i = s.blocks.findIndex((b) => b.id === blockId);
    return i < 0 ? "Removed block" : `${labelOf(s.blocks, i)} · ${s.blocks[i].title || "Untitled"}`;
  };

  const openSermon = (s: Sermon, to: Tab = "outline") => {
    setEntryTab(to);
    app.open("sermon", s.id, s.title || "Untitled sermon");
  };
  // Its own path id, so the editor (/week/u4) and preaching mode (/week/u4-preach) differ.
  const preach = (s: Sermon) => app.open("preach", `${s.id}-preach`, "Preaching mode");
  const endPreach = (s: Sermon, secs: number) => {
    if (secs) update(s.id, (x) => ({ ...x, rehearsal: secs }));
    app.back();
    app.notify(secs ? `Run time saved: ${mmss(secs)} against ${s.target} minutes` : "Preaching mode closed");
  };

  const checks = (s: Sermon) => [
    { label: "Big idea written", ok: !!s.bigIdea.trim() },
    { label: "Three or more points", ok: pointsOf(s).length >= 3 },
    { label: "Scripture in the outline", ok: s.blocks.some((b) => b.kind === "scripture" && b.body) },
    { label: `Fits in ${s.target} minutes`, ok: minutesOf(s) > 0 && minutesOf(s) <= s.target },
    { label: "Review comments resolved", ok: openThreads(s.id).length === 0 },
    { label: "Group questions reviewed", ok: s.questions.length > 0 && s.questions.every((q) => !q.draft) },
    { label: "Sent to the teams", ok: sent.some((x) => x.sermonId === s.id) },
  ];

  const draft = (s: Sermon, what: "summary" | "questions") => {
    const key = `${s.id}-${what}`;
    const round = rounds[key] ?? 0;
    setDrafting({ id: s.id, what });
    window.setTimeout(() => {
      update(s.id, (x) => {
        if (what === "summary") return { ...x, summary: summaryFor(x, round), summaryDraft: true };
        // Redrafting keeps the questions the pastor already reviewed.
        const kept = x.questions.filter((q) => !q.draft);
        const fresh = questionsFor(x, round).filter((q) => !kept.some((k) => k.text === q.text));
        return { ...x, questions: [...kept, ...fresh.slice(0, Math.max(2, 6 - kept.length))] };
      });
      setRounds((r) => ({ ...r, [key]: round + 1 }));
      setDrafting(null);
    }, 850);
  };

  const markReady = (s: Sermon) => {
    const open = openThreads(s.id).length;
    if (open) {
      setCommentBlock(null);
      setCommentDraft({ blockId: "", text: "" });
      setModal("comments");
      app.notify(`Resolve ${open} open ${open === 1 ? "comment" : "comments"} first`);
      return;
    }
    if (!s.bigIdea.trim() || !pointsOf(s).length) return app.notify("Add a big idea and at least one point first");
    update(s.id, (x) => ({ ...x, status: "Ready" }));
    app.notify("Marked ready. The media team can see the slides.");
  };

  const assign = (s: Sermon, preacher: string) => {
    update(s.id, (x) => ({ ...x, preacher }));
    const away = preacher && awayOn(preacher, s.date);
    app.notify(!preacher ? `${fmt(s.date)} has no preacher now` : away ? `${preacher} assigned, but marked away that day (${away})` : `${preacher} is preaching ${fmt(s.date)}. Calendar invite sent.`);
  };

  const openNew = (preset: Partial<typeof newDraft> = {}) => {
    setNewDraft({ date: openSundays[0] ?? "", seriesId: "phil", title: "", passage: "", preacher: "", go: false, ...preset });
    setModal("new");
  };
  const createSermon = () => {
    const d = newDraft;
    if (!d.title.trim()) return;
    const s = S(`n${Date.now()}`, d.seriesId, d.date, d.passage.trim() || (series.find((x) => x.id === d.seriesId)?.book ?? ""), d.title.trim(), d.preacher, "", "", [], { studyRef: lookup(d.passage)?.ref ?? "" });
    setSermons((l) => [...l, s]);
    setModal(null);
    app.notify(d.date ? `${fmt(d.date)} planned: ${s.title}${d.preacher ? ` with ${d.preacher}` : ""}` : `${s.title} saved without a date`);
    if (d.go) openSermon(s);
  };

  const createSeries = () => {
    const d = seriesDraft;
    const title = d.title.trim();
    if (!title) return;
    const id = `sr${Date.now()}`;
    const dates = openSundays.filter((x) => x >= d.start).slice(0, Number(d.weeks));
    setSeries((l) => [...l, { id, title, book: d.book, notes: "", keyVerse: lookup(d.keyVerse)?.ref ?? "" }]);
    setSermons((l) => [...l, ...dates.map((date, i) => S(`${id}-${i}`, id, date, d.book, `Week ${i + 1}`, "", ""))]);
    setModal(null);
    setSeriesDraft({ title: "", book: "James", start: "2027-01-10", weeks: "3", keyVerse: "James 1:22" });
    app.notify(`${title} created${dates.length ? ` on ${dates.length} open ${dates.length === 1 ? "Sunday" : "Sundays"}` : ""}`);
    app.open("series-detail", id, title);
  };

  const openRequest = (s: Sermon) => {
    setReviewDraft({ reviewer: PREACHERS.find((p) => p.name !== s.preacher)?.name ?? "Pastor Joel", due: "Fri, Oct 30", note: "" });
    setModal("request");
  };
  const requestReview = (s: Sermon) => {
    update(s.id, (x) => ({ ...x, status: "In review", reviewer: reviewDraft.reviewer }));
    setModal(null);
    app.notify(`Sent to ${reviewDraft.reviewer} for review by ${reviewDraft.due}`);
  };

  const openComments = (blockId: string | null = null) => {
    setCommentBlock(blockId);
    setCommentDraft({ blockId: blockId ?? "", text: "" });
    setModal("comments");
  };
  const addComment = (s: Sermon) => {
    if (!commentDraft.text.trim()) return;
    setThreads((l) => [...l, { id: `t${Date.now()}`, sermonId: s.id, blockId: commentDraft.blockId, author: ME, text: commentDraft.text.trim(), when: "Today, just now", resolved: false, replies: [] }]);
    setCommentDraft({ ...commentDraft, text: "" });
    app.notify(s.preacher && s.preacher !== ME ? `Comment added. ${s.preacher} will see it.` : "Comment added");
  };
  const replyTo = (t: Thread, text: string) => {
    setThreads((l) => l.map((x) => (x.id === t.id ? { ...x, replies: [...x.replies, { id: `r${Date.now()}`, author: ME, text, when: "Just now" }] } : x)));
    app.notify(t.author !== ME ? `Reply sent to ${t.author}` : "Reply added");
  };
  const toggleThread = (t: Thread) => {
    setThreads((l) => l.map((x) => (x.id === t.id ? { ...x, resolved: !x.resolved } : x)));
    app.notify(t.resolved ? "Comment reopened" : "Comment resolved");
  };

  const openReuse = (s: Sermon) => {
    setReuseDraft({ id: s.id, date: openSundays[0] ?? "", preacher: ME, questions: true, notes: true });
    setModal("reuse");
  };
  const reuse = () => {
    const src = sermon(reuseDraft.id);
    if (!src) return;
    const id = `re${Date.now()}`;
    const copy: Sermon = {
      ...src, id, seriesId: "single", date: reuseDraft.date, preacher: reuseDraft.preacher, status: "Draft", reviewer: "", reuseOf: src.id, rehearsal: undefined, summary: "", summaryDraft: false,
      blocks: src.blocks.map((b) => ({ ...b, id: `${b.id}-${id}` })),
      questions: reuseDraft.questions ? src.questions.map((q) => ({ ...q, id: `${q.id}-${id}` })) : [],
      notes: reuseDraft.notes ? [...src.notes] : [],
    };
    setSermons((l) => [...l, copy]);
    setModal(null);
    app.notify(`Copied to ${reuseDraft.date ? fmt(reuseDraft.date) : "drafts"} as a new draft`);
    openSermon(copy);
  };

  const openIll = (il?: Illustration) => {
    setIllDraft(il ? { id: il.id, title: il.title, source: il.source, tags: il.tags.join(", "), body: il.body } : { id: "", title: "", source: "Personal", tags: "", body: "" });
    setModal("ill");
  };
  const saveIll = () => {
    const d = illDraft;
    if (!d.title.trim() || !d.body.trim()) return;
    const tags = d.tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (d.id) setIlls((l) => l.map((x) => (x.id === d.id ? { ...x, title: d.title.trim(), source: d.source, tags, body: d.body.trim() } : x)));
    else {
      setIlls((l) => [{ id: `i${Date.now()}`, title: d.title.trim(), source: d.source, tags, body: d.body.trim(), used: [] }, ...l]);
      // Clear filters so the new one is visible at the top.
      setIllTag("");
      setIllQuery("");
      setIllUse("all");
    }
    setModal(null);
    app.notify(d.id ? "Illustration saved" : `${d.title.trim()} added to the library`);
  };
  const insertIll = (il: Illustration, s: Sermon, after: string | null) => {
    const id = `b${Date.now()}`;
    insertBlock(s.id, { id, kind: "illustration", title: il.title, body: il.body, minutes: 3, slide: false }, after);
    setIlls((l) => l.map((x) => (x.id === il.id && !x.used.includes(s.id) ? { ...x, used: [...x.used, s.id] } : x)));
    app.notify(`${il.title} inserted into ${s.title} ${afterLabel(s, after)}`);
    return id;
  };
  const openInsert = (il: Illustration) => {
    setInsertDraft({ illId: il.id, sermonId: next.id, after: anchorFor(next) ?? "" });
    setModal("ill-insert");
  };
  const lastUse = (il: Illustration) => il.used.map(sermon).filter((s): s is Sermon => !!s && s.status === "Preached").sort(byDate).pop();
  const plannedUse = (il: Illustration) => il.used.map(sermon).find((s): s is Sermon => !!s && s.status !== "Preached");

  const insertPassage = (s: Sermon, p: Passage) => {
    const after = anchorFor(s);
    const id = `b${Date.now()}`;
    insertBlock(s.id, { id, kind: "scripture", title: p.ref, body: textOf(p), minutes: 2, slide: true }, after);
    setActiveBlock(id);
    app.notify(`${p.ref} inserted ${afterLabel(s, after)}`);
  };
  const addBlock = (s: Sermon, kind: Kind) => {
    const b = blk(kind, "");
    const id = b.id;
    const after = activeBlock && s.blocks.some((x) => x.id === activeBlock) ? activeBlock : null;
    insertBlock(s.id, b, after);
    setFocusId(id);
    setActiveBlock(id);
  };

  const nav = [
    { id: "week", label: "This Sunday", icon: CalendarCheck },
    { id: "sermons", label: "Sermons", icon: PenLine },
    { id: "plan", label: "Calendar", icon: CalendarDays, badge: openSundays.length + unassigned.length },
    { id: "series", label: "Series", icon: Layers },
    { id: "illustrations", label: "Illustrations", icon: Lightbulb },
    { id: "review", label: "Review", icon: MessagesSquare, badge: myOpen.length + reviewQueue.length },
    { id: "library", label: "Library", icon: Library },
    { id: "export", label: "Export", icon: Send },
  ];

  const cur = app.screen === "sermon" || app.screen === "preach" ? sermon((app.id ?? "").replace(/-preach$/, "")) : undefined;
  const sr = app.screen === "series-detail" ? series.find((s) => s.id === app.id) : undefined;
  const il = app.screen === "illustration" ? ills.find((x) => x.id === app.id) : undefined;
  const ilLast = il ? lastUse(il) : undefined;
  const curOpen = cur ? openThreads(cur.id) : [];

  // This Sunday
  const nextChecks = checks(next);
  const nextDone = nextChecks.filter((c) => c.ok).length;
  const nextWeek = inSeries(next.seriesId);
  const nextOpen = openThreads(next.id);

  // Sermons list
  const sermonRows = upcoming.filter((s) => (sFilter === "all" || s.status === sFilter) && (!sWho || s.preacher === sWho) && `${s.title} ${s.passage} ${s.preacher}`.toLowerCase().includes(sQuery.trim().toLowerCase()));

  // Illustrations
  const tagCounts = Object.entries(ills.flatMap((x) => x.tags).reduce<Record<string, number>>((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const illRows = ills.filter((x) => (!illTag || x.tags.includes(illTag)) && (illUse === "all" || !x.used.length) && `${x.title} ${x.body} ${x.tags.join(" ")}`.toLowerCase().includes(illQuery.trim().toLowerCase()));
  const pickRows = ills.filter((x) => `${x.title} ${x.tags.join(" ")}`.toLowerCase().includes(pickQuery.trim().toLowerCase()));

  // Review
  const reviewThreads = threads.filter((t) => reviewFilter === "all" || (reviewFilter === "open" ? !t.resolved : t.resolved));
  const reviewGroups = sorted.filter((s) => reviewThreads.some((t) => t.sermonId === s.id)).map((s) => ({ s, list: reviewThreads.filter((t) => t.sermonId === s.id) }));

  // Library
  const norm = (v: string) => v.toLowerCase().replace(/[–—]/g, "-");
  const bookOf = (s: Sermon) => s.passage.split(" ").slice(0, -1).join(" ") || s.passage;
  const books = Object.entries(preached.reduce<Record<string, number>>((m, s) => ({ ...m, [bookOf(s)]: (m[bookOf(s)] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const topics = Object.entries(preached.flatMap((s) => s.topics).reduce<Record<string, number>>((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 9);
  const libRows = preached.filter((s) => (!libWho || s.preacher === libWho) && (!libBook || bookOf(s) === libBook) && norm(`${s.title} ${s.passage} ${s.topics.join(" ")} ${s.preacher} ${seriesOf(s)?.title ?? ""}`).includes(norm(libQuery.trim())));

  // Export
  const ex = sermon(exportId) ?? next;
  const exportChoices = [...upcoming.filter((s) => s.date), ...preached.slice(0, 3)];
  if (!exportChoices.includes(ex)) exportChoices.push(ex);
  const guideReady = ex.questions.length > 0 && ex.questions.every((q) => !q.draft);
  const blockedOut = (o: OutputId) => !ex.blocks.length || (o === "guide" && !guideReady);
  const picked = OUTPUTS.filter((o) => outputs[o.id] && !blockedOut(o.id));
  const send = () => {
    if (!picked.length) return;
    setSent((l) => [...picked.map((o, i) => ({ id: `x${Date.now()}-${i}`, when: "Today, just now", sermonId: ex.id, what: o.label, to: o.to })), ...l]);
    app.notify(picked.length === 1 ? `${picked[0].label} sent to the ${picked[0].to.toLowerCase()}` : `${picked.length} outputs sent for ${fmt(ex.date)}. Each team was notified.`);
  };

  const insertTarget = sermon(insertDraft.sermonId);
  const insertIllustration = ills.find((x) => x.id === insertDraft.illId);
  const reuseSrc = sermon(reuseDraft.id);

  return (
    <ProtoApp app={app} name="Sermon Maker · Grace Fellowship" user="Pastor Dan Castillo" nav={nav} alerts={myOpen.length + reviewQueue.length}>
      {app.screen === "week" && (
        <>
          <ScreenHeader
            title="This Sunday"
            subtitle={`${fmt(next.date)} · ${next.preacher || "No preacher yet"} · ${seriesOf(next)?.title ?? ""}, week ${nextWeek.findIndex((s) => s.id === next.id) + 1} of ${nextWeek.length}`}
            action={
              <>
                <SmallButton onClick={() => preach(next)} disabled={!next.blocks.length}><Presentation size={12} /> Preach</SmallButton>
                <PrimaryButton onClick={() => openSermon(next)}><PenLine size={14} /> Open editor</PrimaryButton>
              </>
            }
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Ready for Sunday" value={`${nextDone}/${nextChecks.length}`} sub="Slides due Friday, 6 PM" tone={nextDone === nextChecks.length ? "good" : undefined} />
            <Stat label="Length" value={`${minutesOf(next)} min`} sub={next.rehearsal ? `Target ${next.target} · last run ${mmss(next.rehearsal)}` : `Target ${next.target} min`} />
            <Stat label="Open comments" value={String(nextOpen.length)} sub={nextOpen.length ? `From ${[...new Set(nextOpen.map((t) => t.author))].join(" and ")}` : "All resolved"} tone={nextOpen.length ? "bad" : "good"} />
            <Stat label="Open Sundays" value={String(openSundays.length)} sub="Through Jan 24" tone={openSundays.length ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3">
            <Panel title={next.title} action={<SermonState s={next} />}>
              <div className="text-[0.75rem] text-mist">{next.passage}</div>
              {next.bigIdea && <p className="mt-2 border-l-2 border-gold pl-2.5 text-[0.86rem] text-ink">{next.bigIdea}</p>}
              <ol className="mt-3 flex flex-col gap-1">
                {next.blocks.map((b, i) => (
                  <li key={b.id} className="flex items-center gap-2 text-[0.78rem]">
                    <span className={cn("w-[5.5rem] shrink-0 px-1.5 py-0.5 rounded text-[0.64rem] font-semibold", KINDS[b.kind].tone)}>{labelOf(next.blocks, i)}</span>
                    <span className="flex-1 min-w-0 truncate text-ink-soft">{b.title}</span>
                    <span className="font-mono text-[0.68rem] text-mist">{b.minutes}m</span>
                  </li>
                ))}
                {next.blocks.length === 0 && <li className="text-[0.78rem] text-graphite">No outline yet.</li>}
              </ol>
              <div className="flex flex-wrap gap-2 mt-4">
                <SmallButton onClick={() => openSermon(next, "outline")}>Edit outline</SmallButton>
                <SmallButton onClick={() => openSermon(next, "slides")}>Preview slides</SmallButton>
                <SmallButton onClick={() => openSermon(next, "handout")}>Preview handout</SmallButton>
                <SmallButton onClick={() => openSermon(next, "guide")}>Group guide</SmallButton>
              </div>
            </Panel>
            <div className="flex flex-col gap-3">
              <Panel title="Ready by Friday">
                <Meter value={nextDone} max={nextChecks.length} className="mb-3" />
                <ul className="flex flex-col gap-1.5">
                  {nextChecks.map((c) => (
                    <li key={c.label}><Status tone={c.ok ? "good" : "warn"}>{c.label}</Status></li>
                  ))}
                </ul>
                <p className="text-[0.68rem] text-mist mt-3">Slides to media by Friday 6 PM. Handout to print by Saturday 10 AM.</p>
              </Panel>
              <Panel title="Coming up" action={<SmallButton onClick={() => app.section("plan")}>Calendar</SmallButton>}>
                <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
                  {upcoming.filter((s) => s.date && s.id !== next.id).slice(0, 4).map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => openSermon(s)} className="group w-full flex items-center gap-2.5 py-1.5 text-left cursor-pointer">
                        <span className="w-12 font-mono text-[0.7rem] text-graphite">{fmt(s.date)}</span>
                        <span className="flex-1 min-w-0 truncate text-[0.78rem] text-ink group-hover:text-gold">{s.title}</span>
                        {s.preacher ? <span className="text-[0.7rem] text-mist">{s.preacher}</span> : <Status tone="bad">No preacher</Status>}
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}

      {app.screen === "sermons" && (
        <>
          <ScreenHeader title="Sermons" subtitle={`${upcoming.length} sermons in progress · ${upcoming.filter((s) => s.status === "In review").length} in review`} action={<PrimaryButton onClick={() => openNew({ go: true })}><Plus size={14} /> New sermon</PrimaryButton>} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SearchBox value={sQuery} onChange={setSQuery} placeholder="Search title, passage, or preacher" label="Search sermons" />
            <select aria-label="Preacher" value={sWho} onChange={(e) => setSWho(e.target.value)} className={cn(selectClass, "h-9")}>
              <option value="">All preachers</option>
              {PREACHERS.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="mb-3 overflow-x-auto">
            <Segmented id="sm-status" value={sFilter} onChange={setSFilter} options={[{ id: "all", label: "All" }, { id: "Planned", label: "Not started" }, { id: "Draft", label: "Draft" }, { id: "In review", label: "In review" }, { id: "Ready", label: "Ready" }]} />
          </div>
          <Table
            rows={sermonRows}
            rowKey={(s) => s.id}
            onRowClick={(s) => openSermon(s)}
            empty="No sermons match these filters."
            columns={[
              { key: "date", label: "Sunday", render: (s) => <span className="font-mono text-[0.74rem]">{fmt(s.date)}</span> },
              { key: "title", label: "Sermon", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.passage} · {seriesOf(s)?.title}</span></span> },
              { key: "who", label: "Preacher", hideOnMobile: true, render: (s) => s.preacher || <span className="text-danger">Unassigned</span> },
              { key: "len", label: "Length", hideOnMobile: true, render: (s) => <span className={cn("font-mono text-[0.72rem]", minutesOf(s) > s.target && "text-warn")}>{minutesOf(s)}/{s.target} min</span> },
              { key: "comments", label: "Comments", hideOnMobile: true, render: (s) => (openThreads(s.id).length ? <span className="inline-flex items-center gap-1 text-warn"><MessageSquare size={12} /> {openThreads(s.id).length} open</span> : <span className="text-mist">None</span>) },
              { key: "state", label: "Status", render: (s) => <SermonState s={s} /> },
            ]}
          />
        </>
      )}

      {app.screen === "sermon" && cur && (
        <>
          <ScreenHeader
            title={cur.title || "Untitled sermon"}
            subtitle={`${cur.passage} · ${fmt(cur.date)} · ${cur.preacher || "No preacher yet"}${cur.status === "In review" ? ` · In review with ${cur.reviewer}` : ""}`}
            action={
              <>
                <SmallButton onClick={() => openComments()}><MessageSquare size={12} /> Comments{curOpen.length ? ` · ${curOpen.length}` : ""}</SmallButton>
                <SmallButton onClick={() => preach(cur)} disabled={!cur.blocks.length}><Presentation size={12} /> Preach</SmallButton>
                {cur.status === "Preached" ? (
                  <PrimaryButton onClick={() => openReuse(cur)}><Copy size={13} /> Reuse sermon</PrimaryButton>
                ) : cur.status === "Ready" ? (
                  <>
                    <SmallButton onClick={() => update(cur.id, (s) => ({ ...s, status: "Draft" }))}>Back to draft</SmallButton>
                    <PrimaryButton onClick={() => { setExportId(cur.id); app.section("export"); }}><Send size={13} /> Export</PrimaryButton>
                  </>
                ) : (
                  <>
                    {cur.status !== "In review" && <SmallButton onClick={() => openRequest(cur)}>Request review</SmallButton>}
                    <PrimaryButton onClick={() => markReady(cur)}>Mark ready</PrimaryButton>
                  </>
                )}
              </>
            }
          />
          {(cur.status === "Preached" || cur.reuseOf) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-rule bg-sheet px-3 py-2 text-[0.76rem] text-ink-soft">
              {cur.status === "Preached" ? `Preached ${fmt(cur.date)} by ${cur.preacher}. Reuse it to preach again on an open Sunday.` : `Copied from "${sermon(cur.reuseOf ?? "")?.title}", preached ${fmt(sermon(cur.reuseOf ?? "")?.date ?? "")}.`}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <Segmented id="sm-tab" value={tab} onChange={setTab} options={[{ id: "outline", label: "Outline" }, { id: "slides", label: "Slides" }, { id: "handout", label: "Handout" }, { id: "guide", label: "Group guide" }]} />
            <SermonState s={cur} />
          </div>

          {tab === "outline" && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16.5rem] gap-3 items-start">
              <div className="min-w-0 flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_13rem] gap-3">
                  <Field label="Title"><input value={cur.title} onChange={(e) => update(cur.id, (s) => ({ ...s, title: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Passage"><input value={cur.passage} onChange={(e) => update(cur.id, (s) => ({ ...s, passage: e.target.value }))} className={inputClass} /></Field>
                </div>
                <Field label="Big idea">
                  <textarea value={cur.bigIdea} onChange={(e) => update(cur.id, (s) => ({ ...s, bigIdea: e.target.value }))} rows={2} placeholder="One sentence people can repeat on Monday" className={cn(textareaClass, "min-h-0 resize-none")} />
                </Field>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[0.72rem] text-mist mr-0.5">Add</span>
                  {KIND_ORDER.map((k) => (
                    <SmallButton key={k} onClick={() => addBlock(cur, k)}><Plus size={11} /> {KINDS[k].label}</SmallButton>
                  ))}
                  <SmallButton onClick={() => { setPickQuery(""); setModal("ill-pick"); }}><Lightbulb size={12} /> From library</SmallButton>
                  <span className="ml-auto flex items-center gap-1.5 text-[0.72rem] text-mist">
                    <span className={cn("font-mono", minutesOf(cur) > cur.target ? "text-warn" : "text-ink-soft")}>{minutesOf(cur)} min</span> of
                    <select aria-label="Target length" value={cur.target} onChange={(e) => update(cur.id, (s) => ({ ...s, target: Number(e.target.value) }))} className={cn(selectClass, "h-7")}>
                      {[20, 25, 30, 35, 40, 45].map((m) => <option key={m} value={m}>{m} min</option>)}
                    </select>
                  </span>
                </div>
                <Reorder.Group axis="y" values={cur.blocks} onReorder={(order: Block[]) => setBlocks(cur.id, () => order)} className="flex flex-col gap-2">
                  {cur.blocks.map((b, i) => (
                    <BlockCard
                      key={b.id}
                      b={b}
                      label={labelOf(cur.blocks, i)}
                      comments={curOpen.filter((t) => t.blockId === b.id).length}
                      active={activeBlock === b.id}
                      autoFocus={focusId === b.id}
                      first={i === 0}
                      last={i === cur.blocks.length - 1}
                      onChange={(patch) => editBlock(cur.id, b.id, patch)}
                      onMove={(dir) => setBlocks(cur.id, (l) => { const c = [...l]; [c[i], c[i + dir]] = [c[i + dir], c[i]]; return c; })}
                      onRemove={() => { setBlocks(cur.id, (l) => l.filter((x) => x.id !== b.id)); app.notify(`${labelOf(cur.blocks, i)} removed`); }}
                      onFocus={() => setActiveBlock(b.id)}
                      onComments={() => openComments(b.id)}
                    />
                  ))}
                </Reorder.Group>
                {cur.blocks.length === 0 && <p className="rounded-lg border border-dashed border-rule bg-sheet p-4 text-[0.78rem] text-graphite">No blocks yet. Add an intro, a point, or a passage, and the slides, handout, and guide build from them.</p>}
              </div>
              <StudyPanel key={cur.id} s={cur} seriesNotes={seriesOf(cur)?.notes ?? ""} onInsert={(p) => insertPassage(cur, p)} onNotes={(notes) => update(cur.id, (s) => ({ ...s, notes }))} />
            </div>
          )}

          {tab === "slides" && (() => {
            const slides = slidesFor(cur, seriesOf(cur)?.title);
            const at = Math.min(slideSel, slides.length - 1);
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <p className="text-[0.72rem] text-mist">{slides.length} slides from the outline. Change a point and its slide follows.</p>
                  <Segmented id="sm-theme" value={slideTheme} onChange={setSlideTheme} options={[{ id: "dark", label: "Dark" }, { id: "light", label: "Light" }, { id: "brand", label: "Series" }]} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-3 items-start">
                  <div>
                    <SlideCard slide={slides[at]} theme={slideTheme} large />
                    <div className="flex items-center justify-between mt-2">
                      <SmallButton onClick={() => setSlideSel(Math.max(0, at - 1))} disabled={at === 0}><ChevronLeft size={12} /> Prev</SmallButton>
                      <span className="text-[0.72rem] text-mist">Slide {at + 1} of {slides.length}</span>
                      <SmallButton onClick={() => setSlideSel(Math.min(slides.length - 1, at + 1))} disabled={at === slides.length - 1}>Next slide <ChevronRight size={12} /></SmallButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[22rem] overflow-y-auto p-0.5">
                    {slides.map((sl, i) => (
                      <button key={sl.id} type="button" onClick={() => setSlideSel(i)} aria-label={`Slide ${i + 1}`} className={cn("rounded-md cursor-pointer", i === at && "ring-2 ring-gold ring-offset-1")}>
                        <SlideCard slide={sl} theme={slideTheme} n={i + 1} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          {tab === "handout" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <p className="text-[0.72rem] text-mist">A5 handout from the outline. Each point blanks its fill-in word.</p>
                <Segmented id="sm-hand" value={answers ? "key" : "blank"} onChange={(v) => setAnswers(v === "key")} options={[{ id: "blank", label: "Fill-in copy" }, { id: "key", label: "Answer key" }]} />
              </div>
              <article className="mx-auto max-w-[28rem] rounded-md bg-sheet border border-rule p-6 text-ink shadow-[0_8px_24px_-12px_rgba(16,24,40,0.2)]">
                <div className="flex justify-between text-[0.62rem] text-mist"><span>Grace Fellowship · {seriesOf(cur)?.title}</span><span>{fmt(cur.date)}</span></div>
                <h5 className="text-[1.3rem] leading-tight font-semibold mt-2">{cur.title || "Untitled sermon"}</h5>
                <div className="text-[0.72rem] text-graphite mt-0.5">{cur.passage}{cur.preacher ? ` · ${cur.preacher}` : ""}</div>
                {cur.bigIdea && <p className="mt-3 rounded bg-gold-wash px-3 py-2 text-[0.78rem]">{cur.bigIdea}</p>}
                <ol className="mt-4 flex flex-col gap-4 text-[0.82rem]">
                  {pointsOf(cur).map((pt, i) => (
                    <li key={pt.id}>
                      <span className="font-semibold">{i + 1}. <Blanked text={pt.title} blank={pt.blank} show={answers} /></span>
                      <div className="mt-3.5 border-b border-dashed border-rule" />
                      <div className="mt-3.5 border-b border-dashed border-rule" />
                    </li>
                  ))}
                  {pointsOf(cur).length === 0 && <li className="text-graphite">Add points to the outline to build the handout.</li>}
                </ol>
                {cur.blocks.some((b) => b.kind === "scripture") && <div className="mt-4 text-[0.7rem] text-graphite">Read: {cur.blocks.filter((b) => b.kind === "scripture").map((b) => b.title).join("; ")}</div>}
                {cur.blocks.find((b) => b.kind === "application" && b.body) && (
                  <div className="mt-3 text-[0.74rem]"><span className="font-semibold">This week: </span>{cur.blocks.find((b) => b.kind === "application")?.body}</div>
                )}
                <div className="mt-4 pt-2 border-t border-rule text-[0.64rem] text-mist">{cur.questions.some((q) => !q.draft) ? `${cur.questions.filter((q) => !q.draft).length} group questions print on the back` : "Group questions print on the back once reviewed"}</div>
              </article>
            </>
          )}

          {tab === "guide" && (
            <>
              <p className="text-[0.72rem] text-mist mb-2.5">The sermon is yours. AI drafts the summary and questions from your outline, and nothing goes to leaders until you review it.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                <Panel title="Summary" action={cur.summary ? (cur.summaryDraft ? <AiDraft /> : <Status tone="good">Reviewed</Status>) : undefined}>
                  {drafting?.id === cur.id && drafting.what === "summary" ? (
                    <p className="text-[0.78rem] text-graphite">Drafting from the outline…</p>
                  ) : cur.summary ? (
                    <textarea aria-label="Summary" value={cur.summary} onChange={(e) => update(cur.id, (s) => ({ ...s, summary: e.target.value, summaryDraft: false }))} rows={5} className={cn(textareaClass, "resize-none")} />
                  ) : (
                    <p className="text-[0.78rem] text-graphite">No summary yet.</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <SmallButton onClick={() => draft(cur, "summary")} disabled={!!drafting || !pointsOf(cur).length}><RefreshCw size={12} /> {cur.summary ? "Redraft" : "Draft summary"}</SmallButton>
                    {cur.summary && cur.summaryDraft && <SmallButton onClick={() => { update(cur.id, (s) => ({ ...s, summaryDraft: false })); app.notify("Summary kept for the group guide"); }}><Check size={12} /> Keep summary</SmallButton>}
                  </div>
                </Panel>
                <Panel title={`Discussion questions · ${cur.questions.length}`} action={cur.questions.some((q) => q.draft) ? <span className="text-[0.68rem] text-warn">{cur.questions.filter((q) => q.draft).length} to review</span> : cur.questions.length ? <Status tone="good">Reviewed</Status> : undefined}>
                  {drafting?.id === cur.id && drafting.what === "questions" ? (
                    <p className="text-[0.78rem] text-graphite">Drafting questions from the outline…</p>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {cur.questions.map((q, i) => (
                        <li key={q.id} className="flex gap-2 items-start">
                          <span className="w-4 pt-2 font-mono text-[0.72rem] text-gold">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <textarea aria-label={`Question ${i + 1}`} value={q.text} rows={2} onChange={(e) => update(cur.id, (s) => ({ ...s, questions: s.questions.map((x) => (x.id === q.id ? { ...x, text: e.target.value, draft: false } : x)) }))} className={cn(textareaClass, "min-h-0 py-1.5 resize-none text-[0.78rem]", q.draft && "bg-paper border-dashed")} />
                            {q.draft && (
                              <div className="mt-1 flex items-center gap-2">
                                <AiDraft />
                                <button type="button" onClick={() => update(cur.id, (s) => ({ ...s, questions: s.questions.map((x) => (x.id === q.id ? { ...x, draft: false } : x)) }))} className="text-[0.7rem] font-medium text-gold hover:underline cursor-pointer">Keep</button>
                              </div>
                            )}
                          </div>
                          <IconButton label={`Remove question ${i + 1}`} onClick={() => update(cur.id, (s) => ({ ...s, questions: s.questions.filter((x) => x.id !== q.id) }))}><Trash2 size={13} /></IconButton>
                        </li>
                      ))}
                      {cur.questions.length === 0 && <li className="text-[0.78rem] text-graphite">No questions yet.</li>}
                    </ol>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {cur.questions.length ? (
                      <>
                        {cur.questions.some((q) => q.draft) && <PrimaryButton onClick={() => { const n = cur.questions.filter((q) => q.draft).length; update(cur.id, (s) => ({ ...s, questions: s.questions.map((q) => ({ ...q, draft: false })) })); app.notify(`${n} questions approved for the group guide`); }}><Check size={13} /> Approve all</PrimaryButton>}
                        <SmallButton onClick={() => draft(cur, "questions")} disabled={!!drafting}><RefreshCw size={12} /> Redraft</SmallButton>
                        <SmallButton onClick={() => update(cur.id, (s) => ({ ...s, questions: [...s.questions, { id: `q${Date.now()}`, text: "", draft: false }] }))}><Plus size={12} /> Add question</SmallButton>
                      </>
                    ) : (
                      <PrimaryButton onClick={() => draft(cur, "questions")} disabled={!!drafting || !pointsOf(cur).length}><Sparkles size={13} /> Draft questions</PrimaryButton>
                    )}
                  </div>
                </Panel>
              </div>
            </>
          )}
        </>
      )}

      {app.screen === "preach" && cur && <PreachMode key={cur.id} s={cur} seriesTitle={seriesOf(cur)?.title ?? ""} onEnd={(secs) => endPreach(cur, secs)} />}

      {app.screen === "plan" && (
        <>
          <ScreenHeader
            title="Preaching calendar"
            subtitle={`Nov 1 to Jan 24 · ${openSundays.length} open Sundays · ${unassigned.length} without a preacher`}
            action={
              <>
                <Segmented id="sm-view" value={planView} onChange={setPlanView} options={[{ id: "list", label: "List" }, { id: "month", label: "Month" }]} />
                <PrimaryButton onClick={() => openNew()} disabled={!openSundays.length}><Plus size={14} /> Add Sunday</PrimaryButton>
              </>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_14.5rem] gap-3 items-start">
            {planView === "list" ? (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <select aria-label="Filter by preacher" value={planWho} onChange={(e) => setPlanWho(e.target.value)} className={selectClass}>
                    <option value="">All preachers</option>
                    {PREACHERS.map((p) => <option key={p.name}>{p.name}</option>)}
                  </select>
                  <span className="text-[0.72rem] text-mist">{planWho ? `${upcoming.filter((s) => s.preacher === planWho).length} Sundays for ${planWho}` : `${PLAN_DATES.length} services this quarter`}</span>
                </div>
                <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule">
                  {PLAN_DATES.filter((d) => !planWho || sermonOn(d)?.preacher === planWho).map((d) => {
                    const s = sermonOn(d);
                    const away = s?.preacher ? awayOn(s.preacher, d) : undefined;
                    return (
                      <li key={d} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                        <span className="w-16 shrink-0">
                          <span className="block font-mono text-[0.72rem] text-ink">{fmt(d)}</span>
                          <span className="block text-[0.62rem] text-mist">{SPECIAL[d] ?? "Sunday"}</span>
                        </span>
                        {s ? (
                          <>
                            <button type="button" onClick={() => openSermon(s)} className="group flex-1 min-w-[10rem] text-left cursor-pointer">
                              <span className="block text-[0.82rem] font-medium text-ink group-hover:text-gold">{s.title || "Untitled sermon"}</span>
                              <span className="block text-[0.7rem] text-mist">{s.passage} · {seriesOf(s)?.title}</span>
                            </button>
                            {away && <span title={away}><Status tone="warn">Away</Status></span>}
                            <select aria-label={`Preacher for ${fmt(d)}`} value={s.preacher} onChange={(e) => assign(s, e.target.value)} className={selectClass}>
                              <option value="">Unassigned</option>
                              {PREACHERS.map((p) => <option key={p.name} value={p.name}>{p.name}{p.away[d] ? " (away)" : ""}</option>)}
                            </select>
                            <span className="w-24"><SermonState s={s} /></span>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 min-w-[10rem]">
                              <span className="block text-[0.82rem] font-medium text-danger">Open Sunday</span>
                              <span className="block text-[0.7rem] text-mist">Available: {PREACHERS.filter((p) => !p.away[d]).map((p) => p.name).join(", ")}</span>
                            </span>
                            <SmallButton onClick={() => openNew({ date: d, seriesId: d <= "2026-12-20" ? "advent" : "single" })}>Plan this Sunday</SmallButton>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <IconButton label="Previous month" disabled={month === 0} onClick={() => setMonth(month - 1)}><ChevronLeft size={14} /></IconButton>
                  <span className="text-[0.85rem] font-semibold text-ink">{MONTH_VIEWS[month].label}</span>
                  <IconButton label="Next month" disabled={month === MONTH_VIEWS.length - 1} onClick={() => setMonth(month + 1)}><ChevronRight size={14} /></IconButton>
                </div>
                <div className="grid grid-cols-7 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="bg-paper px-1.5 py-1 text-[0.64rem] font-medium text-mist">{d}</div>)}
                  {MONTH_VIEWS[month].cells.map((d, i) => {
                    if (!d) return <div key={`e${i}`} className="bg-paper min-h-[4.75rem]" />;
                    const s = sermonOn(d);
                    const service = SUNDAYS.includes(d) || !!SPECIAL[d];
                    return (
                      <div key={d} className={cn("min-h-[4.75rem] p-1 flex flex-col gap-1 min-w-0", service ? "bg-sheet" : "bg-paper")}>
                        <span className="font-mono text-[0.62rem] text-mist">{Number(d.slice(8))}</span>
                        {s ? (
                          <button type="button" onClick={() => openSermon(s)} className="text-left rounded px-1 py-0.5 bg-gold-wash hover:bg-gold/15 cursor-pointer min-w-0">
                            <span className="block text-[0.64rem] font-semibold leading-tight text-ink line-clamp-2">{s.title}</span>
                            <span className={cn("block text-[0.58rem] truncate", s.preacher ? "text-graphite" : "text-danger")}>{s.preacher || "No preacher"}</span>
                          </button>
                        ) : service ? (
                          <button type="button" onClick={() => openNew({ date: d, seriesId: d <= "2026-12-20" ? "advent" : "single" })} className="text-left rounded px-1 py-0.5 border border-dashed border-danger/40 text-[0.62rem] text-danger hover:bg-danger-wash cursor-pointer">Open Sunday</button>
                        ) : null}
                        {PREACHERS.filter((p) => p.away[d]).map((p) => <span key={p.name} className="text-[0.56rem] text-warn truncate">{p.name} away</span>)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Panel title="Preachers this quarter">
                <ul className="flex flex-col gap-2.5">
                  {PREACHERS.map((p) => {
                    const count = upcoming.filter((s) => s.preacher === p.name && s.date).length;
                    return (
                      <li key={p.name}>
                        <div className="flex items-center gap-2">
                          <Avatar name={p.name} size={22} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[0.78rem] text-ink">{p.name}</span>
                            <span className="block text-[0.64rem] text-mist">{p.role}</span>
                          </span>
                          <span className="font-mono text-[0.72rem] text-ink-soft">{count}</span>
                        </div>
                        <Meter value={count} max={7} className="mt-1.5" />
                        {Object.entries(p.away).map(([d, why]) => <div key={d} className="mt-1 text-[0.64rem] text-warn">Away {fmt(d)}: {why}</div>)}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              <Panel title="Needs a preacher">
                <ul className="flex flex-col gap-1.5">
                  {unassigned.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => openSermon(s)} className="group w-full text-left cursor-pointer">
                        <span className="block text-[0.76rem] text-ink group-hover:text-gold">{fmt(s.date)} · {s.title}</span>
                      </button>
                    </li>
                  ))}
                  {unassigned.length === 0 && <li className="text-[0.74rem] text-mist">Every planned Sunday has a preacher.</li>}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}

      {app.screen === "series" && (
        <>
          <ScreenHeader title="Series" subtitle="Plan a book or theme across Sundays, with notes everyone preaching in it can see" action={<PrimaryButton onClick={() => setModal("series")}><Plus size={14} /> New series</PrimaryButton>} />
          <Table
            rows={series}
            rowKey={(s) => s.id}
            onRowClick={(s) => app.open("series-detail", s.id, s.title)}
            columns={[
              { key: "title", label: "Series", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.book}</span></span> },
              { key: "dates", label: "Dates", hideOnMobile: true, render: (s) => { const l = inSeries(s.id).filter((x) => x.date); return l.length ? <span className="font-mono text-[0.72rem]">{fmt(l[0].date)} to {fmt(l[l.length - 1].date)}</span> : <span className="text-mist">No Sundays</span>; } },
              { key: "who", label: "Preachers", hideOnMobile: true, render: (s) => [...new Set(inSeries(s.id).map((x) => x.preacher).filter(Boolean))].join(", ") || "None yet" },
              { key: "progress", label: "Preached", render: (s) => { const l = inSeries(s.id); const done = l.filter((x) => x.status === "Preached").length; return <span className="flex items-center gap-2"><Meter value={done} max={Math.max(1, l.length)} className="w-14" /><span className="font-mono text-[0.7rem]">{done}/{l.length}</span></span>; } },
              { key: "state", label: "Status", render: (s) => { const l = inSeries(s.id); const done = l.filter((x) => x.status === "Preached").length; return l.length && done === l.length ? <Status tone="muted">Complete</Status> : done ? <Status tone="good">Current</Status> : <Status tone="warn">Planning</Status>; } },
            ]}
          />
        </>
      )}

      {app.screen === "series-detail" && sr && (
        <>
          <ScreenHeader
            title={sr.title}
            subtitle={`${sr.book} · ${inSeries(sr.id).length} sermons · ${inSeries(sr.id).filter((s) => s.status === "Preached").length} preached`}
            action={<SmallButton onClick={() => openNew({ seriesId: sr.id })} disabled={!openSundays.length}><Plus size={12} /> Add Sunday</SmallButton>}
          />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-3 items-start">
            <Table
              rows={inSeries(sr.id)}
              rowKey={(s) => s.id}
              onRowClick={(s) => openSermon(s)}
              empty="No Sundays yet. Add one to start."
              columns={[
                { key: "wk", label: "Week", render: (s) => <span className="font-mono text-[0.72rem] text-mist">{inSeries(sr.id).indexOf(s) + 1}</span> },
                { key: "date", label: "Date", render: (s) => <span className="font-mono text-[0.74rem]">{fmt(s.date)}</span> },
                { key: "title", label: "Sermon", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.passage}</span></span> },
                { key: "who", label: "Preacher", hideOnMobile: true, render: (s) => s.preacher || "Unassigned" },
                { key: "state", label: "Status", render: (s) => <SermonState s={s} /> },
              ]}
            />
            <div className="flex flex-col gap-3">
              <div className="aspect-video rounded-lg bg-gold text-sheet flex flex-col justify-end p-3">
                <span className="text-[0.62rem] opacity-80">Series art · 16:9</span>
                <span className="text-[0.95rem] font-semibold leading-tight">{sr.title}</span>
              </div>
              {sr.keyVerse && lookup(sr.keyVerse) && (
                <Panel title="Key verse">
                  <div className="text-[0.76rem] font-semibold text-ink">{lookup(sr.keyVerse)?.ref}</div>
                  <p className="mt-1 text-[0.76rem] leading-relaxed text-ink-soft">{textOf(lookup(sr.keyVerse) as Passage)}</p>
                </Panel>
              )}
              <Panel
                title="Series notes"
                action={
                  <SmallButton
                    disabled={notesDraft[sr.id] === undefined || notesDraft[sr.id] === sr.notes}
                    onClick={() => {
                      setSeries((l) => l.map((x) => (x.id === sr.id ? { ...x, notes: notesDraft[sr.id] ?? x.notes } : x)));
                      setNotesDraft((n) => { const c = { ...n }; delete c[sr.id]; return c; });
                      app.notify("Series notes saved for everyone preaching in it");
                    }}
                  >
                    Save notes
                  </SmallButton>
                }
              >
                <textarea aria-label="Series notes" value={notesDraft[sr.id] ?? sr.notes} onChange={(e) => setNotesDraft((n) => ({ ...n, [sr.id]: e.target.value }))} rows={5} placeholder="Theme, key verse, illustrations to reuse" className={cn(textareaClass, "resize-none text-[0.78rem]")} />
              </Panel>
            </div>
          </div>
        </>
      )}

      {app.screen === "illustrations" && (
        <>
          <ScreenHeader title="Illustrations" subtitle={`${ills.length} stories and pictures, tagged, with where each was used`} action={<PrimaryButton onClick={() => openIll()}><Plus size={14} /> Add illustration</PrimaryButton>} />
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <SearchBox value={illQuery} onChange={setIllQuery} placeholder="Search stories, like traffic or OFW" label="Search illustrations" />
            <Segmented id="sm-use" value={illUse} onChange={setIllUse} options={[{ id: "all", label: "All" }, { id: "unused", label: "Not used yet" }]} />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tagCounts.map(([t, n]) => (
              <button key={t} type="button" aria-pressed={illTag === t} onClick={() => setIllTag(illTag === t ? "" : t)} className={cn("px-2 py-0.5 rounded-full border text-[0.7rem] cursor-pointer transition-colors", illTag === t ? "bg-gold text-sheet border-gold" : "bg-sheet border-rule text-graphite hover:text-ink")}>
                {t} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
          <Table
            rows={illRows}
            rowKey={(x) => x.id}
            onRowClick={(x) => app.open("illustration", x.id, x.title)}
            empty="No illustrations match. Try another tag."
            columns={[
              { key: "title", label: "Illustration", render: (x) => <span className="block max-w-[22rem]"><span className="block text-ink">{x.title}</span><span className="block text-[0.68rem] text-mist truncate">{x.body}</span></span> },
              { key: "tags", label: "Tags", hideOnMobile: true, render: (x) => <span className="text-[0.72rem] text-graphite">{x.tags.join(", ")}</span> },
              { key: "src", label: "Source", hideOnMobile: true, render: (x) => <span className="text-[0.72rem]">{x.source.split(",")[0]}</span> },
              { key: "used", label: "Last used", render: (x) => { const u = lastUse(x); const p = plannedUse(x); return u ? <span className="text-[0.72rem]">{fmt(u.date)}</span> : p ? <Status tone="warn">Planned {fmt(p.date)}</Status> : <span className="text-mist text-[0.72rem]">Never</span>; } },
            ]}
          />
        </>
      )}

      {app.screen === "illustration" && il && (
        <>
          <ScreenHeader
            title={il.title}
            subtitle={`${il.source} · ${il.used.length ? `in ${il.used.length} ${il.used.length === 1 ? "sermon" : "sermons"}` : "not used yet"}`}
            action={
              <>
                <SmallButton onClick={() => openIll(il)}><PenLine size={12} /> Edit</SmallButton>
                <PrimaryButton onClick={() => openInsert(il)}><Plus size={13} /> Insert into sermon</PrimaryButton>
              </>
            }
          />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-3 items-start">
            <Panel title="Story">
              <p className="text-[0.9rem] leading-relaxed text-ink">{il.body}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {il.tags.map((t) => (
                  <button key={t} type="button" onClick={() => { setIllTag(t); app.section("illustrations"); }} className="px-2 py-0.5 rounded-full border border-rule bg-paper text-[0.7rem] text-graphite hover:text-ink cursor-pointer">{t}</button>
                ))}
              </div>
            </Panel>
            <Panel title="Used in">
              {ilLast && ilLast.date >= "2026-04-29" && <div className="mb-2"><Status tone="warn">Used {fmt(ilLast.date)}. Check before reusing.</Status></div>}
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {il.used.map(sermon).filter((s): s is Sermon => !!s).sort(byDate).reverse().map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => openSermon(s)} className="group w-full py-1.5 text-left cursor-pointer">
                      <span className="block text-[0.78rem] text-ink group-hover:text-gold">{s.title}</span>
                      <span className="block text-[0.66rem] text-mist">{fmt(s.date)} · {s.preacher || "Unassigned"} · {s.status === "Preached" ? "Preached" : "Upcoming"}</span>
                    </button>
                  </li>
                ))}
                {il.used.length === 0 && <li className="py-1 text-[0.76rem] text-mist">Not used in a sermon yet.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "review" && (
        <>
          <ScreenHeader title="Review" subtitle={`${threads.filter((t) => !t.resolved).length} open comments · ${reviewQueue.length} ${reviewQueue.length === 1 ? "draft" : "drafts"} waiting on you`} action={<Segmented id="sm-review" value={reviewFilter} onChange={setReviewFilter} options={[{ id: "open", label: "Open" }, { id: "resolved", label: "Resolved" }, { id: "all", label: "All" }]} />} />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem] gap-3 items-start">
            <div className="flex flex-col gap-4">
              {reviewGroups.map(({ s, list }) => (
                <section key={s.id}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="min-w-0">
                      <span className="block text-[0.84rem] font-semibold text-ink truncate">{s.title}</span>
                      <span className="block text-[0.68rem] text-mist">{fmt(s.date)} · {s.preacher || "Unassigned"} · {list.length} {list.length === 1 ? "comment" : "comments"}</span>
                    </span>
                    <SmallButton onClick={() => openSermon(s)}>Open draft</SmallButton>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {list.map((t) => <ThreadCard key={t.id} t={t} context={blockLabel(s, t.blockId)} onReply={(text) => replyTo(t, text)} onToggle={() => toggleThread(t)} />)}
                  </ul>
                </section>
              ))}
              {reviewGroups.length === 0 && <div className="rounded-lg border border-dashed border-rule bg-sheet p-6 text-center text-[0.8rem] text-mist">No {reviewFilter === "all" ? "" : `${reviewFilter} `}comments.</div>}
            </div>
            <div className="flex flex-col gap-3">
              <Panel title="Waiting on you">
                <ul className="flex flex-col gap-2.5">
                  {reviewQueue.map((s) => (
                    <li key={s.id}>
                      <div className="text-[0.78rem] font-medium text-ink">{s.title}</div>
                      <div className="text-[0.66rem] text-mist">{s.preacher} asked for your review · due Fri, Oct 30</div>
                      <div className="mt-1.5"><SmallButton onClick={() => openSermon(s)}>Start review</SmallButton></div>
                    </li>
                  ))}
                  {reviewQueue.length === 0 && <li className="text-[0.74rem] text-mist">Nothing to review.</li>}
                </ul>
              </Panel>
              <Panel title="Your drafts in review">
                <ul className="flex flex-col gap-2">
                  {upcoming.filter((s) => s.preacher === ME && s.status === "In review").map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => openSermon(s)} className="group w-full text-left cursor-pointer">
                        <span className="block text-[0.78rem] text-ink group-hover:text-gold">{s.title}</span>
                        <span className="block text-[0.66rem] text-mist">With {s.reviewer} · {openThreads(s.id).length} open</span>
                      </button>
                    </li>
                  ))}
                  {!upcoming.some((s) => s.preacher === ME && s.status === "In review") && <li className="text-[0.74rem] text-mist">None. Request a review from the editor.</li>}
                </ul>
              </Panel>
            </div>
          </div>
        </>
      )}

      {app.screen === "library" && (
        <>
          <ScreenHeader title="Library" subtitle={`${preached.length} sermons preached · search by passage, topic, or preacher`} />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_13rem] gap-3 items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <SearchBox value={libQuery} onChange={setLibQuery} placeholder="Try Philippians 2, floods, or Rina" label="Search the library" />
                <select aria-label="Preacher" value={libWho} onChange={(e) => setLibWho(e.target.value)} className={cn(selectClass, "h-9")}>
                  <option value="">All preachers</option>
                  {PREACHERS.map((p) => <option key={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {topics.map(([t]) => (
                  <button key={t} type="button" aria-pressed={libQuery === t} onClick={() => setLibQuery(libQuery === t ? "" : t)} className={cn("px-2 py-0.5 rounded-full border text-[0.7rem] cursor-pointer transition-colors", libQuery === t ? "bg-gold text-sheet border-gold" : "bg-sheet border-rule text-graphite hover:text-ink")}>{t}</button>
                ))}
              </div>
              <Table
                rows={libRows}
                rowKey={(s) => s.id}
                onRowClick={(s) => openSermon(s)}
                empty={libQuery ? `No sermons match "${libQuery}".` : "No sermons for this filter."}
                columns={[
                  { key: "date", label: "Preached", render: (s) => <span className="font-mono text-[0.72rem]">{fmt(s.date)}</span> },
                  { key: "title", label: "Sermon", render: (s) => <span><span className="block text-ink">{s.title}</span><span className="block text-[0.68rem] text-mist">{s.topics.join(", ")}</span></span> },
                  { key: "passage", label: "Passage", hideOnMobile: true, render: (s) => s.passage },
                  { key: "who", label: "Preacher", hideOnMobile: true, render: (s) => s.preacher },
                  { key: "reuse", label: "", align: "right", render: (s) => <SmallButton onClick={() => openReuse(s)}><Copy size={11} /> Reuse</SmallButton> },
                ]}
              />
            </div>
            <Panel title="By book">
              <ul className="flex flex-col gap-0.5 -mx-1.5 -my-1">
                {[["", preached.length] as [string, number], ...books].map(([b, n]) => (
                  <li key={b || "all"}>
                    <button type="button" onClick={() => setLibBook(b)} aria-pressed={libBook === b} className={cn("w-full flex items-center justify-between px-1.5 py-1 rounded-md text-[0.78rem] cursor-pointer", libBook === b ? "bg-gold-wash text-gold font-semibold" : "text-ink-soft hover:bg-paper")}>
                      <span>{b || "All books"}</span>
                      <span className="font-mono text-[0.7rem] text-mist">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {app.screen === "export" && (
        <>
          <ScreenHeader title="Export" subtitle="One outline, four outputs, each to the team that needs it" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3 items-start">
            <Panel title="Send outputs">
              <Field label="Sermon">
                <select value={ex.id} onChange={(e) => setExportId(e.target.value)} className={inputClass}>
                  {exportChoices.map((s) => <option key={s.id} value={s.id}>{fmt(s.date)} · {s.title}</option>)}
                </select>
              </Field>
              <ul className="flex flex-col divide-y divide-rule-soft mt-2">
                {OUTPUTS.map((o) => {
                  const blocked = blockedOut(o.id);
                  const drafts = ex.questions.filter((q) => q.draft).length;
                  const detail = o.id === "slides" ? `${slidesFor(ex).length} slides, 16:9` : o.id === "handout" ? "A5, two-sided" : o.id === "notes" ? `${pointsOf(ex).length} fill-in blanks` : !ex.questions.length ? "No questions yet" : drafts ? `${drafts} AI drafts to review` : `${ex.questions.length} questions`;
                  return (
                    <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <input id={`sm-out-${o.id}`} type="checkbox" disabled={blocked} checked={outputs[o.id] && !blocked} onChange={(e) => setOutputs({ ...outputs, [o.id]: e.target.checked })} className="accent-gold w-4 h-4 cursor-pointer disabled:cursor-default" />
                      <label htmlFor={`sm-out-${o.id}`} className="flex-1 min-w-[12rem] cursor-pointer">
                        <span className="block text-[0.82rem] font-medium text-ink">{o.label} <span className="font-normal text-mist">to {o.to}</span></span>
                        <span className={cn("block text-[0.7rem]", blocked && ex.blocks.length ? "text-danger" : "text-mist")}>{o.who} · {detail} · {o.due}</span>
                      </label>
                      {o.id === "slides" && (
                        <select aria-label="Slide format" value={slideFormat} onChange={(e) => setSlideFormat(e.target.value)} className={selectClass}>
                          {["PPTX", "PDF", "PNG images"].map((f) => <option key={f}>{f}</option>)}
                        </select>
                      )}
                      {o.id === "handout" && (
                        <label className="flex items-center gap-1.5 text-[0.72rem] text-graphite">
                          Copies
                          <input value={copies} onChange={(e) => setCopies(e.target.value.replace(/\D/g, ""))} inputMode="numeric" aria-label="Copies" className="h-8 w-14 px-2 rounded-md border border-rule bg-sheet text-[0.75rem] text-ink outline-none focus:border-gold" />
                        </label>
                      )}
                      {o.id === "guide" && blocked && ex.blocks.length > 0 && <SmallButton onClick={() => openSermon(ex, "guide")}>{ex.questions.length ? "Review questions" : "Draft questions"}</SmallButton>}
                    </li>
                  );
                })}
              </ul>
              {!ex.blocks.length && <div className="mt-2"><Status tone="bad">The outline is empty. Nothing to build yet.</Status></div>}
              <div className="mt-3">
                <Field label="Note to the teams">
                  <textarea value={exportNote} onChange={(e) => setExportNote(e.target.value)} rows={2} placeholder="Countdown at 9:55. Point 2 has a video clip." className={cn(textareaClass, "min-h-0 resize-none")} />
                </Field>
              </div>
              <div className="flex justify-end mt-3">
                <PrimaryButton onClick={send} disabled={!picked.length}><Send size={13} /> Send {picked.length} {picked.length === 1 ? "output" : "outputs"}</PrimaryButton>
              </div>
            </Panel>
            <Panel title={`Sent · ${sent.length}`}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {sent.map((x) => (
                  <li key={x.id} className="flex items-center gap-2 py-2">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.8rem] text-ink truncate">{x.what} · {sermon(x.sermonId)?.title}</span>
                      <span className="block text-[0.68rem] text-mist">{x.when} · {x.to}</span>
                    </span>
                    <SmallButton onClick={() => { setSent((l) => [{ ...x, id: `x${Date.now()}`, when: "Today, just now" }, ...l]); app.notify(`${x.what} resent to the ${x.to.toLowerCase()}`); }}>Resend</SmallButton>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Slide-overs ---- */}

      <ProtoModal open={modal === "new"} title="New sermon" onClose={() => setModal(null)} footer={<PrimaryButton onClick={createSermon} disabled={!newDraft.title.trim()}>Create sermon</PrimaryButton>}>
        <Field label="Sermon title">
          <input value={newDraft.title} onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })} className={inputClass} placeholder="Peace that guards your heart" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sunday">
            <select value={newDraft.date} onChange={(e) => setNewDraft({ ...newDraft, date: e.target.value })} className={inputClass}>
              {openSundays.map((d) => <option key={d} value={d}>{fmt(d)}</option>)}
              <option value="">No date yet</option>
            </select>
          </Field>
          <Field label="Series">
            <select value={newDraft.seriesId} onChange={(e) => setNewDraft({ ...newDraft, seriesId: e.target.value })} className={inputClass}>
              {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Passage">
            <input value={newDraft.passage} onChange={(e) => setNewDraft({ ...newDraft, passage: e.target.value })} className={inputClass} placeholder="Philippians 4:6-7" />
          </Field>
          <Field label="Preacher">
            <select value={newDraft.preacher} onChange={(e) => setNewDraft({ ...newDraft, preacher: e.target.value })} className={inputClass}>
              <option value="">Unassigned</option>
              {PREACHERS.map((p) => <option key={p.name} value={p.name}>{p.name}{newDraft.date && p.away[newDraft.date] ? " (away)" : ""}</option>)}
            </select>
          </Field>
        </div>
        {lookup(newDraft.passage) && <p className="rounded-md bg-trace-wash px-3 py-2 text-[0.76rem] leading-relaxed text-ink-soft">{textOf(lookup(newDraft.passage) as Passage)}</p>}
        {newDraft.preacher && newDraft.date && awayOn(newDraft.preacher, newDraft.date) && <Status tone="warn">{newDraft.preacher} is away: {awayOn(newDraft.preacher, newDraft.date)}</Status>}
      </ProtoModal>

      <ProtoModal open={modal === "series"} title="New series" onClose={() => setModal(null)} footer={<PrimaryButton onClick={createSeries} disabled={!seriesDraft.title.trim()}>Create series</PrimaryButton>}>
        <Field label="Series title">
          <input value={seriesDraft.title} onChange={(e) => setSeriesDraft({ ...seriesDraft, title: e.target.value })} className={inputClass} placeholder="Faith that works: James" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Book">
            <select value={seriesDraft.book} onChange={(e) => setSeriesDraft({ ...seriesDraft, book: e.target.value })} className={inputClass}>
              {BOOK_CHOICES.map((b) => <option key={b}>{b}</option>)}
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
        <Field label="Key verse">
          <input value={seriesDraft.keyVerse} onChange={(e) => setSeriesDraft({ ...seriesDraft, keyVerse: e.target.value })} className={inputClass} placeholder="James 1:22" />
        </Field>
        {lookup(seriesDraft.keyVerse) && <p className="rounded-md bg-trace-wash px-3 py-2 text-[0.76rem] leading-relaxed text-ink-soft">{textOf(lookup(seriesDraft.keyVerse) as Passage)}</p>}
        <KeyValues items={[["Open Sundays", `${openSundays.filter((d) => d >= seriesDraft.start).length} from ${fmt(seriesDraft.start)}`], ["Fills", "Open Sundays only. Planned ones stay."]]} />
      </ProtoModal>

      <ProtoModal open={modal === "request" && !!cur} title="Request review" onClose={() => setModal(null)} footer={cur && <PrimaryButton onClick={() => requestReview(cur)}><Send size={13} /> Send for review</PrimaryButton>}>
        <Field label="Reviewer">
          <select value={reviewDraft.reviewer} onChange={(e) => setReviewDraft({ ...reviewDraft, reviewer: e.target.value })} className={inputClass}>
            {PREACHERS.filter((p) => p.name !== cur?.preacher).map((p) => <option key={p.name}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Due">
          <select value={reviewDraft.due} onChange={(e) => setReviewDraft({ ...reviewDraft, due: e.target.value })} className={inputClass}>
            {["Fri, Oct 30", "Sat, Oct 31"].map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Note">
          <textarea value={reviewDraft.note} onChange={(e) => setReviewDraft({ ...reviewDraft, note: e.target.value })} rows={3} placeholder="Is point 2 too long? Does the close land?" className={cn(textareaClass, "resize-none")} />
        </Field>
        <KeyValues items={[["Sermon", cur?.title ?? ""], ["They can", "Comment on any block. Only you edit."]]} />
      </ProtoModal>

      <ProtoModal open={modal === "comments" && !!cur} title={`Comments · ${cur?.title ?? ""}`} onClose={() => setModal(null)}>
        {cur && (
          <>
            <div className="flex flex-col gap-2 rounded-lg border border-rule bg-paper p-3">
              <select aria-label="Comment on" value={commentDraft.blockId} onChange={(e) => setCommentDraft({ ...commentDraft, blockId: e.target.value })} className={inputClass}>
                <option value="">Whole sermon</option>
                {cur.blocks.map((b, i) => <option key={b.id} value={b.id}>{labelOf(cur.blocks, i)} · {b.title || "Untitled"}</option>)}
              </select>
              <textarea value={commentDraft.text} onChange={(e) => setCommentDraft({ ...commentDraft, text: e.target.value })} rows={2} placeholder="Add a comment" aria-label="Comment" className={cn(textareaClass, "min-h-0 resize-none")} />
              <div className="flex justify-end"><PrimaryButton onClick={() => addComment(cur)} disabled={!commentDraft.text.trim()}>Add comment</PrimaryButton></div>
            </div>
            {commentBlock && (
              <div className="flex items-center justify-between text-[0.72rem] text-mist">
                <span>Showing {blockLabel(cur, commentBlock).split(" · ")[0]}</span>
                <button type="button" onClick={() => setCommentBlock(null)} className="font-medium text-gold hover:underline cursor-pointer">Show all comments</button>
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {threads
                .filter((t) => t.sermonId === cur.id && (!commentBlock || t.blockId === commentBlock))
                .sort((a, b) => Number(a.resolved) - Number(b.resolved))
                .map((t) => <ThreadCard key={t.id} t={t} context={blockLabel(cur, t.blockId)} onReply={(text) => replyTo(t, text)} onToggle={() => toggleThread(t)} />)}
            </ul>
            {!threads.some((t) => t.sermonId === cur.id && (!commentBlock || t.blockId === commentBlock)) && <p className="text-[0.78rem] text-mist">No comments yet.</p>}
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "reuse" && !!reuseSrc} title="Reuse sermon" onClose={() => setModal(null)} footer={<PrimaryButton onClick={reuse}><Copy size={13} /> Copy as new draft</PrimaryButton>}>
        {reuseSrc && <KeyValues items={[["Sermon", reuseSrc.title], ["Preached", `${fmt(reuseSrc.date)} by ${reuseSrc.preacher}`], ["Outline", `${reuseSrc.blocks.length} blocks, ${minutesOf(reuseSrc)} min`]]} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Copy to">
            <select value={reuseDraft.date} onChange={(e) => setReuseDraft({ ...reuseDraft, date: e.target.value })} className={inputClass}>
              {openSundays.map((d) => <option key={d} value={d}>{fmt(d)}</option>)}
              <option value="">No date yet</option>
            </select>
          </Field>
          <Field label="Preacher">
            <select value={reuseDraft.preacher} onChange={(e) => setReuseDraft({ ...reuseDraft, preacher: e.target.value })} className={inputClass}>
              {PREACHERS.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-[0.8rem] text-ink-soft cursor-pointer">
          <input type="checkbox" checked={reuseDraft.questions} onChange={(e) => setReuseDraft({ ...reuseDraft, questions: e.target.checked })} className="accent-gold w-4 h-4" /> Copy group questions
        </label>
        <label className="flex items-center gap-2 text-[0.8rem] text-ink-soft cursor-pointer">
          <input type="checkbox" checked={reuseDraft.notes} onChange={(e) => setReuseDraft({ ...reuseDraft, notes: e.target.checked })} className="accent-gold w-4 h-4" /> Copy study notes
        </label>
        <p className="text-[0.72rem] text-mist">The archive copy stays as it was preached. The new draft links back to it.</p>
      </ProtoModal>

      <ProtoModal open={modal === "ill"} title={illDraft.id ? "Edit illustration" : "Add illustration"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={saveIll} disabled={!illDraft.title.trim() || !illDraft.body.trim()}>{illDraft.id ? "Save illustration" : "Add illustration"}</PrimaryButton>}>
        <Field label="Title">
          <input value={illDraft.title} onChange={(e) => setIllDraft({ ...illDraft, title: e.target.value })} className={inputClass} placeholder="Waiting for the MRT at 7 AM" />
        </Field>
        <Field label="Source">
          <select value={illDraft.source} onChange={(e) => setIllDraft({ ...illDraft, source: e.target.value })} className={inputClass}>
            {["Personal", "Member story, shared with permission", "Culture", "History", "Church history", "News"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Tags, separated by commas">
          <input value={illDraft.tags} onChange={(e) => setIllDraft({ ...illDraft, tags: e.target.value })} className={inputClass} placeholder="patience, work, commute" />
        </Field>
        <Field label="Story">
          <textarea value={illDraft.body} onChange={(e) => setIllDraft({ ...illDraft, body: e.target.value })} rows={6} placeholder="Tell it the way you would from the pulpit" className={cn(textareaClass, "resize-none")} />
        </Field>
      </ProtoModal>

      <ProtoModal
        open={modal === "ill-insert" && !!insertIllustration && !!insertTarget}
        title="Insert into sermon"
        onClose={() => setModal(null)}
        footer={<PrimaryButton onClick={() => { if (insertIllustration && insertTarget) insertIll(insertIllustration, insertTarget, insertDraft.after || null); setModal(null); }}><Plus size={13} /> Insert illustration</PrimaryButton>}
      >
        {insertIllustration && insertTarget && (
          <>
            <KeyValues items={[["Illustration", insertIllustration.title], ["Tags", insertIllustration.tags.join(", ")]]} />
            <Field label="Sermon">
              <select value={insertTarget.id} onChange={(e) => { const s = sermon(e.target.value); setInsertDraft({ ...insertDraft, sermonId: e.target.value, after: s ? (anchorFor(s) ?? "") : "" }); }} className={inputClass}>
                {upcoming.filter((s) => s.date).map((s) => <option key={s.id} value={s.id}>{fmt(s.date)} · {s.title}</option>)}
              </select>
            </Field>
            <Field label="Place it">
              <select value={insertDraft.after} onChange={(e) => setInsertDraft({ ...insertDraft, after: e.target.value })} className={inputClass}>
                {insertTarget.blocks.map((b, i) => <option key={b.id} value={b.id}>After {labelOf(insertTarget.blocks, i)} · {b.title || "Untitled"}</option>)}
                <option value="">At the end</option>
              </select>
            </Field>
            {insertIllustration.used.includes(insertTarget.id) && <Status tone="warn">Already in this sermon</Status>}
            <p className="rounded-md bg-paper px-3 py-2 text-[0.78rem] leading-relaxed text-ink-soft">{insertIllustration.body}</p>
          </>
        )}
      </ProtoModal>

      <ProtoModal open={modal === "ill-pick" && !!cur} title="Insert an illustration" onClose={() => setModal(null)}>
        {cur && (
          <>
            <SearchBox value={pickQuery} onChange={setPickQuery} placeholder="Search by title or tag" label="Search illustrations" />
            <p className="text-[0.72rem] text-mist">Inserts {afterLabel(cur, anchorFor(cur))}.</p>
            <ul className="flex flex-col divide-y divide-rule-soft">
              {pickRows.map((x) => {
                const u = lastUse(x);
                return (
                  <li key={x.id} className="flex items-start gap-2 py-2.5">
                    <span className="flex-1 min-w-0">
                      <span className="block text-[0.8rem] font-medium text-ink">{x.title}</span>
                      <span className="block text-[0.68rem] text-mist">{x.tags.join(", ")}</span>
                      {u && <span className={cn("block text-[0.66rem]", u.date >= "2026-04-29" ? "text-warn" : "text-mist")}>Used {fmt(u.date)} · {u.title}</span>}
                      {x.used.includes(cur.id) && <span className="block text-[0.66rem] text-warn">Already in this sermon</span>}
                    </span>
                    <SmallButton onClick={() => { setActiveBlock(insertIll(x, cur, anchorFor(cur))); setModal(null); }}>Insert</SmallButton>
                  </li>
                );
              })}
              {pickRows.length === 0 && <li className="py-3 text-[0.78rem] text-mist">No illustrations match.</li>}
            </ul>
          </>
        )}
      </ProtoModal>
    </ProtoApp>
  );
}
