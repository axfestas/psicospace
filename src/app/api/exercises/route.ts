import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const DOCENTE_ROLES = new Set(["DOCENTE", "ADMIN", "SUPERADMIN"]);

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");
    const libraryItemId = searchParams.get("libraryItemId");
    const status = searchParams.get("status");
    // Non-docentes can only see approved exercises
    const isDocente = DOCENTE_ROLES.has(auth.role);

    const exercises = await prisma.exercise.findMany({
      where: {
        ...(materialId ? { materialId } : {}),
        ...(libraryItemId ? { libraryItemId } : {}),
        ...(status ? { status } : isDocente ? {} : { status: "APPROVED" }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        options: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        material: { select: { id: true, title: true } },
        libraryItem: { select: { id: true, title: true } },
      },
    });

    // For non-docentes, hide the correct answer flag from multiple choice
    const sanitized = isDocente
      ? exercises
      : exercises.map((ex) => ({
          ...ex,
          answer: undefined,
          options: ex.options.map((o) => ({ ...o, isCorrect: false })),
        }));

    return NextResponse.json({ exercises: sanitized });
  } catch (error) {
    console.error("[exercises GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !DOCENTE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Apenas docentes podem criar exercícios" }, { status: 403 });
    }

    const { title, type, question, answer, explanation, materialId, libraryItemId, options } =
      await request.json();

    if (!title?.trim() || !type || !question?.trim()) {
      return NextResponse.json(
        { error: "Título, tipo e enunciado são obrigatórios" },
        { status: 400 }
      );
    }

    const VALID_TYPES = new Set(["MULTIPLE_CHOICE", "OPEN", "COMPREHENSION", "APPLICATION"]);
    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "Tipo de exercício inválido" }, { status: 400 });
    }

    if (type === "MULTIPLE_CHOICE") {
      if (!Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: "Exercício de múltipla escolha requer ao menos 2 opções" },
          { status: 400 }
        );
      }
      if (!options.some((o: { isCorrect?: boolean }) => o.isCorrect)) {
        return NextResponse.json(
          { error: "Marque pelo menos uma opção como correta" },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const exercise = await prisma.exercise.create({
      data: {
        title: title.trim(),
        type,
        question: question.trim(),
        answer: answer?.trim() || null,
        explanation: explanation?.trim() || null,
        materialId: materialId || null,
        libraryItemId: libraryItemId || null,
        createdById: auth.userId,
        status: "PENDING",
        sourceType: "MANUAL",
        updatedAt: now,
      },
    });

    if (type === "MULTIPLE_CHOICE" && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (opt?.text?.trim()) {
          await prisma.exerciseOption.create({
            data: {
              exerciseId: exercise.id,
              text: opt.text.trim(),
              isCorrect: !!opt.isCorrect,
              order: i,
            },
          });
        }
      }
    }

    const full = await prisma.exercise.findUnique({
      where: { id: exercise.id },
      include: {
        options: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ exercise: full }, { status: 201 });
  } catch (error) {
    console.error("[exercises POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
