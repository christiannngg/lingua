/**
 * summarize.ts
 *
 * Generates a memory-optimized summary of a conversation using Claude Haiku.
 * The summary is designed to be injected into future system prompts —
 * it captures personal context, not a transcript recap.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface Message {
  role: string;
  content: string;
}

const SUMMARY_SYSTEM_PROMPT = `You are a memory extraction assistant for a language learning app.
Your job is to read a conversation between a language learner and their AI tutor, 
and write a short memory note that will help the tutor remember this person in future sessions.

Write 3-5 sentences in plain English. Focus on:
- Personal details the user revealed (interests, job, hometown, family, travel, hobbies)
- Topics they seemed most engaged by
- Their apparent confidence level and any recurring struggles
- Anything they said they wanted to discuss again or learn more about
- The general tone and energy of the conversation
- Specific topics, words, or phrases discussed — name them explicitly 
  (e.g. "discussed vegetables including lettuce, tomatoes, and peppers" 
  not "talked about food")

Do NOT summarize what the tutor said. 
Do NOT write "The user said...". Just write the memory note directly, as if briefing someone 
who is about to meet this person for the first time.

Example output:
"Mentions working as a graphic designer in London. Very enthusiastic about food and cooking — 
spent most of the conversation discussing Italian regional cuisine. Struggles with gendered 
nouns but has strong instincts for verb conjugation. Wants to visit Naples someday and asked 
about local phrases. Warm, chatty energy — responds well to personal questions."`;

export async function summarizeConversation(messages: Message[]): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Learner" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the conversation to summarize:\n\n${transcript}`,
      },
    ],
  });

  const block = response.content[0] as { type: "text"; text: string };
  if (block.type !== "text") throw new Error("Unexpected response type from summarization");

  return block.text.trim();
}
