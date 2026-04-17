import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isInternalFileUrl, normalizeStoredMaterialUrl } from "@/lib/file-urls";

export const runtime = "edge";

const ALLOWED_TYPES = new Set(["PDF", "SLIDE", "LINK"]);

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const items = await prisma.libraryItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        url: normalizeStoredMaterialUrl(item.url, item.type),
        thumbnailUrl: item.thumbnailUrl ? normalizeStoredMaterialUrl(item.thumbnailUrl) : null,
      })),
    });
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

    const item = await prisma.libraryItem.create({
      data: {
        title,
        description,
        type,
        url: normalizedUrl,
        thumbnailUrl:
          typeof thumbnailUrl === "string" && thumbnailUrl.trim().length > 0
            ? normalizeStoredMaterialUrl(thumbnailUrl)
            : null,
        uploadedById: auth.userId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[biblioteca POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
