"use client";

import dynamic from "next/dynamic";
import type { SupportedLanguage } from "@/lib/languages.config";
import type { UIMessage } from "ai";

// Dynamic import lives here in a Client Component — next/dynamic with
// ssr: false is not permitted in Server Components.
const ChatInterface = dynamic(
  () =>
    import("@/components/conversation/ChatInterface").then((mod) => mod.ChatInterface),
  {
    ssr: false,
    loading: () => (
  <div
    style={{
      width: "100%",
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background)",
    }}
  >
    <div
      style={{
        width: "2rem",
        height: "2rem",
        borderRadius: "9999px",
        border: "2px solid #CA7DF9",
        borderTopColor: "transparent",
        animation: "spin 0.7s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
),
  },
);

interface ChatInterfaceLoaderProps {
  language: SupportedLanguage;
  cefrLevel: string;
  userLanguageId: string;
  initialMessages: UIMessage[];
  initialConversationId: string | null;
}

export function ChatInterfaceLoader(props: ChatInterfaceLoaderProps) {
  return (
    <div style={{ width: "100%", display: "flex", flex: 1 }}>
      <ChatInterface {...props} />
    </div>
  );
}