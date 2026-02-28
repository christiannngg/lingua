"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LANGUAGE_LABELS: Record<string, string> = {
  es: "🇪🇸 Spanish",
  it: "🇮🇹 Italian",
};

const NAV_ITEMS: { href: "/dashboard" | "/learn" | "/review" | "/vocabulary" | "/settings"; label: string; icon: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/learn", label: "Learn", icon: "💬" },
  { href: "/review", label: "Review", icon: "🔁" },
  { href: "/vocabulary", label: "Vocabulary", icon: "📖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

interface AppNavProps {
  languages: string[];
}

export function AppNav({ languages }: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-full w-56 shrink-0 flex-col gap-1 border-r p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)" }}
    >
      {/* Logo */}
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="text-xl font-bold" style={{ color: "var(--color-brand-500)" }}>
          Lingua
        </span>
      </Link>

      {/* Navigation links */}
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href as never}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--color-brand-100)" : "transparent",
                  color: isActive ? "var(--color-brand-700)" : "var(--foreground)",
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Active languages */}
      {languages.length > 0 && (
        <div
          className="mt-auto rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="mb-1 font-medium">Learning</p>
          {languages.map((lang) => (
            <p key={lang} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {LANGUAGE_LABELS[lang] ?? lang}
            </p>
          ))}
        </div>
      )}
    </nav>
  );
}