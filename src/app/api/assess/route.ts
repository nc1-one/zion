import { runAgent } from "@/lib/assessment/agent";
import { estimatorDraft, finalizeProposal } from "@/lib/assessment/estimate";
import { AssessRequestSchema } from "@/lib/assessment/types";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!rateLimit(`assess:${clientIp(request)}`, 6, 10 * 60_000)) {
    return Response.json({ error: "You've drafted several scopes in a short time. Try again in a few minutes." }, { status: 429 });
  }

  const body = AssessRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "Some answers are missing. Go back and complete each question." }, { status: 400 });
  }
  const { answers, scan } = body.data;

  try {
    const draft = await runAgent(answers, scan);
    return Response.json(finalizeProposal(draft, answers, scan, "agent"));
  } catch (error) {
    // Keep the experience working without the agent (no API key, timeout,
    // refusal): fall back to the rules-based estimator.
    console.error("Zion Agent unavailable, using estimator:", error instanceof Error ? error.message : error);
    return Response.json(finalizeProposal(estimatorDraft(answers, scan), answers, scan, "estimator"));
  }
}
