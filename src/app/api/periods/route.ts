import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" },
      include: {
        disciplines: {
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json({ periods });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { name, order } = await request.json();
    if (!name || order === undefined) {
      return NextResponse.json({ error: "Nome e ordem são obrigatórios" }, { status: 400 });
    }

    const period = await prisma.period.create({ data: { name, order } });
    return NextResponse.json({ period }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
