import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const { title, completed, dueDate } = await request.json();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== auth.userId) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title,
        completed,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    return NextResponse.json({ task: updated });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== auth.userId) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: "Tarefa excluída com sucesso" });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
