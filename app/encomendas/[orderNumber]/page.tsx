'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'

interface OrderDetails {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  subtotalAmount: number
  shippingAmount: number
  taxAmount: number
  discountAmount: number
  createdAt: string
  shippedAt?: string
  deliveredAt?: string
  estimatedDelivery?: string
  trackingNumber?: string
  trackingUrl?: string
  trackingCarrier?: string
  shippingAddress: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
  }
  items: {
    id: string
    name: string
    variantName?: string
    variantValue?: string
    quantity: number
    price: number
  }[]
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderNumber = params.orderNumber as string
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated' && orderNumber) {
      loadOrderDetails()
    }
  }, [status, router, orderNumber])

  const loadOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else {
        router.push('/encomendas')
      }
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <Loading fullScreen />
  }

  if (!order) {
    return null
  }

  const getStatusSteps = () => {
    const allSteps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    const currentIndex = allSteps.indexOf(order.status)
    return allSteps.map((step, index) => ({
      name: step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }))
  }

  const statusSteps = getStatusSteps()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/encomendas" className="text-blue-600 hover:text-blue-700 text-sm">
              ← Voltar às encomendas
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Encomenda #{order.orderNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  Feita em {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Estado</p>
                <p className="text-lg font-semibold text-gray-900">{order.status}</p>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.name} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <p className="text-xs mt-2 text-center">{step.name}</p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`flex-1 h-1 ${
                          step.completed ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Informações de Envio</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600">Transportadora:</span>{' '}
                    {order.trackingCarrier || 'N/A'}
                  </p>
                  <p>
                    <span className="text-gray-600">Número de rastreio:</span>{' '}
                    {order.trackingNumber}
                  </p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 inline-block mt-2"
                    >
                      Rastrear encomenda →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Produtos</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.variantName && (
                        <p className="text-sm text-gray-600">
                          {item.variantName}: {item.variantValue}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">€{(Number(item.price) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>€{Number(order.subtotalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envio</span>
                <span>€{Number(order.shippingAmount).toFixed(2)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-€{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA</span>
                <span>€{Number(order.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>€{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Morada de Envio</h3>
            <div className="text-gray-700">
              <p className="font-medium">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
              <p>{order.shippingAddress.state}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="mt-2">Tel: {order.shippingAddress.phone}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button variant="outline">Contactar suporte</Button>
            {order.status === 'DELIVERED' && (
              <Button variant="outline">Solicitar devolução</Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
