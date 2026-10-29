"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Lock } from "lucide-react";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { BibleStudyPrototype, ChurchOSPrototype, ErpPrototype, HubSpotPrototype } from "@/components/products/Prototypes";
import { Button } from "@/components/ui/Button";
import { CountUp, Reveal, RevealHeading, TraceRule } from "@/components/ui/motion";
import { HOURLY_RATE } from "@/lib/assessment/pricing";
import { money, weeksLabel } from "@/lib/assessment/format";
import { PRODUCTS, productEstimate, productQuote, type Product } from "@/lib/quotes";
import { cn } from "@/lib/utils";

const PROTOTYPES: Record<Product["id"], React.ComponentType> = {
  "church-os": ChurchOSPrototype,
  "bible-study": BibleStudyPrototype,
  hubspot: HubSpotPrototype,
  erp: ErpPrototype,
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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-16 mb-10">
          <RevealHeading
            text="Zion digital products, ready to tailor."
            className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink"
          />
          <p className="text-[1rem] leading-[1.7] text-graphite lg:pt-3 max-w-[36rem]">
            Systems we&apos;ve already designed for churches, ministries, and businesses. Click through a prototype, choose the
            modules you need, and get an initial quote at {money(HOURLY_RATE)} an hour.
          </p>
        </div>

        <div role="tablist" aria-label="Zion digital products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
          {PRODUCTS.map((p) => {
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
                  "text-left p-4 rounded-xl border transition-[border-color,background-color,transform] duration-200 cursor-pointer hover:-translate-y-0.5",
                  on ? "border-gold bg-gold-wash" : "border-rule bg-sheet hover:border-graphite",
                )}
              >
                <div className={cn("text-[0.95rem] font-semibold leading-snug", on ? "text-gold-bright" : "text-ink")}>{p.name}</div>
                <div className="mt-1 text-[0.8rem] leading-[1.45] text-graphite">{p.short}</div>
              </button>
            );
          })}
        </div>

        <div id="product-panel" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] gap-6 items-start">
          <div className="lg:sticky lg:top-[calc(var(--nav-height)+2rem)]">
            <Reveal key={product.id}>
              <Prototype />
            </Reveal>
          </div>

          <div className="bg-sheet border border-rule rounded-[14px] p-6">
            <h3 className="font-display text-[1.6rem] leading-[1.12] font-semibold text-ink">{product.name}</h3>
            <p className="mt-2 text-[0.9rem] leading-[1.6] text-ink-soft">{product.pitch}</p>
            <p className="mt-2 text-[0.8rem] text-graphite">For {product.forWho}.</p>

            <div className="mt-5 annot text-mist">Modules</div>
            <ul className="mt-2 flex flex-col gap-1.5">
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
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-[0.83rem] transition-colors",
                        m.included ? "border-rule-soft text-ink-soft cursor-default" : "cursor-pointer",
                        !m.included && (on ? "border-gold bg-gold-wash text-ink" : "border-rule text-ink-soft hover:border-graphite"),
                      )}
                    >
                      <span
                        className={cn(
                          "w-[17px] h-[17px] rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0",
                          on ? "bg-gold border-gold text-paper" : "border-mist",
                        )}
                        aria-hidden
                      >
                        {m.included ? <Lock size={10} strokeWidth={3} /> : on && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="flex-1">{m.label}</span>
                      <span className="font-mono text-[0.65rem] text-mist">{m.included ? "Included" : `${Math.round(m.hours * estimate.scale.factor)} h`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 annot text-mist">{product.scale.label}</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {product.scale.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={o.id === scaleId}
                  onClick={() => setScales((s) => ({ ...s, [product.id]: o.id }))}
                  className={cn(
                    "px-2.5 py-2 rounded-lg border text-[0.8rem] transition-colors cursor-pointer",
                    o.id === scaleId ? "border-gold bg-gold-wash text-gold-bright" : "border-rule text-ink-soft hover:border-graphite",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-rule" aria-live="polite">
              <div className="annot text-mist">Initial quote</div>
              <div className="mt-1 font-display text-[2.4rem] leading-none font-semibold text-ink">
                <CountUp value={estimate.totalCost} format={money} />
              </div>
              <div className="mt-2 font-mono text-[0.7rem] text-graphite">
                {estimate.totalHours} hours × {money(HOURLY_RATE)}/hour · about {weeksLabel(estimate.weeks)}
              </div>
            </div>

            <Button className="mt-5 w-full justify-center" onClick={() => sendQuote(productQuote(product, selected, scaleId))}>
              Request this quote <ArrowRight size={16} />
            </Button>
            {product.note && <p className="mt-3 text-[0.75rem] leading-[1.5] text-mist">{product.note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
