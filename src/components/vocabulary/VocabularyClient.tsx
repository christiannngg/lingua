"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  VocabularyDashboardData,
  MasteryLabel,
  VocabularyItemWithMastery,
} from "@/app/actions/vocabulary";
import { WordCard } from "./WordCard";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabValue = "All" | MasteryLabel;

const TABS: TabValue[] = ["All", "New", "Learning", "Review", "Relearning", "Mastered"];

const LANGUAGE_LABELS: Record<string, string> = {
  es: "🇪🇸 Spanish",
  it: "🇮🇹 Italian",
};

// ─── Stat card ───────────────────────────────────────────────────────────────

const MASTERY_COLORS: Record<MasteryLabel, string> = {
  New:        "#6366f1",
  Learning:   "#eab308",
  Review:     "#22c55e",
  Relearning: "#f97316",
  Mastered:   "#06b6d4",
};

function StatCard({ label, count }: { label: MasteryLabel; count: number }) {
  const color = MASTERY_COLORS[label];
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
        {count}
      </span>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ activeTab, search }: { activeTab: TabValue; search: string }) {
  if (search) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="text-3xl">🔍</span>
        <p className="font-medium" style={{ color: "var(--foreground)" }}>
          No words match &quot;{search}&quot;
        </p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Try a different search term
        </p>
      </div>
    );
  }

  if (activeTab !== "All") {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="text-3xl">✨</span>
        <p className="font-medium" style={{ color: "var(--foreground)" }}>
          No {activeTab} words yet
        </p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Keep chatting — words will appear here as you learn
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="text-3xl">💬</span>
      <p className="font-medium" style={{ color: "var(--foreground)" }}>
        No vocabulary yet
      </p>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Start a conversation with your language partner to build your word list
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface VocabularyClientProps {
  data: VocabularyDashboardData;
  languages: string[];
  currentLang: string;
}

export function VocabularyClient({
  data,
  languages,
  currentLang,
}: VocabularyClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("All");
  const [search, setSearch] = useState("");

  // ── Filtering (client-side, no re-fetch) ───────────────────────────────

  const filteredItems = useMemo<VocabularyItemWithMastery[]>(() => {
    let items = data.items;

    // Tab filter
    if (activeTab !== "All") {
      items = items.filter((item) => item.masteryLabel === activeTab);
    }

    // Search filter — matches word or translation, case-insensitive
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.word.toLowerCase().includes(q) ||
          item.translation.toLowerCase().includes(q)
      );
    }

    return items;
  }, [data.items, activeTab, search]);

  // ── Tab count label ─────────────────────────────────────────────────────

  function tabCount(tab: TabValue): number {
    if (tab === "All") return data.counts.total;
    const key = tab.toLowerCase() as keyof typeof data.counts;
    return (data.counts[key] as number) ?? 0;
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between border-b px-6 py-5"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            Vocabulary
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {data.counts.total} {data.counts.total === 1 ? "word" : "words"} · CEFR {data.cefrLevel}
          </p>
        </div>

        {/* Language switcher — only shown when user has multiple languages */}
        {languages.length > 1 && (
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => router.push(`/dashboard/vocabulary?lang=${lang}` as never)}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: lang === currentLang ? "var(--color-brand-500)" : "var(--border)",
                  backgroundColor: lang === currentLang ? "var(--color-brand-100)" : "transparent",
                  color: lang === currentLang ? "var(--color-brand-700)" : "var(--muted-foreground)",
                }}
              >
                {LANGUAGE_LABELS[lang] ?? lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable content area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(["New", "Learning", "Review", "Relearning", "Mastered"] as MasteryLabel[]).map(
            (label) => (
              <StatCard
                key={label}
                label={label}
                count={
                  label === "New"        ? data.counts.new :
                  label === "Learning"   ? data.counts.learning :
                  label === "Review"     ? data.counts.review :
                  label === "Relearning" ? data.counts.relearning :
                  data.counts.mastered
                }
              />
            )
          )}
        </div>

        {/* Search + tab bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search input */}
          <div className="relative max-w-xs">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search words..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-brand-500)]"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--muted)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 overflow-x-auto rounded-lg border p-1"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
          >
            {TABS.map((tab) => {
              const count = tabCount(tab);
              const isActive = tab === activeTab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--color-brand-500)" : "transparent",
                    color: isActive ? "white" : "var(--muted-foreground)",
                  }}
                >
                  {tab}
                  <span
                    className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs"
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--border)",
                      color: isActive ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Word grid */}
        {filteredItems.length === 0 ? (
          <EmptyState activeTab={activeTab} search={search} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <WordCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}