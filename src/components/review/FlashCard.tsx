import type { ReviewCard } from "@/app/actions/review";
import { RatingButtons } from "./RatingButtons";
import { Rating } from "@/lib/fsrs/types";

interface FlashCardProps {
  card: ReviewCard;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: Rating) => void;
  submitting: boolean;
  cardNumber: number;
  totalCards: number;
}

const PART_OF_SPEECH_ABBR: Record<string, string> = {
  noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.",
  pronoun: "pron.", preposition: "prep.", conjunction: "conj.",
  interjection: "interj.", article: "art.",
};

function formatPos(pos: string): string {
  return PART_OF_SPEECH_ABBR[pos.toLowerCase()] ?? pos;
}

export function FlashCard({
  card,
  revealed,
  onReveal,
  onRate,
  submitting,
  cardNumber,
  totalCards,
}: FlashCardProps) {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">

      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
        <span>{cardNumber} / {totalCards}</span>
        <div
          className="h-1 flex-1 mx-4 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(cardNumber / totalCards) * 100}%`,
              backgroundColor: "var(--color-brand-500)",
            }}
          />
        </div>
        <span>{totalCards - cardNumber} left</span>
      </div>

      {/* Card face */}
      <div
        className="relative w-full rounded-2xl border p-8"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--muted)",
          minHeight: "280px",
        }}
      >
        {/* Word + part of speech */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {card.word}
            </span>
            {card.partOfSpeech && (
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {formatPos(card.partOfSpeech)}
              </span>
            )}
          </div>

          {/* Example sentence — always visible */}
          {card.exampleSentence && (
            <p
              className="mt-3 max-w-sm border-l-2 pl-3 text-left text-sm italic"
              style={{
                borderColor: "var(--color-brand-500)",
                color: "var(--muted-foreground)",
              }}
            >
              {card.exampleSentence}
            </p>
          )}
        </div>

        {/* Divider + translation reveal */}
        {revealed ? (
          <div
            className="mt-6 border-t pt-6 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
              translation
            </p>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {card.translation}
            </p>
            {card.reps > 0 && (
              <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
                reviewed {card.reps} {card.reps === 1 ? "time" : "times"} · {card.lapses} {card.lapses === 1 ? "lapse" : "lapses"}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 flex justify-center">
            <button
              onClick={onReveal}
              className="rounded-xl border px-8 py-3 text-sm font-medium transition-all duration-150"
              style={{
                borderColor: "var(--color-brand-500)",
                color: "var(--color-brand-500)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-brand-100)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              Show translation
            </button>
          </div>
        )}
      </div>

      {/* Rating buttons — only shown after reveal */}
      {revealed && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
            How well did you remember it?
          </p>
          <RatingButtons onRate={onRate} disabled={submitting} />
        </div>
      )}
    </div>
  );
}