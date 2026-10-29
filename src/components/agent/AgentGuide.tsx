"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AgentMascot, type AgentMood } from "./AgentMascot";
import { useAssessment, type Stage } from "@/components/assessment/AssessmentProvider";
import { cn } from "@/lib/utils";

const SECTIONS = ["assessment", "offerings", "products", "use-cases", "process", "work", "about", "contact"] as const;
type SectionId = (typeof SECTIONS)[number];

const STAGE_TIPS: Record<Stage, string> = {
  intro: "Hi, I'm the Zion Agent. Paste your website to start.",
  questions: "Number keys pick options. Enter continues.",
  drafting: "Drafting your scope.",
  done: "Your scope is ready. Send it when you're happy.",
};

const SECTION_TIPS: Record<Exclude<SectionId, "assessment">, { tip: string; withScope?: string }> = {
  offerings: {
    tip: "Pick a service to see what's included.",
    withScope: "Highlighted services are in your scope.",
  },
  products: { tip: "Pick a problem. The prototype is clickable." },
  "use-cases": { tip: "Press play to watch a project unfold." },
  process: { tip: "Select a phase to see what you get." },
  work: { tip: "Some of our past work." },
  about: { tip: "The values behind every build." },
  contact: {
    tip: "We reply within one business day.",
    withScope: "Your attachment is ready to send.",
  },
};

const TOUR = [
  { id: "assessment", label: "Scope my project" },
  { id: "offerings", label: "What Zion offers" },
  { id: "products", label: "Digital products" },
  { id: "use-cases", label: "Example projects" },
  { id: "process", label: "How we work" },
  { id: "work", label: "Our work" },
  { id: "contact", label: "Talk to the team" },
];

const MUTE_KEY = "zion-agent-tips-muted";
const SMALL_SCREEN = "(max-width: 639px)";
const noopSubscribe = () => () => {};
const subscribeSmall = (onChange: () => void) => {
  const query = window.matchMedia(SMALL_SCREEN);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

// Floating tour guide. Says one tip per section as the visitor scrolls, and
// opens a small menu to jump around the page.
export function AgentGuide() {
  const { stage, proposal, notice } = useAssessment();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  // On phones, tips would cover the content, so only messages about something
  // the visitor just did pop up; section tips stay in the menu.
  const isSmall = useSyncExternalStore(subscribeSmall, () => window.matchMedia(SMALL_SCREEN).matches, () => false);

  const [section, setSection] = useState<SectionId>("assessment");
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(() => {
    try {
      return typeof window !== "undefined" && window.sessionStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [hiddenTip, setHiddenTip] = useState<string | null>(null);
  const [seenNotice, setSeenNotice] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1200);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setSection(entry.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const sectionTip =
    section === "assessment"
      ? STAGE_TIPS[stage]
      : (proposal && SECTION_TIPS[section].withScope) || SECTION_TIPS[section].tip;
  const showingNotice = Boolean(notice && notice.id !== seenNotice);
  const message = showingNotice ? notice!.text : sectionTip;
  const bubbleVisible = mounted && ready && !muted && !menuOpen && (showingNotice || (!isSmall && message !== hiddenTip));

  const hideBubble = () => {
    if (showingNotice && notice) setSeenNotice(notice.id);
    else setHiddenTip(message);
  };

  // Each tip stays up for a few seconds, then tucks away.
  useEffect(() => {
    if (!bubbleVisible) return;
    const timer = window.setTimeout(hideBubble, showingNotice ? 9000 : 7000);
    return () => window.clearTimeout(timer);
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      window.sessionStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      // Storage can be unavailable (private mode); the choice still applies to this visit.
    }
  };

  const go = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (!mounted) return null;

  const mood: AgentMood = stage === "drafting" ? "thinking" : stage === "done" || showingNotice ? "happy" : "idle";

  return (
    <div ref={rootRef} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {bubbleVisible && (
          <motion.div
            key={message}
            role="status"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[min(19rem,calc(100vw-2rem))] bg-sheet border border-rule rounded-xl rounded-br-sm shadow-[0_16px_40px_-20px_rgba(0,0,0,0.7)] pl-4 pr-9 py-3"
          >
            <div className="annot text-trace mb-1">Zion Agent</div>
            <p className="text-[0.88rem] leading-[1.5] text-ink">{message}</p>
            <button
              type="button"
              onClick={hideBubble}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md text-graphite hover:text-ink hover:bg-rule-soft cursor-pointer"
              aria-label="Dismiss tip"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {menuOpen && (
          <motion.div
            key="menu"
            id="agent-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="w-[min(17rem,calc(100vw-2rem))] bg-sheet border border-rule rounded-xl shadow-[0_16px_40px_-20px_rgba(0,0,0,0.7)] p-2"
          >
            <p className="px-3 pt-2 pb-3 text-[0.85rem] leading-[1.5] text-ink border-b border-rule-soft">{sectionTip}</p>
            <div className="annot text-mist px-3 pt-3 pb-1.5">Take me to</div>
            <ul>
              {TOUR.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-[0.88rem] cursor-pointer transition-colors",
                      section === item.id ? "bg-gold-wash text-gold-bright font-medium" : "text-ink-soft hover:bg-rule-soft",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={toggleMute}
              className="mt-1 w-full text-left px-3 py-2 rounded-lg text-[0.8rem] text-graphite hover:bg-rule-soft cursor-pointer"
            >
              {muted ? "Show tips as I scroll" : "Stop showing tips"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="agent-menu"
        aria-label="Zion Agent guide"
        className="agent-bob w-14 h-14 rounded-full bg-sheet border border-rule shadow-[0_10px_30px_-12px_rgba(0,0,0,0.7)] flex items-center justify-center cursor-pointer hover:border-gold transition-colors"
      >
        <motion.span key={notice?.id ?? 0} initial={{ y: 0 }} animate={notice ? { y: [0, -9, 0, -4, 0] } : { y: 0 }} transition={{ duration: 0.7 }}>
          <AgentMascot size={40} mood={mood} />
        </motion.span>
      </button>
    </div>
  );
}
