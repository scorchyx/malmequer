import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { couponCode } = await request.json()

    if (!couponCode) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 },
      )
    }

    // Find the discount by code
    const discount = await prisma.discount.findUnique({
      where: { code: couponCode },
    })

    if (!discount) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 },
      )
    }

    // Check if discount is active
    if (!discount.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer active' },
        { status: 400 },
      )
    }

    // Check if discount is expired
    const now = new Date()
    if (discount.validUntil && discount.validUntil < now) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 },
      )
    }

    // Check if discount hasn't started yet
    if (discount.validFrom && discount.validFrom > now) {
      return NextResponse.json(
        { error: 'This coupon is not yet available' },
        { status: 400 },
      )
    }

    // Check usage limits
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 },
      )
    }

    // Note: Per-user usage limit not implemented in current model
    // Could be added as a separate feature if needed

    // Get user's cart to calculate discount
    const cartItems = user
      ? await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      })
      : []

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty' },
        { status: 400 },
      )
    }

    // Calculate cart total
    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    )

    // Check minimum amount requirement
    if (discount.minAmount && cartSubtotal < Number(discount.minAmount)) {
      return NextResponse.json(
        {
          error: `Minimum order amount of €${discount.minAmount} required for this coupon`,
          minAmount: Number(discount.minAmount),
          currentAmount: cartSubtotal,
        },
        { status: 400 },
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (cartSubtotal * Number(discount.value)) / 100
      // Apply max amount limit if set
      if (discount.maxAmount && discountAmount > Number(discount.maxAmount)) {
        discountAmount = Number(discount.maxAmount)
      }
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = Number(discount.value)
      // Discount cannot exceed cart total
      if (discountAmount > cartSubtotal) {
        discountAmount = cartSubtotal
      }
    }

    const finalTotal = Math.max(0, cartSubtotal - discountAmount)

    log.info('Coupon applied successfully', {
      userId: user?.id,
      couponCode,
      discountId: discount.id,
      cartSubtotal,
      discountAmount,
      finalTotal,
    })

    return NextResponse.json({
      success: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: Number(discount.value),
        discountAmount,
      },
      cart: {
        subtotal: cartSubtotal,
        discountAmount,
        total: finalTotal,
      },
    })
  } catch (error) {
    log.error('Error applying coupon', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 },
    )
  }
}

// Remove coupon from cart
export async function DELETE(_request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    // Get user's cart to recalculate without discount
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    })

    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    )

    log.info('Coupon removed successfully', {
      userId: user.id,
      cartSubtotal,
    })

    return NextResponse.json({
      success: true,
      cart: {
        subtotal: cartSubtotal,
        discountAmount: 0,
        total: cartSubtotal,
      },
    })
  } catch (error) {
    log.error('Error removing coupon', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to remove coupon' },
      { status: 500 },
    )
  }
}