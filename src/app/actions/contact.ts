"use server";

import { z } from "zod";

// Validation schema for the contact form
const contactSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  organizationType: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function sendContactEmail(data: {
  fullName: string;
  email: string;
  organizationType?: string;
  message: string;
}) {
  // ---- Validation -------------------------------------------------------
  const validated = contactSchema.safeParse(data);
  if (!validated.success) {
    const errorMessage = validated.error.issues[0]?.message || "Invalid input data";
    return { success: false, error: errorMessage };
  }

  const { fullName, email, organizationType, message } = validated.data;

  
  // ---- Environment -------------------------------------------------------
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const RECEIVER_EMAIL = process.env.CONTACT_FORM_RECEIVER_EMAIL || "culanculan.neilchristian@gmail.com";
  const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()).filter(Boolean) : [];

  console.log("📧 Attempting to send email to:", [RECEIVER_EMAIL, ...ADMIN_EMAILS]);

  if (!BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY is not configured in environment variables.");
    if (process.env.NODE_ENV === "development") {
      // Simulate a successful send in development mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, demo: true };
    }
    return { success: false, error: "Email service not configured. Please check environment variables." };
  }

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
        sender: { name: "Zion Build Web", email: RECEIVER_EMAIL },
        // Primary receiver plus any additional admin emails
        to: [
          ...ADMIN_EMAILS.map(email => ({ email, name: "Zion Admin" })),
          { email: RECEIVER_EMAIL, name: "Zion Build Admin" },
        ],
        replyTo: { email, name: fullName },
        subject: `New Inquiry: ${fullName} (${organizationType || "General"})`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #CDA246;">New Contact Form Submission</h2>
            <p><strong>From:</strong> ${fullName} (<${email}>)</p>
            <p><strong>Organization Type:</strong> ${organizationType || "Not specified"}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #333;">${message}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Sent from the Zion Build website contact form.</p>
          </div>
        `,
      }),
    });

    const result = await response.json();
    console.log("📨 Brevo API Response:", JSON.stringify(result, null, 2));
    
    if (response.ok) {
      return { success: true };
    }
    console.error("❌ Brevo API Error:", result);
    return { success: false, error: "Failed to send email. Please try again later." };
  } catch (error) {
    console.error("Contact form error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
