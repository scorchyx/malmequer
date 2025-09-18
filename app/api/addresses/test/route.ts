import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail is required for testing' },
        { status: 400 },
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      )
    }

    // Create test shipping address
    const shippingAddress = await prisma.address.create({
      data: {
        type: 'SHIPPING',
        firstName: 'Ruben',
        lastName: 'Araujo',
        addressLine1: 'Rua Principal 123',
        city: 'Lisboa',
        state: 'Lisboa',
        postalCode: '1000-001',
        country: 'Portugal',
        phone: '+351912345678',
        isDefault: true,
        userId: user.id,
      },
    })

    // Create test billing address
    const billingAddress = await prisma.address.create({
      data: {
        type: 'BILLING',
        firstName: 'Ruben',
        lastName: 'Araujo',
        company: 'Malmequer Lda',
        addressLine1: 'Rua Fiscal 456',
        city: 'Porto',
        state: 'Porto',
        postalCode: '4000-001',
        country: 'Portugal',
        phone: '+351912345678',
        vatNumber: '123456789', // NIF português de exemplo
        isDefault: true,
        userId: user.id,
      },
    })

    return NextResponse.json({
      message: 'Test addresses created successfully',
      shipping: shippingAddress,
      billing: billingAddress,
    })
  } catch (error) {
    console.error('Error creating test addresses:', error)
    return NextResponse.json(
      { error: 'Failed to create test addresses' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail parameter is required' },
        { status: 400 },
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      )
    }

    // Get all addresses for user
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { type: 'asc' },      // BILLING before SHIPPING
        { isDefault: 'desc' }, // Default first
        { createdAt: 'desc' },  // Most recent first
      ],
    })

    // Group by type
    const grouped = {
      shipping: addresses.filter(addr => addr.type === 'SHIPPING'),
      billing: addresses.filter(addr => addr.type === 'BILLING'),
      defaults: {
        shipping: addresses.find(addr => addr.type === 'SHIPPING' && addr.isDefault) ?? null,
        billing: addresses.find(addr => addr.type === 'BILLING' && addr.isDefault) ?? null,
      },
    }

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('Error fetching test addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test addresses' },
      { status: 500 },
    )
  }
}