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

/**
 * Returns true if the given ETag value is the MD5 hash of empty content
 * (`d41d8cd98f00b204e9800998ecf8427e`). Some storage providers return this
 * hash even for non-empty objects, making it an unreliable validator.
 */
export function isEmptyContentMd5Etag(etag: string | null | undefined): boolean {
  if (!etag) return false;
  return normalizeEtagValue(etag).toLowerCase() === EMPTY_CONTENT_MD5;
}

/**
 * Picks a safe ETag value for HTTP responses.
 *
 * Some storage providers return the MD5 of empty content (`d41d8...`) as an
 * ETag even for non-empty objects or when metadata is unavailable. Emitting
 * this sentinel breaks conditional requests and embedded viewers (e.g. PDF.js)
 * because the browser caches it and later uses it in `If-None-Match`/`If-Range`
 * headers, leading to incorrect 304 responses or missed 206 ranges.
 *
 * Therefore `d41d8...` is ALWAYS rejected here, regardless of object size.
 */
export function selectResponseEtag({
  httpEtag,
  etag,
}: {
  httpEtag?: string | null;
  etag?: string | null;
  size?: number | null; // retained for call-site compatibility; not used
}): string | null {
  const candidates = [httpEtag, etag];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeEtagValue(candidate);
    if (!normalized || normalized === "*") continue;
    // Always discard the empty-content MD5 sentinel — it is never reliable.
    if (normalized.toLowerCase() === EMPTY_CONTENT_MD5) continue;
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
