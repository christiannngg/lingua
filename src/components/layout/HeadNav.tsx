"use client";

import Link from "next/link";
import { Menu, Flame, Bell } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface HeadNavProps {
  enrolledCodes: string[];
}

export function HeadNav({ enrolledCodes }: HeadNavProps) {
  return (
    <header
      className="flex h-14 w-full items-center justify-between px-6"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1.5 transition-colors"
          style={{ color: "var(--foreground)" }}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <Link href="/dashboard">
          <span className="text-lg font-bold" style={{ color: "#CA7DF9" }}>
            Lingua
          </span>
        </Link>
      </div>

      {/* Right: language switcher, streak, bell, avatar */}
      <div className="flex items-center gap-3">
        {/* Language switcher — only shown when user has enrolled languages */}
        {enrolledCodes.length > 0 && (
          <LanguageSwitcher enrolledCodes={enrolledCodes} />
        )}

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