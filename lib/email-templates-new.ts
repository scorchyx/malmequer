// Simple email templates using template strings (no JSX issues)

interface WelcomeEmailProps {
  userName: string
  verificationUrl?: string
}

export function renderSimpleWelcomeEmail({ userName, verificationUrl }: WelcomeEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Malmequer!</title>
      </head>
      <body style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
        <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 600px;">
          <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 40px 0; padding: 0; text-align: center;">
            Welcome to Malmequer! 🌼
          </h1>
          <p style="color: #333; font-size: 16px; margin: 24px 0; padding: 0 40px; line-height: 1.4;">
            Hello ${userName},
          </p>
          <p style="color: #333; font-size: 16px; margin: 24px 0; padding: 0 40px; line-height: 1.4;">
            Thank you for joining our community! We are very happy to have you here.
          </p>
          ${verificationUrl ? `
          <p style="color: #333; font-size: 16px; margin: 24px 0; padding: 0 40px; line-height: 1.4;">
            To start using your account, please verify your email:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background-color: #5469d4; border-radius: 4px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px;">
              Verify Email
            </a>
          </div>
          ` : ''}
          <p style="color: #333; font-size: 16px; margin: 24px 0; padding: 0 40px; line-height: 1.4;">
            If you need help, do not hesitate to contact us!
          </p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 26px 0; width: 100%;">
          <p style="color: #8898aa; font-size: 12px; text-align: center; margin: 0 40px;">
            Malmequer - Your trusted online store
          </p>
        </div>
      </body>
    </html>
  `
}