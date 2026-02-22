import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db/prisma";
import { nextCookies } from "better-auth/next-js";

// the server-side auth engine (Better Auth config)
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true, // sign the user in immediately after sign-up
  },
  plugins: [nextCookies()],
  // Trust requests from our own origin only
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});

// Inferred TypeScript types — use these throughout the app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
