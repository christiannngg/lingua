"use client";

import { motion } from "framer-motion";
import { StartSessionCard } from "@/components/dashboard/StartSessionCard";
import { ReviewCard } from "@/components/dashboard/ReviewCard";
import { WeeklySummary } from "@/components/progress/WeeklySummary";
import { CefrHistoryChart } from "@/components/progress/CefrHistoryChart";
import { VocabularyGrowthChart } from "@/components/progress/VocabularyGrowthChart";
import { GrammarHeatmap } from "@/components/progress/GrammarHeatmap";
import type { SupportedLanguage } from "@/lib/languages.config";
import type {
  CefrDataPoint,
  VocabGrowthPoint,
  GrammarConceptRow,
  WeeklySummaryResult,
} from "@/app/actions/progress";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

type Props = {
  firstName: string;
  languageName: string;
  cefrLevel: string;
  activeLanguage: SupportedLanguage;
  enrolledCodes: SupportedLanguage[];
  dueCount: number;
  cefrHistory: CefrDataPoint[];
  vocabGrowth: VocabGrowthPoint[];
  grammarData: GrammarConceptRow[];
  weeklySummary: WeeklySummaryResult | null;
};

export function DashboardShell({
  firstName,
  languageName,
  cefrLevel,
  activeLanguage,
  enrolledCodes,
  dueCount,
  cefrHistory,
  vocabGrowth,
  grammarData,
  weeklySummary,
}: Props) {
  return (
    <motion.main
      className="max-w-5xl mx-auto px-6 py-8 space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-bold" style={{ color: "#020122" }}>
          Welcome back, {firstName}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {languageName} · Level {cefrLevel}
        </p>
      </motion.div>

      {/* ── Top action grid ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <StartSessionCard language={activeLanguage} />
        </div>
        <div>
          <ReviewCard dueCount={dueCount} languages={enrolledCodes} />
        </div>
      </motion.div>

      {/* ── Weekly Summary ── */}
      <motion.section variants={fadeUp}>
        <SectionHeading>This Week</SectionHeading>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <WeeklySummary initial={weeklySummary} language={activeLanguage} />
        </div>
      </motion.section>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.section variants={fadeUp}>
          <SectionHeading>CEFR Level History</SectionHeading>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <CefrHistoryChart data={cefrHistory} language={activeLanguage} />
          </div>
        </motion.section>

        <motion.section variants={fadeUp}>
          <SectionHeading>Vocabulary Growth</SectionHeading>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <VocabularyGrowthChart data={vocabGrowth} />
          </div>
        </motion.section>
      </div>

      {/* ── Grammar Patterns ── */}
      <motion.section variants={fadeIn}>
        <SectionHeading>Grammar Patterns</SectionHeading>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <GrammarHeatmap data={grammarData} />
        </div>
      </motion.section>
    </motion.main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}