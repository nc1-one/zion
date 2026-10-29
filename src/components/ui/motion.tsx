"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Numbers that count to their new value, used for costs and hours.
export function CountUp({ value, format = (n) => n.toLocaleString() }: { value: number; format?: (n: number) => string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(from.current, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) => setShown(Math.round(n)),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <>{format(reduce ? value : shown)}</>;
}

// Fades content up the first time it scrolls into view.
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

// Section headings rise in word by word.
export function RevealHeading({
  text,
  className,
  as = "h2",
  emphasis,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
  emphasis?: string;
}) {
  const Tag = motion[as];
  const words = text.split(" ");
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: 0.05 }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]" aria-hidden>
          <motion.span
            className={cn("inline-block", word === emphasis && "italic text-gold-bright")}
            variants={{ hidden: { y: "100%" }, shown: { y: 0 } }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

// A gold circuit trace, like the logo, that draws itself across a section edge.
export function TraceRule({ className }: { className?: string }) {
  return (
    <svg className={cn("block w-full h-6 overflow-visible", className)} viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden>
      <motion.path
        d="M0 12 H520 L536 4 H760 L776 12 H1200"
        fill="none"
        className="stroke-gold"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.4 }}
        whileInView={{ pathLength: 1, opacity: 0.55 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
      />
      {[520, 776].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={i === 0 ? 12 : 12}
          r="3.5"
          className="fill-gold"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.6 + i * 0.3, duration: 0.3 }}
        />
      ))}
    </svg>
  );
}

// Thin gold reading-progress line under the navigation bar.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      className="fixed left-0 right-0 top-[var(--nav-height)] h-[2px] bg-gold origin-left z-50 print:hidden"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
