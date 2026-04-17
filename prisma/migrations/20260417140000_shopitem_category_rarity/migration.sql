-- Add category and rarity fields to ShopItem
ALTER TABLE "ShopItem" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'GERAL';
ALTER TABLE "ShopItem" ADD COLUMN "rarity" TEXT NOT NULL DEFAULT 'COMUM';
