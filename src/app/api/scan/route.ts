import { z } from "zod";
import { scanWebsite } from "@/lib/assessment/scan";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const BodySchema = z.object({ url: z.string().min(1).max(500) });

export async function POST(request: Request) {
  if (!rateLimit(`scan:${clientIp(request)}`, 15, 10 * 60_000)) {
    return Response.json({ error: "Too many site checks. Try again in a few minutes." }, { status: 429 });
  }

  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Enter a website address." }, { status: 400 });

  return Response.json(await scanWebsite(body.data.url));
}
