const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors());

// POST /api/generate
app.post("/api/generate", async (req, res) => {
    try {
        const { prompt, language } = req.body;

        // Validate
        if (!prompt || !language)
            return res.status(400).json({ error: "Prompt & language required" });

        // Call Grok API using groq-sdk
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const aiRes = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "user",
                    content: `Write ${language} code only. ${prompt}`
                }
            ]
        });

        const code = aiRes.choices[0]?.message?.content || "";

        // Find languageId
        const lang = await prisma.language.findUnique({
            where: { name: language }
        });

        if (!lang) {
            return res.status(400).json({ error: `Language '${language}' not supported` });
        }

        // Store in DB
        const entry = await prisma.generation.create({
            data: {
                prompt,
                code,
                languageId: lang.id
            }
        });

        return res.json(entry);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Internal error" });
    }
});

// GET /api/history?page=1&limit=10&search=
app.get("/api/history", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build where clause for search
    const where = search
        ? {
            OR: [
                { prompt: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } }
            ]
        }
        : {};

    const data = await prisma.generation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
            { starred: "desc" }, // Starred items first
            { id: "desc" }       // Then by newest
        ],
        include: { language: true }
    });

    res.json(data);
});

// PATCH /api/generation/:id/star
app.patch("/api/generation/:id/star", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { starred } = req.body;

        if (typeof starred !== "boolean") {
            return res.status(400).json({ error: "starred must be a boolean" });
        }

        const updated = await prisma.generation.update({
            where: { id },
            data: { starred },
            include: { language: true }
        });

        res.json(updated);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Failed to update star status" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
