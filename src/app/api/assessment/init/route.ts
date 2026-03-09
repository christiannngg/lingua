import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const language = req.nextUrl.searchParams.get("language");
    if (language !== "es" && language !== "it") {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const userLanguage = await prisma.userLanguage.findUnique({
      where: {
        userId_language: { userId: session.user.id, language },
      },
    });

    if (!userLanguage) {
      return NextResponse.json({ error: "Language not found" }, { status: 404 });
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