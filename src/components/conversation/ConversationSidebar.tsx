"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { deleteConversation } from "@/app/actions/conversations";

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  language: string;
  activeConvId: string | null;
}

interface MenuState {
  convId: string;
  x: number;
  y: number;
}

export function ConversationSidebar({
  conversations,
  language,
  activeConvId,
}: ConversationSidebarProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const isNewConversation = activeConvId === null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        window.location.href = `/chat/${language}`;
      } else {
        window.location.reload();
      }
    });
  }

  function handleNewConversation() {
    if (isNewConversation) return;
    window.location.href = `/chat/${language}`;
  }

  return (
    <div
      style={{
        width: "260px",
        borderRight: "1px solid #2d2d44",
        backgroundColor: "#13131f",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
      }}
    >
      {/* Header with New Conversation button */}
      <div
        style={{
          padding: "0.75rem",
          borderBottom: "1px solid #2d2d44",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <button
          onClick={handleNewConversation}
          disabled={isNewConversation}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: `1px solid ${isNewConversation ? "#2d2d44" : "#4f46e5"}`,
            backgroundColor: isNewConversation ? "transparent" : "rgba(79, 70, 229, 0.1)",
            color: isNewConversation ? "#374151" : "#818cf8",
            fontSize: "0.8125rem",
            fontWeight: 500,
            cursor: isNewConversation ? "default" : "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isNewConversation) {
              e.currentTarget.style.backgroundColor = "rgba(79, 70, 229, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isNewConversation) {
              e.currentTarget.style.backgroundColor = "rgba(79, 70, 229, 0.1)";
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }}
          >
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
          </svg>
          {isNewConversation ? "New conversation" : "New conversation"}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: "0.6875rem",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            paddingLeft: "0.25rem",
          }}
        >
          Past sessions
        </p>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {conversations.length === 0 ? (
          <p style={{ padding: "1rem", fontSize: "0.8125rem", color: "#475569", margin: 0 }}>
            No past conversations yet.
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #1e1e2e",
                backgroundColor: conv.id === activeConvId ? "#1e1e3a" : "transparent",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <a
                href={`/chat/${language}?conv=${conv.id}`}
                style={{
                  flex: 1,
                  display: "block",
                  padding: "0.75rem 0.5rem 0.75rem 1rem",
                  textDecoration: "none",
                  color: "#cbd5e1",
                  fontSize: "0.8125rem",
                  lineHeight: 1.4,
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {conv.title ?? "New conversation"}
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#475569" }}>
                  {new Date(conv.updatedAt).toISOString().slice(0, 10)}
                </p>
              </a>

              <button
                onClick={(e) => handleDotsClick(e, conv.id)}
                style={{
                  flexShrink: 0,
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#475569",
                  borderRadius: "0.375rem",
                  marginRight: "0.25rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                aria-label="Conversation options"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  style={{ width: "1rem", height: "1rem" }}
                >
                  <circle cx="8" cy="2" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="8" cy="14" r="1.5" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Dropdown menu */}
      {menu && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menu.y + 4,
            left: menu.x - 140,
            width: "140px",
            backgroundColor: "#1e1e2e",
            border: "1px solid #2d2d44",
            borderRadius: "0.5rem",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setMenu(null)}
            style={{
              width: "100%",
              padding: "0.625rem 1rem",
              textAlign: "left",
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "0.875rem",
              cursor: "not-allowed",
              display: "block",
            }}
            disabled
          >
            Rename
          </button>
          <div style={{ height: "1px", backgroundColor: "#2d2d44" }} />
          <button
            onClick={() => handleDelete(menu.convId)}
            style={{
              width: "100%",
              padding: "0.625rem 1rem",
              textAlign: "left",
              background: "none",
              border: "none",
              color: "#f87171",
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d1b1b")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}