import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const sessions = await prisma.studySession.findMany({
      where: { userId: auth.userId },
      orderBy: { startedAt: "desc" },
      take: 50,
      include: {
        microTask: { select: { id: true, title: true } },
        recallAnswers: { select: { id: true, question: true } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[study/sessions GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { microTaskId, materialId } = await request.json();
    if (!microTaskId) {
      return NextResponse.json(
        { error: "Microtarefa é obrigatória para iniciar uma sessão" },
        { status: 400 }
      );
    }

    // Validate microtask belongs to user
    const microTask = await prisma.microTask.findUnique({ where: { id: microTaskId } });
    if (!microTask || microTask.userId !== auth.userId) {
      return NextResponse.json({ error: "Microtarefa não encontrada" }, { status: 404 });
    }
    if (microTask.completed) {
      return NextResponse.json(
        { error: "Esta microtarefa já foi concluída" },
        { status: 400 }
      );
    }

    // Abandon any existing active session
    await prisma.studySession.updateMany({
      where: { userId: auth.userId, status: "active" },
      data: { status: "abandoned" },
    });

    const session = await prisma.studySession.create({
      data: {
        userId: auth.userId,
        microTaskId,
        materialId: materialId || microTask.materialId || null,
        phase: "pomodoro",
        status: "active",
      },
      include: {
        microTask: { select: { id: true, title: true, description: true, materialId: true } },
        recallAnswers: true,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("[study/sessions POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
