import { render } from '@react-email/render'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Preview
} from '@react-email/components'

interface BaseEmailProps {
  userName: string
}

interface WelcomeEmailProps extends BaseEmailProps {
  verificationUrl?: string
}

interface OrderEmailProps extends BaseEmailProps {
  orderNumber: string
  orderTotal: string
  orderItems: Array<{
    name: string
    quantity: number
    price: string
  }>
  trackingUrl?: string
}

interface PasswordResetEmailProps extends BaseEmailProps {
  resetUrl: string
}

interface StockAlertEmailProps extends BaseEmailProps {
  productName: string
  productUrl: string
}

// Welcome Email Template
function WelcomeEmail({ userName, verificationUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao Malmequer!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bem-vindo ao Malmequer! 🌼</Heading>
          <Text style={text}>
            Olá {userName},
          </Text>
          <Text style={text}>
            Obrigado por te juntares à nossa comunidade! Estamos muito contentes por te teres aqui.
          </Text>
          {verificationUrl && (
            <>
              <Text style={text}>
                Para começares a usar a tua conta, por favor verifica o teu e-mail:
              </Text>
              <Section style={buttonContainer}>
                <Button style={button} href={verificationUrl}>
                  Verificar E-mail
                </Button>
              </Section>
            </>
          )}
          <Text style={text}>
            Se precisares de ajuda, não hesites em contactar-nos!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Malmequer - A tua loja online de confiança
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Order Confirmation Email Template
function OrderConfirmationEmail({ userName, orderNumber, orderTotal, orderItems }: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirmação da tua encomenda #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Encomenda Confirmada! ✅</Heading>
          <Text style={text}>
            Olá {userName},
          </Text>
          <Text style={text}>
            A tua encomenda <strong>#{orderNumber}</strong> foi confirmada e está a ser processada.
          </Text>

          <Section style={orderSection}>
            <Heading style={h2}>Detalhes da Encomenda</Heading>
            {orderItems.map((item, index) => (
              <Text key={index} style={orderItem}>
                {item.quantity}x {item.name} - {item.price}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={orderTotal}>
              <strong>Total: {orderTotal}</strong>
            </Text>
          </Section>

          <Text style={text}>
            Receberás uma notificação quando a tua encomenda for enviada.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Malmequer - A tua loja online de confiança
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Order Shipped Email Template
function OrderShippedEmail({ userName, orderNumber, trackingUrl }: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>A tua encomenda #{orderNumber} foi enviada!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Encomenda Enviada! 📦</Heading>
          <Text style={text}>
            Olá {userName},
          </Text>
          <Text style={text}>
            Ótimas notícias! A tua encomenda <strong>#{orderNumber}</strong> foi enviada e está a caminho.
          </Text>

          {trackingUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={trackingUrl}>
                Acompanhar Encomenda
              </Button>
            </Section>
          )}

          <Text style={text}>
            Deverás receber a tua encomenda nos próximos dias úteis.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Malmequer - A tua loja online de confiança
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Password Reset Email Template
function PasswordResetEmail({ userName, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Redefinir a tua palavra-passe</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Redefinir Palavra-passe 🔐</Heading>
          <Text style={text}>
            Olá {userName},
          </Text>
          <Text style={text}>
            Recebemos um pedido para redefinir a palavra-passe da tua conta.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Redefinir Palavra-passe
            </Button>
          </Section>

          <Text style={text}>
            Se não fizeste este pedido, podes ignorar este e-mail.
          </Text>
          <Text style={text}>
            Este link expira em 1 hora por motivos de segurança.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Malmequer - A tua loja online de confiança
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Stock Alert Email Template
function StockAlertEmail({ userName, productName, productUrl }: StockAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{productName} está novamente disponível!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Produto Disponível! 🎉</Heading>
          <Text style={text}>
            Olá {userName},
          </Text>
          <Text style={text}>
            Ótimas notícias! O produto <strong>{productName}</strong> que estavas à espera está novamente disponível.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={productUrl}>
              Ver Produto
            </Button>
          </Section>

          <Text style={text}>
            Não percas tempo - os stocks são limitados!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Malmequer - A tua loja online de confiança
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Email rendering functions
export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  return render(<WelcomeEmail {...props} />)
}

export function renderOrderConfirmationEmail(props: OrderEmailProps): string {
  return render(<OrderConfirmationEmail {...props} />)
}

export function renderOrderShippedEmail(props: OrderEmailProps): string {
  return render(<OrderShippedEmail {...props} />)
}

export function renderPasswordResetEmail(props: PasswordResetEmailProps): string {
  return render(<PasswordResetEmail {...props} />)
}

export function renderStockAlertEmail(props: StockAlertEmailProps): string {
  return render(<StockAlertEmail {...props} />)
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  margin: '24px 0',
  padding: '0 40px',
  lineHeight: '1.4',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const orderSection = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  margin: '20px 40px',
  borderRadius: '4px',
}

const orderItem = {
  color: '#333',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.4',
}

const orderTotal = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '16px 0 0',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #eaeaea',
  margin: '26px 0',
  width: '100%',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0 40px',
}