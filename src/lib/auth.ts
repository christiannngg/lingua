import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db/prisma";
import { nextCookies } from "better-auth/next-js";

// ── Startup secret validation ─────────────────────────────────────────────
// Fail fast at boot rather than silently using undefined values that break
// session signing or origin validation in production.

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
if (!BETTER_AUTH_SECRET) {
  throw new Error(
    "[auth] BETTER_AUTH_SECRET is not set. " +
    "Add it to your .env file locally and to Vercel environment variables in production."
  );
}

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
if (!BETTER_AUTH_URL) {
  throw new Error(
    "[auth] BETTER_AUTH_URL is not set. " +
    "Set it to your production URL (e.g. https://your-app.vercel.app) in Vercel environment variables, " +
    "and to http://localhost:3000 in your local .env file."
  );
}

// the server-side auth engine (Better Auth config)
export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
  trustedOrigins: [BETTER_AUTH_URL],
});

// Inferred TypeScript types — use these throughout the app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;