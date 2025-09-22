import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGuestSessionId, setGuestSessionCookie } from '@/lib/guest-session'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    let wishlistItems

    if (user) {
      // Authenticated user wishlist
      wishlistItems = await prisma.wishlistItem.findMany({
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
    } else {
      // Guest user wishlist
      const sessionId = getGuestSessionId(request)

      wishlistItems = await prisma.wishlistItem.findMany({
        where: { sessionId },
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
    }

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

    const response = NextResponse.json({
      items: wishlistWithRatings,
      count: wishlistItems.length,
    })

    // Set guest session cookie if needed
    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(response, getGuestSessionId(request))
    }

    return response
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

    let existingItem
    let wishlistItem

    if (user) {
      // Authenticated user wishlist
      existingItem = await prisma.wishlistItem.findUnique({
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

      wishlistItem = await prisma.wishlistItem.create({
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
    } else {
      // Guest user wishlist
      const sessionId = getGuestSessionId(request)

      existingItem = await prisma.wishlistItem.findUnique({
        where: {
          sessionId_productId: {
            sessionId,
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

      wishlistItem = await prisma.wishlistItem.create({
        data: {
          sessionId,
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
    }

    const response = NextResponse.json(wishlistItem, { status: 201 })

    // Set guest session cookie if needed
    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(response, getGuestSessionId(request))
    }

    return response
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

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    let wishlistItem

    if (user) {
      // Authenticated user wishlist
      wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
      })
    } else {
      // Guest user wishlist
      const sessionId = getGuestSessionId(request)

      wishlistItem = await prisma.wishlistItem.findUnique({
        where: {
          sessionId_productId: {
            sessionId,
            productId,
          },
        },
      })
    }

    if (!wishlistItem) {
      return NextResponse.json(
        { error: 'Item not found in wishlist' },
        { status: 404 },
      )
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    })

    const response = NextResponse.json({ message: 'Item removed from wishlist' })

    // Set guest session cookie if needed
    if (!user && !request.cookies.get('guest_session_id')?.value) {
      setGuestSessionCookie(response, getGuestSessionId(request))
    }

    return response
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 },
    )
  }
}