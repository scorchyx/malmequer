import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const { email, name, type = 'WELCOME' } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 },
      )
    }

    // Send test email based on type
    switch (type) {
      case 'WELCOME':
        await NotificationService.sendWelcomeEmail(
          email,
          name,
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=test`,
        )
        break

      case 'PASSWORD_RESET':
        await NotificationService.sendPasswordReset(
          email,
          name,
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/redefinir-password?token=test123`,
        )
        break

      case 'ORDER_CONFIRMATION':
        await NotificationService.sendOrderConfirmation(
          email,
          name,
          'ORD-TEST-12345',
          '€99.99',
          [
            { name: 'Product 1', quantity: 2, price: '€29.99' },
            { name: 'Product 2', quantity: 1, price: '€39.99' },
          ],
        )
        break

      case 'ORDER_SHIPPED':
        await NotificationService.sendOrderShipped(
          email,
          name,
          'ORD-TEST-12345',
          '€99.99',
          [
            { name: 'Product 1', quantity: 2, price: '€29.99' },
            { name: 'Product 2', quantity: 1, price: '€39.99' },
          ],
          undefined,
          'https://tracking.example.com/12345',
        )
        break

      case 'STOCK_ALERT':
        await NotificationService.sendStockAlert(
          email,
          name,
          'Amazing Product',
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/produto/amazing-product`,
        )
        break

      case 'REFUND':
        await NotificationService.sendRefundNotification(
          email,
          name,
          'ORD-TEST-12345',
          '€99.99',
          'Customer requested refund',
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 },
        )
    }

    return NextResponse.json({
      message: `Test ${type} email sent successfully!`,
      email,
      name,
      type,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

// GET endpoint to show available email types
export async function GET() {
  return NextResponse.json({
    message: 'Email Test Endpoint',
    usage: 'POST with { email, name, type }',
    availableTypes: [
      'WELCOME',
      'PASSWORD_RESET',
      'ORDER_CONFIRMATION',
      'ORDER_SHIPPED',
      'STOCK_ALERT',
      'REFUND',
    ],
    example: {
      email: 'test@example.com',
      name: 'John Doe',
      type: 'WELCOME',
    },
  })
}