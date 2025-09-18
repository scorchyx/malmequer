import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'SHIPPING' | 'BILLING' | null

    const where: any = { userId: user.id }
    if (type) {
      where.type = type
    }

    const addresses = await prisma.address.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' }, // Default addresses first
        { createdAt: 'desc' },   // Most recent first
      ],
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
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

    const {
      type = 'SHIPPING',
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      vatNumber,
      isDefault = false,
    } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Validate VAT number for billing addresses
    if (type === 'BILLING' && !vatNumber) {
      return NextResponse.json(
        { error: 'VAT number is required for billing addresses' },
        { status: 400 },
      )
    }

    // If this is set as default, unset other defaults of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: type,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Create the new address
    const address = await prisma.address.create({
      data: {
        type,
        firstName,
        lastName,
        company,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        vatNumber: type === 'BILLING' ? vatNumber : null,
        isDefault,
        userId: user.id,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 },
    )
  }
}