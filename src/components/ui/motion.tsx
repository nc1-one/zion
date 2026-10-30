"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

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

// Section headings fade up once as they scroll into view.
export function RevealHeading({ text, className, as = "h2" }: { text: string; className?: string; as?: "h1" | "h2" }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </Tag>
  );
}

// Thin gold reading-progress line under the navigation bar.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      className="absolute left-0 right-0 -bottom-px h-px bg-gold/70 origin-left print:hidden"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
