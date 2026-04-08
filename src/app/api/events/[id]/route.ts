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
    const { title, description, startAt, endAt } = await request.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.userId !== auth.userId) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
      },
    });

    return NextResponse.json({ event: updated });
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
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.userId !== auth.userId) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: "Evento excluído com sucesso" });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
