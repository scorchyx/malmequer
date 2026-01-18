import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification-service'
import { log } from '@/lib/logger'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      log.securityEvent('Password reset requested for non-existent email', {
        event: 'password_reset_attempt',
        severity: 'low',
        details: { email, success: false },
      })

      // Still return success to prevent email enumeration
      return NextResponse.json({
        message: 'If that email exists, we sent a password reset link',
      })
    }

    // Don't allow password reset for OAuth users without password
    if (!user.password) {
      log.securityEvent('Password reset requested for OAuth user', {
        event: 'password_reset_attempt',
        severity: 'low',
        userId: user.id,
        details: { email, success: false },
      })

      // Return generic message to prevent revealing OAuth users
      return NextResponse.json({
        message: 'If that email exists, we sent a password reset link',
      })
    }

    // Generate reset token (cryptographically secure)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${user.email}` },
    })

    // Create new reset token
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${user.email}`,
        token: hashedToken,
        expires,
      },
    })

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/redefinir-password?token=${resetToken}`

    try {
      await NotificationService.sendPasswordReset(
        user.email,
        user.name || 'User',
        resetUrl,
        user.id,
      )

      log.securityEvent('Password reset email sent', {
        event: 'password_reset_sent',
        severity: 'medium',
        userId: user.id,
        details: { email: user.email, success: true },
      })
    } catch (emailError) {
      log.error('Failed to send password reset email', {
        error: emailError instanceof Error ? emailError.message : String(emailError),
        userId: user.id,
        email: user.email,
      })

      // Still return success to user (don't reveal email sending failures)
    }

    return NextResponse.json({
      message: 'If that email exists, we sent a password reset link',
    })
  } catch (error) {
    log.error('Password reset request failed', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 },
    )
  }
}
