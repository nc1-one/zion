"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Check,
  ClipboardCheck,
  HandCoins,
  Home,
  Kanban,
  ListChecks,
  ScanLine,
  Truck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Body, Button, Chips, Choice, Done, Header, Label, PhoneFrame, Stepper, TabBar } from "./phone-kit";
import { DonorsPhone } from "./donors-phone";
import { StorePhone } from "./store-phone";
import type { Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const peso = (n: number) => `₱${n.toLocaleString()}`;

// ---- Church OS: member app ----------------------------------------------------

function ChurchOSPhone() {
  const [amount, setAmount] = useState(1000);
  const [fund, setFund] = useState("General");
  const [method, setMethod] = useState("GCash");
  const [done, setDone] = useState(false);
  return (
    <>
      <Header title="Give" sub="Grace Fellowship" />
      <Body>
        {done ? (
          <Done title={`${peso(amount)} received`} lines={[`${fund} fund · ${method}`, "Receipt sent to ana.reyes@gmail.com"]} action="Give again" onDone={() => setDone(false)} />
        ) : (
          <>
            <div className="text-center py-1.5">
              <div className="text-[2.1rem] font-bold text-ink tracking-tight tabular-nums">{peso(amount)}</div>
            </div>
            <Chips options={[500, 1000, 2500, 5000]} value={amount} onChange={setAmount} format={(n) => peso(n)} />
            <Label>Fund</Label>
            <Chips options={["General", "Missions", "Building"]} value={fund} onChange={setFund} />
            <Label>Pay with</Label>
            <Choice options={["GCash", "Maya", "Card •• 4821"]} value={method} onChange={setMethod} />
            <Button onClick={() => setDone(true)}>Give {peso(amount)}</Button>
          </>
        )}
      </Body>
      <TabBar items={[[Home, "Home"], [HandCoins, "Give"], [CalendarDays, "Events"], [User, "Me"]]} active={1} />
    </>
  );
}

// ---- AI Church Pipeline: care team app ---------------------------------------------

const FOLLOW_UPS = [
  { id: "t1", name: "Liza Mendoza", stage: "Second visit", due: "Today", late: false, draft: "Hi Liza! So glad you and Rico came back Sunday. Our Pasig group meets Fridays at 7 PM. Want me to save you two seats? – Grace" },
  { id: "t2", name: "Carlo Bautista", stage: "First visit", due: "3 days late", late: true, draft: "Hi Carlo, Grace from Grace Fellowship. Thanks for visiting on the 12th! Coffee after the 9 AM service this Sunday?" },
  { id: "t3", name: "Mia Fernandez", stage: "First visit", due: "Tomorrow", late: false, draft: "Hi Mia! Great to meet you Sunday. Newcomers' lunch is Nov 8 after the 9 AM service. Join us?" },
];

function PipelinePhone() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(FOLLOW_UPS.map((f) => [f.id, f.draft])));
  const task = FOLLOW_UPS.find((f) => f.id === openId);
  const left = FOLLOW_UPS.length - sent.length;

  return (
    <>
      {task ? (
        <>
          <Header title={task.name} sub={`${task.stage} · ${task.due}`} onBack={() => setOpenId(null)} />
          <Body>
            <div className="flex items-center gap-1.5 text-[0.66rem] font-semibold text-gold">
              Suggested text
            </div>
            <textarea
              value={drafts[task.id]}
              onChange={(e) => setDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
              rows={6}
              aria-label="Message"
              className="mt-2 w-full rounded-2xl rounded-br-md bg-gold-wash border border-gold/30 p-3 text-[0.74rem] leading-relaxed text-ink resize-none outline-none focus:border-gold"
            />
            <div className="mt-1 text-[0.62rem] text-mist">Edit before sending. Nothing sends without you.</div>
            <Button
              onClick={() => {
                setSent((s) => [...s, task.id]);
                setOpenId(null);
              }}
            >
              Send text
            </Button>
          </Body>
        </>
      ) : (
        <>
          <Header title="Follow-ups" sub={left ? `${left} for you today` : "All caught up"} />
          <Body>
            <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
              {FOLLOW_UPS.map((f) => {
                const done = sent.includes(f.id);
                return (
                  <button key={f.id} type="button" disabled={done} onClick={() => setOpenId(f.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer disabled:cursor-default">
                    <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[0.66rem] font-bold shrink-0", done ? "bg-gold text-sheet" : "bg-raised text-graphite")}>
                      {done ? <Check size={14} strokeWidth={3} /> : f.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={cn("block text-[0.76rem] font-semibold truncate", done ? "text-mist line-through" : "text-ink")}>{f.name}</span>
                      <span className="block text-[0.64rem] text-mist">{f.stage}</span>
                    </span>
                    <span className={cn("text-[0.62rem] font-medium", done ? "text-good" : f.late ? "text-danger" : "text-graphite")}>{done ? "Sent" : f.due}</span>
                  </button>
                );
              })}
            </div>
          </Body>
        </>
      )}
      <TabBar items={[[ListChecks, "Today"], [Users, "People"], [Kanban, "Board"]]} active={0} />
    </>
  );
}

// ---- Sermon Maker: congregation notes ---------------------------------------------

const POINTS = [
  { before: "God is already", blank: "at work", after: "in you.", ref: "2:13" },
  { before: "Obedience is our part of a work God", blank: "started", after: ".", ref: "2:12" },
  { before: "We shine by", blank: "holding fast", after: "to the word of life.", ref: "2:15–16" },
];

function SermonPhone() {
  const [shown, setShown] = useState<number[]>([]);
  return (
    <>
      <Header title="Sunday notes" sub="Nov 1 · Grace Fellowship" />
      <Body>
        <div className="rounded-2xl bg-gold text-sheet p-4">
          <div className="text-[0.62rem] opacity-80">Unshaken: Philippians · Week 4</div>
          <div className="mt-1 text-[1rem] font-bold leading-snug">Working out what God works in</div>
          <div className="mt-1 text-[0.66rem] opacity-80">Philippians 2:12–30 · Pastor Dan</div>
        </div>
        <ol className="mt-4 flex flex-col gap-3">
          {POINTS.map((p, i) => (
            <li key={p.ref} className="flex gap-2.5 text-[0.76rem] leading-relaxed text-ink">
              <span className="text-[0.7rem] font-bold text-gold mt-px">{i + 1}</span>
              <span>
                {p.before}{" "}
                <button
                  type="button"
                  onClick={() => setShown((s) => (s.includes(i) ? s : [...s, i]))}
                  className={cn("font-semibold cursor-pointer", shown.includes(i) ? "text-gold" : "text-transparent border-b-2 border-dashed border-mist")}
                  aria-label={shown.includes(i) ? p.blank : "Reveal blank"}
                >
                  {p.blank}
                </button>
                {p.after === "." ? "." : ` ${p.after}`} <span className="text-[0.64rem] text-mist">{p.ref}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-2 text-[0.62rem] text-mist">Tap a blank to fill it in.</div>
        <Label>This week</Label>
        <div className="rounded-xl border border-rule bg-sheet p-3 text-[0.72rem] leading-relaxed text-ink-soft">
          Do the one thing you&apos;ve been putting off. Pray before you start.
        </div>
        <Label>For your group</Label>
        <ul className="flex flex-col gap-1.5 text-[0.72rem] leading-relaxed text-ink-soft">
          <li>Where do you see God already at work in you?</li>
          <li>What makes obedience feel heavy this season?</li>
        </ul>
      </Body>
    </>
  );
}

// ---- Bible Study Groups: leader check-in -------------------------------------------

function BibleStudyPhone() {
  const [here, setHere] = useState(9);
  const [guests, setGuests] = useState(2);
  const [feel, setFeel] = useState("Great");
  const [done, setDone] = useState(false);
  return (
    <>
      <Header title="Check-in" sub="Makati Young Pros · Tue, Oct 27" />
      <Body>
        {done ? (
          <Done title="Check-in sent" lines={[`${here} members, ${guests} guests`, "Pastor Joel sees it now."]} action="Edit check-in" onDone={() => setDone(false)} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Members (of 10)</Label>
                <Stepper value={here} onChange={setHere} max={10} />
              </div>
              <div>
                <Label>Guests</Label>
                <Stepper value={guests} onChange={setGuests} />
              </div>
            </div>
            <Label>How did it go?</Label>
            <Chips options={["Great", "Okay", "Hard"]} value={feel} onChange={setFeel} />
            <Label>Prayer requests</Label>
            <textarea rows={2} placeholder="Optional" aria-label="Prayer requests" className="w-full rounded-xl border border-rule bg-sheet p-2.5 text-[0.72rem] text-ink placeholder:text-mist resize-none outline-none focus:border-gold" />
            <Button onClick={() => setDone(true)}>Send check-in</Button>
          </>
        )}
      </Body>
      <TabBar items={[[ClipboardCheck, "Check-in"], [Users, "Group"], [BookOpen, "Plan"]]} active={0} />
    </>
  );
}

// ---- Church HRIS: staff self-service ------------------------------------------------

const PAYSLIP: [string, number][] = [
  ["Basic pay", 14000],
  ["SSS", -700],
  ["PhilHealth", -350],
  ["Pag-IBIG", -100],
  ["Withholding tax", -365],
];

function HrisPhone() {
  const [view, setView] = useState<"home" | "leave" | "sent">("home");
  const [type, setType] = useState("Vacation");
  const [days, setDays] = useState(2);
  const net = PAYSLIP.reduce((s, [, n]) => s + n, 0);
  return (
    <>
      {view === "home" ? (
        <>
          <Header title="Andrea Flores" sub="Youth pastor" />
          <Body>
            <div className="rounded-2xl border border-rule bg-sheet p-3.5">
              <div className="flex items-center justify-between text-[0.66rem] text-mist">
                <span>Payslip · Oct 16–31</span>
                <span className="text-good font-medium">Paid Oct 30</span>
              </div>
              <div className="mt-1 text-[1.6rem] font-bold text-ink tabular-nums">{peso(net)}</div>
              <div className="mt-2 pt-2 border-t border-rule flex flex-col gap-1">
                {PAYSLIP.map(([label, n]) => (
                  <div key={label} className="flex justify-between text-[0.68rem]">
                    <span className="text-graphite">{label}</span>
                    <span className={cn("tabular-nums", n < 0 ? "text-ink-soft" : "text-ink font-medium")}>{n < 0 ? `−${peso(-n)}` : peso(n)}</span>
                  </div>
                ))}
              </div>
            </div>
            <Label>Leave balance</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {[["Vacation", 5], ["Sick", 4]].map(([l, n]) => (
                <div key={l} className="rounded-xl border border-rule bg-sheet p-2.5">
                  <div className="text-[1.1rem] font-bold text-ink">{n} days</div>
                  <div className="text-[0.62rem] text-mist">{l}</div>
                </div>
              ))}
            </div>
            <Button onClick={() => setView("leave")}>Request leave</Button>
          </Body>
        </>
      ) : view === "leave" ? (
        <>
          <Header title="Request leave" onBack={() => setView("home")} />
          <Body>
            <Label>Type</Label>
            <Chips options={["Vacation", "Sick"]} value={type} onChange={setType} />
            <Label>Starting</Label>
            <div className="rounded-xl border border-rule bg-sheet px-3 h-9 flex items-center text-[0.74rem] text-ink">Mon, Nov 9</div>
            <Label>Days</Label>
            <Stepper value={days} onChange={setDays} min={1} max={type === "Vacation" ? 5 : 4} />
            <Button onClick={() => setView("sent")}>Send request</Button>
          </Body>
        </>
      ) : (
        <Body>
          <Done title="Request sent" lines={[`${days} ${days === 1 ? "day" : "days"} of ${type.toLowerCase()} leave from Nov 9`, "Tess Aquino will approve it."]} action="Back to home" onDone={() => setView("home")} />
        </Body>
      )}
      <TabBar items={[[Home, "Home"], [Wallet, "Pay"], [CalendarDays, "Leave"], [User, "Me"]]} active={view === "home" ? 0 : 2} />
    </>
  );
}

// ---- HubSpot for NGOs: donation page --------------------------------------------------

function HubSpotPhone() {
  const [monthly, setMonthly] = useState("Monthly");
  const [amount, setAmount] = useState(1000);
  const [done, setDone] = useState(false);
  return (
    <Body>
      <div className="pt-1 text-[0.72rem] font-bold text-ink">Hope Philippines Foundation</div>
      {done ? (
        <Done
          title="Salamat!"
          lines={[`${peso(amount)} ${monthly === "Monthly" ? "every month" : "received"}`, monthly === "Monthly" ? "Added to HubSpot: Monthly partners" : "Added to HubSpot: Donors", "Welcome email queued"]}
          action="Back to page"
          onDone={() => setDone(false)}
        />
      ) : (
        <>
          <div className="mt-3 rounded-2xl bg-gold text-sheet p-4">
            <div className="text-[1rem] font-bold leading-snug">Send a child to school this year</div>
            <div className="mt-3 h-1.5 rounded-full bg-sheet/30 overflow-hidden">
              <motion.div className="h-full bg-sheet rounded-full" initial={{ width: 0 }} animate={{ width: "69%" }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[0.62rem] opacity-90">
              <span>₱412,000 raised</span>
              <span>Goal ₱600,000</span>
            </div>
          </div>
          <Label>How often</Label>
          <Chips options={["Monthly", "Once"]} value={monthly} onChange={setMonthly} />
          <Label>Amount</Label>
          <Chips options={[500, 1000, 2500]} value={amount} onChange={setAmount} format={(n) => peso(n)} />
          <div className="mt-2 text-[0.64rem] text-graphite">{peso(1000)} a month covers a student&apos;s books and fees.</div>
          <Button onClick={() => setDone(true)}>
            Give {peso(amount)}
            {monthly === "Monthly" ? " monthly" : ""}
          </Button>
          <div className="mt-2 text-center text-[0.6rem] text-mist">GCash, Maya, or card</div>
        </>
      )}
    </Body>
  );
}

// ---- SME ERP: driver app --------------------------------------------------------------

const STOPS = [
  { id: "SO-2418", customer: "Dela Cruz Builders", address: "Fairview, Quezon City", eta: "10:30 AM", invoice: "INV-3052", items: ["120 bags cement 40kg", "60 pcs deformed bar 12mm"] },
  { id: "SO-2417", customer: "Ramos Interiors", address: "Kapitolyo, Pasig", eta: "1:00 PM", invoice: "INV-3053", items: ["40 boxes floor tile 60×60", "6 cans latex paint 4L"] },
  { id: "SO-2419", customer: "Santos & Sons", address: "Novaliches, Quezon City", eta: "3:30 PM", invoice: "INV-3054", items: ["30 sheets marine plywood", "50 bags cement 40kg"] },
];

function ErpPhone() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [signed, setSigned] = useState(false);
  const stop = STOPS.find((s) => s.id === openId);
  const last = STOPS.find((s) => s.id === delivered[delivered.length - 1]);

  const open = (id: string) => {
    setOpenId(id);
    setChecked([]);
    setSigned(false);
  };

  return (
    <>
      {stop ? (
        <>
          <Header title={stop.customer} sub={`${stop.id} · ${stop.address}`} onBack={() => setOpenId(null)} />
          <Body>
            <Label>Unload and check</Label>
            <div className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
              {stop.items.map((item) => {
                const on = checked.includes(item);
                return (
                  <button key={item} type="button" onClick={() => setChecked((c) => (on ? c.filter((x) => x !== item) : [...c, item]))} className="w-full flex items-center gap-2.5 px-3 h-10 text-left text-[0.72rem] text-ink cursor-pointer">
                    <span className={cn("w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0", on ? "bg-gold border-gold text-sheet" : "border-rule")}>{on && <Check size={10} strokeWidth={3.5} />}</span>
                    {item}
                  </button>
                );
              })}
            </div>
            <Label>Customer signature</Label>
            <button type="button" onClick={() => setSigned(true)} className="w-full h-20 rounded-xl border border-dashed border-mist bg-sheet flex items-center justify-center text-[0.66rem] text-mist cursor-pointer">
              {signed ? (
                <svg viewBox="0 0 160 50" className="w-36 h-12 text-ink" aria-label="Signed">
                  <motion.path d="M6 34 C 20 6, 30 46, 44 24 S 66 8, 74 30 S 98 44, 108 18 S 132 30, 154 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
                </svg>
              ) : (
                "Tap to sign"
              )}
            </button>
            <Button
              disabled={checked.length < stop.items.length || !signed}
              onClick={() => {
                setDelivered((d) => [...d, stop.id]);
                setOpenId(null);
              }}
            >
              Confirm delivery
            </Button>
          </Body>
        </>
      ) : (
        <>
          <Header title="Deliveries" sub={`Truck 2 · ${delivered.length} of ${STOPS.length} delivered`} />
          <Body>
            <AnimatePresence>
              {last && (
                <motion.div key={last.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-2 rounded-lg bg-gold-wash px-3 py-2 text-[0.66rem] text-gold font-medium">
                  {last.invoice} sent to {last.customer}
                </motion.div>
              )}
            </AnimatePresence>
            <ol className="rounded-xl border border-rule bg-sheet divide-y divide-rule">
              {STOPS.map((s, i) => {
                const done = delivered.includes(s.id);
                return (
                  <li key={s.id}>
                    <button type="button" disabled={done} onClick={() => open(s.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer disabled:cursor-default">
                      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[0.62rem] font-bold shrink-0", done ? "bg-gold text-sheet" : "bg-raised text-graphite")}>
                        {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={cn("block text-[0.74rem] font-semibold truncate", done ? "text-mist" : "text-ink")}>{s.customer}</span>
                        <span className="block text-[0.62rem] text-mist truncate">{s.address}</span>
                      </span>
                      <span className={cn("text-[0.62rem] font-medium", done ? "text-good" : "text-graphite")}>{done ? "Delivered" : s.eta}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Body>
        </>
      )}
      <TabBar items={[[Truck, "Route"], [ScanLine, "Scan"], [User, "Me"]]} active={0} />
    </>
  );
}

export const PHONES: Record<Product["id"], React.ComponentType> = {
  "church-os": ChurchOSPhone,
  pipeline: PipelinePhone,
  sermon: SermonPhone,
  "bible-study": BibleStudyPhone,
  hris: HrisPhone,
  hubspot: HubSpotPhone,
  donors: DonorsPhone,
  erp: ErpPhone,
  store: StorePhone,
};

export function ProductPhone({ id, accent }: { id: Product["id"]; accent: string }) {
  const Screen = PHONES[id];
  return (
    <PhoneFrame accent={accent}>
      <Screen />
    </PhoneFrame>
  );
}
