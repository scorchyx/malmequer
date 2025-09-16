-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- AlterTable
ALTER TABLE "public"."Address" ADD COLUMN     "type" "public"."AddressType" NOT NULL DEFAULT 'SHIPPING',
ADD COLUMN     "vatNumber" TEXT;

-- CreateIndex
CREATE INDEX "Address_userId_type_isDefault_idx" ON "public"."Address"("userId", "type", "isDefault");
