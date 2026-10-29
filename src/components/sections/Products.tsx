"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { Button } from "@/components/ui/Button";
import { CountUp, RevealHeading, TraceRule } from "@/components/ui/motion";
import { HOURLY_RATE } from "@/lib/assessment/pricing";
import { money, weeksLabel } from "@/lib/assessment/format";
import { PRODUCTS, PRODUCT_GROUPS, productEstimate, productQuote, type Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

function PrototypeLoading() {
  return (
    <div className="h-[640px] rounded-[14px] border border-rule bg-night flex items-center justify-center text-[0.85rem] text-graphite">
      Loading prototype…
    </div>
  );
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

// Start each product with its first two optional modules selected.
const DEFAULT_MODULES = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p.modules.filter((m) => !m.included).slice(0, 2).map((m) => m.id)]),
) as Record<Product["id"], string[]>;

export function Products() {
  const { sendQuote } = useAssessment();
  const [productId, setProductId] = useState<Product["id"]>(PRODUCTS[0].id);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const [scales, setScales] = useState<Record<string, string>>({});

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const selected = modules[product.id];
  const scaleId = scales[product.id] ?? product.scale.options[0].id;
  const estimate = productEstimate(product, selected, scaleId);
  const Prototype = PROTOTYPES[product.id];

  const toggle = (id: string) =>
    setModules((all) => ({
      ...all,
      [product.id]: all[product.id].includes(id) ? all[product.id].filter((m) => m !== id) : [...all[product.id], id],
    }));

  return (
    <section id="products" className="py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <TraceRule className="mb-14 md:mb-16" />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <RevealHeading text="Digital products" className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
          <p className="text-[1rem] text-graphite max-w-[26rem]">Pick the problem that sounds like yours. Try the product, then get a quote.</p>
        </div>

        {/* Problem-first picker */}
        <div className="flex flex-col gap-6 mb-8" role="tablist" aria-label="Digital products">
          {PRODUCT_GROUPS.map((group) => (
            <div key={group.id}>
              <div className="annot text-mist mb-2.5">{group.label}</div>
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {PRODUCTS.filter((p) => p.group === group.id).map((p) => {
                  const on = p.id === productId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="product-panel"
                      onClick={() => setProductId(p.id)}
                      className={cn(
                        "group relative shrink-0 w-[78%] sm:w-auto snap-start text-left p-4 rounded-xl border transition-[border-color,transform] duration-200 cursor-pointer hover:-translate-y-0.5",
                        on ? "border-gold" : "border-rule bg-sheet hover:border-graphite",
                      )}
                    >
                      {on && <motion.span layoutId="product-pick" className="absolute inset-0 rounded-xl bg-gold-wash" transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                      <span className="relative block text-[0.95rem] leading-snug font-semibold text-ink">{p.hook}</span>
                      <span className={cn("relative mt-2 flex items-center gap-1.5 text-[0.8rem] font-medium", on ? "text-gold-bright" : "text-graphite group-hover:text-gold-bright")}>
                        {p.name} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div id="product-panel" role="tabpanel">
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Problem → fix */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6 lg:gap-12 items-start mb-6">
                <h3 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-[1.1] font-semibold text-ink">{product.name}</h3>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 text-[0.88rem]">
                  <span className="annot text-mist pb-2">Today</span>
                  <span />
                  <span className="annot text-gold-bright pb-2">With {product.name}</span>
                  {product.pains.map((row) => (
                    <React.Fragment key={row.pain}>
                      <span className="py-2.5 border-t border-rule text-graphite">{row.pain}</span>
                      <ArrowRight size={14} className="mt-3 text-gold" aria-hidden />
                      <span className="py-2.5 border-t border-rule text-ink font-medium">{row.fix}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <Prototype />

              {/* Quote */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] bg-sheet border border-rule rounded-[14px] overflow-hidden">
                <div className="p-6">
                  <div className="annot text-graphite">Choose modules</div>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {product.modules.map((m) => {
                      const on = m.included || selected.includes(m.id);
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            disabled={m.included}
                            aria-pressed={on}
                            onClick={() => toggle(m.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-[0.85rem] transition-colors",
                              m.included ? "border-rule-soft text-ink-soft cursor-default" : "cursor-pointer",
                              !m.included && (on ? "border-gold bg-gold-wash text-ink" : "border-rule text-ink-soft hover:border-graphite"),
                            )}
                          >
                            <span
                              className={cn("w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0", on ? "bg-gold border-gold text-paper" : "border-mist")}
                              aria-hidden
                            >
                              {m.included ? <Lock size={10} strokeWidth={3} /> : on && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="flex-1">{m.label}</span>
                            <span className="font-mono text-[0.68rem] text-mist">{m.included ? "Included" : `${Math.round(m.hours * estimate.scale.factor)} h`}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-5 annot text-graphite">{product.scale.label}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.scale.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={o.id === scaleId}
                        onClick={() => setScales((s) => ({ ...s, [product.id]: o.id }))}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-[0.82rem] transition-colors cursor-pointer",
                          o.id === scaleId ? "border-gold bg-gold-wash text-gold-bright" : "border-rule text-ink-soft hover:border-graphite",
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t lg:border-t-0 lg:border-l border-rule flex flex-col bg-raised/40" aria-live="polite">
                  <div className="annot text-graphite">Initial quote</div>
                  <div className="mt-1 font-display text-[2.6rem] leading-none font-semibold text-ink">
                    <CountUp value={estimate.totalCost} format={money} />
                  </div>
                  <div className="mt-2 font-mono text-[0.72rem] text-graphite">
                    {estimate.totalHours} h × {money(HOURLY_RATE)}/h · about {weeksLabel(estimate.weeks)}
                  </div>
                  <Button className="mt-6 w-full justify-center" onClick={() => sendQuote(productQuote(product, selected, scaleId))}>
                    Request this quote <ArrowRight size={16} />
                  </Button>
                  {product.note && <p className="mt-3 text-[0.75rem] leading-[1.5] text-mist">{product.note}</p>}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
