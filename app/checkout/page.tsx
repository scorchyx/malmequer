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
import { MapPin, Check } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SavedAddress {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

// Portuguese districts for dropdown
const PORTUGUESE_DISTRICTS = [
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
  'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
  'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real',
  'Viseu', 'Ilha da Madeira', 'Ilha de Porto Santo',
  'Ilha de Santa Maria', 'Ilha de São Miguel', 'Ilha Terceira',
  'Ilha da Graciosa', 'Ilha de São Jorge', 'Ilha do Pico',
  'Ilha do Faial', 'Ilha das Flores', 'Ilha do Corvo',
]

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [clientSecret, setClientSecret] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [postalCodeError, setPostalCodeError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  const [shippingData, setShippingData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    locality: '', // Localidade (required by CTT)
    city: '', // Concelho
    state: '', // Distrito
    postalCode: '',
    country: 'Portugal',
    nif: '', // Optional for invoice
  })

  const [paymentMethod, setPaymentMethod] = useState('card')

  // Load user's saved addresses
  useEffect(() => {
    if (session?.user) {
      setShippingData((prev) => ({ ...prev, email: session.user?.email || '' }))
      fetchSavedAddresses()
    }
  }, [session])

  const fetchSavedAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const response = await fetch('/api/user/addresses')
      if (response.ok) {
        const data = await response.json()
        setSavedAddresses(data.addresses)
        // Auto-select default address if available
        const defaultAddress = data.addresses.find((a: SavedAddress) => a.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
        } else if (data.addresses.length > 0) {
          setSelectedAddressId(data.addresses[0].id)
        } else {
          setUseNewAddress(true)
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setUseNewAddress(false)
    // Pre-fill email from session
    setShippingData((prev) => ({
      ...prev,
      fullName: `${address.firstName} ${address.lastName}`,
      phone: address.phone || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      locality: address.city,
      city: '',
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    }))
  }

  const handleUseNewAddress = () => {
    setSelectedAddressId(null)
    setUseNewAddress(true)
    setShippingData({
      fullName: '',
      email: session?.user?.email || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      locality: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Portugal',
      nif: '',
    })
  }

  // Validate Portuguese postal code (XXXX-XXX format)
  const validatePostalCode = (code: string): boolean => {
    const postalCodeRegex = /^\d{4}-\d{3}$/
    return postalCodeRegex.test(code)
  }

  // Format postal code as user types (auto-add hyphen)
  const handlePostalCodeChange = (value: string) => {
    // Remove non-digits
    let digits = value.replace(/\D/g, '')

    // Limit to 7 digits
    if (digits.length > 7) {
      digits = digits.slice(0, 7)
    }

    // Auto-format with hyphen after 4 digits
    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`
    }

    setShippingData({ ...shippingData, postalCode: formatted })

    // Validate only when complete
    if (formatted.length === 8) {
      if (!validatePostalCode(formatted)) {
        setPostalCodeError('Formato inválido. Use XXXX-XXX')
      } else {
        setPostalCodeError('')
      }
    } else {
      setPostalCodeError('')
    }
  }

  // Validate Portuguese phone number
  const validatePhone = (phone: string): boolean => {
    // Remove spaces and country code
    const cleaned = phone.replace(/\s/g, '').replace(/^\+351/, '')
    // Portuguese mobile (9XX) or landline (2XX)
    return /^[29]\d{8}$/.test(cleaned)
  }

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove non-digits except +
    let cleaned = value.replace(/[^\d+]/g, '')

    // If starts with +351, format accordingly
    if (cleaned.startsWith('+351')) {
      const digits = cleaned.slice(4)
      if (digits.length <= 9) {
        cleaned = `+351 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim()
      }
    } else if (cleaned.startsWith('+')) {
      // Keep international format as is
    } else {
      // Portuguese number without country code
      if (cleaned.length > 9) {
        cleaned = cleaned.slice(0, 9)
      }
      if (cleaned.length > 6) {
        cleaned = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
      } else if (cleaned.length > 3) {
        cleaned = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
      }
    }

    setShippingData({ ...shippingData, phone: cleaned })

    // Validate when appears complete
    const digitsOnly = cleaned.replace(/\D/g, '')
    if (digitsOnly.length >= 9) {
      if (!validatePhone(cleaned)) {
        setPhoneError('Número de telefone inválido')
      } else {
        setPhoneError('')
      }
    } else {
      setPhoneError('')
    }
  }

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault()

    let addressData: {
      firstName: string
      lastName: string
      email: string
      phone: string
      addressLine1: string
      addressLine2: string
      city: string
      state: string
      postalCode: string
      country: string
      nif?: string
    }

    // If using a saved address
    if (selectedAddressId && !useNewAddress && session?.user) {
      const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId)
      if (!selectedAddress) {
        showToast('Por favor selecione uma morada', 'error')
        return
      }

      addressData = {
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        email: shippingData.email,
        phone: selectedAddress.phone || '',
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2 || '',
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
      }
    } else {
      // Using new address - validate
      if (!validatePostalCode(shippingData.postalCode)) {
        setPostalCodeError('Código postal inválido. Use o formato XXXX-XXX')
        showToast('Por favor corrija o código postal', 'error')
        return
      }

      if (!validatePhone(shippingData.phone)) {
        setPhoneError('Número de telefone inválido')
        showToast('Por favor corrija o número de telefone', 'error')
        return
      }

      // Split full name into firstName and lastName for API
      const nameParts = shippingData.fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName

      // Combine locality and city for addressLine2 if needed
      const fullAddress = shippingData.addressLine2
        ? `${shippingData.addressLine2}, ${shippingData.locality}`
        : shippingData.locality

      addressData = {
        firstName,
        lastName,
        email: shippingData.email,
        phone: shippingData.phone.replace(/\s/g, ''),
        addressLine1: shippingData.addressLine1,
        addressLine2: fullAddress,
        city: shippingData.city || shippingData.locality,
        state: shippingData.state,
        postalCode: shippingData.postalCode,
        country: shippingData.country,
        nif: shippingData.nif || undefined,
      }
    }

    setIsLoading(true)

    try {
      // Create payment intent and order
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: addressData,
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

                {/* Saved Addresses Section - Only show for logged in users */}
                {session?.user && savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-stone mb-3">Moradas guardadas:</p>
                    <div className="space-y-3 mb-4">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => handleSelectAddress(address)}
                          className={`w-full text-left p-4 border transition-colors ${
                            selectedAddressId === address.id && !useNewAddress
                              ? 'border-ink bg-snow'
                              : 'border-cloud hover:border-mist'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedAddressId === address.id && !useNewAddress
                                  ? 'border-ink bg-ink'
                                  : 'border-cloud'
                              }`}>
                                {selectedAddressId === address.id && !useNewAddress && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-ink">
                                  {address.firstName} {address.lastName}
                                  {address.isDefault && (
                                    <span className="ml-2 text-xs bg-ink text-white px-2 py-0.5">
                                      Principal
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-stone">{address.addressLine1}</p>
                                <p className="text-sm text-stone">
                                  {address.postalCode} {address.city}
                                </p>
                                <p className="text-sm text-stone">{address.state}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}

                      {/* New Address Option */}
                      <button
                        type="button"
                        onClick={handleUseNewAddress}
                        className={`w-full text-left p-4 border transition-colors ${
                          useNewAddress
                            ? 'border-ink bg-snow'
                            : 'border-cloud hover:border-mist'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            useNewAddress ? 'border-ink bg-ink' : 'border-cloud'
                          }`}>
                            {useNewAddress && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-mist" />
                            <span className="text-ink">Usar outra morada</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Show form if: no saved addresses, user chose new address, or not logged in */}
                {(savedAddresses.length === 0 || useNewAddress || !session?.user) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome completo */}
                  <div className="md:col-span-2">
                    <Input
                      label="Nome completo"
                      required
                      value={shippingData.fullName}
                      onChange={(e) => setShippingData({ ...shippingData, fullName: e.target.value })}
                      placeholder="Nome e apelido"
                    />
                  </div>

                  {/* Email */}
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={shippingData.email}
                    onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                    placeholder="exemplo@email.com"
                  />

                  {/* Telefone */}
                  <div>
                    <Input
                      label="Telefone"
                      type="tel"
                      required
                      value={shippingData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="912 345 678"
                    />
                    {phoneError && (
                      <p className="text-red-600 text-sm mt-1">{phoneError}</p>
                    )}
                  </div>

                  {/* Morada */}
                  <div className="md:col-span-2">
                    <Input
                      label="Morada"
                      required
                      value={shippingData.addressLine1}
                      onChange={(e) => setShippingData({ ...shippingData, addressLine1: e.target.value })}
                      placeholder="Rua, número e andar"
                    />
                  </div>

                  {/* Complemento */}
                  <div className="md:col-span-2">
                    <Input
                      label="Complemento (opcional)"
                      value={shippingData.addressLine2}
                      onChange={(e) => setShippingData({ ...shippingData, addressLine2: e.target.value })}
                      placeholder="Apartamento, bloco, etc."
                    />
                  </div>

                  {/* Código Postal e Localidade */}
                  <div>
                    <Input
                      label="Código Postal"
                      required
                      value={shippingData.postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                      placeholder="1234-567"
                      maxLength={8}
                    />
                    {postalCodeError && (
                      <p className="text-red-600 text-sm mt-1">{postalCodeError}</p>
                    )}
                  </div>

                  <Input
                    label="Localidade"
                    required
                    value={shippingData.locality}
                    onChange={(e) => setShippingData({ ...shippingData, locality: e.target.value })}
                    placeholder="Ex: Amadora"
                  />

                  {/* Concelho */}
                  <Input
                    label="Concelho"
                    value={shippingData.city}
                    onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                    placeholder="Ex: Amadora (opcional)"
                  />

                  {/* Distrito */}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">
                      Distrito <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={shippingData.state}
                      onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-cloud bg-white text-ink focus:outline-none focus:border-ink transition-colors"
                    >
                      <option value="">Selecione o distrito</option>
                      {PORTUGUESE_DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* País (fixo Portugal) */}
                  <Input
                    label="País"
                    required
                    value={shippingData.country}
                    disabled
                  />

                  {/* NIF (opcional) */}
                  <Input
                    label="NIF (opcional, para fatura)"
                    value={shippingData.nif}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                      setShippingData({ ...shippingData, nif: value })
                    }}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
                )}

                {/* Email field for saved address (always needed) */}
                {selectedAddressId && !useNewAddress && session?.user && (
                  <div className="mt-4">
                    <Input
                      label="Email para confirmação"
                      type="email"
                      required
                      value={shippingData.email}
                      onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                      placeholder="exemplo@email.com"
                    />
                  </div>
                )}

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
