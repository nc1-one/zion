"use client";

import { RevealHeading } from "@/components/ui/motion";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Heart, Lightbulb, Target } from "lucide-react";

const VALUES = [
  {
    title: "Excellence for the Kingdom",
    desc: "Work built for a higher purpose deserves careful craft: tested, documented, and easy for your team to run.",
    icon: Target,
  },
  {
    title: "Radical Transparency",
    desc: "You see the plan, the weekly progress, and the pricing. Estimates show hours and our $8 hourly rate.",
    icon: Lightbulb,
  },
  {
    title: "Mission Alignment",
    desc: "We judge a project by what your organization can do afterwards, not by how much we shipped.",
    icon: Heart,
  },
  {
    title: "Production Integrity",
    desc: "Every release passes the same quality gates in the Zion Production Line before it reaches your people.",
    icon: CheckCircle2,
  },
];

export function About() {
  return (
    <section id="about" className="py-20 md:py-28 px-5 md:px-10 border-t border-rule">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-12 lg:gap-16 items-start">
        <div className="lg:sticky lg:top-[calc(var(--nav-height)+2.5rem)]">
          <RevealHeading text="What we hold to." className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
          <p className="mt-5 text-[1rem] leading-[1.7] text-graphite max-w-[32rem]">
            Zion Systems &amp; Build is based in Manila and built on a simple belief: churches, ministries, nonprofits, and faith-driven
            businesses deserve the same quality of technology as anyone else. We stay with you after launch, as a partner in
            your mission.
          </p>
          <figure className="mt-8 p-6 bg-sheet border border-rule rounded-[10px] max-w-[32rem]">
            <blockquote className="font-display text-[1.25rem] italic leading-[1.5] text-ink">
              &ldquo;Our goal is to remove the technical barriers that hinder Kingdom-focused organizations from reaching their full
              potential. We build the frameworks so you can focus on the fruit.&rdquo;
            </blockquote>
            <figcaption className="annot text-gold-deep mt-4">Founding vision, Zion Systems</figcaption>
          </figure>
        </div>

        <div>
          <h3 className="font-display text-[1.6rem] font-semibold text-ink">Our core values</h3>
          <p className="mt-1 text-[0.92rem] text-graphite">Four commitments we make on every project.</p>
          <ul className="mt-6 border-t border-rule">
            {VALUES.map((value, idx) => (
              <motion.li
                key={value.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: idx * 0.07 }}
                className="flex gap-5 py-6 border-b border-rule"
              >
                <value.icon size={20} strokeWidth={1.6} className="text-gold-deep shrink-0 mt-1" />
                <div>
                  <h4 className="text-[1rem] font-semibold text-ink">{value.title}</h4>
                  <p className="mt-1 text-[0.9rem] leading-[1.65] text-graphite">{value.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
