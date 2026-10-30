import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Zion Systems & Build: know what to build before you build it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The share card: the hero line on Zion's dark stage, with the logo and the gold rule.
export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"), "base64");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: "#0A0C10", color: "#F2F0EB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={`data:image/png;base64,${logo}`} width={56} height={56} alt="" />
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>
            Zion<span style={{ color: "#E0B95C", marginLeft: 10 }}>Systems &amp; Build</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, letterSpacing: -3, maxWidth: 900 }}>Know what to build before you build it.</div>
          <div style={{ fontSize: 30, color: "#9EA5AF", maxWidth: 900 }}>Software, IT, and marketing for churches, ministries, and faith-driven businesses.</div>
        </div>
        <div style={{ display: "flex", height: 6, width: 160, background: "#D9AE4F", borderRadius: 3 }} />
      </div>
    ),
    { ...size },
  );
}
