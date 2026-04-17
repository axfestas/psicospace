/**
 * Cloudflare Pages bindings configured in the dashboard.
 *
 * D1 database binding:  d1_psi  → d1_psi
 * R2 bucket binding:   bk-psi  → bk-psi
 *
 * Minimal interface definitions are used here to avoid pulling in
 * @cloudflare/workers-types globally (which overrides DOM Response.json()).
 * The full types are only imported in files that need them via the package.
 */

interface CfD1PreparedStatement {
  bind(...values: unknown[]): CfD1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: unknown }>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: unknown }>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface CfD1Database {
  prepare(query: string): CfD1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: CfD1PreparedStatement[]): Promise<{ results: T[]; success: boolean; meta: unknown }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface CfR2HttpMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

interface CfR2PutOptions {
  httpMetadata?: CfR2HttpMetadata;
  customMetadata?: Record<string, string>;
}

type CfR2Range =
  | { offset: number; length?: number }
  | { offset?: number; length: number }
  | { suffix: number };

interface CfR2GetOptions {
  range?: CfR2Range | Headers;
}

interface CfR2Object {
  key: string;
  version?: string;
  size: number;
  etag: string;
  /** ETag formatted for HTTP headers (includes quotes), e.g. `"abc123"` */
  httpEtag: string;
  /** Timestamp when the object was uploaded */
  uploaded: Date;
  writeHttpMetadata(headers: Headers): void;
  httpMetadata?: CfR2HttpMetadata;
  customMetadata?: Record<string, string>;
}

interface CfR2ObjectBody extends CfR2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

declare interface CloudflareEnv {
  /** Cloudflare D1 database binding (binding name: d1_psi) */
  d1_psi: CfD1Database;
  /** Cloudflare R2 bucket binding (binding name: bk-psi) */
  "bk-psi": {
    put(key: string, value: ArrayBuffer | ReadableStream | string | null, options?: CfR2PutOptions): Promise<void>;
    head(key: string): Promise<CfR2Object | null>;
    get(key: string, options?: CfR2GetOptions): Promise<CfR2ObjectBody | null>;
    delete(key: string): Promise<void>;
  };
}
