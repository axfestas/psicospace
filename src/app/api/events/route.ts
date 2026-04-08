import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const events = await prisma.event.findMany({
      where: { userId: auth.userId },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[events]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { title, description, startAt, endAt } = await request.json();
    if (!title || !startAt || !endAt) {
      return NextResponse.json(
        { error: "Título, início e fim são obrigatórios" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        userId: auth.userId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[events]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
