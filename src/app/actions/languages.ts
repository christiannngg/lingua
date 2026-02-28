"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const SUPPORTED_LANGUAGES = ["es", "it"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

export async function addUserLanguage(language: string) {
  if (!isSupportedLanguage(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  await prisma.userLanguage.upsert({
    where: { userId_language: { userId: session.user.id, language } },
    update: { isActive: true },
    create: { userId: session.user.id, language },
  });

  return language; 
}

export async function getUserLanguages() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  return prisma.userLanguage.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function resetAssessment(language: string) {
  if (!isSupportedLanguage(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
  });

  if (!userLanguage) throw new Error("Language not found");

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

  return language;
}