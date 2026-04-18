import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

/**
 * GET /api/exercises/review
 *
 * Retorna a fila de revisão ordenada por prioridade para o usuário autenticado.
 *
 * Ordem:
 *   1. Exercícios com revisão vencida (nextReviewAt <= now)  — mais urgentes
 *   2. Exercícios nunca revistos (sem ExerciseReview) — novos
 *   3. Exercícios com revisão futura agendada — manutenção
 *
 * Apenas exercícios aprovados são incluídos.
 * Limite: 20 exercícios por chamada (suficiente para uma sessão de revisão).
 */
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const now = new Date();
    const LIMIT = 20;

    // ── 1. Exercícios com revisão vencida ────────────────────────────────────
    const overdueReviews = await prisma.exerciseReview.findMany({
      where: {
        userId: auth.userId,
        nextReviewAt: { lte: now },
        exercise: { status: "APPROVED" },
      },
      orderBy: { nextReviewAt: "asc" },
      take: LIMIT,
      include: {
        exercise: {
          include: {
            options: { orderBy: { order: "asc" } },
            material: { select: { id: true, title: true } },
            libraryItem: { select: { id: true, title: true } },
          },
        },
      },
    });

    const overdueExercises = overdueReviews.map((r) => ({
      ...r.exercise,
      options: r.exercise.options.map((o) => ({ ...o, isCorrect: false })),
      reviewState: {
        interval: r.interval,
        repetitions: r.repetitions,
        easeFactor: r.easeFactor,
        nextReviewAt: r.nextReviewAt,
        overdue: true,
      },
    }));

    const remainingSlots = LIMIT - overdueExercises.length;

    // ── 2. Exercícios nunca revistos ─────────────────────────────────────────
    const reviewedIds = overdueReviews.map((r) => r.exerciseId);

    // Also get all reviewed exercise IDs for this user to exclude them from new
    const allReviewedIds = await prisma.exerciseReview.findMany({
      where: { userId: auth.userId },
      select: { exerciseId: true },
    });
    const allReviewedSet = new Set(allReviewedIds.map((r) => r.exerciseId));
    const excludeIds = [...allReviewedSet];

    let newExercises: typeof overdueExercises = [];
    if (remainingSlots > 0) {
      const unseen = await prisma.exercise.findMany({
        where: {
          status: "APPROVED",
          id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
        },
        orderBy: { createdAt: "asc" },
        take: remainingSlots,
        include: {
          options: { orderBy: { order: "asc" } },
          material: { select: { id: true, title: true } },
          libraryItem: { select: { id: true, title: true } },
        },
      });
      newExercises = unseen.map((ex) => ({
        ...ex,
        options: ex.options.map((o) => ({ ...o, isCorrect: false })),
        reviewState: null,
      }));
    }

    const exercises = [...overdueExercises, ...newExercises];

    return NextResponse.json({
      exercises,
      meta: {
        total: exercises.length,
        overdueCount: overdueExercises.length,
        newCount: newExercises.length,
      },
    });
  } catch (error) {
    console.error("[exercises/review GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
