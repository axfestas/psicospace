import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { runMigrations } from "@/lib/migrate";

// Cache a PrismaClient per D1 binding instance so a single request reuses the
// same client, but new requests (with a new D1 binding reference) get a fresh
// one. The WeakMap ensures entries are garbage-collected with the binding.
const clientCache = new WeakMap<CfD1Database, PrismaClient>();

// Cache the migration-aware proxy per D1 binding instance as well.
const proxyCache = new WeakMap<CfD1Database, PrismaClient>();

// Module-level migration promise so we only call runMigrations() once per
// Worker isolate, regardless of how many concurrent requests arrive.
let migrationPromise: Promise<void> | null = null;

function getD1(): CfD1Database {
  const { env } = getRequestContext();
  const d1 = env.d1_psi;
  if (!d1) {
    throw new Error(
      "D1 database binding 'd1_psi' is not configured. " +
        "Add a D1 binding named 'd1_psi' in the Cloudflare Pages dashboard " +
        "under Settings → Functions → D1 database bindings."
    );
  }
  return d1;
}

function startMigration(d1: CfD1Database): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runMigrations(d1)
      .then(() => {
        console.log("[db] migrations OK");
      })
      .catch((err) => {
        console.error("[db] auto-migration error:", err);
        // Allow retry on the next isolate startup.
        migrationPromise = null;
      });
  }
  return migrationPromise;
}

function getPrismaClient(d1: CfD1Database): PrismaClient {
  let client = clientCache.get(d1);
  if (!client) {
    // PrismaD1 expects the D1Database type from @cloudflare/workers-types, but
    // importing that package globally pollutes DOM types (Response.json becomes
    // Promise<unknown>). Our inline CfD1Database is structurally compatible at
    // runtime; the cast is safe because D1 satisfies all methods PrismaD1 calls.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client = new PrismaClient({ adapter: new PrismaD1(d1 as any) });
    clientCache.set(d1, client);
  }
  return client;
}

// Build a two-level Proxy so that both direct client methods
// (prisma.$transaction) and model delegate methods (prisma.user.findUnique)
// always await the migration promise before executing.
function buildMigrationProxy(d1: CfD1Database): PrismaClient {
  let proxy = proxyCache.get(d1);
  if (proxy) return proxy;

  const migP = startMigration(d1);
  const client = getPrismaClient(d1);

  proxy = new Proxy(client, {
    get(target, prop) {
      const value = (target as unknown as Record<string | symbol, unknown>)[
        prop
      ];

      // Direct functions on PrismaClient (e.g. $transaction, $connect)
      if (typeof value === "function") {
        return async (...args: unknown[]) => {
          await migP;
          return (value as (...a: unknown[]) => unknown).apply(target, args);
        };
      }

      // Model delegates (e.g. client.user, client.notification) are objects
      // whose methods we also want to gate behind the migration promise.
      if (value !== null && typeof value === "object") {
        return new Proxy(value as object, {
          get(_t2, subProp) {
            const sub = (value as Record<string | symbol, unknown>)[subProp];
            if (typeof sub === "function") {
              return async (...args: unknown[]) => {
                await migP;
                return (sub as (...a: unknown[]) => unknown).apply(
                  value,
                  args
                );
              };
            }
            return sub;
          },
        });
      }

      return value;
    },
  });

  proxyCache.set(d1, proxy);
  return proxy;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const d1 = getD1();
    const proxy = buildMigrationProxy(d1);
    return (proxy as unknown as Record<string | symbol, unknown>)[prop];
  },
});
