'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'

interface CheckoutFormProps {
  orderNumber: string
}

export default function CheckoutForm({ orderNumber }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/encomenda-sucesso?orderNumber=${orderNumber}`,
        },
      })

      if (error) {
        showToast(
          error.message || 'Erro ao processar pagamento',
          'error'
        )
      }
    } catch (error) {
      showToast('Erro ao processar pagamento', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={!stripe || !elements}
        >
          Pagar agora
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>O seu pagamento é seguro e encriptado</p>
      </div>
    </form>
  )
}
