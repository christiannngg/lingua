import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { reviewLimiter } from "@/ratelimit";
import { processReview } from "@/lib/review-service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Rate limiting 
    const { success, limit, remaining, reset } = await reviewLimiter.limit(session.user.id);
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

    const body = await req.json() as { vocabularyItemId?: string; rating?: unknown };
    const { vocabularyItemId, rating } = body;

    if (!vocabularyItemId || typeof vocabularyItemId !== "string") {
      return NextResponse.json({ error: "Missing vocabularyItemId" }, { status: 400 });
    }

    const result = await processReview(vocabularyItemId, rating, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, updatedCard: result.updatedCard });
  } catch (err) {
    console.error("[POST /api/vocabulary/review] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}