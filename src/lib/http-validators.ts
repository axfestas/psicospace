const EMPTY_CONTENT_MD5 = "d41d8cd98f00b204e9800998ecf8427e";

function normalizeEtagValue(value: string): string {
  const trimmed = value.trim();
  const withoutWeakPrefix = trimmed.startsWith("W/") ? trimmed.slice(2).trim() : trimmed;
  return withoutWeakPrefix.replace(/^"|"$/g, "").trim();
}

function toHeaderEtag(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("\"") || trimmed.startsWith("W/\"")) return trimmed;
  return `"${trimmed}"`;
}

export function selectResponseEtag({
  httpEtag,
  etag,
  size,
}: {
  httpEtag?: string | null;
  etag?: string | null;
  size?: number | null;
}): string | null {
  const candidates = [httpEtag, etag];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeEtagValue(candidate);
    if (!normalized || normalized === "*") continue;
    const isEmptyContentMd5 = normalized.toLowerCase() === EMPTY_CONTENT_MD5;
    // Treat d41d8... as unreliable unless the object is explicitly known to be zero bytes.
    const isKnownZeroByteObject = size === 0;
    if (isEmptyContentMd5 && !isKnownZeroByteObject) {
      continue;
    }
    const headerEtag = toHeaderEtag(candidate);
    if (headerEtag) return headerEtag;
  }
  return null;
}

export function toLastModifiedHeader(uploaded: Date | null | undefined): string | null {
  if (!uploaded) return null;
  if (Number.isNaN(uploaded.getTime())) return null;
  return uploaded.toUTCString();
}
