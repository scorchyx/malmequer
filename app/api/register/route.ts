import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { validateRequestBody, registerSchema } from '@/lib/validation'
import { sendVerificationEmail } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(registerSchema)(request)
    if (!validation.success) {
      return validation.response
    }

    const { name, email, password } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      log.securityEvent('Registration attempt with existing email', {
        event: 'registration_duplicate_email',
        severity: 'low',
        ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
        userAgent: request.headers.get('user-agent') ?? 'unknown',
      })
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Log successful registration
    log.businessEvent('User registered successfully', {
      event: 'user_registration',
      userId: user.id,
      entityType: 'user',
      entityId: user.id,
    })

    // Send email verification (don't wait for it to complete)
    sendVerificationEmail(user.email, user.name ?? '').catch(error =>
      log.error('Failed to send verification email', {
        error,
        userId: user.id,
        email: user.email,
      }),
    )

    // Remove password from response
     
    const { password: _password, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email to verify your account.',
        user: userWithoutPassword,
        emailVerificationSent: true,
      },
      { status: 201 },
    )
  } catch (error) {
    log.error('User registration failed', {
      error: error instanceof Error ? error.message : String(error),
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
    })
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    )
  }
}