import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sessionUser = await getCurrentUser()

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // Get full user data from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { email: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      email: user.email,
      emailVerified: user.emailVerified,
      isVerified: !!user.emailVerified,
    })
  } catch (error) {
    console.error('Error checking verification status:', error)
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 },
    )
  }
}