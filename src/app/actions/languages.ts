"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type LanguageActionResult =
  | { success: true; language: string }
  | { success: false; error: string };

const SUPPORTED_LANGUAGES = ["es", "it"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

// ── Read actions (called from Server Components — throwing is fine) ──────────

export async function getUserLanguages() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.userLanguage.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

// ── Mutating actions (called from client interactions — return result) ────────

export async function addUserLanguage(language: string): Promise<LanguageActionResult> {
  try {
    if (!isSupportedLanguage(language)) {
      return { success: false, error: `Unsupported language: ${language}` };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthenticated" };

    await prisma.userLanguage.upsert({
      where: { userId_language: { userId: session.user.id, language } },
      update: { isActive: true },
      create: { userId: session.user.id, language },
    });

    return { success: true, language };
  } catch (err) {
    console.error("[addUserLanguage] Error:", err);
    return { success: false, error: "Failed to add language" };
  }
}

export async function resetAssessment(language: string): Promise<LanguageActionResult> {
  try {
    if (!isSupportedLanguage(language)) {
      return { success: false, error: `Unsupported language: ${language}` };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthenticated" };

    const userLanguage = await prisma.userLanguage.findUnique({
      where: { userId_language: { userId: session.user.id, language } },
    });

    if (!userLanguage) return { success: false, error: "Language not found" };

    // Log current level to history before overwriting
    await prisma.assessmentHistory.create({
      data: {
        userLanguageId: userLanguage.id,
        cefrLevel: userLanguage.cefrLevel,
      },
    });

    // Reset assessment state
    await prisma.userLanguage.update({
      where: { id: userLanguage.id },
      data: { assessmentCompleted: false },
    });

    return { success: true, language };
  } catch (err) {
    console.error("[resetAssessment] Error:", err);
    return { success: false, error: "Failed to reset assessment" };
  }
}