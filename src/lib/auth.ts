import { SignJWT, jwtVerify } from "jose";
import { compare as bcryptCompare } from "bcrypt-ts";
import { cookies } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { Role } from "@/types";

function getJwtSecret(): string {
  // On Cloudflare Pages, env vars are exposed via the request context binding
  // env object. process.env is a fallback for local Next.js development.
  let secret: string | undefined;
  try {
    secret = getRequestContext().env.JWT_SECRET;
  } catch {
    // getRequestContext() throws outside a request context (e.g. during build).
  }
  secret ??= process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

const PBKDF2_ITERATIONS = 100_000;

function toHex(arr: Uint8Array): string {
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `pbkdf2:sha256:${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

export async function comparePassword(
  password: string,
  stored: string
): Promise<boolean> {
  // Legacy bcrypt hashes (e.g. $2a$, $2b$, $2y$) — verified via bcrypt-ts (pure TS, Edge-compatible).
  if (stored.startsWith("$2")) {
    return bcryptCompare(password, stored);
  }
  if (!stored.startsWith("pbkdf2:")) {
    return false;
  }
  const parts = stored.split(":");
  if (parts.length !== 5) return false;
  const [, , iterStr, saltHex, hashHex] = parts;
  const iterations = parseInt(iterStr, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const salt = fromHex(saltHex);
  const expected = fromHex(hashHex);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    expected.length * 8
  );
  const computed = new Uint8Array(bits);

  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed[i] ^ expected[i];
  }
  return diff === 0;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({ userId: payload.userId, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

const VALID_ROLES: Role[] = ["ESTUDANTE", "DOCENTE", "ADMIN", "SUPERADMIN"];

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, secret);
    const { userId, email, role } = payload;
    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      !VALID_ROLES.includes(role as Role)
    ) {
      return null;
    }
    return { userId, email, role: role as Role };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(token: string) {
  // In Cloudflare Pages/Edge, process.env.NODE_ENV is not reliably "production"
  // (CF Pages runtime does not populate it from the dashboard env vars into
  // process.env). We detect the CF runtime by calling getRequestContext(): it
  // succeeds inside a real CF Workers/Pages request and throws otherwise (e.g.
  // during a local `next dev` server). CF Pages always serves over HTTPS, so
  // secure=true is always correct there.
  let isSecure = process.env.NODE_ENV === "production";
  try {
    getRequestContext();
    isSecure = true;
  } catch {
    // Not in CF runtime (local Next.js dev server) — keep process.env.NODE_ENV check.
  }
  return {
    name: "auth-token",
    value: token,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };
}
