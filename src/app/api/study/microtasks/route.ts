import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const microTasks = await prisma.microTask.findMany({
      where: { userId: auth.userId },
      orderBy: [{ completed: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      include: {
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ microTasks });
  } catch (error) {
    console.error("[study/microtasks GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { title, description, materialId, order } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }
    if (title.trim().length < 3) {
      return NextResponse.json(
        { error: "Microtarefa deve ter pelo menos 3 caracteres" },
        { status: 400 }
      );
    }

    const microTask = await prisma.microTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        materialId: materialId || null,
        userId: auth.userId,
        order: order ?? 0,
      },
      include: {
        material: { select: { id: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ microTask }, { status: 201 });
  } catch (error) {
    console.error("[study/microtasks POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
