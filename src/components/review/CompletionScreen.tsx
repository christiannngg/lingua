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
  { rating: Rating.Again, label: "Again",  color: "#fca5a5" },
  { rating: Rating.Hard,  label: "Hard",   color: "#fdba74" },
  { rating: Rating.Good,  label: "Good",   color: "#86efac" },
  { rating: Rating.Easy,  label: "Easy",   color: "#67e8f9" },
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
    <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">

      {/* Hero */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full text-4xl"
          style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
        >
          🎉
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Session complete!
        </h2>
        <p className="flex items-center justify-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          You reviewed {totalReviewed} {totalReviewed === 1 ? "word" : "words"} in
          <LanguageFlag language={language} className="w-4 h-auto rounded-sm" />
          {getLanguageDisplayName(language)}
        </p>
      </div>

      {/* Stats */}
      <div
        className="w-full rounded-2xl border p-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
      >
        {/* Good rate */}
        <div className="mb-5 flex flex-col items-center gap-1">
          <span className="text-4xl font-bold" style={{ color: "#86efac" }}>
            {goodRate}%
          </span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Good + Easy rate
          </span>
        </div>

        {/* Rating breakdown */}
        <div className="flex justify-around">
          {RATING_DISPLAY.map(({ rating, label, color }) => (
            <div key={rating} className="flex flex-col items-center gap-1">
              <span className="text-xl font-bold" style={{ color }}>
                {ratingSummary[rating]}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Next review */}
        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Next review due
          </p>
          <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {formatNextReview(nextReviewDate)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-full flex-col gap-3">
        <a
          href="/dashboard/vocabulary"
          className="w-full rounded-xl border py-3 text-sm font-medium transition-colors text-center block"
          style={{
            borderColor: "var(--color-brand-500)",
            color: "var(--color-brand-500)",
          }}
        >
          View vocabulary
        </a>
        <button
          onClick={onReviewAgain}
          className="w-full rounded-xl py-3 text-sm font-medium"
          style={{
            backgroundColor: "var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          Review again
        </button>
      </div>
    </div>
  );
}