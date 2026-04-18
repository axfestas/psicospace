import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const DOCENTE_ROLES = new Set(["DOCENTE", "ADMIN", "SUPERADMIN"]);
const INSUFFICIENT_CONTENT_MSG = "conteúdo insuficiente para gerar questões";
const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

type ParsedQuestion = {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
};

function stripCodeFence(raw: string) {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function parseGeneratedQuestions(raw: string): ParsedQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const result: ParsedQuestion[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;

    const question = typeof item.question === "string"
      ? item.question.trim()
      : typeof item.pergunta === "string"
      ? item.pergunta.trim()
      : "";

    const rawOpts: unknown[] = Array.isArray(item.options)
      ? item.options
      : Array.isArray(item.alternativas)
      ? item.alternativas
      : [];

    if (!question || rawOpts.length !== 4) continue;

    let options: Array<{ text: string; isCorrect: boolean }> = [];

    if (rawOpts.every((o) => o && typeof o === "object" && typeof (o as Record<string, unknown>).text === "string")) {
      options = rawOpts.map((o) => {
        const obj = o as { text: string; isCorrect?: boolean };
        return { text: obj.text.trim(), isCorrect: !!obj.isCorrect };
      });
    } else if (rawOpts.every((o) => typeof o === "string")) {
      const letterRaw = String(
        (item as Record<string, unknown>).correctOption ??
        (item as Record<string, unknown>).respostaCorreta ??
        (item as Record<string, unknown>).gabarito ?? ""
      ).trim().toUpperCase();
      const idx = OPTION_LETTERS.indexOf(letterRaw as (typeof OPTION_LETTERS)[number]);
      if (idx === -1) continue;
      options = (rawOpts as string[]).map((text, i) => ({
        text: text.trim(),
        isCorrect: i === idx,
      }));
    } else {
      continue;
    }

    if (options.some((o) => !o.text)) continue;
    if (options.filter((o) => o.isCorrect).length !== 1) continue;

    result.push({ question, options });
  }

  return result;
}

/**
 * POST /api/exercises/generate
 *
 * Gera questões de múltipla escolha a partir de um material ou item de biblioteca.
 * Requer GROQ_API_KEY (Groq, gratuito, usa LLaMA).
 * Usa EXCLUSIVAMENTE o conteúdo fornecido.
 *
 * Prompt baseado nas REGRAS OBRIGATÓRIAS:
 *   1. Usar apenas o conteúdo do texto/PDF fornecido.
 *   2. Não inventar conteúdo externo.
 *   3. Apenas múltipla escolha, 4 alternativas (A–D), 1 correta.
 *   4. Não gerar questões discursivas.
 *   5. Não misturar formatos.
 *   6. Retornar "conteúdo insuficiente para gerar questões" se o material for escasso.
 */

interface AIProviderConfig {
  url: string;
  key: string;
  model: string;
}

function resolveAIProvider(): AIProviderConfig | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groqKey,
      model: "llama-3.1-8b-instant",
    };
  }
  return null;
}
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !DOCENTE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Apenas docentes podem gerar exercícios" }, { status: 403 });
    }

    const { materialId, libraryItemId, count = 3, types } = await request.json();

    if (!materialId && !libraryItemId) {
      return NextResponse.json(
        { error: "Selecione um material ou item da biblioteca para gerar exercícios" },
        { status: 400 }
      );
    }

    // Fetch source content for context
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

    // `types` is kept for API compatibility but generation is always MULTIPLE_CHOICE.
    void types;

    const aiProvider = resolveAIProvider();
    const now = new Date().toISOString();
    const safeCount = Math.max(1, Math.min(Number(count) || 3, 10));

    let generated: ParsedQuestion[] = [];

    if (aiProvider) {
      // System prompt follows the REGRAS OBRIGATÓRIAS from the product spec.
      const systemPrompt = `Você é um gerador de questões educacionais.

REGRAS OBRIGATÓRIAS:

1. Use EXCLUSIVAMENTE o conteúdo fornecido no texto/PDF.
2. NÃO invente conteúdo externo.
3. Gere APENAS questões de múltipla escolha.
4. Cada questão deve ter:
   - 1 pergunta clara
   - 4 alternativas (A, B, C, D)
   - apenas 1 correta
5. NÃO gerar questões discursivas.
6. NÃO misturar formatos.
7. Indicar o gabarito no final.

Se o conteúdo for insuficiente, retorne exatamente: "${INSUFFICIENT_CONTENT_MSG}"

Objetivo: gerar questões claras, diretas e baseadas no material.

Responda APENAS com um JSON array válido, sem texto adicional, no formato:
[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctOption":"A"}]`;

      const userPrompt = `Conteúdo: "${sourceTitle}${sourceDescription ? ": " + sourceDescription : ""}"

Gere ${safeCount} questão(ões) de múltipla escolha estritamente com base no conteúdo acima.
Se não houver conteúdo suficiente, retorne exatamente: "${INSUFFICIENT_CONTENT_MSG}"`;

      try {
        const aiResponse = await fetch(aiProvider.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiProvider.key}`,
          },
          body: JSON.stringify({
            model: aiProvider.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            // Lower temperature for deterministic, rule-adherent formatting.
            temperature: 0.2,
            max_tokens: 2000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = String(aiData.choices?.[0]?.message?.content ?? "").trim();
          if (content.toLowerCase().includes(INSUFFICIENT_CONTENT_MSG)) {
            return NextResponse.json({ error: INSUFFICIENT_CONTENT_MSG }, { status: 422 });
          }
          const parsed = parseGeneratedQuestions(content);
          if (parsed.length === 0) {
            // Parsing returned no valid questions — likely a format deviation; treat as generation failure.
            console.warn("[exercises/generate] AI response produced 0 valid questions:", content.slice(0, 200));
            return NextResponse.json({ error: "Falha ao interpretar questões geradas" }, { status: 502 });
          }
          generated = parsed.slice(0, safeCount);
        } else {
          const details = await aiResponse.text();
          console.error("[exercises/generate] AI call failed", details);
          return NextResponse.json({ error: "Falha ao gerar questões com IA" }, { status: 502 });
        }
      } catch (e) {
        console.error("[exercises/generate] AI parsing failed", e);
        return NextResponse.json({ error: "Falha ao interpretar questões geradas" }, { status: 502 });
      }
    }

    if (generated.length === 0) {
      if (!aiProvider) {
        // No API key configured: return placeholder template so docente can fill manually.
        return NextResponse.json(
          {
            error: "Nenhuma chave de IA configurada. Defina GROQ_API_KEY (gratuito) ou OPENAI_API_KEY para geração automática de questões.",
            placeholder: {
              type: "MULTIPLE_CHOICE",
              title: `Múltipla escolha — ${sourceTitle}`,
              question: `Qual das alternativas melhor descreve o tema de "${sourceTitle}"?`,
              options: [
                { text: "(Opção A — a ser preenchida)", isCorrect: true },
                { text: "(Opção B — a ser preenchida)", isCorrect: false },
                { text: "(Opção C — a ser preenchida)", isCorrect: false },
                { text: "(Opção D — a ser preenchida)", isCorrect: false },
              ],
            },
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: INSUFFICIENT_CONTENT_MSG }, { status: 422 });
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
          sourceType: aiProvider ? "AI" : "MANUAL",
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

    return NextResponse.json({ exercises: created, aiUsed: !!aiProvider }, { status: 201 });
  } catch (error) {
    console.error("[exercises/generate POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
