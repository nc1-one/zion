import { cn } from "@/lib/utils";

export type AgentMood = "idle" | "happy" | "thinking";

// The Zion Agent's mark: three connected nodes, like the logo's circuit traces.
// The nodes pulse in turn while the agent works. Decorative unless given a title.
export function AgentMascot({
  size = 32,
  mood = "idle",
  title,
  className,
}: {
  size?: number;
  mood?: AgentMood;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8" className="fill-gold-wash stroke-gold/50" strokeWidth="1.5" />
      <path d="M9.5 21.5 16 10.5l6.5 11Z" className="stroke-gold" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <g className={cn(mood === "thinking" && "agent-working")}>
        <circle cx="16" cy="10.5" r="2.6" className={mood === "happy" ? "fill-gold-bright" : "fill-gold"} />
        <circle cx="9.5" cy="21.5" r="2.6" className={mood === "happy" ? "fill-gold-bright" : "fill-gold"} />
        <circle cx="22.5" cy="21.5" r="2.6" className={mood === "happy" ? "fill-gold-bright" : "fill-gold"} />
      </g>
    </svg>
  );
}
