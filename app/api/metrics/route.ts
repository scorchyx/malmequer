import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

interface SystemMetrics {
  timestamp: string
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
    gc?: {
      runs: number
      time: number
    }
  }
  process: {
    pid: number
    ppid: number
    platform: string
    version: string
  }
  database: {
    connections?: number
    slowQueries?: number
    avgResponseTime?: number
  }
  api: {
    totalRequests: number
    errorRate: number
    averageResponseTime: number
  }
  business: {
    totalUsers: number
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    ordersToday: number
    revenueToday: number
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      )
    }

    const metrics = await collectMetrics()

    log.info('Metrics collected', {
      adminUserId: user.id,
      type: 'metrics_collection',
    })

    return NextResponse.json(metrics)

  } catch (error) {
    log.error('Failed to collect metrics', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 },
    )
  }
}

async function collectMetrics(): Promise<SystemMetrics> {
  const memoryMetrics = getMemoryMetrics()
  const processMetrics = getProcessMetrics()
  const businessMetrics = await getBusinessMetrics()

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: memoryMetrics,
    process: processMetrics,
    database: {
      // These would typically come from monitoring tools
      connections: 0,
      slowQueries: 0,
      avgResponseTime: 0,
    },
    api: {
      // These would typically come from monitoring tools
      totalRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
    },
    business: businessMetrics,
  }
}

function getMemoryMetrics() {
  const memUsage = process.memoryUsage()
  const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100

  return {
    used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round(percentage * 100) / 100,
  }
}

function getProcessMetrics() {
  return {
    pid: process.pid,
    ppid: process.ppid || 0,
    platform: process.platform,
    version: process.version,
  }
}

async function getBusinessMetrics() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    ordersToday,
    revenueTodayResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'PAID' },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: today },
        paymentStatus: 'PAID',
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: today },
        paymentStatus: 'PAID',
      },
    }),
  ])

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    ordersToday,
    revenueToday: Number(revenueTodayResult._sum.totalAmount ?? 0),
  }
}