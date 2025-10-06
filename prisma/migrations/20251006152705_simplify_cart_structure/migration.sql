-- AlterTable: Add variantId column to CartItem
ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;

-- DropTable: Drop CartItemVariant table
DROP TABLE IF EXISTS "CartItemVariant";

-- DropIndex: Drop old unique constraints
DROP INDEX IF EXISTS "CartItem_userId_productId_key";
DROP INDEX IF EXISTS "CartItem_sessionId_productId_key";

-- CreateIndex: Add new unique constraints with variantId
CREATE UNIQUE INDEX "CartItem_userId_productId_variantId_key" ON "CartItem"("userId", "productId", "variantId");
CREATE UNIQUE INDEX "CartItem_sessionId_productId_variantId_key" ON "CartItem"("sessionId", "productId", "variantId");

-- CreateIndex: Add variantId index
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");

-- AddForeignKey: Add variant foreign key
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
