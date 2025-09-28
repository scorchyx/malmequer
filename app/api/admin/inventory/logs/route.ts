import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest, _context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') // 'SALE', 'RETURN', 'RESTOCK', 'ADJUSTMENT'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    if (type) {
      where.type = type
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.inventoryLog.count({ where }),
    ])

    // Get summary statistics
    const summary = await prisma.inventoryLog.groupBy({
      by: ['type'],
      where,
      _sum: {
        quantity: true,
      },
      _count: true,
    })

    const enrichedLogs = logs.map(log => ({
      id: log.id,
      type: log.type,
      quantity: log.quantity,
      reason: log.reason,
      createdAt: log.createdAt,
      product: (log as any).product,
      user: (log as any).user,
      impact: log.type === 'SALE' || log.type === 'ADJUSTMENT' ? -log.quantity : log.quantity,
    }))

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: summary.reduce((acc, item) => {
        acc[item.type] = {
          count: item._count,
          totalQuantity: item._sum.quantity || 0,
        }
        return acc
      }, {} as Record<string, { count: number; totalQuantity: number }>),
      filters: {
        productId: productId || null,
        type: type || null,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching inventory logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory logs' },
      { status: 500 },
    )
  }
}

export const GET = withAdminAuth(getHandler)