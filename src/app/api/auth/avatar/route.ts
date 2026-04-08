import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "edge";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "Esperado multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Campo 'file' ausente" }, { status: 400 });
    }

    const mimeType = file.type;
    const ext = ALLOWED_IMAGE_TYPES[mimeType];
    if (!ext) {
      return NextResponse.json({ error: "Apenas imagens JPEG, PNG, GIF ou WebP são permitidas" }, { status: 415 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: "Imagem excede o limite de 5 MB" }, { status: 413 });
    }

    const key = `avatars/${auth.userId}.${ext}`;

    const { env } = getRequestContext();
    await env["bk-psi"].put(key, bytes, {
      httpMetadata: { contentType: mimeType },
    });

    const avatarUrl = `/api/files/${key}`;

    await prisma.user.update({
      where: { id: auth.userId },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (err) {
    console.error("[/api/auth/avatar] Error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: { avatarUrl: null },
    });

    return NextResponse.json({ message: "Foto removida com sucesso" });
  } catch (err) {
    console.error("[/api/auth/avatar DELETE] Error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
