import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const task = await prisma.microTask.findUnique({ where: { id } });
    if (!task || task.userId !== auth.userId) {
      return NextResponse.json({ error: "Microtarefa não encontrada" }, { status: 404 });
    }

    const { title, description, materialId, order, completed } = await request.json();

    const updated = await prisma.microTask.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(materialId !== undefined ? { materialId: materialId || null } : {}),
        ...(order !== undefined ? { order } : {}),
        ...(completed !== undefined ? { completed } : {}),
      },
      include: {
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ microTask: updated });
  } catch (error) {
    console.error("[study/microtasks/[id] PUT]", error);
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
    const task = await prisma.microTask.findUnique({ where: { id } });
    if (!task || task.userId !== auth.userId) {
      return NextResponse.json({ error: "Microtarefa não encontrada" }, { status: 404 });
    }

    await prisma.microTask.delete({ where: { id } });
    return NextResponse.json({ message: "Microtarefa excluída com sucesso" });
  } catch (error) {
    console.error("[study/microtasks/[id] DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
