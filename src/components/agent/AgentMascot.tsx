import { cn } from "@/lib/utils";

export type AgentMood = "idle" | "happy" | "thinking";

// The Zion Agent's status light: steady while ready, pulsing while it works.
export function AgentMascot({ mood = "idle", className }: { mood?: AgentMood; className?: string }) {
  return (
    <span className={cn("relative flex w-2.5 h-2.5 shrink-0", className)} aria-hidden>
      {mood === "thinking" && <span className="absolute inset-0 rounded-full bg-gold animate-ping" />}
      <span className={cn("relative w-2.5 h-2.5 rounded-full", mood === "happy" ? "bg-good" : "bg-gold")} />
    </span>
  );
}
