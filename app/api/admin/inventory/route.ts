import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, logAdminActivity } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// Get inventory overview and low stock alerts
async function getHandler(request: NextRequest, _context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const filter = searchParams.get('filter') // 'low-stock', 'out-of-stock', 'overstocked', 'all'
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Apply stock filters (now based on variants)
    switch (filter) {
      case 'low-stock':
        where.variants = { some: { inventory: { gt: 0, lte: 10 } } }
        break
      case 'out-of-stock':
        where.variants = { every: { inventory: { lte: 0 } } }
        break
      case 'overstocked':
        where.variants = { some: { inventory: { gte: 100 } } }
        break
      case 'all':
      default:
        // No additional filter
        break
    }

    const [products, totalCount, stockSummary] = await Promise.all([
      // Products with inventory details
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { name: true },
          },
          variants: {
            select: {
              id: true,
              name: true,
              inventory: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
        ],
      }),

      // Total count for pagination
      prisma.product.count({ where }),

      // Stock summary statistics (now calculated from variants)
      prisma.productVariant.aggregate({
        _count: true,
        _sum: {
          inventory: true,
        },
        _avg: {
          inventory: true,
        },
      }),
    ])

    // Get stock alerts counts (now based on variants)
    const [lowStockCount, outOfStockCount, overstockedCount] = await Promise.all([
      prisma.product.count({
        where: {
          variants: {
            some: {
              inventory: { gt: 0, lte: 10 },
            },
          },
        },
      }),
      prisma.product.count({
        where: {
          variants: {
            every: {
              inventory: { lte: 0 },
            },
          },
        },
      }),
      prisma.product.count({
        where: {
          variants: {
            some: {
              inventory: { gte: 100 },
            },
          },
        },
      }),
    ])

    // Calculate stock movements for trending
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentMovements = await prisma.inventoryLog.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        type: { in: ['SALE', 'RETURN'] },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    })

    const enrichedProducts = products.map(product => {
      const totalInventory = (product as any).variants?.reduce((sum: number, v: any) => sum + v.inventory, 0) ?? 0
      const stockStatus =
        totalInventory <= 0 ? 'out-of-stock' :
          totalInventory <= 10 ? 'low-stock' :
            totalInventory >= 100 ? 'overstocked' : 'normal'

      const recentMovement = recentMovements.find(m => m.productId === product.id)
      const salesVelocity = recentMovement?._sum.quantity ?? 0

      return {
        id: product.id,
        name: product.name,
        category: (product as any).category?.name,
        inventory: totalInventory,
        price: Number(product.price),
        stockStatus,
        salesVelocity,
        totalSold: (product as any)._count?.orderItems ?? 0,
        variants: (product as any).variants ?? [],
        stockValue: totalInventory * Number(product.price),
        restockSuggestion: salesVelocity > 0 ? Math.ceil(salesVelocity / 30 * 45) : null, // 45 days of stock
      }
    })

    return NextResponse.json({
      products: enrichedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalProducts: stockSummary._count,
        totalStockValue: enrichedProducts.reduce((sum, p) => sum + p.stockValue, 0),
        totalUnits: Number(stockSummary._sum?.inventory) ?? 0,
        averageStock: Number(stockSummary._avg?.inventory) ?? 0,
        alerts: {
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          overstocked: overstockedCount,
        },
      },
      filters: {
        applied: filter ?? 'all',
        search: search ?? null,
      },
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 },
    )
  }
}

// Update product inventory
async function putHandler(request: NextRequest, _context: { user: any }) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 },
      )
    }

    // Get current product with variants
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true,
        variants: {
          select: {
            id: true,
            inventory: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 },
      )
    }

    // Note: Direct product inventory updates not supported anymore
    // Inventory is now managed at the variant level
    return NextResponse.json(
      { error: 'Product inventory is now managed at variant level. Use variant-specific inventory updates.' },
      { status: 400 },
    )
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 },
    )
  }
}

// Bulk inventory update
async function postHandler(request: NextRequest, context: { user: any }) {
  try {
    const { updates, reason } = await request.json()

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 },
      )
    }

    const results = []

    for (const update of updates) {
      const { productId } = update

      // Get current product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true },
      })

      if (!product) {
        results.push({
          productId,
          success: false,
          error: 'Product not found',
        })
        continue
      }

      // Note: Bulk inventory updates not supported for products anymore
      // Inventory is now managed at variant level
      results.push({
        productId,
        success: false,
        error: 'Product inventory is now managed at variant level',
      })
      continue
    }

    // Note: Inventory logs would be created here if variant updates were supported

    // Log admin activity
    const successCount = results.filter(r => r.success).length
    await logAdminActivity(
      context.user.id,
      'BULK_UPDATE_INVENTORY',
      'Product',
      undefined,
      `Bulk updated inventory for ${successCount}/${updates.length} products`,
      undefined,
      { reason, updateCount: successCount, totalAttempted: updates.length },
    )

    return NextResponse.json({
      results,
      summary: {
        total: updates.length,
        successful: successCount,
        failed: updates.length - successCount,
      },
    })
  } catch (error) {
    console.error('Error bulk updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update inventory' },
      { status: 500 },
    )
  }
}

export const GET = withAdminAuth(getHandler)
export const PUT = withAdminAuth(putHandler)
export const POST = withAdminAuth(postHandler)