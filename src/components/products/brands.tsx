import type { ProtoBrand } from "./drive";
import type { Product } from "@/lib/quotes";

// Each product's identity inside its demo: logo mark, layout, type, and shape.
// Colors come from showcase.ts.

const Tile = ({ children, round = false }: { children: React.ReactNode; round?: boolean }) => (
  <svg viewBox="0 0 26 26" width="26" height="26" aria-hidden className="shrink-0">
    {round ? <circle cx="13" cy="13" r="13" className="fill-gold" /> : <rect width="26" height="26" rx="7" className="fill-gold" />}
    <g fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </svg>
);

export const BRANDS: Record<Product["id"], Omit<ProtoBrand, "accent">> = {
  "church-os": {
    shell: "classic",
    stats: "cards",
    mark: (
      <Tile>
        <path d="M8.5 19v-6.5a4.5 4.5 0 0 1 9 0V19" />
        <path d="M6.5 19h13" />
      </Tile>
    ),
  },
  pipeline: {
    shell: "tinted",
    stats: "cards",
    radius: "soft",
    mark: (
      <Tile round>
        <path d="M7 16.5c2.2-6.5 9.8-6.5 12 0" />
        <circle cx="7" cy="16.5" r="1.2" fill="white" />
        <circle cx="13" cy="11.6" r="1.2" fill="white" />
        <circle cx="19" cy="16.5" r="1.2" fill="white" />
      </Tile>
    ),
  },
  sermon: {
    shell: "paper",
    font: "serif",
    stats: "plain",
    mark: (
      <Tile>
        <path d="M9 6.5h8v13l-4-2.8-4 2.8z" />
      </Tile>
    ),
  },
  "bible-study": {
    shell: "topnav",
    radius: "soft",
    stats: "cards",
    mark: (
      <svg viewBox="0 0 26 26" width="26" height="26" aria-hidden className="shrink-0">
        <circle cx="9.5" cy="10" r="6" className="fill-gold" opacity="0.55" />
        <circle cx="16.5" cy="10" r="6" className="fill-gold" opacity="0.75" />
        <circle cx="13" cy="16.5" r="6" className="fill-gold" />
      </svg>
    ),
  },
  hris: {
    shell: "dark",
    barColor: "#1A1530",
    stats: "strip",
    radius: "sharp",
    mark: (
      <Tile>
        <rect x="6" y="7.5" width="14" height="11" rx="2" />
        <circle cx="10.5" cy="12.2" r="1.6" />
        <path d="M14.5 11.5h3M14.5 14.5h3M8.5 16h4" />
      </Tile>
    ),
  },
  hubspot: {
    shell: "brandbar",
    barColor: "#1E293B",
    stats: "cards",
    mark: (
      <Tile round>
        <path d="M13 18.5s-5.5-3.3-5.5-7a2.9 2.9 0 0 1 5.5-1.3 2.9 2.9 0 0 1 5.5 1.3c0 3.7-5.5 7-5.5 7z" />
      </Tile>
    ),
  },
  donors: {
    shell: "brandbar",
    font: "grotesk",
    radius: "soft",
    stats: "plain",
    mark: (
      <svg viewBox="0 0 26 26" width="26" height="26" aria-hidden className="shrink-0">
        <rect width="26" height="26" rx="7" fill="white" />
        <g className="fill-gold">
          <rect x="7" y="13" width="3" height="6" rx="1" />
          <rect x="11.5" y="10" width="3" height="9" rx="1" />
          <rect x="16" y="7" width="3" height="12" rx="1" />
        </g>
      </svg>
    ),
  },
  erp: {
    shell: "dark",
    barColor: "#0B1B2E",
    stats: "strip",
    radius: "sharp",
    mark: (
      <Tile>
        <path d="M13 6.5l6 3.3v6.4L13 19.5l-6-3.3V9.8z" />
        <path d="M7 9.8l6 3.3 6-3.3M13 13.1v6.4" />
      </Tile>
    ),
  },
  store: {
    shell: "commerce",
    radius: "soft",
    stats: "cards",
    mark: (
      <Tile>
        <path d="M8 10h10l-.8 9H8.8z" />
        <path d="M10.5 10V9a2.5 2.5 0 0 1 5 0v1" />
      </Tile>
    ),
  },
};
