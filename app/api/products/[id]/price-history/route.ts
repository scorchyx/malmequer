import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

    const priceHistory = await prisma.priceHistory.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Calculate price changes
    const historyWithChanges = priceHistory.map((entry, index) => {
      const nextEntry = priceHistory[index + 1]
      let change = null
      let changePercentage = null

      if (nextEntry) {
        const currentPrice = Number(entry.price)
        const previousPrice = Number(nextEntry.price)
        change = currentPrice - previousPrice
        changePercentage = ((change / previousPrice) * 100)
      }

      return {
        ...entry,
        price: Number(entry.price),
        comparePrice: entry.comparePrice ? Number(entry.comparePrice) : null,
        change,
        changePercentage,
      }
    })

    return NextResponse.json({
      productId: id,
      history: historyWithChanges,
      count: historyWithChanges.length,
    })
  } catch (error) {
    console.error('Error fetching price history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { price, comparePrice, reason } = await request.json()

    if (!price || typeof price !== 'number') {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, price: true, comparePrice: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Create price history entry
    const priceHistoryEntry = await prisma.priceHistory.create({
      data: {
        productId: id,
        price,
        comparePrice,
        reason,
        createdBy: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Update product price
    await prisma.product.update({
      where: { id },
      data: {
        price,
        comparePrice,
      },
    })

    return NextResponse.json({
      priceHistory: {
        ...priceHistoryEntry,
        price: Number(priceHistoryEntry.price),
        comparePrice: priceHistoryEntry.comparePrice ? Number(priceHistoryEntry.comparePrice) : null,
      },
      message: 'Price updated successfully',
    })
  } catch (error) {
    console.error('Error updating price:', error)
    return NextResponse.json(
      { error: 'Failed to update price' },
      { status: 500 }
    )
  }
}