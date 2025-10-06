import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      wishlists: wishlists.map(wishlist => ({
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
      })),
    })
  } catch (error) {
    console.error('Error fetching wishlists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlists' },
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

    const { name, description, isPublic = false } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Wishlist name is required' },
        { status: 400 },
      )
    }

    const shareToken = isPublic ? Math.random().toString(36).substring(2, 15) : null

    const wishlist = await prisma.wishlist.create({
      data: {
        userId: user.id,
        name,
        description,
        isPublic,
        shareToken,
      },
      include: {
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json({
      wishlist,
      message: 'Wishlist created successfully',
    })
  } catch (error) {
    console.error('Error creating wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to create wishlist' },
      { status: 500 },
    )
  }
}