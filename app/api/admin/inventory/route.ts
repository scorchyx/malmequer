import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, logAdminActivity } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { InventoryLogType } from '@prisma/client'

// Get inventory overview and low stock alerts
async function getHandler(request: NextRequest, context: { user: any }) {
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
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Apply stock filters
    switch (filter) {
      case 'low-stock':
        where.inventory = { gt: 0, lte: 10 } // Low stock threshold
        break
      case 'out-of-stock':
        where.inventory = { lte: 0 }
        break
      case 'overstocked':
        where.inventory = { gte: 100 } // Overstocked threshold
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
          { inventory: 'asc' }, // Show lowest stock first
          { name: 'asc' },
        ],
      }),

      // Total count for pagination
      prisma.product.count({ where }),

      // Stock summary statistics
      prisma.product.aggregate({
        _count: true,
        _sum: {
          inventory: true,
        },
        _avg: {
          inventory: true,
        },
      }),
    ])

    // Get stock alerts counts
    const [lowStockCount, outOfStockCount, overstockedCount] = await Promise.all([
      prisma.product.count({
        where: { inventory: { gt: 0, lte: 10 } },
      }),
      prisma.product.count({
        where: { inventory: { lte: 0 } },
      }),
      prisma.product.count({
        where: { inventory: { gte: 100 } },
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
      const stockStatus =
        product.inventory <= 0 ? 'out-of-stock' :
          product.inventory <= 10 ? 'low-stock' :
            product.inventory >= 100 ? 'overstocked' : 'normal'

      const recentMovement = recentMovements.find(m => m.productId === product.id)
      const salesVelocity = recentMovement?._sum.quantity || 0

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category?.name,
        inventory: product.inventory,
        price: Number(product.price),
        stockStatus,
        salesVelocity,
        totalSold: product._count.orderItems,
        variants: product.variants,
        stockValue: product.inventory * Number(product.price),
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
        totalUnits: Number(stockSummary._sum.inventory) || 0,
        averageStock: Number(stockSummary._avg.inventory) || 0,
        alerts: {
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          overstocked: overstockedCount,
        },
      },
      filters: {
        applied: filter || 'all',
        search: search || null,
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
async function putHandler(request: NextRequest, context: { user: any }) {
  try {
    const { productId, newInventory, reason, type } = await request.json()

    if (!productId || newInventory === undefined) {
      return NextResponse.json(
        { error: 'Product ID and new inventory level are required' },
        { status: 400 },
      )
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { inventory: true, name: true, sku: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 },
      )
    }

    const currentInventory = product.inventory
    const quantityChange = newInventory - currentInventory

    // Update product inventory
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { inventory: newInventory },
    })

    // Log inventory movement
    await prisma.inventoryLog.create({
      data: {
        type: type || (quantityChange > 0 ? 'RESTOCK' : 'ADJUSTMENT'),
        quantity: Math.abs(quantityChange),
        reason: reason || `Inventory adjusted from ${currentInventory} to ${newInventory}`,
        productId,
        userId: context.user.id,
      },
    })

    // Log admin activity
    await logAdminActivity(
      context.user.id,
      'UPDATE_INVENTORY',
      'Product',
      productId,
      `Updated inventory for ${product.name} (${product.sku}): ${currentInventory} → ${newInventory}`,
      { inventory: currentInventory },
      { inventory: newInventory, reason },
    )

    return NextResponse.json({
      productId,
      previousInventory: currentInventory,
      newInventory,
      quantityChange,
      updatedAt: updatedProduct.updatedAt,
    })
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
    const inventoryLogs = []

    for (const update of updates) {
      const { productId, newInventory, individualReason } = update

      // Get current product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { inventory: true, name: true, sku: true },
      })

      if (!product) {
        results.push({
          productId,
          success: false,
          error: 'Product not found',
        })
        continue
      }

      const currentInventory = product.inventory
      const quantityChange = newInventory - currentInventory

      try {
        // Update product inventory
        await prisma.product.update({
          where: { id: productId },
          data: { inventory: newInventory },
        })

        // Prepare inventory log
        inventoryLogs.push({
          type: InventoryLogType.ADJUSTMENT,
          quantity: Math.abs(quantityChange),
          reason: individualReason || reason || `Bulk update: ${currentInventory} → ${newInventory}`,
          productId,
          userId: context.user.id,
        })

        results.push({
          productId,
          success: true,
          previousInventory: currentInventory,
          newInventory,
          quantityChange,
        })
      } catch (updateError) {
        results.push({
          productId,
          success: false,
          error: 'Failed to update inventory',
        })
      }
    }

    // Bulk create inventory logs
    if (inventoryLogs.length > 0) {
      await prisma.inventoryLog.createMany({
        data: inventoryLogs,
      })
    }

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