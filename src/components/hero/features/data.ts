export interface ChatMessage {
  from: "ai" | "user";
  text: string;
}

export interface SpotlightFeature {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: {
    messages: ChatMessage[];
    badge: string;
  };
}

export interface GridFeature {
  icon: string;
  title: string;
  description: string;
}

export const SPOTLIGHT_FEATURE: SpotlightFeature = {
  eyebrow: "Core Experience",
  title: "AI tutors that remember you",
  description:
    "Most language apps reset every session. Lingua doesn't. Your AI conversation partner recalls your past conversations, knows your interests, and picks up right where you left off. Real continuity. Real progress.",
  bullets: [
    "Adapts to your CEFR level in real time",
    "Remembers context across all sessions",
    "Always encourages & never judges",
  ],
  visual: {
    messages: [
      { from: "ai", text: "Ciao! Last time we talked about your trip to Rome. Did you end up going?" },
      { from: "user", text: "Sì! Ho visitato il Colosseo. Era incredibile." },
      { from: "ai", text: "Perfetto! Your use of the past tense there was spot on. Let's build on that. How would you describe what you ate?" },
    ],
    badge: "Remembers your last 12 conversations",
  },
};

export const GRID_FEATURES: GridFeature[] = [
  {
    icon: "",
    title: "Smart Vocabulary Tracking",
    description:
      "Words from every conversation are automatically extracted, lemmatized, and added to your personal vocabulary bank with zero manual effort.",
  },
  {
    icon: "",
    title: "Spaced Repetition Reviews",
    description:
      "FSRS-5 scheduling means your reviews land right before you forget. Spend less time studying. Remember more.",
  },
  {
    icon: "",
    title: "CEFR Assessment",
    description:
      "Start with a personalized placement test. Your level updates automatically as your conversations improve.",
  },
  {
    icon: "",
    title: "Grammar Insights",
    description:
      "Lingua quietly tracks grammar errors across sessions, surfacing your most common patterns so you know exactly what to fix.",
  },
  {
    icon: "",
    title: "Progress Dashboard",
    description:
      "Activity heatmaps, vocabulary growth charts, a CEFR progress ring to visualize your growth clearly.",
  },
  {
    icon: "",
    title: "9 Languages",
    description:
      "Spanish, French, Italian, Portuguese, German, Japanese, Mandarin, Korean, Russian all powered by the same intelligent engine.",
  },
];