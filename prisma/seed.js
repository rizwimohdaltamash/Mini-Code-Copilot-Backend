const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const languages = [
    { name: "javascript" },
    { name: "python" },
    { name: "cpp" },
    { name: "java" }
  ];

  console.log('Seeding languages...');

  for (const lang of languages) {
    const upserted = await prisma.language.upsert({
      where: { name: lang.name },
      update: {},
      create: lang,
    });
    console.log(`Created/Found: ${upserted.name}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
