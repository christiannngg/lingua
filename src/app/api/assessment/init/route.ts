import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";
import { isSupportedLanguage } from "@/lib/languages.config";
import { assessmentLimiter } from "@/ratelimit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limiting ──────────────────────────────────────────────────────
    const { success, limit, remaining, reset } = await assessmentLimiter.limit(session.user.id);
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
    // ──────────────────────────────────────────────────────────────────────

    const language = req.nextUrl.searchParams.get("language");
    if (!language || !isSupportedLanguage(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const userLanguage = await prisma.userLanguage.findUnique({
      where: {
        userId_language: { userId: session.user.id, language },
      },
    });

    if (!userLanguage) {
      return NextResponse.json(
        { error: "Language not added", code: "LANGUAGE_NOT_ADDED" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      userLanguageId: userLanguage.id,
      assessmentCompleted: userLanguage.assessmentCompleted,
    });
  } catch (err) {
    console.error("[assessment/init] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}