import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

function getExtension(fileName: string): string | null {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return null;
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function buildContentDispositionFilename(fileName: string): string {
  const asciiName = fileName
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\;%\r\n]/g, "_");
  const utf8Name = encodeURIComponent(fileName)
    .replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { key: segments } = await params;
    const key = segments.join("/");

    const { env } = getRequestContext();
    const object = await env["bk-psi"].get(key);

    if (!object) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    // Keys include a timestamp, so the same key always refers to the same
    // content. 1-year immutable is safe here — old keys are never reused.
    headers.set("cache-control", "private, max-age=31536000, immutable");

    // Derive the original filename from the key (format: userId/timestamp-filename)
    const filename = segments[segments.length - 1].replace(/^\d+-/, "");
    const contentDispositionFileName = buildContentDispositionFilename(filename);
    const inferredContentType = (() => {
      const extension = getExtension(filename);
      return extension ? CONTENT_TYPE_BY_EXTENSION[extension] : null;
    })();
    const contentType = headers.get("content-type") ?? inferredContentType ?? "application/octet-stream";
    headers.set("content-type", contentType);
    headers.set("x-content-type-options", "nosniff");

    // Ensure the browser renders the file inline rather than downloading it.
    // For browsers that don't support inline PDF rendering (e.g. mobile), a
    // fallback download/open-in-new-tab button is shown in the viewer modal.
    if (contentType.startsWith("application/pdf") || contentType.startsWith("image/")) {
      headers.set("content-disposition", `inline; ${contentDispositionFileName}`);
    } else {
      // Slides and other non-viewable types should trigger a download
      headers.set("content-disposition", `attachment; ${contentDispositionFileName}`);
    }

    return new NextResponse(object.body, { headers });
  } catch (err) {
    console.error("[/api/files] Unexpected error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
