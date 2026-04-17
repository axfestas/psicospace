import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { grantSessionReward } from "@/lib/psico-economy";

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

    // On completion: grant reward and mark microtask done
    if (isCompleting) {
      await grantSessionReward(auth.userId, id);
      await prisma.microTask.update({
        where: { id: session.microTaskId },
        data: { completed: true },
      });
    }

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("[study/sessions/[id] PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
