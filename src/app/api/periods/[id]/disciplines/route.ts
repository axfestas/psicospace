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
    const disciplines = await prisma.discipline.findMany({
      where: { periodId: id },
      orderBy: { name: "asc" },
      include: {
        materials: {
          orderBy: { createdAt: "desc" },
          include: {
            progress: {
              where: { userId: auth.userId },
            },
          },
        },
      },
    });

    return NextResponse.json({ disciplines });
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
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const discipline = await prisma.discipline.create({
      data: { name, description, periodId: id },
    });

    return NextResponse.json({ discipline }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
