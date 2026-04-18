import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

/**
 * GET /api/exercises/stats
 *
 * Retorna estatísticas de aprendizagem do usuário autenticado:
 *   - total de tentativas
 *   - total de acertos
 *   - taxa de acerto (%)
 *   - número de revisões pendentes
 *   - breakdown por dificuldade (FACIL / MEDIO / DIFICIL)
 */
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const now = new Date();

    // ── Tentativas do usuário ─────────────────────────────────────────────────
    const attempts = await prisma.exerciseAttempt.findMany({
      where: { userId: auth.userId },
      include: {
        exercise: { select: { difficulty: true } },
      },
    });

    const total = attempts.length;
    const correct = attempts.filter((a) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // ── Breakdown por dificuldade ─────────────────────────────────────────────
    const byDifficulty: Record<string, { total: number; correct: number; accuracy: number }> = {
      FACIL: { total: 0, correct: 0, accuracy: 0 },
      MEDIO: { total: 0, correct: 0, accuracy: 0 },
      DIFICIL: { total: 0, correct: 0, accuracy: 0 },
    };

    for (const attempt of attempts) {
      const diff = attempt.exercise.difficulty ?? "MEDIO";
      const bucket = byDifficulty[diff] ?? byDifficulty["MEDIO"];
      if (bucket) {
        bucket.total += 1;
        if (attempt.isCorrect) bucket.correct += 1;
      }
    }

    for (const key of Object.keys(byDifficulty)) {
      const b = byDifficulty[key];
      if (b) {
        b.accuracy = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
      }
    }

    // ── Revisões pendentes (SM-2) ─────────────────────────────────────────────
    const overdueCount = await prisma.exerciseReview.count({
      where: {
        userId: auth.userId,
        nextReviewAt: { lte: now },
        exercise: { status: "APPROVED" },
      },
    });

    // ── Exercícios nunca vistos ───────────────────────────────────────────────
    const reviewedCount = await prisma.exerciseReview.count({
      where: { userId: auth.userId },
    });
    const totalApproved = await prisma.exercise.count({
      where: { status: "APPROVED" },
    });
    const unseenCount = Math.max(0, totalApproved - reviewedCount);

    return NextResponse.json({
      stats: {
        total,
        correct,
        accuracy,
        overdueCount,
        unseenCount,
        dueForReview: overdueCount + unseenCount,
        byDifficulty,
      },
    });
  } catch (error) {
    console.error("[exercises/stats GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
