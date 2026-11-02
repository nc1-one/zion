"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Globe,
  Languages,
  LayoutDashboard,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Send,
  Siren,
  SlidersHorizontal,
  Tags,
  Upload,
  Users,
} from "lucide-react";
import {
  Field,
  KeyValues,
  Meter,
  Panel,
  PrimaryButton,
  ProtoApp,
  ProtoModal,
  ProtoHeading,
  Segmented,
  SmallButton,
  Stat,
  Status,
  Table,
  Toggle,
  inputClass,
  textareaClass,
  useProtoApp,
  type Column,
  type ProtoAlert,
  type ProtoSearchItem,
} from "./ProtoKit";
import {
  ACCURACY_BAR,
  ANALYZER_SAMPLES,
  CODE_SWITCHING,
  CUSTOM_TERMS,
  DAILY,
  DOCS,
  INCIDENTS,
  INCIDENT_DAY,
  LANGUAGE_STATS,
  MENTIONS,
  MODEL_LOG,
  QUERIES,
  REPLIES,
  REPLY_EN,
  REPORTS,
  REPORT_SECTIONS,
  RIVALS,
  RIVAL_TOPICS,
  RULES,
  SENT_REPORTS,
  SITES,
  SOURCES,
  TEAM,
  TODAY,
  TOPICS,
  USER,
  sourceOf,
  type ContentDoc,
  type Day,
  type Incident,
  type Mention,
  type Query,
  type Report,
  type Rival,
  type Rule,
  type RuleKind,
  type Site,
  type SourceId,
  type SourceKind,
  type Topic,
} from "./sentiment-data";
import { EMOTIONS, LANGUAGES, analyze, labelOfScore, langOf, matchQuery, parseQuery, type Analysis, type CustomTerm, type Hit, type Label, type LangId } from "./sentiment-engine";
import { cn } from "@/lib/utils";

// ---- Formatting ------------------------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const num = (n: number) => n.toLocaleString("en-US");
const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
const fmtDay = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};
const fmtTime = (t: string) => {
  const [h, min] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const whenOf = (m: Mention) => `${m.date === TODAY ? "Today" : fmtDay(m.date)}, ${fmtTime(m.time)}`;
const clock = () => "Nov 2, 10:05 AM";

// Ids for records created in the demo. Only called from event handlers.
let seq = 100;
const nextId = (prefix: string) => `${prefix}${++seq}`;

function downloadCsv(name: string, rows: (string | number)[][]) {
  // A leading = + - @ would run as a formula in a spreadsheet.
  const cell = (c: string | number) => `"${String(c).replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
  const url = URL.createObjectURL(new Blob([`﻿${rows.map((r) => r.map(cell).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Scoring helpers ---------------------------------------------------------------

const scoreOf = (m: Mention) => m.sentences.reduce((s, x) => s + x.score, 0) / m.sentences.length;

function labelOf(m: Mention): Label {
  if (m.corrected) return m.corrected;
  const up = m.sentences.some((s) => s.score >= 0.25);
  const down = m.sentences.some((s) => s.score <= -0.25);
  const avg = scoreOf(m);
  return up && down && Math.abs(avg) < 0.3 ? "Mixed" : labelOfScore(avg);
}

const textOf = (m: Mention) => m.sentences.map((s) => s.text).join(" ");
const englishOf = (m: Mention) => m.sentences.map((s) => s.en).join(" ");
const isNegative = (m: Mention) => labelOf(m) === "Negative";

const TONE: Record<Label, "good" | "warn" | "bad" | "muted"> = { Positive: "good", Neutral: "muted", Negative: "bad", Mixed: "warn" };
const TOPIC_ID = (name: string, topics: Topic[]) => topics.find((t) => t.name === name)?.id ?? "";

function totals(days: Pick<Day, "pos" | "neu" | "neg">[]) {
  const pos = days.reduce((s, d) => s + d.pos, 0);
  const neu = days.reduce((s, d) => s + d.neu, 0);
  const neg = days.reduce((s, d) => s + d.neg, 0);
  const all = pos + neu + neg;
  return { pos, neu, neg, all, net: all ? Math.round(((pos - neg) / all) * 100) : 0, posShare: all ? Math.round((pos / all) * 100) : 0, negShare: all ? Math.round((neg / all) * 100) : 0 };
}

const THIRTY = totals(DAILY.slice(-30));
const SHARE_SUM = LANGUAGE_STATS.reduce((s, l) => s + l.share, 0);
const langMentions = (share: number) => Math.round((share / SHARE_SUM) * THIRTY.all);
const AVERAGE_ACCURACY = Math.round((LANGUAGE_STATS.reduce((s, l) => s + l.accuracy * l.share, 0) / SHARE_SUM) * 10) / 10;

function backtest(rule: Pick<Rule, "kind" | "threshold" | "keyword">, mentions: Mention[]) {
  const days = DAILY.slice(-30);
  if (rule.kind === "Negative share") {
    const n = days.filter((d) => (d.neg / (d.pos + d.neu + d.neg)) * 100 >= rule.threshold).length;
    return `Would have fired on ${n} of the last 30 days`;
  }
  if (rule.kind === "Volume surge") {
    const n = DAILY.slice(-30).filter((d, i) => {
      const start = DAILY.length - 30 + i;
      const week = DAILY.slice(start - 7, start);
      const normal = week.reduce((s, x) => s + x.pos + x.neu + x.neg, 0) / 7;
      return d.pos + d.neu + d.neg >= normal * (1 + rule.threshold / 100);
    }).length;
    return `Would have fired on ${n} of the last 30 days`;
  }
  if (rule.kind === "High-reach author") {
    const n = mentions.filter((m) => isNegative(m) && m.reach >= rule.threshold).length;
    return `Matches ${n} of the ${mentions.length} sample mentions`;
  }
  const { node, error } = parseQuery(rule.keyword ?? "");
  if (!node) return error ?? "Type a keyword.";
  return `Matches ${mentions.filter((m) => matchQuery(node, docOf(m))).length} of the ${mentions.length} sample mentions`;
}

const docOf = (m: Mention) => ({ text: `${textOf(m)} ${englishOf(m)} ${m.author} ${m.handle ?? ""}`, lang: m.lang, source: m.source, sentiment: labelOf(m) });

// Timed steps for things that take a moment: a crawl, a training run.
function useSteps() {
  const [step, setStep] = useState<number | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const run = (count: number, ms: number, done: () => void) => {
    let i = 0;
    setStep(0);
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      i += 1;
      if (i >= count) {
        window.clearInterval(timer.current);
        setStep(null);
        done();
      } else setStep(i);
    }, ms);
  };
  return [step, run] as const;
}

// ---- Small parts -------------------------------------------------------------------

// On small screens the controls sit under the title, so neither gets squeezed.
function Head({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2.5 lg:gap-3 mb-4">
      <div className="min-w-0">
        <ProtoHeading className="font-display text-[1.2rem] leading-tight font-semibold text-ink tracking-[-0.015em]">{title}</ProtoHeading>
        {subtitle && <p className="text-[0.78rem] text-mist mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex flex-wrap items-center lg:justify-end gap-2">{action}</div>}
    </div>
  );
}

function Net({ value }: { value: number }) {
  return <span className={cn("font-medium tabular-nums", value >= 15 ? "text-good" : value <= -15 ? "text-danger" : "text-graphite")}>{signed(value)}</span>;
}

function SentimentBar({ pos, neu, neg, className }: { pos: number; neu: number; neg: number; className?: string }) {
  const all = pos + neu + neg || 1;
  return (
    <span role="img" aria-label={`${Math.round((pos / all) * 100)}% positive, ${Math.round((neu / all) * 100)}% neutral, ${Math.round((neg / all) * 100)}% negative`} className={cn("flex h-2 gap-px rounded-full overflow-hidden bg-raised", className)}>
      <span className="bg-good" style={{ width: `${(pos / all) * 100}%` }} />
      <span className="bg-mist/30" style={{ width: `${(neu / all) * 100}%` }} />
      <span className="bg-danger" style={{ width: `${(neg / all) * 100}%` }} />
    </span>
  );
}

function SourceTile({ id }: { id: SourceId }) {
  const s = sourceOf(id);
  return (
    <span title={s.name} aria-label={s.name} role="img" className="w-7 h-7 rounded-[5px] bg-raised text-graphite text-[0.6rem] font-bold tracking-tight flex items-center justify-center shrink-0">
      {s.tile}
    </span>
  );
}

function Legend() {
  return (
    <span className="flex items-center gap-3 text-[0.7rem] text-mist">
      {[["bg-good", "Positive"], ["bg-mist/30", "Neutral"], ["bg-danger", "Negative"]].map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-[2px]", c)} aria-hidden />
          {l}
        </span>
      ))}
    </span>
  );
}

function Foreign({ lang, className, children }: { lang: LangId; className?: string; children: React.ReactNode }) {
  const info = langOf(lang);
  return (
    <span lang={lang === "tl" ? "fil" : lang} dir={info.rtl ? "rtl" : undefined} className={cn(info.rtl && "text-right", className)}>
      {children}
    </span>
  );
}

// Marks the words the opinion came from.
function Marked({ text, marks }: { text: string; marks: { term: string; score: number }[] }) {
  const lower = text.toLowerCase();
  const spans = marks
    .map((k) => ({ ...k, at: lower.indexOf(k.term.toLowerCase()) }))
    .filter((k) => k.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: React.ReactNode[] = [];
  let i = 0;
  for (const s of spans) {
    if (s.at < i) continue;
    out.push(text.slice(i, s.at));
    out.push(
      <mark key={s.at} className={cn("rounded-[3px] px-0.5 text-ink", s.score >= 0 ? "bg-good/15" : "bg-danger/15")}>
        {text.slice(s.at, s.at + s.term.length)}
      </mark>,
    );
    i = s.at + s.term.length;
  }
  out.push(text.slice(i));
  return <>{out}</>;
}

function Sparkline({ values }: { values: number[] }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 64},${20 - ((v - lo) / (hi - lo || 1)) * 18}`).join(" ");
  const falling = values[values.length - 1] < values[0] - 4;
  return (
    <svg viewBox="0 0 64 22" width="64" height="22" aria-hidden className="shrink-0">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className={falling ? "text-danger" : "text-good"} />
    </svg>
  );
}

function Gone({ onBack }: { onBack: () => void }) {
  return (
    <Panel>
      <p className="text-[0.85rem] text-ink-soft">This record isn&rsquo;t in the sample data anymore. Reset brings back everything you changed.</p>
      <div className="mt-3">
        <SmallButton onClick={onBack}>
          <ArrowLeft size={13} /> Back
        </SmallButton>
      </div>
    </Panel>
  );
}

function Chip({ on, onClick, children }: { on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("px-2.5 py-1 rounded-md border text-[0.74rem] font-medium transition-colors cursor-pointer", on ? "border-gold bg-gold-wash text-gold" : "border-rule bg-sheet text-ink-soft hover:text-ink hover:bg-paper")}
    >
      {children}
    </button>
  );
}

// Stacked bars by day or week. Tap a bar, or use the arrow keys and Enter, to open that day's mentions.
function TrendChart({ data, onPick, mark }: { data: { key: string; label: string; pos: number; neu: number; neg: number }[]; onPick?: (key: string) => void; mark?: { key: string; text: string } }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.pos + d.neu + d.neg));
  const current = hover ?? data.length - 1;
  const shown = data[current];
  const t = totals([shown]);
  const markAt = mark ? data.findIndex((d) => d.key === mark.key) : -1;
  const every = Math.ceil(data.length / 6);

  const onKey = (e: React.KeyboardEvent) => {
    const move = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (move) {
      e.preventDefault();
      setHover(Math.min(data.length - 1, Math.max(0, current + move)));
    } else if (e.key === "Enter" && onPick) {
      e.preventDefault();
      onPick(shown.key);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <span aria-live="polite" className="text-[0.76rem] text-ink font-medium tabular-nums">
          {shown.label}: {num(t.all)} mentions, net {signed(t.net)}
        </span>
        <span className="ml-auto">
          <Legend />
        </span>
      </div>
      <div
        role="group"
        tabIndex={0}
        aria-label={onPick ? "Mentions by day. Left and right arrows change the day. Enter opens its mentions." : "Mentions by day. Left and right arrows change the day."}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
        className="relative h-44 flex items-end gap-[2px] sm:gap-[3px] rounded-[2px]"
      >
        {markAt >= 0 && mark && (
          <span className="absolute top-0 z-[1] -translate-x-1/2 text-[0.68rem] font-medium text-danger whitespace-nowrap pointer-events-none" style={{ left: `${Math.min(84, Math.max(14, ((markAt + 0.5) / data.length) * 100))}%` }}>
            {mark.text}
          </span>
        )}
        {data.map((d, i) => {
          const all = d.pos + d.neu + d.neg;
          return (
            <div
              key={d.key}
              data-day={d.key}
              onMouseEnter={() => setHover(i)}
              onClick={() => onPick?.(d.key)}
              className={cn("flex-1 min-w-0 h-full flex flex-col justify-end", onPick && "cursor-pointer")}
            >
              <span className={cn("w-full flex flex-col rounded-t-[2px] overflow-hidden transition-opacity", hover !== null && hover !== i && "opacity-55")} style={{ height: `${(all / max) * 86}%` }}>
                <span className="bg-danger" style={{ flex: d.neg }} />
                <span className="bg-mist/30" style={{ flex: d.neu }} />
                <span className="bg-good" style={{ flex: d.pos }} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-[2px] sm:gap-[3px] mt-1.5 pt-1.5 border-t border-rule" aria-hidden>
        {data.map((d, i) => (
          <span key={d.key} className="flex-1 min-w-0 text-[0.62rem] text-mist whitespace-nowrap overflow-visible">
            {i % every === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function MentionRow({ m, english, onOpen }: { m: Mention; english: boolean; onOpen: () => void }) {
  const label = labelOf(m);
  const lang = langOf(m.lang);
  const translated = english && m.lang !== "en";
  return (
    <button type="button" onClick={onOpen} className="w-full flex gap-3 px-3.5 py-3 text-left hover:bg-paper transition-colors cursor-pointer">
      <SourceTile id={m.source} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 text-[0.76rem]">
          <span className="font-semibold text-ink">{m.author}</span>
          {m.handle && <span className="text-mist">{m.handle}</span>}
          <span className="text-mist">{m.country}</span>
          <span className="sm:ml-auto text-mist tabular-nums">{whenOf(m)}</span>
        </span>
        {translated ? (
          <span className="block mt-1 text-[0.82rem] leading-snug text-ink-soft">{englishOf(m)}</span>
        ) : (
          <Foreign lang={m.lang} className="block mt-1 text-[0.82rem] leading-snug text-ink-soft">
            {textOf(m)}
          </Foreign>
        )}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-mist">
          <Status tone={TONE[label]}>{label}</Status>
          <span>{m.emotion}</span>
          <span aria-hidden>·</span>
          <span>
            {lang.name}
            {m.codeSwitch ? ` (${m.codeSwitch})` : ""}
          </span>
          {m.reach > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{short(m.reach)} reach</span>
            </>
          )}
          {m.opinions[0] && (
            <>
              <span aria-hidden>·</span>
              <span>{m.opinions[0].topic}</span>
            </>
          )}
          {m.sarcasm && <Status tone="warn">Possible sarcasm</Status>}
          {m.status !== "New" && <Status tone={m.status === "Replied" ? "good" : "muted"}>{m.assignee && m.status === "Assigned" ? m.assignee : m.status}</Status>}
        </span>
      </span>
    </button>
  );
}

function MentionList({ mentions, english = true, onOpen, empty = "No mentions match." }: { mentions: Mention[]; english?: boolean; onOpen: (m: Mention) => void; empty?: string }) {
  if (!mentions.length) return <p className="py-8 text-center text-[0.8rem] text-mist">{empty}</p>;
  return (
    <ul className="divide-y divide-rule-soft">
      {mentions.map((m) => (
        <li key={m.id}>
          <MentionRow m={m} english={english} onOpen={() => onOpen(m)} />
        </li>
      ))}
    </ul>
  );
}

function BarRow({ label, value, max, right, onClick }: { label: React.ReactNode; value: number; max: number; right: React.ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3 text-[0.78rem]">
        <span className="text-ink-soft truncate">{label}</span>
        <span className="text-mist tabular-nums shrink-0">{right}</span>
      </span>
      <Meter value={value} max={max} className="mt-1.5" />
    </>
  );
  if (!onClick) return <div>{body}</div>;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left cursor-pointer hover:opacity-80 transition-opacity">
      {body}
    </button>
  );
}

// ---- App state ---------------------------------------------------------------------

interface MentionFilter {
  q: string;
  sentiment: "all" | "Positive" | "Neutral" | "Negative" | "Mixed";
  source: string;
  lang: string;
  topic: string;
  quick: "" | "reply" | "low" | "switch" | "sarcasm" | "reach";
  date: string;
}

const NO_FILTER: MentionFilter = { q: "", sentiment: "all", source: "all", lang: "all", topic: "all", quick: "", date: "" };

const openMention = (app: ReturnType<typeof useProtoApp>, m: Mention) => app.open("mention", m.id, m.handle ?? m.author);

function useSentiment() {
  const app = useProtoApp("overview");
  const [mentions, setMentions] = useState(MENTIONS);
  const [topics, setTopics] = useState(TOPICS);
  const [langOn, setLangOn] = useState<Partial<Record<LangId, boolean>>>({});
  const [requested, setRequested] = useState<LangId[]>([]);
  const [sources, setSources] = useState(SOURCES);
  const [sites, setSites] = useState(SITES);
  const [docs, setDocs] = useState(DOCS);
  const [incidents, setIncidents] = useState(INCIDENTS);
  const [rules, setRules] = useState(RULES);
  const [rivals, setRivals] = useState(RIVALS);
  const [reports, setReports] = useState(REPORTS);
  const [sent, setSent] = useState(SENT_REPORTS);
  const [queries, setQueries] = useState(QUERIES);
  const [terms, setTerms] = useState(CUSTOM_TERMS);
  const [model, setModel] = useState({ version: MODEL_LOG[0].version, accuracy: AVERAGE_ACCURACY, corrections: 212, log: MODEL_LOG });
  const [watched, setWatched] = useState<string[]>(["m37", "m16"]);
  const [filter, setFilter] = useState(NO_FILTER);
  const [english, setEnglish] = useState(false);

  const isOn = (id: LangId) => langOn[id] !== false;
  const queue = mentions.filter((m) => m.confidence < 0.8 && !m.reviewed && !m.corrected);

  const patchMention = (id: string, patch: Partial<Mention>) => setMentions((all) => all.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const correct = (id: string, label: "Positive" | "Neutral" | "Negative") => {
    patchMention(id, { corrected: label, reviewed: true });
    setModel((x) => ({ ...x, corrections: x.corrections + 1 }));
  };
  const patchIncident = (id: string, patch: Partial<Incident>, event?: string, by = USER) =>
    setIncidents((all) => all.map((i) => (i.id === id ? { ...i, ...patch, timeline: event ? [...i.timeline, { id: nextId("e"), at: clock(), by, text: event }] : i.timeline } : i)));
  const showMentions = (patch: Partial<MentionFilter>) => {
    setFilter({ ...NO_FILTER, ...patch });
    app.section("mentions");
  };

  return {
    app, mentions, setMentions, topics, setTopics, isOn, setLangOn, requested, setRequested, sources, setSources, sites, setSites, docs, setDocs, incidents, rules, setRules, rivals, setRivals, reports, setReports, sent, setSent, queries, setQueries, terms, setTerms, model, setModel, watched, setWatched, filter, setFilter, english, setEnglish, queue, patchMention, correct, patchIncident, showMentions,
  };
}

type S = ReturnType<typeof useSentiment>;

// ---- The app -----------------------------------------------------------------------

export function SentimentPrototype() {
  const s = useSentiment();
  const { app, incidents, mentions, queue } = s;
  const open = incidents.filter((i) => i.status !== "Resolved");

  const nav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "mentions", label: "Mentions", icon: MessageSquare },
    { id: "topics", label: "Topics", icon: Tags },
    { id: "languages", label: "Languages", icon: Languages },
    { id: "sources", label: "Sources", icon: Globe },
    { id: "content", label: "Content", icon: FileText },
    { id: "alerts", label: "Alerts", icon: Siren, badge: open.length || undefined },
    { id: "competitors", label: "Competitors", icon: Scale },
    { id: "people", label: "People", icon: Users },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "queries", label: "Queries", icon: Filter },
    { id: "model", label: "Model", icon: SlidersHorizontal, badge: queue.length || undefined },
  ];

  const inbox: ProtoAlert[] = [
    ...open.map((i) => ({ text: `${i.severity} incident: ${i.title}`, time: i.started, stack: [{ screen: "alerts" }, { screen: "incident", id: i.id, label: i.title }] })),
    ...mentions
      .filter((m) => isNegative(m) && m.status === "New" && m.reach >= 20000)
      .map((m) => ({ text: `${m.author} (${short(m.reach)} reach) posted a complaint`, time: whenOf(m), stack: [{ screen: "mentions" }, { screen: "mention", id: m.id, label: m.handle ?? m.author }] })),
    ...(queue.length ? [{ text: `${queue.length} low-confidence mentions need a person`, time: "Review queue", stack: [{ screen: "model" }] }] : []),
  ];

  const search: ProtoSearchItem[] = [
    ...mentions.map((m) => ({ label: `${m.author}: ${englishOf(m).slice(0, 44)}`, hint: "Mention", stack: [{ screen: "mentions" }, { screen: "mention", id: m.id, label: m.handle ?? m.author }] })),
    ...s.topics.map((t) => ({ label: t.name, hint: "Topic", stack: [{ screen: "topics" }, { screen: "topic", id: t.id, label: t.name }] })),
    ...LANGUAGES.map((l) => ({ label: l.name, hint: "Language", stack: [{ screen: "languages" }, { screen: "language", id: l.id, label: l.name }] })),
    ...incidents.map((i) => ({ label: i.title, hint: "Incident", stack: [{ screen: "alerts" }, { screen: "incident", id: i.id, label: i.title }] })),
    ...s.docs.map((d) => ({ label: d.title, hint: d.kind, stack: [{ screen: "content" }, { screen: "doc", id: d.id, label: d.title }] })),
    ...s.sites.map((x) => ({ label: x.domain, hint: "Website", stack: [{ screen: "sources" }, { screen: "site", id: x.id, label: x.domain }] })),
    ...s.queries.map((q) => ({ label: q.name, hint: "Query", stack: [{ screen: "queries" }, { screen: "query", id: q.id, label: q.name }] })),
    ...s.reports.map((r) => ({ label: r.name, hint: "Report", stack: [{ screen: "reports" }, { screen: "report", id: r.id, label: r.name }] })),
  ];

  return (
    <ProtoApp app={app} name="Sentiment · Kapwa Relief" user={USER} nav={nav} inbox={inbox} search={search}>
      {app.screen === "overview" && <Overview s={s} />}
      {app.screen === "mentions" && <Mentions s={s} />}
      {app.screen === "mention" && <MentionDetail s={s} />}
      {app.screen === "topics" && <Topics s={s} />}
      {app.screen === "topic" && <TopicDetail s={s} />}
      {app.screen === "languages" && <LanguageList s={s} />}
      {app.screen === "language" && <LanguageDetail s={s} />}
      {app.screen === "sources" && <Sources s={s} />}
      {app.screen === "site" && <SiteDetail s={s} />}
      {app.screen === "content" && <Content s={s} />}
      {app.screen === "doc" && <DocDetail s={s} />}
      {app.screen === "alerts" && <Alerts s={s} />}
      {app.screen === "incident" && <IncidentDetail s={s} />}
      {app.screen === "competitors" && <Competitors s={s} />}
      {app.screen === "people" && <People s={s} />}
      {app.screen === "person" && <PersonDetail s={s} />}
      {app.screen === "reports" && <Reports s={s} />}
      {app.screen === "report" && <ReportDetail s={s} />}
      {app.screen === "queries" && <Queries s={s} />}
      {app.screen === "query" && <QueryDetail s={s} />}
      {app.screen === "model" && <Model s={s} />}
    </ProtoApp>
  );
}

// ---- Overview ----------------------------------------------------------------------

function Overview({ s }: { s: S }) {
  const { app, mentions, incidents, topics, queue } = s;
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const n = Number(range);
  const days = DAILY.slice(-n);
  const now = totals(days);
  const before = n < 90 ? totals(DAILY.slice(-2 * n, -n)) : null;
  const change = (a: number, b: number) => (before ? `${signed(a - b)} vs previous ${n} days` : undefined);

  const data =
    n === 90
      ? Array.from({ length: 13 }, (_, i) => {
          const week = days.slice(i * 7 - 1 < 0 ? 0 : i * 7 - 1, i * 7 + 6);
          const t = totals(week);
          return { key: week[0].date, label: fmtDay(week[0].date), pos: t.pos, neu: t.neu, neg: t.neg };
        })
      : days.map((d) => ({ key: d.date, label: fmtDay(d.date), pos: d.pos, neu: d.neu, neg: d.neg }));

  const topIncident = incidents.find((i) => i.status !== "Resolved");
  const needsReply = mentions.filter((m) => isNegative(m) && m.status === "New" && m.reach >= 5000);
  const emotionCounts = EMOTIONS.map((name) => ({ name, n: mentions.filter((m) => m.emotion === name).length })).sort((a, b) => b.n - a.n);
  const topLangs = LANGUAGE_STATS.slice(0, 6);
  const sorted = [...topics].sort((a, b) => b.mentions - a.mentions).slice(0, 6);

  return (
    <>
      <Head
        title="Overview"
        subtitle={`Social, web, reviews, and news in ${LANGUAGES.length} languages`}
        action={<Segmented id="sa-range" value={range} onChange={setRange} options={[{ id: "7", label: "7 days" }, { id: "30", label: "30 days" }, { id: "90", label: "90 days" }]} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Net sentiment" value={signed(now.net)} sub={before ? change(now.net, before.net) : undefined} tone={before && now.net < before.net ? "bad" : "good"} />
        <Stat label="Mentions" value={num(now.all)} sub={before ? `${signed(Math.round((now.all / before.all - 1) * 100))}% vs previous` : undefined} />
        <Stat label="Positive" value={`${now.posShare}%`} sub={before ? change(now.posShare, before.posShare) : undefined} />
        <Stat label="Negative" value={`${now.negShare}%`} sub={before ? change(now.negShare, before.negShare) : undefined} tone={before && now.negShare > before.negShare ? "bad" : "good"} />
      </div>

      {topIncident && (
        <div className="mt-3">
          <Panel title="What changed" action={<Status tone={topIncident.severity === "High" ? "bad" : "warn"}>{topIncident.severity}</Status>}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[0.88rem] font-semibold text-ink">{topIncident.title}</div>
                <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-soft">{topIncident.summary}</p>
              </div>
              <div className="shrink-0">
                <SmallButton onClick={() => app.open("incident", topIncident.id, topIncident.title)}>Open incident</SmallButton>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Sentiment over time" className="lg:col-span-2">
          <TrendChart data={data} mark={n === 90 ? undefined : { key: INCIDENT_DAY, text: "Receipts delayed" }} onPick={n === 90 ? undefined : (date) => s.showMentions({ date })} />
        </Panel>
        <Panel title="Needs attention">
          <ul className="flex flex-col divide-y divide-rule-soft -my-1.5">
            {incidents
              .filter((i) => i.status !== "Resolved")
              .map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => app.open("incident", i.id, i.title)} className="w-full py-2 text-left cursor-pointer group">
                    <span className="block text-[0.8rem] font-medium text-ink group-hover:underline">{i.title}</span>
                    <span className="block text-[0.72rem] text-mist">Incident, {i.owner ?? "no owner yet"}</span>
                  </button>
                </li>
              ))}
            <li>
              <button type="button" onClick={() => s.showMentions({ quick: "reply" })} className="w-full py-2 text-left cursor-pointer group">
                <span className="block text-[0.8rem] font-medium text-ink group-hover:underline">{needsReply.length} complaints with reach</span>
                <span className="block text-[0.72rem] text-mist">5k+ reach, no reply yet</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={() => app.section("model")} className="w-full py-2 text-left cursor-pointer group">
                <span className="block text-[0.8rem] font-medium text-ink group-hover:underline">{queue.length} mentions to review</span>
                <span className="block text-[0.72rem] text-mist">The model wasn&rsquo;t sure</span>
              </button>
            </li>
          </ul>
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Topics" className="lg:col-span-2" action={<SmallButton onClick={() => app.section("topics")}>All topics</SmallButton>}>
          <ul className="flex flex-col gap-3">
            {sorted.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => app.open("topic", t.id, t.name)} className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity">
                  <span className="flex items-baseline justify-between gap-3 text-[0.78rem]">
                    <span className="text-ink-soft">{t.name}</span>
                    <span className="text-mist tabular-nums">
                      {num(t.mentions)} · <Net value={t.pos - t.neg} />
                    </span>
                  </span>
                  <SentimentBar pos={t.pos} neu={t.neu} neg={t.neg} className="mt-1.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Emotions">
            <div className="flex flex-col gap-2.5">
              {emotionCounts.slice(0, 5).map((e) => (
                <BarRow key={e.name} label={e.name} value={e.n} max={emotionCounts[0].n} right={`${Math.round((e.n / mentions.length) * 100)}%`} />
              ))}
            </div>
          </Panel>
          <Panel title="Top languages" action={<SmallButton onClick={() => app.section("languages")}>All {LANGUAGES.length}</SmallButton>}>
            <div className="flex flex-col gap-2.5">
              {topLangs.map((l) => (
                <BarRow key={l.id} label={langOf(l.id).name} value={l.share} max={topLangs[0].share} right={<Net value={l.net} />} onClick={() => app.open("language", l.id, langOf(l.id).name)} />
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

// ---- Mentions ----------------------------------------------------------------------

const QUICK: { id: MentionFilter["quick"]; label: string; test: (m: Mention) => boolean }[] = [
  { id: "reply", label: "Needs reply", test: (m) => isNegative(m) && m.status === "New" },
  { id: "low", label: "Low confidence", test: (m) => m.confidence < 0.8 },
  { id: "switch", label: "Code-switched", test: (m) => !!m.codeSwitch },
  { id: "sarcasm", label: "Sarcasm", test: (m) => !!m.sarcasm },
  { id: "reach", label: "20k+ reach", test: (m) => m.reach >= 20000 },
];

function Mentions({ s }: { s: S }) {
  const { app, filter: f, setFilter, english, setEnglish, topics } = s;
  const set = (patch: Partial<MentionFilter>) => setFilter({ ...f, ...patch });
  const rows = s.mentions.filter((m) => {
    if (!s.isOn(m.lang)) return false;
    const q = f.q.trim().toLowerCase();
    if (q && !`${textOf(m)} ${englishOf(m)} ${m.author} ${m.handle ?? ""} ${m.country}`.toLowerCase().includes(q)) return false;
    if (f.sentiment !== "all" && labelOf(m) !== f.sentiment) return false;
    if (f.source !== "all" && m.source !== f.source) return false;
    if (f.lang !== "all" && m.lang !== f.lang) return false;
    if (f.topic !== "all" && !m.opinions.some((o) => o.topic === f.topic)) return false;
    if (f.date && m.date !== f.date) return false;
    const quick = QUICK.find((x) => x.id === f.quick);
    return !quick || quick.test(m);
  });

  const exportRows = () => {
    downloadCsv("kapwa-mentions.csv", [
      ["Date", "Time", "Source", "Author", "Country", "Language", "Sentiment", "Score", "Confidence", "Text", "English"],
      ...rows.map((m) => [m.date, m.time, sourceOf(m.source).name, m.author, m.country, langOf(m.lang).name, labelOf(m), scoreOf(m).toFixed(2), m.confidence, textOf(m), englishOf(m)]),
    ]);
    app.notify(`Exported ${rows.length} mentions`);
  };

  return (
    <>
      <Head
        title="Mentions"
        subtitle={`${rows.length} sample mentions of ${num(THIRTY.all)} in the last 30 days`}
        action={
          <>
            <Segmented id="sa-trans" value={english ? "en" : "orig"} onChange={(v) => setEnglish(v === "en")} options={[{ id: "orig", label: "Original" }, { id: "en", label: "In English" }]} />
            <SmallButton onClick={exportRows}>
              <Download size={13} /> Export CSV
            </SmallButton>
          </>
        }
      />

      <div className="flex flex-col gap-2.5 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented id="sa-sent" value={f.sentiment} onChange={(v) => set({ sentiment: v })} options={[{ id: "all", label: "All" }, { id: "Positive", label: "Positive" }, { id: "Neutral", label: "Neutral" }, { id: "Mixed", label: "Mixed" }, { id: "Negative", label: "Negative" }]} />
          <span className="relative flex-1 min-w-[12rem]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist" aria-hidden />
            <input value={f.q} onChange={(e) => set({ q: e.target.value })} className={cn(inputClass, "pl-8")} placeholder="Search text, translation, or author" aria-label="Search mentions" />
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select aria-label="Source" value={f.source} onChange={(e) => set({ source: e.target.value })} className={inputClass}>
            <option value="all">All sources</option>
            {s.sources.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select aria-label="Language" value={f.lang} onChange={(e) => set({ lang: e.target.value })} className={inputClass}>
            <option value="all">All languages</option>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select aria-label="Topic" value={f.topic} onChange={(e) => set({ topic: e.target.value })} className={inputClass}>
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK.map((q) => (
            <Chip key={q.id} on={f.quick === q.id} onClick={() => set({ quick: f.quick === q.id ? "" : q.id })}>
              {q.label}
            </Chip>
          ))}
          {f.date && (
            <Chip on onClick={() => set({ date: "" })}>
              {fmtDay(f.date)} ×
            </Chip>
          )}
        </div>
      </div>

      <Panel className="[&>div:last-child]:p-0">
        <MentionList mentions={rows} english={english} onOpen={(m) => openMention(app, m)} empty="No mentions match. Clear a filter to see more." />
      </Panel>
    </>
  );
}

function MentionDetail({ s }: { s: S }) {
  const { app, mentions, topics } = s;
  const m = mentions.find((x) => x.id === app.id);
  const [draft, setDraft] = useState<string | null>(null);
  const [fix, setFix] = useState<"Positive" | "Neutral" | "Negative" | null>(null);
  if (!m) return <Gone onBack={app.back} />;

  const label = labelOf(m);
  const info = langOf(m.lang);
  const avg = scoreOf(m);
  const kind = avg < 0 ? "sorry" : "thanks";
  const similar = mentions.filter((x) => x.id !== m.id && x.opinions.some((o) => m.opinions.some((p) => p.topic === o.topic))).slice(0, 3);

  const saveFix = () => {
    if (!fix) return;
    s.correct(m.id, fix);
    setFix(null);
    app.notify("Saved. It joins the next training set.");
  };

  return (
    <>
      <Head
        title={m.author}
        subtitle={`${sourceOf(m.source).name}${m.handle ? ` · ${m.handle}` : ""} · ${m.country} · ${whenOf(m)}`}
        action={
          <>
            <Status tone={TONE[label]}>{label}</Status>
            {m.corrected && <Status tone="muted">Corrected by you</Status>}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-3 items-start">
        <div className="flex flex-col gap-3 min-w-0">
          <Panel title="By sentence">
            <ul className="flex flex-col gap-2.5">
              {m.sentences.map((x, i) => (
                <li key={i} className={cn("pl-3 border-l-[3px]", x.score > 0.15 ? "border-good" : x.score < -0.15 ? "border-danger" : "border-rule")}>
                  <div className="flex items-start justify-between gap-3">
                    <Foreign lang={m.lang} className="block min-w-0 flex-1 text-[0.9rem] leading-snug text-ink">
                      <Marked text={x.text} marks={m.opinions.map((o) => ({ term: o.opinion, score: o.score }))} />
                    </Foreign>
                    <span className="text-[0.72rem] font-mono tabular-nums text-mist shrink-0">
                      {x.score > 0 ? "+" : ""}
                      {x.score.toFixed(2)}
                    </span>
                  </div>
                  {m.lang !== "en" && <div className="mt-0.5 text-[0.76rem] leading-snug text-mist">{x.en}</div>}
                </li>
              ))}
            </ul>
            {m.sarcasm && (
              <p className="mt-3 flex gap-2 text-[0.76rem] leading-snug text-warn">
                <AlertTriangle size={14} className="shrink-0 mt-px" aria-hidden />
                The words read positive, but the context doesn&rsquo;t. Flagged as possible sarcasm.
              </p>
            )}
          </Panel>

          <Panel title="Opinions">
            <ul className="divide-y divide-rule-soft -my-1.5">
              {m.opinions.map((o) => (
                <li key={o.topic + o.opinion} className="py-2 flex items-center gap-3 text-[0.8rem]">
                  <button type="button" onClick={() => app.open("topic", TOPIC_ID(o.topic, topics), o.topic)} className="font-medium text-ink hover:underline cursor-pointer text-left">
                    {o.topic}
                  </button>
                  <Foreign lang={m.lang} className="min-w-0 flex-1 truncate text-mist">
                    {o.opinion}
                  </Foreign>
                  <Status tone={o.score > 0.15 ? "good" : o.score < -0.15 ? "bad" : "muted"}>{labelOfScore(o.score)}</Status>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Reply"
            action={
              m.status === "Replied" ? (
                <Status tone="good">Sent</Status>
              ) : draft === null ? (
                <SmallButton onClick={() => setDraft(REPLIES[m.lang][kind])}>Draft reply</SmallButton>
              ) : undefined
            }
          >
            {m.status === "Replied" ? (
              <p className="text-[0.8rem] text-ink-soft">Replied in {info.name} by {USER}.</p>
            ) : draft === null ? (
              <p className="text-[0.8rem] text-mist">Drafts in {info.name}, with the English beside it. You approve before it sends.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} dir={info.rtl ? "rtl" : undefined} lang={m.lang} aria-label={`Reply in ${info.name}`} className={textareaClass} />
                {m.lang !== "en" && <p className="text-[0.74rem] text-mist">English: {REPLY_EN[kind]}</p>}
                <div className="flex justify-end">
                  <PrimaryButton
                    onClick={() => {
                      s.patchMention(m.id, { status: "Replied" });
                      setDraft(null);
                      app.notify(`Reply sent in ${info.name}`);
                    }}
                  >
                    <Send size={13} /> Send reply
                  </PrimaryButton>
                </div>
              </div>
            )}
          </Panel>

          {similar.length > 0 && (
            <Panel title="Similar mentions" className="[&>div:last-child]:p-0">
              <MentionList mentions={similar} onOpen={(x) => openMention(app, x)} />
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Analysis">
            <KeyValues
              items={[
                ["Score", <span key="s" className="font-mono tabular-nums">{avg > 0 ? "+" : ""}{avg.toFixed(2)}</span>],
                ["Confidence", `${Math.round(m.confidence * 100)}%`],
                ["Emotion", m.emotion],
                ["Language", m.codeSwitch ? `${info.name} (${m.codeSwitch})` : info.name],
                ["Reach", m.reach ? num(m.reach) : "Private"],
              ]}
            />
          </Panel>
          <Panel title="Assign">
            <select
              aria-label="Assign to"
              value={m.assignee ?? ""}
              onChange={(e) => {
                s.patchMention(m.id, { assignee: e.target.value || undefined, status: e.target.value ? "Assigned" : "New" });
                if (e.target.value) app.notify(`Assigned to ${e.target.value}`);
              }}
              className={inputClass}
            >
              <option value="">Nobody yet</option>
              {TEAM.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Panel>
          <Panel title="Correct the label">
            <div className="flex flex-col gap-2 items-start">
              <div className="flex flex-wrap gap-1.5">
                {(["Positive", "Neutral", "Negative"] as const).map((x) => (
                  <Chip key={x} on={fix === x} onClick={() => setFix(fix === x ? null : x)}>
                    {x}
                  </Chip>
                ))}
              </div>
              <SmallButton disabled={!fix} onClick={saveFix}>
                Save correction
              </SmallButton>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

// ---- Topics ------------------------------------------------------------------------

const matchesTopic = (m: Mention, t: Topic) => {
  if (m.opinions.some((o) => o.topic === t.name)) return true;
  if (!t.keywords) return false;
  const text = `${textOf(m)} ${englishOf(m)}`.toLowerCase();
  return t.keywords.split(",").some((k) => k.trim() && text.includes(k.trim().toLowerCase()));
};

function Topics({ s }: { s: S }) {
  const { app, topics, setTopics, mentions } = s;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");

  const preview = keywords.trim() ? mentions.filter((m) => matchesTopic(m, { ...TOPICS[0], name: "", keywords })) : [];

  const add = () => {
    const found = preview;
    const pos = found.filter((m) => labelOf(m) === "Positive").length;
    const neg = found.filter((m) => labelOf(m) === "Negative").length;
    const share = (n: number) => (found.length ? Math.round((n / found.length) * 100) : 0);
    const id = nextId("topic");
    const topic: Topic = { id, name: name.trim(), mentions: found.length, pos: share(pos), neu: found.length ? 100 - share(pos) - share(neg) : 100, neg: share(neg), change: 0, praise: [], complaints: [], trend: [0, 0], custom: true, keywords };
    setTopics((all) => [topic, ...all]);
    setAdding(false);
    setName("");
    setKeywords("");
    app.open("topic", id, topic.name);
  };

  const columns: Column<Topic>[] = [
    { key: "name", label: "Topic", render: (t) => <span className="font-medium text-ink">{t.name}</span> },
    { key: "mentions", label: "Mentions", align: "right", render: (t) => <span className="tabular-nums">{num(t.mentions)}</span> },
    { key: "bar", label: "Sentiment", hideOnMobile: true, render: (t) => <SentimentBar pos={t.pos} neu={t.neu} neg={t.neg} className="w-36" /> },
    { key: "net", label: "Net", align: "right", render: (t) => <Net value={t.pos - t.neg} /> },
    { key: "change", label: "30 days", align: "right", hideOnMobile: true, render: (t) => <span className={cn("tabular-nums", t.change > 100 ? "text-danger font-medium" : "text-mist")}>{t.custom ? "New" : `${signed(t.change)}%`}</span> },
    { key: "trend", label: "Net by week", hideOnMobile: true, render: (t) => (t.custom ? <span className="text-mist">—</span> : <Sparkline values={t.trend} />) },
  ];

  return (
    <>
      <Head
        title="Topics"
        subtitle="What people talk about, and how they feel about each thing"
        action={
          <PrimaryButton onClick={() => setAdding(true)}>
            <Plus size={14} /> New topic
          </PrimaryButton>
        }
      />
      <Table columns={columns} rows={topics} rowKey={(t) => t.id} onRowClick={(t) => app.open("topic", t.id, t.name)} />

      <ProtoModal
        open={adding}
        title="New topic"
        onClose={() => setAdding(false)}
        footer={
          <PrimaryButton disabled={!name.trim() || !keywords.trim()} onClick={add}>
            Create topic
          </PrimaryButton>
        }
      >
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tax receipts" />
        </Field>
        <Field label="Words, in any language, separated by commas">
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} placeholder="tax, fiscal, 領収書, resibo" />
        </Field>
        <p className="text-[0.78rem] text-mist">{keywords.trim() ? `Finds ${preview.length} of the ${mentions.length} sample mentions.` : "Matches update as you type."}</p>
      </ProtoModal>
    </>
  );
}

function TopicDetail({ s }: { s: S }) {
  const { app, topics, mentions } = s;
  const t = topics.find((x) => x.id === app.id);
  if (!t) return <Gone onBack={app.back} />;
  const rows = mentions.filter((m) => matchesTopic(m, t));
  const byLang = LANGUAGES.map((l) => {
    const inLang = rows.filter((m) => m.lang === l.id);
    const pos = inLang.filter((m) => labelOf(m) === "Positive").length;
    const neg = inLang.filter((m) => labelOf(m) === "Negative").length;
    return { id: l.id, name: l.name, n: inLang.length, pos, neg, neu: inLang.length - pos - neg };
  })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  return (
    <>
      <Head
        title={t.name}
        subtitle={t.custom ? `Custom topic · ${t.keywords}` : `${num(t.mentions)} mentions in 30 days`}
        action={
          <SmallButton onClick={() => s.showMentions({ topic: t.name })}>
            <MessageSquare size={13} /> All mentions
          </SmallButton>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Net" value={signed(t.pos - t.neg)} tone={t.pos - t.neg < 0 ? "bad" : "good"} sub={t.pos - t.neg < 0 ? "More complaints than praise" : "More praise than complaints"} />
        <Stat label="Positive" value={`${t.pos}%`} />
        <Stat label="Neutral" value={`${t.neu}%`} />
        <Stat label="Negative" value={`${t.neg}%`} />
      </div>

      {!t.custom && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Panel title="What people praise">
            <ul className="flex flex-wrap gap-1.5">
              {t.praise.map((w) => (
                <li key={w} className="px-2 py-1 rounded-md bg-good/10 text-[0.78rem] text-good">
                  {w}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="What people complain about">
            <ul className="flex flex-wrap gap-1.5">
              {t.complaints.map((w) => (
                <li key={w} className="px-2 py-1 rounded-md bg-danger-wash text-[0.78rem] text-danger">
                  {w}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-3 items-start">
        <Panel title="Sample mentions" className="[&>div:last-child]:p-0 min-w-0">
          <MentionList mentions={rows.slice(0, 8)} onOpen={(m) => openMention(app, m)} />
        </Panel>
        <Panel title="By language">
          {byLang.length ? (
            <ul className="flex flex-col gap-3">
              {byLang.map((l) => (
                <li key={l.id}>
                  <div className="flex justify-between text-[0.78rem]">
                    <span className="text-ink-soft">{l.name}</span>
                    <span className="text-mist tabular-nums">{l.n}</span>
                  </div>
                  <SentimentBar pos={l.pos} neu={l.neu} neg={l.neg} className="mt-1.5" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.8rem] text-mist">No sample mentions yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

// ---- Languages ---------------------------------------------------------------------

type LangRow = (typeof LANGUAGE_STATS)[number];

function LanguageList({ s }: { s: S }) {
  const { app, model } = s;
  const needing = LANGUAGE_STATS.filter((l) => l.accuracy < ACCURACY_BAR).length;
  const columns: Column<LangRow>[] = [
    {
      key: "name",
      label: "Language",
      render: (l) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{langOf(l.id).name}</span>
          {langOf(l.id).native !== langOf(l.id).name && (
            <Foreign lang={l.id} className="self-start text-[0.72rem] text-mist">
              {langOf(l.id).native}
            </Foreign>
          )}
        </span>
      ),
    },
    { key: "mentions", label: "Mentions", align: "right", render: (l) => <span className="tabular-nums">{num(langMentions(l.share))}</span> },
    { key: "net", label: "Net", align: "right", render: (l) => <Net value={l.net} /> },
    {
      key: "accuracy",
      label: "Accuracy",
      align: "right",
      render: (l) => <span className={cn("tabular-nums", l.accuracy < ACCURACY_BAR ? "text-warn font-medium" : "text-ink-soft")}>{l.accuracy}%</span>,
    },
    { key: "tested", label: "Tested on", align: "right", hideOnMobile: true, render: (l) => <span className="tabular-nums text-mist">{num(l.tested)}</span> },
    { key: "on", label: "On", align: "right", render: (l) => <Toggle on={s.isOn(l.id)} onChange={(on) => s.setLangOn((x) => ({ ...x, [l.id]: on }))} label={`Track ${langOf(l.id).name}`} /> },
  ];

  return (
    <>
      <Head title="Languages" subtitle="Each one scored in its own language, then tested by native speakers" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat label="Languages" value={String(LANGUAGES.length)} sub={`${LANGUAGES.filter((l) => l.rtl).length} right-to-left`} />
        <Stat label="Average accuracy" value={`${model.accuracy.toFixed(1)}%`} sub={`Model ${model.version}`} />
        <Stat label="Below 85%" value={String(needing)} sub="Needs more labeled samples" tone="bad" />
        <Stat label="Native reviewers" value={String(LANGUAGE_STATS.reduce((n, l) => n + l.reviewers, 0))} />
      </div>
      <div className="mb-3">
        <Panel title="Code-switching">
          <p className="text-[0.78rem] text-mist mb-3">People mix languages in one sentence. Each mix has its own test set.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CODE_SWITCHING.map((c) => (
              <button key={c.name} type="button" onClick={() => s.showMentions({ quick: "switch" })} className="text-left cursor-pointer hover:opacity-80 transition-opacity">
                <span className="flex items-baseline justify-between gap-2 text-[0.8rem]">
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className={cn("tabular-nums", c.accuracy < ACCURACY_BAR ? "text-warn font-medium" : "text-mist")}>{c.accuracy}%</span>
                </span>
                <span className="block text-[0.72rem] text-mist mt-0.5">{c.mix}</span>
                <Meter value={c.accuracy} max={100} className="mt-1.5" />
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <Table columns={columns} rows={LANGUAGE_STATS} rowKey={(l) => l.id} onRowClick={(l) => app.open("language", l.id, langOf(l.id).name)} />
    </>
  );
}

function LanguageDetail({ s }: { s: S }) {
  const { app, mentions, requested, setRequested, terms } = s;
  const stat = LANGUAGE_STATS.find((l) => l.id === app.id);
  if (!stat) return <Gone onBack={app.back} />;
  const info = langOf(stat.id);
  const rows = mentions.filter((m) => m.lang === stat.id);
  const own = terms.filter((t) => t.lang === stat.id);
  const asked = requested.includes(stat.id);
  const below = stat.accuracy < ACCURACY_BAR;

  return (
    <>
      <Head
        title={info.name}
        subtitle={info.native === info.name ? `${num(langMentions(stat.share))} mentions in 30 days` : info.native}
        action={
          <SmallButton onClick={() => s.showMentions({ lang: stat.id })}>
            <MessageSquare size={13} /> All mentions
          </SmallButton>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Mentions" value={num(langMentions(stat.share))} sub={`${((stat.share / SHARE_SUM) * 100).toFixed(1)}% of all`} />
        <Stat label="Net" value={signed(stat.net)} />
        <Stat label="Accuracy" value={`${stat.accuracy}%`} tone={below ? "bad" : "good"} sub={below ? "Below the 85% bar" : "Above the 85% bar"} />
        <Stat label="Tested on" value={num(stat.tested)} sub={`${stat.reviewers} native ${stat.reviewers === 1 ? "reviewer" : "reviewers"}`} />
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-3 items-start">
        <Panel title="Sample mentions" className="[&>div:last-child]:p-0 min-w-0">
          <MentionList mentions={rows} english={false} onOpen={(m) => openMention(app, m)} empty="No sample mentions in this language today." />
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="How it's tested">
            <div className="flex flex-col gap-2.5">
              <BarRow label="Positive" value={Math.min(99, stat.accuracy + 2)} max={100} right={`${Math.min(99, stat.accuracy + 2)}%`} />
              <BarRow label="Neutral" value={stat.accuracy - 6} max={100} right={`${stat.accuracy - 6}%`} />
              <BarRow label="Negative" value={Math.min(99, stat.accuracy + 1)} max={100} right={`${Math.min(99, stat.accuracy + 1)}%`} />
            </div>
            <div className="mt-3">
              <SmallButton
                disabled={asked}
                onClick={() => {
                  setRequested((r) => [...r, stat.id]);
                  app.notify(`Asked ${stat.reviewers} ${info.name} ${stat.reviewers === 1 ? "reviewer" : "reviewers"} for 500 more samples`);
                }}
              >
                {asked ? "500 samples requested" : "Request 500 samples"}
              </SmallButton>
            </div>
          </Panel>
          <Panel title="Custom terms">
            {own.length ? (
              <ul className="flex flex-col gap-1.5 text-[0.78rem]">
                {own.map((t) => (
                  <li key={t.id} className="flex justify-between gap-2">
                    <Foreign lang={t.lang} className="font-medium text-ink">
                      {t.term}
                    </Foreign>
                    <span className="text-mist text-right">{t.meaning}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[0.78rem] text-mist">None yet.</p>
            )}
            <div className="mt-3">
              <SmallButton onClick={() => app.section("model")}>Manage terms</SmallButton>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

// ---- Sources -----------------------------------------------------------------------

const KINDS: SourceKind[] = ["Social", "Reviews and forums", "News and blogs", "Your channels"];
const CRAWL_STEPS = ["Reading robots.txt", "Finding pages", "Detecting languages", "Scoring comments"];

function Sources({ s }: { s: S }) {
  const { app, sources, setSources, sites, setSites } = s;
  const [tab, setTab] = useState<"channels" | "websites" | "privacy">("channels");
  const [adding, setAdding] = useState(false);
  const [domain, setDomain] = useState("");
  const [kind, setKind] = useState<Site["kind"]>("Partner");
  const [step, run] = useSteps();
  const [privacy, setPrivacy] = useState({ mask: true, robots: true, retain: true });
  const [hook, setHook] = useState(true);

  const crawl = () => {
    const name = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    if (!name) return;
    run(CRAWL_STEPS.length, 550, () => {
      const id = nextId("s");
      setSites((all) => [
        ...all,
        {
          id, domain: name, kind, languages: "English", frequency: "Daily", crawled: "Just now",
          pages: [
            { id: nextId("p"), path: "/", title: "Home", comments: 0, net: 0, note: "No comments yet" },
            { id: nextId("p"), path: "/about", title: "About", comments: 0, net: 0, note: "No comments yet" },
            { id: nextId("p"), path: "/news", title: "News", comments: 12, net: 18, note: "First crawl" },
          ],
        },
      ]);
      setAdding(false);
      setDomain("");
      app.notify(`${name} added. First crawl finished.`);
    });
  };

  const siteColumns: Column<Site>[] = [
    { key: "domain", label: "Website", render: (x) => <span className="font-medium text-ink">{x.domain}</span> },
    { key: "kind", label: "Type", hideOnMobile: true, render: (x) => x.kind },
    { key: "pages", label: "Pages", align: "right", render: (x) => <span className="tabular-nums">{x.pages.length}</span> },
    { key: "net", label: "Net", align: "right", render: (x) => <Net value={Math.round(x.pages.reduce((n, p) => n + p.net, 0) / x.pages.length)} /> },
    { key: "languages", label: "Languages", hideOnMobile: true, render: (x) => x.languages },
    { key: "crawled", label: "Last crawl", hideOnMobile: true, render: (x) => <span className="text-mist">{x.crawled}</span> },
  ];

  return (
    <>
      <Head
        title="Sources"
        subtitle="Where mentions come from"
        action={
          <>
            <Segmented id="sa-src" value={tab} onChange={setTab} options={[{ id: "channels", label: "Channels" }, { id: "websites", label: "Websites" }, { id: "privacy", label: "Privacy and API" }]} />
            {tab === "websites" && (
              <PrimaryButton onClick={() => setAdding(true)}>
                <Plus size={14} /> Add website
              </PrimaryButton>
            )}
          </>
        }
      />

      {tab === "channels" && (
        <div className="flex flex-col gap-3">
          {KINDS.map((k) => (
            <Panel key={k} title={k} className="[&>div:last-child]:py-1">
              <ul className="divide-y divide-rule-soft">
                {sources
                  .filter((x) => x.kind === k)
                  .map((x) => (
                    <li key={x.id} className="py-2.5 flex items-center gap-3">
                      <SourceTile id={x.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.82rem] font-medium text-ink">{x.name}</span>
                        <span className="block text-[0.72rem] text-mist truncate">{x.on ? `${x.note} · synced ${x.synced}` : "Paused"}</span>
                      </span>
                      <span className="hidden sm:block w-14 text-right text-[0.78rem] tabular-nums text-mist">{x.share}%</span>
                      <span className="w-10 text-right text-[0.78rem]">
                        <Net value={x.net} />
                      </span>
                      <Toggle on={x.on} onChange={(on) => setSources((all) => all.map((y) => (y.id === x.id ? { ...y, on } : y)))} label={`Track ${x.name}`} />
                    </li>
                  ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}

      {tab === "websites" && <Table columns={siteColumns} rows={sites} rowKey={(x) => x.id} onRowClick={(x) => app.open("site", x.id, x.domain)} />}

      {tab === "privacy" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <Panel title="Data rules">
            <ul className="divide-y divide-rule-soft -my-1.5">
              {(
                [
                  ["mask", "Mask personal data", "Hides phone numbers and emails found in posts."],
                  ["robots", "Respect robots.txt", "Skips pages a website asks crawlers to leave alone."],
                  ["retain", "Delete after 13 months", "Removes raw posts. Totals stay."],
                ] as const
              ).map(([id, label, detail]) => (
                <li key={id} className="py-2.5 flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.82rem] font-medium text-ink">{label}</span>
                    <span className="block text-[0.72rem] text-mist">{detail}</span>
                  </span>
                  <Toggle on={privacy[id]} onChange={(on) => setPrivacy((p) => ({ ...p, [id]: on }))} label={label} />
                </li>
              ))}
              <li className="py-2.5 text-[0.76rem] leading-snug text-mist">Public posts and your own channels only. Private groups and direct messages are never collected.</li>
            </ul>
          </Panel>
          <Panel title="API" action={<Toggle on={hook} onChange={setHook} label="Send incident webhooks" />}>
            <p className="text-[0.76rem] text-mist mb-2">{hook ? "Incidents post to your webhook." : "Incident webhooks are off."} Send any text to the same model:</p>
            <pre className="p-3 rounded-[4px] bg-[#101828] text-[#E4E7EC] text-[0.68rem] leading-relaxed font-mono overflow-x-auto" tabIndex={0} aria-label="Sample API request">{`POST /v1/analyze
{ "text": "Ang bilis ng relief team!" }

200 OK
{
  "language": "tl",
  "code_switching": "Taglish",
  "label": "positive",
  "score": 0.85,
  "confidence": 0.96,
  "emotions": ["joy"],
  "opinions": [{
    "topic": "Relief speed",
    "text": "Ang bilis",
    "label": "positive"
  }]
}`}</pre>
          </Panel>
        </div>
      )}

      <ProtoModal
        open={adding}
        title="Add website"
        onClose={() => setAdding(false)}
        footer={
          <PrimaryButton disabled={!domain.trim() || step !== null} onClick={crawl}>
            {step !== null ? "Crawling…" : "Start crawl"}
          </PrimaryButton>
        }
      >
        <Field label="Domain">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass} placeholder="partner.example" />
        </Field>
        <Field label="Type">
          <select value={kind} onChange={(e) => setKind(e.target.value as Site["kind"])} className={inputClass}>
            {(["Your site", "Partner", "Press", "Review site"] as const).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        {step !== null && (
          <div className="flex flex-col gap-1.5" role="status">
            <span className="text-[0.78rem] text-ink-soft">{CRAWL_STEPS[step]}…</span>
            <Meter value={step + 1} max={CRAWL_STEPS.length} />
          </div>
        )}
      </ProtoModal>
    </>
  );
}

function SiteDetail({ s }: { s: S }) {
  const { app, sites, setSites } = s;
  const site = sites.find((x) => x.id === app.id);
  const [step, run] = useSteps();
  if (!site) return <Gone onBack={app.back} />;
  const update = (patch: Partial<Site>) => setSites((all) => all.map((x) => (x.id === site.id ? { ...x, ...patch } : x)));
  type P = Site["pages"][number];
  const columns: Column<P>[] = [
    {
      key: "title",
      label: "Page",
      render: (p) => (
        <span className="flex flex-col min-w-0">
          <span className="font-medium text-ink">{p.title}</span>
          <span className="text-[0.72rem] text-mist font-mono">{p.path}</span>
        </span>
      ),
    },
    { key: "comments", label: "Comments", align: "right", render: (p) => <span className="tabular-nums">{p.comments}</span> },
    { key: "net", label: "Net", align: "right", render: (p) => <Net value={p.net} /> },
    { key: "note", label: "Note", hideOnMobile: true, render: (p) => <span className="text-mist">{p.note}</span> },
  ];
  return (
    <>
      <Head
        title={site.domain}
        subtitle={`${site.kind} · ${site.languages}`}
        action={
          <SmallButton
            disabled={step !== null}
            onClick={() =>
              run(CRAWL_STEPS.length, 450, () => {
                update({ crawled: "Just now" });
                app.notify(`${site.domain} crawled`);
              })
            }
          >
            <RefreshCw size={13} className={step !== null ? "animate-spin" : ""} /> {step !== null ? CRAWL_STEPS[step] : "Crawl now"}
          </SmallButton>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat label="Pages tracked" value={String(site.pages.length)} />
        <Stat label="Comments" value={num(site.pages.reduce((n, p) => n + p.comments, 0))} />
        <Stat label="Last crawl" value={site.crawled} />
        <div className="flex flex-col gap-1.5 justify-center">
          <span className="text-[0.74rem] font-medium text-mist">Crawl how often</span>
          <select aria-label="Crawl how often" value={site.frequency} onChange={(e) => update({ frequency: e.target.value })} className={inputClass}>
            {["Hourly", "Every 6 hours", "Daily", "Weekly"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <Table columns={columns} rows={[...site.pages].sort((a, b) => a.net - b.net)} rowKey={(p) => p.id} />
    </>
  );
}

// ---- Content -----------------------------------------------------------------------

function HitText({ text, hits }: { text: string; hits: Hit[] }) {
  const out: React.ReactNode[] = [];
  let i = 0;
  for (const h of hits) {
    out.push(text.slice(i, h.start));
    out.push(
      <mark key={h.start} title={h.flipped ? "Negated" : h.custom ? "Custom term" : undefined} className={cn("rounded-[3px] px-0.5 text-ink", h.value >= 0 ? "bg-good/15" : "bg-danger/15")}>
        {text.slice(h.start, h.end)}
      </mark>,
    );
    i = h.end;
  }
  out.push(text.slice(i));
  return <>{out}</>;
}

function AnalysisResult({ result, onSave }: { result: Analysis; onSave: () => void }) {
  const info = langOf(result.lang);
  const left = ((result.score + 1) / 2) * 100;
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <Panel title="Result" action={<Status tone={TONE[result.label]}>{result.label}</Status>}>
        <div className="relative h-2 rounded-full bg-gradient-to-r from-danger via-raised to-good" role="img" aria-label={`Score ${result.score.toFixed(2)} from minus one to plus one`}>
          <motion.span className="absolute -top-1 w-1 h-4 -ml-0.5 rounded-full bg-ink" initial={{ left: "50%" }} animate={{ left: `${left}%` }} transition={{ type: "spring", stiffness: 180, damping: 22 }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[0.66rem] text-mist">
          <span>Negative</span>
          <span className="font-mono tabular-nums">
            {result.score > 0 ? "+" : ""}
            {result.score.toFixed(2)}
          </span>
          <span>Positive</span>
        </div>
        <div className="mt-3">
          <KeyValues
            items={[
              ["Language", result.codeSwitch ? `${info.name} (${result.codeSwitch})` : info.name],
              ["Confidence", `${Math.round(result.confidence * 100)}%`],
              ["Opinion words", String(result.terms)],
            ]}
          />
        </div>
        {result.terms === 0 && !result.sarcasm && <p className="mt-3 text-[0.76rem] text-mist">No opinion words found, so this scores neutral with low confidence. A trained model reads more than this demo&rsquo;s word list.</p>}
        {result.sarcasm && (
          <p className="mt-3 flex gap-2 text-[0.76rem] leading-snug text-warn">
            <AlertTriangle size={14} className="shrink-0 mt-px" aria-hidden /> Possible sarcasm. In production this goes to a person.
          </p>
        )}
      </Panel>

      <Panel title="By sentence">
        <ul className="flex flex-col gap-2.5">
          {result.sentences.map((x, i) => (
            <li key={i} className={cn("pl-3 border-l-[3px] flex items-start justify-between gap-3", x.score > 0.15 ? "border-good" : x.score < -0.15 ? "border-danger" : "border-rule")}>
              <Foreign lang={result.lang} className="block min-w-0 flex-1 text-[0.86rem] leading-snug text-ink">
                <HitText text={x.text} hits={x.hits} />
              </Foreign>
              <span className="text-[0.72rem] font-mono tabular-nums text-mist shrink-0">
                {x.score > 0 ? "+" : ""}
                {x.score.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Panel title="Emotions">
          {result.emotions.length ? (
            <div className="flex flex-col gap-2.5">
              {result.emotions.map((e) => (
                <BarRow key={e.name} label={e.name} value={e.share} max={100} right={`${e.share}%`} />
              ))}
            </div>
          ) : (
            <p className="text-[0.78rem] text-mist">None found.</p>
          )}
        </Panel>
        <Panel title="Topics">
          {result.topics.length ? (
            <ul className="flex flex-col gap-1.5 text-[0.8rem]">
              {result.topics.map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-2">
                  <span className="text-ink-soft">{t.name}</span>
                  <Status tone={t.score > 0.15 ? "good" : t.score < -0.15 ? "bad" : "muted"}>{labelOfScore(t.score)}</Status>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.78rem] text-mist">None of the tracked topics.</p>
          )}
        </Panel>
      </div>
      <div>
        <SmallButton onClick={onSave}>
          <FileText size={13} /> Save to library
        </SmallButton>
      </div>
    </div>
  );
}

interface BatchRow {
  id: number;
  text: string;
  result: Analysis;
}

function Content({ s }: { s: S }) {
  const { app, docs, setDocs, terms } = s;
  const [tab, setTab] = useState<"analyze" | "library" | "batch">("analyze");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [batch, setBatch] = useState<{ name: string; rows: BatchRow[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (value = text) => setResult(value.trim() ? analyze(value, terms) : null);

  const save = () => {
    if (!result) return;
    const id = nextId("d");
    const doc: ContentDoc = {
      id,
      title: `${text.trim().slice(0, 36)}${text.trim().length > 36 ? "…" : ""}`,
      kind: "Article",
      lang: result.lang,
      status: "Draft",
      owner: USER,
      updated: TODAY,
      paragraphs: result.sentences.map((x) => ({ text: x.text, score: x.score })),
    };
    setDocs((all) => [doc, ...all]);
    app.open("doc", id, doc.title);
  };

  const runBatch = (name: string, lines: string[]) => {
    const rows = lines
      .map((l) => l.trim().replace(/^"|"$/g, ""))
      .filter(Boolean)
      .slice(0, 500)
      .map((line, id) => ({ id, text: line, result: analyze(line, terms) }));
    setBatch({ name, rows });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) return app.notify("That file is over 2 MB. Try a smaller one.");
    runBatch(file.name, (await file.text()).split(/\r?\n/));
  };

  const batchTotals = batch
    ? {
        pos: batch.rows.filter((r) => r.result.label === "Positive").length,
        neg: batch.rows.filter((r) => r.result.label === "Negative").length,
        mixed: batch.rows.filter((r) => r.result.label === "Mixed").length,
        low: batch.rows.filter((r) => r.result.confidence < 0.6).length,
        langs: new Set(batch.rows.map((r) => r.result.lang)).size,
      }
    : null;

  const docColumns: Column<ContentDoc>[] = [
    { key: "title", label: "Title", render: (d) => <span className="font-medium text-ink">{d.title}</span> },
    { key: "kind", label: "Type", hideOnMobile: true, render: (d) => d.kind },
    { key: "lang", label: "Language", hideOnMobile: true, render: (d) => langOf(d.lang).name },
    { key: "tone", label: "Tone", render: (d) => {
      const avg = d.paragraphs.reduce((n, p) => n + p.score, 0) / (d.paragraphs.length || 1);
      const label = labelOfScore(avg);
      return <Status tone={TONE[label]}>{label}</Status>;
    } },
    { key: "flags", label: "Flags", align: "right", render: (d) => <span className="tabular-nums">{d.paragraphs.filter((p) => p.note).length}</span> },
    { key: "status", label: "Status", hideOnMobile: true, render: (d) => <Status tone={d.status === "Published" ? "good" : "muted"}>{d.status}</Status> },
  ];

  const batchColumns: Column<BatchRow>[] = [
    { key: "text", label: "Text", render: (r) => <Foreign lang={r.result.lang} className="block max-w-[34rem] truncate">{r.text}</Foreign> },
    { key: "lang", label: "Language", hideOnMobile: true, render: (r) => langOf(r.result.lang).name },
    { key: "label", label: "Result", render: (r) => <Status tone={TONE[r.result.label]}>{r.result.label}</Status> },
    { key: "conf", label: "Confidence", align: "right", hideOnMobile: true, render: (r) => <span className="tabular-nums">{Math.round(r.result.confidence * 100)}%</span> },
  ];

  return (
    <>
      <Head
        title="Content"
        subtitle="Check any text before or after it goes out"
        action={<Segmented id="sa-content" value={tab} onChange={setTab} options={[{ id: "analyze", label: "Analyze text" }, { id: "library", label: "Library" }, { id: "batch", label: "Batch" }]} />}
      />

      {tab === "analyze" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <Panel title="Text">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={cn(textareaClass, "min-h-[9rem]")}
              dir="auto"
              aria-label="Text to analyze"
              placeholder="Paste a post, review, article, or email, in any of the 24 languages."
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ANALYZER_SAMPLES.map((x) => (
                <Chip
                  key={x.label}
                  onClick={() => {
                    setText(x.text);
                    setResult(null);
                  }}
                >
                  {x.label}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[0.72rem] text-mist tabular-nums">{text.length ? `${num(text.length)} characters` : ""}</span>
              <PrimaryButton disabled={!text.trim()} onClick={() => run()}>
                <Play size={13} /> Analyze
              </PrimaryButton>
            </div>
            <p className="mt-3 pt-3 border-t border-rule-soft text-[0.72rem] leading-snug text-mist">This demo scores real text with a small word list per language, in your browser. A deployment uses trained models and reads far more.</p>
          </Panel>
          {result ? (
            <AnalysisResult result={result} onSave={save} />
          ) : (
            <Panel title="Result">
              <p className="py-10 text-center text-[0.8rem] text-mist">Paste text or pick a sample, then choose Analyze.</p>
            </Panel>
          )}
        </div>
      )}

      {tab === "library" && <Table columns={docColumns} rows={docs} rowKey={(d) => d.id} onRowClick={(d) => app.open("doc", d.id, d.title)} />}

      {tab === "batch" && (
        <div className="flex flex-col gap-3">
          <Panel title="Score a whole file">
            <p className="text-[0.8rem] text-ink-soft">One text per line, in any mix of languages. Up to 500 lines here. The file stays in your browser.</p>
            <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(e) => void onFile(e)} className="sr-only" aria-label="Choose a file" tabIndex={-1} />
            <div className="mt-3 flex flex-wrap gap-2">
              <PrimaryButton onClick={() => fileRef.current?.click()}>
                <Upload size={13} /> Choose a file
              </PrimaryButton>
              <SmallButton onClick={() => runBatch("sample-mentions.csv", s.mentions.map(textOf))}>Use the sample mentions</SmallButton>
            </div>
          </Panel>
          {batch && batchTotals && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Lines scored" value={num(batch.rows.length)} sub={batch.name} />
                <Stat label="Positive" value={String(batchTotals.pos)} />
                <Stat label="Negative" value={String(batchTotals.neg)} />
                <Stat label="Languages" value={String(batchTotals.langs)} sub={`${batchTotals.low} low confidence`} />
              </div>
              <Panel
                title="Results"
                action={
                  <SmallButton
                    onClick={() =>
                      downloadCsv("sentiment-results.csv", [
                        ["Text", "Language", "Code-switching", "Result", "Score", "Confidence"],
                        ...batch.rows.map((r) => [r.text, langOf(r.result.lang).name, r.result.codeSwitch ?? "", r.result.label, r.result.score.toFixed(2), r.result.confidence.toFixed(2)]),
                      ])
                    }
                  >
                    <Download size={13} /> Download CSV
                  </SmallButton>
                }
              >
                <SentimentBar pos={batchTotals.pos} neu={batch.rows.length - batchTotals.pos - batchTotals.neg} neg={batchTotals.neg} className="mb-3" />
                <Table columns={batchColumns} rows={batch.rows.slice(0, 25)} rowKey={(r) => String(r.id)} />
              </Panel>
            </>
          )}
        </div>
      )}
    </>
  );
}

function DocDetail({ s }: { s: S }) {
  const { app, docs, setDocs } = s;
  const doc = docs.find((d) => d.id === app.id);
  if (!doc) return <Gone onBack={app.back} />;
  const avg = doc.paragraphs.reduce((n, p) => n + p.score, 0) / (doc.paragraphs.length || 1);
  const label = labelOfScore(avg);
  const flags = doc.paragraphs.filter((p) => p.note);

  const applyRewrite = (i: number) => {
    setDocs((all) =>
      all.map((d) =>
        d.id === doc.id
          ? { ...d, paragraphs: d.paragraphs.map((p, j) => (j === i && p.rewrite ? { text: p.rewrite, score: p.rewriteScore ?? p.score } : p)) }
          : d,
      ),
    );
    app.notify("Rewrite applied");
  };

  return (
    <>
      <Head
        title={doc.title}
        subtitle={`${doc.kind} · ${langOf(doc.lang).name} · ${doc.owner}`}
        action={
          <>
            <Status tone={TONE[label]}>{label}</Status>
            {doc.status === "Draft" && (
              <PrimaryButton
                onClick={() => {
                  setDocs((all) => all.map((d) => (d.id === doc.id ? { ...d, status: "Published" } : d)));
                  app.notify("Marked as published");
                }}
              >
                Mark published
              </PrimaryButton>
            )}
          </>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat label="Overall tone" value={`${avg > 0 ? "+" : ""}${avg.toFixed(2)}`} />
        <Stat label="Paragraphs" value={String(doc.paragraphs.length)} />
        <Stat label="Flags" value={String(flags.length)} tone={flags.length ? "bad" : "good"} sub={flags.length ? "Worth another look" : "Reads well"} />
        <Stat label="Status" value={doc.status} />
      </div>
      <Panel title="Paragraph by paragraph">
        <ul className="flex flex-col gap-3.5">
          {doc.paragraphs.map((p, i) => (
            <li key={i} className={cn("pl-3 border-l-[3px]", p.score > 0.15 ? "border-good" : p.score < -0.15 ? "border-danger" : "border-rule")}>
              <div className="flex items-start justify-between gap-3">
                <Foreign lang={doc.lang} className="block min-w-0 flex-1 text-[0.88rem] leading-snug text-ink">
                  {p.text}
                </Foreign>
                <span className="text-[0.72rem] font-mono tabular-nums text-mist shrink-0">
                  {p.score > 0 ? "+" : ""}
                  {p.score.toFixed(2)}
                </span>
              </div>
              {p.note && <p className="mt-1 text-[0.76rem] leading-snug text-warn">{p.note}</p>}
              {p.rewrite && (
                <div className="mt-2 p-2.5 rounded-[4px] bg-paper border border-rule">
                  <div className="text-[0.7rem] font-medium text-mist">Suggested</div>
                  <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-soft">{p.rewrite}</p>
                  <div className="mt-2">
                    <SmallButton onClick={() => applyRewrite(i)}>Use this</SmallButton>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

// ---- Alerts ------------------------------------------------------------------------

const BLANK_RULE = { name: "", kind: "Negative share" as RuleKind, threshold: "25", keyword: "", notify: "Slack #comms" };
const RULE_UNIT: Record<RuleKind, string> = { "Negative share": "% negative", "Volume surge": "% above normal", Keyword: "", "High-reach author": "followers or more" };

function Alerts({ s }: { s: S }) {
  const { app, incidents, rules, setRules, mentions } = s;
  const [tab, setTab] = useState<"incidents" | "rules">("incidents");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(BLANK_RULE);

  const draftRule = { kind: draft.kind, threshold: Number(draft.threshold) || 0, keyword: draft.keyword };
  const addRule = () => {
    setRules((all) => [{ id: nextId("r"), name: draft.name.trim(), kind: draft.kind, threshold: draftRule.threshold, keyword: draft.keyword || undefined, notify: draft.notify, on: true }, ...all]);
    setAdding(false);
    setDraft(BLANK_RULE);
    app.notify("Rule created");
  };

  const incidentColumns: Column<Incident>[] = [
    { key: "title", label: "Incident", render: (i) => <span className="font-medium text-ink">{i.title}</span> },
    { key: "severity", label: "Severity", render: (i) => <Status tone={i.severity === "High" ? "bad" : i.severity === "Medium" ? "warn" : "muted"}>{i.severity}</Status> },
    { key: "status", label: "Status", hideOnMobile: true, render: (i) => <Status tone={i.status === "Resolved" ? "good" : i.status === "Open" ? "bad" : "warn"}>{i.status}</Status> },
    { key: "started", label: "Started", hideOnMobile: true, render: (i) => <span className="text-mist">{i.started}</span> },
    { key: "owner", label: "Owner", hideOnMobile: true, render: (i) => i.owner ?? <span className="text-mist">No owner</span> },
  ];

  const ruleColumns: Column<Rule>[] = [
    {
      key: "name",
      label: "Rule",
      render: (r) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{r.name}</span>
          <span className="text-[0.72rem] text-mist">{backtest(r, mentions)}</span>
        </span>
      ),
    },
    { key: "kind", label: "Type", hideOnMobile: true, render: (r) => r.kind },
    { key: "notify", label: "Notifies", hideOnMobile: true, render: (r) => <span className="text-mist">{r.notify}</span> },
    { key: "on", label: "On", align: "right", render: (r) => <Toggle on={r.on} onChange={(on) => setRules((all) => all.map((x) => (x.id === r.id ? { ...x, on } : x)))} label={r.name} /> },
  ];

  return (
    <>
      <Head
        title="Alerts"
        subtitle="Know before it trends"
        action={
          <>
            <Segmented id="sa-alerts" value={tab} onChange={setTab} options={[{ id: "incidents", label: "Incidents" }, { id: "rules", label: "Rules" }]} />
            {tab === "rules" && (
              <PrimaryButton onClick={() => setAdding(true)}>
                <Plus size={14} /> New rule
              </PrimaryButton>
            )}
          </>
        }
      />
      {tab === "incidents" ? <Table columns={incidentColumns} rows={incidents} rowKey={(i) => i.id} onRowClick={(i) => app.open("incident", i.id, i.title)} /> : <Table columns={ruleColumns} rows={rules} rowKey={(r) => r.id} />}

      <ProtoModal
        open={adding}
        title="New rule"
        onClose={() => setAdding(false)}
        footer={
          <PrimaryButton disabled={!draft.name.trim()} onClick={addRule}>
            Create rule
          </PrimaryButton>
        }
      >
        <Field label="Name">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Negative share above 30%" />
        </Field>
        <Field label="Fires on">
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as RuleKind })} className={inputClass}>
            {(["Negative share", "Volume surge", "Keyword", "High-reach author"] as const).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        {draft.kind === "Keyword" ? (
          <Field label="Query">
            <input value={draft.keyword} onChange={(e) => setDraft({ ...draft, keyword: e.target.value })} className={inputClass} placeholder="scam OR estafa OR golpe" />
          </Field>
        ) : (
          <Field label={`Threshold (${RULE_UNIT[draft.kind]})`}>
            <input type="number" min="0" value={draft.threshold} onChange={(e) => setDraft({ ...draft, threshold: e.target.value })} className={inputClass} />
          </Field>
        )}
        <Field label="Notify">
          <select value={draft.notify} onChange={(e) => setDraft({ ...draft, notify: e.target.value })} className={inputClass}>
            {["Slack #comms", "SMS to on-call", "Email to Rafael", "Webhook"].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <div className="p-2.5 rounded-[4px] bg-paper border border-rule text-[0.78rem] text-ink-soft" role="status">
          {backtest(draftRule, mentions)}
        </div>
      </ProtoModal>
    </>
  );
}

function IncidentDetail({ s }: { s: S }) {
  const { app, incidents, mentions, patchIncident } = s;
  const i = incidents.find((x) => x.id === app.id);
  const [writing, setWriting] = useState(false);
  const [lang, setLang] = useState<LangId>("en");
  const [edits, setEdits] = useState<Partial<Record<LangId, string>>>({});
  const [note, setNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState("");
  if (!i) return <Gone onBack={app.back} />;

  const related = mentions.filter((m) => m.incident === i.id || (!mentions.some((x) => x.incident === i.id) && m.opinions.some((o) => o.topic === i.topic)));
  const peak = Math.max(...i.series);
  const langs = Object.keys(i.statement) as LangId[];
  const statement = edits[lang] ?? i.statement[lang] ?? "";
  const [startMonth, startDay] = i.seriesStart.split(" ");

  const addNote = () => {
    if (!note.trim()) return;
    patchIncident(i.id, {}, note.trim());
    setNote("");
  };

  return (
    <>
      <Head
        title={i.title}
        subtitle={`Started ${i.started} · Rule: ${i.rule}`}
        action={
          <>
            <Status tone={i.severity === "High" ? "bad" : "warn"}>{i.severity}</Status>
            <Status tone={i.status === "Resolved" ? "good" : i.status === "Open" ? "bad" : "warn"}>{i.status}</Status>
          </>
        }
      />
      <p className="mb-3 text-[0.86rem] leading-snug text-ink-soft max-w-[52rem]">{i.summary}</p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-3 items-start">
        <div className="flex flex-col gap-3 min-w-0">
          <Panel title="Negative share by day">
            <div className="h-28 flex items-end gap-1" role="img" aria-label={`Negative share by day, peaking at ${peak}%`}>
              {i.series.map((v, n) => (
                <div key={n} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                  <span className="font-mono text-[0.6rem] text-mist tabular-nums">{v}</span>
                  <motion.span className={cn("w-full rounded-t-[2px]", v >= 25 ? "bg-danger" : "bg-mist/30")} initial={{ height: 0 }} animate={{ height: `${(v / peak) * 78}%` }} transition={{ duration: 0.5, delay: n * 0.03 }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-rule flex justify-between text-[0.66rem] text-mist">
              <span>
                {startMonth} {startDay}
              </span>
              <span>% negative. Red is over the 25% rule.</span>
            </div>
          </Panel>

          {i.status !== "Resolved" && (
            <Panel title="Public statement" action={writing ? undefined : <SmallButton onClick={() => setWriting(true)}>Draft statement</SmallButton>}>
              {writing ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {langs.map((l) => (
                      <Chip key={l} on={l === lang} onClick={() => setLang(l)}>
                        {langOf(l).name}
                      </Chip>
                    ))}
                  </div>
                  <textarea
                    value={statement}
                    onChange={(e) => setEdits((x) => ({ ...x, [lang]: e.target.value }))}
                    dir={langOf(lang).rtl ? "rtl" : undefined}
                    lang={lang}
                    aria-label={`Statement in ${langOf(lang).name}`}
                    className={cn(textareaClass, "min-h-[7rem]")}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.72rem] text-mist">Posts in {langs.length} languages after approval.</span>
                    <PrimaryButton
                      onClick={() => {
                        patchIncident(i.id, { status: "Statement posted", owner: i.owner ?? USER }, `Statement approved and posted in ${langs.map((l) => langOf(l).name).join(", ")}.`);
                        setWriting(false);
                        app.notify(`Statement posted in ${langs.length} languages`);
                      }}
                    >
                      <Send size={13} /> Approve and post
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <p className="text-[0.8rem] text-mist">{i.status === "Statement posted" ? "Posted. Watch the negative share fall here." : `Drafted in ${langs.length} languages. You approve before it posts.`}</p>
              )}
            </Panel>
          )}

          <Panel title="Mentions" className="[&>div:last-child]:p-0">
            <MentionList mentions={related.slice(0, 6)} onOpen={(m) => openMention(app, m)} />
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Owner">
            <select
              aria-label="Owner"
              value={i.owner ?? ""}
              onChange={(e) => patchIncident(i.id, { owner: e.target.value || undefined }, e.target.value ? `${e.target.value} took ownership.` : undefined)}
              className={inputClass}
            >
              <option value="">No owner</option>
              {TEAM.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {i.status !== "Resolved" && (
              <div className="mt-2.5">
                <SmallButton onClick={() => setResolving(true)}>Resolve incident</SmallButton>
              </div>
            )}
          </Panel>
          <Panel title="By language">
            <div className="flex flex-col gap-2.5">
              {i.languages.map(([l, share]) => (
                <BarRow key={l} label={langOf(l).name} value={share} max={i.languages[0][1]} right={`${share}%`} />
              ))}
            </div>
          </Panel>
          <Panel title="By source">
            <div className="flex flex-col gap-2.5">
              {i.sources.map(([x, share]) => (
                <BarRow key={x} label={sourceOf(x).name} value={share} max={i.sources[0][1]} right={`${share}%`} />
              ))}
            </div>
          </Panel>
          <Panel title="Timeline">
            <ol className="flex flex-col gap-3">
              {i.timeline.map((e) => (
                <li key={e.id} className="text-[0.76rem] leading-snug">
                  <div className="text-mist">
                    {e.at} · {e.by}
                  </div>
                  <div className="text-ink-soft mt-0.5">{e.text}</div>
                </li>
              ))}
            </ol>
            <form
              className="mt-3 flex flex-col gap-2 items-start"
              onSubmit={(e) => {
                e.preventDefault();
                addNote();
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} aria-label="Add an update" className={inputClass} placeholder="Add an update" />
              <SmallButton disabled={!note.trim()} onClick={addNote}>
                Add update
              </SmallButton>
            </form>
          </Panel>
        </div>
      </div>

      <ProtoModal
        open={resolving}
        title="Resolve incident"
        onClose={() => setResolving(false)}
        footer={
          <PrimaryButton
            onClick={() => {
              patchIncident(i.id, { status: "Resolved", resolved: clock() }, resolution.trim() || "Resolved.");
              setResolving(false);
              app.notify("Incident resolved");
            }}
          >
            Resolve
          </PrimaryButton>
        }
      >
        <Field label="What fixed it?">
          <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} className={textareaClass} placeholder="Receipts sent. Negative share back under 15%." />
        </Field>
      </ProtoModal>
    </>
  );
}

// ---- Competitors -------------------------------------------------------------------

function heat(n: number) {
  if (n >= 40) return "bg-good/15 text-good";
  if (n >= 15) return "bg-good/5 text-ink-soft";
  if (n <= -15) return "bg-danger-wash text-danger";
  return "bg-raised text-ink-soft";
}

function Competitors({ s }: { s: S }) {
  const { app, rivals, setRivals } = s;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [terms, setTerms] = useState("");
  const counted = rivals.filter((r) => !r.collecting);
  const all = counted.reduce((n, r) => n + r.mentions, 0);
  const you = rivals.find((r) => r.you)!;
  const rank = [...counted].sort((a, b) => b.net - a.net).findIndex((r) => r.you) + 1;
  const gap = RIVAL_TOPICS.map((t) => ({ t, by: Math.max(...counted.filter((r) => !r.you).map((r) => r.topics[t] ?? 0)) - (you.topics[t] ?? 0) })).sort((a, b) => b.by - a.by)[0];

  const add = () => {
    setRivals((list) => [...list, { id: nextId("c"), name: name.trim(), mentions: 0, net: 0, reach: 0, topics: {}, collecting: true }]);
    setAdding(false);
    setName("");
    setTerms("");
    app.notify("Collecting 90 days of history");
  };

  const columns: Column<Rival>[] = [
    { key: "name", label: "Organization", render: (r) => <span className={cn("text-ink", r.you && "font-semibold")}>{r.name}</span> },
    { key: "mentions", label: "Mentions", align: "right", render: (r) => (r.collecting ? <span className="text-mist">Collecting…</span> : <span className="tabular-nums">{num(r.mentions)}</span>) },
    { key: "sov", label: "Share of voice", hideOnMobile: true, render: (r) => (r.collecting ? null : <Meter value={r.mentions} max={Math.max(...counted.map((x) => x.mentions))} className="w-28" />) },
    { key: "net", label: "Net", align: "right", render: (r) => (r.collecting ? null : <Net value={r.net} />) },
    { key: "reach", label: "Reach", align: "right", hideOnMobile: true, render: (r) => (r.collecting ? null : <span className="tabular-nums">{short(r.reach)}</span>) },
  ];

  return (
    <>
      <Head
        title="Competitors"
        subtitle="Same sources, same model, same 30 days"
        action={
          <PrimaryButton onClick={() => setAdding(true)}>
            <Plus size={14} /> Add competitor
          </PrimaryButton>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat label="Your share of voice" value={`${Math.round((you.mentions / all) * 100)}%`} />
        <Stat label="Your net sentiment" value={signed(you.net)} />
        <Stat label="Net rank" value={`${rank} of ${counted.length}`} />
        <Stat label="Biggest gap" value={gap.t} sub={`${gap.by} behind the best`} tone="bad" />
      </div>
      <Table columns={columns} rows={rivals} rowKey={(r) => r.id} />
      <div className="mt-3">
        <Panel title="Net sentiment by topic">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Net sentiment by topic">
            <table className="w-full min-w-[34rem] text-[0.78rem]">
              <thead>
                <tr>
                  <th className="pb-2 pr-3 text-left text-[0.7rem] font-medium text-mist" />
                  {counted.map((r) => (
                    <th key={r.id} className={cn("pb-2 px-1 text-center text-[0.7rem] font-medium", r.you ? "text-ink" : "text-mist")}>
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RIVAL_TOPICS.map((t) => (
                  <tr key={t}>
                    <th className="py-0.5 pr-3 text-left font-normal text-ink-soft whitespace-nowrap">{t}</th>
                    {counted.map((r) => (
                      <td key={r.id} className="py-0.5 px-1">
                        <span className={cn("block py-1.5 rounded-[4px] text-center tabular-nums font-medium", heat(r.topics[t] ?? 0))}>{signed(r.topics[t] ?? 0)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <ProtoModal
        open={adding}
        title="Add competitor"
        onClose={() => setAdding(false)}
        footer={
          <PrimaryButton disabled={!name.trim()} onClick={add}>
            Start collecting
          </PrimaryButton>
        }
      >
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Organization name" />
        </Field>
        <Field label="Other names and handles">
          <input value={terms} onChange={(e) => setTerms(e.target.value)} className={inputClass} placeholder="@handle, short name, local spelling" />
        </Field>
      </ProtoModal>
    </>
  );
}

// ---- People ------------------------------------------------------------------------

interface Person {
  id: string;
  name: string;
  handle?: string;
  country: string;
  source: SourceId;
  lang: LangId;
  reach: number;
  mentions: Mention[];
  net: number;
}

function peopleOf(mentions: Mention[]) {
  const map = new Map<string, Person>();
  for (const m of mentions) {
    const hit = map.get(m.author);
    if (hit) hit.mentions.push(m);
    else map.set(m.author, { id: m.id, name: m.author, handle: m.handle, country: m.country, source: m.source, lang: m.lang, reach: m.reach, mentions: [m], net: 0 });
  }
  const list = [...map.values()].filter((p) => p.reach > 0);
  for (const p of list) p.net = Math.round((p.mentions.reduce((n, m) => n + scoreOf(m), 0) / p.mentions.length) * 100);
  return list.sort((a, b) => b.reach - a.reach);
}

function People({ s }: { s: S }) {
  const { app, mentions, watched, setWatched } = s;
  const [view, setView] = useState<"all" | "promoters" | "detractors" | "watched">("all");
  const people = useMemo(() => peopleOf(mentions), [mentions]);
  const rows = people.filter((p) => (view === "promoters" ? p.net > 15 : view === "detractors" ? p.net < -15 : view === "watched" ? watched.includes(p.id) : true));
  const columns: Column<Person>[] = [
    {
      key: "name",
      label: "Person",
      render: (p) => (
        <span className="flex items-center gap-2.5 min-w-0">
          <SourceTile id={p.source} />
          <span className="flex flex-col min-w-0">
            <span className="font-medium text-ink truncate">{p.name}</span>
            <span className="text-[0.72rem] text-mist truncate">{p.handle ?? p.country}</span>
          </span>
        </span>
      ),
    },
    { key: "reach", label: "Reach", align: "right", render: (p) => <span className="tabular-nums">{short(p.reach)}</span> },
    { key: "lang", label: "Language", hideOnMobile: true, render: (p) => langOf(p.lang).name },
    { key: "net", label: "Net", align: "right", render: (p) => <Net value={p.net} /> },
    { key: "watch", label: "Watch", align: "right", render: (p) => <Toggle on={watched.includes(p.id)} onChange={(on) => setWatched((w) => (on ? [...w, p.id] : w.filter((x) => x !== p.id)))} label={`Watch ${p.name}`} /> },
  ];
  return (
    <>
      <Head
        title="People"
        subtitle="Who moves the conversation"
        action={<Segmented id="sa-people" value={view} onChange={setView} options={[{ id: "all", label: "All" }, { id: "promoters", label: "Promoters" }, { id: "detractors", label: "Detractors" }, { id: "watched", label: "Watched" }]} />}
      />
      <Table columns={columns} rows={rows} rowKey={(p) => p.id} onRowClick={(p) => app.open("person", p.id, p.name)} empty="Nobody here yet." />
    </>
  );
}

function PersonDetail({ s }: { s: S }) {
  const { app, mentions, watched, setWatched } = s;
  const p = useMemo(() => peopleOf(mentions), [mentions]).find((x) => x.id === app.id);
  if (!p) return <Gone onBack={app.back} />;
  const on = watched.includes(p.id);
  return (
    <>
      <Head
        title={p.name}
        subtitle={`${p.handle ? `${p.handle} · ` : ""}${sourceOf(p.source).name} · ${p.country}`}
        action={
          <SmallButton
            onClick={() => {
              setWatched((w) => (on ? w.filter((x) => x !== p.id) : [...w, p.id]));
              app.notify(on ? `Stopped watching ${p.name}` : `Watching ${p.name}`);
            }}
          >
            {on ? "Stop watching" : "Watch"}
          </SmallButton>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat label="Reach" value={short(p.reach)} />
        <Stat label="Mentions" value={String(p.mentions.length)} />
        <Stat label="Net" value={signed(p.net)} tone={p.net < 0 ? "bad" : "good"} />
        <Stat label="Language" value={langOf(p.lang).name} />
      </div>
      <Panel title="Their mentions" className="[&>div:last-child]:p-0">
        <MentionList mentions={p.mentions} onOpen={(m) => openMention(app, m)} />
      </Panel>
    </>
  );
}

// ---- Reports -----------------------------------------------------------------------

const BLANK_REPORT = { name: "", frequency: "Weekly" as Report["frequency"], language: "en" as LangId, recipients: "", sections: ["Summary", "Sentiment trend", "Top topics"] };

function Reports({ s }: { s: S }) {
  const { app, reports, setReports, sent } = s;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(BLANK_REPORT);
  const add = () => {
    const id = nextId("rp");
    setReports((all) => [{ id, name: draft.name.trim(), frequency: draft.frequency, language: draft.language, recipients: draft.recipients.trim() || "You", sections: draft.sections, next: draft.frequency === "Daily" ? "Tomorrow, 7:00 AM" : draft.frequency === "Weekly" ? "Mon, Nov 9" : "Dec 1" }, ...all]);
    setAdding(false);
    setDraft(BLANK_REPORT);
    app.open("report", id, draft.name.trim());
  };
  const columns: Column<Report>[] = [
    { key: "name", label: "Report", render: (r) => <span className="font-medium text-ink">{r.name}</span> },
    { key: "frequency", label: "Sends", render: (r) => r.frequency },
    { key: "language", label: "Language", hideOnMobile: true, render: (r) => langOf(r.language).name },
    { key: "recipients", label: "To", hideOnMobile: true, render: (r) => <span className="text-mist">{r.recipients}</span> },
    { key: "next", label: "Next", hideOnMobile: true, render: (r) => <span className="text-mist">{r.next}</span> },
  ];
  return (
    <>
      <Head
        title="Reports"
        subtitle="Scheduled, in the reader's language"
        action={
          <PrimaryButton onClick={() => setAdding(true)}>
            <Plus size={14} /> New report
          </PrimaryButton>
        }
      />
      <Table columns={columns} rows={reports} rowKey={(r) => r.id} onRowClick={(r) => app.open("report", r.id, r.name)} />
      <div className="mt-3">
        <Panel title="Recently sent">
          <ul className="divide-y divide-rule-soft -my-1.5">
            {sent.slice(0, 5).map((h) => (
              <li key={h.id} className="py-2 flex flex-wrap items-baseline justify-between gap-x-3 text-[0.78rem]">
                <span className="text-ink-soft">{h.name}</span>
                <span className="text-mist">
                  {h.date} · {h.to}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <ProtoModal
        open={adding}
        title="New report"
        onClose={() => setAdding(false)}
        footer={
          <PrimaryButton disabled={!draft.name.trim() || !draft.sections.length} onClick={add}>
            Create report
          </PrimaryButton>
        }
      >
        <Field label="Name">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Weekly brief for the board" />
        </Field>
        <Field label="Sends">
          <select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value as Report["frequency"] })} className={inputClass}>
            {(["Daily", "Weekly", "Monthly"] as const).map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Written in">
          <select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value as LangId })} className={inputClass}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <input value={draft.recipients} onChange={(e) => setDraft({ ...draft, recipients: e.target.value })} className={inputClass} placeholder="board@kapwarelief.example" />
        </Field>
        <fieldset>
          <legend className="text-[0.76rem] font-medium text-ink-soft mb-1.5">Sections</legend>
          <div className="flex flex-wrap gap-1.5">
            {REPORT_SECTIONS.map((x) => (
              <Chip key={x} on={draft.sections.includes(x)} onClick={() => setDraft({ ...draft, sections: draft.sections.includes(x) ? draft.sections.filter((y) => y !== x) : [...draft.sections, x] })}>
                {x}
              </Chip>
            ))}
          </div>
        </fieldset>
      </ProtoModal>
    </>
  );
}

function ReportDetail({ s }: { s: S }) {
  const { app, reports, setSent, topics, incidents, rivals } = s;
  const r = reports.find((x) => x.id === app.id);
  if (!r) return <Gone onBack={app.back} />;
  const week = totals(DAILY.slice(-7));
  const prior = totals(DAILY.slice(-14, -7));
  const open = incidents.filter((i) => i.status !== "Resolved");
  const has = (x: string) => r.sections.includes(x);
  const worst = [...topics].sort((a, b) => a.pos - a.neg - (b.pos - b.neg))[0];
  const best = [...topics].sort((a, b) => b.pos - b.neg - (a.pos - a.neg))[0];

  return (
    <>
      <Head
        title={r.name}
        subtitle={`${r.frequency} · ${langOf(r.language).name} · ${r.recipients}`}
        action={
          <PrimaryButton
            onClick={() => {
              setSent((all) => [{ id: nextId("h"), name: r.name, date: clock(), to: r.recipients }, ...all]);
              app.notify(`Sent to ${r.recipients}`);
            }}
          >
            <Send size={13} /> Send now
          </PrimaryButton>
        }
      />
      <div className="max-w-[46rem] flex flex-col gap-3">
        {has("Summary") && (
          <Panel title="Summary">
            <p className="text-[0.86rem] leading-relaxed text-ink">
              Net sentiment is {signed(week.net)} this week, {week.net < prior.net ? "down" : "up"} from {signed(prior.net)}. {worst.name} is the main drag at {signed(worst.pos - worst.neg)}, and {best.name} is the strongest at {signed(best.pos - best.neg)}.{" "}
              {open.length ? `${open.length} ${open.length === 1 ? "incident is" : "incidents are"} open.` : "No incidents are open."}
            </p>
          </Panel>
        )}
        {has("Sentiment trend") && (
          <Panel title="Sentiment trend">
            <TrendChart data={DAILY.slice(-14).map((d) => ({ key: d.date, label: fmtDay(d.date), pos: d.pos, neu: d.neu, neg: d.neg }))} />
          </Panel>
        )}
        {has("Top topics") && (
          <Panel title="Top topics">
            <ul className="flex flex-col gap-3">
              {[...topics].sort((a, b) => b.mentions - a.mentions).slice(0, 5).map((t) => (
                <li key={t.id}>
                  <div className="flex justify-between text-[0.78rem]">
                    <span className="text-ink-soft">{t.name}</span>
                    <Net value={t.pos - t.neg} />
                  </div>
                  <SentimentBar pos={t.pos} neu={t.neu} neg={t.neg} className="mt-1.5" />
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {has("Languages") && (
          <Panel title="Languages">
            <div className="flex flex-col gap-2.5">
              {LANGUAGE_STATS.slice(0, 5).map((l) => (
                <BarRow key={l.id} label={langOf(l.id).name} value={l.share} max={LANGUAGE_STATS[0].share} right={<Net value={l.net} />} />
              ))}
            </div>
          </Panel>
        )}
        {has("Competitors") && (
          <Panel title="Competitors">
            <ul className="flex flex-col gap-1.5 text-[0.8rem]">
              {rivals.filter((x) => !x.collecting).map((x) => (
                <li key={x.id} className="flex justify-between">
                  <span className={cn("text-ink-soft", x.you && "font-medium text-ink")}>{x.name}</span>
                  <Net value={x.net} />
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {has("Incidents") && (
          <Panel title="Incidents">
            <ul className="flex flex-col gap-2 text-[0.8rem]">
              {incidents.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span className="text-ink-soft">{i.title}</span>
                  <Status tone={i.status === "Resolved" ? "good" : i.status === "Open" ? "bad" : "warn"}>{i.status}</Status>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}

// ---- Queries -----------------------------------------------------------------------

function Queries({ s }: { s: S }) {
  const { app, queries, setQueries, mentions } = s;
  const countFor = (q: Query) => {
    const { node } = parseQuery(q.text);
    return node ? mentions.filter((m) => matchQuery(node, docOf(m))).length : 0;
  };
  const add = () => {
    const id = nextId("q");
    const name = "New query";
    setQueries((all) => [{ id, name, text: "kapwa AND ", updated: "Today" }, ...all]);
    app.open("query", id, name);
  };
  const columns: Column<Query>[] = [
    { key: "name", label: "Query", render: (q) => <span className="font-medium text-ink">{q.name}</span> },
    { key: "text", label: "Rule", hideOnMobile: true, render: (q) => <span className="block max-w-[28rem] truncate font-mono text-[0.72rem] text-mist">{q.text}</span> },
    { key: "n", label: "Matches", align: "right", render: (q) => <span className="tabular-nums">{countFor(q)}</span> },
    { key: "updated", label: "Updated", hideOnMobile: true, render: (q) => <span className="text-mist">{q.updated}</span> },
  ];
  return (
    <>
      <Head
        title="Queries"
        subtitle="Exactly what to listen for, in every language"
        action={
          <PrimaryButton onClick={add}>
            <Plus size={14} /> New query
          </PrimaryButton>
        }
      />
      <Table columns={columns} rows={queries} rowKey={(q) => q.id} onRowClick={(q) => app.open("query", q.id, q.name)} />
    </>
  );
}

function QueryDetail({ s }: { s: S }) {
  const { app, queries, setQueries, mentions } = s;
  const q = queries.find((x) => x.id === app.id);
  const [text, setText] = useState(q?.text ?? "");
  const [name, setName] = useState(q?.name ?? "");
  if (!q) return <Gone onBack={app.back} />;
  const { node, error } = parseQuery(text.trim());
  const matches = node ? mentions.filter((m) => matchQuery(node, docOf(m))) : [];
  const dirty = text !== q.text || name !== q.name;
  return (
    <>
      <Head
        title={q.name}
        subtitle={`${matches.length} of ${mentions.length} sample mentions match`}
        action={
          <PrimaryButton
            disabled={!dirty || !node || !name.trim()}
            onClick={() => {
              setQueries((all) => all.map((x) => (x.id === q.id ? { ...x, text, name: name.trim(), updated: "Today" } : x)));
              app.notify("Query saved");
            }}
          >
            Save query
          </PrimaryButton>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-3 items-start">
        <div className="flex flex-col gap-3 min-w-0">
          <Panel title="Rule">
            <div className="flex flex-col gap-3">
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Query">
                <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className={cn(textareaClass, "font-mono text-[0.78rem]")} />
              </Field>
              {error ? (
                <p className="text-[0.76rem] text-danger" role="alert">
                  {error}
                </p>
              ) : (
                <p className="text-[0.76rem] text-good" role="status">
                  Valid. {matches.length} {matches.length === 1 ? "match" : "matches"}.
                </p>
              )}
            </div>
          </Panel>
          <Panel title="Matches" className="[&>div:last-child]:p-0">
            <MentionList mentions={matches.slice(0, 8)} onOpen={(m) => openMention(app, m)} empty="Nothing matches yet." />
          </Panel>
        </div>
        <Panel title="Syntax">
          <ul className="flex flex-col gap-2 text-[0.76rem] text-ink-soft">
            {[
              ["AND, OR, NOT", "Combine terms"],
              ["( )", "Group them"],
              ['"exact phrase"', "Match the words in order"],
              ["lang:es", "One language"],
              ["source:reddit", "One source"],
              ["sentiment:negative", "One label"],
            ].map(([code, what]) => (
              <li key={code}>
                <code className="font-mono text-[0.72rem] text-ink">{code}</code>
                <div className="text-mist">{what}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

// ---- Model -------------------------------------------------------------------------

const TRAIN_STEPS = ["Collecting corrections", "Training", "Testing on native-speaker sets", "Publishing"];

function Model({ s }: { s: S }) {
  const { app, queue, correct, patchMention, model, setModel, terms, setTerms } = s;
  const [tab, setTab] = useState<"review" | "terms" | "history">("review");
  const [step, run] = useSteps();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ term: "", lang: "en" as LangId, meaning: "", polarity: "Positive" as CustomTerm["polarity"] });

  const retrain = () => {
    run(TRAIN_STEPS.length, 650, () => {
      const version = "2026.11";
      setModel((x) => ({
        version,
        accuracy: Math.round((x.accuracy + 0.4) * 10) / 10,
        corrections: 0,
        log: [{ id: nextId("v"), version, date: "Nov 2", note: `Retrained with ${x.corrections} corrections from your team.` }, ...x.log.filter((l) => l.version !== version)],
      }));
      app.notify("New model live. Accuracy up 0.4 points.");
    });
  };

  const addTerm = () => {
    setTerms((all) => [{ id: nextId("t"), term: draft.term.trim(), lang: draft.lang, meaning: draft.meaning.trim(), polarity: draft.polarity }, ...all]);
    setAdding(false);
    setDraft({ term: "", lang: "en", meaning: "", polarity: "Positive" });
    app.notify("Term added. The analyzer uses it now.");
  };

  const termColumns: Column<CustomTerm>[] = [
    { key: "term", label: "Term", render: (t) => <Foreign lang={t.lang} className="font-medium text-ink">{t.term}</Foreign> },
    { key: "lang", label: "Language", render: (t) => langOf(t.lang).name },
    { key: "meaning", label: "Meaning", hideOnMobile: true, render: (t) => <span className="text-mist">{t.meaning}</span> },
    { key: "polarity", label: "Reads as", render: (t) => <Status tone={t.polarity === "Positive" ? "good" : "bad"}>{t.polarity}</Status> },
    {
      key: "remove",
      label: "",
      align: "right",
      render: (t) => (
        <SmallButton label={`Remove ${t.term}`} onClick={() => setTerms((all) => all.filter((x) => x.id !== t.id))}>
          Remove
        </SmallButton>
      ),
    },
  ];

  return (
    <>
      <Head
        title="Model"
        subtitle="People teach it what it gets wrong"
        action={
          <>
            <Segmented id="sa-model" value={tab} onChange={setTab} options={[{ id: "review", label: "Review queue" }, { id: "terms", label: "Custom terms" }, { id: "history", label: "History" }]} />
            {tab === "terms" && (
              <PrimaryButton onClick={() => setAdding(true)}>
                <Plus size={14} /> Add term
              </PrimaryButton>
            )}
          </>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat label="Accuracy" value={`${model.accuracy.toFixed(1)}%`} sub="Weighted by mentions" tone="good" />
        <Stat label="Model" value={model.version} />
        <Stat label="To review" value={String(queue.length)} sub="Under 80% confidence" />
        <Stat label="New corrections" value={String(model.corrections)} sub="For the next training run" />
      </div>

      {tab === "review" && (
        <div className="flex flex-col gap-3">
          <Panel title="The model wasn't sure" className="[&>div:last-child]:py-1">
            {queue.length ? (
              <ul className="divide-y divide-rule-soft">
                {queue.map((m) => {
                  const label = labelOf(m);
                  return (
                    <li key={m.id} className="py-3 flex flex-col gap-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-[0.74rem] text-mist">
                        <span className="font-semibold text-ink">{m.author}</span>
                        <span>{langOf(m.lang).name}{m.codeSwitch ? ` (${m.codeSwitch})` : ""}</span>
                        <span>· {Math.round(m.confidence * 100)}% confident</span>
                        <span>· Guess: {label}</span>
                        {m.sarcasm && <Status tone="warn">Possible sarcasm</Status>}
                      </div>
                      <Foreign lang={m.lang} className="block text-[0.84rem] leading-snug text-ink">
                        {textOf(m)}
                      </Foreign>
                      {m.lang !== "en" && <p className="text-[0.76rem] leading-snug text-mist">{englishOf(m)}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {(["Positive", "Neutral", "Negative"] as const).map((x) => (
                          <SmallButton
                            key={x}
                            onClick={() => {
                              if (x === label) patchMention(m.id, { reviewed: true });
                              else correct(m.id, x);
                              app.notify(x === label ? "Confirmed" : `Corrected to ${x}`);
                            }}
                          >
                            {x === label ? `Confirm ${x}` : x}
                          </SmallButton>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-[0.8rem] text-mist">Queue is clear. New low-confidence mentions land here.</p>
            )}
          </Panel>
          <Panel title="Retrain">
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 text-[0.8rem] text-ink-soft">{step !== null ? `${TRAIN_STEPS[step]}…` : model.corrections ? `${model.corrections} corrections ready. It only publishes if accuracy holds in every language.` : "No new corrections yet."}</p>
              <PrimaryButton disabled={step !== null || model.corrections === 0} onClick={retrain}>
                <RefreshCw size={13} className={step !== null ? "animate-spin" : ""} /> {step !== null ? "Training" : "Retrain model"}
              </PrimaryButton>
            </div>
            {step !== null && <Meter value={step + 1} max={TRAIN_STEPS.length} className="mt-3" />}
          </Panel>
        </div>
      )}

      {tab === "terms" && (
        <>
          <p className="mb-3 text-[0.8rem] text-mist">Slang and local words the model should know. They apply right away in Content.</p>
          <Table columns={termColumns} rows={terms} rowKey={(t) => t.id} />
        </>
      )}

      {tab === "history" && (
        <Panel title="Releases">
          <ol className="flex flex-col gap-3">
            {model.log.map((l) => (
              <li key={l.id} className="text-[0.8rem]">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-medium text-ink">{l.version}</span>
                  <span className="text-[0.72rem] text-mist">{l.date}</span>
                </div>
                <p className="text-ink-soft mt-0.5">{l.note}</p>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <ProtoModal
        open={adding}
        title="Add term"
        onClose={() => setAdding(false)}
        footer={
          <PrimaryButton disabled={!draft.term.trim()} onClick={addTerm}>
            Add term
          </PrimaryButton>
        }
      >
        <Field label="Word or phrase">
          <input value={draft.term} onChange={(e) => setDraft({ ...draft, term: e.target.value })} className={inputClass} placeholder="sulit" />
        </Field>
        <Field label="Language">
          <select value={draft.lang} onChange={(e) => setDraft({ ...draft, lang: e.target.value as LangId })} className={inputClass}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Meaning">
          <input value={draft.meaning} onChange={(e) => setDraft({ ...draft, meaning: e.target.value })} className={inputClass} placeholder="Worth it" />
        </Field>
        <Field label="Reads as">
          <select value={draft.polarity} onChange={(e) => setDraft({ ...draft, polarity: e.target.value as CustomTerm["polarity"] })} className={inputClass}>
            <option>Positive</option>
            <option>Negative</option>
          </select>
        </Field>
      </ProtoModal>
    </>
  );
}
