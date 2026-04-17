import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuthUser } from "@/lib/auth";
import { getFileExtensionFromUrl } from "@/lib/file-urls";

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
  avif: "image/avif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

function buildContentDispositionFilename(fileName: string): string {
  // Keep both an ASCII fallback and UTF-8 encoded name for broad browser
  // compatibility with Content-Disposition parsing.
  const baseName = fileName.replace(/[\r\n]/g, "");
  const asciiName = baseName
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9!#$&+.^_`~-]/g, "_")
    .slice(0, 150) || "file";
  const utf8Name = encodeURIComponent(baseName)
    .replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;
}

function notFoundResponse() {
  return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
}

function parseSingleByteRange(rangeHeader: string, totalSize: number): { start: number; end: number } | null {
  if (!rangeHeader.startsWith("bytes=") || totalSize <= 0) return null;

  const ranges = rangeHeader
    .slice("bytes=".length)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  // Only single-range responses are supported here.
  if (ranges.length !== 1) return null;

  const dashIndex = ranges[0].indexOf("-");
  if (dashIndex === -1) return null;
  const startRaw = ranges[0].slice(0, dashIndex);
  const endRaw = ranges[0].slice(dashIndex + 1);

  if (!startRaw) {
    // Suffix range: bytes=-N
    const suffixLength = Number(endRaw);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(totalSize - suffixLength, 0);
    return { start, end: totalSize - 1 };
  }

  const start = Number(startRaw);
  if (!Number.isInteger(start) || start < 0 || start >= totalSize) return null;

  let end = totalSize - 1;
  if (endRaw) {
    end = Number(endRaw);
    if (!Number.isInteger(end) || end < start) return null;
    end = Math.min(end, totalSize - 1);
  }

  return { start, end };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { key: segments } = await params;
    const key = segments.join("/");

    const { env } = getRequestContext();
    const bucket = env["bk-psi"];
    const rangeHeader = request.headers.get("range");

    let object: CfR2ObjectBody | null = null;
    let status = 200;
    let contentRange: string | null = null;
    let rangedContentLength: number | null = null;

    if (rangeHeader) {
      const head = await bucket.head(key);
      if (!head) {
        return notFoundResponse();
      }

      const parsedRange = parseSingleByteRange(rangeHeader, head.size);
      if (!parsedRange) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "accept-ranges": "bytes",
            "content-range": `bytes */${head.size}`,
            "cache-control": "private, max-age=0, must-revalidate",
          },
        });
      }

      const { start, end } = parsedRange;
      rangedContentLength = end - start + 1;
      contentRange = `bytes ${start}-${end}/${head.size}`;
      status = 206;
      object = await bucket.get(key, { range: { offset: start, length: rangedContentLength } });
    } else {
      object = await bucket.get(key);
    }

    if (!object) {
      return notFoundResponse();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("accept-ranges", "bytes");
    // This is an authenticated endpoint and can serve private material.
    // Revalidation avoids clients retaining long-lived private cached copies.
    headers.set("cache-control", "private, max-age=0, must-revalidate");
    if (status === 206) {
      if (contentRange === null || rangedContentLength === null) {
        throw new Error("Internal error: contentRange or rangedContentLength unexpectedly null in 206 response");
      }
      headers.set("content-range", contentRange);
      headers.set("content-length", String(rangedContentLength));
    } else if (!headers.get("content-length")) {
      headers.set("content-length", String(object.size));
    }

    // Derive the original filename from the key (format: userId/timestamp-filename)
    const filename = segments[segments.length - 1].replace(/^\d+-/, "");
    const contentDispositionFileName = buildContentDispositionFilename(filename);
    const hasStoredContentType = !!headers.get("content-type");
    const inferredContentType = (() => {
      const extension = getFileExtensionFromUrl(filename);
      return extension ? CONTENT_TYPE_BY_EXTENSION[extension] : null;
    })();
    const contentType = headers.get("content-type") ?? inferredContentType ?? "application/octet-stream";
    if (!hasStoredContentType && !inferredContentType) {
      console.warn(`[/api/files] Content-Type fallback used for key: ${key}`);
    }
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

    return new NextResponse(object.body, { status, headers });
  } catch (err) {
    console.error("[/api/files] Unexpected error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
