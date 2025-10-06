import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { userId: user.id },
    })

    if (!loyaltyPoints) {
      // Create loyalty points record if it doesn't exist
      const newLoyaltyPoints = await prisma.loyaltyPoints.create({
        data: {
          userId: user.id,
          availablePoints: 0,
          lifetimePoints: 0,
          tier: 'BRONZE',
        },
      })
      return NextResponse.json(newLoyaltyPoints)
    }

    return NextResponse.json(loyaltyPoints)
  } catch (error) {
    console.error('Error fetching loyalty points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { points, description, type = 'EARNED' } = await request.json()

    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Valid points amount is required' },
        { status: 400 },
      )
    }

    // Create loyalty transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        userId: user.id,
        type,
        points,
        description,
        expiresAt: type === 'EARNED' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year expiry for earned points
      },
    })

    // Update loyalty points
    const loyaltyPoints = await prisma.loyaltyPoints.upsert({
      where: { userId: user.id },
      update: {
        availablePoints: {
          increment: type === 'EARNED' ? points : -points,
        },
        lifetimePoints: {
          increment: type === 'EARNED' ? points : 0,
        },
      },
      create: {
        userId: user.id,
        availablePoints: type === 'EARNED' ? points : 0,
        lifetimePoints: type === 'EARNED' ? points : 0,
        tier: 'BRONZE',
      },
    })

    // Update tier based on lifetime points
    let newTier = 'BRONZE'
    if (loyaltyPoints.lifetimePoints >= 10000) {
      newTier = 'PLATINUM'
    } else if (loyaltyPoints.lifetimePoints >= 5000) {
      newTier = 'GOLD'
    } else if (loyaltyPoints.lifetimePoints >= 1000) {
      newTier = 'SILVER'
    }

    if (newTier !== loyaltyPoints.tier) {
      await prisma.loyaltyPoints.update({
        where: { userId: user.id },
        data: { tier: newTier as any },
      })
    }

    return NextResponse.json({
      transaction,
      loyaltyPoints: {
        ...loyaltyPoints,
        tier: newTier,
      },
    })
  } catch (error) {
    console.error('Error processing loyalty transaction:', error)
    return NextResponse.json(
      { error: 'Failed to process loyalty transaction' },
      { status: 500 },
    )
  }
}