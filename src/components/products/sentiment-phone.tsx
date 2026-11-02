"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, ChevronRight, MessageSquare, User } from "lucide-react";
import { Body, Button, Done, Header, Label, TabBar } from "./phone-kit";
import { cn } from "@/lib/utils";

// Alerts app for Kapwa Relief's comms team: the score, what changed, and a reply to approve.

type View = "home" | "incident" | "mention" | "done";

const TREND = [53, 46, 51, 51, 0, -8, -10, 6, 8, 13];

const MENTIONS = [
  { id: "a", who: "Jenny Ramos", where: "X · Philippines", lang: "Filipino", text: "Hanggang ngayon wala pa rin akong receipt from Kapwa Relief.", en: "Until now I still have no receipt from Kapwa Relief.", reply: "Pasensya na po. Imemensahe po kayo ng aming team ngayong araw.", replyEn: "We're sorry about this. Our team will message you today." },
  { id: "b", who: "Layla Jaber", where: "X · Jordan", lang: "Arabic", text: "تبرعت قبل شهر ولم يصل الإيصال حتى الآن.", en: "I donated a month ago and the receipt still hasn't arrived.", reply: "نعتذر عن ذلك. سيتواصل معك فريقنا اليوم.", replyEn: "We're sorry about this. Our team will message you today.", rtl: true },
];

export function SentimentPhone() {
  const [view, setView] = useState<View>("home");
  const [pick, setPick] = useState(0);
  const [replied, setReplied] = useState<string[]>([]);
  const m = MENTIONS[pick];
  const left = MENTIONS.filter((x) => !replied.includes(x.id));

  return (
    <>
      {view === "home" && (
        <>
          <Header title="Kapwa Relief" sub="Last 10 days, all languages" />
          <Body>
            <div className="rounded-2xl bg-gold text-sheet p-4">
              <div className="text-[0.62rem] opacity-80">Net sentiment today</div>
              <div className="text-[1.9rem] font-bold tabular-nums leading-tight">+13</div>
              <div className="mt-2 h-10 flex items-end gap-1" aria-hidden>
                {TREND.map((v, i) => (
                  <motion.span key={i} className={cn("flex-1 rounded-t-[2px]", v < 0 ? "bg-sheet/40" : "bg-sheet/80")} initial={{ height: 0 }} animate={{ height: `${10 + (Math.abs(v) / 53) * 90}%` }} transition={{ duration: 0.4, delay: i * 0.03 }} />
                ))}
              </div>
            </div>

            <Label>Needs you</Label>
            <button type="button" onClick={() => setView("incident")} className="w-full rounded-xl border border-danger/30 bg-danger-wash p-3 flex gap-2.5 text-left cursor-pointer">
              <AlertTriangle size={16} className="text-danger shrink-0 mt-px" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.76rem] font-semibold text-ink">Donation receipts delayed</span>
                <span className="block text-[0.66rem] text-ink-soft leading-snug mt-0.5">Negative share 34%, down from 47%. {left.length} replies to approve.</span>
              </span>
              <ChevronRight size={14} className="text-mist shrink-0 self-center" />
            </button>

            <Label>Top languages</Label>
            <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
              {[["English", "+24"], ["Filipino", "+31"], ["Spanish", "+38"], ["Arabic", "+29"]].map(([l, n]) => (
                <div key={l} className="flex items-center justify-between px-3 h-9 text-[0.74rem]">
                  <span className="text-ink">{l}</span>
                  <span className="font-medium text-good tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          </Body>
        </>
      )}

      {view === "incident" && (
        <>
          <Header title="Receipts delayed" sub="High · Started Oct 28" onBack={() => setView("home")} />
          <Body>
            <p className="text-[0.72rem] leading-relaxed text-ink-soft">Donors in 19 languages say receipts haven&rsquo;t arrived. It began the day after the Oct 27 payment update.</p>
            <Label>Replies to approve</Label>
            {left.length ? (
              <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
                {MENTIONS.map((x, i) =>
                  replied.includes(x.id) ? null : (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => {
                        setPick(i);
                        setView("mention");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.72rem] font-semibold text-ink">{x.who}</span>
                        <span className="block text-[0.62rem] text-mist">{`${x.where} · ${x.lang}`}</span>
                      </span>
                      <ChevronRight size={14} className="text-mist shrink-0" />
                    </button>
                  ),
                )}
              </div>
            ) : (
              <p className="text-[0.72rem] text-mist">All caught up.</p>
            )}
          </Body>
        </>
      )}

      {view === "mention" && (
        <>
          <Header title={m.who} sub={m.where} onBack={() => setView("incident")} />
          <Body>
            <div className="rounded-xl border border-rule bg-sheet p-3">
              <div dir={m.rtl ? "rtl" : undefined} className="text-[0.76rem] text-ink leading-snug">
                {m.text}
              </div>
              <div className="mt-1 text-[0.64rem] text-mist leading-snug">{m.en}</div>
            </div>
            <Label>{`Reply in ${m.lang}`}</Label>
            <div className="rounded-xl bg-gold-wash p-3">
              <div dir={m.rtl ? "rtl" : undefined} className="text-[0.76rem] text-ink leading-snug">
                {m.reply}
              </div>
              <div className="mt-1 text-[0.64rem] text-graphite leading-snug">{m.replyEn}</div>
            </div>
            <Button
              onClick={() => {
                setReplied((r) => [...r, m.id]);
                setView("done");
              }}
            >
              Approve and send
            </Button>
          </Body>
        </>
      )}

      {view === "done" && (
        <Body>
          <Done title="Reply sent" lines={[`To ${m.who}, in ${m.lang}`, left.length ? `${left.length} left to approve` : "That was the last one"]} action="Back to the incident" onDone={() => setView("incident")} />
        </Body>
      )}

      <TabBar items={[[Bell, "Alerts"], [MessageSquare, "Mentions"], [User, "Me"]]} active={0} />
    </>
  );
}
