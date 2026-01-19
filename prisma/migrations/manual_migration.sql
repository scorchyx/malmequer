-- Migração manual para converter o sistema de variantes antigo para o novo

-- 1. Adicionar novas colunas com valores por defeito
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "priceExtra" DECIMAL(10,2);

-- 2. Migrar dados existentes
-- Converter variantes de "Tamanho" para tipo TAMANHO
UPDATE "ProductVariant"
SET "type" = 'TAMANHO', "label" = "value"
WHERE "name" = 'Tamanho';

-- Converter variantes de "Cor" para tipo COR (usando colorHex como value)
UPDATE "ProductVariant"
SET "type" = 'COR', "label" = "value", "value" = COALESCE("colorHex", '#808080')
WHERE "name" = 'Cor';

-- 3. Tornar colunas NOT NULL depois de migrar dados
ALTER TABLE "ProductVariant" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "ProductVariant" ALTER COLUMN "label" SET NOT NULL;

-- 4. Remover colunas antigas
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "name";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "colorHex";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "inventory";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "barcode";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "weight";

-- 5. Remover coluna price (será substituída por priceExtra)
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "price";

-- 6. Criar tabela StockItem
CREATE TABLE IF NOT EXISTS "StockItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeVariantId" TEXT NOT NULL,
    "colorVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- 7. Adicionar índices e constraints para StockItem
CREATE UNIQUE INDEX IF NOT EXISTS "StockItem_productId_sizeVariantId_colorVariantId_key" ON "StockItem"("productId", "sizeVariantId", "colorVariantId");
CREATE INDEX IF NOT EXISTS "StockItem_productId_idx" ON "StockItem"("productId");

-- 8. Adicionar foreign keys para StockItem
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_sizeVariantId_fkey" FOREIGN KEY ("sizeVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_colorVariantId_fkey" FOREIGN KEY ("colorVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. Actualizar CartItem
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "stockItemId" TEXT;
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_variantId_fkey";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_productId_variantId_key";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_sessionId_productId_variantId_key";
ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "variantId";
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_userId_productId_stockItemId_key" ON "CartItem"("userId", "productId", "stockItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_sessionId_productId_stockItemId_key" ON "CartItem"("sessionId", "productId", "stockItemId");
CREATE INDEX IF NOT EXISTS "CartItem_stockItemId_idx" ON "CartItem"("stockItemId");
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Actualizar OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "stockItemId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "sizeLabel" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "sizeValue" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "colorLabel" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "colorValue" TEXT;
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_variantId_fkey";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variantId";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variantName";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "variantValue";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "OrderItem_stockItemId_idx" ON "OrderItem"("stockItemId");

-- 11. Actualizar índices da ProductVariant
DROP INDEX IF EXISTS "ProductVariant_productId_name_value_key";
DROP INDEX IF EXISTS "ProductVariant_productId_idx";
DROP INDEX IF EXISTS "ProductVariant_barcode_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_type_value_key" ON "ProductVariant"("productId", "type", "value");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_type_idx" ON "ProductVariant"("productId", "type");

-- 12. Converter o tipo TEXT para enum
-- Primeiro criar o enum se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VariantType') THEN
        CREATE TYPE "VariantType" AS ENUM ('COR', 'TAMANHO');
    END IF;
END $$;

-- Converter a coluna para usar o enum
ALTER TABLE "ProductVariant" ALTER COLUMN "type" TYPE "VariantType" USING "type"::"VariantType";
