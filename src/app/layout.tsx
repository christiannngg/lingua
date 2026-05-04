import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lingua — AI Language Partner",
    template: "%s | Lingua",
  },
  description:
    "An AI language partner that remembers you — conversational AI, semantic memory, and spaced repetition in one place.",
  keywords: ["language learning", "AI tutor", "Spanish", "Italian", "spaced repetition"],
};

export const viewport: Viewport = {
  themeColor: "#CA7DF9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}