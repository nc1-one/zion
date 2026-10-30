// Product photography stand-ins for Kapwa Coffee Co.: simple drawn packaging
// in each product's colors, so the store reads like a real catalog.

export type ArtKind = "bag" | "drip" | "mug" | "gift" | "beans" | "cup" | "pour";

const PALETTES = [
  ["#5B3A24", "#E9D7C1", "#C9A27A"],
  ["#2F4A3A", "#DCE6D6", "#9DB59A"],
  ["#7A2E2E", "#F1DACB", "#D49A86"],
  ["#1F3B57", "#D8E3EE", "#8FAACB"],
  ["#8A6A2B", "#F3E8CB", "#D4B771"],
  ["#3B3B3B", "#E6E6E6", "#A9A9A9"],
];

export function ProductArt({ kind, tone = 0, className }: { kind: ArtKind; tone?: number; className?: string }) {
  const [main, light, mid] = PALETTES[tone % PALETTES.length];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="100" fill={light} />
      {kind === "bag" && (
        <g>
          <path d="M30 24h40l4 62H26z" fill={main} />
          <path d="M30 24l4-8h32l4 8z" fill={mid} />
          <rect x="34" y="44" width="32" height="20" rx="2" fill={light} />
          <rect x="38" y="49" width="24" height="3" rx="1.5" fill={main} />
          <rect x="42" y="56" width="16" height="2.5" rx="1.25" fill={mid} />
          <circle cx="50" cy="34" r="3" fill={mid} />
        </g>
      )}
      {kind === "drip" && (
        <g>
          <path d="M24 34l26-10 26 10v40L50 84 24 74z" fill={main} />
          <path d="M50 44v40L24 74V34z" fill={mid} />
          <path d="M24 34l26 10 26-10" fill="none" stroke={light} strokeWidth="1.5" />
          <rect x="56" y="52" width="14" height="14" rx="2" fill={light} />
        </g>
      )}
      {kind === "mug" && (
        <g>
          <path d="M30 34h34v34a10 10 0 0 1-10 10H40a10 10 0 0 1-10-10z" fill={main} />
          <path d="M64 42h6a8 8 0 0 1 0 16h-6" fill="none" stroke={main} strokeWidth="5" />
          <rect x="36" y="48" width="22" height="8" rx="2" fill={light} />
          <ellipse cx="47" cy="34" rx="17" ry="3" fill={mid} />
        </g>
      )}
      {kind === "gift" && (
        <g>
          <rect x="24" y="40" width="52" height="40" rx="3" fill={main} />
          <rect x="20" y="32" width="60" height="12" rx="3" fill={mid} />
          <rect x="46" y="32" width="8" height="48" fill={light} />
          <path d="M50 32c-8-10-18-6-12 0M50 32c8-10 18-6 12 0" fill="none" stroke={light} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === "beans" && (
        <g fill={main}>
          {[
            [34, 40, 20],
            [56, 36, -30],
            [46, 56, 45],
            [66, 58, 10],
            [30, 62, -15],
            [52, 72, 70],
          ].map(([x, y, r]) => (
            <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="9" ry="6" />
              <path d={`M${x - 7} ${y}q7 -3 14 0`} stroke={light} strokeWidth="1.5" fill="none" />
            </g>
          ))}
        </g>
      )}
      {kind === "cup" && (
        <g>
          <ellipse cx="50" cy="74" rx="30" ry="6" fill={mid} />
          <path d="M30 44h40l-4 26a6 6 0 0 1-6 5H40a6 6 0 0 1-6-5z" fill="white" />
          <ellipse cx="50" cy="44" rx="20" ry="4" fill={main} />
          <path d="M44 30c-3-4 3-6 0-10M54 30c-3-4 3-6 0-10" stroke={mid} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}
      {kind === "pour" && (
        <g>
          <path d="M34 30h32l-10 20H44z" fill={main} />
          <rect x="40" y="50" width="20" height="4" fill={mid} />
          <path d="M38 54h24v20a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6z" fill="white" />
          <path d="M50 56v10" stroke={main} strokeWidth="2" strokeDasharray="2 3" />
        </g>
      )}
    </svg>
  );
}

// Which drawing fits a product type or a gallery shot.
export const artFor = (type: string, shot = ""): ArtKind => {
  if (/bean/i.test(shot)) return "beans";
  if (/brewed|cup/i.test(shot)) return "cup";
  if (/brewing|pour/i.test(shot)) return "pour";
  if (/drip/i.test(type)) return "drip";
  if (/merch/i.test(type)) return "mug";
  if (/gift/i.test(type)) return "gift";
  return "bag";
};
