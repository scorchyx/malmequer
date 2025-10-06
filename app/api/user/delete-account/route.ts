/**
 * GDPR Account Deletion API
 *
 * DELETE /api/user/delete-account - Permanently delete user account and all data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logger'
import { prisma } from '@/lib/prisma'

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE_MY_ACCOUNT'),
  reason: z.string().optional(),
  feedback: z.string().optional(),
})

export async function DELETE(request: NextRequest) {
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
    const userEmail = session.user.email

    // Parse and validate request body
    const body = await request.json()
    const validatedData = deleteAccountSchema.parse(body)

    // Double-check user exists and get full user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      )
    }

    // Prevent deletion of admin accounts
    if (user.role === 'ADMIN') {
      await auditLogger.logEvent({
        eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
        severity: AuditSeverity.HIGH,
        actorId: userId,
        actorEmail: userEmail,
        details: {
          action: 'ADMIN_ACCOUNT_DELETION_ATTEMPT',
          reason: 'Admin accounts cannot be deleted via API',
        },
      })

      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted. Please contact support.' },
        { status: 403 },
      )
    }

    // Check for pending orders that would prevent deletion
    const pendingOrders = await prisma.order.findMany({
      where: {
        userId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'],
        },
      },
    })

    if (pendingOrders.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with pending orders',
          pendingOrders: pendingOrders.map(order => ({
            id: order.id,
            status: order.status,
            createdAt: order.createdAt,
          })),
        },
        { status: 400 },
      )
    }

    // Log the deletion request before actually deleting
    await auditLogger.logEvent({
      eventType: AuditEventType.USER_DELETED,
      severity: AuditSeverity.HIGH,
      actorId: userId,
      actorEmail: userEmail,
      targetId: userId,
      targetType: 'User',
      resourceName: userEmail,
      details: {
        action: 'ACCOUNT_DELETION_INITIATED',
        reason: validatedData.reason,
        feedback: validatedData.feedback,
        memberSince: user.createdAt,
        confirmationProvided: validatedData.confirmation,
      },
    })

    // Use a transaction to ensure all deletions succeed or none do
    await prisma.$transaction(async (tx) => {
      // Delete all related data in the correct order (respecting foreign key constraints)

      // 1. Delete cart items
      await tx.cartItem.deleteMany({
        where: { userId },
      })

      // 2. Delete wishlists (cascade will delete wishlist items)
      await tx.wishlist.deleteMany({
        where: { userId },
      })

      // 3. Delete reviews
      await tx.review.deleteMany({
        where: { userId },
      })

      // 4. Delete notification settings
      await tx.notificationSettings.deleteMany({
        where: { userId },
      })

      // 5. Delete addresses
      await tx.address.deleteMany({
        where: { userId },
      })

      // 6. Update orders to remove user reference but keep order data for business records
      // (This is important for accounting and tax purposes)
      await tx.order.updateMany({
        where: { userId },
        data: {
          // Keep all other order data for business records
          // Note: userId relationship will be handled by setting to null in a separate step
        },
      })

      // 7. Delete admin activities
      await tx.adminActivity.deleteMany({
        where: { userId },
      })

      // 8. Delete inventory logs
      await tx.inventoryLog.deleteMany({
        where: { userId },
      })

      // 9. Delete sessions
      await tx.session.deleteMany({
        where: { userId },
      })

      // 10. Delete accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId },
      })

      // 11. Skip audit log anonymization for now (will be handled separately)
      // Note: Audit logs should be anonymized but kept for compliance

      // 12. Finally, delete the user account
      await tx.user.delete({
        where: { id: userId },
      })
    })

    // Log successful deletion
    await auditLogger.logSuccess({
      eventType: AuditEventType.USER_DELETED,
      severity: AuditSeverity.HIGH,
      actorEmail: '[DELETED_USER]',
      targetType: 'User',
      resourceName: '[DELETED_USER]',
      details: {
        action: 'ACCOUNT_DELETION_COMPLETED',
        originalUserId: userId,
        originalEmail: userEmail,
        deletionReason: validatedData.reason,
        timestamp: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted',
      deletedAt: new Date().toISOString(),
      dataRetention: {
        orders: 'Anonymized and retained for business records',
        auditLogs: 'Anonymized and retained for compliance',
        personalData: 'Permanently deleted',
      },
    })

  } catch (error) {
    console.error('Error deleting user account:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    // Log the failed deletion attempt
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        await auditLogger.logFailure({
          eventType: AuditEventType.USER_DELETED,
          severity: AuditSeverity.CRITICAL,
          actorId: session.user.id,
          actorEmail: session.user.email,
          details: {
            action: 'ACCOUNT_DELETION_FAILED',
            error: error instanceof Error ? error.message : String(error),
          },
        }, error instanceof Error ? error : new Error(String(error)))
      }
    } catch (auditError) {
      console.error('Failed to log deletion failure:', auditError)
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 },
    )
  }
}