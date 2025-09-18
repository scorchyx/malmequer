import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, logAdminActivity } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest, _context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where = {
      ...(isActive !== null && { isActive: isActive === 'true' }),
    }

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        include: {
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.discount.count({ where }),
    ])

    return NextResponse.json({
      discounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching discounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 },
    )
  }
}

async function postHandler(request: NextRequest, context: { user: any }) {
  try {
    const {
      code,
      type,
      value,
      minAmount,
      maxAmount,
      maxUses,
      validFrom,
      validUntil,
      isActive = true,
    } = await request.json()

    if (!code || !type || !value) {
      return NextResponse.json(
        { error: 'Code, type, and value are required' },
        { status: 400 },
      )
    }

    if (!['PERCENTAGE', 'FIXED_AMOUNT'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid discount type' },
        { status: 400 },
      )
    }

    // Check if code already exists
    const existingDiscount = await prisma.discount.findUnique({
      where: { code },
    })

    if (existingDiscount) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 },
      )
    }

    const discount = await prisma.discount.create({
      data: {
        code,
        type,
        value,
        minAmount,
        maxAmount,
        maxUses,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive,
      },
    })

    // Log admin activity
    await logAdminActivity(
      context.user.id,
      'CREATE_DISCOUNT',
      'Discount',
      discount.id,
      `Created discount code: ${code}`,
      null,
      discount,
    )

    return NextResponse.json(discount, { status: 201 })
  } catch (error) {
    console.error('Error creating discount:', error)
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 },
    )
  }
}

async function putHandler(request: NextRequest, context: { user: any }) {
  try {
    const {
      discountId,
      code,
      type,
      value,
      minAmount,
      maxAmount,
      maxUses,
      validFrom,
      validUntil,
      isActive,
    } = await request.json()

    if (!discountId) {
      return NextResponse.json(
        { error: 'Discount ID is required' },
        { status: 400 },
      )
    }

    const existingDiscount = await prisma.discount.findUnique({
      where: { id: discountId },
    })

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 },
      )
    }

    const updateData: any = {}
    if (code !== undefined) updateData.code = code
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (minAmount !== undefined) updateData.minAmount = minAmount
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount
    if (maxUses !== undefined) updateData.maxUses = maxUses
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom)
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedDiscount = await prisma.discount.update({
      where: { id: discountId },
      data: updateData,
    })

    // Log admin activity
    const changes: string[] = []
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== (existingDiscount as any)[key]) {
        changes.push(`${key}: ${(existingDiscount as any)[key]} → ${updateData[key]}`)
      }
    })

    if (changes.length > 0) {
      await logAdminActivity(
        context.user.id,
        'UPDATE_DISCOUNT',
        'Discount',
        discountId,
        `Updated discount ${existingDiscount.code}: ${changes.join(', ')}`,
        existingDiscount,
        updateData,
      )
    }

    return NextResponse.json(updatedDiscount)
  } catch (error) {
    console.error('Error updating discount:', error)
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 },
    )
  }
}

export const GET = withAdminAuth(getHandler)
export const POST = withAdminAuth(postHandler)
export const PUT = withAdminAuth(putHandler)