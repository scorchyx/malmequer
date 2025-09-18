import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { verifyEmailToken } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 },
      )
    }

    const result = await verifyEmailToken(token)

    if (result.success && result.email) {
      // Get user details for welcome email
      const user = await prisma.user.findUnique({
        where: { email: result.email },
      })

      if (user) {
        // Send welcome email now that email is verified
        const welcomeHtml = `
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
                <h2>Hello ${user.name ?? 'User'}!</h2>
                <p>Your email has been verified successfully! Welcome to our ecommerce platform.</p>
                <p>You can now enjoy all the features of your account, including shopping, wishlist, and order tracking.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXTAUTH_URL}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Start Shopping
                  </a>
                </div>
                <p>Thank you for joining Malmequer!</p>
              </div>
            </body>
          </html>
        `

        sendEmail({
          to: user.email,
          subject: 'Welcome to Malmequer! 🌼',
          html: welcomeHtml,
        }).catch((error: any) =>
          console.error('Failed to send welcome email:', error),
        )
      }

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
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 },
      )
    }

    const result = await verifyEmailToken(token)

    if (result.success && result.email) {
      // Get user details for welcome email
      const user = await prisma.user.findUnique({
        where: { email: result.email },
      })

      if (user) {
        // Send welcome email now that email is verified
        const welcomeHtml = `
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
                <h2>Hello ${user.name ?? 'User'}!</h2>
                <p>Your email has been verified successfully! Welcome to our ecommerce platform.</p>
                <p>You can now enjoy all the features of your account, including shopping, wishlist, and order tracking.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXTAUTH_URL}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Start Shopping
                  </a>
                </div>
                <p>Thank you for joining Malmequer!</p>
              </div>
            </body>
          </html>
        `

        sendEmail({
          to: user.email,
          subject: 'Welcome to Malmequer! 🌼',
          html: welcomeHtml,
        }).catch((error: any) =>
          console.error('Failed to send welcome email:', error),
        )
      }

      // Return a simple HTML page with success message
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Email Verified - Malmequer</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
              }
              .success {
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 10px;
              }
              .button {
                background: #4CAF50;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>✅ Email Verified Successfully!</h1>
            </div>
            <div class="content">
              <h2>Welcome to Malmequer!</h2>
              <p>Your email has been verified successfully. You can now access all features of your account.</p>
              <p>A welcome email has been sent to your inbox with more information.</p>
              <a href="${process.env.NEXTAUTH_URL}" class="button">Go to Homepage</a>
            </div>
          </body>
        </html>
      `

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    } else {
      // Return error page
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Verification Failed - Malmequer</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
              }
              .error {
                background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 10px;
              }
              .button {
                background: #2196F3;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>❌ Verification Failed</h1>
            </div>
            <div class="content">
              <h2>Email Verification Error</h2>
              <p><strong>Error:</strong> ${result.message}</p>
              <p>This could happen if:</p>
              <ul style="text-align: left;">
                <li>The verification link has expired (tokens expire after 24 hours)</li>
                <li>The link has already been used</li>
                <li>The link is invalid</li>
              </ul>
              <p>If you need a new verification email, please contact support or try registering again.</p>
              <a href="${process.env.NEXTAUTH_URL}" class="button">Go to Homepage</a>
            </div>
          </body>
        </html>
      `

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      })
    }
  } catch (error) {
    console.error('Error verifying email:', error)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Error - Malmequer</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Internal Server Error</h1>
          <p>An error occurred while verifying your email. Please try again later.</p>
          <a href="${process.env.NEXTAUTH_URL}" style="background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Go to Homepage</a>
        </body>
      </html>
    `

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    })
  }
}