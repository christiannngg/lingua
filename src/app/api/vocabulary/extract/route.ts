import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { SUPPORTED_LANGUAGE_CODES } from "@/lib/languages.config";
import { extractAndSaveVocabulary } from "@/lib/ai/extract-vocabulary";
import { extractLimiter } from "@/ratelimit";

const RequestSchema = z.object({
  userMessage: z.string(),
  aiMessage: z.string(),
  language: z.enum(SUPPORTED_LANGUAGE_CODES),
  userLanguageId: z.string(),
  conversationId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  const { success, limit, remaining, reset } = await extractLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      },
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { userMessage, aiMessage, language, userLanguageId, conversationId } = parsed.data;

  // ── Ownership check ──────────────────────────────────────────────────────
  const userLanguage = await prisma.userLanguage.findUnique({
    where: { id: userLanguageId },
    select: { userId: true },
  });

  if (!userLanguage || userLanguage.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  // ────────────────────────────────────────────────────────────────────────

  // Delegate entirely to the shared implementation in extract-vocabulary.ts.
  // All prompt logic, retry handling, and DB writes live there.
  await extractAndSaveVocabulary({
    userMessage,
    aiMessage,
    language,
    userLanguageId,
    conversationId,
  });

  return NextResponse.json({ ok: true });
}
