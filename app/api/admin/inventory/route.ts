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
        { stockItems: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Apply stock filters (now based on stockItems)
    switch (filter) {
      case 'low-stock':
        where.stockItems = { some: { quantity: { gt: 0, lte: 10 } } }
        break
      case 'out-of-stock':
        where.stockItems = { every: { quantity: { lte: 0 } } }
        break
      case 'overstocked':
        where.stockItems = { some: { quantity: { gte: 100 } } }
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
          stockItems: {
            include: {
              sizeVariant: true,
              colorVariant: true,
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

      // Stock summary statistics (now calculated from stockItems)
      prisma.stockItem.aggregate({
        _count: true,
        _sum: {
          quantity: true,
        },
        _avg: {
          quantity: true,
        },
      }),
    ])

    // Get stock alerts counts (now based on stockItems)
    const [lowStockCount, outOfStockCount, overstockedCount] = await Promise.all([
      prisma.product.count({
        where: {
          stockItems: {
            some: {
              quantity: { gt: 0, lte: 10 },
            },
          },
        },
      }),
      prisma.product.count({
        where: {
          stockItems: {
            every: {
              quantity: { lte: 0 },
            },
          },
        },
      }),
      prisma.product.count({
        where: {
          stockItems: {
            some: {
              quantity: { gte: 100 },
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
      const totalInventory = product.stockItems?.reduce((sum: number, si: any) => sum + si.quantity, 0) ?? 0
      const stockStatus =
        totalInventory <= 0 ? 'out-of-stock' :
          totalInventory <= 10 ? 'low-stock' :
            totalInventory >= 100 ? 'overstocked' : 'normal'

      const recentMovement = recentMovements.find(m => m.productId === product.id)
      const salesVelocity = recentMovement?._sum.quantity ?? 0

      return {
        id: product.id,
        name: product.name,
        category: product.category?.name,
        inventory: totalInventory,
        price: Number(product.price),
        stockStatus,
        salesVelocity,
        totalSold: product._count?.orderItems ?? 0,
        stockItems: product.stockItems.map(si => ({
          id: si.id,
          quantity: si.quantity,
          sku: si.sku,
          sizeLabel: si.sizeVariant?.label,
          colorLabel: si.colorVariant?.label,
        })),
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
        totalUnits: Number(stockSummary._sum?.quantity) ?? 0,
        averageStock: Number(stockSummary._avg?.quantity) ?? 0,
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

// Update stock item quantity
async function putHandler(request: NextRequest, context: { user: any }) {
  try {
    const { stockItemId, quantity, reason } = await request.json()

    if (!stockItemId) {
      return NextResponse.json(
        { error: 'Stock item ID is required' },
        { status: 400 },
      )
    }

    if (typeof quantity !== 'number') {
      return NextResponse.json(
        { error: 'Quantity is required' },
        { status: 400 },
      )
    }

    // Get current stock item
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
      include: {
        product: true,
        sizeVariant: true,
        colorVariant: true,
      },
    })

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Stock item not found' },
        { status: 404 },
      )
    }

    const previousQuantity = stockItem.quantity
    const quantityChange = quantity - previousQuantity

    // Update stock item
    const updated = await prisma.stockItem.update({
      where: { id: stockItemId },
      data: { quantity },
    })

    // Create inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: stockItem.productId,
        type: quantityChange > 0 ? 'PURCHASE' : 'ADJUSTMENT',
        quantity: quantityChange,
        reason: reason || `Manual adjustment: ${previousQuantity} -> ${quantity}`,
        userId: context.user.id,
      },
    })

    // Log admin activity
    await logAdminActivity(
      context.user.id,
      'UPDATE_INVENTORY',
      'StockItem',
      stockItemId,
      `Updated stock for ${stockItem.product.name} (${stockItem.sizeVariant?.label}, ${stockItem.colorVariant?.label}): ${previousQuantity} -> ${quantity}`,
      undefined,
      { previousQuantity, newQuantity: quantity, reason },
    )

    return NextResponse.json({
      success: true,
      stockItem: updated,
      previousQuantity,
      newQuantity: quantity,
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 },
    )
  }
}

// Bulk stock update
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
      const { stockItemId, quantity } = update

      // Get current stock item
      const stockItem = await prisma.stockItem.findUnique({
        where: { id: stockItemId },
        include: {
          product: true,
          sizeVariant: true,
          colorVariant: true,
        },
      })

      if (!stockItem) {
        results.push({
          stockItemId,
          success: false,
          error: 'Stock item not found',
        })
        continue
      }

      const previousQuantity = stockItem.quantity
      const quantityChange = quantity - previousQuantity

      // Update stock item
      await prisma.stockItem.update({
        where: { id: stockItemId },
        data: { quantity },
      })

      // Create inventory log
      await prisma.inventoryLog.create({
        data: {
          productId: stockItem.productId,
          type: quantityChange > 0 ? 'PURCHASE' : 'ADJUSTMENT',
          quantity: quantityChange,
          reason: reason || `Bulk adjustment: ${previousQuantity} -> ${quantity}`,
          userId: context.user.id,
        },
      })

      results.push({
        stockItemId,
        success: true,
        previousQuantity,
        newQuantity: quantity,
      })
    }

    // Log admin activity
    const successCount = results.filter(r => r.success).length
    await logAdminActivity(
      context.user.id,
      'BULK_UPDATE_INVENTORY',
      'StockItem',
      undefined,
      `Bulk updated inventory for ${successCount}/${updates.length} stock items`,
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
