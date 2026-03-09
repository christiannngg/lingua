import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { ChatInterface } from "@/components/conversation/ChatInterface";
import { getConversations, getConversationMessages } from "@/app/actions/conversations";
import { ConversationSidebar } from "@/components/conversation/ConversationSidebar";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/languages.config";

interface ChatPageProps {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ conv?: string }>;
}

type Conversation = Awaited<ReturnType<typeof getConversations>>[number];

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { language } = await params;
  const { conv } = await searchParams;

  if (!isSupportedLanguage(language)) redirect("/dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userLanguage = await prisma.userLanguage.findUnique({
    where: { userId_language: { userId: session.user.id, language } },
    select: { id: true, cefrLevel: true, assessmentCompleted: true },
  });

  if (!userLanguage?.assessmentCompleted) redirect(`/assessment/${language}`);

  const lang = userLanguage!;
  const conversations = await getConversations(lang.id);

  let initialMessages: {
    id: string;
    role: "user" | "assistant";
    parts: { type: "text"; text: string }[];
  }[] = [];
  let initialConversationId: string | null = null;

  if (conv) {
    const dbMessages = await getConversationMessages(conv);
    initialConversationId = conv;
    initialMessages = dbMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
    }));
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0d0d1a" }}>
      <ConversationSidebar
        conversations={conversations}
        language={language}
        activeConvId={initialConversationId}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <ChatInterface
          language={language as SupportedLanguage}
          cefrLevel={lang.cefrLevel ?? "A1"}
          userLanguageId={lang.id}
          initialMessages={initialMessages}
          initialConversationId={initialConversationId}
        />
      </div>
    </div>
  );
}