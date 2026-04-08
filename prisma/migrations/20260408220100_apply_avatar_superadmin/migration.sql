-- Ensure avatarUrl column exists (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Set alexmattinelli@outlook.com as SUPERADMIN
UPDATE "User" SET "role" = 'SUPERADMIN' WHERE "email" = 'alexmattinelli@outlook.com';
