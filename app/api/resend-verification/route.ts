import { NextRequest, NextResponse } from 'next/server'
import { resendVerificationEmail } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    const result = await resendVerificationEmail(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error('Error resending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 },
    )
  }
}