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
  {
    name: "20260417013600_add_library_item_thumbnail",
    sql: `
ALTER TABLE "LibraryItem" ADD COLUMN "thumbnailUrl" TEXT;
    `,
  },
  {
    name: "20260417020000_add_task_group",
    sql: `
ALTER TABLE "Task" ADD COLUMN "group" TEXT;
    `,
  },
  {
    name: "20260417100000_study_system",
    sql: `
CREATE TABLE IF NOT EXISTS "MicroTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "materialId" TEXT,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MicroTask_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MicroTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "microTaskId" TEXT NOT NULL,
    "materialId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "phase" TEXT NOT NULL DEFAULT 'selecting',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "pomodorosCompleted" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudySession_microTaskId_fkey" FOREIGN KEY ("microTaskId") REFERENCES "MicroTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ActiveRecallAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActiveRecallAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "explanation" TEXT,
    "materialId" TEXT,
    "libraryItemId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exercise_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exercise_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ExerciseOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExerciseOption_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
    `,
  },
  {
    name: "20260417112000_add_exercise_attempts",
    sql: `
CREATE TABLE IF NOT EXISTS "ExerciseAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "answer" TEXT,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "rewardedAt" DATETIME,
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseAttempt_userId_exerciseId_key" ON "ExerciseAttempt"("userId", "exerciseId");
    `,
  },
  {
    name: "20260418020503_exercise_difficulty",
    sql: `ALTER TABLE "Exercise" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'MEDIO';`,
  },
  {
    name: "20260418021500_exercise_review",
    sql: `
CREATE TABLE IF NOT EXISTS "ExerciseReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "nextReviewAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExerciseReview_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseReview_userId_exerciseId_key" ON "ExerciseReview"("userId", "exerciseId");
    `,
  },
  {
    name: "20260418174406_schema_repair",
    sql: `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ESTUDANTE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "avatarUrl" TEXT,
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
CREATE TABLE IF NOT EXISTS "LibraryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryItem_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "libraryItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Material_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "group" TEXT,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "MicroTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "materialId" TEXT,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MicroTask_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MicroTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "microTaskId" TEXT NOT NULL,
    "materialId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "phase" TEXT NOT NULL DEFAULT 'selecting',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "pomodorosCompleted" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudySession_microTaskId_fkey" FOREIGN KEY ("microTaskId") REFERENCES "MicroTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ActiveRecallAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActiveRecallAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIO',
    "materialId" TEXT,
    "libraryItemId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exercise_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_libraryItemId_fkey" FOREIGN KEY ("libraryItemId") REFERENCES "LibraryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exercise_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ExerciseOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ExerciseOption_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ExerciseAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "answer" TEXT,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "rewardedAt" DATETIME,
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,
    "attemptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ExerciseReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "nextReviewAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExerciseReview_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "MaterialProgress_userId_materialId_key" ON "MaterialProgress"("userId", "materialId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseAttempt_userId_exerciseId_key" ON "ExerciseAttempt"("userId", "exerciseId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExerciseReview_userId_exerciseId_key" ON "ExerciseReview"("userId", "exerciseId");
    `,
  },
  {
    name: "20260423193500_material_progress_current_page",
    sql: `ALTER TABLE "MaterialProgress" ADD COLUMN "currentPage" INTEGER NOT NULL DEFAULT 0;`,
  },
  {
    name: "20260425232144_add_perf_indexes",
    sql: `
CREATE INDEX IF NOT EXISTS "Discipline_periodId_idx" ON "Discipline"("periodId");
CREATE INDEX IF NOT EXISTS "Material_disciplineId_idx" ON "Material"("disciplineId");
CREATE INDEX IF NOT EXISTS "Material_uploadedById_idx" ON "Material"("uploadedById");
CREATE INDEX IF NOT EXISTS "Material_libraryItemId_idx" ON "Material"("libraryItemId");
CREATE INDEX IF NOT EXISTS "MaterialProgress_userId_idx" ON "MaterialProgress"("userId");
CREATE INDEX IF NOT EXISTS "LibraryItem_uploadedById_idx" ON "LibraryItem"("uploadedById");
CREATE INDEX IF NOT EXISTS "Exercise_createdById_idx" ON "Exercise"("createdById");
CREATE INDEX IF NOT EXISTS "Exercise_materialId_idx" ON "Exercise"("materialId");
CREATE INDEX IF NOT EXISTS "Exercise_libraryItemId_idx" ON "Exercise"("libraryItemId");
CREATE INDEX IF NOT EXISTS "Exercise_status_idx" ON "Exercise"("status");
CREATE INDEX IF NOT EXISTS "ExerciseOption_exerciseId_idx" ON "ExerciseOption"("exerciseId");
CREATE INDEX IF NOT EXISTS "ExerciseAttempt_exerciseId_idx" ON "ExerciseAttempt"("exerciseId");
CREATE INDEX IF NOT EXISTS "ExerciseReview_exerciseId_idx" ON "ExerciseReview"("exerciseId");
CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId");
CREATE INDEX IF NOT EXISTS "StudySession_microTaskId_idx" ON "StudySession"("microTaskId");
CREATE INDEX IF NOT EXISTS "MicroTask_userId_idx" ON "MicroTask"("userId");
CREATE INDEX IF NOT EXISTS "MicroTask_materialId_idx" ON "MicroTask"("materialId");
CREATE INDEX IF NOT EXISTS "ActiveRecallAnswer_sessionId_idx" ON "ActiveRecallAnswer"("sessionId");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Event_userId_idx" ON "Event"("userId");
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON "Document"("userId");
    `,
  },
  {
    name: "20260510160000_drop_psicogame_tables",
    sql: `
DROP TABLE IF EXISTS "PsicoTransaction";
DROP TABLE IF EXISTS "PsicoWallet";
DROP TABLE IF EXISTS "ShopItem";
DROP TABLE IF EXISTS "CharacterProgress";
    `,
  },
  {
    name: "20260808000000_add_user_disciplines",
    sql: `
CREATE TABLE IF NOT EXISTS "UserDiscipline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDiscipline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDiscipline_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserDiscipline_userId_disciplineId_key" ON "UserDiscipline"("userId", "disciplineId");
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
    lower.includes("duplicate column") ||
    lower.includes("already has a column named")
  );
}

async function ensureMigrationsTable(d1: CfD1Database): Promise<void> {
  await d1
    .prepare(
      `CREATE TABLE IF NOT EXISTS _psico_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`
    )
    .run();
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
// runMigrationStatements — execute a migration's SQL using a single D1 batch
// (1 subrequest) when possible, falling back to per-statement execution when
// any statement triggers an idempotent error (table/column already exists).
//
// Batching is critical: Cloudflare Workers has a per-request subrequest limit
// (50 on the free tier, 1 000 on Workers Paid). A fresh database needs ~18
// migrations × many statements ≈ 130+ individual prepare().run() calls, which
// exceeds the free-tier limit and causes the Worker to be killed with 503.
// Using d1.batch() reduces this to ~38 total subrequests.
// ---------------------------------------------------------------------------
async function runMigrationStatements(
  d1: CfD1Database,
  sql: string
): Promise<void> {
  const statements = splitSqlStatements(sql);
  if (statements.length === 0) return;

  // Attempt to run all statements as a single batch (1 subrequest).
  try {
    await d1.batch(statements.map((stmt) => d1.prepare(stmt)));
    return;
  } catch (batchErr) {
    const msg = batchErr instanceof Error ? batchErr.message : String(batchErr);
    if (!isIdempotentError(msg)) throw batchErr;
    // Batch failed because some statements hit idempotent errors (table/column
    // already exists). Fall back to executing statements one-by-one so that
    // idempotent errors are skipped while non-idempotent errors still propagate.
  }

  for (const stmt of statements) {
    try {
      await d1.prepare(stmt).run();
    } catch (stmtErr) {
      const msg = stmtErr instanceof Error ? stmtErr.message : String(stmtErr);
      if (isIdempotentError(msg)) {
        // Column or table already exists — safe to skip.
        continue;
      }
      console.error(`[migrate] statement failed: ${stmt}`);
      throw stmtErr;
    }
  }
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
      await runMigrationStatements(d1, migration.sql);
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
