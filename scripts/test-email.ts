import { Resend } from 'resend'

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'
  const testEmail = process.argv[2] || 'rubenj.m.araujo@gmail.com'

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY não está configurada')
    process.exit(1)
  }

  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...')
  console.log('📧 From:', fromEmail)
  console.log('📬 To:', testEmail)
  console.log('')

  const resend = new Resend(apiKey)

  try {
    console.log('📤 A enviar email de teste...')

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: 'Teste de Email - Malmequer',
      html: '<h1>Teste</h1><p>Se estás a ver este email, o Resend está a funcionar!</p>',
    })

    if (error) {
      console.error('❌ Erro do Resend:', error)
      process.exit(1)
    }

    console.log('✅ Email enviado com sucesso!')
    console.log('📧 Email ID:', data?.id)
  } catch (err) {
    console.error('❌ Erro ao enviar:', err)
    process.exit(1)
  }
}

testEmail()
