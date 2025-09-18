import { NextResponse } from 'next/server'
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

    const defaultAddresses = await prisma.address.findMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      orderBy: {
        type: 'asc', // BILLING comes before SHIPPING alphabetically
      },
    })

    // Organize by type for easier access
    const result = {
      shipping: defaultAddresses.find(addr => addr.type === 'SHIPPING') ?? null,
      billing: defaultAddresses.find(addr => addr.type === 'BILLING') ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching default addresses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch default addresses' },
      { status: 500 },
    )
  }
}