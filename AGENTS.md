<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database migrations

Migrations are managed in `src/lib/migrate.ts` and run **automatically** on the
first Prisma query of every Worker isolate (no manual `wrangler d1 execute`
needed).

**When you add or change a Prisma model:**
1. Create the migration SQL file under `prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql` as usual.
2. **Also** add a new entry to the `MIGRATIONS` array in `src/lib/migrate.ts`:
   - Use `CREATE TABLE IF NOT EXISTS` for new tables.
   - Use plain `ALTER TABLE "T" ADD COLUMN "col" TYPE;` for new columns (duplicate-column errors are silently ignored by the runner).
3. Do **not** rely on `wrangler d1 execute` — the app self-migrates on startup.
