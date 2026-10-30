"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Lock, Pause, Play, Smartphone } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { ProtoDriveProvider, type ProtoDrive, type StackEntry } from "@/components/products/ProtoKit";
import { SHOWCASE, type TourStep } from "@/components/products/showcase";
import { Button } from "@/components/ui/Button";
import { CountUp, RevealHeading } from "@/components/ui/motion";
import { money, weeksLabel } from "@/lib/assessment/format";
import { EVERY_PLAN, PRODUCTS, PRODUCT_GROUPS, productEstimate, productQuote, type Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

function PrototypeLoading() {
  return <div className="h-[660px] bg-[#F7F8FA] flex items-center justify-center text-[0.85rem] text-[#667085]">Loading demo…</div>;
}

// Each prototype loads only when its product is picked.
const PROTOTYPES: Record<Product["id"], React.ComponentType> = {
  "church-os": dynamic(() => import("@/components/products/church-os").then((m) => m.ChurchOSPrototype), { ssr: false, loading: PrototypeLoading }),
  pipeline: dynamic(() => import("@/components/products/pipeline").then((m) => m.AIPipelinePrototype), { ssr: false, loading: PrototypeLoading }),
  sermon: dynamic(() => import("@/components/products/sermon").then((m) => m.SermonMakerPrototype), { ssr: false, loading: PrototypeLoading }),
  "bible-study": dynamic(() => import("@/components/products/bible-study").then((m) => m.BibleStudyPrototype), { ssr: false, loading: PrototypeLoading }),
  hris: dynamic(() => import("@/components/products/hris").then((m) => m.ChurchHRISPrototype), { ssr: false, loading: PrototypeLoading }),
  hubspot: dynamic(() => import("@/components/products/hubspot").then((m) => m.HubSpotPrototype), { ssr: false, loading: PrototypeLoading }),
  erp: dynamic(() => import("@/components/products/erp").then((m) => m.ErpPrototype), { ssr: false, loading: PrototypeLoading }),
};

const ProductPhone = dynamic(() => import("@/components/products/phones").then((m) => m.ProductPhone), { ssr: false });

// Start each product with its first two optional modules selected.
const DEFAULT_MODULES = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p.modules.filter((m) => !m.included).slice(0, 2).map((m) => m.id)]),
) as Record<Product["id"], string[]>;

const STEP_SECONDS = 7.5;
const EASE = [0.16, 1, 0.3, 1] as const;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pathOf = (stack: StackEntry[]) => `/${stack[0].screen}${stack.length > 1 ? `/${stack[stack.length - 1].id ?? stack[stack.length - 1].screen}` : ""}`;
const firstStack = (id: Product["id"]): StackEntry[] => [{ screen: SHOWCASE[id].tour.find((t) => t.screen)!.screen! }];

// ---- Finding things in the live demo --------------------------------------------

// The visible element whose own text matches, exact match first.
function findText(root: Element | null, text: string): HTMLElement | null {
  if (!root) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let partial: HTMLElement | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue?.trim();
    const el = node.parentElement;
    if (!value || !el || !el.getClientRects().length) continue;
    if (value === text) return el;
    if (!partial && value.startsWith(text)) partial = el;
  }
  return partial;
}

// What a click on that text would hit: a control, a row, or the panel around it.
function hitTarget(el: HTMLElement) {
  return (
    el.closest<HTMLElement>("button, a, select, tr, [role=row]") ??
    el.closest<HTMLElement>("[class*='rounded'][class*='border']") ??
    el
  );
}

async function waitFor<T>(find: () => T | null, timeout = 2500): Promise<T | null> {
  const end = Date.now() + timeout;
  for (;;) {
    const found = find();
    if (found || Date.now() > end) return found;
    await sleep(100);
  }
}

// ---- Section --------------------------------------------------------------------

export function Products() {
  const { sendQuote } = useAssessment();
  const reduce = useReducedMotion();
  const [productId, setProductId] = useState<Product["id"]>(PRODUCTS[0].id);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [target, setTarget] = useState(() => ({ key: 1, stack: firstStack(PRODUCTS[0].id) }));
  const [path, setPath] = useState("/");
  const [cursor, setCursor] = useState({ x: 0, y: 0, shown: false, tap: 0 });
  const [ring, setRing] = useState({ x: 0, y: 0, w: 0, h: 0, shown: false });

  const frameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef("/");
  const runRef = useRef(0);
  const startedRef = useRef(false);
  const inView = useInView(playerRef, { amount: 0.4 });

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const show = SHOWCASE[product.id];
  const current = show.tour[step];
  const running = playing && inView && !reduce;
  const selected = modules[product.id];
  const tierId = tiers[product.id] ?? product.tiers.options[0].id;
  const estimate = productEstimate(product, selected, tierId);
  const Prototype = PROTOTYPES[product.id];
  const Mark = show.icon;

  const onPath = useCallback((p: string) => {
    pathRef.current = p;
    setPath(p);
  }, []);
  const drive = useMemo<ProtoDrive>(() => ({ target, brand: { accent: show.accent, icon: show.icon }, framed: true, onPath }), [target, show, onPath]);

  // ---- The cursor plays a step on the live demo ----

  const point = useCallback(
    async (el: HTMLElement, run: number) => {
      const frame = frameRef.current;
      if (!frame || run !== runRef.current) return false;
      const scroller = frame.querySelector<HTMLElement>("[data-proto-scroll]");
      if (scroller?.contains(el)) {
        const s = scroller.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (r.top < s.top + 8 || r.bottom > s.bottom - 8) {
          scroller.scrollTo({ top: scroller.scrollTop + (r.top - s.top) - 72, behavior: reduce ? "auto" : "smooth" });
          await sleep(reduce ? 50 : 450);
        }
      }
      if (run !== runRef.current) return false;
      const base = frame.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const control = el.matches("button, a, select, tr, [role=row]");
      setCursor((c) => ({
        ...c,
        shown: true,
        x: r.left - base.left + (control ? r.width / 2 : Math.min(r.width / 2, 36)),
        y: r.top - base.top + (control ? r.height / 2 : Math.min(r.height / 2, 20)),
      }));
      setRing({ x: r.left - base.left - 4, y: r.top - base.top - 4, w: r.width + 8, h: r.height + 8, shown: true });
      await sleep(reduce ? 120 : 650);
      return run === runRef.current;
    },
    [reduce],
  );

  const tap = useCallback(async (el: HTMLElement, run: number) => {
    if (run !== runRef.current) return false;
    setCursor((c) => ({ ...c, tap: c.tap + 1 }));
    await sleep(140);
    if (run !== runRef.current) return false;
    el.click();
    await sleep(500);
    return run === runRef.current;
  }, []);

  const play = useCallback(
    async (s: TourStep) => {
      const run = ++runRef.current;
      const frame = frameRef.current;
      if (!frame) return;
      const main = () => frame.querySelector("[data-proto-main]");
      setRing((r) => ({ ...r, shown: false }));

      if (s.phone) {
        const toggle = frame.querySelector<HTMLElement>("[data-phone-toggle]");
        if (toggle && (await point(toggle, run))) await tap(toggle, run);
        if (run === runRef.current) {
          setRing((r) => ({ ...r, shown: false }));
          setCursor((c) => ({ ...c, shown: false }));
        }
        return;
      }

      const expected = s.open ? pathOf(s.open.stack) : s.screen ? `/${s.screen}` : null;
      if (s.screen && pathRef.current !== expected && pathRef.current !== `/${s.screen}`) {
        const nav = await waitFor(() => frame.querySelector<HTMLElement>(`[data-screen="${s.screen}"]`));
        if (!nav || !(await point(nav, run)) || !(await tap(nav, run))) return;
        setRing((r) => ({ ...r, shown: false }));
        await sleep(250);
      }
      if (s.open && pathRef.current !== expected) {
        const row = await waitFor(() => findText(main(), s.open!.text), 1500);
        if (row && (await point(hitTarget(row), run))) await tap(hitTarget(row), run);
        if (run !== runRef.current) return;
        if (pathRef.current !== expected) setTarget((t) => ({ key: t.key + 1, stack: s.open!.stack }));
        setRing((r) => ({ ...r, shown: false }));
        await sleep(450);
      }
      for (const action of s.actions ?? []) {
        const found = await waitFor(() => findText(main(), action.text) ?? findText(frame.querySelector("[role=dialog]"), action.text), 1500);
        if (run !== runRef.current) return;
        if (!found) continue;
        const el = hitTarget(found);
        if (!(await point(el, run))) return;
        if (action.click) {
          if (!(await tap(el, run))) return;
          setRing((r) => ({ ...r, shown: false }));
          await sleep(350);
        } else {
          await sleep(900);
        }
      }
    },
    [point, tap],
  );

  const stop = () => {
    runRef.current++;
    setPlaying(false);
    setCursor((c) => ({ ...c, shown: false }));
    setRing((r) => ({ ...r, shown: false }));
  };

  const goTo = (i: number, keepPlaying = false) => {
    setStep(i);
    setPhoneOpen(false);
    if (!keepPlaying) setPlaying(false);
    void play(show.tour[i]);
  };

  const pickProduct = (id: Product["id"]) => {
    if (id === productId) return;
    runRef.current++;
    setProductId(id);
    setStep(0);
    setPhoneOpen(false);
    setPlaying(true);
    setCursor((c) => ({ ...c, shown: false }));
    setRing((r) => ({ ...r, shown: false }));
    pathRef.current = "/";
    setPath("/");
    setTarget((t) => ({ key: t.key + 1, stack: firstStack(id) }));
    window.setTimeout(() => void play(SHOWCASE[id].tour[0]), 500);
  };

  // Start the tour the first time the demo scrolls into view.
  useEffect(() => {
    if (!inView || startedRef.current || reduce) return;
    startedRef.current = true;
    const timer = window.setTimeout(() => void play(SHOWCASE[productId].tour[0]), 400);
    return () => window.clearTimeout(timer);
  }, [inView, reduce, play, productId]);

  const toggle = (id: string) =>
    setModules((all) => ({
      ...all,
      [product.id]: all[product.id].includes(id) ? all[product.id].filter((m) => m !== id) : [...all[product.id], id],
    }));

  return (
    <section id="products" className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1240px] mx-auto">
        <div className="max-w-[40rem]">
          <RevealHeading text="Products" className="heading-section text-ink" />
          <p className="mt-4 text-[1.1rem] leading-relaxed text-graphite">Seven apps, ready to run. Every demo below is live.</p>
        </div>

        {/* Suite switcher */}
        <div role="tablist" aria-label="Products" className="mt-12 flex gap-8 overflow-x-auto -mx-5 px-5 scroll-px-5 md:mx-0 md:px-0 md:scroll-px-0 pb-2 snap-x">
          {PRODUCT_GROUPS.map((group) => (
            <div key={group.id} className="shrink-0">
              <div className="annot text-mist mb-2.5">{group.label}</div>
              <div className="flex gap-1">
                {PRODUCTS.filter((p) => p.group === group.id).map((p) => {
                  const on = p.id === productId;
                  const s = SHOWCASE[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="product-stage"
                      onClick={() => pickProduct(p.id)}
                      className={cn("relative snap-start flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer", !on && "hover:bg-sheet")}
                    >
                      {on && <motion.span layoutId="product-pick" className="absolute inset-0 rounded-xl bg-sheet ring-1 ring-rule" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <span className={cn("relative w-8 h-8 rounded-lg flex items-center justify-center text-white transition-opacity", !on && "opacity-75")} style={{ backgroundColor: s.accent }}>
                        <s.icon size={16} strokeWidth={2} />
                      </span>
                      <span className={cn("relative text-[0.9rem] whitespace-nowrap", on ? "font-semibold text-ink" : "font-medium text-graphite")}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={product.id}
            id="product-stage"
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mt-10"
          >
            {/* Product header */}
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 mb-6">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white shrink-0" style={{ backgroundColor: show.accent }}>
                  <Mark size={24} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="font-display text-[1.75rem] leading-none font-semibold tracking-[-0.03em] text-ink">{product.name}</h3>
                  <p className="mt-1.5 text-[0.95rem] text-graphite">{product.hook}</p>
                </div>
              </div>
              <span className="font-mono text-[0.75rem] text-mist">{product.platforms}</span>
            </div>

            {/* The player: live demo in a browser, a cursor that walks the tour, chapters below */}
            <div ref={playerRef} className="rounded-[20px] bg-[#05070A] ring-1 ring-white/10 p-1.5 shadow-[0_60px_120px_-50px_rgba(0,0,0,0.95)]">
              <div
                ref={frameRef}
                className="relative rounded-[15px] overflow-hidden bg-[#E9ECF1]"
                onPointerDown={(e) => e.isTrusted && stop()}
                onWheel={() => running && stop()}
              >
                <div className="h-10 px-3 flex items-center gap-3 bg-[#EEF0F3] border-b border-[#D9DDE3]">
                  <span className="flex gap-1.5 shrink-0" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D0D5DD]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D0D5DD]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D0D5DD]" />
                  </span>
                  <div className="flex-1 min-w-0 flex justify-center">
                    <div className="flex items-center justify-center gap-1.5 h-6 px-3 w-full max-w-[28rem] rounded-md bg-white ring-1 ring-[#E4E7EC] text-[0.72rem] text-[#344054]">
                      <Lock size={10} className="shrink-0 text-[#667085]" />
                      <span className="truncate">
                        {show.host}
                        <span className="text-[#98A2B3]">{path}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-phone-toggle
                    aria-pressed={phoneOpen}
                    onClick={() => setPhoneOpen((o) => !o)}
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 h-6 px-2 rounded-md text-[0.72rem] font-medium transition-colors cursor-pointer",
                      phoneOpen ? "bg-[#101828] text-white" : "text-[#344054] hover:bg-white",
                    )}
                  >
                    <Smartphone size={12} />
                    <span className="hidden sm:inline">{show.mobile}</span>
                  </button>
                </div>

                <div className="relative">
                  <ProtoDriveProvider value={drive}>
                    <Prototype />
                  </ProtoDriveProvider>
                  <AnimatePresence>
                    {phoneOpen && (
                      <motion.button
                        type="button"
                        aria-label={`Close ${show.mobile}`}
                        onClick={() => setPhoneOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 bg-[#101828]/40 cursor-pointer"
                      />
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {phoneOpen && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center sm:justify-end sm:pr-12 pointer-events-none">
                        <motion.div
                          initial={{ opacity: 0, y: 70 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 50 }}
                          transition={{ type: "spring", stiffness: 260, damping: 28 }}
                          className="pointer-events-auto scale-[0.9] sm:scale-100 origin-center"
                        >
                          <ProductPhone id={product.id} accent={show.accent} />
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Highlight and cursor */}
                <motion.div
                  aria-hidden
                  className="absolute left-0 top-0 z-30 pointer-events-none rounded-[10px]"
                  style={{ boxShadow: `0 0 0 2px ${show.accent}, 0 0 0 7px ${show.accent}26` }}
                  initial={false}
                  animate={{ x: ring.x, y: ring.y, width: ring.w, height: ring.h, opacity: ring.shown ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
                />
                <motion.div
                  aria-hidden
                  className="absolute left-0 top-0 z-40 pointer-events-none"
                  initial={false}
                  animate={{ x: cursor.x, y: cursor.y, opacity: cursor.shown ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: [0.45, 0, 0.2, 1] }}
                >
                  <AnimatePresence>
                    {cursor.tap > 0 && (
                      <motion.span
                        key={cursor.tap}
                        className="absolute -left-4 -top-4 w-8 h-8 rounded-full"
                        style={{ backgroundColor: `${show.accent}55` }}
                        initial={{ scale: 0.3, opacity: 1 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </AnimatePresence>
                  <svg width="22" height="22" viewBox="0 0 24 24" className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
                    <path d="M4 2.5 19.5 13l-7 1.2 4 7.3-2.9 1.5-4-7.4L4 20.5Z" fill="#101828" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              </div>

              {/* Tour controls */}
              <div className="px-3 sm:px-4 pt-4 pb-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (running) return stop();
                      setPlaying(true);
                      goTo(step, true);
                    }}
                    aria-label={running ? "Pause tour" : "Play tour"}
                    className="w-9 h-9 shrink-0 rounded-full bg-ink text-night flex items-center justify-center cursor-pointer hover:bg-white transition-colors"
                  >
                    {running ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0 pt-0.5" aria-live="polite">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div key={`${product.id}-${step}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                        <div className="text-[0.95rem] font-semibold text-ink leading-snug">{current.title}</div>
                        <div className="text-[0.85rem] text-graphite leading-snug mt-0.5">{current.detail}</div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[0.72rem] text-mist mr-2">
                      {step + 1} / {show.tour.length}
                    </span>
                    <button type="button" aria-label="Previous step" onClick={() => goTo((step - 1 + show.tour.length) % show.tour.length)} className="w-8 h-8 rounded-lg text-graphite hover:text-ink hover:bg-white/5 flex items-center justify-center cursor-pointer">
                      <ChevronLeft size={16} />
                    </button>
                    <button type="button" aria-label="Next step" onClick={() => goTo((step + 1) % show.tour.length)} className="w-8 h-8 rounded-lg text-graphite hover:text-ink hover:bg-white/5 flex items-center justify-center cursor-pointer">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <ol aria-label="Tour steps" className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${show.tour.length}, minmax(0, 1fr))` }}>
                  {show.tour.map((t, i) => (
                    <li key={t.title}>
                      <button type="button" onClick={() => goTo(i)} aria-current={i === step ? "step" : undefined} className="group w-full text-left cursor-pointer pt-1.5 pb-1">
                        <span className="block h-[3px] rounded-full bg-white/10 overflow-hidden">
                          {i < step && <span className="block h-full bg-ink/60" />}
                          {i === step &&
                            (running ? (
                              <motion.span
                                key={`${product.id}-${step}-${target.key}`}
                                className="block h-full bg-gold"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: STEP_SECONDS, ease: "linear" }}
                                onAnimationComplete={() => goTo((step + 1) % show.tour.length, true)}
                              />
                            ) : (
                              <span className="block h-full bg-gold" />
                            ))}
                        </span>
                        <span className={cn("hidden md:flex items-center gap-1 mt-2 text-[0.75rem] truncate transition-colors", i === step ? "text-ink font-medium" : "text-mist group-hover:text-graphite")}>
                          {t.phone && <Smartphone size={11} className="shrink-0" />}
                          {t.short}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Plan builder and price */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem] gap-10 lg:gap-14 items-start">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h4 className="heading-card text-ink">Build your plan</h4>
                  <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-sheet ring-1 ring-rule" role="group" aria-label={product.tiers.label}>
                    {product.tiers.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={o.id === tierId}
                        onClick={() => setTiers((s) => ({ ...s, [product.id]: o.id }))}
                        className={cn("relative px-3 py-1.5 rounded-lg text-[0.8rem] transition-colors cursor-pointer", o.id === tierId ? "text-night font-semibold" : "text-graphite hover:text-ink")}
                      >
                        {o.id === tierId && <motion.span layoutId={`tier-${product.id}`} className="absolute inset-0 rounded-lg bg-ink" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
                        <span className="relative">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-[0.8rem] text-mist">{product.tiers.label}</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {product.modules.map((m) => {
                    const on = m.included || selected.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={m.included}
                        aria-pressed={on}
                        onClick={() => toggle(m.id)}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-[0.88rem] ring-1 transition-[box-shadow,background-color,color]",
                          m.included ? "ring-rule bg-sheet text-ink-soft cursor-default" : on ? "ring-gold/70 bg-sheet text-ink cursor-pointer" : "ring-rule text-graphite hover:text-ink hover:ring-mist cursor-pointer",
                        )}
                      >
                        <span
                          className={cn(
                            "w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 transition-colors",
                            m.included ? "bg-raised text-mist" : on ? "bg-gold text-night" : "ring-1 ring-inset ring-mist",
                          )}
                          aria-hidden
                        >
                          {m.included ? <Lock size={10} /> : on && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="flex-1">{m.label}</span>
                        {m.included && <span className="text-[0.72rem] text-mist">Core</span>}
                      </button>
                    );
                  })}
                </div>

                <dl className="mt-8 grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-x-6 gap-y-2.5 text-[0.85rem] border-t border-rule pt-6">
                  <dt className="text-mist">Works with</dt>
                  <dd className="text-ink-soft">{product.integrations.join(", ")}</dd>
                  <dt className="text-mist">Every plan</dt>
                  <dd className="text-ink-soft">{EVERY_PLAN.join(", ")}</dd>
                  {product.note && (
                    <>
                      <dt className="text-mist">Note</dt>
                      <dd className="text-ink-soft">{product.note}</dd>
                    </>
                  )}
                </dl>
              </div>

              <aside className="lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)] rounded-[18px] bg-sheet ring-1 ring-rule p-6" aria-live="polite">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: show.accent }}>
                    <Mark size={14} strokeWidth={2} />
                  </span>
                  <span className="text-[0.9rem] font-semibold text-ink">{product.name}</span>
                </div>
                <dl className="mt-6 flex flex-col gap-5">
                  <div>
                    <dt className="text-[0.78rem] text-mist">Setup, one-time</dt>
                    <dd className="mt-1 font-display text-[2.4rem] leading-none font-semibold tracking-[-0.04em] text-ink">
                      <CountUp value={estimate.setupTotal} format={money} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.78rem] text-mist">{product.id === "hubspot" ? "Support" : "Subscription"}</dt>
                    <dd className="mt-1 font-display text-[2.4rem] leading-none font-semibold tracking-[-0.04em] text-ink">
                      {estimate.monthlyTotal ? (
                        <>
                          <CountUp value={estimate.monthlyTotal} format={money} />
                          <span className="text-[0.95rem] font-body font-normal tracking-normal text-graphite"> / month</span>
                        </>
                      ) : (
                        <span className="text-[1.1rem] font-body font-medium tracking-normal text-graphite">None</span>
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-[0.82rem] text-graphite">Live in about {weeksLabel(estimate.weeks)}</p>
                <Button className="mt-6 w-full justify-center" onClick={() => sendQuote(productQuote(product, selected, tierId))}>
                  Request a quote <ArrowRight size={16} />
                </Button>
                <p className="mt-4 pt-4 border-t border-rule text-[0.8rem] text-gold-bright">45% less than typical commercial software</p>
              </aside>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
