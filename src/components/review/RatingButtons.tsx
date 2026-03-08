import { Rating } from "@/lib/fsrs/types";

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

const RATINGS: {
  rating: Rating;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    rating: Rating.Again,
    label: "Again",
    sublabel: "< 1 day",
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
  },
  {
    rating: Rating.Hard,
    label: "Hard",
    sublabel: "short",
    color: "#fdba74",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.3)",
  },
  {
    rating: Rating.Good,
    label: "Good",
    sublabel: "normal",
    color: "#86efac",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
  },
  {
    rating: Rating.Easy,
    label: "Easy",
    sublabel: "longer",
    color: "#67e8f9",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.3)",
  },
];

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  return (
    <div className="flex w-full gap-3">
      {RATINGS.map(({ rating, label, sublabel, color, bg, border }) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 transition-all duration-150 disabled:opacity-40"
          style={{ borderColor: border, backgroundColor: bg }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = bg.replace("0.1", "0.2");
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = bg;
          }}
        >
          <span className="text-sm font-semibold" style={{ color }}>
            {label}
          </span>
          <span className="text-xs" style={{ color, opacity: 0.7 }}>
            {sublabel}
          </span>
        </button>
      ))}
    </div>
  );
}