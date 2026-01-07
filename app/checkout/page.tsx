'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
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

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: shippingData,
          paymentMethod,
        }),
      })

      if (!response.ok) throw new Error('Erro ao processar pagamento')

      const data = await response.json()

      // Redirect to success page
      router.push(`/encomenda-sucesso?orderId=${data.orderId}`)
    } catch (error) {
      showToast('Erro ao processar pagamento', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                  }`}
                >
                  1
                </div>
                <div className="w-32 h-1 bg-gray-300 mx-2">
                  <div
                    className={`h-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                  }`}
                >
                  2
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-32 mt-2">
              <span className="text-sm font-medium">Envio</span>
              <span className="text-sm font-medium">Pagamento</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            {step === 1 && (
              <form onSubmit={handleSubmitShipping}>
                <h2 className="text-xl font-semibold mb-6">Informações de Envio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome"
                    required
                    value={shippingData.firstName}
                    onChange={(e) => setShippingData({ ...shippingData, firstName: e.target.value })}
                  />
                  <Input
                    label="Apelido"
                    required
                    value={shippingData.lastName}
                    onChange={(e) => setShippingData({ ...shippingData, lastName: e.target.value })}
                  />
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
                  <Button type="submit">Continuar para pagamento</Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmitPayment}>
                <h2 className="text-xl font-semibold mb-6">Método de Pagamento</h2>

                <div className="space-y-4 mb-6">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Cartão de Crédito/Débito</div>
                      <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="mbway"
                      checked={paymentMethod === 'mbway'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">MB WAY</div>
                      <div className="text-sm text-gray-500">Pagamento por telemóvel</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="multibanco"
                      checked={paymentMethod === 'multibanco'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Multibanco</div>
                      <div className="text-sm text-gray-500">Referência multibanco</div>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button type="submit" isLoading={isLoading}>
                    Confirmar encomenda
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
