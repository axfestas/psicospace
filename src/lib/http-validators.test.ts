import assert from "node:assert/strict";
import test from "node:test";
import { checkNotModified, isEmptyContentMd5Etag, selectResponseEtag, toLastModifiedHeader } from "./http-validators";

test("selectResponseEtag prefers httpEtag and normalizes plain values", () => {
  assert.equal(selectResponseEtag({ httpEtag: "\"abc123\"", etag: "\"def456\"", size: 100 }), "\"abc123\"");
  assert.equal(selectResponseEtag({ httpEtag: "abc123", size: 100 }), "\"abc123\"");
  assert.equal(selectResponseEtag({ httpEtag: "W/\"abc123\"", size: 100 }), "W/\"abc123\"");
});

test("selectResponseEtag drops empty-content md5 for non-empty files", () => {
  assert.equal(
    selectResponseEtag({
      httpEtag: "\"d41d8cd98f00b204e9800998ecf8427e\"",
      etag: "\"backup\"",
      size: 42,
    }),
    "\"backup\""
  );
  assert.equal(
    selectResponseEtag({
      httpEtag: "\"d41d8cd98f00b204e9800998ecf8427e\"",
      size: 42,
    }),
    null
  );
});

test("selectResponseEtag always drops empty-content md5 regardless of size", () => {
  // size unknown
  assert.equal(selectResponseEtag({ httpEtag: "\"d41d8cd98f00b204e9800998ecf8427e\"" }), null);
  // size explicitly zero (still rejected — the sentinel is never reliable)
  assert.equal(selectResponseEtag({ httpEtag: "\"d41d8cd98f00b204e9800998ecf8427e\"", size: 0 }), null);
  // falls back to etag candidate when httpEtag is the sentinel
  assert.equal(
    selectResponseEtag({ httpEtag: "\"d41d8cd98f00b204e9800998ecf8427e\"", etag: "\"backup\"", size: 42 }),
    "\"backup\""
  );
});

test("isEmptyContentMd5Etag identifies the sentinel in various formats", () => {
  assert.equal(isEmptyContentMd5Etag("\"d41d8cd98f00b204e9800998ecf8427e\""), true);
  assert.equal(isEmptyContentMd5Etag("d41d8cd98f00b204e9800998ecf8427e"), true);
  assert.equal(isEmptyContentMd5Etag("W/\"d41d8cd98f00b204e9800998ecf8427e\""), true);
  assert.equal(isEmptyContentMd5Etag("D41D8CD98F00B204E9800998ECF8427E"), true); // uppercase
  assert.equal(isEmptyContentMd5Etag("\"abc123\""), false);
  assert.equal(isEmptyContentMd5Etag(null), false);
  assert.equal(isEmptyContentMd5Etag(undefined), false);
  assert.equal(isEmptyContentMd5Etag(""), false);
});

test("toLastModifiedHeader formats valid date and rejects invalid values", () => {
  assert.equal(toLastModifiedHeader(new Date("2026-04-17T18:00:00.000Z")), "Fri, 17 Apr 2026 18:00:00 GMT");
  assert.equal(toLastModifiedHeader(new Date("invalid date")), null);
  assert.equal(toLastModifiedHeader(null), null);
});

test("checkNotModified: If-None-Match etag comparison (weak)", () => {
  // exact strong match
  assert.equal(checkNotModified('"abc123"', null, '"abc123"', null), true);
  // weak vs strong — strip W/ and compare
  assert.equal(checkNotModified('W/"abc123"', null, '"abc123"', null), true);
  assert.equal(checkNotModified('"abc123"', null, 'W/"abc123"', null), true);
  // mismatch
  assert.equal(checkNotModified('"abc123"', null, '"def456"', null), false);
  // no server etag → not modified is false
  assert.equal(checkNotModified('"abc123"', null, null, null), false);
  // wildcard * always matches when etag present
  assert.equal(checkNotModified('*', null, '"abc123"', null), true);
  // comma-separated list
  assert.equal(checkNotModified('"xxx", "abc123"', null, '"abc123"', null), true);
  assert.equal(checkNotModified('"xxx", "yyy"', null, '"abc123"', null), false);
});

test("checkNotModified: If-Modified-Since date comparison", () => {
  const uploaded = new Date("Mon, 13 Apr 2026 04:17:24 GMT");
  // exactly equal → 304 (not modified since that exact moment)
  assert.equal(checkNotModified(null, "Mon, 13 Apr 2026 04:17:24 GMT", null, uploaded), true);
  // since is after last-modified → 304
  assert.equal(checkNotModified(null, "Mon, 13 Apr 2026 05:00:00 GMT", null, uploaded), true);
  // since is before last-modified → 200
  assert.equal(checkNotModified(null, "Mon, 13 Apr 2026 03:00:00 GMT", null, uploaded), false);
  // no lastModified → 200
  assert.equal(checkNotModified(null, "Mon, 13 Apr 2026 04:17:24 GMT", null, null), false);
  // invalid date → 200
  assert.equal(checkNotModified(null, "not-a-date", null, uploaded), false);
});

test("checkNotModified: If-None-Match takes precedence over If-Modified-Since", () => {
  const uploaded = new Date("Mon, 13 Apr 2026 04:17:24 GMT");
  // etag mismatch but date would say 304 — etag wins → 200
  assert.equal(checkNotModified('"different"', "Mon, 13 Apr 2026 05:00:00 GMT", '"abc123"', uploaded), false);
  // etag matches regardless of date → 304
  assert.equal(checkNotModified('"abc123"', "Mon, 13 Apr 2026 03:00:00 GMT", '"abc123"', uploaded), true);
});

test("checkNotModified: no headers → never 304", () => {
  assert.equal(checkNotModified(null, null, '"abc123"', new Date()), false);
});
