import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

// Valid phases in order
const PHASE_ORDER = ["pomodoro", "content", "recall", "break", "done"] as const;
type Phase = (typeof PHASE_ORDER)[number];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const session = await prisma.studySession.findUnique({
      where: { id },
      include: {
        microTask: { select: { id: true, title: true, description: true, materialId: true } },
        recallAnswers: true,
      },
    });

    if (!session || session.userId !== auth.userId) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("[study/sessions/[id] GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const session = await prisma.studySession.findUnique({
      where: { id },
      include: { recallAnswers: true },
    });
    if (!session || session.userId !== auth.userId) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    if (session.status !== "active") {
      return NextResponse.json({ error: "Sessão já finalizada" }, { status: 400 });
    }

    const body = await request.json();
    const { phase, totalSeconds, pomodorosCompleted, recallAnswers, abandon } = body;

    // Handle abandon
    if (abandon) {
      await prisma.studySession.update({
        where: { id },
        data: { status: "abandoned" },
      });
      return NextResponse.json({ message: "Sessão abandonada" });
    }

    // Validate phase transition
    if (phase) {
      const validPhases: Phase[] = ["pomodoro", "content", "recall", "break", "done"];
      if (!validPhases.includes(phase as Phase)) {
        return NextResponse.json({ error: "Fase inválida" }, { status: 400 });
      }

      // Require recall answers before completing
      if (phase === "done") {
        if (!session.recallAnswers || session.recallAnswers.length === 0) {
          return NextResponse.json(
            { error: "É necessário responder as perguntas de active recall antes de concluir" },
            { status: 400 }
          );
        }
      }
    }

    const isCompleting = phase === "done";

    const updated = await prisma.studySession.update({
      where: { id },
      data: {
        ...(phase ? { phase } : {}),
        ...(totalSeconds !== undefined ? { totalSeconds } : {}),
        ...(pomodorosCompleted !== undefined ? { pomodorosCompleted } : {}),
        ...(isCompleting
          ? { status: "completed", completedAt: new Date().toISOString() }
          : {}),
      },
      include: {
        microTask: { select: { id: true, title: true, description: true } },
        recallAnswers: true,
      },
    });

    // Save recall answers if provided
    if (recallAnswers && Array.isArray(recallAnswers) && recallAnswers.length > 0) {
      for (const qa of recallAnswers) {
        if (qa.question && qa.answer) {
          await prisma.activeRecallAnswer.create({
            data: {
              sessionId: id,
              question: qa.question,
              answer: qa.answer,
            },
          });
        }
      }
    }

    // On completion: mark microtask done + award Psico + update character
    if (isCompleting) {
      await prisma.microTask.update({
        where: { id: session.microTaskId },
        data: { completed: true },
      });

      await awardPsico(auth.userId, session.id, session.recallAnswers?.length ?? 0);
      await updateCharacter(auth.userId);
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("[study/sessions/[id] PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function awardPsico(userId: string, sessionId: string, recallCount: number) {
  try {
    // Get or create wallet
    let wallet = await prisma.psicoWallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.psicoWallet.create({
        data: { userId, balance: 0, updatedAt: new Date().toISOString() },
      });
    }

    const rewards: { amount: number; reason: string }[] = [];
    rewards.push({ amount: 10, reason: "session_completed" });
    if (recallCount > 0) rewards.push({ amount: 5, reason: "recall_answered" });
    rewards.push({ amount: 5, reason: "microtask_done" });

    const total = rewards.reduce((s, r) => s + r.amount, 0);

    await prisma.psicoWallet.update({
      where: { userId },
      data: {
        balance: { increment: total },
        updatedAt: new Date().toISOString(),
      },
    });

    for (const r of rewards) {
      await prisma.psicoTransaction.create({
        data: {
          walletId: wallet.id,
          amount: r.amount,
          type: "EARN",
          reason: r.reason,
          referenceId: sessionId,
        },
      });
    }
  } catch (e) {
    console.error("[awardPsico]", e);
  }
}

const XP_PER_LEVEL = 100;

async function updateCharacter(userId: string) {
  try {
    let char = await prisma.characterProgress.findUnique({ where: { userId } });
    const now = new Date();

    if (!char) {
      char = await prisma.characterProgress.create({
        data: {
          userId,
          level: 1,
          xp: 0,
          totalSessions: 0,
          currentStreak: 0,
          longestStreak: 0,
          updatedAt: now.toISOString(),
        },
      });
    }

    const earnedXp = 20;
    const newXp = char.xp + earnedXp;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

    // Calculate streak
    let newStreak = char.currentStreak;
    if (char.lastSessionAt) {
      const lastDate = new Date(char.lastSessionAt);
      const diffDays = Math.floor(
        (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 0) {
        // Same calendar day — keep streak unchanged
        newStreak = char.currentStreak;
      } else if (diffDays === 1) {
        // Consecutive day — extend streak
        newStreak = char.currentStreak + 1;
      } else {
        // Gap of 2+ days — reset streak
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await prisma.characterProgress.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        totalSessions: { increment: 1 },
        currentStreak: newStreak,
        longestStreak: Math.max(char.longestStreak, newStreak),
        lastSessionAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    });
  } catch (e) {
    console.error("[updateCharacter]", e);
  }
}
