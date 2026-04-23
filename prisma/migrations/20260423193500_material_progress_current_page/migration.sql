-- Add currentPage to MaterialProgress for per-material reading position tracking
ALTER TABLE "MaterialProgress" ADD COLUMN "currentPage" INTEGER NOT NULL DEFAULT 0;
