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

interface WelcomeEmailProps {
  userName: string
  verificationUrl?: string
}

// Simple Welcome Email Template
function WelcomeEmail({ userName, verificationUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Malmequer!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Malmequer! 🌼</Heading>
          <Text style={text}>
            Hello {userName},
          </Text>
          <Text style={text}>
            Thank you for joining our community! We are very happy to have you here.
          </Text>
          {verificationUrl && (
            <>
              <Text style={text}>
                To start using your account, please verify your email:
              </Text>
              <Section style={buttonContainer}>
                <Button style={button} href={verificationUrl}>
                  Verify Email
                </Button>
              </Section>
            </>
          )}
          <Text style={text}>
            If you need help, do not hesitate to contact us!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Malmequer - Your trusted online store
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Email rendering function
export function renderSimpleWelcomeEmail(props: WelcomeEmailProps): string {
  return render(<WelcomeEmail {...props} />)
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