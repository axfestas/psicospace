export function parseSingleByteRange(rangeHeader: string, totalSize: number): { start: number; end: number } | null {
  if (totalSize <= 0) return null;
  const normalizedRangeHeader = rangeHeader.trim();
  if (!/^bytes=/i.test(normalizedRangeHeader)) return null;

  const ranges = normalizedRangeHeader
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

export function ifRangeMatches(ifRangeHeader: string | null, etag: string | null, lastModified: Date | null): boolean {
  if (!ifRangeHeader) return true;
  const value = ifRangeHeader.trim();
  if (!value) return true;

  // Entity-tag validator
  if (value.startsWith("\"") || value.startsWith("W/\"")) {
    if (!etag) return false;
    const normalizedIfRange = value.replace(/^W\//, "");
    const normalizedEtag = etag.replace(/^W\//, "");
    return normalizedIfRange === normalizedEtag;
  }

  // HTTP-date validator
  if (!lastModified) return false;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return false;
  return lastModified.getTime() <= parsedDate.getTime();
}
