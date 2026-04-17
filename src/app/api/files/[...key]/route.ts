import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuthUser } from "@/lib/auth";
import { getFileExtensionFromUrl } from "@/lib/file-urls";
import { parseSingleByteRange } from "@/lib/http-range";
import { checkNotModified, selectResponseEtag, toLastModifiedHeader } from "@/lib/http-validators";

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

async function handleFileRequest(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
  includeBody: boolean
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { key: segments } = await params;
    const key = segments.join("/");

    const { env } = getRequestContext();
    const bucket = env["bk-psi"];
    const rangeHeader = request.headers.get("range");

    const headObject = await bucket.head(key);
    if (!headObject) {
      return notFoundResponse();
    }

    // Compute validators early so they can be used for both conditional-GET
    // (304) and the final response headers.
    const safeEtag = selectResponseEtag({
      httpEtag: headObject.httpEtag,
      etag: headObject.etag,
      size: headObject.size,
    });
    const safeLastModified = toLastModifiedHeader(headObject.uploaded);

    // Honour conditional GET (RFC 7232): return 304 Not Modified when the
    // client already has a fresh copy.  This is especially important for
    // embedded PDF viewers (e.g. Edge's built-in viewer inside an <iframe>)
    // which send a validation request before rendering; a spurious 200 with
    // the full body confuses those viewers and causes "something went wrong".
    if (
      checkNotModified(
        request.headers.get("if-none-match"),
        request.headers.get("if-modified-since"),
        safeEtag,
        headObject.uploaded,
      )
    ) {
      const notModifiedHeaders = new Headers();
      notModifiedHeaders.set("cache-control", "private, max-age=0, must-revalidate");
      notModifiedHeaders.set("accept-ranges", "bytes");
      if (safeEtag) notModifiedHeaders.set("etag", safeEtag);
      if (safeLastModified) notModifiedHeaders.set("last-modified", safeLastModified);
      return new NextResponse(null, { status: 304, headers: notModifiedHeaders });
    }

    let object: CfR2ObjectBody | null = null;
    let status = 200;
    let contentRange: string | null = null;
    let responseContentLength: number | null = null;

    const shouldServeRange = !!rangeHeader;

    if (shouldServeRange && rangeHeader) {
      const parsedRange = parseSingleByteRange(rangeHeader, headObject.size);
      if (!parsedRange) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "accept-ranges": "bytes",
            "content-range": `bytes */${headObject.size}`,
            "cache-control": "private, max-age=0, must-revalidate",
          },
        });
      }

      const { start, end } = parsedRange;
      responseContentLength = end - start + 1;
      contentRange = `bytes ${start}-${end}/${headObject.size}`;
      status = 206;

      if (includeBody) {
        object = await bucket.get(key, { range: { offset: start, length: responseContentLength } });
      }
    }

    if (includeBody && !object && status !== 206) {
      object = await bucket.get(key);
    }

    if (includeBody && !object) {
      return notFoundResponse();
    }
    const headers = new Headers();
    headObject.writeHttpMetadata(headers);
    headers.set("accept-ranges", "bytes");
    // This is an authenticated endpoint and can serve private material.
    // Revalidation avoids clients retaining long-lived private cached copies.
    headers.set("cache-control", "private, max-age=0, must-revalidate");
    headers.delete("etag");
    if (safeEtag) headers.set("etag", safeEtag);

    headers.delete("last-modified");
    if (safeLastModified) headers.set("last-modified", safeLastModified);

    if (responseContentLength === null && status !== 206) {
      responseContentLength = headObject.size;
    }
    if (status === 206) {
      if (contentRange === null || responseContentLength === null) {
        throw new Error("Internal error: 206 Partial Content response missing required contentRange or responseContentLength values");
      }
      headers.set("content-range", contentRange);
      headers.set("content-length", String(responseContentLength));
    } else if (!headers.get("content-length") && responseContentLength !== null) {
      headers.set("content-length", String(responseContentLength));
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

    return new NextResponse(includeBody && object ? object.body : null, { status, headers });
  } catch (err) {
    console.error("[/api/files] Unexpected error:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  return handleFileRequest(request, context, true);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  return handleFileRequest(request, context, false);
}
