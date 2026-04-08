-- AlterTable: add emailVerified and emailVerificationToken to User
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;

-- AlterTable: add type to Notification
ALTER TABLE "Notification" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'info';
