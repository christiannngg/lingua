"use client";

import { useRouter } from "next/navigation";
import type { AssessmentResult } from "./types";

interface Props {
  result: AssessmentResult;
  languageName: string;
}

export function AssessmentResultScreen({ result, languageName }: Props) {
  const router = useRouter();

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1>Assessment Complete</h1>
      <p>Here&apos;s where you&apos;re starting with {languageName}:</p>

      <div
        style={{
          border: "2px solid #000",
          borderRadius: 8,
          padding: "1.5rem",
          margin: "1.5rem 0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", fontWeight: "bold" }}>{result.cefrLevel}</div>
        <p style={{ marginTop: "0.5rem" }}>{result.cefrDescription}</p>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        style={{ padding: "0.75rem 1.5rem", cursor: "pointer" }}
      >
        Start Learning {"->"}
      </button>
    </main>
  );
}