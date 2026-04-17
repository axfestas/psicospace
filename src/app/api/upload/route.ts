import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const ALLOWED_EXTENSIONS: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN", "DOCENTE"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
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

    const mimeType = file.type.toLowerCase();
    const lowerFileName = file.name.toLowerCase();
    const extensionIndex = lowerFileName.lastIndexOf(".");
    const fileExtension =
      extensionIndex > -1 ? lowerFileName.slice(extensionIndex + 1) : "";
    let detectedContentType = mimeType;
    let ext = ALLOWED_TYPES[mimeType];
    if (!ext && Object.prototype.hasOwnProperty.call(ALLOWED_EXTENSIONS, fileExtension)) {
      detectedContentType = ALLOWED_EXTENSIONS[fileExtension];
      ext = ALLOWED_TYPES[detectedContentType];
    }
    if (!ext) {
      return NextResponse.json(
        { error: `Tipo de arquivo não suportado: ${mimeType || fileExtension || "desconhecido"}` },
        { status: 415 }
      );
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo excede o limite de 50 MB" }, { status: 413 });
    }

    // Build a unique key: userId/timestamp-filename.ext
    // safeName strips all characters except alphanumerics, dots, hyphens, and
    // underscores, which prevents path-separator injection (no slashes remain).
    // auth.userId is a CUID from a verified JWT (alphanumeric only), so the
    // full key cannot contain any path-traversal sequences like "../".
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, "_") // collapse repeated dots (e.g. "..") for clarity
      .slice(0, 100);
    const key = `${auth.userId}/${Date.now()}-${safeName}`;

    const { env } = getRequestContext();
    await env["bk-psi"].put(key, bytes, {
      httpMetadata: { contentType: detectedContentType },
    });

    return NextResponse.json(
      { url: `/api/files/${key}`, key },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/upload] Unexpected error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
