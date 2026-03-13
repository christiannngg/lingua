import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// ── Startup secret validation ─────────────────────────────────────────────
// The ! non-null assertion suppresses TypeScript errors but does nothing at
// runtime. Assert explicitly so a missing DATABASE_URL fails immediately with
// a clear message rather than throwing deep inside the Postgres driver.

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    "[prisma] DATABASE_URL is not set. " +
    "Add it to your .env file locally and to Vercel environment variables in production."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}