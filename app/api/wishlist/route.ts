import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { order: 'asc' } },
            category: true,
            _count: {
              select: { reviews: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate average rating for each product
    const wishlistWithRatings = await Promise.all(
      wishlistItems.map(async (item) => {
        const avgRating = await prisma.review.aggregate({
          where: { productId: item.productId },
          _avg: { rating: true },
        })

        return {
          ...item,
          product: {
            ...item.product,
            averageRating: avgRating._avg.rating ?? 0,
          },
        }
      }),
    )

    return NextResponse.json({
      items: wishlistWithRatings,
      count: wishlistItems.length,
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 },
      )
    }

    if (product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 },
      )
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 },
      )
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { order: 'asc' } },
            category: true,
          },
        },
      },
    })

    return NextResponse.json(wishlistItem, { status: 201 })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    // Find and delete the wishlist item
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    if (!wishlistItem) {
      return NextResponse.json(
        { error: 'Item not found in wishlist' },
        { status: 404 },
      )
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    })

    return NextResponse.json({ message: 'Item removed from wishlist' })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 },
    )
  }
}