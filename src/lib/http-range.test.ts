import assert from "node:assert/strict";
import test from "node:test";
import { ifRangeMatches, parseSingleByteRange } from "./http-range";

test("parseSingleByteRange parses bounded and open-ended ranges", () => {
  assert.deepEqual(parseSingleByteRange("bytes=0-1023", 10_000), { start: 0, end: 1023 });
  assert.deepEqual(parseSingleByteRange("bytes=1024-", 10_000), { start: 1024, end: 9999 });
  assert.deepEqual(parseSingleByteRange("Bytes=0-", 10_000), { start: 0, end: 9999 });
});

test("parseSingleByteRange parses suffix ranges and clamps end", () => {
  assert.deepEqual(parseSingleByteRange("bytes=-500", 10_000), { start: 9500, end: 9999 });
  assert.deepEqual(parseSingleByteRange("bytes=9500-15000", 10_000), { start: 9500, end: 9999 });
});

test("parseSingleByteRange rejects invalid and multi-range values", () => {
  assert.equal(parseSingleByteRange("bytes=10000-10001", 10_000), null);
  assert.equal(parseSingleByteRange("bytes=5-3", 10_000), null);
  assert.equal(parseSingleByteRange("bytes=0-1,2-3", 10_000), null);
  assert.equal(parseSingleByteRange("items=0-1", 10_000), null);
});

test("ifRangeMatches supports etag and date validators", () => {
  const uploadedAt = new Date("2026-04-17T07:00:00.000Z");
  assert.equal(ifRangeMatches("\"abc123\"", "\"abc123\"", uploadedAt), true);
  assert.equal(ifRangeMatches("W/\"abc123\"", "\"abc123\"", uploadedAt), true);
  assert.equal(ifRangeMatches("\"different\"", "\"abc123\"", uploadedAt), false);
  assert.equal(ifRangeMatches("Fri, 17 Apr 2026 08:00:00 GMT", "\"abc123\"", uploadedAt), true);
  assert.equal(ifRangeMatches("Fri, 17 Apr 2026 06:00:00 GMT", "\"abc123\"", uploadedAt), false);
});
