"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { signOutAction } from "@/app/actions/auth";

const NAV_ITEMS: {
  href: "/dashboard" | "/learn" | "/dashboard/review" | "/dashboard/vocabulary" | "/settings" | "/chat/es";
  label: string;
  icon: string;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/learn", label: "Learn", icon: "💬" },
  { href: "/dashboard/review", label: "Review", icon: "🔁" },
  { href: "/dashboard/vocabulary", label: "Vocabulary", icon: "📖" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/chat/es", label: "Chat", icon: "💬" },
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
          <p className="mb-2 font-medium">Learning</p>
          {languages.map((lang) => (
            <div key={lang} className="flex items-center gap-2 py-0.5">
              <LanguageFlag language={lang} className="w-5 h-auto rounded-sm" />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {getLanguageDisplayName(lang)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Logout */}
      <form action={signOutAction} className={languages.length > 0 ? "mt-3" : "mt-auto"}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: "var(--muted-foreground)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-brand-100)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-brand-700)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
          }}
        >
          <span aria-hidden="true">→</span>
          Log out
        </button>
      </form>
    </nav>
  );
}