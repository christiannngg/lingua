# Lingua

An AI language learning partner that remembers you across sessions, adapts to your proficiency level, and builds a personalized vocabulary list as you have conversations.

> This project is actively being developed. New features and improvements are added on a rolling basis.

---

## The Problem

Most language learning apps treat every session as a fresh start. Duolingo does not know what you talked about last week. It does not know that you keep mixing up the subjunctive, or that you already know the word for "train station" but still confuse verb aspects. Every session is the same loop.

Lingua is built around the idea that continuity is what makes a tutor useful. A good tutor remembers you.

---

## What It Does

**Conversational AI with personas.** Each language has a named AI persona: Sofia for Spanish, Marco for Italian, Camille for French, and so on across 9 supported languages. The persona holds a real conversation in your target language, corrects your errors naturally without lecturing, and enforces vocabulary that matches your current CEFR proficiency level.

**Semantic memory across sessions.** After every conversation, a summary is embedded and stored as a vector in PostgreSQL via pgvector. When you start a new session, the system retrieves the most semantically relevant past conversations and injects them into the AI's context. The AI does not just remember the last few messages but recalls things you mentioned weeks ago if they are relevant to what you are talking about now.

**Automatic vocabulary capture.** After every AI response, a background job runs a secondary Claude call that extracts vocabulary you encountered in that turn. Words are added to your personal vocabulary table without any manual input. You never have to decide what to add to your word list.

**FSRS-5 spaced repetition.** Every captured word is scheduled for review using the FSRS-5 algorithm, which is more accurate at predicting optimal review timing than the older SM-2 algorithm most apps use. Review cards use AI-generated example sentences built around your interests and the same word never appears in the same sentence twice.

**CEFR proficiency assessment.** When you add a new language, you are onboarded determining your current CEFR Level. Your level is stored per language, updates as your performance data accumulates, and directly controls how the AI speaks to you.

**Progress dashboard.** Tracks vocabulary growth over time, CEFR level history, a grammar error heatmap showing your recurring weak spots, and a weekly AI-generated summary of your activity.

---

## Tech Stack

| Layer         | Technology                                                              |
|---------------|-------------------------------------------------------------------------|
| Frontend      | Next.js , TypeScript, Tailwind                                          |
| AI            | Anthropic Claude Haiku, Vercel AI SDK, Zod-validated structured outputs |
| Embeddings    | Voyage AI `voyage-3-lite`, 512-dimensional vectors                      |
| Database      | PostgreSQL + pgvector on Railway, Prisma ORM                            |
| Auth          | Better Auth with Prisma adapter                                         |
| Rate Limiting | Upstash Redis                                                           |
| Charts        | Recharts                                                                |
| Deployment    | Vercel (frontend), Railway (database)                                   |

---

## Project Structure

```text
src/
  app/                  Next.js App Router pages and API routes
  app/actions/          Server actions
  components/           Client components organized by feature
  lib/
    ai/                 Claude client, system prompts, Zod schemas
    fsrs/               FSRS-5 algorithm implementation
    languages.config.ts Single source of truth for supported languages
prisma/
  schema.prisma         Database schema
```

---

## Status

Active development. Sprints 1 through 7 are complete, covering the full feature set described above. Ongoing work includes persona depth improvements, additional UI polish, and production hardening.
