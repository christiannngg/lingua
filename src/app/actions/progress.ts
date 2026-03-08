"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const CEFR_TO_NUMERIC: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export type CefrDataPoint = {
  date: string;
  cefrLevel: string;
  numericLevel: number;
  isLevelUp: boolean;
};

export async function getCefrHistory(language: string): Promise<CefrDataPoint[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthenticated");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: {
      userId_language: { userId: session.user.id, language },
    },
    include: {
      assessmentHistory: {
        orderBy: { takenAt: "asc" },
      },
    },
  });

  if (!userLanguage || userLanguage.assessmentHistory.length === 0) return [];

  const points: CefrDataPoint[] = userLanguage.assessmentHistory.map((entry, index, arr) => {
    const numericLevel = CEFR_TO_NUMERIC[entry.cefrLevel] ?? 1;
    const prev = index > 0 ? arr[index - 1] : null;
    const prevNumeric = prev ? (CEFR_TO_NUMERIC[prev.cefrLevel] ?? 1) : null;
    const isLevelUp = prevNumeric !== null && numericLevel > prevNumeric;

    return {
      date: entry.takenAt.toISOString().slice(0, 10),
      cefrLevel: entry.cefrLevel,
      numericLevel,
      isLevelUp,
    };
  });

  return points;
}