"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { signOutAction } from "@/app/actions/auth";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import {
  LayoutDashboard,
  BookOpenText,
  Languages,
  Settings,
  MessageSquare,
  LucideIcon,
  LogOut,
} from "lucide-react";

const STATIC_NAV_ITEMS: {
  href: "/dashboard" | "/dashboard/review" | "/dashboard/vocabulary" | "/settings";
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/review", label: "Review", icon: BookOpenText },
  { href: "/dashboard/vocabulary", label: "Vocabulary", icon: Languages },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SideNavProps {
  languages: string[];
}

export function SideNav({ languages }: SideNavProps) {
  const pathname = usePathname();
  const activeLanguage = useActiveLanguage(languages);
  const chatHref = `/chat/${activeLanguage}`;

  // All nav items including the dynamic chat link
  const allNavItems = [
    ...STATIC_NAV_ITEMS,
    { href: chatHref, label: "Chat", icon: MessageSquare } as const,
  ];

  return (
    <nav
      className="flex h-full w-56 shrink-0 flex-col gap-1 p-4"
      style={{ backgroundColor: "var(--muted)" }}
    >
      {/* Navigation links */}
      <ul className="flex flex-col gap-1">
        {allNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.label}>
              <Link
                href={item.href as never}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? "#FFFFFF" : "transparent",
                  color: isActive ? "#CA7DF9" : "var(--foreground)",
                }}
              >
                <item.icon size={24} aria-hidden="true" />
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
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF";
            (e.currentTarget as HTMLButtonElement).style.color = "#CA7DF9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
          }}
        >
          <LogOut size={24} aria-hidden="true" />
          Log out
        </button>
      </form>
    </nav>
  );
}