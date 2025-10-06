import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateDefaultWishlist } from '@/lib/wishlist-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ inWishlist: false })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    // Get default wishlist
    const wishlist = await getOrCreateDefaultWishlist(user.id)

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    })

    return NextResponse.json({
      inWishlist: !!wishlistItem,
      wishlistItemId: wishlistItem?.id ?? null,
    })
  } catch (error) {
    console.error('Error checking wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to check wishlist' },
      { status: 500 },
    )
  }
}