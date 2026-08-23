import { PrismaClient } from "@prisma/client";
import { TAXONOMY_TAGS } from "../src/server/taxonomy/tags";

const prisma = new PrismaClient();

async function main() {
  for (const tag of TAXONOMY_TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, type: tag.type },
      create: tag,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
