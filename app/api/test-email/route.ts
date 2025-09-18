import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, name, type = 'WELCOME' } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 },
      )
    }

    // Send test email with simple HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Malmequer</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0;">Welcome to Malmequer! 🌼</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2>Hello ${name}!</h2>
            <p>Thank you for joining our ecommerce platform. We're excited to have you with us!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Explore Our Store
              </a>
            </div>

            <p>If you have any questions, feel free to contact our support team.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

            <p style="font-size: 12px; color: #666; text-align: center;">
              This email was sent from Malmequer Ecommerce Platform<br>
              You received this because you created an account with us.
            </p>
          </div>
        </body>
      </html>
    `

    await sendEmail({
      to: email,
      subject: 'Welcome to Malmequer! 🌼',
      html,
    })

    return NextResponse.json({
      message: 'Test email sent successfully!',
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