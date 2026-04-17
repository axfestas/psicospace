import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const DOCENTE_ROLES = new Set(["DOCENTE", "ADMIN", "SUPERADMIN"]);

/**
 * POST /api/exercises/generate
 *
 * Generates exercise questions from a material/library item.
 * The AI generation requires OPENAI_API_KEY to be configured.
 * Without the API key, returns template-based placeholder exercises
 * that the docente can edit and approve.
 */
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

    const desiredTypes: string[] = Array.isArray(types) && types.length > 0
      ? types
      : ["OPEN", "COMPREHENSION", "MULTIPLE_CHOICE"];

    const openaiKey = process.env.OPENAI_API_KEY;
    const now = new Date().toISOString();

    let generated: Array<{
      title: string;
      type: string;
      question: string;
      answer?: string;
      explanation?: string;
      options?: Array<{ text: string; isCorrect: boolean }>;
    }> = [];

    if (openaiKey) {
      // Use OpenAI to generate exercises strictly from source content
      const systemPrompt = `Você é um gerador de exercícios educacionais. 
Gere exercícios EXCLUSIVAMENTE baseados no conteúdo fornecido pelo usuário.
NÃO utilize conhecimento externo. Se o conteúdo for insuficiente para um tipo de questão, gere questões de compreensão geral sobre o tema.
Responda APENAS com um array JSON válido de exercícios, sem texto adicional.
Cada exercício deve ter: title, type, question, answer (opcional), explanation (opcional).
Para MULTIPLE_CHOICE adicione: options: [{text, isCorrect}] com 4 opções.`;

      const userPrompt = `Conteúdo: "${sourceTitle}${sourceDescription ? ": " + sourceDescription : ""}"
Gere ${count} exercício(s) dos tipos: ${desiredTypes.join(", ")}.
Tipos válidos: OPEN (pergunta aberta), COMPREHENSION (compreensão de texto), APPLICATION (aplicação prática), MULTIPLE_CHOICE (múltipla escolha).
Retorne um JSON array.`;

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
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content ?? "[]";
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            generated = parsed;
          }
        }
      } catch (e) {
        console.warn("[exercises/generate] AI call failed, falling back to templates", e);
      }
    }

    // Fallback: template-based placeholder exercises
    if (generated.length === 0) {
      const templates = [
        {
          type: "OPEN",
          title: `Questão aberta — ${sourceTitle}`,
          question: `Com base em "${sourceTitle}", explique os principais conceitos abordados.`,
          answer: "(A ser preenchido pelo docente)",
        },
        {
          type: "COMPREHENSION",
          title: `Compreensão — ${sourceTitle}`,
          question: `O que você entende sobre "${sourceTitle}"? Descreva com suas próprias palavras.`,
          answer: "(A ser preenchido pelo docente)",
        },
        {
          type: "APPLICATION",
          title: `Aplicação — ${sourceTitle}`,
          question: `Como você aplicaria os conceitos de "${sourceTitle}" em uma situação prática?`,
          answer: "(A ser preenchido pelo docente)",
        },
        {
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
      ];

      const safeCount = Math.min(count, 4);
      for (let i = 0; i < safeCount; i++) {
        const t = templates[i % templates.length];
        if (!desiredTypes.includes(t.type) && desiredTypes.length > 0) continue;
        generated.push(t);
      }
      if (generated.length === 0) generated = templates.slice(0, safeCount);
    }

    // Persist as PENDING exercises
    const created = [];
    for (const ex of generated.slice(0, 10)) {
      const exercise = await prisma.exercise.create({
        data: {
          title: ex.title || `Exercício sobre ${sourceTitle}`,
          type: ex.type || "OPEN",
          question: ex.question,
          answer: ex.answer || null,
          explanation: ex.explanation || null,
          materialId: materialId || null,
          libraryItemId: libraryItemId || null,
          createdById: auth.userId,
          status: "PENDING",
          sourceType: openaiKey ? "AI" : "MANUAL",
          updatedAt: now,
        },
      });

      if (ex.type === "MULTIPLE_CHOICE" && Array.isArray(ex.options)) {
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
