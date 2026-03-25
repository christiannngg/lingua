"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { signOutAction } from "@/app/actions/auth";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { ConversationPanel } from "@/components/layout/ConversationPanel";
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

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface SideNavProps {
  languages: string[];
  conversations?: Conversation[];
  chatLanguage?: string;
}

export function SideNav({ languages, conversations, chatLanguage }: SideNavProps) {
  const pathname = usePathname();
  const activeLanguage = useActiveLanguage(languages);
  const isInChat = pathname.startsWith("/chat/");

  const chatHref = `/chat/${activeLanguage}`;

  const allNavItems = [
    ...STATIC_NAV_ITEMS,
    { href: chatHref, label: "Chat", icon: MessageSquare } as const,
  ];

  return (
    <nav
      className="flex h-100 w-56 shrink-0 flex-col rounded-2xl m-3 shadow-sm"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #f1f5f9" }}
    >
      {isInChat && conversations !== undefined && chatLanguage !== undefined ? (
        <ConversationPanel conversations={conversations} language={chatLanguage} />
      ) : (
        <div className="flex h-full flex-col gap-1 p-4">
          <ul className="flex flex-col gap-0.5">
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
                      backgroundColor: isActive ? "#F3E8FF" : "transparent",
                      color: isActive ? "#7c3aed" : "#64748b",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#faf5ff";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#7c3aed";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                      }
                    }}
                  >
                    <item.icon size={18} aria-hidden="true" strokeWidth={isActive ? 2.5 : 1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Languages widget */}
          {languages.length > 0 && (
            <div className="mt-auto rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <p className="mb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Learning
              </p>
              {languages.map((lang) => (
                <div key={lang} className="flex items-center gap-2 py-0.5">
                  <LanguageFlag language={lang} className="w-5 h-auto rounded-sm" />
                  <span className="text-xs text-slate-500">{getLanguageDisplayName(lang)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Logout */}
          <form action={signOutAction} className={languages.length > 0 ? "mt-3" : "mt-auto"}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#faf5ff";
                (e.currentTarget as HTMLButtonElement).style.color = "#7c3aed";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
              }}
            >
              <LogOut size={18} aria-hidden="true" strokeWidth={1.75} />
              Log out
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
