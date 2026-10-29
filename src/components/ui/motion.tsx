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

// Thin gold reading-progress line under the navigation bar.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      className="absolute left-0 right-0 -bottom-px h-[2px] bg-gold origin-left print:hidden"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
