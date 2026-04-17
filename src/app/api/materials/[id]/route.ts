import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const ALLOWED_TYPES = new Set(["PDF", "SLIDE", "LINK"]);

export async function PUT(
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

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        { error: "Tipo de material inválido. Tipos válidos: PDF, SLIDE, LINK" },
        { status: 400 }
      );
    }

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
    }

    if (auth.role === "DOCENTE" && material.uploadedById !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão para editar este material" }, { status: 403 });
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { title, type, url },
    });

    return NextResponse.json({ material: updated });
  } catch (error) {
    console.error("[materials/[id] PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
