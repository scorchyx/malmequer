/**
 * GDPR Data Export API
 *
 * GET /api/user/data-export - Export all user data (GDPR compliance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logger'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const userId = session.user.id

    // Fetch all user data from all related tables
    const [
      user,
      orders,
      cartItems,
      reviews,
      addresses,
      wishlistItems,
      notificationSettings,
      auditLogs,
    ] = await Promise.all([
      // Basic user data
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      // Order history
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, price: true },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
      }),

      // Shopping cart
      prisma.cartItem.findMany({
        where: { userId },
        include: {
          product: {
            select: { name: true, price: true },
          },
        },
      }),

      // Product reviews
      prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: { name: true },
          },
        },
      }),

      // Addresses
      prisma.address.findMany({
        where: { userId },
      }),

      // Wishlists
      prisma.wishlist.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, price: true },
              },
            },
          },
        },
      }),

      // Notification preferences
      prisma.notificationSettings.findUnique({
        where: { userId },
      }),

      // Audit logs (user-related actions)
      prisma.auditLog.findMany({
        where: {
          OR: [
            { actorId: userId },
            { targetId: userId },
          ],
        },
        orderBy: { timestamp: 'desc' },
        take: 1000, // Limit to last 1000 audit events
      }),
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      )
    }

    // Compile complete user data export
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        userId: userId,
        requestedBy: user.email,
        dataTypes: [
          'profile',
          'orders',
          'cart',
          'reviews',
          'addresses',
          'wishlist',
          'notifications',
          'auditTrail',
        ],
      },
      profile: user,
      orders: orders.map(order => ({
        ...order,
        // Remove sensitive payment data
        paymentIntentId: '[REDACTED]',
        clientSecret: '[REDACTED]',
      })),
      shoppingCart: cartItems,
      reviews: reviews,
      addresses: addresses,
      wishlist: wishlistItems,
      notificationSettings: notificationSettings,
      auditTrail: auditLogs.map(log => ({
        ...log,
        // Remove sensitive IP and browser data
        ipAddress: log.ipAddress ? '[REDACTED]' : null,
        userAgent: log.userAgent ? '[REDACTED]' : null,
      })),
      metadata: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
        memberSince: user.createdAt,
        lastActivity: user.updatedAt,
        accountStatus: 'ACTIVE',
      },
    }

    // Log the data export for audit purposes
    await auditLogger.logSuccess({
      eventType: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.MEDIUM,
      actorId: userId,
      actorEmail: user.email,
      targetId: userId,
      targetType: 'User',
      resourceName: user.email,
      details: {
        action: 'DATA_EXPORT_REQUESTED',
        dataTypes: exportData.exportInfo.dataTypes,
        recordCounts: {
          orders: orders.length,
          cartItems: cartItems.length,
          reviews: reviews.length,
          addresses: addresses.length,
          wishlistItems: wishlistItems.length,
          auditLogs: auditLogs.length,
        },
      },
    })

    // Return data as JSON with appropriate headers for download
    return new NextResponse(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      },
    )

  } catch (error) {
    console.error('Error exporting user data:', error)

    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 },
    )
  }
}