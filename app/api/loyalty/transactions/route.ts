import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
    const type = searchParams.get('type')

    const where: any = { userId: user.id }
    if (type && ['EARNED', 'REDEEMED', 'EXPIRED', 'ADJUSTED', 'BONUS'].includes(type)) {
      where.type = type
    }

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
            },
          },
        },
      }),
      prisma.loyaltyTransaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty transactions' },
      { status: 500 },
    )
  }
}