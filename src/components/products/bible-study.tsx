"use client";

import React, { useEffect, useRef, useState } from "react";
import { BarChart3, BookOpen, CalendarDays, Check, ClipboardCheck, FolderOpen, HeartPulse, LayoutDashboard, Megaphone, MessageSquare, Minus, Plus, Search, Send, UserPlus, Users, X } from "lucide-react";
import { Avatar, Bars, Field, KeyValues, Meter, Panel, PrimaryButton, ProtoApp, ProtoModal, ScreenHeader, Segmented, SmallButton, Stat, Status, Table, Toggle, inputClass, textareaClass, useProtoApp } from "./ProtoKit";
import { cn } from "@/lib/utils";

// ---- Types -------------------------------------------------------------------------

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type GroupType = "Life group" | "Class" | "Men's" | "Women's" | "Students";
type Role = "Leader" | "Co-leader" | "Member";
type Rsvp = "yes" | "maybe" | "no";
type Repeat = "Does not repeat" | "Weekly" | "Every other week" | "Monthly";
type Kind = "PDF" | "Slides" | "Video" | "Link";
type Tone = "good" | "warn" | "bad" | "muted";
type GroupTab = "overview" | "members" | "events" | "resources" | "chat";
type ModalKind = "group" | "member" | "event" | "resource" | "message" | "visit" | "request" | "announce" | "assign";

interface Member { name: string; role: Role; phone: string; isNew?: boolean }
interface Group { id: string; seed: number; name: string; type: GroupType; area: string; day: Day; time: string; stage: string; place: string; meet: string; desc: string; listed: boolean; cap: number; members: Member[]; history: number[]; missed: number; planId: string; planWeek: number }
interface Attendance { present: string[]; guests: number; feel: string; care: string; note: string }
interface GEvent { id: string; groupId: string; title: string; day: number; time: string; place: string; repeat: Repeat; main: boolean; rsvp: Record<string, Rsvp>; taken: Attendance | null; cancelled: boolean; selfCheckIn: boolean }
interface JoinRequest { id: string; name: string; phone: string; groupId: string; note: string; days: number }
interface Resource { id: string; title: string; kind: Kind; groupId: string; leadersOnly: boolean; meta: string; added: string }
interface ChatMsg { id: string; by: string; body: string; at: string; pinned?: boolean }
interface Seeker { id: string; name: string; area: string; stage: string; day: Day; since: string; invited: boolean }
interface CareEntry { id: string; groupId: string; text: string; when: string }

// ---- Calendar ----------------------------------------------------------------------

// Day offsets count from Monday, October 26, 2026. Today is Thursday the 29th.
const TODAY = 3;
const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthDay = (o: number) => (26 + o <= 31 ? `Oct ${26 + o}` : `Nov ${26 + o - 31}`);
const dateLabel = (o: number) => `${DAYS[o % 7]}, ${monthDay(o)}`;
const whenLabel = (o: number) => (o === TODAY ? "Today" : o === TODAY + 1 ? "Tomorrow" : dateLabel(o));
const weekly = (d: Day) => `${{ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }[d]}s`;
const WEEK_LABELS = ["9/21", "9/28", "10/5", "10/12", "10/19", "10/26"];
const mins = (t: string) => {
  const [hm, ap] = t.split(" ");
  const [h, m] = hm.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + (m || 0) || 0;
};
const byWhen = (a: GEvent, b: GEvent) => a.day - b.day || mins(a.time) - mins(b.time);

// ---- Sample data -------------------------------------------------------------------

const TYPES: GroupType[] = ["Life group", "Class", "Men's", "Women's", "Students"];
const ROLES: Role[] = ["Leader", "Co-leader", "Member"];
const AREAS = ["Makati", "Taguig", "Pasig", "Ortigas", "Mandaluyong", "Marikina", "Quezon City", "Manila", "Parañaque", "Online"];
const STAGES = ["Young pros", "Students", "Couples", "Engaged", "Moms", "Women", "Men", "Families", "Seniors", "Shift workers", "New believers"];
const NEAR: Record<string, string[]> = {
  Makati: ["Taguig", "Mandaluyong"],
  Taguig: ["Makati", "Pasig"],
  Pasig: ["Ortigas", "Marikina", "Taguig"],
  Ortigas: ["Pasig", "Mandaluyong"],
  Mandaluyong: ["Ortigas", "Makati"],
  Marikina: ["Pasig", "Quezon City"],
  "Quezon City": ["Marikina", "Manila"],
  Manila: ["Quezon City", "Mandaluyong"],
  Parañaque: ["Makati", "Taguig"],
  Online: [],
};
const VISITORS = ["Pastor Joel Manalo", "Pastor Rey Aquino", "Elder Nonoy Bautista"];

const PLANS = [
  { id: "john", title: "Gospel of John in six weeks", readings: ["John 1–3", "John 4–6", "John 7–9", "John 10–12", "John 13–17", "John 18–21"], verse: "John 15:5", text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing." },
  { id: "psalms", title: "Psalms of Ascent", readings: ["Psalms 120–122", "Psalms 123–125", "Psalms 126–128", "Psalms 129–131", "Psalms 132–134"], verse: "Psalm 121:1", text: "I will lift up mine eyes unto the hills, from whence cometh my help." },
  { id: "romans", title: "Romans 1–8", readings: ["Romans 1", "Romans 2", "Romans 3", "Romans 4", "Romans 5", "Romans 6", "Romans 7", "Romans 8"], verse: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { id: "proverbs", title: "Proverbs for work and home", readings: ["Proverbs 1–3", "Proverbs 4–6", "Proverbs 10–12", "Proverbs 16–18", "Proverbs 31"], verse: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { id: "foundations", title: "Foundations of faith", readings: ["Who God is", "Who Jesus is", "The cross", "The Holy Spirit", "Prayer", "The Bible", "Church and baptism", "Sharing your faith"], verse: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
];

// history: attendance for the five weeks before this one. missed: check-ins missed before this week. here: this week's count, if already taken.
const RAW: { id: string; name: string; type: GroupType; area: string; day: Day; time: string; stage: string; place: string; meet: string; desc: string; listed?: boolean; cap: number; co: number; members: string; history: number[]; missed: number; here?: number; planId: string; planWeek: number }[] = [
  { id: "g1", name: "Makati Young Pros", type: "Life group", area: "Makati", day: "Tue", time: "7:30 PM", stage: "Young pros", place: "Salcedo Village, Unit 12B", meet: "Tuesday night study", desc: "Young professionals working around Makati. Dinner, the Gospel of John, and prayer.", cap: 14, co: 1, members: "Mark Santos, Ana Reyes, Jem Ocampo, Kim Tan, Ria Bautista, Josh Lim, Pia Navarro, Enzo Mendoza, Nikki Cruz, Raffy Torres", history: [8, 9, 8, 9, 9], missed: 0, here: 9, planId: "john", planWeek: 5 },
  { id: "g2", name: "Marikina Moms", type: "Women's", area: "Marikina", day: "Wed", time: "9:30 AM", stage: "Moms", place: "Concepcion Uno, Dela Cruz home", meet: "Moms' morning study", desc: "Moms with kids in school. We start after drop-off and end before pick-up.", cap: 10, co: 1, members: "Joy Dela Cruz, Weng Santos, Marites Gomez, Lyn Pascual, Cecil Robles, Jhoanna Reyes, Bing Morales, Malou Ferrer", history: [7, 7, 6, 7, 6], missed: 0, planId: "psalms", planWeek: 4 },
  { id: "g3", name: "QC Campus", type: "Students", area: "Quezon City", day: "Thu", time: "6:00 PM", stage: "Students", place: "Katipunan, student center room 3", meet: "Campus study", desc: "College students near Katipunan. One hour of Romans, then merienda.", cap: 15, co: 1, members: "Paolo Garcia, Bianca Ramos, Kyle Uy, Trisha Sy, Migs Herrera, Andrei Co, Sam Velasco, Janelle Ong, Gab Dizon, Ella Marquez, Nico Salazar, Fritz Dela Paz", history: [10, 9, 8, 7, 6], missed: 1, planId: "romans", planWeek: 2 },
  { id: "g4", name: "Couples Circle", type: "Life group", area: "Pasig", day: "Fri", time: "7:00 PM", stage: "Couples", place: "Kapitolyo, Ramos residence", meet: "Couples night", desc: "Married couples. Dinner, a short study, and time to pray for each other.", cap: 12, co: 1, members: "Ben Ramos, Lea Ramos, Jun Aquino, Mia Aquino, Rey Santiago, Cora Santiago, Noel Uy, Jen Uy", history: [8, 6, 8, 8, 7], missed: 0, planId: "john", planWeek: 5 },
  { id: "g5", name: "Men's Breakfast", type: "Men's", area: "Mandaluyong", day: "Sat", time: "6:30 AM", stage: "Men", place: "Church canteen, Shaw Blvd", meet: "Saturday breakfast", desc: "Men of all ages. Breakfast, Proverbs, and honest accountability.", cap: 12, co: 0, members: "Dan Castillo, Ricky Navarro, Boyet Cruz, Jojo Mercado, Arnel Bautista, Dennis Tan, Ramil Ocampo, Totoy Reyes, Edgar Lim", history: [7, 6, 5, 4, 3], missed: 2, planId: "proverbs", planWeek: 1 },
  { id: "g6", name: "Taguig Families", type: "Life group", area: "Taguig", day: "Sun", time: "4:00 PM", stage: "Families", place: "Lower Bicutan, Navarro home", meet: "Family Sunday", desc: "Families with young kids. The kids have their own lesson in the next room.", cap: 14, co: 1, members: "Rina Navarro, Allan Navarro, Mylene Uy, Patrick Uy, Sheila Cortez, Vince Cortez, Karen Lopez, Rodel Lopez, Hazel Tan, Marvin Tan", history: [8, 8, 7, 8, 7], missed: 0, planId: "john", planWeek: 3 },
  { id: "g7", name: "Parañaque Seniors", type: "Life group", area: "Parañaque", day: "Wed", time: "2:00 PM", stage: "Seniors", place: "BF Homes, Villanueva home", meet: "Seniors' fellowship", desc: "Seniors who prefer an afternoon group. Psalms, hymns, and merienda.", cap: 10, co: 0, members: "Grace Villanueva, Pilar Ramos, Ernesto Cruz, Nena Santos, Conrado Reyes, Fely Gomez, Rosario Mendoza, Benigno Diaz", history: [6, 6, 6, 5, 5], missed: 1, planId: "psalms", planWeek: 3 },
  { id: "g8", name: "Ortigas Night Shift", type: "Life group", area: "Ortigas", day: "Sat", time: "10:00 AM", stage: "Shift workers", place: "Ortigas Center, 2F meeting room", meet: "After-shift study", desc: "For BPO and night shift workers. We meet after the shift ends.", cap: 10, co: 0, members: "Jun Ocampo, Aira Mendoza, Kevin Sison, Lovely Ramos, JM Torres, Precious Lim", history: [5, 4, 3, 3, 2], missed: 3, planId: "psalms", planWeek: 2 },
  { id: "g9", name: "Foundations Class", type: "Class", area: "Makati", day: "Sun", time: "11:00 AM", stage: "New believers", place: "Main campus, room 204", meet: "Foundations session", desc: "Eight sessions for new believers and new members. Ends with baptism.", cap: 18, co: 1, members: "Rey Aquino, Liza Bautista, Carmela Diaz, Jonas Reyes, Patricia Lim, Ronald Cruz, Angela Sy, Mike Santos, Divine Torres, Paul Mercado, Sheryl Ong, Joel Francisco, Bea Villanueva, Ian Castro", history: [13, 12, 13, 12, 12], missed: 0, planId: "foundations", planWeek: 4 },
  { id: "g10", name: "Women of the Word", type: "Women's", area: "Online", day: "Mon", time: "7:30 PM", stage: "Women", place: "Video call", meet: "Monday night study", desc: "Women across Metro Manila and beyond, online. Romans, one chapter a week.", cap: 15, co: 1, members: "Carla Mendoza, Tess Ferrer, Abby Lim, Joanne Reyes, Kat Villareal, Mae Gonzales, Pam Cruz, Rose Tan, Lani Bautista, Gina Ocampo, Ivy Santos", history: [9, 10, 9, 10, 9], missed: 0, here: 9, planId: "romans", planWeek: 4 },
  { id: "g11", name: "Pasig Youth", type: "Students", area: "Pasig", day: "Fri", time: "5:00 PM", stage: "Students", place: "Pasig campus, youth room", meet: "Friday youth", desc: "High school students. Games, worship, and small-group talk.", cap: 15, co: 1, members: "Josh Villanueva, Kaye Robles, Ethan Cruz, Mika Santos, Bryan Lim, Chloe Tan, Gelo Reyes, Sophia Diaz, Matt Ong, Nina Castro, Luis Uy", history: [7, 8, 8, 9, 10], missed: 0, planId: "john", planWeek: 2 },
  { id: "g12", name: "Marriage Prep Class", type: "Class", area: "Makati", day: "Sat", time: "2:00 PM", stage: "Engaged", place: "Main campus, room 201", meet: "Marriage prep session", desc: "Six sessions for engaged couples. By referral from the pastoral office.", listed: false, cap: 8, co: 1, members: "Ed Valdez, Tina Valdez, Jerome Santos, Kaye Dizon, Bong Rivera, Mitch Lao, Arvin Gomez, Pat Navarro", history: [8, 8, 7, 8, 8], missed: 0, planId: "proverbs", planWeek: 3 },
  { id: "g13", name: "BGC Men's Huddle", type: "Men's", area: "Taguig", day: "Wed", time: "6:30 AM", stage: "Men", place: "BGC, 26th St office lobby", meet: "Wednesday huddle", desc: "Working men in BGC. Thirty minutes before work: Scripture, prayer, accountability.", cap: 10, co: 0, members: "Allan Reyes, Nico Ramos, Paulo Santiago, Jay Ferrer, Mon Castillo, Gerry Tan, Ariel Lim", history: [6, 5, 6, 5, 5], missed: 0, planId: "proverbs", planWeek: 2 },
  { id: "g14", name: "U-Belt Students", type: "Students", area: "Manila", day: "Wed", time: "5:30 PM", stage: "Students", place: "Sampaloc, España Blvd", meet: "U-Belt study", desc: "College students around the University Belt. Romans and real questions.", cap: 12, co: 1, members: "Lara Mendoza, Toni Aquino, Renz Garcia, Mara Bautista, Jed Santos, Aly Cruz, Vic Torres, Pao Reyes, Kat Lim", history: [5, 6, 6, 7, 7], missed: 0, here: 7, planId: "romans", planWeek: 3 },
];

const PREFIXES = ["0917", "0918", "0927", "0995", "0906", "0945", "0928", "0919"];
const hashOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
const phoneFor = (name: string) => `${PREFIXES[hashOf(name) % 8]} 555 ${String(hashOf(name)).padStart(4, "0")}`;

const GROUPS: Group[] = RAW.map((r, seed) => ({
  id: r.id, seed, name: r.name, type: r.type, area: r.area, day: r.day, time: r.time, stage: r.stage, place: r.place, meet: r.meet, desc: r.desc, listed: r.listed ?? true, cap: r.cap,
  members: r.members.split(", ").map((name, i) => ({ name, role: (i === 0 ? "Leader" : i <= r.co ? "Co-leader" : "Member") as Role, phone: phoneFor(name) })),
  history: r.history, missed: r.missed, planId: r.planId, planWeek: r.planWeek,
}));

// Members answer from the app; the leader always says yes.
function rsvpFor(members: Member[], seed: number, week: number) {
  const out: Record<string, Rsvp> = {};
  members.forEach((m, i) => {
    const r = i === 0 ? 0 : (i * 7 + seed * 3 + week * 5) % 10;
    if (r < 6 - week * 2) out[m.name] = "yes";
    else if (r < 8 - week) out[m.name] = "maybe";
    else if (r < 9 - week) out[m.name] = "no";
  });
  return out;
}

const blankEvent = { rsvp: {}, taken: null, cancelled: false, selfCheckIn: false };

const EVENTS: GEvent[] = [
  ...GROUPS.flatMap((g) => {
    const here = RAW[g.seed].here;
    return [0, 1].map((w) => ({
      ...blankEvent,
      id: `${g.id}-w${w}`, groupId: g.id, title: g.meet, day: DAYS.indexOf(g.day) + w * 7, time: g.time, place: g.place, repeat: "Weekly" as Repeat, main: true,
      rsvp: rsvpFor(g.members, g.seed, w),
      taken: w === 0 && here ? { present: g.members.filter((_, i) => (i + 5 + g.seed) % g.members.length < here).map((m) => m.name), guests: g.seed % 3, feel: "Great", care: "", note: "" } : null,
    }));
  }),
  { ...blankEvent, id: "x1", groupId: "g2", title: "Moms' monthly brunch", day: 5, time: "10:00 AM", place: "Concepcion Uno, Dela Cruz home", repeat: "Monthly", main: false, rsvp: rsvpFor(GROUPS[1].members, 4, 0) },
  { ...blankEvent, id: "x2", groupId: "g9", title: "Baptism orientation", day: 6, time: "1:00 PM", place: "Main campus, chapel", repeat: "Does not repeat", main: false, rsvp: rsvpFor(GROUPS[8].members, 2, 0) },
  { ...blankEvent, id: "x3", groupId: "g3", title: "Finals prayer night", day: 9, time: "7:00 PM", place: "Katipunan, student center room 3", repeat: "Does not repeat", main: false, rsvp: rsvpFor(GROUPS[2].members, 5, 1) },
  { ...blankEvent, id: "x4", groupId: "g4", title: "Couples date night", day: 12, time: "6:00 PM", place: "Kapitolyo food park", repeat: "Does not repeat", main: false, rsvp: rsvpFor(GROUPS[3].members, 1, 1) },
  { ...blankEvent, id: "x5", groupId: "g6", title: "Family picnic", day: 12, time: "9:00 AM", place: "Lakeshore park, Taguig", repeat: "Does not repeat", main: false, rsvp: rsvpFor(GROUPS[5].members, 3, 1) },
];

const REQUESTS: JoinRequest[] = [
  { id: "r1", name: "Liza Mendoza", phone: "0906 555 0128", groupId: "g1", note: "I work in Salcedo and I'm free Tuesday nights.", days: 2 },
  { id: "r2", name: "Carlo Bautista", phone: "0945 555 0136", groupId: "g3", note: "Sophomore at UP. A classmate invited me.", days: 9 },
  { id: "r3", name: "Rico Tolentino", phone: "0917 555 0174", groupId: "g4", note: "Joining with my wife Jasmine. Married two years.", days: 6 },
  { id: "r4", name: "Lorna Castro", phone: "0919 555 0152", groupId: "g7", note: "My daughter signed me up. I'm free weekday afternoons.", days: 4 },
  { id: "r5", name: "Miguel Reyes", phone: "0928 555 0109", groupId: "g5", note: "New to the church. Saturday mornings work for me.", days: 3 },
  { id: "r6", name: "Aileen Sarmiento", phone: "0995 555 0163", groupId: "g10", note: "I live in Cavite, so online is perfect.", days: 1 },
  { id: "r7", name: "Trixie Manalo", phone: "0918 555 0147", groupId: "g11", note: "Grade 10. My cousin Gelo is in this group.", days: 5 },
];

const SEEKERS: Seeker[] = [
  { id: "s1", name: "Andrea Flores", area: "Taguig", stage: "Young pros", day: "Wed", since: "Sep 7", invited: false },
  { id: "s2", name: "Noel Santiago", area: "Pasig", stage: "Men", day: "Sat", since: "Aug 24", invited: false },
  { id: "s3", name: "Kristine Lim", area: "Makati", stage: "Young pros", day: "Tue", since: "Oct 4", invited: false },
  { id: "s4", name: "Ramon Dizon", area: "Parañaque", stage: "Seniors", day: "Wed", since: "Jul 13", invited: true },
  { id: "s5", name: "Joanna Cruz", area: "Marikina", stage: "Moms", day: "Wed", since: "Sep 21", invited: false },
  { id: "s6", name: "Victor Almeda", area: "Mandaluyong", stage: "Men", day: "Wed", since: "Oct 11", invited: false },
  { id: "s7", name: "Precy Gonzales", area: "Quezon City", stage: "Seniors", day: "Wed", since: "Jun 29", invited: true },
  { id: "s8", name: "Jake Villareal", area: "Quezon City", stage: "Students", day: "Thu", since: "Oct 18", invited: false },
  { id: "s9", name: "Hannah Ong", area: "Ortigas", stage: "Shift workers", day: "Sat", since: "Sep 14", invited: false },
  { id: "s10", name: "Leo Bernardo", area: "Taguig", stage: "Families", day: "Sun", since: "Aug 31", invited: false },
  { id: "s11", name: "Sofia Ramirez", area: "Online", stage: "Women", day: "Mon", since: "Oct 25", invited: false },
  { id: "s12", name: "Marco Reyes", area: "Pasig", stage: "Students", day: "Fri", since: "Oct 18", invited: false },
];

const RESOURCES: Resource[] = [
  { id: "f1", title: "John week 5 discussion guide", kind: "PDF", groupId: "all", leadersOnly: false, meta: "4 pages", added: "Oct 26" },
  { id: "f2", title: "John week 5 leader notes", kind: "PDF", groupId: "all", leadersOnly: true, meta: "6 pages", added: "Oct 26" },
  { id: "f3", title: "Leader handbook 2026", kind: "PDF", groupId: "all", leadersOnly: true, meta: "28 pages", added: "Jan 12" },
  { id: "f4", title: "How to lead your first meeting", kind: "Video", groupId: "all", leadersOnly: true, meta: "12 min", added: "Feb 3" },
  { id: "f5", title: "When to call a pastor", kind: "PDF", groupId: "all", leadersOnly: true, meta: "Care steps, 2 pages", added: "Mar 9" },
  { id: "f6", title: "Psalms of Ascent reading cards", kind: "PDF", groupId: "all", leadersOnly: false, meta: "Printable, 5 cards", added: "Sep 28" },
  { id: "f7", title: "Prayer request form", kind: "Link", groupId: "all", leadersOnly: false, meta: "gracefellowship.ph/prayer", added: "Aug 1" },
  { id: "f8", title: "Romans 1–8 facilitator answers", kind: "PDF", groupId: "all", leadersOnly: true, meta: "14 pages", added: "Sep 14" },
  { id: "f9", title: "Foundations session slides", kind: "Slides", groupId: "g9", leadersOnly: true, meta: "Sessions 1–8", added: "Sep 6" },
  { id: "f10", title: "Foundations workbook", kind: "PDF", groupId: "g9", leadersOnly: false, meta: "40 pages", added: "Sep 6" },
  { id: "f11", title: "Proverbs at work study notes", kind: "PDF", groupId: "g5", leadersOnly: false, meta: "8 pages", added: "Oct 3" },
  { id: "f12", title: "Exam season devotional", kind: "PDF", groupId: "g3", leadersOnly: false, meta: "10 days", added: "Oct 13" },
  { id: "f13", title: "Couple communication inventory", kind: "Link", groupId: "g12", leadersOnly: false, meta: "Online form", added: "Oct 2" },
  { id: "f14", title: "Child safety policy for home groups", kind: "PDF", groupId: "all", leadersOnly: true, meta: "3 pages", added: "May 20" },
];

const thread = (rows: [string, string, string, boolean?][]): ChatMsg[] => rows.map(([by, body, at, pinned], i) => ({ id: `c${i}`, by, body, at, pinned }));
const CHATS: Record<string, ChatMsg[]> = {
  leaders: thread([
    ["Pastor Joel Manalo", "Leaders' huddle this Saturday, 9 AM, fellowship hall. Breakfast provided.", "Mon 8:10 AM", true],
    ["Grace Villanueva", "Can we talk about hospital visits? Nena is still confined.", "Mon 9:02 AM"],
    ["Rina Navarro", "See you there. Bringing ensaymada.", "Mon 9:30 AM"],
    ["Jun Ocampo", "Sorry I missed the last few weeks. New schedule at work.", "Wed 11:48 PM"],
  ]),
  g1: thread([
    ["Mark Santos", "Tuesday we finish John 13–17. Bring a friend.", "Mon 4:12 PM", true],
    ["Kim Tan", "Bringing two officemates.", "Tue 5:40 PM"],
    ["Ana Reyes", "I'll bring pancit.", "Tue 6:02 PM"],
    ["Mark Santos", "Great night, everyone. Prayer list is in Resources.", "Tue 10:15 PM"],
  ]),
  g2: thread([
    ["Joy Dela Cruz", "No study on Nov 4, school program. See you on the 11th.", "Mon 7:30 AM", true],
    ["Weng Santos", "Noted po, thank you.", "Mon 8:01 AM"],
  ]),
  g3: thread([
    ["Paolo Garcia", "Midterms week. We'll keep it to one hour tonight.", "Thu 9:20 AM", true],
    ["Bianca Ramos", "Can we pray for the board exam reviewees?", "Thu 10:05 AM"],
    ["Kyle Uy", "Running late, traffic on Katipunan.", "Thu 12:30 PM"],
  ]),
  g5: thread([
    ["Dan Castillo", "Breakfast at 6:30 at the church canteen. Proverbs 2.", "Fri 9:00 PM", true],
    ["Ricky Navarro", "Night shift until 6, I'll try to make it.", "Fri 9:14 PM"],
  ]),
  g8: thread([
    ["Jun Ocampo", "Saturdays are hard now. Can we move to Sunday after second service?", "Tue 11:40 PM"],
    ["Aira Mendoza", "Sunday works for me.", "Wed 7:05 AM"],
    ["Kevin Sison", "Same here.", "Wed 7:30 AM"],
  ]),
  g9: thread([["Rey Aquino", "Session 5 slides are up. Baptism sign-ups close Sunday.", "Mon 10:00 AM", true]]),
};
const UNREAD: Record<string, number> = { leaders: 1, g3: 1, g5: 1, g8: 3 };

const CARE_LOG: CareEntry[] = [
  { id: "k1", groupId: "g7", text: "Pastor Joel visited Nena Santos at the hospital", when: "Oct 23" },
  { id: "k2", groupId: "g5", text: "Called Dan Castillo about members moving to night shift", when: "Oct 20" },
  { id: "k3", groupId: "g8", text: "Sent Jun Ocampo the leader handbook", when: "Oct 14" },
];

// ---- Health and matching -----------------------------------------------------------

const planOf = (id: string) => PLANS.find((p) => p.id === id) ?? PLANS[0];
const first = (name: string) => name.split(" ")[0];
const leaderOf = (g: Group) => g.members.find((m) => m.role === "Leader")?.name ?? "No leader";
const wasThere = (g: Group, i: number, w: number) => (i + w * 3 + g.seed) % g.members.length < g.history[w];
const pct = (n: number) => `${Math.round(n * 100)}%`;
const signed = (n: number) => (n >= 0 ? `+${n}` : String(n));
const avg = (a: number[]) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0);

// 50 points for attendance rate over four weeks, 20 for the trend, 30 for leader check-ins.
function health(g: Group, ev?: GEvent) {
  const counts = ev?.taken ? [...g.history, ev.taken.present.length] : [...g.history];
  const recent = counts.slice(-4);
  const rate = recent.length ? avg(recent) / Math.max(1, g.members.length) : 0;
  const before = avg(counts.slice(-4, -2));
  const change = before ? (avg(counts.slice(-2)) - before) / before : 0;
  const missed = ev?.taken ? 0 : g.missed + (ev && ev.day < TODAY && !ev.cancelled ? 1 : 0);
  const attendance = Math.round(Math.min(1, rate) * 50);
  const trend = change >= -0.05 ? 20 : change >= -0.2 ? 10 : 0;
  const checkins = [30, 20, 8][missed] ?? 0;
  return { counts, rate, change, missed, attendance, trend, checkins, score: attendance + trend + checkins, fresh: counts.length < 4 };
}
type Health = ReturnType<typeof health>;

const band = (h: Health): { tone: Tone; label: string } =>
  h.fresh ? { tone: "muted", label: "New" } : h.score >= 70 ? { tone: "good", label: "Healthy" } : h.score >= 50 ? { tone: "warn", label: "Watch" } : { tone: "bad", label: "Needs care" };
const trendText = (h: Health) => (h.fresh ? "New" : h.change >= 0.05 ? `Up ${pct(h.change)}` : h.change <= -0.05 ? `Down ${pct(-h.change)}` : "Steady");

function reasons(h: Health) {
  const out: string[] = [];
  if (h.missed >= 2) out.push(`No check-in for ${h.missed} weeks`);
  else if (h.missed === 1) out.push("Check-in due");
  if (h.change <= -0.15) out.push(`Attendance down ${pct(-h.change)}`);
  if (h.rate < 0.65) out.push(`${pct(h.rate)} attend`);
  return out.join(" · ") || "Slight dip in attendance";
}

function matchScore(s: { area: string; day: Day; stage: string }, g: Group) {
  return (g.area === s.area ? 3 : NEAR[s.area]?.includes(g.area) ? 2 : 0) + (g.day === s.day ? 2 : 0) + (g.stage === s.stage ? 3 : 0) + (g.members.length < g.cap ? 1 : -3);
}

function rsvpStatus(r?: Rsvp) {
  return r === "yes" ? <Status tone="good">Going</Status> : r === "maybe" ? <Status tone="warn">Maybe</Status> : r === "no" ? <Status tone="bad">Can&apos;t go</Status> : <Status tone="muted">No reply</Status>;
}

function eventStatus(e: GEvent) {
  if (e.cancelled) return <Status tone="muted">Cancelled</Status>;
  if (e.taken) return <Status tone="good">{e.taken.present.length + e.taken.guests} came</Status>;
  if (e.day < TODAY) return <Status tone="bad">Needs attendance</Status>;
  if (e.day === TODAY) return <Status tone="warn">Today</Status>;
  return <Status tone="muted">Upcoming</Status>;
}

const going = (e: GEvent) => Object.values(e.rsvp).filter((r) => r === "yes").length;
const repeatText = (e: GEvent) => (e.repeat === "Does not repeat" ? "One-time" : e.repeat === "Weekly" ? `Weekly on ${weekly(DAYS[e.day % 7])}` : e.repeat);
const kindTag = (k: Kind) => <span className="inline-block w-12 text-center font-mono text-[0.6rem] px-1 py-0.5 rounded bg-raised text-graphite shrink-0">{k}</span>;
const selectSm = "h-8 px-2 rounded-md bg-paper border border-rule text-[0.75rem] text-ink cursor-pointer";

// ---- App -------------------------------------------------------------------------------

export function BibleStudyPrototype() {
  const app = useProtoApp("dashboard");
  const [groups, setGroups] = useState(GROUPS);
  const [events, setEvents] = useState(EVENTS);
  const [requests, setRequests] = useState(REQUESTS);
  const [decided, setDecided] = useState<{ id: string; name: string; group: string; ok: boolean }[]>([]);
  const [resources, setResources] = useState(RESOURCES);
  const [chats, setChats] = useState(CHATS);
  const [unread, setUnread] = useState(UNREAD);
  const [seekers, setSeekers] = useState(SEEKERS);
  const [visits, setVisits] = useState<Record<string, string>>({});
  const [careLog, setCareLog] = useState(CARE_LOG);
  const [reminded, setReminded] = useState(false);

  // View state
  const [typeTab, setTypeTab] = useState<"all" | GroupType>("all");
  const [query, setQuery] = useState("");
  const [bandFilter, setBandFilter] = useState<"all" | Tone>("all");
  const [groupTab, setGroupTab] = useState<GroupTab>("overview");
  const [week, setWeek] = useState<"this" | "next">("this");
  const [calDay, setCalDay] = useState<number | null>(null);
  const [calType, setCalType] = useState<"all" | GroupType>("all");
  const [dueOnly, setDueOnly] = useState(false);
  const [finderTab, setFinderTab] = useState<"requests" | "public">("requests");
  const [ff, setFf] = useState({ area: "Any", day: "Any", type: "Any", stage: "Any" });
  const [resFilter, setResFilter] = useState<"all" | "everyone" | "leaders">("all");
  const [resQuery, setResQuery] = useState("");
  const [threadId, setThreadId] = useState("leaders");
  const [reportTab, setReportTab] = useState<"attendance" | "growth" | "unplaced">("attendance");
  const [reportType, setReportType] = useState<"all" | GroupType>("all");

  // Slide-over forms. A form stays tied to the screen it was opened on.
  const [modal, setModal] = useState<{ kind: ModalKind; at: string } | null>(null);
  const blankGroup = { id: "", name: "", type: "Life group" as GroupType, area: "Makati", day: "Tue" as Day, time: "7:30 PM", stage: "Young pros", place: "", leader: "", listed: true, desc: "" };
  const [gDraft, setGDraft] = useState(blankGroup);
  const [mDraft, setMDraft] = useState({ groupId: "g1", pick: "new", name: "", phone: "", role: "Member" as Role });
  const [eDraft, setEDraft] = useState({ groupId: "g1", title: "", day: 4, time: "7:00 PM", place: "", repeat: "Does not repeat" as Repeat });
  const [rDraft, setRDraft] = useState({ id: "", title: "", kind: "PDF" as Kind, groupId: "all", leadersOnly: false, meta: "" });
  const [msgDraft, setMsgDraft] = useState({ groupId: "g1", body: "", sms: true });
  const [vDraft, setVDraft] = useState({ groupId: "g1", day: 5, who: VISITORS[0], note: "" });
  const [jDraft, setJDraft] = useState({ groupId: "g1", name: "", phone: "", note: "" });
  const [aDraft, setADraft] = useState({ body: "", sms: true });
  const [pDraft, setPDraft] = useState({ planId: "john", groupId: "g1" });

  const here = app.stack.map((s) => `${s.screen}:${s.id ?? ""}`).join("/");
  const show = (kind: ModalKind) => setModal({ kind, at: here });
  const isOpen = (kind: ModalKind) => modal?.kind === kind && modal.at === here;
  const close = () => setModal(null);

  // Derived numbers
  const groupOf = (id: string) => groups.find((g) => g.id === id) ?? groups[0];
  const thisWeek = (g: Group) => events.find((e) => e.groupId === g.id && e.main && e.day < 7);
  const healthOf = (g: Group) => health(g, thisWeek(g));
  const scored = groups.map((g) => ({ g, h: healthOf(g) })).sort((a, b) => a.h.score - b.h.score);
  const count = (tone: Tone) => scored.filter((x) => band(x.h).tone === tone).length;
  const atRisk = scored.filter((x) => !x.h.fresh && x.h.score < 70);
  const people = groups.reduce((s, g) => s + g.members.length, 0);
  const due = events.filter((e) => e.day <= TODAY && !e.taken && !e.cancelled).sort(byWhen);
  const met = groups.filter((g) => (thisWeek(g)?.day ?? 9) < TODAY && !thisWeek(g)?.cancelled);
  const reported = met.filter((g) => thisWeek(g)?.taken).length;
  const tracked = scored.filter((x) => !x.h.fresh);
  const rate = tracked.reduce((s, x) => s + x.h.rate * x.g.members.length, 0) / Math.max(1, tracked.reduce((s, x) => s + x.g.members.length, 0));
  const unreadTotal = Object.values(unread).reduce((s, n) => s + n, 0);
  const bestFor = (s: { area: string; day: Day; stage: string }) => [...groups].sort((a, b) => matchScore(s, b) - matchScore(s, a))[0];

  // Updates
  const updateGroup = (id: string, change: (g: Group) => Partial<Group>) => setGroups((list) => list.map((x) => (x.id === id ? { ...x, ...change(x) } : x)));
  const updateEvent = (id: string, change: Partial<GEvent>) => setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...change } : e)));
  const addMember = (groupId: string, m: Member) => updateGroup(groupId, (g) => ({ members: [...g.members, m] }));
  const log = (groupId: string, text: string) => setCareLog((l) => [{ id: `k${Date.now()}`, groupId, text, when: "Today" }, ...l]);
  const openGroup = (g: Group, tab: GroupTab = "overview") => {
    setGroupTab(tab);
    if (tab === "chat") setUnread((u) => ({ ...u, [g.id]: 0 }));
    app.open("group", g.id, g.name);
  };
  const openEv = (e: GEvent) => app.open("event", e.id, e.title);

  const approve = (r: JoinRequest) => {
    const g = groupOf(r.groupId);
    addMember(g.id, { name: r.name, role: "Member", phone: r.phone, isNew: true });
    setRequests((l) => l.filter((x) => x.id !== r.id));
    setDecided((l) => [{ id: r.id, name: r.name, group: g.name, ok: true }, ...l]);
    app.notify(`Approved. ${r.name} is now in ${g.name}.`);
  };
  const decline = (r: JoinRequest) => {
    setRequests((l) => l.filter((x) => x.id !== r.id));
    setDecided((l) => [{ id: r.id, name: r.name, group: groupOf(r.groupId).name, ok: false }, ...l]);
    app.notify(`Declined. ${first(r.name)} got a note with other groups to try.`);
  };

  const setRole = (g: Group, name: string, role: Role) => {
    const current = g.members.find((m) => m.name === name);
    if (current?.role === "Leader" && role !== "Leader") return app.notify("Every group needs a leader. Make someone else leader first.");
    updateGroup(g.id, (x) => ({ members: x.members.map((m) => (m.name === name ? { ...m, role } : role === "Leader" && m.role === "Leader" ? { ...m, role: "Co-leader" } : m)) }));
    app.notify(`${name} is now ${role === "Leader" ? "the leader" : role === "Co-leader" ? "a co-leader" : "a member"}`);
  };
  const removeMember = (g: Group, name: string) => {
    updateGroup(g.id, (x) => ({ members: x.members.filter((m) => m.name !== name) }));
    app.notify(`${name} removed from ${g.name}`);
  };

  const submitAttendance = (e: GEvent, att: Attendance) => {
    const g = groupOf(e.groupId);
    const before = healthOf(g).score;
    const after = e.main && e.day < 7 ? health(g, { ...e, taken: att }).score : before;
    updateEvent(e.id, { taken: att });
    if (att.care) log(g.id, `${leaderOf(g)} flagged ${att.care} for follow-up`);
    app.notify(`Attendance saved. ${att.present.length + att.guests} came.${after !== before ? ` Health ${before} to ${after}.` : ""}`);
  };

  const remind = () => {
    setReminded(true);
    app.notify(`Reminder sent to ${due.length} ${due.length === 1 ? "leader" : "leaders"} by SMS`);
  };

  const post = (id: string, body: string, pinned: boolean) => {
    setChats((c) => ({ ...c, [id]: [...(c[id] ?? []), { id: `c${Date.now()}`, by: "Pastor Joel Manalo", body, at: "Just now", pinned }] }));
    if (pinned) app.notify(`Announcement posted. ${id === "leaders" ? `${groups.length} leaders` : `${groupOf(id).members.length} members`} notified.`);
  };

  // Form openers and savers
  const openGroupForm = (g?: Group) => {
    setGDraft(g ? { id: g.id, name: g.name, type: g.type, area: g.area, day: g.day, time: g.time, stage: g.stage, place: g.place, leader: leaderOf(g), listed: g.listed, desc: g.desc } : blankGroup);
    show("group");
  };
  const saveGroup = () => {
    const name = gDraft.name.trim();
    if (!name) return;
    const fields = { name, type: gDraft.type, area: gDraft.area, day: gDraft.day, time: gDraft.time, stage: gDraft.stage, place: gDraft.place.trim() || gDraft.area, listed: gDraft.listed, desc: gDraft.desc.trim() || "A new group. Details coming soon." };
    if (gDraft.id) {
      updateGroup(gDraft.id, () => fields);
      app.notify(`${name} saved`);
    } else {
      const id = `g${groups.length + 1}`;
      const leader = gDraft.leader.trim() || "Pastor Joel Manalo";
      const g: Group = { id, seed: groups.length, ...fields, meet: `${name} meeting`, cap: 12, members: [{ name: leader, role: "Leader", phone: phoneFor(leader) }], history: [], missed: 0, planId: "john", planWeek: 0 };
      const d = DAYS.indexOf(g.day);
      setGroups((l) => [...l, g]);
      setEvents((l) => [...l, ...[d, d + 7].filter((day) => day >= TODAY).map((day) => ({ ...blankEvent, id: `${id}-w${day < 7 ? 0 : 1}`, groupId: id, title: g.meet, day, time: g.time, place: g.place, repeat: "Weekly" as Repeat, main: true }))]);
      app.notify(`${name} created${g.listed ? " and listed in the group finder" : ""}. Meets weekly on ${g.day}.`);
    }
    close();
  };

  const openMember = (g: Group) => {
    setMDraft({ groupId: g.id, pick: "new", name: "", phone: "", role: "Member" });
    show("member");
  };
  const saveMember = () => {
    const g = groupOf(mDraft.groupId);
    const s = seekers.find((x) => x.id === mDraft.pick);
    const name = s ? s.name : mDraft.name.trim();
    if (!name) return;
    if (g.members.some((m) => m.name === name)) return app.notify(`${name} is already in ${g.name}`);
    // A new leader takes over; the old leader stays on as co-leader.
    const added: Member = { name, role: mDraft.role, phone: mDraft.phone.trim() || phoneFor(name), isNew: true };
    updateGroup(g.id, (x) => ({ members: [...x.members.map((m) => (mDraft.role === "Leader" && m.role === "Leader" ? { ...m, role: "Co-leader" as Role } : m)), added] }));
    if (s) setSeekers((l) => l.filter((x) => x.id !== s.id));
    close();
    app.notify(`${name} added to ${g.name} as ${mDraft.role.toLowerCase()}`);
  };

  const openEventForm = (groupId: string) => {
    const g = groupOf(groupId);
    setEDraft({ groupId, title: "", day: 4, time: g.time, place: g.place, repeat: "Does not repeat" });
    show("event");
  };
  const saveEvent = () => {
    const g = groupOf(eDraft.groupId);
    const title = eDraft.title.trim();
    if (!title) return;
    const stamp = Date.now();
    const days = eDraft.repeat === "Weekly" && eDraft.day + 7 <= 13 ? [eDraft.day, eDraft.day + 7] : [eDraft.day];
    setEvents((l) => [...l, ...days.map((day, i) => ({ ...blankEvent, id: `e${stamp}-${i}`, groupId: g.id, title, day, time: eDraft.time, place: eDraft.place.trim() || g.place, repeat: eDraft.repeat, main: false }))]);
    close();
    app.notify(`${title} created for ${dateLabel(eDraft.day)}. ${eDraft.repeat === "Does not repeat" ? `${g.members.length} members invited.` : `Repeats ${eDraft.repeat.toLowerCase()}.`}`);
  };

  const openResource = (r?: Resource, groupId = "all") => {
    setRDraft(r ? { id: r.id, title: r.title, kind: r.kind, groupId: r.groupId, leadersOnly: r.leadersOnly, meta: r.meta } : { id: "", title: "", kind: "PDF", groupId, leadersOnly: false, meta: "" });
    show("resource");
  };
  const saveResource = () => {
    const title = rDraft.title.trim();
    if (!title) return;
    const fields = { title, kind: rDraft.kind, groupId: rDraft.groupId, leadersOnly: rDraft.leadersOnly, meta: rDraft.meta.trim() || (rDraft.kind === "Link" ? "Web link" : "Uploaded file") };
    if (rDraft.id) setResources((l) => l.map((r) => (r.id === rDraft.id ? { ...r, ...fields } : r)));
    else setResources((l) => [{ id: `f${Date.now()}`, added: "Oct 29", ...fields }, ...l]);
    close();
    app.notify(`${rDraft.id ? "Saved" : "Added"} ${title}. ${fields.leadersOnly ? "Leaders only." : `Visible to ${fields.groupId === "all" ? "every group" : groupOf(fields.groupId).name}.`}`);
  };
  const toggleLeadersOnly = (r: Resource) => {
    setResources((l) => l.map((x) => (x.id === r.id ? { ...x, leadersOnly: !x.leadersOnly } : x)));
    app.notify(r.leadersOnly ? `${r.title} is now visible to members` : `${r.title} is now leaders only`);
  };

  const openMessage = (g: Group) => {
    setMsgDraft({ groupId: g.id, body: `Hi ${first(leaderOf(g))}, checking in on ${g.name}. How are you and the group doing? Anything we can help with?`, sms: true });
    show("message");
  };
  const sendMessage = () => {
    const g = groupOf(msgDraft.groupId);
    if (!msgDraft.body.trim()) return;
    log(g.id, `Messaged ${leaderOf(g)}`);
    close();
    app.notify(`Message sent to ${leaderOf(g)}${msgDraft.sms ? " in the app and by SMS" : ""}`);
  };

  const openVisit = (g: Group) => {
    const next = events.filter((e) => e.groupId === g.id && e.main && e.day > TODAY).sort(byWhen)[0];
    setVDraft({ groupId: g.id, day: next?.day ?? 5, who: VISITORS[0], note: "" });
    show("visit");
  };
  const saveVisit = () => {
    const g = groupOf(vDraft.groupId);
    setVisits((v) => ({ ...v, [g.id]: monthDay(vDraft.day) }));
    log(g.id, `${vDraft.who} to visit ${g.name} on ${dateLabel(vDraft.day)}${vDraft.note.trim() ? `. ${vDraft.note.trim()}` : ""}`);
    close();
    app.notify(`Visit scheduled for ${dateLabel(vDraft.day)}. ${first(leaderOf(g))} was notified.`);
  };

  const openRequest = (g: Group) => {
    setJDraft({ groupId: g.id, name: "", phone: "", note: "" });
    show("request");
  };
  const sendRequest = () => {
    const g = groupOf(jDraft.groupId);
    const name = jDraft.name.trim();
    if (!name) return;
    setRequests((l) => [...l, { id: `r${Date.now()}`, name, phone: jDraft.phone.trim() || phoneFor(name), groupId: g.id, note: jDraft.note.trim(), days: 0 }]);
    close();
    app.notify(`Request sent to ${leaderOf(g)}`);
  };

  const sendAnnouncement = () => {
    const body = aDraft.body.trim();
    if (!body) return;
    const stamp = Date.now();
    setChats((c) => {
      const next = { ...c };
      for (const g of groups) next[g.id] = [...(c[g.id] ?? []), { id: `a${stamp}`, by: "Pastor Joel Manalo", body, at: "Just now", pinned: true }];
      return next;
    });
    setADraft({ body: "", sms: true });
    close();
    app.notify(`Announcement posted to ${groups.length} groups${aDraft.sms ? " and sent by SMS" : ""}`);
  };

  const saveAssign = () => {
    const g = groupOf(pDraft.groupId);
    updateGroup(g.id, () => ({ planId: pDraft.planId, planWeek: 0 }));
    close();
    app.notify(`${g.name} starts ${planOf(pDraft.planId).title} next meeting`);
  };

  const markWeek = (g: Group) => {
    const p = planOf(g.planId);
    updateGroup(g.id, (x) => ({ planWeek: Math.min(p.readings.length, x.planWeek + 1) }));
    app.notify(`${g.name} finished ${p.readings[g.planWeek]}`);
  };

  const placeSeeker = (s: Seeker) => {
    const g = bestFor(s);
    addMember(g.id, { name: s.name, role: "Member", phone: phoneFor(s.name), isNew: true });
    setSeekers((l) => l.filter((x) => x.id !== s.id));
    app.notify(`${s.name} added to ${g.name}. ${first(leaderOf(g))} will reach out.`);
  };

  const nav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "groups", label: "Groups", icon: Users, badge: groups.length },
    { id: "finder", label: "Group finder", icon: UserPlus, badge: requests.length || undefined },
    { id: "events", label: "Calendar", icon: CalendarDays, badge: due.length || undefined },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadTotal || undefined },
    { id: "resources", label: "Resources", icon: FolderOpen },
    { id: "care", label: "Health", icon: HeartPulse, badge: count("bad") || undefined },
    { id: "plans", label: "Reading plans", icon: BookOpen },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  const healthCell = (h: Health) => (
    <span className="flex items-center gap-2">
      <span className="font-mono text-ink w-6 tabular-nums">{h.fresh ? "—" : h.score}</span>
      <Status tone={band(h).tone}>{band(h).label}</Status>
    </span>
  );
  const searchBox = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="relative flex-1 min-w-[10rem] max-w-xs">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist pointer-events-none" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(inputClass, "h-8 pl-8")} />
    </div>
  );
  const typeSelect = (value: "all" | GroupType, onChange: (v: "all" | GroupType) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value as "all" | GroupType)} aria-label="Group type" className={selectSm}>
      <option value="all">All types</option>
      {TYPES.map((t) => <option key={t}>{t}</option>)}
    </select>
  );
  const requestRow = (r: JoinRequest, compact = false) => (
    <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
      <Avatar name={r.name} size={30} />
      <span className="flex-1 min-w-[10rem]">
        <span className="block text-[0.8rem] text-ink">{r.name}</span>
        <span className={cn("block text-[0.7rem]", r.days >= 7 ? "text-danger" : "text-mist")}>
          {compact ? groupOf(r.groupId).name : `Wants to join ${groupOf(r.groupId).name}`} · {r.days === 0 ? "Just now" : `${r.days} ${r.days === 1 ? "day" : "days"} ago`}
        </span>
        {!compact && r.note && <span className="block text-[0.74rem] text-ink-soft mt-0.5">{r.note}</span>}
      </span>
      <span className="flex gap-1.5">
        {!compact && <SmallButton onClick={() => decline(r)}>Decline</SmallButton>}
        <SmallButton onClick={() => approve(r)}><Check size={12} /> Approve</SmallButton>
      </span>
    </li>
  );

  const grp = app.screen === "group" ? groups.find((g) => g.id === app.id) : undefined;
  const ev = app.screen === "event" ? events.find((e) => e.id === app.id) : undefined;
  const plan = app.screen === "plan" ? PLANS.find((p) => p.id === app.id) : undefined;

  return (
    <ProtoApp app={app} name="Bible Study Groups · Grace Fellowship" user="Pastor Joel Manalo" nav={nav} alerts={count("bad") + requests.length}>
      {/* ---- Overview ---- */}
      {app.screen === "dashboard" && (
        <>
          <ScreenHeader title="This week" subtitle={`Thursday, October 29 · ${groups.length} groups · ${people} people in groups`} action={<PrimaryButton onClick={() => openGroupForm()}><Plus size={14} /> New group</PrimaryButton>} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="People in groups" value={String(people)} sub={`${signed(people - 127)} since Oct 1`} tone={people >= 127 ? "good" : "bad"} />
            <Stat label="Attendance rate" value={pct(rate)} sub="Last four weeks" />
            <Stat label="Join requests" value={String(requests.length)} sub={requests.length ? `Oldest waiting ${Math.max(...requests.map((r) => r.days))} days` : "All answered"} tone={requests.length ? undefined : "good"} />
            <Stat label="Needs care" value={String(count("bad"))} sub={`${count("warn")} more on watch`} tone={count("bad") ? "bad" : "good"} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel title="Attendance due" action={due.length > 0 && (reminded ? <Status tone="good">Reminded</Status> : <SmallButton onClick={remind}><Send size={12} /> Remind leaders</SmallButton>)}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {due.map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5 py-2">
                    <button type="button" onClick={() => openEv(e)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{groupOf(e.groupId).name}</span>
                      <span className={cn("block text-[0.68rem] truncate", e.day < TODAY ? "text-danger" : "text-mist")}>{e.title} · {whenLabel(e.day)}, {e.time}</span>
                    </button>
                    <SmallButton onClick={() => openEv(e)}><ClipboardCheck size={12} /> Take attendance</SmallButton>
                  </li>
                ))}
                {due.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Every leader has reported.</li>}
              </ul>
            </Panel>
            <Panel title="Join requests" action={<SmallButton onClick={() => app.section("finder")}>View all</SmallButton>}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {requests.slice(0, 3).map((r) => requestRow(r, true))}
                {requests.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No one is waiting.</li>}
              </ul>
            </Panel>
            <Panel title="Coming up">
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {events.filter((e) => e.day >= TODAY && e.day <= TODAY + 2 && !e.cancelled).sort(byWhen).slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => openEv(e)} className="w-full flex items-center gap-3 py-2 text-left cursor-pointer group/row">
                      <span className="w-20 shrink-0 text-[0.7rem] text-mist">{whenLabel(e.day)}<span className="block font-mono text-graphite">{e.time}</span></span>
                      <span className="flex-1 min-w-0"><span className="block text-[0.8rem] text-ink group-hover/row:text-gold-bright truncate">{e.title}</span><span className="block text-[0.68rem] text-mist truncate">{groupOf(e.groupId).name}</span></span>
                      <span className="text-[0.7rem] text-graphite font-mono">{going(e)} going</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Needs care and watch" action={<SmallButton onClick={() => app.section("care")}>Open health</SmallButton>}>
              <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                {atRisk.map(({ g, h }) => (
                  <li key={g.id} className="flex items-center gap-2.5 py-2">
                    <span className="font-mono text-[0.9rem] text-ink w-7 tabular-nums">{h.score}</span>
                    <button type="button" onClick={() => openGroup(g)} className="flex-1 min-w-0 text-left cursor-pointer">
                      <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{g.name}</span>
                      <span className="block text-[0.68rem] text-mist truncate">{reasons(h)}</span>
                    </button>
                    <Status tone={band(h).tone}>{band(h).label}</Status>
                  </li>
                ))}
                {atRisk.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Every group is healthy.</li>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Groups ---- */}
      {app.screen === "groups" && (
        <>
          <ScreenHeader title="Groups" subtitle={`${groups.length} groups · ${people} people · ${groups.filter((g) => g.listed).length} listed in the finder`} action={<PrimaryButton onClick={() => openGroupForm()}><Plus size={14} /> New group</PrimaryButton>} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="overflow-x-auto max-w-full">
              <Segmented id="bs-type" value={typeTab} onChange={setTypeTab} options={[{ id: "all", label: "All" }, { id: "Life group", label: "Life groups" }, { id: "Class", label: "Classes" }, { id: "Men's", label: "Men's" }, { id: "Women's", label: "Women's" }, { id: "Students", label: "Students" }]} />
            </div>
            {searchBox(query, setQuery, "Search groups or leaders")}
            <select value={bandFilter} onChange={(e) => setBandFilter(e.target.value as "all" | Tone)} aria-label="Health" className={selectSm}>
              <option value="all">Any health</option>
              <option value="good">Healthy</option>
              <option value="warn">Watch</option>
              <option value="bad">Needs care</option>
            </select>
          </div>
          <Table
            rows={[...scored].sort((a, b) => a.g.seed - b.g.seed).filter(({ g, h }) => (typeTab === "all" || g.type === typeTab) && (bandFilter === "all" || band(h).tone === bandFilter) && `${g.name} ${leaderOf(g)} ${g.area}`.toLowerCase().includes(query.toLowerCase()))}
            rowKey={(x) => x.g.id}
            onRowClick={(x) => openGroup(x.g)}
            empty="No groups match these filters."
            columns={[
              { key: "name", label: "Group", render: ({ g }) => <span><span className="block text-ink">{g.name}</span><span className="block text-[0.7rem] text-mist">{g.type} · {g.area}</span></span> },
              { key: "meets", label: "Meets", render: ({ g }) => `${g.day} ${g.time}`, hideOnMobile: true },
              { key: "leader", label: "Leader", render: ({ g }) => leaderOf(g), hideOnMobile: true },
              { key: "size", label: "Members", align: "right", render: ({ g }) => <span className="font-mono">{g.members.length}<span className="text-mist">/{g.cap}</span></span> },
              { key: "health", label: "Health", render: ({ h }) => healthCell(h) },
            ]}
          />
        </>
      )}

      {app.screen === "group" && grp && (() => {
        const h = healthOf(grp);
        const p = planOf(grp.planId);
        const week0 = thisWeek(grp);
        const groupEvents = events.filter((e) => e.groupId === grp.id).sort(byWhen);
        const groupRes = resources.filter((r) => r.groupId === grp.id || r.groupId === "all");
        const groupReqs = requests.filter((r) => r.groupId === grp.id);
        const weeksTracked = grp.history.length + (week0?.taken ? 1 : 0);
        return (
          <>
            <ScreenHeader
              title={grp.name}
              subtitle={`${grp.type} · ${weekly(grp.day)} ${grp.time} · ${grp.area} · ${grp.members.length} members`}
              action={
                <>
                  <SmallButton onClick={() => openGroupForm(grp)}>Edit group</SmallButton>
                  <PrimaryButton onClick={() => openEventForm(grp.id)}><Plus size={14} /> New event</PrimaryButton>
                </>
              }
            />
            <div className="mb-3 overflow-x-auto">
              <Segmented
                id="bs-gtab"
                value={groupTab}
                onChange={(t) => {
                  setGroupTab(t);
                  if (t === "chat") setUnread((u) => ({ ...u, [grp.id]: 0 }));
                }}
                options={[{ id: "overview", label: "Overview" }, { id: "members", label: "Members" }, { id: "events", label: "Events" }, { id: "resources", label: "Resources" }, { id: "chat", label: "Chat" }]}
              />
            </div>

            {groupTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-3">
                <div className="flex flex-col gap-3">
                  <Panel title="About this group">
                    <p className="text-[0.8rem] text-ink-soft mb-3">{grp.desc}</p>
                    <KeyValues items={[["Meets", `${weekly(grp.day)}, ${grp.time}`], ["Where", grp.place], ["Life stage", grp.stage], ["Leaders", grp.members.filter((m) => m.role !== "Member").map((m) => m.name).join(", ")], ["Size", `${grp.members.length} of ${grp.cap}`]]} />
                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-rule-soft">
                      <span><span className="block text-[0.8rem] text-ink">Listed in group finder</span><span className="block text-[0.7rem] text-mist">{grp.listed ? "People can find it and request to join" : "Only people you add can join"}</span></span>
                      <Toggle on={grp.listed} label="Listed in group finder" onChange={(on) => { updateGroup(grp.id, () => ({ listed: on })); app.notify(on ? `${grp.name} is listed in the group finder` : `${grp.name} is hidden from the group finder`); }} />
                    </div>
                  </Panel>
                  <Panel title="Attendance, last six weeks">
                    {h.counts.length ? <Bars data={h.counts.map((n, i) => ({ label: WEEK_LABELS[i] ?? "", value: n }))} height="h-24" /> : <p className="text-[0.8rem] text-graphite">No meetings recorded yet.</p>}
                  </Panel>
                </div>
                <div className="flex flex-col gap-3">
                  <Panel title="Health score">
                    <div className="flex items-baseline gap-2.5 mb-3"><span className="text-[2rem] leading-none font-semibold text-ink tabular-nums">{h.fresh ? "—" : h.score}</span><Status tone={band(h).tone}>{band(h).label}</Status></div>
                    {[{ label: `Attendance rate, ${pct(h.rate)}`, value: h.attendance, max: 50 }, { label: `Trend, ${trendText(h).toLowerCase()}`, value: h.trend, max: 20 }, { label: h.missed ? `Check-ins, ${h.missed} missed` : "Check-ins up to date", value: h.checkins, max: 30 }].map((part) => (
                      <div key={part.max} className="mb-2 last:mb-0">
                        <div className="flex justify-between text-[0.72rem] mb-1"><span className="text-ink-soft">{part.label}</span><span className="font-mono text-graphite">{part.value}/{part.max}</span></div>
                        <Meter value={part.value} max={part.max} />
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-rule-soft">
                      <SmallButton onClick={() => openMessage(grp)}><MessageSquare size={12} /> Message leader</SmallButton>
                      {visits[grp.id] ? <Status tone="good">Visit on {visits[grp.id]}</Status> : <SmallButton onClick={() => openVisit(grp)}><CalendarDays size={12} /> Schedule visit</SmallButton>}
                    </div>
                  </Panel>
                  <Panel title="Reading plan" action={<SmallButton onClick={() => app.open("plan", p.id, p.title)}>Open plan</SmallButton>}>
                    <div className="text-[0.8rem] text-ink mb-0.5">{p.title}</div>
                    <div className="text-[0.72rem] text-mist mb-2">{grp.planWeek} of {p.readings.length} done{grp.planWeek < p.readings.length ? ` · Next: ${p.readings[grp.planWeek]}` : " · Finished"}</div>
                    <Meter value={grp.planWeek} max={p.readings.length} />
                    {grp.planWeek < p.readings.length && <div className="mt-2.5"><SmallButton onClick={() => markWeek(grp)}><Check size={12} /> Mark week done</SmallButton></div>}
                  </Panel>
                </div>
              </div>
            )}

            {groupTab === "members" && (
              <div className="flex flex-col gap-3">
                {groupReqs.length > 0 && (
                  <Panel title="Join requests">
                    <ul className="flex flex-col divide-y divide-rule-soft -my-1">{groupReqs.map((r) => requestRow(r))}</ul>
                  </Panel>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.78rem] text-graphite">{grp.members.filter((m) => m.role !== "Member").length} leading · {grp.members.filter((m) => m.role === "Member").length} members · {grp.cap - grp.members.length} spots open</span>
                  <SmallButton onClick={() => openMember(grp)}><UserPlus size={12} /> Add member</SmallButton>
                </div>
                <Table
                  rows={grp.members.map((m, i) => ({ m, i }))}
                  rowKey={(x) => x.m.name}
                  columns={[
                    { key: "name", label: "Name", render: ({ m }) => <span className="flex items-center gap-2"><Avatar name={m.name} size={24} /><span className="text-ink">{m.name}</span>{m.isNew && <span className="text-[0.62rem] font-medium text-gold-bright">New</span>}</span> },
                    {
                      key: "role",
                      label: "Role",
                      render: ({ m }) => (
                        <select value={m.role} aria-label={`Role for ${m.name}`} onChange={(e) => setRole(grp, m.name, e.target.value as Role)} className="h-7 px-1.5 rounded-md bg-paper border border-rule text-[0.74rem] text-ink cursor-pointer">
                          {ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      ),
                    },
                    { key: "phone", label: "Phone", render: ({ m }) => <span className="font-mono text-[0.74rem]">{m.phone}</span>, hideOnMobile: true },
                    { key: "came", label: "Attended", hideOnMobile: true, render: ({ m, i }) => (m.isNew ? <span className="text-mist">Just joined</span> : <span className="font-mono text-[0.74rem]">{grp.history.filter((_, w) => wasThere(grp, i, w)).length + (week0?.taken?.present.includes(m.name) ? 1 : 0)} of {weeksTracked}</span>) },
                    { key: "act", label: "", align: "right", render: ({ m }) => <SmallButton label={`Remove ${m.name}`} disabled={m.role === "Leader"} onClick={() => removeMember(grp, m.name)}><X size={12} /></SmallButton> },
                  ]}
                />
              </div>
            )}

            {groupTab === "events" && (
              <Table
                rows={groupEvents}
                rowKey={(e) => e.id}
                onRowClick={openEv}
                empty="No events yet."
                columns={[
                  { key: "when", label: "When", render: (e) => <span><span className="block text-ink">{whenLabel(e.day)}</span><span className="block font-mono text-[0.68rem] text-mist">{e.time}</span></span> },
                  { key: "title", label: "Event", render: (e) => <span><span className="block text-ink">{e.title}</span><span className="block text-[0.7rem] text-mist">{repeatText(e)}</span></span> },
                  { key: "rsvp", label: "Going", align: "right", hideOnMobile: true, render: (e) => <span className="font-mono">{going(e)}/{grp.members.length}</span> },
                  { key: "status", label: "Status", render: eventStatus },
                ]}
              />
            )}

            {groupTab === "resources" && (
              <Panel title="Curriculum and files" action={<SmallButton onClick={() => openResource(undefined, grp.id)}><Plus size={12} /> Add resource</SmallButton>}>
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {groupRes.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2">
                      {kindTag(r.kind)}
                      <button type="button" onClick={() => openResource(r)} className="flex-1 min-w-0 text-left cursor-pointer">
                        <span className="block text-[0.8rem] text-ink hover:text-gold-bright truncate">{r.title}</span>
                        <span className="block text-[0.68rem] text-mist truncate">{r.meta} · {r.groupId === "all" ? "Shared with all groups" : "This group"}</span>
                      </button>
                      {r.leadersOnly ? <Status tone="warn">Leaders only</Status> : <Status tone="muted">Everyone</Status>}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {groupTab === "chat" && <Thread key={grp.id} msgs={chats[grp.id] ?? []} onPost={(body, pinned) => post(grp.id, body, pinned)} />}
          </>
        );
      })()}

      {/* ---- Group finder ---- */}
      {app.screen === "finder" && (
        <>
          <ScreenHeader title="Group finder" subtitle="Public at gracefellowship.ph/groups · Leaders approve by phone" action={<Segmented id="bs-finder" value={finderTab} onChange={setFinderTab} options={[{ id: "requests", label: `Requests (${requests.length})` }, { id: "public", label: "Public page" }]} />} />
          {finderTab === "requests" && (
            <>
              <Panel title="Waiting for a leader" className="mb-3">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {requests.map((r) => requestRow(r))}
                  {requests.length === 0 && <li className="py-6 text-center text-[0.8rem] text-graphite">No requests waiting. New ones land here and on the leader&apos;s phone.</li>}
                </ul>
              </Panel>
              {decided.length > 0 && (
                <Panel title="Decided today">
                  <ul className="flex flex-col gap-1.5 text-[0.8rem]">
                    {decided.map((d) => <li key={d.id} className="flex justify-between gap-3"><span className="text-ink-soft">{d.name} <span className="text-mist">to</span> {d.group}</span>{d.ok ? <Status tone="good">Approved</Status> : <Status tone="muted">Declined</Status>}</li>)}
                  </ul>
                </Panel>
              )}
            </>
          )}
          {finderTab === "public" && (() => {
            const listed = groups.filter((g) => g.listed && (ff.area === "Any" || g.area === ff.area) && (ff.day === "Any" || g.day === ff.day) && (ff.type === "Any" || g.type === ff.type) && (ff.stage === "Any" || g.stage === ff.stage));
            const filters: [keyof typeof ff, string, string[]][] = [["area", "Area", AREAS], ["day", "Day", DAYS], ["type", "Type", TYPES], ["stage", "Life stage", STAGES]];
            return (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {filters.map(([key, label, options]) => (
                    <select key={key} value={ff[key]} onChange={(e) => setFf({ ...ff, [key]: e.target.value })} aria-label={label} className={selectSm}>
                      <option value="Any">Any {label.toLowerCase()}</option>
                      {options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ))}
                  {Object.values(ff).some((v) => v !== "Any") && <SmallButton onClick={() => setFf({ area: "Any", day: "Any", type: "Any", stage: "Any" })}>Clear filters</SmallButton>}
                  <span className="ml-auto text-[0.72rem] text-mist">{listed.length} {listed.length === 1 ? "group" : "groups"}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {listed.map((g) => {
                    const spots = g.cap - g.members.length;
                    return (
                      <div key={g.id} className="bg-sheet border border-rule rounded-lg p-3.5 flex flex-col gap-2">
                        <div className="h-14 rounded-md bg-gold-wash flex items-end px-2.5 py-1.5 text-[0.66rem] font-medium text-gold">{g.type}</div>
                        <div>
                          <div className="text-[0.85rem] font-semibold text-ink">{g.name}</div>
                          <div className="text-[0.72rem] text-mist">{weekly(g.day)}, {g.time} · {g.area} · {g.stage}</div>
                        </div>
                        <p className="text-[0.75rem] text-ink-soft">{g.desc}</p>
                        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                          <span className={cn("text-[0.7rem]", spots > 2 ? "text-graphite" : "text-warn")}>{spots > 0 ? `${spots} ${spots === 1 ? "spot" : "spots"} open` : "Full"}</span>
                          {spots > 0 ? <SmallButton onClick={() => openRequest(g)}>Request to join</SmallButton> : <Status tone="muted">Waitlist only</Status>}
                        </div>
                      </div>
                    );
                  })}
                  {listed.length === 0 && <div className="md:col-span-2 bg-sheet border border-rule rounded-lg py-8 text-center text-[0.8rem] text-graphite">No groups match. Try another day or area.</div>}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* ---- Calendar ---- */}
      {app.screen === "events" && (() => {
        const start = week === "this" ? 0 : 7;
        const inWeek = events.filter((e) => e.day >= start && e.day < start + 7 && (calType === "all" || groupOf(e.groupId).type === calType) && (!dueOnly || (e.day <= TODAY && !e.taken && !e.cancelled)));
        const shown = inWeek.filter((e) => calDay === null || e.day === calDay).sort(byWhen);
        const days = Array.from({ length: 7 }, (_, i) => start + i);
        return (
          <>
            <ScreenHeader
              title="Calendar"
              subtitle={`${monthDay(start)} to ${monthDay(start + 6)} · ${inWeek.length} events across ${new Set(inWeek.map((e) => e.groupId)).size} groups`}
              action={
                <>
                  <Segmented id="bs-week" value={week} onChange={(w) => { setWeek(w); setCalDay(null); }} options={[{ id: "this", label: "This week" }, { id: "next", label: "Next week" }]} />
                  <PrimaryButton onClick={() => openEventForm("g1")}><Plus size={14} /> New event</PrimaryButton>
                </>
              }
            />
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {days.map((d) => {
                const n = inWeek.filter((e) => e.day === d).length;
                const on = calDay === d;
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => setCalDay(on ? null : d)} className={cn("flex flex-col items-center gap-0.5 py-2 rounded-lg border text-center cursor-pointer transition-colors", on ? "border-gold bg-gold-wash" : "border-rule bg-sheet hover:border-mist", d === TODAY && !on && "border-gold/50")}>
                    <span className="text-[0.64rem] text-mist">{DAYS[d % 7]}</span>
                    <span className={cn("text-[0.95rem] font-semibold tabular-nums", d === TODAY ? "text-gold" : "text-ink")}>{monthDay(d).split(" ")[1]}</span>
                    <span className="text-[0.62rem] text-graphite">{n ? `${n} ${n === 1 ? "event" : "events"}` : "Free"}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {typeSelect(calType, setCalType)}
              <span className="flex items-center gap-2 text-[0.76rem] text-ink-soft"><Toggle on={dueOnly} onChange={setDueOnly} label="Needs attendance only" /> Needs attendance only</span>
              {calDay !== null && <SmallButton onClick={() => setCalDay(null)}>Show whole week</SmallButton>}
            </div>
            <Table
              rows={shown}
              rowKey={(e) => e.id}
              onRowClick={openEv}
              empty="Nothing scheduled for this view."
              columns={[
                { key: "when", label: "When", render: (e) => <span><span className={cn("block", e.day === TODAY ? "text-gold font-medium" : "text-ink")}>{whenLabel(e.day)}</span><span className="block font-mono text-[0.68rem] text-mist">{e.time}</span></span> },
                { key: "title", label: "Event", render: (e) => <span><span className={cn("block", e.cancelled ? "text-mist line-through" : "text-ink")}>{e.title}</span><span className="block text-[0.7rem] text-mist">{groupOf(e.groupId).name} · {repeatText(e)}</span></span> },
                { key: "rsvp", label: "Going", align: "right", hideOnMobile: true, render: (e) => <span className="font-mono">{going(e)}/{groupOf(e.groupId).members.length}</span> },
                { key: "status", label: "Status", render: eventStatus },
              ]}
            />
          </>
        );
      })()}

      {app.screen === "event" && ev && (() => {
        const g = groupOf(ev.groupId);
        const canTake = ev.day <= TODAY && !ev.cancelled;
        const noReply = g.members.filter((m) => !ev.rsvp[m.name]).length;
        const tally: [string, number][] = [["Going", going(ev)], ["Maybe", Object.values(ev.rsvp).filter((r) => r === "maybe").length], ["Can't go", Object.values(ev.rsvp).filter((r) => r === "no").length], ["No reply", noReply]];
        const rsvpPanel = (
          <Panel title="RSVPs" action={!canTake && !ev.cancelled && noReply > 0 ? <SmallButton onClick={() => app.notify(`Reminder sent to ${noReply} ${noReply === 1 ? "person" : "people"} who haven't replied`)}><Send size={12} /> Nudge no replies</SmallButton> : undefined}>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {tally.map(([label, n]) => <div key={label} className="rounded-md bg-paper border border-rule-soft px-2 py-1.5"><div className="text-[1rem] font-semibold text-ink tabular-nums">{n}</div><div className="text-[0.64rem] text-mist">{label}</div></div>)}
            </div>
            <ul className="flex flex-col divide-y divide-rule-soft -my-1 max-h-56 overflow-y-auto">
              {g.members.map((m) => <li key={m.name} className="flex items-center justify-between gap-2 py-1.5 text-[0.78rem]"><span className="text-ink-soft truncate">{m.name}{m.role !== "Member" && <span className="text-mist"> · {m.role}</span>}</span>{rsvpStatus(ev.rsvp[m.name])}</li>)}
            </ul>
          </Panel>
        );
        const details = (
          <Panel title="Details">
            <KeyValues items={[["Group", g.name], ["When", `${dateLabel(ev.day)}, ${ev.time}`], ["Where", ev.place], ["Repeats", repeatText(ev)], ...(ev.repeat === "Weekly" && ev.day + 7 <= 13 ? [["Next", dateLabel(ev.day + 7)] as [string, string]] : [])]} />
            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-rule-soft">
              <span><span className="block text-[0.8rem] text-ink">Members check themselves in</span><span className="block text-[0.7rem] text-mist">From the app, at the meeting</span></span>
              <Toggle on={ev.selfCheckIn} label="Members check themselves in" onChange={(on) => { updateEvent(ev.id, { selfCheckIn: on }); app.notify(on ? "Members can check themselves in from the app" : "Only leaders take attendance now"); }} />
            </div>
          </Panel>
        );
        return (
          <>
            <ScreenHeader
              title={ev.title}
              subtitle={`${g.name} · ${whenLabel(ev.day)}, ${ev.time} · ${ev.place}`}
              action={
                <>
                  <SmallButton onClick={() => openGroup(g)}>Open group</SmallButton>
                  {!canTake && !ev.cancelled && <SmallButton onClick={() => app.notify(`Reminder sent to ${going(ev) + Object.values(ev.rsvp).filter((r) => r === "maybe").length} people`)}><Send size={12} /> Send reminder</SmallButton>}
                  {ev.day >= TODAY && !ev.taken && (ev.cancelled ? <SmallButton onClick={() => { updateEvent(ev.id, { cancelled: false }); app.notify("Event restored. Members notified."); }}>Restore event</SmallButton> : <SmallButton onClick={() => { updateEvent(ev.id, { cancelled: true }); app.notify(`Event cancelled. ${g.members.length} members notified.`); }}>Cancel event</SmallButton>)}
                </>
              }
            />
            {ev.cancelled && <div className="mb-3 px-3.5 py-2.5 rounded-lg bg-raised border border-rule text-[0.8rem] text-graphite">This event is cancelled. Members were told by push and SMS.</div>}
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3">
              {canTake ? <AttendancePanel key={ev.id} ev={ev} group={g} onSubmit={(att) => submitAttendance(ev, att)} /> : rsvpPanel}
              <div className="flex flex-col gap-3">
                {canTake && rsvpPanel}
                {details}
              </div>
            </div>
          </>
        );
      })()}

      {/* ---- Messages ---- */}
      {app.screen === "messages" && (() => {
        const threads = [{ id: "leaders", name: "All leaders", sub: `${groups.length} leaders and co-leaders` }, ...groups.map((g) => ({ id: g.id, name: g.name, sub: `${g.members.length} members` }))];
        const active = threads.find((t) => t.id === threadId) ?? threads[0];
        const last = (id: string) => (chats[id] ?? []).at(-1);
        return (
          <>
            <ScreenHeader title="Messages" subtitle="Group chats and announcements. Members get them in the app and by SMS." action={<PrimaryButton onClick={() => show("announce")}><Megaphone size={14} /> Announce to all groups</PrimaryButton>} />
            <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] gap-3">
              <ul className="bg-sheet border border-rule rounded-lg divide-y divide-rule-soft overflow-y-auto max-h-[28rem]">
                {threads.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => { setThreadId(t.id); setUnread((u) => ({ ...u, [t.id]: 0 })); }} className={cn("w-full flex items-start gap-2.5 px-3 py-2.5 text-left cursor-pointer transition-colors", t.id === active.id ? "bg-gold-wash" : "hover:bg-paper")}>
                      <Avatar name={t.name} size={26} />
                      <span className="flex-1 min-w-0">
                        <span className={cn("block text-[0.78rem] truncate", unread[t.id] ? "text-ink font-semibold" : "text-ink")}>{t.name}</span>
                        <span className="block text-[0.68rem] text-mist truncate">{last(t.id) ? `${first(last(t.id)?.by ?? "")}: ${last(t.id)?.body}` : "No messages yet"}</span>
                      </span>
                      {unread[t.id] ? <span className="min-w-5 h-5 px-1.5 rounded-full bg-gold text-sheet text-[0.62rem] font-bold flex items-center justify-center">{unread[t.id]}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span><span className="block text-[0.85rem] font-semibold text-ink">{active.name}</span><span className="block text-[0.7rem] text-mist">{active.sub}</span></span>
                  {active.id !== "leaders" && <SmallButton onClick={() => openGroup(groupOf(active.id))}>Open group</SmallButton>}
                </div>
                <Thread key={active.id} msgs={chats[active.id] ?? []} onPost={(body, pinned) => post(active.id, body, pinned)} />
              </div>
            </div>
          </>
        );
      })()}

      {/* ---- Resources ---- */}
      {app.screen === "resources" && (
        <>
          <ScreenHeader title="Resources" subtitle={`${resources.length} files and links · ${resources.filter((r) => r.leadersOnly).length} for leaders only`} action={<PrimaryButton onClick={() => openResource()}><Plus size={14} /> Add resource</PrimaryButton>} />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Segmented id="bs-res" value={resFilter} onChange={setResFilter} options={[{ id: "all", label: "All" }, { id: "everyone", label: "Everyone" }, { id: "leaders", label: "Leaders only" }]} />
            {searchBox(resQuery, setResQuery, "Search resources")}
          </div>
          <Table
            rows={resources.filter((r) => (resFilter === "all" || (resFilter === "leaders") === r.leadersOnly) && `${r.title} ${r.meta}`.toLowerCase().includes(resQuery.toLowerCase()))}
            rowKey={(r) => r.id}
            onRowClick={(r) => openResource(r)}
            empty="No resources match."
            columns={[
              { key: "title", label: "Title", render: (r) => <span className="flex items-center gap-2.5">{kindTag(r.kind)}<span className="min-w-0"><span className="block text-ink truncate">{r.title}</span><span className="block text-[0.7rem] text-mist truncate">{r.meta}</span></span></span> },
              { key: "group", label: "Shared with", hideOnMobile: true, render: (r) => (r.groupId === "all" ? "All groups" : groupOf(r.groupId).name) },
              { key: "added", label: "Added", hideOnMobile: true, render: (r) => <span className="font-mono text-[0.74rem]">{r.added}</span> },
              { key: "vis", label: "Leaders only", align: "right", render: (r) => <span className="inline-flex justify-end"><Toggle on={r.leadersOnly} label={`Leaders only: ${r.title}`} onChange={() => toggleLeadersOnly(r)} /></span> },
            ]}
          />
        </>
      )}

      {/* ---- Health ---- */}
      {app.screen === "care" && (
        <>
          <ScreenHeader title="Group health" subtitle="Scored from attendance rate, attendance trend and leader check-ins" action={due.length > 0 && !reminded ? <SmallButton onClick={remind}><Send size={12} /> Remind leaders</SmallButton> : undefined} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
            <Stat label="Healthy" value={String(count("good"))} sub="Score 70 or higher" tone="good" />
            <Stat label="Watch" value={String(count("warn"))} sub="Score 50 to 69" />
            <Stat label="Needs care" value={String(count("bad"))} sub="Score under 50" tone="bad" />
            <Stat label="Check-ins this week" value={`${reported} of ${met.length}`} sub="Groups that have met" tone={reported === met.length ? "good" : undefined} />
          </div>
          <Panel title="Needs care and watch" className="mb-3">
            <ul className="flex flex-col divide-y divide-rule-soft -my-1">
              {atRisk.map(({ g, h }) => (
                <li key={g.id} className="flex flex-wrap items-center gap-2.5 py-2.5">
                  <span className="font-mono text-[0.95rem] text-ink w-7 tabular-nums">{h.score}</span>
                  <button type="button" onClick={() => openGroup(g)} className="flex-1 min-w-[10rem] text-left cursor-pointer">
                    <span className="flex items-center gap-2"><span className="text-[0.8rem] text-ink hover:text-gold-bright">{g.name}</span><Status tone={band(h).tone}>{band(h).label}</Status></span>
                    <span className="block text-[0.7rem] text-mist">{leaderOf(g)} · {reasons(h)}</span>
                  </button>
                  <SmallButton onClick={() => openMessage(g)}><MessageSquare size={12} /> Message leader</SmallButton>
                  {visits[g.id] ? <Status tone="good">Visit on {visits[g.id]}</Status> : <SmallButton onClick={() => openVisit(g)}><CalendarDays size={12} /> Schedule visit</SmallButton>}
                </li>
              ))}
              {atRisk.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">Every group is healthy.</li>}
            </ul>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
            <Table
              rows={scored}
              rowKey={(x) => x.g.id}
              onRowClick={(x) => openGroup(x.g)}
              columns={[
                { key: "name", label: "Group", render: ({ g }) => <span className="text-ink">{g.name}</span> },
                { key: "score", label: "Score", render: ({ h }) => healthCell(h) },
                { key: "trend", label: "Trend", hideOnMobile: true, render: ({ h }) => <span className={cn("text-[0.74rem]", h.change <= -0.05 ? "text-danger" : h.change >= 0.05 ? "text-good" : "text-graphite")}>{trendText(h)}</span> },
                { key: "check", label: "Check-ins", render: ({ h }) => (h.missed === 0 ? <Status tone="good">Up to date</Status> : h.missed === 1 ? <Status tone="warn">1 due</Status> : <Status tone="bad">{h.missed} missed</Status>) },
              ]}
            />
            <Panel title="Care log">
              <ul className="flex flex-col gap-2.5">
                {careLog.map((c) => (
                  <li key={c.id} className="text-[0.78rem]">
                    <div className="text-ink-soft">{c.text}</div>
                    <div className="text-[0.68rem] text-mist">{groupOf(c.groupId).name} · {c.when}</div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}

      {/* ---- Reading plans ---- */}
      {app.screen === "plans" && (
        <>
          <ScreenHeader title="Reading plans" subtitle="Each group follows a plan. Leaders mark each week done." action={<PrimaryButton onClick={() => { setPDraft({ planId: "john", groupId: groups[0].id }); show("assign"); }}><BookOpen size={14} /> Assign plan</PrimaryButton>} />
          <Table
            rows={PLANS}
            rowKey={(p) => p.id}
            onRowClick={(p) => app.open("plan", p.id, p.title)}
            columns={[
              { key: "title", label: "Plan", render: (p) => <span><span className="block text-ink">{p.title}</span><span className="block text-[0.7rem] text-mist">{p.readings[0]} to {p.readings[p.readings.length - 1]}</span></span> },
              { key: "weeks", label: "Length", render: (p) => `${p.readings.length} weeks`, hideOnMobile: true },
              { key: "groups", label: "Groups", align: "right", render: (p) => <span className="font-mono">{groups.filter((g) => g.planId === p.id).length}</span> },
              {
                key: "progress",
                label: "Average progress",
                render: (p) => {
                  const on = groups.filter((g) => g.planId === p.id);
                  const done = avg(on.map((g) => g.planWeek)) / p.readings.length;
                  return <span className="flex items-center gap-2"><Meter value={done} max={1} className="w-20" /><span className="font-mono text-[0.7rem]">{on.length ? pct(done) : "—"}</span></span>;
                },
              },
            ]}
          />
        </>
      )}

      {app.screen === "plan" && plan && (() => {
        const on = groups.filter((g) => g.planId === plan.id);
        return (
          <>
            <ScreenHeader
              title={plan.title}
              subtitle={`${plan.readings.length} weeks · ${on.length} groups · ${on.reduce((s, g) => s + g.members.length, 0)} people reading`}
              action={
                <>
                  <SmallButton onClick={() => app.notify(`This week's guide sent to ${on.length} leaders`)}><Send size={12} /> Send this week&apos;s guide</SmallButton>
                  <PrimaryButton onClick={() => { setPDraft({ planId: plan.id, groupId: groups.find((g) => g.planId !== plan.id)?.id ?? groups[0].id }); show("assign"); }}><Plus size={14} /> Assign to group</PrimaryButton>
                </>
              }
            />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3">
              <div className="flex flex-col gap-3">
                <Panel title="Memory verse">
                  <p className="text-[0.85rem] leading-relaxed text-ink">{plan.text}</p>
                  <p className="text-[0.7rem] text-mist mt-1.5">{plan.verse}, KJV</p>
                </Panel>
                <Panel title="Weekly readings">
                  <ol className="flex flex-col gap-1.5 text-[0.8rem]">
                    {plan.readings.map((r, i) => <li key={r} className="flex gap-3"><span className="font-mono text-mist w-14 shrink-0">Week {i + 1}</span><span className="text-ink flex-1">{r}</span><span className="text-[0.68rem] text-mist">{on.filter((g) => g.planWeek > i).length}/{on.length}</span></li>)}
                  </ol>
                </Panel>
              </div>
              <Panel title="Progress by group">
                <ul className="flex flex-col divide-y divide-rule-soft -my-1">
                  {on.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <button type="button" onClick={() => openGroup(g)} className="flex-1 min-w-[9rem] text-left cursor-pointer">
                        <span className="block text-[0.8rem] text-ink hover:text-gold-bright">{g.name}</span>
                        <span className="block text-[0.68rem] text-mist">{g.planWeek} of {plan.readings.length} done{g.planWeek < plan.readings.length ? ` · Next: ${plan.readings[g.planWeek]}` : ""}</span>
                      </button>
                      <Meter value={g.planWeek} max={plan.readings.length} className="w-24" />
                      {g.planWeek >= plan.readings.length ? <Status tone="good">Finished</Status> : <SmallButton onClick={() => markWeek(g)}>Mark week done</SmallButton>}
                    </li>
                  ))}
                  {on.length === 0 && <li className="py-3 text-[0.8rem] text-graphite">No groups on this plan yet.</li>}
                </ul>
              </Panel>
            </div>
          </>
        );
      })()}

      {/* ---- Reports ---- */}
      {app.screen === "reports" && (() => {
        const inType = scored.filter((x) => reportType === "all" || x.g.type === reportType).sort((a, b) => a.g.seed - b.g.seed);
        const growth = [112, 116, 119, 123, 127, people];
        return (
          <>
            <ScreenHeader title="Reports" subtitle="Attendance across groups, growth, and people not yet in a group" action={<Segmented id="bs-report" value={reportTab} onChange={setReportTab} options={[{ id: "attendance", label: "Attendance" }, { id: "growth", label: "Growth" }, { id: "unplaced", label: "Unplaced" }]} />} />
            {reportTab === "attendance" && (
              <>
                <div className="flex items-center gap-2 mb-3">{typeSelect(reportType, setReportType)}<span className="text-[0.72rem] text-mist">{inType.length} groups</span></div>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-3">
                  <Panel title="Total attendance, completed weeks">
                    <Bars data={WEEK_LABELS.slice(0, 5).map((w, i) => ({ label: w, value: inType.reduce((s, x) => s + (x.g.history[i] ?? 0), 0) }))} height="h-32" />
                    <p className="text-[0.7rem] text-mist mt-2">This week so far: {inType.reduce((s, x) => s + (thisWeek(x.g)?.taken?.present.length ?? 0), 0)} from {inType.filter((x) => thisWeek(x.g)?.taken).length} groups reporting.</p>
                  </Panel>
                  <Table
                    rows={inType}
                    rowKey={(x) => x.g.id}
                    onRowClick={(x) => openGroup(x.g)}
                    columns={[
                      { key: "name", label: "Group", render: ({ g }) => <span className="text-ink">{g.name}</span> },
                      ...WEEK_LABELS.map((w, i) => ({ key: w, label: w, align: "right" as const, hideOnMobile: i < 3, render: ({ h }: { h: Health }) => <span className={cn("font-mono text-[0.74rem]", h.counts[i] === undefined && "text-mist")}>{h.counts[i] ?? "—"}</span> })),
                      { key: "rate", label: "Rate", align: "right", render: ({ h }) => <span className={cn("font-mono", h.rate < 0.65 ? "text-danger" : "text-ink")}>{h.fresh ? "—" : pct(h.rate)}</span> },
                    ]}
                  />
                </div>
              </>
            )}
            {reportTab === "growth" && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                  <Stat label="People in groups" value={String(people)} sub={`${signed(people - growth[0])} since May`} tone="good" />
                  <Stat label="Joined this month" value={String(Math.max(0, people - 127) + 6)} sub="Approved requests and adds" tone="good" />
                  <Stat label="Groups" value={String(groups.length)} sub={`${groups.filter((g) => g.listed).length} open to new people`} />
                  <Stat label="Not in a group" value={String(seekers.length)} sub="Attend Sundays" tone={seekers.length ? "bad" : "good"} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
                  <Panel title="People in groups, by month">
                    <Bars data={["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({ label: m, value: growth[i] }))} height="h-32" />
                  </Panel>
                  <Panel title="By group type">
                    <ul className="flex flex-col gap-2.5">
                      {TYPES.map((t) => {
                        const of = groups.filter((g) => g.type === t);
                        const n = of.reduce((s, g) => s + g.members.length, 0);
                        return (
                          <li key={t}>
                            <div className="flex justify-between text-[0.76rem] mb-1"><span className="text-ink">{t}</span><span className="font-mono text-graphite">{of.length} groups · {n} people</span></div>
                            <Meter value={n} max={people} />
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                </div>
              </>
            )}
            {reportTab === "unplaced" && (
              <>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-[0.78rem] text-graphite">{seekers.length} people attend Sundays but are not in a group. Suggestions match area, day, and life stage.</span>
                  <SmallButton disabled={seekers.every((s) => s.invited)} onClick={() => { setSeekers((l) => l.map((s) => ({ ...s, invited: true }))); app.notify(`Group finder link sent to ${seekers.filter((s) => !s.invited).length} people by SMS`); }}><Send size={12} /> Send finder link to all</SmallButton>
                </div>
                <Table
                  rows={seekers}
                  rowKey={(s) => s.id}
                  empty="Everyone who attends is in a group."
                  columns={[
                    { key: "name", label: "Person", render: (s) => <span className="flex items-center gap-2"><Avatar name={s.name} size={24} /><span><span className="block text-ink">{s.name}</span><span className="block text-[0.68rem] text-mist">{s.area} · {s.stage}</span></span></span> },
                    { key: "since", label: "Attending since", hideOnMobile: true, render: (s) => <span className="font-mono text-[0.74rem]">{s.since}</span> },
                    { key: "match", label: "Suggested group", render: (s) => <span><span className="block text-ink-soft">{bestFor(s).name}</span><span className="block text-[0.68rem] text-mist">{weekly(bestFor(s).day)} {bestFor(s).time}</span></span> },
                    {
                      key: "act",
                      label: "",
                      align: "right",
                      render: (s) => (
                        <span className="inline-flex gap-1.5">
                          {s.invited ? <Status tone="muted">Invited</Status> : <SmallButton onClick={() => { setSeekers((l) => l.map((x) => (x.id === s.id ? { ...x, invited: true } : x))); app.notify(`Group finder link sent to ${s.name}`); }}>Invite</SmallButton>}
                          <SmallButton onClick={() => placeSeeker(s)}>Add to group</SmallButton>
                        </span>
                      ),
                    },
                  ]}
                />
              </>
            )}
          </>
        );
      })()}

      {/* ---- Slide-over forms ---- */}
      <ProtoModal open={isOpen("group")} title={gDraft.id ? `Edit ${gDraft.name || "group"}` : "New group"} onClose={close} footer={<PrimaryButton onClick={saveGroup} disabled={!gDraft.name.trim()}>{gDraft.id ? "Save group" : "Create group"}</PrimaryButton>}>
        <Field label="Group name"><input value={gDraft.name} onChange={(e) => setGDraft({ ...gDraft, name: e.target.value })} placeholder="Alabang Young Couples" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><select value={gDraft.type} onChange={(e) => setGDraft({ ...gDraft, type: e.target.value as GroupType })} className={inputClass}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Life stage"><select value={gDraft.stage} onChange={(e) => setGDraft({ ...gDraft, stage: e.target.value })} className={inputClass}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Meets on"><select value={gDraft.day} onChange={(e) => setGDraft({ ...gDraft, day: e.target.value as Day })} className={inputClass}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Time"><input value={gDraft.time} onChange={(e) => setGDraft({ ...gDraft, time: e.target.value })} className={inputClass} /></Field>
          <Field label="Area"><select value={gDraft.area} onChange={(e) => setGDraft({ ...gDraft, area: e.target.value })} className={inputClass}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></Field>
          {!gDraft.id && <Field label="Leader"><input value={gDraft.leader} onChange={(e) => setGDraft({ ...gDraft, leader: e.target.value })} placeholder="Full name" className={inputClass} /></Field>}
        </div>
        <Field label="Where it meets"><input value={gDraft.place} onChange={(e) => setGDraft({ ...gDraft, place: e.target.value })} placeholder="Barangay, home or room" className={inputClass} /></Field>
        <Field label="Description for the finder"><textarea value={gDraft.desc} onChange={(e) => setGDraft({ ...gDraft, desc: e.target.value })} placeholder="Who it is for and what to expect" className={textareaClass} /></Field>
        <div className="flex items-center justify-between gap-3 text-[0.8rem] text-ink">List in the group finder<Toggle on={gDraft.listed} onChange={(on) => setGDraft({ ...gDraft, listed: on })} label="List in the group finder" /></div>
      </ProtoModal>

      <ProtoModal open={isOpen("member")} title={`Add to ${groupOf(mDraft.groupId).name}`} onClose={close} footer={<PrimaryButton onClick={saveMember} disabled={mDraft.pick === "new" && !mDraft.name.trim()}>Add to group</PrimaryButton>}>
        <Field label="Person">
          <select value={mDraft.pick} onChange={(e) => setMDraft({ ...mDraft, pick: e.target.value })} className={inputClass}>
            <option value="new">Someone new</option>
            {[...seekers].sort((a, b) => matchScore(b, groupOf(mDraft.groupId)) - matchScore(a, groupOf(mDraft.groupId))).map((s) => <option key={s.id} value={s.id}>{s.name}, not in a group ({s.area})</option>)}
          </select>
        </Field>
        {mDraft.pick === "new" && (
          <>
            <Field label="Full name"><input value={mDraft.name} onChange={(e) => setMDraft({ ...mDraft, name: e.target.value })} placeholder="Maria Santos" className={inputClass} /></Field>
            <Field label="Mobile number"><input value={mDraft.phone} onChange={(e) => setMDraft({ ...mDraft, phone: e.target.value })} placeholder="0917 555 0100" className={inputClass} /></Field>
          </>
        )}
        <Field label="Role"><select value={mDraft.role} onChange={(e) => setMDraft({ ...mDraft, role: e.target.value as Role })} className={inputClass}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
        <p className="text-[0.72rem] text-mist">They get a welcome text with the next meeting and a link to the group chat.</p>
      </ProtoModal>

      <ProtoModal open={isOpen("event")} title="New event" onClose={close} footer={<PrimaryButton onClick={saveEvent} disabled={!eDraft.title.trim()}><CalendarDays size={14} /> Create event</PrimaryButton>}>
        <Field label="Group"><select value={eDraft.groupId} onChange={(e) => { const g = groupOf(e.target.value); setEDraft({ ...eDraft, groupId: g.id, time: g.time, place: g.place }); }} className={inputClass}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Event name"><input value={eDraft.title} onChange={(e) => setEDraft({ ...eDraft, title: e.target.value })} placeholder="Prayer and worship night" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><select value={eDraft.day} onChange={(e) => setEDraft({ ...eDraft, day: Number(e.target.value) })} className={inputClass}>{Array.from({ length: 11 }, (_, i) => TODAY + i).map((d) => <option key={d} value={d}>{dateLabel(d)}</option>)}</select></Field>
          <Field label="Time"><input value={eDraft.time} onChange={(e) => setEDraft({ ...eDraft, time: e.target.value })} className={inputClass} /></Field>
        </div>
        <Field label="Location"><input value={eDraft.place} onChange={(e) => setEDraft({ ...eDraft, place: e.target.value })} className={inputClass} /></Field>
        <Field label="Repeats"><select value={eDraft.repeat} onChange={(e) => setEDraft({ ...eDraft, repeat: e.target.value as Repeat })} className={inputClass}>{(["Does not repeat", "Weekly", "Every other week", "Monthly"] as Repeat[]).map((r) => <option key={r}>{r}</option>)}</select></Field>
        <p className="text-[0.72rem] text-mist">{groupOf(eDraft.groupId).members.length} members get an invite and can RSVP from the app.</p>
      </ProtoModal>

      <ProtoModal
        open={isOpen("resource")}
        title={rDraft.id ? "Edit resource" : "Add resource"}
        onClose={close}
        footer={
          <>
            {rDraft.id && <SmallButton onClick={() => { setResources((l) => l.filter((r) => r.id !== rDraft.id)); close(); app.notify(`Removed ${rDraft.title}`); }}>Remove resource</SmallButton>}
            <PrimaryButton onClick={saveResource} disabled={!rDraft.title.trim()}>{rDraft.id ? "Save resource" : "Add resource"}</PrimaryButton>
          </>
        }
      >
        <Field label="Title"><input value={rDraft.title} onChange={(e) => setRDraft({ ...rDraft, title: e.target.value })} placeholder="John week 6 discussion guide" className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kind"><select value={rDraft.kind} onChange={(e) => setRDraft({ ...rDraft, kind: e.target.value as Kind })} className={inputClass}>{(["PDF", "Slides", "Video", "Link"] as Kind[]).map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Shared with"><select value={rDraft.groupId} onChange={(e) => setRDraft({ ...rDraft, groupId: e.target.value })} className={inputClass}><option value="all">All groups</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        </div>
        <Field label={rDraft.kind === "Link" ? "Link" : "File details"}><input value={rDraft.meta} onChange={(e) => setRDraft({ ...rDraft, meta: e.target.value })} placeholder={rDraft.kind === "Link" ? "gracefellowship.ph/..." : "6 pages"} className={inputClass} /></Field>
        {!rDraft.id && rDraft.kind !== "Link" && <div className="h-16 rounded-lg border border-dashed border-rule bg-paper flex items-center justify-center text-[0.74rem] text-mist">Drop a file here</div>}
        <div className="flex items-center justify-between gap-3">
          <span><span className="block text-[0.8rem] text-ink">Leaders only</span><span className="block text-[0.7rem] text-mist">Members won&apos;t see it in the app</span></span>
          <Toggle on={rDraft.leadersOnly} onChange={(on) => setRDraft({ ...rDraft, leadersOnly: on })} label="Leaders only" />
        </div>
      </ProtoModal>

      <ProtoModal open={isOpen("message")} title={`Message ${leaderOf(groupOf(msgDraft.groupId))}`} onClose={close} footer={<PrimaryButton onClick={sendMessage} disabled={!msgDraft.body.trim()}><Send size={14} /> Send message</PrimaryButton>}>
        <p className="text-[0.75rem] text-mist">Leader of {groupOf(msgDraft.groupId).name} · {groupOf(msgDraft.groupId).members.find((m) => m.role === "Leader")?.phone}</p>
        <Field label="Message"><textarea value={msgDraft.body} onChange={(e) => setMsgDraft({ ...msgDraft, body: e.target.value })} className={cn(textareaClass, "min-h-[7rem]")} /></Field>
        <div className="flex items-center justify-between gap-3 text-[0.8rem] text-ink">Also send by SMS<Toggle on={msgDraft.sms} onChange={(on) => setMsgDraft({ ...msgDraft, sms: on })} label="Also send by SMS" /></div>
      </ProtoModal>

      <ProtoModal open={isOpen("visit")} title={`Visit ${groupOf(vDraft.groupId).name}`} onClose={close} footer={<PrimaryButton onClick={saveVisit}><CalendarDays size={14} /> Save visit</PrimaryButton>}>
        <Field label="Date">
          <select value={vDraft.day} onChange={(e) => setVDraft({ ...vDraft, day: Number(e.target.value) })} className={inputClass}>
            {Array.from({ length: 10 }, (_, i) => TODAY + 1 + i).map((d) => <option key={d} value={d}>{dateLabel(d)}{DAYS[d % 7] === groupOf(vDraft.groupId).day ? " · group meets" : ""}</option>)}
          </select>
        </Field>
        <Field label="Who visits"><select value={vDraft.who} onChange={(e) => setVDraft({ ...vDraft, who: e.target.value })} className={inputClass}>{VISITORS.map((v) => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Note"><textarea value={vDraft.note} onChange={(e) => setVDraft({ ...vDraft, note: e.target.value })} placeholder="Ask about the new work schedules" className={textareaClass} /></Field>
        <p className="text-[0.72rem] text-mist">{leaderOf(groupOf(vDraft.groupId))} gets a text and it goes on the care log.</p>
      </ProtoModal>

      <ProtoModal open={isOpen("request")} title={`Join ${groupOf(jDraft.groupId).name}`} onClose={close} footer={<PrimaryButton onClick={sendRequest} disabled={!jDraft.name.trim()}><Send size={14} /> Send request</PrimaryButton>}>
        <p className="text-[0.75rem] text-mist">This is what visitors see on the public page. {first(leaderOf(groupOf(jDraft.groupId)))} reviews each request.</p>
        <Field label="Your name"><input value={jDraft.name} onChange={(e) => setJDraft({ ...jDraft, name: e.target.value })} placeholder="Maria Santos" className={inputClass} /></Field>
        <Field label="Mobile number"><input value={jDraft.phone} onChange={(e) => setJDraft({ ...jDraft, phone: e.target.value })} placeholder="0917 555 0100" className={inputClass} /></Field>
        <Field label="A note for the leader"><textarea value={jDraft.note} onChange={(e) => setJDraft({ ...jDraft, note: e.target.value })} placeholder="Optional" className={textareaClass} /></Field>
      </ProtoModal>

      <ProtoModal open={isOpen("announce")} title="Announce to all groups" onClose={close} footer={<PrimaryButton onClick={sendAnnouncement} disabled={!aDraft.body.trim()}><Megaphone size={14} /> Post to {groups.length} groups</PrimaryButton>}>
        <Field label="Announcement"><textarea value={aDraft.body} onChange={(e) => setADraft({ ...aDraft, body: e.target.value })} placeholder="No groups on Nov 1. Join us for the All Saints' Day prayer service at 6 PM." className={cn(textareaClass, "min-h-[7rem]")} /></Field>
        <div className="flex items-center justify-between gap-3 text-[0.8rem] text-ink">Also send by SMS<Toggle on={aDraft.sms} onChange={(on) => setADraft({ ...aDraft, sms: on })} label="Also send by SMS" /></div>
        <p className="text-[0.72rem] text-mist">Pinned at the top of every group chat. {people} people notified.</p>
      </ProtoModal>

      <ProtoModal open={isOpen("assign")} title="Assign a reading plan" onClose={close} footer={<PrimaryButton onClick={saveAssign}>Assign plan</PrimaryButton>}>
        <Field label="Plan"><select value={pDraft.planId} onChange={(e) => setPDraft({ ...pDraft, planId: e.target.value })} className={inputClass}>{PLANS.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
        <Field label="Group"><select value={pDraft.groupId} onChange={(e) => setPDraft({ ...pDraft, groupId: e.target.value })} className={inputClass}>{groups.map((g) => <option key={g.id} value={g.id}>{g.name} · now on {planOf(g.planId).title}</option>)}</select></Field>
        <p className="text-[0.72rem] text-mist">The group starts at week 1. Members get the readings in the app each week.</p>
      </ProtoModal>
    </ProtoApp>
  );
}

// ---- Group chat --------------------------------------------------------------------------

function Thread({ msgs, onPost }: { msgs: ChatMsg[]; onPost: (body: string, pinned: boolean) => void }) {
  const [draft, setDraft] = useState("");
  const [pin, setPin] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const pinned = msgs.filter((m) => m.pinned).at(-1);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  return (
    <div className="flex flex-col bg-sheet border border-rule rounded-lg overflow-hidden">
      {pinned && (
        <div className="px-3.5 py-2 border-b border-rule bg-gold-wash text-[0.74rem]">
          <span className="font-semibold text-ink">Pinned announcement · </span>
          <span className="text-ink-soft">{pinned.body}</span>
        </div>
      )}
      <ul ref={listRef} className="p-3.5 flex flex-col gap-3 min-h-[12rem] max-h-[17rem] overflow-y-auto">
        {msgs.map((m) => (
          <li key={m.id} className="flex gap-2.5">
            <Avatar name={m.by} size={26} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[0.72rem]">
                <span className="font-medium text-ink">{m.by}</span>
                <span className="text-mist">{m.at}</span>
                {m.pinned && <Status tone="muted">Announcement</Status>}
              </div>
              <p className="text-[0.8rem] text-ink-soft">{m.body}</p>
            </div>
          </li>
        ))}
        {msgs.length === 0 && <li className="py-8 text-center text-[0.8rem] text-mist">No messages yet. Say hello to the group.</li>}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          onPost(draft.trim(), pin);
          setDraft("");
          setPin(false);
        }}
        className="border-t border-rule p-2.5 flex flex-col gap-2 bg-paper"
      >
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={pin ? "Write an announcement" : "Message the group"} aria-label="Message" className={inputClass} />
          <PrimaryButton type="submit" disabled={!draft.trim()}><Send size={13} /> {pin ? "Post" : "Send"}</PrimaryButton>
        </div>
        <div className="flex items-center gap-2 text-[0.72rem] text-graphite">
          <Toggle on={pin} onChange={setPin} label="Post as announcement" />
          Post as announcement. Pins it and notifies everyone.
        </div>
      </form>
    </div>
  );
}

// ---- Attendance ----------------------------------------------------------------------------

function AttendancePanel({ ev, group, onSubmit }: { ev: GEvent; group: Group; onSubmit: (a: Attendance) => void }) {
  const [editing, setEditing] = useState(!ev.taken);
  const [att, setAtt] = useState<Attendance>(() => ev.taken ?? { present: group.members.filter((m) => ev.rsvp[m.name] === "yes").map((m) => m.name), guests: 0, feel: "Great", care: "", note: "" });
  const total = group.members.length;

  if (ev.taken && !editing) {
    const t = ev.taken;
    return (
      <Panel title="Attendance" action={<SmallButton onClick={() => { setAtt(t); setEditing(true); }}>Edit attendance</SmallButton>}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[1.6rem] leading-none font-semibold text-ink tabular-nums">{t.present.length + t.guests}</span>
          <span className="text-[0.78rem] text-mist">came · {t.present.length} of {total} members, {t.guests} {t.guests === 1 ? "guest" : "guests"}</span>
        </div>
        <div className="text-[0.75rem] text-graphite mb-3">Went {t.feel.toLowerCase()}{t.care ? ` · Follow up with ${t.care}` : ""}</div>
        {t.note && <p className="text-[0.78rem] text-ink-soft mb-3">{t.note}</p>}
        <div className="flex flex-wrap gap-1.5">
          {group.members.map((m) => <span key={m.name} className={cn("px-2 py-0.5 rounded-md text-[0.7rem]", t.present.includes(m.name) ? "bg-gold-wash text-ink" : "bg-raised text-mist line-through")}>{m.name}</span>)}
        </div>
      </Panel>
    );
  }

  const toggle = (name: string) => setAtt((a) => ({ ...a, present: a.present.includes(name) ? a.present.filter((n) => n !== name) : [...a.present, name] }));
  const all = att.present.length === total;
  return (
    <Panel title="Take attendance" action={<SmallButton onClick={() => setAtt((a) => ({ ...a, present: all ? [] : group.members.map((m) => m.name) }))}>{all ? "Clear all" : "Mark all"}</SmallButton>}>
      <p className="text-[0.72rem] text-mist mb-2">Filled in from RSVPs. Tap a name to change it.</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
        {group.members.map((m) => {
          const on = att.present.includes(m.name);
          return (
            <li key={m.name}>
              <button type="button" aria-pressed={on} onClick={() => toggle(m.name)} className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left text-[0.78rem] cursor-pointer transition-colors", on ? "border-gold bg-gold-wash text-ink" : "border-rule bg-sheet text-graphite hover:border-mist")}>
                <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", on ? "bg-gold border-gold text-sheet" : "border-mist")}>{on && <Check size={10} strokeWidth={3} />}</span>
                <span className="truncate">{m.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.78rem] text-ink">Guests</span>
          <span className="flex items-center gap-2">
            <SmallButton label="One fewer guest" disabled={att.guests === 0} onClick={() => setAtt((a) => ({ ...a, guests: Math.max(0, a.guests - 1) }))}><Minus size={12} /></SmallButton>
            <span className="font-mono w-5 text-center tabular-nums text-ink" aria-live="polite">{att.guests}</span>
            <SmallButton label="One more guest" onClick={() => setAtt((a) => ({ ...a, guests: a.guests + 1 }))}><Plus size={12} /></SmallButton>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.78rem] text-ink">How did it go?</span>
          <Segmented id={`bs-feel-${ev.id}`} value={att.feel} onChange={(feel) => setAtt((a) => ({ ...a, feel }))} options={[{ id: "Great", label: "Great" }, { id: "Okay", label: "Okay" }, { id: "Hard", label: "Hard" }]} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 mb-3">
        <Field label="Anyone needing follow-up">
          <select value={att.care} onChange={(e) => setAtt((a) => ({ ...a, care: e.target.value }))} className={inputClass}>
            <option value="">No one this week</option>
            {group.members.map((m) => <option key={m.name}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Note for Pastor Joel">
          <textarea value={att.note} onChange={(e) => setAtt((a) => ({ ...a, note: e.target.value }))} placeholder="Prayer requests, wins, concerns" className={cn(textareaClass, "min-h-[3.5rem]")} />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-rule-soft">
        <span className="text-[0.75rem] text-graphite">{att.present.length} of {total} members{att.guests ? `, ${att.guests} ${att.guests === 1 ? "guest" : "guests"}` : ""}</span>
        <PrimaryButton onClick={() => { onSubmit(att); setEditing(false); }}><ClipboardCheck size={14} /> Submit attendance</PrimaryButton>
      </div>
    </Panel>
  );
}
