import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getConversationMessages } from "@/app/actions/conversations";
import { ChatInterfaceLoader } from "@/components/conversation/ChatInterfaceLoader";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/languages.config";

interface ChatPageProps {
  params: Promise<{ language: string }>;
  searchParams: Promise<{ conv?: string }>;
}

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

  // Only fetch messages for the active conversation — sidebar data lives in the layout
  const dbMessages = conv ? await getConversationMessages(conv) : [];

  const initialMessages = dbMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
  }));

  return (
    <div style={{ display: "flex", height: "100%", backgroundColor: "#0d0d1a" }}>
      <ChatInterfaceLoader
        language={language as SupportedLanguage}
        cefrLevel={lang.cefrLevel ?? "A1"}
        userLanguageId={lang.id}
        initialMessages={initialMessages}
        initialConversationId={conv ?? null}
      />
    </div>
  );
}