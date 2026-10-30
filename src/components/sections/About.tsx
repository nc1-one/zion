"use client";

import React from "react";
import { motion } from "framer-motion";
import { RevealHeading } from "@/components/ui/motion";

const FACTS = [
  { label: "Based in", value: "Manila, Philippines" },
  { label: "One team", value: "Software, IT, and marketing" },
  { label: "After launch", value: "We stay and support it" },
  { label: "We serve", value: "Churches, ministries, nonprofits, schools, faith-driven businesses" },
];

export function About() {
  return (
    <section id="about" className="py-24 md:py-32 px-5 md:px-10">
      <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-14 lg:gap-20 items-start">
        <div>
          <RevealHeading text="Built in Manila. Built for the Kingdom." className="heading-section text-ink" />
          <dl className="mt-10 border-t border-rule max-w-[30rem]">
            {FACTS.map((fact) => (
              <div key={fact.label} className="grid grid-cols-[7rem_1fr] gap-4 py-3.5 border-b border-rule text-[0.95rem]">
                <dt className="text-mist">{fact.label}</dt>
                <dd className="text-ink-soft">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:pt-2"
        >
          <blockquote className="font-display text-[clamp(1.6rem,2.8vw,2.35rem)] leading-[1.22] font-medium tracking-[-0.025em] text-ink">
            <span className="text-gold" aria-hidden>
              &ldquo;
            </span>
            Our goal is to remove the technical barriers that hinder Kingdom-focused organizations from reaching their full potential. We build the frameworks
            so you can focus on the fruit.
            <span className="text-gold" aria-hidden>
              &rdquo;
            </span>
          </blockquote>
          <figcaption className="mt-6 text-[0.9rem] text-graphite">Founding vision, Zion Systems &amp; Build</figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
