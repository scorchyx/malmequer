import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') ??'sales'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') ??'json' // json, csv

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 },
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    let reportData: any = {}

    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReport(start, end)
        break
      case 'inventory':
        reportData = await generateInventoryReport()
        break
      case 'customers':
        reportData = await generateCustomersReport(start, end)
        break
      case 'financial':
        reportData = await generateFinancialReport(start, end)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 },
        )
    }

    // Log report generation
    await prisma.adminActivity.create({
      data: {
        action: 'GENERATE_REPORT',
        entityType: 'Report',
        description: `Generated ${reportType} report for period ${startDate} to ${endDate}`,
        userId: user.id,
        newValues: {
          reportType,
          startDate,
          endDate,
          recordCount: Array.isArray(reportData.data) ? reportData.data.length : 0,
        },
      },
    })

    log.info('Report generated successfully', {
      adminId: user.id,
      reportType,
      startDate,
      endDate,
      format,
    })

    if (format === 'csv') {
      return generateCSVResponse(reportData, reportType)
    }

    return NextResponse.json({
      reportType,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      ...reportData,
    })
  } catch (error) {
    log.error('Error generating report', {
      error: error instanceof Error ? error : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 },
    )
  }
}

async function generateSalesReport(startDate: Date, endDate: Date) {
  const [orders, summary] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paymentStatus: 'PAID',
      },
      _sum: {
        totalAmount: true,
        subtotalAmount: true,
        taxAmount: true,
        shippingAmount: true,
      },
      _count: true,
      _avg: {
        totalAmount: true,
      },
    }),
  ])

  const salesData = orders.map(order => ({
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    customerName: order.user?.name ??'Guest',
    customerEmail: order.user?.email ??order.guestEmail,
    status: order.status,
    subtotal: Number(order.subtotalAmount),
    tax: Number(order.taxAmount),
    shipping: Number(order.shippingAmount),
    total: Number(order.totalAmount),
    paymentMethod: order.paymentMethod,
    items: order.items.map(item => ({
      productName: item.product.name,
      category: item.product.category.name,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      totalPrice: Number(item.price) * item.quantity,
    })),
  }))

  return {
    summary: {
      totalOrders: summary._count,
      totalRevenue: Number(summary._sum.totalAmount ??0),
      totalSubtotal: Number(summary._sum.subtotalAmount ??0),
      totalTax: Number(summary._sum.taxAmount ??0),
      totalShipping: Number(summary._sum.shippingAmount ??0),
      averageOrderValue: Number(summary._avg.totalAmount ??0),
    },
    data: salesData,
  }
}

async function generateInventoryReport() {
  const products = await prisma.product.findMany({
    include: {
      category: {
        select: { name: true },
      },
      variants: true,
      _count: {
        select: {
          orderItems: {
            where: {
              order: {
                paymentStatus: 'PAID',
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  const inventoryData = products.map(product => {
    const totalInventory = product.variants.reduce((sum: number, variant: any) => sum + variant.inventory, 0)
    return {
      id: product.id,
      name: product.name,
      category: product.category.name,
      status: product.status,
      currentStock: totalInventory,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      totalSold: product._count.orderItems,
      stockValue: totalInventory * Number(product.price),
      variantCount: product.variants.length,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  })

  const summary = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'ACTIVE').length,
    lowStockProducts: inventoryData.filter(p => p.currentStock < 10).length,
    outOfStockProducts: inventoryData.filter(p => p.currentStock === 0).length,
    totalStockValue: inventoryData.reduce((sum, item) => sum + item.stockValue, 0),
  }

  return {
    summary,
    data: inventoryData,
  }
}

async function generateCustomersReport(startDate: Date, endDate: Date) {
  const customers = await prisma.user.findMany({
    where: {
      role: 'USER',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      orders: {
        where: {
          paymentStatus: 'PAID',
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const customerData = customers.map(customer => {
    const totalSpent = customer.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    )
    const lastOrderDate = customer.orders.length > 0
      ? Math.max(...customer.orders.map(o => o.createdAt.getTime()))
      : null

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      registrationDate: customer.createdAt,
      emailVerified: !!customer.emailVerified,
      totalOrders: customer._count.orders,
      totalSpent,
      averageOrderValue: customer._count.orders > 0 ? totalSpent / customer._count.orders : 0,
      lastOrderDate: lastOrderDate ? new Date(lastOrderDate) : null,
    }
  })

  const summary = {
    totalCustomers: customers.length,
    verifiedCustomers: customers.filter(c => c.emailVerified).length,
    activeCustomers: customers.filter(c => c.orders.length > 0).length,
    totalRevenue: customerData.reduce((sum, c) => sum + c.totalSpent, 0),
    averageOrdersPerCustomer: customerData.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length || 0,
  }

  return {
    summary,
    data: customerData,
  }
}

async function generateFinancialReport(startDate: Date, endDate: Date) {
  const [
    revenueData,
    expenseData,
    refundData,
    taxData,
  ] = await Promise.all([
    // Revenue breakdown
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'PAID',
      },
      _sum: {
        totalAmount: true,
        subtotalAmount: true,
        shippingAmount: true,
        taxAmount: true,
      },
      _count: true,
    }),

    // Simulated expense data (you would track this separately)
    Promise.resolve({
      totalExpenses: 0, // You'd need to implement expense tracking
      categories: [] as any[],
    }),

    // Refund data
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'REFUNDED',
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    }),

    // Tax collected
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: 'PAID',
      },
      _sum: {
        taxAmount: true,
      },
    }),
  ])

  const grossRevenue = Number(revenueData._sum.totalAmount ??0)
  const refunds = Number(refundData._sum.totalAmount ??0)
  const netRevenue = grossRevenue - refunds

  return {
    summary: {
      grossRevenue,
      refunds,
      netRevenue,
      totalOrders: revenueData._count,
      refundedOrders: refundData._count,
      taxCollected: Number(taxData._sum.taxAmount ??0),
      shippingRevenue: Number(revenueData._sum.shippingAmount ??0),
    },
    data: {
      revenue: {
        gross: grossRevenue,
        net: netRevenue,
        shipping: Number(revenueData._sum.shippingAmount ??0),
        tax: Number(revenueData._sum.taxAmount ??0),
      },
      refunds: {
        total: refunds,
        count: refundData._count,
      },
      expenses: expenseData,
    },
  }
}

function generateCSVResponse(reportData: any, reportType: string) {
  let csvContent = ''
  const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`

  switch (reportType) {
    case 'sales':
      csvContent = convertSalesDataToCSV(reportData.data)
      break
    case 'inventory':
      csvContent = convertInventoryDataToCSV(reportData.data)
      break
    case 'customers':
      csvContent = convertCustomersDataToCSV(reportData.data)
      break
    default:
      csvContent = 'Report type not supported for CSV export'
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function convertSalesDataToCSV(data: any[]): string {
  if (data.length === 0) return 'No data available'

  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Customer Email',
    'Status',
    'Subtotal',
    'Tax',
    'Shipping',
    'Total',
    'Payment Method',
  ]

  const rows = data.map(order =>
    [
      order.orderNumber,
      order.orderDate,
      order.customerName,
      order.customerEmail,
      order.status,
      order.subtotal,
      order.tax,
      order.shipping,
      order.total,
      order.paymentMethod,
    ].map(field => `"${field}"`).join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

function convertInventoryDataToCSV(data: any[]): string {
  if (data.length === 0) return 'No data available'

  const headers = [
    'Product Name',
    'SKU',
    'Category',
    'Status',
    'Current Stock',
    'Price',
    'Compare Price',
    'Total Sold',
    'Stock Value',
  ]

  const rows = data.map(product =>
    [
      product.name,
      'N/A', // SKU now at variant level
      product.category,
      product.status,
      product.currentStock,
      product.price,
      product.comparePrice ??'',
      product.totalSold,
      product.stockValue,
    ].map(field => `"${field}"`).join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}

function convertCustomersDataToCSV(data: any[]): string {
  if (data.length === 0) return 'No data available'

  const headers = [
    'Name',
    'Email',
    'Registration Date',
    'Email Verified',
    'Total Orders',
    'Total Spent',
    'Average Order Value',
    'Last Order Date',
  ]

  const rows = data.map(customer =>
    [
      customer.name ??'',
      customer.email,
      customer.registrationDate,
      customer.emailVerified ? 'Yes' : 'No',
      customer.totalOrders,
      customer.totalSpent,
      customer.averageOrderValue.toFixed(2),
      customer.lastOrderDate ??'',
    ].map(field => `"${field}"`).join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}