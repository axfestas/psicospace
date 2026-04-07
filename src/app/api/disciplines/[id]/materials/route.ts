import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const materials = await prisma.material.findMany({
      where: { disciplineId: id },
      orderBy: { createdAt: "desc" },
      include: {
        progress: { where: { userId: auth.userId } },
        uploadedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ materials });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN", "DOCENTE"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const { title, type, url } = await request.json();
    if (!title || !type || !url) {
      return NextResponse.json(
        { error: "Título, tipo e URL são obrigatórios" },
        { status: 400 }
      );
    }

    const material = await prisma.material.create({
      data: { title, type, url, disciplineId: id, uploadedById: auth.userId },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
