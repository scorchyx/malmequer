-- ================================================================
-- Migration: Remove database redundancies and optimize structure
-- ================================================================

-- Step 1: Remove ProductVariantAttribute table (unused)
DROP TABLE IF EXISTS "ProductVariantAttribute" CASCADE;

-- Step 2: Remove UserCoupon table (unused)
DROP TABLE IF EXISTS "UserCoupon" CASCADE;

-- Step 3: Remove redundant fields from Review
ALTER TABLE "Review" DROP COLUMN IF EXISTS "helpful";

-- Step 4: Remove redundant totalPoints from LoyaltyPoints
ALTER TABLE "LoyaltyPoints" DROP COLUMN IF EXISTS "totalPoints";

-- Step 5: Remove emailNotifications master switch from NotificationSettings
ALTER TABLE "NotificationSettings" DROP COLUMN IF EXISTS "emailNotifications";

-- Step 6: Fix WishlistItem structure
-- First, create a default wishlist for each user/session that has wishlist items without a wishlistId
DO $$
DECLARE
    user_rec RECORD;
    new_wishlist_id TEXT;
BEGIN
    -- For authenticated users with orphaned wishlist items
    FOR user_rec IN
        SELECT DISTINCT "userId"
        FROM "WishlistItem"
        WHERE "wishlistId" IS NULL AND "userId" IS NOT NULL
    LOOP
        -- Check if user already has a wishlist
        SELECT id INTO new_wishlist_id
        FROM "Wishlist"
        WHERE "userId" = user_rec."userId"
        LIMIT 1;

        -- If no wishlist exists, create one
        IF new_wishlist_id IS NULL THEN
            new_wishlist_id := gen_random_uuid()::TEXT;
            INSERT INTO "Wishlist" (id, "userId", name, "isPublic", "createdAt", "updatedAt")
            VALUES (new_wishlist_id, user_rec."userId", 'My Wishlist', false, NOW(), NOW());
        END IF;

        -- Assign orphaned items to this wishlist
        UPDATE "WishlistItem"
        SET "wishlistId" = new_wishlist_id
        WHERE "userId" = user_rec."userId" AND "wishlistId" IS NULL;
    END LOOP;

    -- For guest sessions with orphaned wishlist items
    FOR user_rec IN
        SELECT DISTINCT "sessionId"
        FROM "WishlistItem"
        WHERE "wishlistId" IS NULL AND "sessionId" IS NOT NULL AND "userId" IS NULL
    LOOP
        -- Guest wishlists need a userId, so we'll need to delete these or handle them differently
        -- For now, we'll delete guest wishlist items without a wishlist
        DELETE FROM "WishlistItem"
        WHERE "sessionId" = user_rec."sessionId" AND "wishlistId" IS NULL AND "userId" IS NULL;
    END LOOP;
END $$;

-- Remove userId and sessionId from WishlistItem (now only linked via Wishlist)
ALTER TABLE "WishlistItem" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "WishlistItem" DROP COLUMN IF EXISTS "sessionId";

-- Make wishlistId NOT NULL
ALTER TABLE "WishlistItem" ALTER COLUMN "wishlistId" SET NOT NULL;

-- Drop old unique constraints
DROP INDEX IF EXISTS "WishlistItem_userId_productId_key";
DROP INDEX IF EXISTS "WishlistItem_sessionId_productId_key";

-- Create new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "WishlistItem_wishlistId_productId_key" ON "WishlistItem"("wishlistId", "productId");

-- Step 7: Add missing performance indexes

-- CartItem indexes
CREATE INDEX IF NOT EXISTS "CartItem_userId_idx" ON "CartItem"("userId");
CREATE INDEX IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");

-- ProductVariant indexes
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- Payment indexes
CREATE INDEX IF NOT EXISTS "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
