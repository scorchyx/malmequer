import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateDefaultWishlist } from '@/lib/wishlist-helpers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    // Get default wishlist
    const wishlist = await getOrCreateDefaultWishlist(user.id)

    // Check if product exists in wishlist
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    })

    if (!wishlistItem) {
      return NextResponse.json(
        { error: 'Product not found in wishlist' },
        { status: 404 },
      )
    }

    // Check if product is available
    if (wishlistItem.product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 },
      )
    }

    // Check inventory across all variants
    const totalInventory = wishlistItem.product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
    if (totalInventory < quantity) {
      return NextResponse.json(
        { error: 'Insufficient inventory' },
        { status: 400 },
      )
    }

    // Start transaction to move from wishlist to cart
    const result = await prisma.$transaction(async (tx) => {
      // Check if item already exists in cart (base product, no variant)
      const variantId = null
      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId: user.id,
            productId,
            // @ts-ignore - Prisma doesn't fully support nullable fields in unique constraints
            variantId,
          },
        },
      })

      let cartItem
      if (existingCartItem) {
        // Update existing cart item
        cartItem = await tx.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
            variant: true,
          },
        })
      } else {
        // Create new cart item
        cartItem = await tx.cartItem.create({
          data: {
            userId: user.id,
            productId,
            variantId,
            quantity,
          },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
              },
            },
            variant: true,
          },
        })
      }

      // Remove from wishlist
      await tx.wishlistItem.delete({
        where: { id: wishlistItem.id },
      })

      return cartItem
    })

    return NextResponse.json({
      message: 'Product moved to cart successfully',
      cartItem: result,
    })
  } catch (error) {
    console.error('Error moving to cart:', error)
    return NextResponse.json(
      { error: 'Failed to move product to cart' },
      { status: 500 },
    )
  }
}