-- AlterTable: Add variant fields to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantValue" TEXT;

-- Migrate data from OrderItemVariant to OrderItem
-- For orders with variants, we need to consolidate the data
UPDATE "OrderItem" oi
SET
  "variantId" = oiv."variantId",
  "variantName" = oiv."variantName",
  "variantValue" = oiv."variantValue",
  "quantity" = oiv."quantity",
  "price" = oiv."price"
FROM "OrderItemVariant" oiv
WHERE oi."id" = oiv."orderItemId"
  AND oiv."id" IN (
    -- Get the first variant for each order item (in case there are multiple)
    SELECT DISTINCT ON ("orderItemId") "id"
    FROM "OrderItemVariant"
    ORDER BY "orderItemId", "id"
  );

-- DropTable: Drop OrderItemVariant table
DROP TABLE IF EXISTS "OrderItemVariant";

-- CreateIndex: Add indexes to OrderItem
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey: Add variant foreign key to OrderItem
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
