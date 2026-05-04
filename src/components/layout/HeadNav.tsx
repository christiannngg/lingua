"use client";

import Link from "next/link";
import { Flame, Bell, TextAlignJustify } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useSidebar } from "@/components/layout/SidebarContext";

interface HeadNavProps {
  enrolledCodes: string[];
}

export function HeadNav({ enrolledCodes }: HeadNavProps) {
  const { toggle } = useSidebar();

  return (
    <header 
      className="flex h-14 w-full items-center justify-between pl-2 pr-4 shrink-0"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "#f1f5f9",
        zIndex: 10,
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3" style={{ paddingLeft: "0px" }}>
        <button
          onClick={toggle}
          className="flex items-center justify-center transition-colors"
          style={{
            color: "#64748b",
            background: "white",
            borderRadius: "50%",
            // border: "1px solid #f1f5f9",
            width: "40px",
            height: "40px",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#faf5ff";
            (e.currentTarget as HTMLButtonElement).style.color = "#7c3aed";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "white";
            (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
          }}
          aria-label="Toggle sidebar"
        >
          <TextAlignJustify size={18} />
        </button>
        <Link href="/dashboard">
          <span className="text-xl font-bold" style={{ color: "#CA7DF9" }}>
            Lingua
          </span>
        </Link>
      </div>

      {/* Right: language switcher, streak, bell, avatar */}
      <div className="flex items-center gap-3">
        {enrolledCodes.length > 0 && <LanguageSwitcher enrolledCodes={enrolledCodes} />}

        {/* Streak */}
        <button
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors"
          style={{ color: "#FF6B35" }}
          aria-label="Streak"
        >
          <Flame size={18} fill="#FF6B35" />
          <span>0</span>
        </button>

        {/* Notification bell */}
        <button
          className="rounded-md p-1.5 transition-colors"
          style={{ color: "var(--foreground)" }}
          aria-label="Notifications"
        >
          <Bell size={24} />
        </button>

        {/* Avatar */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
          style={{ backgroundColor: "#CA7DF9", color: "#FFFFFF" }}
          aria-label="Profile"
        />
      </div>
    </header>
  );
}