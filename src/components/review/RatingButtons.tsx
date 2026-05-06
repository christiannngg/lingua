import { Rating } from "@/lib/fsrs/types";

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

const RATINGS: {
  rating: Rating;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    rating: Rating.Again,
    label: "Again",
    color: "#f87171",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
  },
  {
    rating: Rating.Hard,
    label: "Hard",
    color: "#fb923c",
    bg: "rgba(249,115,22,0.07)",
    border: "rgba(249,115,22,0.2)",
  },
  {
    rating: Rating.Good,
    label: "Good",
    color: "#4ade80",
    bg: "rgba(34,197,94,0.07)",
    border: "rgba(34,197,94,0.2)",
  },
  {
    rating: Rating.Easy,
    label: "Easy",
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.07)",
    border: "rgba(6,182,212,0.2)",
  },
];

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  return (
    <div className="flex w-full gap-3">
      {RATINGS.map(({ rating, label, color, bg, border }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className="flex flex-1 items-center justify-center rounded-xl border py-3.5 transition-all duration-150 disabled:opacity-40"
          style={{
            borderColor: border,
            backgroundColor: bg,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.transform = "translateY(-2px)";
              btn.style.boxShadow = `0 4px 12px ${border}`;
              btn.style.borderColor = color.replace(")", ", 0.5)").replace("rgb", "rgba");
            }
          }}
          //  Added !disabled guard to match onMouseEnter — prevents
          // inline style resets from firing when the button is disabled.
          onMouseLeave={(e) => {
            if (!disabled) {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.transform = "translateY(0)";
              btn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
              btn.style.borderColor = border;
            }
          }}
        >
          <span className="text-sm font-semibold" style={{ color }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}