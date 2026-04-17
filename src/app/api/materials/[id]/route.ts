import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isInternalFileUrl, normalizeStoredMaterialUrl } from "@/lib/file-urls";

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

    if (!title || !type) {
      return NextResponse.json({ error: "Título e tipo são obrigatórios" }, { status: 400 });
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

    const currentUrl = normalizeStoredMaterialUrl(material.url, material.type);
    const incomingUrl =
      typeof url === "string" && url.trim().length > 0
        ? normalizeStoredMaterialUrl(url, type)
        : undefined;

    if (type === "LINK" && !incomingUrl) {
      return NextResponse.json({ error: "URL é obrigatória para materiais do tipo LINK" }, { status: 400 });
    }

    const finalUrl = type === "LINK" ? incomingUrl! : incomingUrl ?? currentUrl;
    if (type !== "LINK" && !isInternalFileUrl(finalUrl)) {
      return NextResponse.json(
        { error: "Para PDFs e slides, envie o arquivo por upload." },
        { status: 400 }
      );
    }

    const updated = await prisma.material.update({
      where: { id },
      data: { title, type, url: finalUrl },
    });

    return NextResponse.json({ material: updated });
  } catch (error) {
    console.error("[materials/[id] PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
