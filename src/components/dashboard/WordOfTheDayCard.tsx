"use client";

import { motion } from "framer-motion";
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

// Stability → a human-readable retention label
function retentionLabel(stability: number): { label: string; color: string } {
  if (stability === 0)  return { label: "New",      color: "#94a3b8" };
  if (stability < 2)    return { label: "Fragile",   color: "#f97316" };
  if (stability < 7)    return { label: "Learning",  color: "#eab308" };
  if (stability < 21)   return { label: "Familiar",  color: "#38bdf8" };
  return                       { label: "Strong",    color: "#22c55e" };
}

export function WordOfTheDayCard({ word }: Props) {
  if (!word) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-center min-h-[140px]">
        <p className="text-slate-400 text-sm text-center">
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
          {/* Label */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Focus Word
          </p>

          {/* Word + POS */}
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
              <span className="text-xs text-slate-400 font-medium italic">{pos}</span>
            )}
          </div>

          {/* Translation */}
          <motion.p
            className="text-base text-slate-500 mt-0.5"
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
          style={{
            background: `${retention.color}18`,
            color: retention.color,
          }}
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
          <p className="text-sm text-slate-500 leading-relaxed italic">
            "{word.exampleSentence}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}