"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#1e1e2e",
        border: "1px solid #7f1d1d",
        color: "#f87171",
        padding: "0.6rem 1.25rem",
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <span>●</span>
      You&apos;re offline — reconnect to continue chatting
    </div>
  );
}