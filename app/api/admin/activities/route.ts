import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

async function handler(request: NextRequest, _context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where = {
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(userId && { userId }),
    }

    const [activities, total] = await Promise.all([
      prisma.adminActivity.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminActivity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching admin activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin activities' },
      { status: 500 },
    )
  }
}

export const GET = withAdminAuth(handler)