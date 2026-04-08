import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getRequestContext } from "@cloudflare/next-on-pages";

// Cache a PrismaClient per D1 binding instance so a single request reuses the
// same client, but new requests (with a new D1 binding reference) get a fresh
// one. The WeakMap ensures entries are garbage-collected with the binding.
const clientCache = new WeakMap<CfD1Database, PrismaClient>();

function getClient(): PrismaClient {
  const { env } = getRequestContext();
  const d1 = env.d1_psi;
  let client = clientCache.get(d1);
  if (!client) {
    // PrismaD1 accepts the D1 binding object; our CfD1Database interface is
    // structurally compatible with what PrismaD1 expects at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client = new PrismaClient({ adapter: new PrismaD1(d1 as any) });
    clientCache.set(d1, client);
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
