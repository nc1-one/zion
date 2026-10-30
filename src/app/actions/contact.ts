"use server";

import { z } from "zod";
import { ProposalSchema, QuoteSchema, type Proposal, type Quote } from "@/lib/assessment/types";
import { formatDate, money, weeksLabel } from "@/lib/assessment/format";
import { rateFor } from "@/lib/assessment/pricing";
import { WORK_REGIONS, labelOf, type WorkRegionId } from "@/lib/assessment/questions";
import { serviceTitle } from "@/lib/assessment/services";

// Validation schema for the contact form
const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.email("Invalid email address").max(200),
  organizationType: z.string().max(80).optional(),
  referredBy: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
  proposal: ProposalSchema.nullish(),
  quote: QuoteSchema.nullish(),
});

export type ContactInput = z.input<typeof contactSchema>;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Internal only: the client's region, Zion's rate for it, and the approximate
// effort behind a price. Never shown to visitors.
const effortAt = (region: WorkRegionId | undefined) => (usd: number) => `≈${Math.round(usd / rateFor(region))} h`;
const regionLine = (region: WorkRegionId | undefined) =>
  `<p style="color: #56616D; font-size: 13px;"><strong>Internal:</strong> ${escapeHtml(labelOf(WORK_REGIONS, region ?? "manila"))} · $${rateFor(region)}/h</p>`;

function proposalHtml(p: Proposal): string {
  const effort = effortAt(p.answers.region);
  const phases = p.phases
    .map(
      (phase) => `
        <tr><td colspan="2" style="padding: 14px 0 6px; font-weight: 600; border-bottom: 1px solid #D6DADA;">
          ${escapeHtml(phase.name)} · weeks ${phase.startWeek}–${phase.startWeek + phase.weeks - 1}
          <span style="float: right; font-weight: 400;">${money(phase.cost)} <span style="color: #999;">(${effort(phase.cost)})</span></span>
        </td></tr>
        ${phase.deliverables
          .map(
            (d) => `<tr>
              <td style="padding: 6px 12px 6px 0; vertical-align: top;">${escapeHtml(d.name)}<br/><span style="color: #56616D; font-size: 13px;">${escapeHtml(d.description)}</span></td>
              <td style="padding: 6px 0; text-align: right; vertical-align: top; white-space: nowrap;">${d.cost ? `${money(d.cost)} <span style="color: #999;">(${effort(d.cost)})</span>` : ""}</td>
            </tr>`,
          )
          .join("")}`,
    )
    .join("");

  return `
    <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
    <h2 style="color: #8A681D; margin: 0 0 4px;">Scope of work ${escapeHtml(p.ref)}</h2>
    <p style="margin: 0 0 12px; color: #56616D; font-size: 13px;">
      ${p.source === "agent" ? "Drafted by the Zion Agent" : "Drafted with the standard estimator"} on ${formatDate(p.createdAt)}
      ${p.website ? ` · ${escapeHtml(p.website)}` : ""}
    </p>
    <h3 style="margin: 0 0 6px;">${escapeHtml(p.projectTitle)}</h3>
    <p style="line-height: 1.6;">${escapeHtml(p.summary)}</p>
    <p><strong>Estimated investment:</strong> ${money(p.totalCost)} <span style="color: #999;">(${effort(p.totalCost)} internal)</span> &nbsp;·&nbsp; <strong>Timeline:</strong> ${weeksLabel(p.totalWeeks)}</p>
    ${regionLine(p.answers.region)}
    ${p.siteFindings.length ? `<p><strong>Site survey</strong></p><ul>${p.siteFindings.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>` : ""}
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">${phases}</table>
    ${p.assumptions.length ? `<p><strong>Assumptions</strong></p><ul>${p.assumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>` : ""}
    ${p.recommendedServices.length ? `<p><strong>Offerings:</strong> ${p.recommendedServices.map(serviceTitle).join(", ")}</p>` : ""}
    ${p.answers.goal ? `<p><strong>Their goal, in their words:</strong> ${escapeHtml(p.answers.goal)}</p>` : ""}`;
}

function quoteHtml(q: Quote): string {
  const effort = effortAt(q.region);
  const price = (l: { oneTime: number; monthly: number }) =>
    [l.oneTime ? `${money(l.oneTime)} setup (${effort(l.oneTime)})` : "", l.monthly ? `${money(l.monthly)}/mo (${effort(l.monthly)})` : ""].filter(Boolean).join(" · ");
  return `
    <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
    <h2 style="color: #8A681D; margin: 0 0 4px;">Quote ${escapeHtml(q.ref)}: ${escapeHtml(q.title)}</h2>
    <p style="margin: 0 0 12px; color: #56616D; font-size: 13px;">${q.kind === "managed-it" ? "Managed IT plan" : "Digital product"} · ${formatDate(q.createdAt)}</p>
    <p>
      ${q.setupTotal ? `<strong>Setup:</strong> ${money(q.setupTotal)} &nbsp;·&nbsp; ` : ""}
      ${q.monthlyTotal ? `<strong>Monthly:</strong> ${money(q.monthlyTotal)}` : ""}
      ${q.weeks ? ` &nbsp;·&nbsp; live in about ${weeksLabel(q.weeks)}` : ""}
    </p>
    ${regionLine(q.region)}
    ${q.term ? `<p><strong>Contract:</strong> ${escapeHtml(q.term)}${q.contractTotal ? ` · ${money(q.contractTotal)} total` : ""}</p>` : ""}
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      ${q.lines
        .map(
          (l) => `<tr><td style="padding: 6px 12px 6px 0; border-bottom: 1px solid #eee;">${escapeHtml(l.label)}</td>
            <td style="padding: 6px 0; text-align: right; border-bottom: 1px solid #eee; white-space: nowrap;">${price(l)}</td></tr>`,
        )
        .join("")}
    </table>
    ${q.note ? `<p style="color: #56616D; font-size: 13px;">${escapeHtml(q.note)}</p>` : ""}`;
}

export async function sendContactEmail(data: ContactInput) {
  // ---- Validation -------------------------------------------------------
  const validated = contactSchema.safeParse(data);
  if (!validated.success) {
    const errorMessage = validated.error.issues[0]?.message || "Invalid input data";
    return { success: false, error: errorMessage };
  }

  const { fullName, email, organizationType, referredBy, message, proposal, quote } = validated.data;

  // ---- Environment -------------------------------------------------------
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const RECEIVER_EMAIL = process.env.CONTACT_FORM_RECEIVER_EMAIL || "culanculan.neilchristian@gmail.com";
  // Brevo only sends from verified senders; set BREVO_SENDER_EMAIL to one.
  const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || RECEIVER_EMAIL;
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean) : [];

  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY is not configured in environment variables.");
    if (process.env.NODE_ENV === "development") {
      // Simulate a successful send in development mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, demo: true };
    }
    return { success: false, error: "Our contact form is temporarily unavailable. Email support@zionsystems.dev instead." };
  }

  const subject = proposal
    ? `Scope ${proposal.ref}: ${fullName} (${money(proposal.totalCost)}, ${weeksLabel(proposal.totalWeeks)})`
    : quote
      ? `Quote ${quote.ref}: ${quote.title} for ${fullName} (${[quote.setupTotal ? `${money(quote.setupTotal)} setup` : "", quote.monthlyTotal ? `${money(quote.monthlyTotal)}/mo` : ""].filter(Boolean).join(" + ")})`
      : `New Inquiry: ${fullName} (${organizationType || "General"})`;

  // ---- Send via Brevo SMTP API -----------------------------------------
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Zion Build Web", email: SENDER_EMAIL },
        // Primary receiver plus any additional admin emails
        to: [
          ...ADMIN_EMAILS.map(email => ({ email, name: "Zion Admin" })),
          { email: RECEIVER_EMAIL, name: "Zion Build Admin" },
        ],
        replyTo: { email, name: fullName },
        subject,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #13202C;">
            <h2 style="color: #8A681D;">${proposal ? "New scope from the Zion Agent" : quote ? "New quote request" : "New Contact Form Submission"}</h2>
            <p><strong>From:</strong> ${escapeHtml(fullName)} (${escapeHtml(email)})</p>
            <p><strong>Organization Type:</strong> ${escapeHtml(organizationType || "Not specified")}</p>
            <p><strong>Referred by:</strong> ${escapeHtml(referredBy || "Not specified")}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #333;">${escapeHtml(message)}</p>
            ${proposal ? proposalHtml(proposal) : ""}
            ${quote ? quoteHtml(quote) : ""}
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Sent from the Zion Build website contact form.</p>
          </div>
        `,
      }),
    });

    if (response.ok) {
      return { success: true };
    }
    console.error("Brevo API error:", response.status, await response.text().catch(() => ""));
    return { success: false, error: "We couldn't send your message. Try again, or email support@zionsystems.dev." };
  } catch (error) {
    console.error("Contact form error:", error);
    return { success: false, error: "We couldn't send your message. Try again, or email support@zionsystems.dev." };
  }
}
