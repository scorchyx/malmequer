import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
    const status = searchParams.get('status')

    const where: any = {}

    // Regular users can only see their own refunds
    if (user.role !== 'ADMIN') {
      where.order = { userId: user.id }
    }

    if (status && ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)) {
      where.status = status
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
          processor: {
            select: { name: true, email: true },
          },
          items: {
            include: {
              orderItem: {
                select: {
                  name: true,
                  price: true,
                  quantity: true,
                },
              },
            },
          },
        },
      }),
      prisma.refund.count({ where }),
    ])

    return NextResponse.json({
      refunds: refunds.map(refund => ({
        ...refund,
        amount: Number(refund.amount),
        items: refund.items.map(item => ({
          ...item,
          amount: Number(item.amount),
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId, reason, items, notes } = await request.json()

    if (!orderId || !reason || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Order ID, reason, and items are required' },
        { status: 400 }
      )
    }

    // Verify order exists and belongs to user (or user is admin)
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(user.role !== 'ADMIN' && { userId: user.id }),
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Calculate total refund amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId)
      if (!orderItem) return sum
      const itemAmount = Number(orderItem.price) * item.quantity
      return sum + itemAmount
    }, 0)

    // Generate refund number
    const refundCount = await prisma.refund.count()
    const refundNumber = `REF-${Date.now()}-${refundCount + 1}`

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        orderId,
        amount: totalAmount,
        reason,
        notes,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            amount: Number(order.items.find(oi => oi.id === item.orderItemId)?.price) * item.quantity,
            reason: item.reason,
          })),
        },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
          },
        },
        items: {
          include: {
            orderItem: {
              select: {
                name: true,
                price: true,
                quantity: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      refund: {
        ...refund,
        amount: Number(refund.amount),
        items: refund.items.map(item => ({
          ...item,
          amount: Number(item.amount),
        })),
      },
      message: 'Refund request created successfully',
    })
  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { error: 'Failed to create refund' },
      { status: 500 }
    )
  }
}