import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, logAdminActivity } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

async function getHandler(_request: NextRequest, _context: { user: any }) {
  try {
    const paymentMethods = await prisma.paymentMethodConfig.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      paymentMethods,
      summary: {
        total: paymentMethods.length,
        enabled: paymentMethods.filter(pm => pm.enabled).length,
        manual: paymentMethods.filter(pm => pm.processingMode === 'MANUAL').length,
        auto: paymentMethods.filter(pm => pm.processingMode === 'AUTO').length,
      },
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 },
    )
  }
}

async function postHandler(request: NextRequest, context: { user: any }) {
  try {
    const {
      method,
      name,
      icon,
      enabled = true,
      processingMode = 'AUTO',
      description,
      displayOrder = 0,
    } = await request.json()

    if (!method || !name || !icon) {
      return NextResponse.json(
        { error: 'Method, name, and icon are required' },
        { status: 400 },
      )
    }

    // Check if method already exists
    const existingMethod = await prisma.paymentMethodConfig.findUnique({
      where: { method },
    })

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Payment method already exists' },
        { status: 409 },
      )
    }

    const paymentMethod = await prisma.paymentMethodConfig.create({
      data: {
        method,
        name,
        icon,
        enabled,
        processingMode,
        description,
        displayOrder,
      },
    })

    // Log admin activity
    await logAdminActivity(
      context.user.id,
      'CREATE_PAYMENT_METHOD',
      'PaymentMethodConfig',
      paymentMethod.id,
      `Created payment method: ${name} (${method})`,
      null,
      {
        method,
        name,
        processingMode,
        enabled,
      },
    )

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 },
    )
  }
}

async function putHandler(request: NextRequest, context: { user: any }) {
  try {
    const {
      id,
      enabled,
      processingMode,
      description,
      displayOrder,
    } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 },
      )
    }

    const existingMethod = await prisma.paymentMethodConfig.findUnique({
      where: { id },
    })

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 },
      )
    }

    const updateData: any = {}
    if (enabled !== undefined) updateData.enabled = enabled
    if (processingMode !== undefined) updateData.processingMode = processingMode
    if (description !== undefined) updateData.description = description
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder

    const updatedMethod = await prisma.paymentMethodConfig.update({
      where: { id },
      data: updateData,
    })

    // Log admin activity
    const changes = []
    if (enabled !== undefined && enabled !== existingMethod.enabled) {
      changes.push(`enabled: ${existingMethod.enabled} → ${enabled}`)
    }
    if (processingMode !== undefined && processingMode !== existingMethod.processingMode) {
      changes.push(`processingMode: ${existingMethod.processingMode} → ${processingMode}`)
    }
    if (description !== undefined && description !== existingMethod.description) {
      changes.push('description updated')
    }
    if (displayOrder !== undefined && displayOrder !== existingMethod.displayOrder) {
      changes.push(`displayOrder: ${existingMethod.displayOrder} → ${displayOrder}`)
    }

    if (changes.length > 0) {
      await logAdminActivity(
        context.user.id,
        'UPDATE_PAYMENT_METHOD',
        'PaymentMethodConfig',
        id,
        `Updated payment method ${existingMethod.name}: ${changes.join(', ')}`,
        {
          enabled: existingMethod.enabled,
          processingMode: existingMethod.processingMode,
          description: existingMethod.description,
          displayOrder: existingMethod.displayOrder,
        },
        updateData,
      )
    }

    return NextResponse.json(updatedMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 },
    )
  }
}

export const GET = withAdminAuth(getHandler)
export const POST = withAdminAuth(postHandler)
export const PUT = withAdminAuth(putHandler)