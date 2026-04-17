import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const [sessions, microTasks] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId: auth.userId, status: "completed" },
        orderBy: { completedAt: "desc" },
        take: 30,
        include: {
          microTask: { select: { id: true, title: true } },
          recallAnswers: { select: { id: true, question: true, answer: true } },
        },
      }),
      prisma.microTask.findMany({
        where: { userId: auth.userId, completed: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const totalStudySeconds = sessions.reduce((s, sess) => s + sess.totalSeconds, 0);
    const totalPomodoros = sessions.reduce((s, sess) => s + sess.pomodorosCompleted, 0);

    return NextResponse.json({
      sessions,
      microTasksCompleted: microTasks.length,
      totalStudySeconds,
      totalPomodoros,
    });
  } catch (error) {
    console.error("[study/history GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
