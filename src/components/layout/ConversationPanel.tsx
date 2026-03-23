"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MoreVertical, ChevronLeft } from "lucide-react";
import { deleteConversation } from "@/app/actions/conversations";
import { getLanguageDisplayName } from "@/lib/languages.config";
import { LanguageFlag } from "@/components/ui/LanguageFlag";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface MenuState {
  convId: string;
  x: number;
  y: number;
}

interface ConversationPanelProps {
  conversations: Conversation[];
  language: string;
}

export function ConversationPanel({
  conversations,
  language,
}: ConversationPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Active conversation derived from URL — no prop needed
  const activeConvId = searchParams.get("conv");
  const isNewConversation = activeConvId === null;

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close context menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleDotsClick(e: React.MouseEvent, convId: string) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu(menu?.convId === convId ? null : { convId, x: rect.right, y: rect.bottom });
  }

  function handleDelete(convId: string) {
    setMenu(null);
    startTransition(async () => {
      await deleteConversation(convId);
      if (activeConvId === convId) {
        router.push(`/chat/${language}` as never);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div
        className="flex flex-col gap-2 border-b p-3"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Back + language label */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium transition-colors"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
            }}
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={14} />
      
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <LanguageFlag language={language} className="w-4 h-auto rounded-sm" />
            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
              {getLanguageDisplayName(language)}
            </span>
          </div>
        </div>

        {/* New conversation button */}
        <button
          onClick={() => {
            if (!isNewConversation) router.push(`/chat/${language}` as never);
          }}
          disabled={isNewConversation}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{
            backgroundColor: isNewConversation ? "transparent" : "#CA7DF914",
            border: `1px solid ${isNewConversation ? "var(--border)" : "#CA7DF9"}`,
            color: isNewConversation ? "var(--muted-foreground)" : "#CA7DF9",
            cursor: isNewConversation ? "default" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isNewConversation) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#CA7DF924";
            }
          }}
          onMouseLeave={(e) => {
            if (!isNewConversation) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#CA7DF914";
            }
          }}
        >
          <Plus size={13} />
          New conversation
        </button>

        {/* Section label */}
        <p
          className="px-1 text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          Past sessions
        </p>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto" style={{ opacity: isPending ? 0.6 : 1 }}>
        {conversations.length === 0 ? (
          <p className="p-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
            No past conversations yet.
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            return (
              <div
                key={conv.id}
                className="relative flex items-center border-b"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: isActive ? "#CA7DF914" : "transparent",
                }}
              >
                <a
                  href={`/chat/${language}?conv=${conv.id}`}
                  className="min-w-0 flex-1 block px-3 py-2.5"
                  style={{ textDecoration: "none" }}
                >
                  <p
                    className="text-xs font-medium truncate"
                    style={{ color: isActive ? "#CA7DF9" : "var(--foreground)" }}
                  >
                    {conv.title ?? "New conversation"}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {new Date(conv.updatedAt).toISOString().slice(0, 10)}
                  </p>
                </a>

                <button
                  onClick={(e) => handleDotsClick(e, conv.id)}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
                  }}
                  aria-label="Conversation options"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Context menu */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 overflow-hidden rounded-xl border shadow-lg"
          style={{
            top: menu.y + 4,
            left: menu.x - 140,
            width: "140px",
            backgroundColor: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          <button
            disabled
            className="block w-full px-4 py-2.5 text-left text-sm"
            style={{ color: "var(--muted-foreground)", cursor: "not-allowed" }}
          >
            Rename
          </button>
          <div className="h-px" style={{ backgroundColor: "var(--border)" }} />
          <button
            onClick={() => handleDelete(menu.convId)}
            className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
            style={{ color: "#f87171" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2d1b1b";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}