import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type WeeklySummaryStats = {
  language: string;
  cefrLevel: string;
  wordsLearned: number;
  conversationsHad: number;
  grammarErrorsThisWeek: number;
  levelChangedTo: string | null;
};

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  it: "Italian",
};

export async function generateWeeklySummary(stats: WeeklySummaryStats): Promise<string> {
  const languageName = LANGUAGE_NAMES[stats.language] ?? stats.language;

  const levelChange = stats.levelChangedTo
    ? `The user was assessed and their level changed to ${stats.levelChangedTo} this week.`
    : "No level change this week.";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `You are a warm, encouraging language learning coach writing a short weekly progress summary. 
Write 3-4 sentences maximum. Be specific about the numbers provided. Be genuinely encouraging without being sycophantic. 
Focus on progress made, not gaps. Write in second person ("you"). Never use bullet points or headers — flowing prose only.`,
    messages: [
      {
        role: "user",
        content: `Write a weekly summary for a ${languageName} learner (current level: ${stats.cefrLevel}) with these stats:
- New vocabulary words encountered: ${stats.wordsLearned}
- Conversations completed: ${stats.conversationsHad}  
- Grammar errors made (learning opportunities): ${stats.grammarErrorsThisWeek}
- ${levelChange}`,
      },
    ],
  });

  const text =
    response.content[0]?.type === "text"
      ? (response.content[0] as { type: "text"; text: string }).text
      : "";

  return text.trim();
}
