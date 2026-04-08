import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.userId !== auth.userId) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("[documents/[id]]", error);
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
    const { title, content } = await request.json();

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.userId !== auth.userId) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { title, content },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error("[documents/[id]]", error);
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
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document || document.userId !== auth.userId) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ message: "Documento excluído com sucesso" });
  } catch (error) {
    console.error("[documents/[id]]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
