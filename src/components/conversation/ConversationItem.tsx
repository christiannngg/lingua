"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useTransition } from "react";
import { Trash2, Pencil, EllipsisVertical } from "lucide-react";
import { deleteConversation } from "@/app/actions/conversations";
import { useRouter } from "next/navigation";

interface ConversationItemProps {
  id: string;
  title: string | null;
  language: string;
  isActive: boolean;
  activeConvId: string | null;
}

export function ConversationItem({
  id,
  title,
  language,
  isActive,
  activeConvId,
}: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function handleDelete() {
    setMenuOpen(false);
    startTransition(async () => {
      await deleteConversation(id);
      // If we deleted the active conversation, go to fresh chat
      if (activeConvId === id) {
        router.push(`/chat/${language}` as never);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      className="group relative flex items-center rounded-lg transition-colors"
      style={{
        backgroundColor: isActive ? "#F3E8FF" : "transparent",
        opacity: isPending ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#faf5ff";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
      }}
    >
      {/* Conversation link */}
      <Link
        href={`/chat/${language}?conv=${id}` as never}
        className="min-w-0 flex-1 truncate px-3 py-1.5 text-xs"
        style={{ color: isActive ? "#CA7DF9" : "#64748b", textDecoration: "none" }}
      >
        {title ?? "New conversation"}
      </Link>

      {/* Three-dot button — visible on hover or when menu is open */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          opacity: menuOpen ? 1 : undefined,
          color: "#94a3b8",
          cursor: "pointer"
        }}
        aria-label="Conversation options"
        
      >
        <EllipsisVertical size={13} />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 w-44 overflow-hidden rounded-xl border shadow-lg"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#f1f5f9",
            marginTop: "2px",
          }}
        >
          {/* Rename — disabled for now */}
          <button
            disabled
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs"
            style={{ color: "#cbd5e1", cursor: "not-allowed" }}
          >
            <Pencil size={13} />
            Rename
          </button>

          <div style={{ height: "1px", backgroundColor: "#f1f5f9" }} />

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors"
            style={{ color: "#ef4444", cursor: "pointer"}}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <Trash2 size={13} />
            Delete conversation
          </button>
        </div>
      )}
    </div>
  );
}