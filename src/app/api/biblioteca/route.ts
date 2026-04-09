import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const items = await prisma.libraryItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[biblioteca GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN", "DOCENTE"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { title, description, type, url } = await request.json();
    if (!title || !type || !url) {
      return NextResponse.json(
        { error: "Título, tipo e URL são obrigatórios" },
        { status: 400 }
      );
    }

    const item = await prisma.libraryItem.create({
      data: { title, description, type, url, uploadedById: auth.userId },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[biblioteca POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
