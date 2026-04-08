-- Safe migration: add missing columns using IF NOT EXISTS (SQLite 3.37+/D1)

-- Ensure emailVerified and emailVerificationToken exist (in case previous migration was not applied)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'info';

-- Add password reset columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" DATETIME;

-- Add avatar URL column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
