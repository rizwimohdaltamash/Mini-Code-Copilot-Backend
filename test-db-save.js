const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');

    // 1. Get a language ID
    const lang = await prisma.language.findFirst({
        where: { name: 'javascript' }
    });

    if (!lang) {
        console.error('❌ Error: Language "javascript" not found. Database might not be seeded.');
        return;
    }

    console.log(`Found language: ${lang.name} (ID: ${lang.id})`);

    // 2. Create a test record
    const prompt = "Test prompt from script";
    const code = "console.log('Test code');";

    const entry = await prisma.generation.create({
        data: {
            prompt,
            code,
            languageId: lang.id
        }
    });

    console.log('✅ Success! Record saved to database.');
    console.log('Saved Entry:', entry);
}

main()
    .catch(e => console.error('❌ Database Error:', e))
    .finally(async () => await prisma.$disconnect());
