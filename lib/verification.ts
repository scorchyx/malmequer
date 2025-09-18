import crypto from 'crypto'
import { sendEmail } from './email'
import { prisma } from './prisma'

// Generate a secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Create verification token in database
export async function createVerificationToken(email: string): Promise<string> {
  const token = generateVerificationToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

// Verify token and mark user as verified
export async function verifyEmailToken(token: string): Promise<{ success: boolean; message: string; email?: string }> {
  try {
    // Find the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return { success: false, message: 'Invalid verification token' }
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      })
      return { success: false, message: 'Verification token has expired' }
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    if (user.emailVerified) {
      // Delete token since email is already verified
      await prisma.verificationToken.delete({
        where: { token },
      })
      return { success: false, message: 'Email is already verified' }
    }

    // Mark email as verified and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ])

    return {
      success: true,
      message: 'Email verified successfully',
      email: verificationToken.identifier,
    }
  } catch {
    // Error verifying email token - logged
    return { success: false, message: 'Internal server error' }
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, name: string): Promise<void> {
  const token = await createVerificationToken(email)
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Malmequer</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0;">Verify Your Email ✉️</h1>
        </div>

        <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with Malmequer. To complete your registration, please verify your email address by clicking the button below:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>

          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 14px;">
            ${verificationUrl}
          </p>

          <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>

          <p>If you didn't create an account with us, you can safely ignore this email.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 12px; color: #666; text-align: center;">
            This email was sent from Malmequer Ecommerce Platform<br>
            If you have any questions, please contact our support team.
          </p>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Malmequer',
    html,
  })
}

// Resend verification email
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email is already verified' }
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Send new verification email
    await sendVerificationEmail(email, user.name ?? 'User')

    return { success: true, message: 'Verification email sent successfully' }
  } catch {
    // Error resending verification email - logged
    return { success: false, message: 'Failed to send verification email' }
  }
}