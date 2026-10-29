"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { Button } from "@/components/ui/Button";
import { CountUp, RevealHeading } from "@/components/ui/motion";
import { money, weeksLabel } from "@/lib/assessment/format";
import { EVERY_PRODUCT, PRODUCTS, PRODUCT_GROUPS, productEstimate, productQuote, type Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

function PrototypeLoading() {
  return (
    <div className="h-[660px] rounded-xl bg-[#F6F7F9] flex items-center justify-center text-[0.85rem] text-[#6B7280]">
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
  const [tiers, setTiers] = useState<Record<string, string>>({});

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const selected = modules[product.id];
  const tierId = tiers[product.id] ?? product.tiers.options[0].id;
  const estimate = productEstimate(product, selected, tierId);
  const Prototype = PROTOTYPES[product.id];

  const toggle = (id: string) =>
    setModules((all) => ({
      ...all,
      [product.id]: all[product.id].includes(id) ? all[product.id].filter((m) => m !== id) : [...all[product.id], id],
    }));

  return (
    <section id="products" className="py-20 md:py-28 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <RevealHeading text="Digital products" className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
          <p className="text-[1rem] text-graphite">Pick your problem. Try the product.</p>
        </div>

        {/* Problem-first picker */}
        <div className="flex flex-col gap-6 mb-10" role="tablist" aria-label="Digital products">
          {PRODUCT_GROUPS.map((group) => (
            <div key={group.id}>
              <div className="annot text-mist mb-2.5">{group.label}</div>
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-5 px-5 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {PRODUCTS.filter((p) => p.group === group.id).map((p, i) => {
                  const on = p.id === productId;
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      aria-controls="product-panel"
                      onClick={() => setProductId(p.id)}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                    </motion.button>
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Name and before/after */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-6 lg:gap-12 items-start mb-8">
                <div>
                  <h3 className="font-display text-[clamp(1.9rem,3vw,2.5rem)] leading-[1.08] font-semibold text-ink">{product.name}</h3>
                  <p className="mt-2 text-[0.85rem] text-graphite">{product.platforms}</p>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 text-[0.9rem]">
                  <span className="annot text-mist pb-2">Today</span>
                  <span />
                  <span className="annot text-gold-bright pb-2">With {product.name}</span>
                  {product.pains.map((row, i) => (
                    <React.Fragment key={row.pain}>
                      <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="py-2.5 border-t border-rule text-graphite">
                        {row.pain}
                      </motion.span>
                      <ArrowRight size={14} className="mt-3 text-gold" aria-hidden />
                      <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 + i * 0.07 }} className="py-2.5 border-t border-rule text-ink font-medium">
                        {row.fix}
                      </motion.span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* The product itself, framed in light so it reads as a real app */}
              <motion.div
                className="rounded-2xl p-2 sm:p-3 bg-[#E9ECF1] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]"
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <Prototype />
              </motion.div>

              {/* Features and pricing */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-6 items-start">
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {product.features.map((f) => (
                      <div key={f.title}>
                        <div className="text-[0.9rem] font-semibold text-ink">{f.title}</div>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {f.items.map((item) => (
                            <li key={item} className="text-[0.85rem] text-ink-soft">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <dl className="mt-8 pt-5 border-t border-rule grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-[0.85rem]">
                    <dt className="text-mist">Connects with</dt>
                    <dd className="text-ink-soft">{product.integrations.join(" · ")}</dd>
                    <dt className="text-mist">Always included</dt>
                    <dd className="text-ink-soft">{EVERY_PRODUCT.join(" · ")}</dd>
                  </dl>
                </div>

                <div className="bg-sheet border border-rule rounded-[14px] p-6">
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
                  <ul className="mt-2 flex flex-col">
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
                              "w-full flex items-center gap-2.5 py-2 text-left text-[0.86rem] border-b border-rule-soft last:border-0 transition-colors",
                              m.included ? "text-ink-soft cursor-default" : "cursor-pointer text-ink hover:text-gold-bright",
                            )}
                          >
                            <span
                              className={cn("w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-colors", on ? "bg-gold border-gold text-paper" : "border-mist")}
                              aria-hidden
                            >
                              {m.included ? <Lock size={10} strokeWidth={3} /> : on && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="flex-1">{m.label}</span>
                            {m.included && <span className="text-[0.75rem] text-mist">Included</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-5 pt-5 border-t border-rule grid grid-cols-2 gap-4" aria-live="polite">
                    <div>
                      <div className="text-[0.75rem] text-mist">Setup, one-time</div>
                      <div className="font-display text-[2rem] leading-none font-semibold text-ink mt-1">
                        <CountUp value={estimate.setupTotal} format={money} />
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.75rem] text-mist">{product.id === "hubspot" ? "Support" : "Subscription"}</div>
                      <div className="font-display text-[2rem] leading-none font-semibold text-ink mt-1">
                        {estimate.monthlyTotal ? (
                          <>
                            <CountUp value={estimate.monthlyTotal} format={money} />
                            <span className="text-[0.85rem] font-body font-normal text-graphite">/mo</span>
                          </>
                        ) : (
                          <span className="text-[1.1rem] font-body font-medium text-graphite">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.8rem] text-graphite">Live in about {weeksLabel(estimate.weeks)}.</p>
                  <Button className="mt-5 w-full justify-center" onClick={() => sendQuote(productQuote(product, selected, tierId))}>
                    Request a quote <ArrowRight size={16} />
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
