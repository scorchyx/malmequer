import { prisma } from '@/lib/prisma'

/**
 * Get or create a default wishlist for a user
 */
export async function getOrCreateDefaultWishlist(userId: string) {
  // Try to find existing wishlist
  let wishlist = await prisma.wishlist.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' }, // Get the oldest (default) wishlist
  })

  // Create if doesn't exist
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        userId,
        name: 'My Wishlist',
        isPublic: false,
      },
    })
  }

  return wishlist
}
