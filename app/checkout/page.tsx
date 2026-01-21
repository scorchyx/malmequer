'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import CheckoutForm from '../components/checkout/CheckoutForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [clientSecret, setClientSecret] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  const [shippingData, setShippingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Portugal',
  })

  const [paymentMethod, setPaymentMethod] = useState('card')

  useEffect(() => {
    if (session?.user?.email) {
      setShippingData((prev) => ({ ...prev, email: session.user?.email || '' }))
    }
  }, [session])

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Split full name into firstName and lastName for API
      const nameParts = shippingData.fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName // Use firstName if no lastName

      // Create payment intent and order
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: {
            firstName,
            lastName,
            email: shippingData.email,
            phone: shippingData.phone,
            addressLine1: shippingData.addressLine1,
            addressLine2: shippingData.addressLine2,
            city: shippingData.city,
            state: shippingData.state,
            postalCode: shippingData.postalCode,
            country: shippingData.country,
          },
          paymentMethod,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Erro ao processar')
      }

      const data = await response.json()
      setClientSecret(data.clientSecret)
      setOrderNumber(data.orderNumber)
      setStep(2)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao processar', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <Loading fullScreen />
  }

  const appearance = {
    theme: 'stripe' as const,
  }

  const options = {
    clientSecret,
    appearance,
  }

  return (
    <div className="min-h-screen flex flex-col bg-snow">
      <Header />
      <main className="flex-1 py-12">
        <div className="container-malmequer max-w-5xl">
          <h1 className="font-display text-3xl text-ink mb-8">Finalizar Compra</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? 'bg-ink text-white' : 'bg-cloud text-mist'
                  }`}
                >
                  1
                </div>
                <div className="w-32 h-1 bg-cloud mx-2">
                  <div
                    className={`h-full transition-all duration-200 ${step >= 2 ? 'bg-ink' : 'bg-cloud'}`}
                  />
                </div>
                <div
                  className={`w-10 h-10 flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? 'bg-ink text-white' : 'bg-cloud text-mist'
                  }`}
                >
                  2
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-32 mt-2">
              <span className="text-sm font-medium text-stone">Envio</span>
              <span className="text-sm font-medium text-stone">Pagamento</span>
            </div>
          </div>

          <div className="bg-white border border-cloud p-8">
            {step === 1 && (
              <form onSubmit={handleSubmitShipping}>
                <h2 className="text-lg font-semibold text-ink mb-6">Informações de Envio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Nome completo"
                      required
                      value={shippingData.fullName}
                      onChange={(e) => setShippingData({ ...shippingData, fullName: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={shippingData.email}
                    onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                  />
                  <Input
                    label="Telefone"
                    required
                    value={shippingData.phone}
                    onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Morada"
                      required
                      value={shippingData.addressLine1}
                      onChange={(e) => setShippingData({ ...shippingData, addressLine1: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Complemento (opcional)"
                      value={shippingData.addressLine2}
                      onChange={(e) => setShippingData({ ...shippingData, addressLine2: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Cidade"
                    required
                    value={shippingData.city}
                    onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                  />
                  <Input
                    label="Distrito"
                    required
                    value={shippingData.state}
                    onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                  />
                  <Input
                    label="Código Postal"
                    required
                    value={shippingData.postalCode}
                    onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                  />
                  <Input
                    label="País"
                    required
                    value={shippingData.country}
                    onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" isLoading={isLoading}>
                    Continuar para pagamento
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && clientSecret && (
              <div>
                <h2 className="text-lg font-semibold text-ink mb-6">Método de Pagamento</h2>
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm orderNumber={orderNumber} />
                </Elements>
                <div className="mt-6">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
