import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isInternalFileUrl, normalizeStoredMaterialUrl } from "@/lib/file-urls";

export const runtime = "edge";
const ALLOWED_TYPES = new Set(["PDF", "SLIDE", "LINK"]);

async function ensureManagePermission() {
  const auth = await getAuthUser();
  if (!auth || !["ADMIN", "SUPERADMIN", "DOCENTE"].includes(auth.role)) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 403 }) };
  }
  return { auth };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permission = await ensureManagePermission();
    if (permission.error) return permission.error;
    const auth = permission.auth;

    const { id } = await params;
    const existing = await prisma.libraryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }
    if (auth.role === "DOCENTE" && existing.uploadedById !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão para editar este item" }, { status: 403 });
    }

    const { title, description, type, url, thumbnailUrl } = await request.json();
    if (!title || !type || !url) {
      return NextResponse.json(
        { error: "Título, tipo e URL são obrigatórios" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Tipo de material inválido." }, { status: 400 });
    }

    const normalizedUrl = normalizeStoredMaterialUrl(url, type);
    if (type !== "LINK" && !isInternalFileUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Para PDFs e slides, envie o arquivo por upload." },
        { status: 400 }
      );
    }

    const updated = await prisma.libraryItem.update({
      where: { id },
      data: {
        title,
        description: typeof description === "string" ? description : null,
        type,
        url: normalizedUrl,
        thumbnailUrl:
          typeof thumbnailUrl === "string" && thumbnailUrl.trim().length > 0
            ? normalizeStoredMaterialUrl(thumbnailUrl)
            : null,
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json({
      item: {
        ...updated,
        url: normalizeStoredMaterialUrl(updated.url, updated.type),
        thumbnailUrl: updated.thumbnailUrl ? normalizeStoredMaterialUrl(updated.thumbnailUrl) : null,
      },
    });
  } catch (error) {
    console.error("[biblioteca/[id] PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permission = await ensureManagePermission();
    if (permission.error) return permission.error;
    const auth = permission.auth;

    const { id } = await params;
    const existing = await prisma.libraryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
    }
    if (auth.role === "DOCENTE" && existing.uploadedById !== auth.userId) {
      return NextResponse.json({ error: "Sem permissão para remover este item" }, { status: 403 });
    }

    const transactionResults = await prisma.$transaction([
      prisma.material.deleteMany({ where: { libraryItemId: id } }),
      prisma.libraryItem.delete({ where: { id } }),
    ]);
    const deletedMaterials = transactionResults[0].count;
    return NextResponse.json({ success: true, deletedMaterials });
  } catch (error) {
    console.error("[biblioteca/[id] DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
