"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  isSupportedLanguage,
  getAllLanguages,
} from "@/lib/languages.config";

export type LanguageActionResult =
  | { success: true; language: string }
  | { success: false; error: string };

// ── Read actions (called from Server Components — throwing is fine) ──────────

export async function getUserLanguages() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.userLanguage.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Returns the full list of languages available for selection in the UI.
 * Reads directly from the config — no DB call needed.
 */
export async function getAvailableLanguages() {
  return getAllLanguages();
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

/**
 * Soft-deletes a language by setting isActive: false.
 * All associated vocabulary, grammar history, and conversation data is preserved —
 * re-adding the language restores full progress.
 *
 * Blocked if the user only has one active language — removing it would leave
 * them in a broken state with no language to learn.
 */
export async function removeUserLanguage(language: string): Promise<LanguageActionResult> {
  try {
    if (!isSupportedLanguage(language)) {
      return { success: false, error: `Unsupported language: ${language}` };
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthenticated" };

    // Count active languages before removal — block if this is the last one
    const activeCount = await prisma.userLanguage.count({
      where: { userId: session.user.id, isActive: true },
    });

    if (activeCount <= 1) {
      return {
        success: false,
        error: "You must have at least one active language.",
      };
    }

    await prisma.userLanguage.update({
      where: { userId_language: { userId: session.user.id, language } },
      data: { isActive: false },
    });

    return { success: true, language };
  } catch (err) {
    console.error("[removeUserLanguage] Error:", err);
    return { success: false, error: "Failed to remove language" };
  }
}