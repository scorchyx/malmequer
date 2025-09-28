import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        shareToken: token,
        isPublic: true,
      },
      include: {
        user: {
          select: { name: true },
        },
        items: {
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { order: 'asc' } },
                category: { select: { name: true } },
                variants: {
                  select: { inventory: true },
                },
              },
            },
          },
          orderBy: { priority: 'desc' },
        },
        _count: { select: { items: true } },
      },
    })

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found or not public' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      wishlist: {
        ...wishlist,
        items: wishlist.items.map(item => ({
          ...item,
          product: {
            ...item.product,
            price: Number(item.product.price),
            comparePrice: item.product.comparePrice ? Number(item.product.comparePrice) : null,
            totalInventory: item.product.variants.reduce((sum, variant) => sum + variant.inventory, 0),
          },
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching shared wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared wishlist' },
      { status: 500 }
    )
  }
}