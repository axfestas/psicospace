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
    const { status } = await request.json();

    const progress = await prisma.materialProgress.upsert({
      where: { userId_materialId: { userId: auth.userId, materialId: id } },
      update: { status },
      create: { userId: auth.userId, materialId: id, status },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[materials/[id]/progress]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
