// Simple email templates using template strings (no JSX issues)

interface WelcomeEmailProps {
  userName: string
  verificationUrl?: string
}

interface PasswordResetEmailProps {
  userName: string
  resetUrl: string
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

export function renderPasswordResetEmail({ userName, resetUrl }: PasswordResetEmailProps): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperar Password - Malmequer</title>
      </head>
      <body style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif; margin: 0; padding: 0;">
        <div style="background-color: #ffffff; margin: 0 auto; padding: 20px 0 48px; margin-bottom: 64px; max-width: 600px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #D4A853; font-size: 28px; font-weight: bold; margin: 0;">
              🌼 Malmequer
            </h1>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 0;">
          <h2 style="color: #333; font-size: 22px; font-weight: bold; margin: 40px 40px 20px; padding: 0;">
            Recuperar Password
          </h2>
          <p style="color: #333; font-size: 16px; margin: 24px 40px; line-height: 1.5;">
            Olá ${userName},
          </p>
          <p style="color: #333; font-size: 16px; margin: 24px 40px; line-height: 1.5;">
            Recebemos um pedido para redefinir a password da sua conta Malmequer. Clique no botão abaixo para criar uma nova password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #D4A853; border-radius: 4px; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block; padding: 14px 32px;">
              Redefinir Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin: 24px 40px; line-height: 1.5;">
            Este link expira em <strong>1 hora</strong>. Se não solicitou esta alteração, pode ignorar este email com segurança.
          </p>
          <p style="color: #666; font-size: 14px; margin: 24px 40px; line-height: 1.5;">
            Se o botão não funcionar, copie e cole o seguinte link no seu navegador:
          </p>
          <p style="color: #5469d4; font-size: 12px; margin: 16px 40px; line-height: 1.4; word-break: break-all;">
            ${resetUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 40px 0 26px;">
          <p style="color: #8898aa; font-size: 12px; text-align: center; margin: 0 40px;">
            Malmequer - A sua loja online de confiança
          </p>
          <p style="color: #8898aa; font-size: 11px; text-align: center; margin: 8px 40px 0;">
            Se não foi você que solicitou esta alteração, por favor contacte-nos imediatamente.
          </p>
        </div>
      </body>
    </html>
  `
}