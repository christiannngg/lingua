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
  const progressPct = (cardNumber / totalCards) * 100;
  const remaining = totalCards - cardNumber;

  return (
    <div className="flex w-full max-w-xl flex-col gap-5">

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(202,125,249,0.15)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #CA7DF9, #a855f7)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span className="font-medium">{remaining} cards remaining</span>
          <span style={{ color: "var(--color-brand-500)" }} className="font-semibold">
            {Math.round(progressPct)}% complete
          </span>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full rounded-2xl border bg-white overflow-hidden"
        style={{
          borderColor: "rgba(202,125,249,0.2)",
          boxShadow: "0 4px 24px rgba(202,125,249,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Card header — word + pos */}
        <div className="px-10 pt-16 pb-8 text-center border-b" style={{ borderColor: "rgba(202,125,249,0.1)" }}>

          {/* {card.romanization && (
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--color-brand-500)", opacity: 0.7 }}>
              {card.romanization}
            </p>
          )} */}

          <div className="flex items-baseline justify-center gap-3">
            <span
              className="text-5xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {card.lemma}
            </span>
            {card.partOfSpeech && (
              <span
                className="text-sm font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                {formatPos(card.partOfSpeech)}
              </span>
            )}
          </div>

          {/* Example sentence */}
          <div className="mt-5 flex items-start justify-center gap-2">
            {sentence ? (
              <div className="flex items-start gap-2 max-w-md">
                <p
                  className="border-l-2 pl-3 text-left text-sm italic"
                  style={{
                    borderColor: "var(--color-brand-500)",
                    color: "var(--muted-foreground)",
                    lineHeight: "1.6",
                  }}
                >
                  {sentence}
                </p>
                <button
                  onClick={() => onRegenerate(card.id)}
                  disabled={isRegenerating}
                  title="Generate a new example sentence"
                  className="mt-0.5 flex-shrink-0 rounded-md p-1 transition-all"
                  style={{
                    color: "var(--muted-foreground)",
                    opacity: isRegenerating ? 0.35 : 0.5,
                    cursor: isRegenerating ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isRegenerating)
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    if (!isRegenerating)
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.5";
                  }}
                >
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
                    style={{ animation: isRegenerating ? "spin 1s linear infinite" : "none" }}
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRegenerate(card.id)}
                disabled={isRegenerating}
                className="text-xs transition-opacity"
                style={{
                  color: "var(--color-brand-500)",
                  opacity: isRegenerating ? 0.4 : 0.7,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  cursor: isRegenerating ? "not-allowed" : "pointer",
                }}
              >
                {isRegenerating ? "Generating…" : "Generate example sentence"}
              </button>
            )}
          </div>
        </div>

        {/* Card body — translation reveal */}
        {revealed ? (
          <div className="px-10 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(202,125,249,0.05)", border: "1px solid rgba(202,125,249,0.1)" }}
              >
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
                >
                  Translation
                </p>
                <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                  {card.translation}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(202,125,249,0.05)", border: "1px solid rgba(202,125,249,0.1)" }}
              >
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
                >
                  {card.reps > 0 ? "Progress" : "First time"}
                </p>
                {card.reps > 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Reviewed <span className="font-semibold" style={{ color: "var(--foreground)" }}>{card.reps}×</span>
                    {card.lapses > 0 && (
                      <> · <span className="font-semibold" style={{ color: "#fca5a5" }}>{card.lapses} lapse{card.lapses !== 1 ? "s" : ""}</span></>
                    )}
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Learning this word for the first time
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center px-10 py-14">
            <button
              onClick={onReveal}
              className="rounded-xl px-10 py-3 text-sm font-semibold transition-all duration-150"
              style={{
                border: "1.5px solid var(--color-brand-500)",
                color: "var(--color-brand-500)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(202,125,249,0.08)";
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

      {/* Rating buttons */}
      {revealed && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            How well did you remember it?
          </p>
          <RatingButtons onRate={onRate} disabled={submitting} />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}