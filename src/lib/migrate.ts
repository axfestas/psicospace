/**
 * Auto-migration for Cloudflare D1.
 *
 * All migrations are embedded here as plain SQL strings.  Each entry is
 * idempotent:
 *   - CREATE TABLE statements use IF NOT EXISTS.
 *   - ALTER TABLE … ADD COLUMN statements are executed one-by-one; a
 *     "duplicate column" error from D1 is silently swallowed.
 *
 * `runMigrations(d1)` is called automatically by db.ts before the first
 * Prisma query in every new Worker isolate, so the schema is always current
 * without any manual `wrangler d1 execute` steps.
 */

export const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "20260408021614_init",
    sql: `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ESTUDANTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Period" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Discipline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Discipline_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "MaterialProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_VIEWED',
    CONSTRAINT "MaterialProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialProgress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialProgress_userId_materialId_key" ON "MaterialProgress"("userId", "materialId");
    `,
  },
  {
    name: "20260408032243_add_email_verification_notifications",
    sql: `
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "Notification" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'info';
    `,
  },
  {
    name: "20260408220000_add_reset_token_avatar",
    sql: `
ALTER TABLE "User" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpires" DATETIME;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
    `,
  },
  {
    name: "20260408220100_apply_avatar_superadmin",
    sql: `
UPDATE "User" SET "role" = 'SUPERADMIN' WHERE "email" = 'alexmattinelli@outlook.com';
    `,
  },
  {
    name: "20260409000000_add_library_item",
    sql: `
CREATE TABLE IF NOT EXISTS "LibraryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryItem_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
ALTER TABLE "Material" ADD COLUMN "libraryItemId" TEXT REFERENCES "LibraryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

function isIdempotentError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already exists") ||
    lower.includes("duplicate column name") ||
    lower.includes("duplicate column")
  );
}

async function ensureMigrationsTable(d1: CfD1Database): Promise<void> {
  await d1.exec(`
    CREATE TABLE IF NOT EXISTS _psico_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function getAppliedMigrations(
  d1: CfD1Database
): Promise<Record<string, string>> {
  const result = await d1
    .prepare("SELECT name, applied_at FROM _psico_migrations ORDER BY name")
    .all<{ name: string; applied_at: string }>();
  const map: Record<string, string> = {};
  for (const row of result.results) {
    map[row.name] = row.applied_at;
  }
  return map;
}

export interface MigrationResult {
  name: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// runMigrations — apply all pending migrations in order.
// Safe to call on every request; already-applied migrations are skipped.
// ---------------------------------------------------------------------------
export async function runMigrations(
  d1: CfD1Database
): Promise<MigrationResult[]> {
  await ensureMigrationsTable(d1);
  const applied = await getAppliedMigrations(d1);

  const results: MigrationResult[] = [];

  for (const migration of MIGRATIONS) {
    if (migration.name in applied) {
      results.push({ name: migration.name, success: true, skipped: true });
      continue;
    }

    try {
      const statements = splitSqlStatements(migration.sql);
      for (const stmt of statements) {
        try {
          await d1.exec(stmt + ";");
        } catch (stmtErr) {
          const msg =
            stmtErr instanceof Error ? stmtErr.message : String(stmtErr);
          if (isIdempotentError(msg)) {
            continue;
          }
          throw stmtErr;
        }
      }
      await d1
        .prepare(
          "INSERT INTO _psico_migrations (name, applied_at) VALUES (?, datetime('now'))"
        )
        .bind(migration.name)
        .run();
      results.push({ name: migration.name, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name: migration.name, success: false, error: message });
      // Stop on first real failure to preserve order integrity.
      break;
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// getMigrationStatus — list all migrations with applied/pending status.
// ---------------------------------------------------------------------------
export async function getMigrationStatus(d1: CfD1Database) {
  await ensureMigrationsTable(d1);
  const applied = await getAppliedMigrations(d1);

  return MIGRATIONS.map((m) => ({
    name: m.name,
    applied: m.name in applied,
    appliedAt: applied[m.name] ?? null,
  }));
}
