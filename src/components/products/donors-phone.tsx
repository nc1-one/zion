"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, HandHeart, Heart, Newspaper, User } from "lucide-react";
import { Body, Button, Chips, Choice, Done, Header, Label, TabBar } from "./phone-kit";

// Donor app for Bukas Palad Foundation: "My impact", program updates, and give again.

const peso = (n: number) => `₱${n.toLocaleString()}`;

type Program = "Feeding" | "Scholars" | "Relief";
type View = "home" | "update" | "give" | "done";

const COST = { meal: 38, stipendDay: 80, family: 1100 };
const PHRASE: Record<Program, string> = { Feeding: "the feeding program", Scholars: "scholarships", Relief: "disaster relief" };
const START: Record<Program, number> = { Feeding: 10000, Scholars: 9000, Relief: 2500 };

const UPDATES: { id: string; program: Program; tag: string; date: string; title: string; text: string; photo: string }[] = [
  { id: "u1", program: "Feeding", tag: "Feeding program", date: "Oct 24", title: "Payatas kitchen gets a second stove", text: "Cooks now serve 600 lunches before noon, up from 420. Children eat before their afternoon classes.", photo: "Photo · Payatas kitchen" },
  { id: "u2", program: "Scholars", tag: "Scholarships", date: "Oct 21", title: "First-quarter grades are in", text: "94% of scholars passed every subject. Jerome, the scholar you help sponsor, finished with an 89 average.", photo: "Photo · Scholars' camp" },
  { id: "u3", program: "Relief", tag: "Disaster relief", date: "Oct 9", title: "1,420 families reached in Camarines Sur", text: "Relief packs reached Bula and Nabua within 36 hours of landfall, while roads were still flooded.", photo: "Photo · Relief run, Bicol" },
];

// What a gift does, in words a donor can picture.
function impactOf(program: Program, amount: number) {
  if (program === "Feeding") return `${Math.floor(amount / COST.meal)} hot meals`;
  if (program === "Scholars") return `${Math.round(amount / COST.stipendDay)} school days of a scholar's stipend`;
  const packs = Math.floor(amount / COST.family);
  return packs >= 1 ? `${packs} family relief ${packs === 1 ? "pack" : "packs"}` : `${Math.round((amount / COST.family) * 100)}% of a family relief pack`;
}

export function DonorsPhone() {
  const [view, setView] = useState<View>("home");
  const [updateId, setUpdateId] = useState("u1");
  const [given, setGiven] = useState(START);
  const [amount, setAmount] = useState(1000);
  const [often, setOften] = useState("Monthly");
  const [program, setProgram] = useState<Program>("Feeding");
  const [method, setMethod] = useState("GCash");

  const total = given.Feeding + given.Scholars + given.Relief;
  const update = UPDATES.find((u) => u.id === updateId) ?? UPDATES[0];
  const tab = view === "home" ? 0 : view === "update" ? 1 : 2;

  const give = () => {
    setGiven((g) => ({ ...g, [program]: g[program] + amount }));
    setView("done");
  };

  return (
    <>
      {view === "home" && (
        <>
          <Header title="My impact" sub="Joy Dela Cruz · Bukas Palad Foundation" />
          <Body>
            <div className="rounded-2xl bg-gold text-sheet p-4">
              <div className="text-[0.62rem] opacity-80">You gave in 2026</div>
              <motion.div key={total} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[1.7rem] font-bold tabular-nums leading-tight">
                {peso(total)}
              </motion.div>
              <div className="text-[0.62rem] opacity-80">10 monthly gifts · 2 one-time gifts</div>
              <div className="mt-3 pt-3 border-t border-sheet/20 grid grid-cols-3 gap-1 text-center">
                {[
                  [Math.floor(given.Feeding / COST.meal).toLocaleString(), "meals funded"],
                  ["1", "scholar sponsored"],
                  [String(Math.max(1, Math.floor(given.Relief / COST.family))), "families helped"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-[1rem] font-bold tabular-nums">{v}</div>
                    <div className="text-[0.56rem] opacity-80 leading-tight">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <Label>Your scholar</Label>
            <div className="rounded-xl border border-rule bg-sheet p-3 flex gap-2.5">
              <span className="w-9 h-9 rounded-full bg-gold-wash text-gold text-[0.66rem] font-bold flex items-center justify-center shrink-0" aria-hidden>
                JM
              </span>
              <div className="min-w-0">
                <div className="text-[0.74rem] font-semibold text-ink">Jerome M. · Grade 11, Payatas</div>
                <div className="mt-0.5 text-[0.66rem] leading-snug text-ink-soft">Finished the first quarter with an 89 average. He wants to study civil engineering.</div>
                <div className="mt-1 text-[0.58rem] text-mist">Update from his coordinator · Oct 21</div>
              </div>
            </div>

            <Label>From the programs</Label>
            <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
              {UPDATES.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setUpdateId(u.id);
                    setView("update");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[0.6rem] font-semibold text-gold">{`${u.tag} · ${u.date}`}</span>
                    <span className="block text-[0.72rem] font-medium text-ink leading-snug">{u.title}</span>
                  </span>
                  <ChevronRight size={14} className="text-mist shrink-0" />
                </button>
              ))}
            </div>

            <Button onClick={() => setView("give")}>Give again</Button>
          </Body>
        </>
      )}

      {view === "update" && (
        <>
          <Header title={update.tag} sub={update.date} onBack={() => setView("home")} />
          <Body>
            <div className="h-28 rounded-xl bg-gold-wash text-gold text-[0.64rem] font-medium flex items-center justify-center">{update.photo}</div>
            <div className="mt-3 text-[0.9rem] font-bold text-ink leading-snug">{update.title}</div>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-ink-soft">{update.text}</p>
            <div className="mt-3 rounded-xl border border-rule bg-sheet p-3">
              <div className="text-[0.6rem] font-semibold text-graphite">Your part</div>
              <div className="mt-0.5 text-[0.72rem] text-ink leading-snug">{`Your ${peso(given[update.program])} to ${PHRASE[update.program]} this year covered ${impactOf(update.program, given[update.program])}.`}</div>
            </div>
            <Button
              onClick={() => {
                setProgram(update.program);
                setView("give");
              }}
            >
              {`Give to ${PHRASE[update.program]}`}
            </Button>
          </Body>
        </>
      )}

      {view === "give" && (
        <>
          <Header title="Give again" sub="Bukas Palad Foundation" onBack={() => setView("home")} />
          <Body>
            <div className="text-center py-1">
              <div className="text-[2rem] font-bold text-ink tracking-tight tabular-nums">{peso(amount)}</div>
              <div className="text-[0.64rem] text-mist">{often === "Monthly" ? "every month" : "one time"}</div>
            </div>
            <Chips options={[500, 1000, 2500, 5000]} value={amount} onChange={setAmount} format={(n) => peso(n)} />
            <Label>How often</Label>
            <Chips options={["Monthly", "Once"]} value={often} onChange={setOften} />
            <Label>Program</Label>
            <Chips<Program> options={["Feeding", "Scholars", "Relief"]} value={program} onChange={setProgram} />
            <div className="mt-2 rounded-lg bg-gold-wash px-2.5 py-2 text-[0.64rem] font-medium text-gold leading-snug">
              {`${peso(amount)}${often === "Monthly" ? " a month" : ""} = ${impactOf(program, amount)}`}
            </div>
            <Label>Pay with</Label>
            <Choice options={["GCash", "Maya", "Card •• 2291"]} value={method} onChange={setMethod} />
            <Button onClick={give}>{`Give ${peso(amount)}${often === "Monthly" ? " monthly" : ""}`}</Button>
          </Body>
        </>
      )}

      {view === "done" && (
        <Body>
          <Done
            title="Salamat, Joy!"
            lines={[
              `${peso(amount)} ${often === "Monthly" ? "every month" : "one-time"} to ${PHRASE[program]}`,
              `Paid with ${method}`,
              "Receipt sent to joy.delacruz@gmail.com",
            ]}
            action="Back to my impact"
            onDone={() => setView("home")}
          />
        </Body>
      )}

      <TabBar items={[[Heart, "Impact"], [Newspaper, "Updates"], [HandHeart, "Give"], [User, "Me"]]} active={tab} />
    </>
  );
}
