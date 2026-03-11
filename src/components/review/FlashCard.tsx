import type { ReviewCard } from "@/app/actions/review";
import { RatingButtons } from "./RatingButtons";
import { Rating } from "@/lib/fsrs/types";

interface FlashCardProps {
  card: ReviewCard;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: Rating) => void;
  onRegenerate: (cardId: string) => void;
  submitting: boolean;
  isRegenerating: boolean;
  cardNumber: number;
  totalCards: number;
  sentence: string | null;
}

const PART_OF_SPEECH_ABBR: Record<string, string> = {
  noun: "n.",
  verb: "v.",
  adjective: "adj.",
  adverb: "adv.",
  pronoun: "pron.",
  preposition: "prep.",
  conjunction: "conj.",
  interjection: "interj.",
  article: "art.",
};

function formatPos(pos: string): string {
  return PART_OF_SPEECH_ABBR[pos.toLowerCase()] ?? pos;
}

export function FlashCard({
  card,
  revealed,
  onReveal,
  onRate,
  onRegenerate,
  submitting,
  isRegenerating,
  cardNumber,
  totalCards,
  sentence,
}: FlashCardProps) {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">

      {/* Progress indicator */}
      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        <span>{cardNumber} / {totalCards}</span>
        <div
          className="mx-4 h-1 flex-1 overflow-hidden rounded-full"
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
              {card.lemma}
            </span>
            {card.partOfSpeech && (
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {formatPos(card.partOfSpeech)}
              </span>
            )}
          </div>

          {/* Example sentence + regenerate button */}
          {sentence ? (
            <div className="mt-3 flex w-full max-w-sm items-start gap-2">
              <p
                className="flex-1 border-l-2 pl-3 text-left text-sm italic"
                style={{
                  borderColor: "var(--color-brand-500)",
                  color: "var(--muted-foreground)",
                }}
              >
                {sentence}
              </p>
              <button
                onClick={() => onRegenerate(card.id)}
                disabled={isRegenerating}
                title="Generate a new example sentence"
                className="mt-0.5 flex-shrink-0 rounded-md p-1 transition-opacity"
                style={{
                  color: "var(--muted-foreground)",
                  opacity: isRegenerating ? 0.4 : 0.6,
                  cursor: isRegenerating ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isRegenerating)
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  if (!isRegenerating)
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
                }}
              >
                {/* Inline SVG refresh icon — no icon library dependency */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    animation: isRegenerating ? "spin 1s linear infinite" : "none",
                  }}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
              </button>
            </div>
          ) : (
            /* No sentence yet — show the regenerate button alone so user can generate one */
            <button
              onClick={() => onRegenerate(card.id)}
              disabled={isRegenerating}
              className="mt-3 text-xs underline-offset-2 transition-opacity"
              style={{
                color: "var(--muted-foreground)",
                opacity: isRegenerating ? 0.4 : 0.6,
                textDecoration: "underline",
                cursor: isRegenerating ? "not-allowed" : "pointer",
              }}
            >
              {isRegenerating ? "Generating…" : "Generate example sentence"}
            </button>
          )}
        </div>

        {/* Divider + translation reveal */}
        {revealed ? (
          <div
            className="mt-6 border-t pt-6 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <p
              className="text-sm font-medium uppercase tracking-widest"
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
            >
              translation
            </p>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {card.translation}
            </p>
            {card.reps > 0 && (
              <p
                className="mt-2 text-xs"
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
              >
                reviewed {card.reps} {card.reps === 1 ? "time" : "times"} ·{" "}
                {card.lapses} {card.lapses === 1 ? "lapse" : "lapses"}
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
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-brand-100)";
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

      {/* Spin keyframe for the regenerate icon */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}