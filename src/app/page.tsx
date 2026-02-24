// "use client";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import { signOutAction } from "./actions/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // const router = useRouter();

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex gap-4">
            <button className="bg-white text-black font-medium px-6 py-2 rounded-md hover:bg-gray-200">
              <Link href={{ pathname: "/sign-up" }}>Sign Up</Link>
            </button>
            <button className="border border-white text-white font-medium px-6 py-2 rounded-md hover:bg-neutral-800">
              <Link href={{ pathname: "/sign-in" }}>Sign In</Link>
            </button>
          </div>
          <div className="text-6xl font-bold tracking-tight">
            <span style={{ color: "var(--color-brand-500)" }}>Lingua</span>
          </div>
          <p className="max-w-md text-lg" style={{ color: "var(--muted-foreground)" }}>
            An AI language partner that actually remembers you — conversational AI, semantic memory,
            and spaced repetition in one place.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/"
            className="rounded-lg px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-brand-500)" }}
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="rounded-lg px-6 py-3 font-semibold transition-colors hover:underline"
            style={{ color: "var(--color-brand-500)" }}
          >
            Learn More
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border p-6"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="mb-2 text-2xl">{feature.icon}</div>
              <h3 className="mb-1 font-semibold">{feature.title}</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-md h-screen flex items-center justify-center flex-col mx-auto p-6 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-lg mb-4">Hello {session.user.name}!</p>
      <p className="text-lg mb-4">{session.user.id}</p>
      <form action={signOutAction}>
        <button type="submit">Logout</button>
      </form>
    </main>
  );
}

const FEATURES = [
  {
    icon: "🧠",
    title: "Persistent Memory",
    description:
      "Lingua remembers every conversation via semantic embeddings — context carries across sessions.",
  },
  {
    icon: "💬",
    title: "AI Conversation Partner",
    description:
      "Chat with Sofia (Spanish) or Marco (Italian) — a named persona tuned to your CEFR level.",
  },
  {
    icon: "📚",
    title: "Spaced Repetition (FSRS)",
    description:
      "Every word you encounter gets scheduled with FSRS — the most accurate algorithm for long-term retention.",
  },
];
