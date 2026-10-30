"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { AgentMascot } from "./AgentMascot";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import type { AgentAction, AgentReply } from "@/lib/agent/types";
import { PRODUCTS } from "@/lib/quotes";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  done?: string[]; // what the agent did on the page, shown under its reply
}

const STORAGE_KEY = "zion-agent-chat";
const GREETING = "Hi, I'm the Zion Agent. I can recommend the right product, price a plan for your time zone, or set up a call with the team. What are you working on?";
const STARTERS = ["Which product fits our church?", "How much would a website cost?", "Do you work in my time zone?", "Talk to a person"];
const SECTION_NAMES: Record<string, string> = { assessment: "the assessment", why: "Why Zion", products: "Products", offerings: "Services", work: "Selected work", about: "About", contact: "the contact form" };

function load(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function save(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    // Storage can be unavailable (private mode); the chat still works.
  }
}

// Which section the visitor is looking at, so the agent has context.
function currentSection() {
  const mid = window.innerHeight / 2;
  for (const section of document.querySelectorAll<HTMLElement>("main > section[id]")) {
    const r = section.getBoundingClientRect();
    if (r.top <= mid && r.bottom >= mid) return section.id;
  }
  return undefined;
}

// The Zion Agent: Zion's sales and customer success agent, in a chat panel.
export function ZionAgent() {
  const { start, prefillContact, proposal } = useAssessment();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTERS);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore the conversation for this tab the first time the panel opens.
  const openPanel = () => {
    if (!loaded) {
      const saved = load();
      setMessages(saved);
      if (saved.length) setSuggestions([]);
      setLoaded(true);
    }
    setOpen(true);
  };

  useEffect(() => {
    const onOpen = () => openPanel();
    window.addEventListener("zion:open-agent", onOpen);
    return () => window.removeEventListener("zion:open-agent", onOpen);
  });

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  // Carry out what the agent asked the page to do, and describe it in the chat.
  const perform = (action: AgentAction): string | null => {
    const small = window.matchMedia("(max-width: 639px)").matches;
    let note: string | null = null;
    if (action.type === "show_product") {
      const product = PRODUCTS.find((p) => p.id === action.product);
      if (!product) return null;
      window.dispatchEvent(new CustomEvent("zion:show-product", { detail: product.id }));
      note = `Opened the ${product.name} demo`;
    } else if (action.type === "start_assessment") {
      if (action.website) start(action.website);
      document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" });
      if (!action.website) window.setTimeout(() => document.getElementById("site-url")?.focus({ preventScroll: true }), 600);
      note = action.website ? `Started your assessment for ${action.website}` : "Opened the assessment";
    } else if (action.type === "open_contact") {
      prefillContact({ fullName: action.fullName, email: action.email, organizationType: action.organizationType, referredBy: action.referredBy, message: action.message });
      note = "Filled in the contact form for you to review and send";
    } else if (action.type === "show_section") {
      document.getElementById(action.section)?.scrollIntoView({ behavior: "smooth" });
      note = `Showed ${SECTION_NAMES[action.section] ?? action.section}`;
    }
    if (note && small) setOpen(false);
    return note;
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSuggestions([]);
    setBusy(true);
    let reply: ChatMessage;
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content: c }) => ({ role, content: c })),
          context: { section: currentSection(), product: document.querySelector("#product-stage h3")?.textContent ?? undefined, hasScope: Boolean(proposal) },
        }),
      });
      const data = (await res.json()) as AgentReply & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "The agent is unavailable.");
      const done = data.actions.map(perform).filter((n): n is string => Boolean(n));
      reply = { role: "assistant", content: data.reply, done };
      setSuggestions(data.suggestions);
    } catch (error) {
      reply = { role: "assistant", content: error instanceof Error && error.message.includes("messages") ? error.message : "I couldn't reach the team's systems just now. You can email support@zionsystems.dev, or try again in a moment." };
      setSuggestions(["Talk to a person"]);
    }
    const all = [...next, reply];
    setMessages(all);
    save(all);
    setBusy(false);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={openPanel}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 h-11 pl-4 pr-5 rounded-full bg-sheet ring-1 ring-rule text-[0.88rem] font-medium text-ink shadow-[0_20px_40px_-16px_rgba(0,0,0,0.9)] hover:ring-gold/60 transition-[box-shadow] cursor-pointer print:hidden"
          >
            <AgentMascot />
            Ask Zion Agent
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Zion Agent chat"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[min(640px,calc(100vh-6rem))] flex flex-col bg-sheet sm:rounded-[20px] ring-1 ring-rule shadow-[0_40px_80px_-24px_rgba(0,0,0,0.95)] overflow-hidden origin-bottom-right print:hidden"
          >
            <div className="flex items-center gap-3 px-5 h-16 border-b border-rule shrink-0">
              <AgentMascot mood={busy ? "thinking" : "idle"} />
              <div className="flex-1 min-w-0 leading-tight">
                <div className="text-[0.95rem] font-semibold text-ink">Zion Agent</div>
                <div className="text-[0.75rem] text-mist">Sales and support · replies in seconds</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="w-9 h-9 -mr-2 rounded-lg flex items-center justify-center text-graphite hover:text-ink hover:bg-raised cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4" aria-live="polite">
              <AssistantBubble text={GREETING} />
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="self-end max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-gold text-night text-[0.9rem] leading-snug whitespace-pre-wrap">
                    {m.content}
                  </motion.div>
                ) : (
                  <AssistantBubble key={i} text={m.content} done={m.done} />
                ),
              )}
              {busy && (
                <div className="flex gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md bg-raised self-start" aria-label="Zion Agent is typing">
                  {[0, 1, 2].map((d) => (
                    <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-graphite" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
                  ))}
                </div>
              )}
              {!busy && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => void send(s)} className="px-3 py-1.5 rounded-full ring-1 ring-rule text-[0.8rem] text-ink-soft hover:text-ink hover:ring-gold/60 transition-[box-shadow,color] cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="shrink-0 border-t border-rule p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <div className="flex items-end gap-2 rounded-2xl bg-night ring-1 ring-rule focus-within:ring-gold/70 p-1.5 pl-3.5 transition-[box-shadow]">
                <label htmlFor="agent-input" className="sr-only">
                  Message the Zion Agent
                </label>
                <textarea
                  id="agent-input"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  maxLength={2000}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder="Ask about products, pricing, or support"
                  className="flex-1 min-w-0 max-h-28 py-2 bg-transparent text-[0.9rem] text-ink placeholder:text-mist resize-none outline-none focus-visible:outline-none field-sizing-content"
                />
                <button type="submit" disabled={!input.trim() || busy} aria-label="Send" className="w-9 h-9 shrink-0 rounded-xl bg-gold text-night flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  <ArrowUp size={17} strokeWidth={2.5} />
                </button>
              </div>
              <p className="mt-2 px-1 text-[0.7rem] text-mist">Prices are estimates. A person confirms every quote.</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AssistantBubble({ text, done }: { text: string; done?: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="self-start max-w-[90%]">
      <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-raised text-[0.9rem] leading-relaxed text-ink-soft whitespace-pre-wrap">{text}</div>
      {done?.map((d) => (
        <div key={d} className={cn("mt-1.5 pl-1 text-[0.75rem] text-gold-bright")}>
          {d} →
        </div>
      ))}
    </motion.div>
  );
}
