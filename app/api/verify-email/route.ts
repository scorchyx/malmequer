import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { verifyEmailToken } from '@/lib/verification'
import { renderSimpleWelcomeEmail } from '@/lib/email-templates-new'

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
        const welcomeHtml = renderSimpleWelcomeEmail({
          userName: user.name ?? 'Cliente',
        })

        sendEmail({
          to: user.email,
          subject: 'Bem-vinda à Malmequer!',
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
        const welcomeHtml = renderSimpleWelcomeEmail({
          userName: user.name ?? 'Cliente',
        })

        sendEmail({
          to: user.email,
          subject: 'Bem-vinda à Malmequer!',
          html: welcomeHtml,
        }).catch((error: any) =>
          console.error('Failed to send welcome email:', error),
        )
      }

      // Return a simple HTML page with success message - following Malmequer design system
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Email Verificado - Malmequer</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
              :root {
                --malmequer-gold: #E8A83E;
                --malmequer-amber: #D4882A;
                --ink: #1A1A1A;
                --stone: #4A4A4A;
                --mist: #8A8A8A;
                --cloud: #F5F5F3;
                --snow: #FAFAF9;
                --white: #FFFFFF;
                --success: #2D854C;
                --error: #B83232;
                --font-display: 'Cormorant Garamond', Georgia, serif;
                --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: var(--font-body);
                line-height: 1.6;
                color: var(--ink);
                background-color: var(--snow);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
              }
              .container {
                max-width: 480px;
                width: 100%;
                text-align: center;
              }
              .logo {
                font-family: var(--font-display);
                font-size: 2rem;
                font-weight: 500;
                color: var(--malmequer-gold);
                margin-bottom: 2rem;
              }
              .card {
                background: var(--white);
                padding: 3rem 2rem;
                border: 1px solid var(--cloud);
              }
              .icon {
                width: 64px;
                height: 64px;
                background-color: rgba(45, 133, 76, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
              }
              .icon svg {
                width: 32px;
                height: 32px;
                color: var(--success);
              }
              h1 {
                font-family: var(--font-display);
                font-size: 1.75rem;
                font-weight: 500;
                color: var(--ink);
                margin-bottom: 1rem;
              }
              p {
                color: var(--stone);
                font-size: 0.9375rem;
                margin-bottom: 1rem;
              }
              .button {
                display: inline-block;
                background: var(--ink);
                color: var(--white);
                padding: 0.875rem 2rem;
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 500;
                letter-spacing: 0.02em;
                text-transform: uppercase;
                margin-top: 1.5rem;
                transition: background 200ms ease;
              }
              .button:hover {
                background: var(--stone);
              }
              .footer {
                margin-top: 2rem;
                color: var(--mist);
                font-size: 0.75rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Malmequer</div>
              <div class="card">
                <div class="icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1>Email Verificado</h1>
                <p>A tua conta foi verificada com sucesso. Já podes explorar toda a nossa coleção.</p>
                <a href="${process.env.NEXTAUTH_URL}" class="button">Começar a Explorar</a>
              </div>
              <p class="footer">Malmequer - A tua loja online de confiança</p>
            </div>
          </body>
        </html>
      `

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    } else {
      // Return error page - following Malmequer design system
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Verificação Falhou - Malmequer</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
              :root {
                --malmequer-gold: #E8A83E;
                --malmequer-amber: #D4882A;
                --ink: #1A1A1A;
                --stone: #4A4A4A;
                --mist: #8A8A8A;
                --cloud: #F5F5F3;
                --snow: #FAFAF9;
                --white: #FFFFFF;
                --success: #2D854C;
                --error: #B83232;
                --font-display: 'Cormorant Garamond', Georgia, serif;
                --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              }
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: var(--font-body);
                line-height: 1.6;
                color: var(--ink);
                background-color: var(--snow);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
              }
              .container {
                max-width: 480px;
                width: 100%;
                text-align: center;
              }
              .logo {
                font-family: var(--font-display);
                font-size: 2rem;
                font-weight: 500;
                color: var(--malmequer-gold);
                margin-bottom: 2rem;
              }
              .card {
                background: var(--white);
                padding: 3rem 2rem;
                border: 1px solid var(--cloud);
              }
              .icon {
                width: 64px;
                height: 64px;
                background-color: rgba(184, 50, 50, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
              }
              .icon svg {
                width: 32px;
                height: 32px;
                color: var(--error);
              }
              h1 {
                font-family: var(--font-display);
                font-size: 1.75rem;
                font-weight: 500;
                color: var(--ink);
                margin-bottom: 1rem;
              }
              p {
                color: var(--stone);
                font-size: 0.9375rem;
                margin-bottom: 1rem;
              }
              .error-message {
                background: rgba(184, 50, 50, 0.1);
                color: var(--error);
                padding: 0.75rem 1rem;
                font-size: 0.875rem;
                margin-bottom: 1rem;
              }
              ul {
                text-align: left;
                color: var(--stone);
                font-size: 0.875rem;
                margin: 1rem 0 1rem 1.5rem;
              }
              li {
                margin-bottom: 0.5rem;
              }
              .button {
                display: inline-block;
                background: var(--ink);
                color: var(--white);
                padding: 0.875rem 2rem;
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 500;
                letter-spacing: 0.02em;
                text-transform: uppercase;
                margin-top: 1rem;
                transition: background 200ms ease;
              }
              .button:hover {
                background: var(--stone);
              }
              .footer {
                margin-top: 2rem;
                color: var(--mist);
                font-size: 0.75rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">Malmequer</div>
              <div class="card">
                <div class="icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1>Verificação Falhou</h1>
                <div class="error-message">${result.message}</div>
                <p>Isto pode acontecer se:</p>
                <ul>
                  <li>O link de verificação expirou (válido por 24 horas)</li>
                  <li>O link já foi utilizado</li>
                  <li>O link é inválido</li>
                </ul>
                <p>Se precisas de um novo email de verificação, tenta registar novamente ou contacta o suporte.</p>
                <a href="${process.env.NEXTAUTH_URL}" class="button">Ir para a Homepage</a>
              </div>
              <p class="footer">Malmequer - A tua loja online de confiança</p>
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
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Erro - Malmequer</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            :root {
              --malmequer-gold: #E8A83E;
              --ink: #1A1A1A;
              --stone: #4A4A4A;
              --mist: #8A8A8A;
              --cloud: #F5F5F3;
              --snow: #FAFAF9;
              --white: #FFFFFF;
              --error: #B83232;
              --font-display: 'Cormorant Garamond', Georgia, serif;
              --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: var(--font-body);
              line-height: 1.6;
              color: var(--ink);
              background-color: var(--snow);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
            }
            .container {
              max-width: 480px;
              width: 100%;
              text-align: center;
            }
            .logo {
              font-family: var(--font-display);
              font-size: 2rem;
              font-weight: 500;
              color: var(--malmequer-gold);
              margin-bottom: 2rem;
            }
            .card {
              background: var(--white);
              padding: 3rem 2rem;
              border: 1px solid var(--cloud);
            }
            .icon {
              width: 64px;
              height: 64px;
              background-color: rgba(184, 50, 50, 0.1);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1.5rem;
            }
            .icon svg {
              width: 32px;
              height: 32px;
              color: var(--error);
            }
            h1 {
              font-family: var(--font-display);
              font-size: 1.75rem;
              font-weight: 500;
              color: var(--ink);
              margin-bottom: 1rem;
            }
            p {
              color: var(--stone);
              font-size: 0.9375rem;
              margin-bottom: 1rem;
            }
            .button {
              display: inline-block;
              background: var(--ink);
              color: var(--white);
              padding: 0.875rem 2rem;
              text-decoration: none;
              font-size: 0.875rem;
              font-weight: 500;
              letter-spacing: 0.02em;
              text-transform: uppercase;
              margin-top: 1rem;
              transition: background 200ms ease;
            }
            .button:hover {
              background: var(--stone);
            }
            .footer {
              margin-top: 2rem;
              color: var(--mist);
              font-size: 0.75rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Malmequer</div>
            <div class="card">
              <div class="icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1>Erro Interno</h1>
              <p>Ocorreu um erro ao verificar o teu email. Por favor, tenta novamente mais tarde.</p>
              <a href="${process.env.NEXTAUTH_URL}" class="button">Ir para a Homepage</a>
            </div>
            <p class="footer">Malmequer - A tua loja online de confiança</p>
          </div>
        </body>
      </html>
    `

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    })
  }
}
