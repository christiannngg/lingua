import { PrismaClient } from "@prisma/client";
import { GRAMMAR_CONCEPTS } from "../src/lib/ai/grammar-concepts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding grammar concepts...");

  for (const [language, concepts] of Object.entries(GRAMMAR_CONCEPTS)) {
    for (const concept of concepts) {
      await prisma.grammarConcept.upsert({
        where: {
          language_name: { language, name: concept.name },
        },
        update: { description: concept.description },
        create: {
          language,
          name: concept.name,
          description: concept.description,
        },
      });
    }
  }

  const count = await prisma.grammarConcept.count();
  console.log(`Done — ${count} grammar concepts in DB.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());