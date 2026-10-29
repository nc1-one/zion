import { cn } from "@/lib/utils";

export type AgentMood = "idle" | "happy" | "thinking";

// The Zion Agent: a small node-bot drawn from the logo's circuit traces, with a
// trace antenna and terminal "ears". Decorative unless given a title.
export function AgentMascot({
  size = 48,
  mood = "idle",
  title,
  className,
}: {
  size?: number;
  mood?: AgentMood;
  title?: string;
  className?: string;
}) {
  const eyeShift = mood === "thinking" ? "translate(2 -2)" : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0 overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* antenna trace and node */}
      <path d="M32 16V10l6-6" className="stroke-gold" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="39.5" cy="3.5" r="3.2" className={cn("fill-gold", mood === "thinking" && "agent-node-pulse")} />

      {/* terminal ears */}
      <path d="M10 34H5M54 34h5" className="stroke-gold" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="4" cy="34" r="2.4" className="fill-gold" />
      <circle cx="60" cy="34" r="2.4" className="fill-gold" />

      {/* head */}
      <rect x="10" y="16" width="44" height="36" rx="14" className="fill-night stroke-gold" strokeWidth="2.5" />

      {/* eyes */}
      <g transform={eyeShift}>
        {mood === "happy" ? (
          <>
            <path d="M21 34q3-4.5 6 0M37 34q3-4.5 6 0" className="stroke-gold-bright" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <rect x="21" y="28" width="6" height="9" rx="3" className="fill-gold-bright agent-eye" />
            <rect x="37" y="28" width="6" height="9" rx="3" className="fill-gold-bright agent-eye" />
          </>
        )}
      </g>

      {/* mouth */}
      {mood === "thinking" ? (
        <path d="M29 43.5h6" className="stroke-gold-bright" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <path d="M27.5 42q4.5 3.5 9 0" className="stroke-gold-bright" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
