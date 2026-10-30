"use client";

import React, { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Lock, Pause, Play, Smartphone } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { ProtoDriveProvider, type ProtoDrive, type StackEntry } from "@/components/products/ProtoKit";
import { SHOWCASE } from "@/components/products/showcase";
import { Button } from "@/components/ui/Button";
import { CountUp, RevealHeading } from "@/components/ui/motion";
import { money, weeksLabel } from "@/lib/assessment/format";
import { PRODUCTS, PRODUCT_GROUPS, productEstimate, productQuote, type Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

function PrototypeLoading() {
  return <div className="h-[660px] bg-[#F6F7F9] flex items-center justify-center text-[0.85rem] text-[#667085]">Loading demo…</div>;
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

const STEP_SECONDS = 6;
const EASE = [0.16, 1, 0.3, 1] as const;
const firstStack = (id: Product["id"]) => SHOWCASE[id].tour.find((t) => t.stack)!.stack!;

export function Products() {
  const { sendQuote } = useAssessment();
  const reduce = useReducedMotion();
  const [productId, setProductId] = useState<Product["id"]>(PRODUCTS[0].id);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [phoneOverride, setPhoneOverride] = useState<boolean | null>(null);
  const [target, setTarget] = useState(() => ({ key: 1, stack: firstStack(PRODUCTS[0].id) }));
  const [path, setPath] = useState("/");
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.35 });

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const show = SHOWCASE[product.id];
  const current = show.tour[step];
  const running = playing && inView && !reduce;
  const phoneOpen = phoneOverride ?? Boolean(current.phone);
  const selected = modules[product.id];
  const tierId = tiers[product.id] ?? product.tiers.options[0].id;
  const estimate = productEstimate(product, selected, tierId);
  const Prototype = PROTOTYPES[product.id];
  const Mark = show.icon;

  const drive = useMemo<ProtoDrive>(() => ({ target, brand: { accent: show.accent, icon: show.icon }, framed: true, onPath: setPath }), [target, show]);

  const push = (stack?: StackEntry[]) => stack && setTarget((t) => ({ key: t.key + 1, stack }));

  const goTo = (i: number, keepPlaying = false) => {
    setStep(i);
    setPhoneOverride(null);
    push(show.tour[i].stack);
    if (!keepPlaying) setPlaying(false);
  };

  const pickProduct = (id: Product["id"]) => {
    if (id === productId) return;
    setProductId(id);
    setStep(0);
    setPhoneOverride(null);
    setPlaying(true);
    setPath("/");
    push(firstStack(id));
  };

  const toggle = (id: string) =>
    setModules((all) => ({
      ...all,
      [product.id]: all[product.id].includes(id) ? all[product.id].filter((m) => m !== id) : [...all[product.id], id],
    }));

  return (
    <section id="products" className="py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
          <RevealHeading text="Products" className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
          <p className="text-[1rem] text-graphite">Live demos with sample data. Click anything.</p>
        </div>

        {/* Product switcher */}
        <div role="tablist" aria-label="Products" className="flex gap-6 overflow-x-auto -mx-5 px-5 scroll-px-5 md:mx-0 md:px-0 md:scroll-px-0 pb-1 mb-10 snap-x">
          {PRODUCT_GROUPS.map((group) => (
            <div key={group.id} className="shrink-0">
              <div className="annot text-mist mb-2">{group.label}</div>
              <div className="flex gap-1.5">
                {PRODUCTS.filter((p) => p.group === group.id).map((p) => {
                  const on = p.id === productId;
                  const Icon = SHOWCASE[p.id].icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="product-stage"
                      onClick={() => pickProduct(p.id)}
                      className={cn(
                        "group relative snap-start flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-xl border text-left transition-colors cursor-pointer",
                        on ? "border-gold" : "border-rule hover:border-graphite",
                      )}
                    >
                      {on && <motion.span layoutId="product-pick" className="absolute inset-0 rounded-xl bg-gold-wash" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <span className={cn("relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors", on ? "bg-gold text-paper" : "bg-raised text-gold-bright group-hover:bg-rule")}>
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <span className={cn("relative text-[0.88rem] whitespace-nowrap", on ? "font-semibold text-ink" : "font-medium text-ink-soft")}>{p.name}</span>
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
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)] gap-8 lg:gap-10 items-start"
          >
            {/* Name, problem, and the guided tour */}
            <div className="lg:pt-1">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-gold text-paper flex items-center justify-center shrink-0">
                  <Mark size={22} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="font-display text-[1.9rem] leading-none font-semibold text-ink">{product.name}</h3>
                  <p className="mt-1 text-[0.8rem] text-graphite">{product.platforms}</p>
                </div>
              </div>
              <p className="mt-4 text-[0.95rem] text-ink-soft">{product.hook}</p>

              <div className="mt-7 flex items-center justify-between">
                <span className="annot text-graphite">Guided tour</span>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="flex items-center gap-1.5 text-[0.8rem] font-medium text-gold-bright hover:text-ink transition-colors cursor-pointer"
                >
                  {running ? <Pause size={13} /> : <Play size={13} />}
                  {running ? "Pause" : "Play"}
                </button>
              </div>
              <ol className="mt-2 border-t border-rule">
                {show.tour.map((t, i) => {
                  const on = i === step;
                  return (
                    <li key={t.title}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={on ? "step" : undefined}
                        className="relative w-full flex gap-3 py-3 border-b border-rule text-left cursor-pointer group"
                      >
                        <span className={cn("font-mono text-[0.72rem] w-4 pt-[3px] shrink-0 transition-colors", on ? "text-gold-bright" : "text-mist")}>{i + 1}</span>
                        <span className="flex-1 min-w-0">
                          <span className={cn("flex items-center gap-1.5 text-[0.92rem] transition-colors", on ? "text-ink font-semibold" : "text-ink-soft group-hover:text-ink")}>
                            {t.title}
                            {t.phone && <Smartphone size={13} className="text-mist" aria-label="Mobile app" />}
                          </span>
                          <AnimatePresence initial={false}>
                            {on && (
                              <motion.span
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: EASE }}
                                className="block overflow-hidden"
                              >
                                <span className="block pt-1 text-[0.82rem] leading-snug text-graphite">{t.detail}</span>
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                        {on && running && (
                          <motion.span
                            key={`${target.key}-${step}`}
                            className="absolute left-0 -bottom-px h-[2px] bg-gold"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: STEP_SECONDS, ease: "linear" }}
                            onAnimationComplete={() => goTo((step + 1) % show.tour.length, true)}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-[0.8rem] leading-relaxed text-graphite">
                <span className="text-mist">Works with </span>
                {product.integrations.join(", ")}
              </p>
            </div>

            {/* The product, in a browser, with its mobile app alongside */}
            <div ref={stageRef} className="relative" onPointerDown={() => setPlaying(false)}>
              <div className="rounded-2xl overflow-hidden border border-[#3A4B5C] bg-[#E9ECF1] shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]">
                <div className="h-10 px-3 flex items-center gap-3 bg-[#E4E7EC] border-b border-[#D0D5DD]">
                  <span className="flex gap-1.5 shrink-0" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C4CAD3]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C4CAD3]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C4CAD3]" />
                  </span>
                  <div className="flex-1 min-w-0 flex justify-center">
                    <div className="flex items-center justify-center gap-1.5 h-6 px-3 w-full max-w-[26rem] rounded-md bg-white text-[0.72rem] text-[#344054]">
                      <Lock size={10} className="shrink-0 text-[#667085]" />
                      <span className="truncate">
                        {show.host}
                        <span className="text-[#98A2B3]">{path}</span>
                      </span>
                    </div>
                  </div>
                  {show.mobile && (
                    <button
                      type="button"
                      aria-pressed={phoneOpen}
                      onClick={() => setPhoneOverride(!phoneOpen)}
                      className={cn(
                        "shrink-0 flex items-center gap-1.5 h-6 px-2 rounded-md text-[0.72rem] font-medium transition-colors cursor-pointer",
                        phoneOpen ? "bg-[#101828] text-white" : "text-[#344054] hover:bg-white",
                      )}
                    >
                      <Smartphone size={12} />
                      <span className="hidden sm:inline">{show.mobile}</span>
                    </button>
                  )}
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
                        onClick={() => setPhoneOverride(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#101828]/35 cursor-pointer"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {phoneOpen && (
                  <div className="absolute inset-x-0 -bottom-7 flex justify-center sm:justify-end sm:pr-8 lg:-mr-6 pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, y: 60, rotate: 4 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      exit={{ opacity: 0, y: 40, rotate: 2 }}
                      transition={{ type: "spring", stiffness: 260, damping: 26 }}
                      className="pointer-events-auto"
                    >
                      <ProductPhone id={product.id} accent={show.accent} />
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pricing */}
        <div className="mt-16 rounded-[16px] border border-rule bg-sheet p-5 md:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-7 lg:gap-12 items-end">
            <div>
              <div className="annot text-graphite">{product.tiers.label}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.tiers.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={o.id === tierId}
                    onClick={() => setTiers((s) => ({ ...s, [product.id]: o.id }))}
                    className={cn(
                      "relative px-3 py-1.5 rounded-lg border text-[0.82rem] transition-colors cursor-pointer",
                      o.id === tierId ? "border-gold text-paper font-semibold" : "border-rule text-ink-soft hover:border-graphite",
                    )}
                  >
                    {o.id === tierId && <motion.span layoutId={`tier-${product.id}`} className="absolute inset-0 rounded-lg bg-gold" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
                    <span className="relative">{o.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 annot text-graphite">Modules</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[0.82rem] transition-colors",
                        m.included ? "border-rule text-graphite cursor-default" : on ? "border-gold bg-gold-wash text-ink cursor-pointer" : "border-rule text-ink-soft hover:border-graphite cursor-pointer",
                      )}
                    >
                      {m.included ? <Lock size={12} /> : on ? <Check size={13} strokeWidth={2.6} className="text-gold-bright" /> : <span className="w-[13px]" />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-x-9 gap-y-5" aria-live="polite">
              <div>
                <div className="text-[0.75rem] text-mist">Setup, one-time</div>
                <div className="mt-1 font-display text-[2.2rem] leading-none font-semibold text-ink">
                  <CountUp value={estimate.setupTotal} format={money} />
                </div>
              </div>
              <div>
                <div className="text-[0.75rem] text-mist">{product.id === "hubspot" ? "Support" : "Subscription"}</div>
                <div className="mt-1 font-display text-[2.2rem] leading-none font-semibold text-ink">
                  {estimate.monthlyTotal ? (
                    <>
                      <CountUp value={estimate.monthlyTotal} format={money} />
                      <span className="text-[0.9rem] font-body font-normal text-graphite">/mo</span>
                    </>
                  ) : (
                    <span className="text-[1.1rem] font-body font-medium text-graphite">None</span>
                  )}
                </div>
              </div>
              <div>
                <Button onClick={() => sendQuote(productQuote(product, selected, tierId))}>
                  Request a quote <ArrowRight size={16} />
                </Button>
                <div className="mt-1.5 text-[0.75rem] text-mist">Live in about {weeksLabel(estimate.weeks)}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[0.8rem]">
            <span className="font-medium text-gold-bright">45% less than typical commercial software</span>
            {product.note && <span className="text-mist">{product.note}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
