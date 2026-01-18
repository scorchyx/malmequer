import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      )
    }

    // Hash the provided token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // Find valid reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    })

    if (!resetToken) {
      log.securityEvent('Invalid password reset token used', {
        event: 'password_reset_invalid_token',
        severity: 'medium',
        details: { success: false },
      })

      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 },
      )
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      })

      log.securityEvent('Expired password reset token used', {
        event: 'password_reset_expired_token',
        severity: 'low',
        details: { success: false },
      })

      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 },
      )
    }

    // Extract email from identifier (format: "reset:email@example.com")
    const email = resetToken.identifier.replace('reset:', '')

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      log.securityEvent('Password reset for non-existent user', {
        event: 'password_reset_no_user',
        severity: 'high',
        details: { email, success: false },
      })

      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete used reset token
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    })

    // Delete all sessions to force re-login
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    log.securityEvent('Password reset successful', {
      event: 'password_reset_success',
      severity: 'medium',
      userId: user.id,
      details: { email: user.email, success: true },
    })

    return NextResponse.json({
      message: 'Password reset successful',
    })
  } catch (error) {
    log.error('Password reset failed', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    )
  }
}
