import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { grantExerciseReward } from "@/lib/psico-economy";
import { nextSM2State, nextReviewDate } from "@/lib/spaced-repetition";

export const runtime = "edge";

function normalizeAnswer(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isExerciseEligibleForReward(exercise: { materialId: string | null; libraryItemId: string | null }) {
  return Boolean(exercise.materialId || exercise.libraryItemId);
}

function calculateRewardedAt(previousRewardedAt: Date | null, awarded: boolean) {
  if (previousRewardedAt) return new Date(previousRewardedAt).toISOString();
  if (awarded) return new Date().toISOString();
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const { answer, optionId } = await request.json();

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: { options: true },
    });

    if (!exercise || exercise.status !== "APPROVED") {
      return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
    }

    let isCorrect = false;
    let normalizedAnswer = typeof answer === "string" ? answer.trim() : "";

    if (exercise.type === "MULTIPLE_CHOICE") {
      if (!optionId) {
        return NextResponse.json({ error: "Selecione uma opção" }, { status: 400 });
      }
      const selected = exercise.options.find((opt) => opt.id === optionId);
      if (!selected) {
        return NextResponse.json({ error: "Opção inválida" }, { status: 400 });
      }
      normalizedAnswer = selected.text;
      isCorrect = !!selected.isCorrect;
    } else {
      const expected = normalizeAnswer(exercise.answer);
      const received = normalizeAnswer(normalizedAnswer);
      isCorrect = expected.length > 0 && expected === received;
    }

    const previous = await prisma.exerciseAttempt.findUnique({
      where: {
        userId_exerciseId: {
          userId: auth.userId,
          exerciseId: id,
        },
      },
    });

    let awarded = false;
    let rewardAmount = 0;

    const canReward =
      !previous?.rewardedAt && isCorrect && isExerciseEligibleForReward(exercise);
    if (canReward) {
      const reward = await grantExerciseReward(auth.userId, id);
      awarded = reward.awarded;
      rewardAmount = reward.amount;
    }

    const resolvedRewardedAt = calculateRewardedAt(previous?.rewardedAt ?? null, awarded);
    const resolvedRewardAmount = previous?.rewardedAt ? previous.rewardAmount : rewardAmount;

    const attempt = await prisma.exerciseAttempt.upsert({
      where: {
        userId_exerciseId: {
          userId: auth.userId,
          exerciseId: id,
        },
      },
      update: {
        answer: normalizedAnswer || null,
        selectedOptionId: optionId || null,
        isCorrect,
        rewardedAt: resolvedRewardedAt,
        rewardAmount: resolvedRewardAmount,
      },
      create: {
        userId: auth.userId,
        exerciseId: id,
        answer: normalizedAnswer || null,
        selectedOptionId: optionId || null,
        isCorrect,
        rewardedAt: awarded ? new Date().toISOString() : null,
        rewardAmount,
      },
    });

    // ── Repetição espaçada (SM-2) ─────────────────────────────────────────────
    try {
      const existingReview = await prisma.exerciseReview.findUnique({
        where: { userId_exerciseId: { userId: auth.userId, exerciseId: id } },
      });
      const sm2Input = existingReview
        ? {
            interval: existingReview.interval,
            repetitions: existingReview.repetitions,
            easeFactor: existingReview.easeFactor,
          }
        : null;
      const sm2Next = nextSM2State(sm2Input, isCorrect);
      const reviewAt = nextReviewDate(sm2Next.interval).toISOString();
      await prisma.exerciseReview.upsert({
        where: { userId_exerciseId: { userId: auth.userId, exerciseId: id } },
        update: {
          interval: sm2Next.interval,
          repetitions: sm2Next.repetitions,
          easeFactor: sm2Next.easeFactor,
          nextReviewAt: reviewAt,
          lastReviewedAt: new Date().toISOString(),
        },
        create: {
          userId: auth.userId,
          exerciseId: id,
          interval: sm2Next.interval,
          repetitions: sm2Next.repetitions,
          easeFactor: sm2Next.easeFactor,
          nextReviewAt: reviewAt,
          lastReviewedAt: new Date().toISOString(),
        },
      });
    } catch (sm2Err) {
      // Non-critical: log but don't fail the submission
      console.error("[exercises/[id]/submit] SM-2 update failed", sm2Err);
    }

    return NextResponse.json({
      attempt,
      validation: {
        isCorrect,
        awarded,
        rewardAmount,
      },
    });
  } catch (error) {
    console.error("[exercises/[id]/submit POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
