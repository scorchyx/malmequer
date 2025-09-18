import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // Get or create notification settings for user
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id },
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          orderConfirmations: true,
          orderUpdates: true,
          stockAlerts: false,
          promotionalEmails: false,
          accountUpdates: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const {
      emailNotifications,
      orderConfirmations,
      orderUpdates,
      stockAlerts,
      promotionalEmails,
      accountUpdates,
    } = body

    // Validate boolean fields
    const booleanFields = {
      emailNotifications,
      orderConfirmations,
      orderUpdates,
      stockAlerts,
      promotionalEmails,
      accountUpdates,
    }

    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json(
          { error: `${key} must be a boolean` },
          { status: 400 },
        )
      }
    }

    // Get existing settings or create default ones
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id },
    })

    if (!settings) {
      // Create new settings
      settings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
          emailNotifications: emailNotifications ?? true,
          orderConfirmations: orderConfirmations ?? true,
          orderUpdates: orderUpdates ?? true,
          stockAlerts: stockAlerts ?? false,
          promotionalEmails: promotionalEmails ?? false,
          accountUpdates: accountUpdates ?? true,
        },
      })
    } else {
      // Update existing settings (only update provided fields)
      const updateData: any = {}
      if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications
      if (orderConfirmations !== undefined) updateData.orderConfirmations = orderConfirmations
      if (orderUpdates !== undefined) updateData.orderUpdates = orderUpdates
      if (stockAlerts !== undefined) updateData.stockAlerts = stockAlerts
      if (promotionalEmails !== undefined) updateData.promotionalEmails = promotionalEmails
      if (accountUpdates !== undefined) updateData.accountUpdates = accountUpdates

      settings = await prisma.notificationSettings.update({
        where: { userId: user.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings,
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 },
    )
  }
}