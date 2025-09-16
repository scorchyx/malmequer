import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth } from "@/lib/admin-auth"

async function handler(request: NextRequest, context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") ?? "30" // days

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get dashboard statistics
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      topProducts,
      revenueByDay,
    ] = await Promise.all([
      // Total orders in period
      prisma.order.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Total revenue in period
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          paymentStatus: "PAID",
        },
        _sum: { totalAmount: true },
      }),

      // Total customers
      prisma.user.count({
        where: {
          role: "USER",
          createdAt: { gte: startDate },
        },
      }),

      // Total products
      prisma.product.count(),

      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),

      // Top selling products
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: {
            createdAt: { gte: startDate },
            paymentStatus: "PAID",
          },
        },
        _sum: { quantity: true },
        _count: { productId: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Revenue by day
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          SUM(total_amount) as revenue,
          COUNT(*) as orders
        FROM "Order"
        WHERE created_at >= ${startDate}
          AND payment_status = 'PAID'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
    ])

    // Get product details for top products
    const topProductIds = topProducts.map((p) => p.productId)
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true },
    })

    const topProductsWithDetails = topProducts.map((item) => {
      const product = productDetails.find((p) => p.id === item.productId)
      return {
        ...item,
        product,
      }
    })

    return NextResponse.json({
      period: periodDays,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalCustomers,
        totalProducts,
      },
      recentOrders,
      topProducts: topProductsWithDetails,
      revenueByDay,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(handler)