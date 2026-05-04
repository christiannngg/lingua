"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageFlag } from "@/components/ui/LanguageFlag";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { signOutAction } from "@/app/actions/auth";
import { useActiveLanguage } from "@/hooks/useActiveLanguage";
import { ConversationPanel } from "@/components/layout/ConversationPanel";
import { useSidebar } from "@/components/layout/SidebarContext";
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
  const { isExpanded } = useSidebar();
  const isInChat = pathname.startsWith("/chat/");

  const chatHref = `/chat/${activeLanguage}`;

  const allNavItems = [
    ...STATIC_NAV_ITEMS,
    { href: chatHref, label: "Chat", icon: MessageSquare } as const,
  ];

  return (
    <nav
      className="flex shrink-0 flex-col h-full overflow-hidden transition-[width] duration-200 ease-in-out"
      style={{
        width: isExpanded ? "224px" : "56px",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* When in chat AND expanded, show ConversationPanel; otherwise show standard nav */}
      {isInChat && conversations !== undefined && chatLanguage !== undefined && isExpanded ? (
        <ConversationPanel conversations={conversations} language={chatLanguage} />
      ) : (
        <div className="flex h-full flex-col gap-1 py-4 overflow-hidden">
          <ul className="flex flex-col gap-0.5 px-2">
            {allNavItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.label}>
                  <Link
                    href={item.href as never}
                    title={!isExpanded ? item.label : undefined}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? "#F3E8FF" : "transparent",
                      color: isActive ? "#7c3aed" : "#64748b",
                      justifyContent: isExpanded ? "flex-start" : "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#faf5ff";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#7c3aed";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                      }
                    }}
                  >
                    <item.icon
                      size={18}
                      aria-hidden="true"
                      strokeWidth={isActive ? 2.5 : 1.75}
                      style={{ flexShrink: 0 }}
                    />
                    {isExpanded && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Languages widget — only shown when expanded */}
          {isExpanded && languages.length > 0 && (
            <div className="mt-auto mx-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
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

          {/* Collapsed: language flags stacked, no labels */}
          {!isExpanded && languages.length > 0 && (
            <div className="mt-auto flex flex-col items-center gap-1.5 pb-2 px-2">
              {languages.map((lang) => (
                <LanguageFlag
                  key={lang}
                  language={lang}
                  className="w-5 h-auto rounded-sm"
                />
              ))}
            </div>
          )}

          {/* Logout */}
          <form
            action={signOutAction}
            className={`px-2 ${isExpanded && languages.length === 0 ? "mt-auto" : ""} ${!isExpanded ? "" : "mt-2"}`}
          >
            <button
              type="submit"
              title={!isExpanded ? "Log out" : undefined}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                color: "#94a3b8",
                justifyContent: isExpanded ? "flex-start" : "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#faf5ff";
                (e.currentTarget as HTMLButtonElement).style.color = "#7c3aed";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
              }}
            >
              <LogOut size={18} aria-hidden="true" strokeWidth={1.75} style={{ flexShrink: 0 }} />
              {isExpanded && "Log out"}
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}