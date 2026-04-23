import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { normalizeExtractedText } from "@/lib/text-normalization";
import {
  MIN_PDF_EXTRACTED_TEXT_CHARS,
  PDF_EXTRACTION_FAILURE_MSG,
  PDF_EXTRACTION_PREVIEW_CHARS,
  DIFFICULTY_TITLE_LABELS,
} from "@/lib/pdf-extraction";

export const runtime = "edge";

const DOCENTE_ROLES = new Set(["DOCENTE", "ADMIN", "SUPERADMIN"]);
const INSUFFICIENT_CONTENT_MSG = "conteúdo insuficiente para gerar questões";
const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const MIN_SOURCE_TEXT_CHARS = 80;
const MAX_SOURCE_TEXT_CHARS = 6000;
const MAX_CHUNK_CHARS = 2000;
const MAX_CHUNKS = Math.ceil(MAX_SOURCE_TEXT_CHARS / MAX_CHUNK_CHARS);
const SOURCE_PREVIEW_CHARS = PDF_EXTRACTION_PREVIEW_CHARS;

type ParsedQuestion = {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  explanation: string;
  difficulty: "FACIL" | "MEDIO" | "DIFICIL";
};
type SourceExtractionMethod = "pdf_direct" | "pdf_ocr_fallback" | "none";

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

    const rawExplanation: string = (() => {
      if (typeof item.explanation === "string") return item.explanation.trim();
      if (typeof item.explicacao === "string") return (item.explicacao as string).trim();
      return "";
    })();

    const rawDifficulty = String(
      (item as Record<string, unknown>).difficulty ??
      (item as Record<string, unknown>).dificuldade ?? ""
    ).trim().toUpperCase();
    const difficulty: ParsedQuestion["difficulty"] = (rawDifficulty === "FACIL" || rawDifficulty === "DIFICIL")
      ? rawDifficulty
      : "MEDIO";

    result.push({ question, options, explanation: rawExplanation, difficulty });
  }

  return result;
}

function chunkSourceText(raw: string): string {
  const normalized = normalizeExtractedText(raw).slice(0, MAX_SOURCE_TEXT_CHARS);
  if (!normalized) return "";

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length && chunks.length < MAX_CHUNKS) {
    const end = Math.min(cursor + MAX_CHUNK_CHARS, normalized.length);
    chunks.push(normalized.slice(cursor, end));
    cursor = end;
  }

  return chunks
    .map((chunk, index) => `[Trecho ${index + 1}]\n${chunk}`)
    .join("\n\n");
}

/**
 * POST /api/exercises/generate
 *
 * Gera questões de múltipla escolha pedagógicas a partir de um material.
 * Requer GROQ_API_KEY (Groq, gratuito, usa LLaMA).
 *
 * Pipeline pedagógico:
 *   1. Extrair conceitos-chave do conteúdo.
 *   2. Gerar questões em 3 níveis (FACIL/MEDIO/DIFICIL) com explicações.
 *   3. Usar EXCLUSIVAMENTE o conteúdo fornecido.
 */

interface AIProviderConfig {
  url: string;
  key: string;
  model: string;
}

function resolveAIProvider(): AIProviderConfig | null {
  let groqKey: string | undefined;
  try {
    groqKey = getRequestContext().env.GROQ_API_KEY;
  } catch {
    // Outside request context (e.g. build time).
  }
  groqKey ??= process.env.GROQ_API_KEY;
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

    const { materialId, libraryItemId, count = 3, types, sourceText, sourceExtractionMethod, difficulty } = await request.json();

    if (!materialId && !libraryItemId) {
      return NextResponse.json(
        { error: "Selecione um material ou item da biblioteca para gerar exercícios" },
        { status: 400 }
      );
    }

    // Fetch source content for context
    let sourceTitle = "";
    let sourceDescription = "";
    let sourceType = "";

    if (materialId) {
      const material = await prisma.material.findUnique({
        where: { id: materialId },
        select: {
          title: true,
          type: true,
          libraryItem: { select: { description: true } },
        },
      });
      if (!material) return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
      sourceTitle = material.title;
      sourceDescription = material.libraryItem?.description ?? "";
      sourceType = material.type;
    } else if (libraryItemId) {
      const libItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItemId },
        select: { title: true, description: true, type: true },
      });
      if (!libItem) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
      sourceTitle = libItem.title;
      sourceDescription = libItem.description ?? "";
      sourceType = libItem.type;
    }

    // `types` is kept for API compatibility but generation is always MULTIPLE_CHOICE.
    void types;

    const aiProvider = resolveAIProvider();
    const now = new Date().toISOString();
    const safeCount = Math.max(1, Math.min(Number(count) || 3, 10));
    const normalizedSourceText = normalizeExtractedText(typeof sourceText === "string" ? sourceText : "");
    const sourceMethod: SourceExtractionMethod = sourceExtractionMethod === "pdf_direct" || sourceExtractionMethod === "pdf_ocr_fallback"
      ? sourceExtractionMethod
      : "none";
    const sourcePreview = normalizedSourceText.slice(0, SOURCE_PREVIEW_CHARS).replace(/\n/g, " ");
    console.info(
      "[exercises/generate] Incoming source debug",
      JSON.stringify({
        sourceType,
        sourceTitle,
        sourceMethod,
        extractedLength: normalizedSourceText.length,
        preview: sourcePreview,
      })
    );
    if (
      (sourceMethod === "pdf_direct" || sourceMethod === "pdf_ocr_fallback")
      && normalizedSourceText.length < MIN_PDF_EXTRACTED_TEXT_CHARS
    ) {
      return NextResponse.json({ error: PDF_EXTRACTION_FAILURE_MSG }, { status: 422 });
    }
    const fallbackDescriptionText = normalizeExtractedText(sourceDescription);
    const finalSourceText = normalizedSourceText || fallbackDescriptionText;

    if (finalSourceText.length < MIN_SOURCE_TEXT_CHARS) {
      console.warn(
        "[exercises/generate] Source text too short",
        JSON.stringify({
          sourceType,
          materialId: materialId ?? null,
          libraryItemId: libraryItemId ?? null,
          sourceTitle,
          extractedLength: normalizedSourceText.length,
          fallbackLength: fallbackDescriptionText.length,
        })
      );
      return NextResponse.json({ error: INSUFFICIENT_CONTENT_MSG }, { status: 422 });
    }

    const chunkedSourceText = chunkSourceText(finalSourceText);
    const finalSourcePreview = chunkedSourceText.slice(0, SOURCE_PREVIEW_CHARS).replace(/\n/g, " ");
    console.info(
      "[exercises/generate] Source text preview",
      JSON.stringify({
        sourceType,
        sourceTitle,
        sourceMethod,
        totalChars: chunkedSourceText.length,
        preview: finalSourcePreview,
      })
    );

    let generated: ParsedQuestion[] = [];

    if (aiProvider) {
      // Validate requested difficulty
      const VALID_DIFFICULTIES = new Set(["FACIL", "MEDIO", "DIFICIL", "MISTO"]);
      const difficultyUpper = String(difficulty).toUpperCase();
      const safeDifficulty: string = VALID_DIFFICULTIES.has(difficultyUpper)
        ? difficultyUpper
        : "MISTO";

      const DIFFICULTY_LEVEL_DESCRIPTIONS = [
        "- FACIL: definição/reconhecimento (ex: \"O que é X?\")",
        "- MEDIO: explicação/relação (ex: \"Como X funciona / Por que Y ocorre?\")",
        "- DIFICIL: aplicação/análise (ex: \"Em que situação clínica / Como isso afeta Y?\")",
      ].join("\n");

      const difficultyInstructions = safeDifficulty === "MISTO"
        ? `Distribua as ${safeCount} questões entre os 3 níveis de dificuldade da forma mais uniforme possível:\n${DIFFICULTY_LEVEL_DESCRIPTIONS}`
        : `Todas as ${safeCount} questões devem ser do nível: ${safeDifficulty}\n${DIFFICULTY_LEVEL_DESCRIPTIONS}`;

      const systemPrompt = `Você é um especialista em pedagogia e gerador de questões educacionais de alta qualidade.

PIPELINE PEDAGÓGICO (execute internamente antes de gerar):
1. Identifique os 3-5 conceitos-chave do conteúdo fornecido.
2. Para cada questão, certifique-se de que aborda um conceito importante do texto.
3. Gere as questões nos níveis de dificuldade solicitados.

REGRAS OBRIGATÓRIAS:
1. Use EXCLUSIVAMENTE o conteúdo fornecido no texto/PDF.
2. NÃO invente conteúdo externo nem informações que não estejam no texto.
3. Gere APENAS questões de múltipla escolha.
4. Cada questão deve ter:
   - 1 pergunta clara e objetiva
   - 4 alternativas (A, B, C, D)
   - apenas 1 correta
   - 1 explicação clara da resposta correta (baseada no texto)
5. A explicação deve: definir o conceito, explicar por que a alternativa está correta e por que as outras estão erradas (resumidamente).
6. Não gere questões genéricas ou óbvias demais.
7. A resposta correta deve estar no texto fornecido.

Se o conteúdo for insuficiente, retorne exatamente: "${INSUFFICIENT_CONTENT_MSG}"

Responda APENAS com um JSON array válido, sem texto adicional, no formato:
[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correctOption":"A","explanation":"...","difficulty":"FACIL"}]`;

      const userPrompt = `Título da fonte: "${sourceTitle}"
Tipo da fonte: ${sourceType || "N/A"}

${difficultyInstructions}

Conteúdo extraído (use APENAS este conteúdo como base):
${chunkedSourceText}

Gere ${safeCount} questão(ões) de múltipla escolha pedagógicas com base no conteúdo acima.
Cada questão DEVE incluir a explicação da resposta correta e o nível de dificuldade.
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
            temperature: 0.3,
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

    // Persist exercises — auto-approve when created by ADMIN/SUPERADMIN
    const isAdmin = auth.role === "ADMIN" || auth.role === "SUPERADMIN";
    const created = [];
    for (const [index, ex] of generated.entries()) {
      const difficultyLabel = DIFFICULTY_TITLE_LABELS[ex.difficulty] ?? "Médio";
      const exercise = await prisma.exercise.create({
        data: {
          title: `${difficultyLabel} ${index + 1} — ${sourceTitle}`,
          type: "MULTIPLE_CHOICE",
          question: ex.question,
          answer: null,
          explanation: ex.explanation || null,
          difficulty: ex.difficulty,
          materialId: materialId || null,
          libraryItemId: libraryItemId || null,
          createdById: auth.userId,
          status: isAdmin ? "APPROVED" : "PENDING",
          approvedById: isAdmin ? auth.userId : null,
          approvedAt: isAdmin ? now : null,
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
