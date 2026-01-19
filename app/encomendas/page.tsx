'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  items: {
    id: string
    name: string
    quantity: number
    price: number
  }[]
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated') {
      loadOrders()
    }
  }, [status, router])

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmada',
      PROCESSING: 'Em processamento',
      SHIPPED: 'Enviada',
      DELIVERED: 'Entregue',
      CANCELLED: 'Cancelada',
      REFUNDED: 'Reembolsada',
    }
    return labels[status] || status
  }

  if (status === 'loading' || isLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">As Minhas Encomendas</h1>
            <p className="mt-2 text-gray-600">Consulte e acompanhe as suas encomendas</p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 mb-4">Ainda não fez nenhuma encomenda</p>
              <Link href="/ver-tudo">
                <Button>Começar a comprar</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Encomenda #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('pt-PT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-900">€{Number(item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-lg font-bold text-gray-900">
                        Total: €{Number(order.totalAmount).toFixed(2)}
                      </div>
                      <Link href={`/encomendas/${order.orderNumber}`}>
                        <Button variant="outline" size="sm">
                          Ver detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
