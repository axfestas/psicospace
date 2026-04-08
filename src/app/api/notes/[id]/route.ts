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
    const { content } = await request.json();

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== auth.userId) {
      return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
    }

    const updated = await prisma.note.update({ where: { id }, data: { content } });
    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error("[notes/[id]]", error);
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
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== auth.userId) {
      return NextResponse.json({ error: "Nota não encontrada" }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ message: "Nota excluída com sucesso" });
  } catch (error) {
    console.error("[notes/[id]]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
