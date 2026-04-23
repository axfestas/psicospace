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
    const progress = await prisma.materialProgress.findUnique({
      where: { userId_materialId: { userId: auth.userId, materialId: id } },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[materials/[id]/progress]", error);
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
    const body = await request.json();
    const { status, currentPage } = body as { status?: string; currentPage?: number };

    if (status === undefined && currentPage === undefined) {
      return NextResponse.json({ error: "status ou currentPage obrigatório" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (currentPage !== undefined) updateData.currentPage = Number(currentPage);

    const progress = await prisma.materialProgress.upsert({
      where: { userId_materialId: { userId: auth.userId, materialId: id } },
      update: updateData,
      create: { userId: auth.userId, materialId: id, ...updateData },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[materials/[id]/progress]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
