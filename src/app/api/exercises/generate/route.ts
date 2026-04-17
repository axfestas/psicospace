import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const DOCENTE_ROLES = new Set(["DOCENTE", "ADMIN", "SUPERADMIN"]);
const INSUFFICIENT_CONTENT_MESSAGE = "conteúdo insuficiente para gerar questões";
const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

type ParsedGeneratedQuestion = {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
};

function stripMarkdownCodeFence(content: string) {
  return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseQuestions(content: string): ParsedGeneratedQuestion[] {
  const cleaned = stripMarkdownCodeFence(content);
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  const questions: ParsedGeneratedQuestion[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;

    const question = typeof item.question === "string"
      ? item.question.trim()
      : typeof item.pergunta === "string"
      ? item.pergunta.trim()
      : "";

    const rawOptions = Array.isArray(item.options)
      ? item.options
      : Array.isArray(item.alternativas)
      ? item.alternativas
      : [];

    if (!question || rawOptions.length !== 4) continue;

    let options: Array<{ text: string; isCorrect: boolean }> = [];

    if (rawOptions.every((opt) => typeof opt === "object" && opt && typeof opt.text === "string")) {
      options = rawOptions.map((opt) => ({ text: opt.text.trim(), isCorrect: !!opt.isCorrect }));
    } else if (rawOptions.every((opt) => typeof opt === "string")) {
      const letter = String(item.correctOption ?? item.respostaCorreta ?? item.gabarito ?? "")
        .trim()
        .toUpperCase();
      const index = OPTION_LETTERS.indexOf(letter as (typeof OPTION_LETTERS)[number]);
      if (index === -1) continue;
      options = rawOptions.map((text, i) => ({ text: text.trim(), isCorrect: i === index }));
    } else {
      continue;
    }

    if (options.some((opt) => !opt.text)) continue;
    if (options.filter((opt) => opt.isCorrect).length !== 1) continue;

    questions.push({ question, options });
  }

  return questions;
}

/**
 * POST /api/exercises/generate
 *
 * Generates exercise questions from a material/library item.
 * The AI generation requires OPENAI_API_KEY to be configured.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !DOCENTE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Apenas docentes podem gerar exercícios" }, { status: 403 });
    }

    const { materialId, libraryItemId, count = 3 } = await request.json();

    if (!materialId && !libraryItemId) {
      return NextResponse.json(
        { error: "Selecione um material ou item da biblioteca para gerar exercícios" },
        { status: 400 }
      );
    }

    // Fetch the source content title/description for context
    let sourceTitle = "";
    let sourceDescription = "";

    if (materialId) {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        select: { title: true },
      });
      if (!material) return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
      sourceTitle = material.title;
    } else if (libraryItemId) {
      const libItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItemId },
        select: { title: true, description: true },
      });
      if (!libItem) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
      sourceTitle = libItem.title;
      sourceDescription = libItem.description ?? "";
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada para geração de questões" },
        { status: 503 }
      );
    }

    const now = new Date().toISOString();
    const safeCount = Math.max(1, Math.min(Number(count) || 3, 10));

    let generated: ParsedGeneratedQuestion[] = [];

    // Use OpenAI to generate exercises strictly from source content
    const systemPrompt = `Você é um gerador de questões educacionais.
REGRAS OBRIGATÓRIAS:
1. Use EXCLUSIVAMENTE o conteúdo fornecido no texto/PDF.
2. NÃO invente conteúdo externo.
3. Gere APENAS questões de múltipla escolha.
4. Cada questão deve ter 1 pergunta clara e 4 alternativas (A, B, C, D), com apenas 1 correta.
5. Se o conteúdo for insuficiente, responda exatamente: "${INSUFFICIENT_CONTENT_MESSAGE}".
Responda APENAS em JSON válido, sem texto extra, no formato:
[{"question":"...","options":["...","...","...","..."],"correctOption":"A"}]`;

    const userPrompt = `Conteúdo: "${sourceTitle}${sourceDescription ? ": " + sourceDescription : ""}"
Gere ${safeCount} questão(ões) de múltipla escolha estritamente com base no conteúdo acima.
Se não houver conteúdo suficiente, retorne exatamente: "${INSUFFICIENT_CONTENT_MESSAGE}".`;

    try {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          // Lower temperature to maximize deterministic formatting and rule adherence.
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (!aiResponse.ok) {
        const details = await aiResponse.text();
        console.error("[exercises/generate] AI call failed", details);
        return NextResponse.json({ error: "Falha ao gerar questões com IA" }, { status: 502 });
      }

      const aiData = await aiResponse.json();
      const content = String(aiData.choices?.[0]?.message?.content ?? "").trim();
      const normalizedContent = content.toLowerCase();
      const normalizedInsufficient = INSUFFICIENT_CONTENT_MESSAGE.toLowerCase();
      if (normalizedContent.includes(normalizedInsufficient)) {
        return NextResponse.json({ error: INSUFFICIENT_CONTENT_MESSAGE }, { status: 422 });
      }

      generated = parseQuestions(content).slice(0, safeCount);
    } catch (e) {
      console.error("[exercises/generate] AI parsing failed", e);
      return NextResponse.json({ error: "Falha ao interpretar questões geradas" }, { status: 502 });
    }

    if (generated.length === 0) {
      return NextResponse.json({ error: INSUFFICIENT_CONTENT_MESSAGE }, { status: 422 });
    }

    // Persist as PENDING exercises
    const created = [];
    for (const [index, ex] of generated.entries()) {
      const exercise = await prisma.exercise.create({
        data: {
          title: `Múltipla escolha ${index + 1} — ${sourceTitle}`,
          type: "MULTIPLE_CHOICE",
          question: ex.question,
          answer: null,
          explanation: null,
          materialId: materialId || null,
          libraryItemId: libraryItemId || null,
          createdById: auth.userId,
          status: "PENDING",
          sourceType: "AI",
          updatedAt: now,
        },
      });

      for (let i = 0; i < ex.options.length; i++) {
        const opt = ex.options[i];
        if (opt?.text) {
          await prisma.exerciseOption.create({
            data: {
              exerciseId: exercise.id,
              text: opt.text,
              isCorrect: !!opt.isCorrect,
              order: i,
            },
          });
        }
      }

      const full = await prisma.exercise.findUnique({
        where: { id: exercise.id },
        include: { options: { orderBy: { order: "asc" } } },
      });
      created.push(full);
    }

    return NextResponse.json({ exercises: created, aiUsed: !!openaiKey }, { status: 201 });
  } catch (error) {
    console.error("[exercises/generate POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
