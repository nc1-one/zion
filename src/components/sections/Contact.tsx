"use client";

import { RevealHeading } from "@/components/ui/motion";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileText, Loader2, Mail, MapPin, Phone, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendContactEmail } from "@/app/actions/contact";
import { useAssessment } from "@/components/assessment/AssessmentProvider";
import { ORG_TYPES, labelOf } from "@/lib/assessment/questions";
import { hostOf, money, weeksLabel } from "@/lib/assessment/format";

const ORG_OPTIONS = [...ORG_TYPES.map((o) => o.label), "Individual project"];

const fieldClass =
  "w-full px-4 py-3 bg-sheet border border-rule rounded-lg text-ink text-[0.92rem] outline-none transition-[border-color,box-shadow] focus:border-trace focus:shadow-[0_0_0_3px_var(--color-trace-wash)] placeholder:text-mist";
const labelClass = "annot text-graphite";

export function Contact() {
  const { proposal, quote, attachment, setAttachment } = useAssessment();
  const scope = attachment === "scope" ? proposal : null;
  const attachedQuote = attachment === "quote" ? quote : null;
  const attachedRef = scope?.ref ?? attachedQuote?.ref ?? null;

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    organizationType: ORG_OPTIONS[0],
    message: "",
  });

  // When something new is attached, start the message (and organization type) for them.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (attachedRef && prefilledFor !== attachedRef) {
    setPrefilledFor(attachedRef);
    setFormData((prev) => ({
      ...prev,
      organizationType: scope ? labelOf(ORG_TYPES, scope.answers.orgType) : prev.organizationType,
      message: scope
        ? `Hi Zion team, I'd like to talk through the scope the Zion Agent drafted for ${hostOf(scope.website) ?? "our organization"}.`
        : `Hi Zion team, I'd like to talk about the ${attachedQuote!.title} quote.`,
    }));
    if (status === "success") setStatus("idle");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const result = await sendContactEmail({ ...formData, proposal: scope, quote: attachedQuote });
      if (result.success) {
        setStatus("success");
        setFormData({ fullName: "", email: "", organizationType: ORG_OPTIONS[0], message: "" });
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("We couldn't send your message. Check your connection and try again.");
    }
  };

  return (
    <section id="contact" className="py-20 md:py-28 px-5 md:px-10 border-t border-rule">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-12 lg:gap-16">
        <div>
          <RevealHeading key={attachment ?? "none"} text={scope ? "Send us your scope" : attachedQuote ? "Send us your quote" : "Talk to the team"} className="font-display text-[clamp(2.2rem,4vw,3.2rem)] leading-[1.06] font-semibold text-ink" />
          <p className="mt-5 text-[1rem] leading-[1.7] text-graphite max-w-[32rem]">
            {scope || attachedQuote ? `Your ${scope ? "scope" : "quote"} is attached. Add a note and send.` : "Tell us what you want to build."}
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {[
              { icon: Mail, label: "Email", val: "support@zionsystems.dev", href: "mailto:support@zionsystems.dev" },
              { icon: Phone, label: "Phone", val: "+63 (908) 890 1896", href: "tel:+639088901896" },
              { icon: MapPin, label: "Office", val: "Manila, Philippines" },
            ].map((item) => (
              <li key={item.label} className="flex gap-4 items-center">
                <span className="w-10 h-10 shrink-0 rounded-full border border-rule bg-sheet flex items-center justify-center">
                  <item.icon size={16} className="text-gold-deep" />
                </span>
                <span>
                  <span className="block annot text-mist">{item.label}</span>
                  {item.href ? (
                    <a href={item.href} className="text-[0.95rem] text-ink no-underline hover:text-gold-deep">
                      {item.val}
                    </a>
                  ) : (
                    <span className="text-[0.95rem] text-ink">{item.val}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[0.85rem] text-graphite max-w-[30rem]">
            We reply within one business day.
          </p>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-sheet border border-rule rounded-[10px] p-10 flex flex-col items-center justify-center text-center min-h-[420px]"
              >
                <CheckCircle2 size={36} className="text-gold-deep mb-5" />
                <h3 className="font-display text-[2rem] font-semibold text-ink mb-3">Message sent</h3>
                <p className="text-graphite max-w-sm mb-8">
                  Thank you for reaching out. We&apos;ll reply to the email you gave us, usually within one business day.
                </p>
                <Button variant="ghost" onClick={() => setStatus("idle")}>
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-sheet border border-rule rounded-[10px] p-6 sm:p-8 flex flex-col gap-5"
                onSubmit={handleSubmit}
              >
                {status === "error" && (
                  <div role="alert" className="p-4 bg-danger-wash rounded-lg flex items-center gap-3 text-danger text-[0.85rem]">
                    <AlertCircle size={18} className="shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {(scope || attachedQuote) && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-gold/50 bg-gold-wash">
                    <FileText size={18} className="text-gold-deep shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="annot text-gold-deep">
                        Attached · {scope ? "Scope" : "Quote"} {attachedRef}
                      </div>
                      <div className="text-[0.92rem] font-medium text-ink mt-1 truncate">{scope ? scope.projectTitle : attachedQuote!.title}</div>
                      <div className="text-[0.8rem] text-graphite mt-0.5">
                        {scope
                          ? `${money(scope.totalCost)} · ${weeksLabel(scope.totalWeeks)}`
                          : attachedQuote!.kind === "managed-it"
                            ? `${money(attachedQuote!.monthlyTotal)} / month · ${attachedQuote!.term ?? ""}${attachedQuote!.contractTotal ? ` · ${money(attachedQuote!.contractTotal)} total` : ""}`
                            : [attachedQuote!.setupTotal ? `${money(attachedQuote!.setupTotal)} setup` : "", attachedQuote!.monthlyTotal ? `${money(attachedQuote!.monthlyTotal)} / month` : ""].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="p-1 -m-1 text-graphite hover:text-ink cursor-pointer"
                      aria-label={`Remove attached ${scope ? "scope" : "quote"}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {!scope && proposal && (
                  <button
                    type="button"
                    onClick={() => setAttachment("scope")}
                    className="self-start inline-flex items-center gap-2 text-[0.85rem] text-gold-deep hover:text-ink cursor-pointer"
                  >
                    <FileText size={15} /> Attach scope {proposal.ref}{attachedQuote ? " instead" : ""}
                  </button>
                )}
                {!attachedQuote && quote && (
                  <button
                    type="button"
                    onClick={() => setAttachment("quote")}
                    className="self-start inline-flex items-center gap-2 text-[0.85rem] text-gold-deep hover:text-ink cursor-pointer"
                  >
                    <FileText size={15} /> Attach quote {quote.ref}{scope ? " instead" : ""}
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="fullName" className={labelClass}>Full name</label>
                    <input id="fullName" type="text" name="fullName" required autoComplete="name" value={formData.fullName} onChange={handleChange} placeholder="Maria Santos" className={fieldClass} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input id="email" type="email" name="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="maria@yourchurch.org" className={fieldClass} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="organizationType" className={labelClass}>Organization type</label>
                  <select id="organizationType" name="organizationType" value={formData.organizationType} onChange={handleChange} className={`${fieldClass} cursor-pointer`}>
                    {ORG_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className={labelClass}>Message</label>
                  <textarea id="message" name="message" required value={formData.message} onChange={handleChange} placeholder="Tell us about your mission and what you're looking to build." className={`${fieldClass} min-h-[140px] resize-y leading-[1.6]`} />
                </div>

                <Button type="submit" className="self-start mt-1" disabled={status === "submitting"}>
                  {status === "submitting" ? (
                    <>Sending <Loader2 size={16} className="animate-spin" /></>
                  ) : (
                    <>{scope ? "Send scope and message" : attachedQuote ? "Send quote and message" : "Send message"} <Send size={15} /></>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
