import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isInternalFileUrl, normalizeStoredMaterialUrl } from "@/lib/file-urls";

export const runtime = "edge";
const ALLOWED_TYPES = new Set(["PDF", "SLIDE", "LINK"]);

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

    return NextResponse.json({
      materials: materials.map((material) => ({
        ...material,
        url: normalizeStoredMaterialUrl(material.url, material.type),
      })),
    });
  } catch (error) {
    console.error("[disciplines/[id]/materials]", error);
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
    const { title, type, url, libraryItemId } = await request.json();
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

    const material = await prisma.material.create({
      data: {
        title,
        type,
        url: normalizedUrl,
        disciplineId: id,
        uploadedById: auth.userId,
        libraryItemId: libraryItemId ?? null,
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error("[disciplines/[id]/materials]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
