"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Command, ListChecks, RotateCcw, Smartphone, X } from "lucide-react";
import { BRANDS } from "./brands";
import { ProtoDriveProvider, type ProtoDrive, type StackEntry } from "./drive";
import { SHOWCASE, type Feature, type TourStep } from "./showcase";
import { findText, hitTarget, sleep, waitFor } from "./tour-dom";
import { brandStyle } from "@/lib/brand";
import type { Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const ProductPhone = dynamic(() => import("./phones").then((m) => m.ProductPhone), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;

interface Ring {
  key: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

// A product demo on its own page: the app fills the window, with a guide
// beside it that walks through what to try.
export function DemoShell({ product, children }: { product: Pick<Product, "id" | "name">; children: React.ReactNode }) {
  const show = SHOWCASE[product.id];
  const reduce = useReducedMotion();
  const [target, setTarget] = useState<{ key: number; stack: StackEntry[] }>();
  const [resetKey, setResetKey] = useState(0);
  // Docked beside the app on wide screens; a sheet below 1280px so the app keeps its full width.
  const [guide, setGuide] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [phone, setPhone] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const [ring, setRing] = useState<Ring | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const drive = useMemo<ProtoDrive>(() => ({ target, brand: { accent: show.accent, ...BRANDS[product.id] }, framed: true, page: true }), [target, show, product.id]);

  const goTo = (stack: StackEntry[]) => setTarget((t) => ({ key: (t?.key ?? 0) + 1, stack }));

  // Point at a control for a moment so the visitor knows where to click.
  const spotlight = useCallback(
    async (text: string) => {
      const frame = frameRef.current;
      const found = await waitFor(() => findText(frame?.querySelector("[data-proto-main]") ?? null, text), 1500);
      if (!found || !frame) return;
      const el = hitTarget(found);
      // Scroll only the app's content pane; the clipped frames around it must stay put.
      const scroller = frame.querySelector<HTMLElement>("[data-proto-scroll]");
      if (scroller?.contains(el)) {
        const s = scroller.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (r.top < s.top + 8 || r.bottom > s.bottom - 8) {
          scroller.scrollTo({ top: scroller.scrollTop + (r.top - s.top) - s.height / 3, behavior: reduce ? "auto" : "smooth" });
          await sleep(reduce ? 50 : 400);
        }
      }
      const base = frame.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const key = Date.now();
      setRing({ key, x: r.left - base.left - 4, y: r.top - base.top - 4, w: r.width + 8, h: r.height + 8 });
      await sleep(2800);
      setRing((current) => (current?.key === key ? null : current));
    },
    [reduce],
  );

  const tryStep = async (s: TourStep, i: number) => {
    setTried((t) => (t.includes(i) ? t : [...t, i]));
    setSheet(false);
    setRing(null);
    if (s.phone) return setPhone(true);
    setPhone(false);
    const stack = s.open?.stack ?? (s.screen ? [{ screen: s.screen }] : null);
    if (stack) goTo(stack);
    const first = s.actions?.[0]?.text;
    if (!first) return;
    await sleep(450);
    await spotlight(first);
  };

  const openFeature = (f: Feature) => {
    setSheet(false);
    setPhone(false);
    setRing(null);
    goTo(f.stack);
  };

  const reset = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setTarget(undefined);
    setTried([]);
    setPhone(false);
    setRing(null);
    setResetKey((k) => k + 1);
  };

  const guideBody = (
    <>
      <p className="text-[0.85rem] leading-relaxed text-graphite">
        A working copy with sample data. Click anything, add records, approve things. Changes stay until you reset or reload.
      </p>

      <h2 className="mt-6 text-[0.8rem] font-semibold text-ink">Walk through it</h2>
      <ol className="mt-2 flex flex-col">
        {show.tour.map((s, i) => {
          const done = tried.includes(i);
          return (
            <li key={s.title}>
              <button type="button" onClick={() => void tryStep(s, i)} className="group w-full flex gap-3 py-2.5 text-left cursor-pointer">
                <span
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[0.68rem] font-mono transition-colors",
                    done ? "bg-gold text-night" : "ring-1 ring-inset ring-rule text-mist group-hover:ring-mist",
                  )}
                  aria-hidden
                >
                  {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[0.85rem] font-medium text-ink group-hover:text-gold-bright transition-colors">
                    {s.title}
                    {s.phone && <Smartphone size={12} className="text-mist" aria-label="Mobile app" />}
                  </span>
                  <span className="block text-[0.78rem] leading-snug text-mist mt-0.5">{s.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {show.features.length > 0 && (
        <>
          <h2 className="mt-6 text-[0.8rem] font-semibold text-ink">What&rsquo;s inside</h2>
          <ul className="mt-2 flex flex-col divide-y divide-rule-soft">
            {show.features.map((f) => (
              <li key={f.label}>
                <button type="button" onClick={() => openFeature(f)} className="group w-full py-2.5 text-left cursor-pointer">
                  <span className="block text-[0.82rem] font-medium text-ink-soft group-hover:text-ink">{f.label}</span>
                  <span className="block text-[0.76rem] leading-snug text-mist mt-0.5">{f.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 flex items-center gap-2 text-[0.76rem] text-mist">
        <Command size={12} /> <span>K searches every record and screen.</span>
      </p>

      <div className="mt-6 pt-5 border-t border-rule flex flex-col gap-2">
        <Link
          href={`/?product=${product.id}#products`}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gold text-night text-[0.85rem] font-semibold hover:bg-gold-bright transition-colors"
        >
          Price this app <ArrowRight size={15} />
        </Link>
        <Link href="/#assessment" className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-[0.85rem] text-ink-soft ring-1 ring-rule hover:ring-mist transition-shadow">
          Scope a custom build
        </Link>
      </div>
    </>
  );

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-night">
      {/* Demo bar */}
      <header className="h-12 shrink-0 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 border-b border-rule bg-paper">
        <Link href="/" className="flex items-center gap-2 shrink-0 rounded-md" aria-label="Zion Systems home">
          <Image src="/logo.png" alt="" width={24} height={24} priority className="w-6 h-6 object-contain" />
          <span className="hidden sm:inline font-brand text-[1.05rem] font-bold leading-none text-ink">Zion</span>
        </Link>
        <span className="w-px h-5 bg-rule shrink-0" aria-hidden />
        <span className="flex shrink-0 scale-[0.85]" style={brandStyle(show.accent)} aria-hidden>
          {BRANDS[product.id].mark}
        </span>
        <h1 className="min-w-0 truncate text-[0.88rem] font-semibold text-ink">
          {product.name}
          <span className="hidden md:inline font-normal text-mist"> · live demo with sample data</span>
        </h1>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <BarButton label={show.mobile} pressed={phone} onClick={() => setPhone((p) => !p)} icon={<Smartphone size={15} />} />
          <BarButton label="Reset" onClick={reset} icon={<RotateCcw size={14} />} />
          <BarButton label="Guide" pressed={guide} onClick={() => setGuide((g) => !g)} icon={<ListChecks size={15} />} className="hidden xl:inline-flex" />
          <BarButton label="Guide" pressed={sheet} onClick={() => setSheet((s) => !s)} icon={<ListChecks size={15} />} className="xl:hidden" />
          <Link
            href={`/?product=${product.id}#products`}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 ml-1.5 px-3 rounded-lg bg-gold text-night text-[0.8rem] font-semibold hover:bg-gold-bright transition-colors"
          >
            Price this app
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <div ref={frameRef} className="relative flex-1 min-w-0" onPointerDown={(e) => e.isTrusted && setRing(null)}>
          <ProtoDriveProvider value={drive}>
            <div key={resetKey} className="h-full">
              {children}
            </div>
          </ProtoDriveProvider>

          <AnimatePresence>
            {phone && (
              <motion.button
                type="button"
                aria-label={`Close ${show.mobile}`}
                onClick={() => setPhone(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-[#101828]/45 cursor-pointer"
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {phone && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="pointer-events-auto scale-[0.88] sm:scale-100 origin-center"
                >
                  <ProductPhone id={product.id} accent={show.accent} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {ring && (
              <motion.div
                key={ring.key}
                aria-hidden
                className="absolute left-0 top-0 z-30 pointer-events-none rounded-[10px]"
                style={{ x: ring.x, y: ring.y, width: ring.w, height: ring.h, boxShadow: `0 0 0 2px ${show.accent}, 0 0 0 8px ${show.accent}30` }}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
              />
            )}
          </AnimatePresence>
        </div>

        {guide && (
          <aside aria-label="Demo guide" className="hidden xl:block w-[20rem] shrink-0 overflow-y-auto border-l border-rule bg-paper px-5 py-5">
            {guideBody}
          </aside>
        )}
      </div>

      {/* Guide as a bottom sheet on small screens */}
      <AnimatePresence>
        {sheet && (
          <motion.div className="xl:hidden fixed inset-0 z-50 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Demo guide"
              className="absolute inset-x-0 bottom-0 sm:left-auto sm:top-0 sm:w-[22rem] max-h-[82dvh] sm:max-h-none overflow-y-auto rounded-t-2xl sm:rounded-none bg-paper border-t sm:border-t-0 sm:border-l border-rule px-5 pt-3 pb-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: reduce ? 0 : 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[0.95rem] font-semibold text-ink">Guide</span>
                <button type="button" onClick={() => setSheet(false)} aria-label="Close guide" className="w-9 h-9 -mr-2 rounded-lg flex items-center justify-center text-graphite hover:text-ink cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              {guideBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BarButton({ label, icon, onClick, pressed, className }: { label: string; icon: React.ReactNode; onClick: () => void; pressed?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-2 md:px-2.5 rounded-lg text-[0.8rem] transition-colors cursor-pointer",
        pressed ? "bg-raised text-ink" : "text-graphite hover:text-ink hover:bg-sheet",
        className,
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
