// The Zion Agent without the model (no API key, timeout, or outage): match the
// visitor's message to the most common questions and still move them forward.

import type { AgentAction, AgentReply } from "./types";

const PRODUCT_WORDS: [RegExp, string, string][] = [
  [/\b(shop|store|e-?commerce|sell online|merch|cart|checkout)/i, "store", "Online Store"],
  [/\b(donor|donation|fundrais|impact|grant)/i, "donors", "Donors & Impact"],
  [/\b(guest|visitor|follow[- ]?up|assimilat)/i, "pipeline", "AI Church Pipeline"],
  [/\b(sermon|preach|slides|handout)/i, "sermon", "Sermon Maker"],
  [/\b(small group|bible study|life group|cell group)/i, "bible-study", "Bible Study Groups"],
  [/\b(payroll|hr|hris|leave|staff|201 file)\b/i, "hris", "Church HRIS"],
  [/\b(hubspot|crm)\b/i, "hubspot", "HubSpot for NGOs"],
  [/\b(inventory|erp|stock|warehouse|purchase order|invoic)/i, "erp", "SME ERP"],
  [/\b(church|member|giving|tithe|check-?in|attendance)/i, "church-os", "Church OS"],
];

const BASE_SUGGESTIONS = ["Which product fits us?", "How much would a website cost?", "Talk to a person"];

export function fallbackReply(message: string): AgentReply {
  const text = message.toLowerCase();
  const reply = (r: string, actions: AgentAction[] = [], suggestions = BASE_SUGGESTIONS): AgentReply => ({ reply: r, actions, suggestions, source: "fallback" });

  if (/\b(person|human|someone|call|meet|talk|contact|email|sales)\b/.test(text)) {
    return reply("Happy to connect you with the team. I've opened the contact form. Add your details and they'll reply within one business day.", [
      { type: "open_contact", message: message.slice(0, 500) },
    ], ["What happens after I send it?", "Which product fits us?"]);
  }
  if (/(time ?zone|australia|new zealand|\bus\b|usa|america|canada|\buk\b|europe|london|sydney)/.test(text)) {
    return reply("We're in Manila and also work Australian, American, and UK hours. Pick your time zone in any price calculator on this page, or in the assessment, and the totals update.", [], ["Start the assessment", "Talk to a person"]);
  }
  if (/\b(it support|managed it|helpdesk|it team|devices|microsoft 365|google workspace|security)\b/.test(text)) {
    return reply("Managed IT is a monthly plan: we become your IT team, and your dev team when you need one. Pick your team size and services in the calculator to see the monthly total.", [
      { type: "show_section", section: "offerings" },
    ]);
  }
  for (const [pattern, id, name] of PRODUCT_WORDS) {
    if (pattern.test(message)) {
      return reply(`${name} sounds like a fit. I've opened its live demo. Press play for a guided tour, then build a plan below it to see the total.`, [
        { type: "show_product", product: id },
      ], ["How much would it cost?", "Talk to a person"]);
    }
  }
  if (/\b(assessment|scope)\b/.test(text)) {
    return reply("Here's the assessment. Paste your website (or choose that you don't have one) and answer eight questions; you'll get a roadmap, timeline, and estimate.", [{ type: "start_assessment" }], ["Which product fits us?", "Talk to a person"]);
  }
  if (/\b(price|pricing|cost|how much|budget|quote|estimate|rate)\b/.test(text)) {
    return reply("Every price here is a total, never an hourly rate. For a custom build, the free assessment gives you a roadmap, timeline, and estimate in about three minutes.", [
      { type: "start_assessment" },
    ], ["Show me the products", "Talk to a person"]);
  }
  if (/\b(website|app|portal|build|redesign|system)\b/.test(text)) {
    return reply("Let's scope it. The assessment reads your current site and drafts a roadmap, timeline, and estimate in about three minutes.", [{ type: "start_assessment" }]);
  }
  return reply("I can recommend a product, price a plan, or set up a call with the team. What are you working on?");
}
