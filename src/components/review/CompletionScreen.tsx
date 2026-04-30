import { Rating } from "@/lib/fsrs/types";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";

interface RatingSummary {
  [Rating.Again]: number;
  [Rating.Hard]: number;
  [Rating.Good]: number;
  [Rating.Easy]: number;
}

interface CompletionScreenProps {
  totalReviewed: number;
  ratingSummary: RatingSummary;
  nextReviewDate: Date | null;
  onReviewAgain: () => void;
  language: string;
}

function formatNextReview(date: Date | null): string {
  if (!date) return "No upcoming reviews";
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Tomorrow";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
  return `In ${Math.ceil(diffDays / 30)} months`;
}

const RATING_DISPLAY = [
  { rating: Rating.Again, label: "Again", emoji: "↺", color: "#f87171" },
  { rating: Rating.Hard,  label: "Hard",  emoji: "😐", color: "#fb923c" },
  { rating: Rating.Good,  label: "Good",  emoji: "🙂", color: "#4ade80" },
  { rating: Rating.Easy,  label: "Easy",  emoji: "🚀", color: "#22d3ee" },
];

export function CompletionScreen({
  totalReviewed,
  ratingSummary,
  nextReviewDate,
  onReviewAgain,
  language,
}: CompletionScreenProps) {
  const goodRate = totalReviewed > 0
    ? Math.round(((ratingSummary[Rating.Good] + ratingSummary[Rating.Easy]) / totalReviewed) * 100)
    : 0;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">

      {/* Hero */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
          style={{
            background: "linear-gradient(135deg, rgba(202,125,249,0.15), rgba(168,85,247,0.1))",
            border: "1px solid rgba(202,125,249,0.2)",
          }}
        >
          🎉
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Session complete!
        </h2>
        <p className="flex items-center justify-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
          You reviewed <strong style={{ color: "var(--foreground)" }}>{totalReviewed} {totalReviewed === 1 ? "word" : "words"}</strong> in
          <LanguageFlag language={language} className="w-4 h-auto rounded-sm" />
          {getLanguageDisplayName(language)}
        </p>
      </div>

      {/* Stats card */}
      <div
        className="w-full rounded-2xl border bg-white p-6"
        style={{
          borderColor: "rgba(202,125,249,0.2)",
          boxShadow: "0 4px 24px rgba(202,125,249,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {/* Good rate */}
        <div className="mb-5 flex flex-col items-center gap-1">
          <span className="text-5xl font-bold" style={{ color: "#4ade80" }}>
            {goodRate}%
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Good + Easy rate
          </span>
        </div>

        {/* Rating breakdown */}
        <div className="flex justify-around">
          {RATING_DISPLAY.map(({ rating, label, emoji, color }) => (
            <div key={rating} className="flex flex-col items-center gap-1">
              <span className="text-lg leading-none">{emoji}</span>
              <span className="text-xl font-bold" style={{ color }}>
                {ratingSummary[rating]}
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Next review */}
        <div
          className="mt-5 rounded-xl p-3.5 text-center"
          style={{ backgroundColor: "rgba(202,125,249,0.06)", border: "1px solid rgba(202,125,249,0.12)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Next review due
          </p>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {formatNextReview(nextReviewDate)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        <a
          href="/dashboard/vocabulary"
          className="block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-150"
          style={{
            background: "linear-gradient(135deg, #CA7DF9, #a855f7)",
            color: "white",
            boxShadow: "0 4px 14px rgba(202,125,249,0.35)",
          }}
        >
          View vocabulary
        </a>
        <button
          onClick={onReviewAgain}
          className="w-full rounded-xl border py-3 text-sm font-medium transition-all duration-150"
          style={{
            borderColor: "rgba(202,125,249,0.2)",
            backgroundColor: "white",
            color: "var(--muted-foreground)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(202,125,249,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(202,125,249,0.2)";
          }}
        >
          Review again
        </button>
      </div>
    </div>
  );
}