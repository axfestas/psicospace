import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const notes = await prisma.note.findMany({
      where: { userId: auth.userId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[notes]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { content } = await request.json();

    const note = await prisma.note.create({
      data: { content: content || "", userId: auth.userId },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[notes]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
