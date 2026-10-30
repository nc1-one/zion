import { z } from "zod";

// What the Zion Agent can do on the page besides talking.
export type AgentAction =
  | { type: "show_product"; product: string }
  | { type: "start_assessment"; website?: string }
  | { type: "open_contact"; fullName?: string; email?: string; organizationType?: string; referredBy?: string; message: string }
  | { type: "show_section"; section: string };

export interface AgentReply {
  reply: string;
  actions: AgentAction[];
  suggestions: string[];
  source: "agent" | "fallback";
}

export const AgentRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(30),
  context: z
    .object({
      section: z.string().max(40).optional(),
      product: z.string().max(40).optional(),
      hasScope: z.boolean().optional(),
    })
    .optional(),
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;
