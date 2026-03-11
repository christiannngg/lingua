import type { VocabularyItemWithMastery, MasteryLabel } from "@/app/actions/vocabulary";

// ─── Mastery badge styles ────────────────────────────────────────────────────

const MASTERY_STYLES: Record<MasteryLabel, { bg: string; text: string; dot: string }> = {
  New:        { bg: "rgba(99,102,241,0.12)",  text: "#a5b4fc", dot: "#6366f1" },
  Learning:   { bg: "rgba(234,179,8,0.12)",   text: "#fde047", dot: "#eab308" },
  Review:     { bg: "rgba(34,197,94,0.12)",   text: "#86efac", dot: "#22c55e" },
  Relearning: { bg: "rgba(249,115,22,0.12)",  text: "#fdba74", dot: "#f97316" },
  Mastered:   { bg: "rgba(6,182,212,0.12)",   text: "#67e8f9", dot: "#06b6d4" },
};

const PART_OF_SPEECH_ABBR: Record<string, string> = {
  noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.",
  pronoun: "pron.", preposition: "prep.", conjunction: "conj.",
  interjection: "interj.", article: "art.",
};

function formatPartOfSpeech(pos: string): string {
  return PART_OF_SPEECH_ABBR[pos.toLowerCase()] ?? pos;
}

function formatConversationLabel(conv: { title: string | null; createdAt: Date } | null): string {
  if (!conv) return "Unknown conversation";
  if (conv.title) return conv.title;
  return `Conversation from ${conv.createdAt.toISOString().slice(0, 10)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface WordCardProps {
  item: VocabularyItemWithMastery;
}

export function WordCard({ item }: WordCardProps) {
  const style = MASTERY_STYLES[item.masteryLabel];

  return (
    <div
      className="group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--muted)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = style.dot;
        (e.currentTarget as HTMLDivElement).style.backgroundColor = style.bg;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--muted)";
      }}
    >
      {/* Header row: word + mastery badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span
            className="text-base font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {item.lemma}
          </span>
          {item.partOfSpeech && (
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {formatPartOfSpeech(item.partOfSpeech)}
            </span>
          )}
        </div>

        {/* Mastery badge */}
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          <span
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ backgroundColor: style.dot }}
          />
          {item.masteryLabel}
        </span>
      </div>

      {/* Translation */}
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {item.translation}
      </p>

      {/* Example sentence */}
      {item.exampleSentence && (
        <p
          className="border-l-2 pl-3 text-xs italic"
          style={{
            borderColor: style.dot,
            color: "var(--muted-foreground)",
            opacity: 0.8,
          }}
        >
          {item.exampleSentence}
        </p>
      )}

      {/* Footer: source conversation + reps */}
      <div
        className="mt-auto flex items-center justify-between pt-1 text-xs"
        style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
      >
        {/* <span className="truncate" title={formatConversationLabel(item.sourceConversation)}>
          📖 {formatConversationLabel(item.sourceConversation)}
        </span> */}
        {item.reps > 0 && (
          <span className="shrink-0 pl-2">
            {item.reps} {item.reps === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>
    </div>
  );
}