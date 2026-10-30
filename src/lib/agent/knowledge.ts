// What the Zion Agent knows about Zion, built from the same data the page
// uses so it never drifts from what visitors see. Server-only.

import { SERVICES } from "@/lib/assessment/services";
import { WORK_REGIONS } from "@/lib/assessment/questions";
import { DEV_TEAM, EVERY_PLAN, IT_SERVICES, IT_SIZES, IT_TERMS, PRODUCTS } from "@/lib/quotes";

export const SECTIONS = ["assessment", "why", "products", "offerings", "work", "about", "contact"] as const;

function productsText() {
  return PRODUCTS.map((p) =>
    [
      `- ${p.name} (id "${p.id}"). Problem it solves: ${p.hook} Platforms: ${p.platforms}. Works with: ${p.integrations.join(", ")}.`,
      `  ${p.tiers.label} tiers: ${p.tiers.options.map((o) => `"${o.id}" = ${o.label}`).join("; ")}.`,
      `  Modules: ${p.modules.map((m) => `"${m.id}" = ${m.label}${m.included ? " (always included)" : ""}`).join("; ")}.`,
      p.note ? `  Note: ${p.note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  ).join("\n");
}

export function knowledge() {
  return `About Zion
- Zion Systems & Build is a software studio in Manila, Philippines. Tagline: "Software built with excellence, priced for the mission."
- It builds software, runs IT, and does marketing for churches, ministries, nonprofits, schools, and faith-driven businesses. One team builds it and supports it after launch.
- Zion works Manila hours and also covers Australian, American, and UK/European business hours.
- Typical commercial software costs more: Zion's pricing is about 45% less than the usual commercial products.
- Trusted by Jesus.Net Philippines, Turn Vertical, HopeBegins, eSTAR Foundation, and Glassbox PH.
- Contact: support@zionsystems.dev, +63 908 890 1896. The team replies within one business day.
- Founding vision: "Remove the technical barriers that hinder Kingdom-focused organizations from reaching their full potential. We build the frameworks so you can focus on the fruit."

How projects run
- The free Zion Agent assessment on the page (website + eight questions) drafts a roadmap, deliverables, timeline, and estimated investment in about three minutes. The visitor can send it to the team from the contact form.
- Every project runs through five phases: Discover & Define, Architect & Blueprint, Build & Iterate, Test & Refine, Launch & Sustain.
- Every estimate is confirmed by a person after a discovery call.

Services
${SERVICES.map((s) => `- ${s.title}: ${s.desc} Includes ${s.includes.join(", ")}.`).join("\n")}

Ready-made products (each has a live demo on the page; every plan includes ${EVERY_PLAN.join(", ").toLowerCase()})
${productsText()}

Managed IT (a monthly plan; Zion becomes their IT team, and their dev team when needed)
- Team sizes: ${IT_SIZES.map((s) => `"${s.id}" = ${s.label} people`).join("; ")}.
- Services: ${IT_SERVICES.map((s) => `"${s.id}" = ${s.label}`).join("; ")}.
- Developers as needed: ${DEV_TEAM.map((d) => `"${d.id}" = ${d.label}${d.detail ? ` (${d.detail})` : ""}`).join("; ")}.
- Contracts: ${IT_TERMS.map((t) => `"${t.id}" = ${t.label}`).join("; ")}. Longer terms cost less per month.

Time zones for pricing (pass the id to the estimate tools)
${WORK_REGIONS.map((r) => `- "${r.id}" = ${r.label}`).join("\n")}`;
}
