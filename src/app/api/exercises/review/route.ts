import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

interface ReviewState {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewAt: Date;
  overdue: boolean;
}

// ReviewState is null for exercises the user has never reviewed.
type NullableReviewState = ReviewState | null;

/**
 * GET /api/exercises/review
 *
 * Retorna a fila de revisão ordenada por prioridade para o usuário autenticado.
 *
 * Ordem:
 *   1. Exercícios com revisão vencida (nextReviewAt <= now)  — mais urgentes
 *   2. Exercícios nunca revistos (sem ExerciseReview) — novos
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
      } as NullableReviewState,
    }));

    const remainingSlots = LIMIT - overdueExercises.length;

    // ── 2. Exercícios nunca revistos ─────────────────────────────────────────
    // Get all reviewed exercise IDs for this user to exclude
    const allReviewedIds = await prisma.exerciseReview.findMany({
      where: { userId: auth.userId },
      select: { exerciseId: true },
    });
    const excludeIds = allReviewedIds.map((r) => r.exerciseId);

    type ExerciseEntry = (typeof overdueExercises)[number];
    const newExercises: ExerciseEntry[] = [];
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
      for (const ex of unseen) {
        newExercises.push({
          ...ex,
          options: ex.options.map((o) => ({ ...o, isCorrect: false })),
          reviewState: null,
        });
      }
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
