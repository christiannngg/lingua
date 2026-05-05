"use client";

import { motion } from "framer-motion";
import { MASTERY_COLORS } from "@/lib/mastery-colors";
import type { WordOfTheDay } from "@/app/actions/progress";

type Props = {
  word: WordOfTheDay | null;
  language: string;
};

const POS_LABELS: Record<string, string> = {
  noun: "noun",
  verb: "verb",
  adjective: "adj.",
  adverb: "adv.",
  pronoun: "pron.",
  preposition: "prep.",
  conjunction: "conj.",
  interjection: "interj.",
  determiner: "det.",
};

function retentionLabel(stability: number): { label: string; color: string; bg: string } {
  if (stability === 0) return { label: "New",        color: MASTERY_COLORS.New.dot,        bg: MASTERY_COLORS.New.bg        };
  if (stability < 7)   return { label: "Learning",   color: MASTERY_COLORS.Learning.dot,   bg: MASTERY_COLORS.Learning.bg   };
  if (stability < 21)  return { label: "Review",     color: MASTERY_COLORS.Review.dot,     bg: MASTERY_COLORS.Review.bg     };
  return                      { label: "Mastered",   color: MASTERY_COLORS.Mastered.dot,   bg: MASTERY_COLORS.Mastered.bg   };
}

export function WordOfTheDayCard({ word }: Props) {
  if (!word) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-center min-h-[140px]">
        <p className="text-slate-600 text-sm text-center">
          Start a conversation to build your vocabulary.
          <br />
          <span className="text-slate-300">Your focus word will appear here.</span>
        </p>
      </div>
    );
  }

  const pos = word.partOfSpeech
    ? (POS_LABELS[word.partOfSpeech.toLowerCase()] ?? word.partOfSpeech)
    : null;

  const retention = retentionLabel(word.stability);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2">
            Word of the day
          </p>

          <div className="flex items-baseline gap-2">
            <motion.span
              className="text-3xl font-bold tracking-tight"
              style={{ color: "#020122" }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              {word.word}
            </motion.span>
            {pos && (
              <span className="text-xl text-slate-600 font-medium">{pos}</span>
            )}
          </div>

          <motion.p
            className="text-base text-slate-600 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            {word.translation}
          </motion.p>
        </div>

        {/* Retention badge */}
        <div
          className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: retention.bg, color: retention.color }}
        >
          {retention.label}
        </div>
      </div>

      {/* Example sentence */}
      {word.exampleSentence && (
        <motion.div
          className="border-l-2 pl-3 py-0.5"
          style={{ borderColor: "#CA7DF9" }}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <p className="text-md text-slate-600 italic">
            "{word.exampleSentence}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}