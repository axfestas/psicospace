import assert from "node:assert/strict";
import test from "node:test";
import { isEmptyContentMd5Etag, selectResponseEtag, toLastModifiedHeader } from "./http-validators";

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
