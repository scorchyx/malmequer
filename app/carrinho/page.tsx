'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import Image from 'next/image'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string; alt: string }[]
  }
  variant?: {
    id: string
    name: string
    value: string
    price?: number
  }
}

export default function CartPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items || [])
      }
    } catch (error) {
      showToast('Erro ao carregar carrinho', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      })

      if (response.ok) {
        loadCart()
        showToast('Quantidade atualizada', 'success')
      }
    } catch (error) {
      showToast('Erro ao atualizar quantidade', 'error')
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })

      if (response.ok) {
        loadCart()
        showToast('Item removido do carrinho', 'success')
      }
    } catch (error) {
      showToast('Erro ao remover item', 'error')
    }
  }

  const applyCoupon = async () => {
    try {
      const response = await fetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })

      if (response.ok) {
        const data = await response.json()
        setDiscount(data.discount)
        showToast('Cupão aplicado com sucesso!', 'success')
      } else {
        showToast('Cupão inválido', 'error')
      }
    } catch (error) {
      showToast('Erro ao aplicar cupão', 'error')
    }
  }

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const price = item.variant?.price || item.product.price
      return total + price * item.quantity
    }, 0)
    return subtotal - discount
  }

  if (isLoading) {
    return <Loading fullScreen />
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">O seu carrinho está vazio</h2>
            <p className="text-gray-600">Adicione produtos para começar as suas compras</p>
            <Link href="/ver-tudo">
              <Button>Continuar a comprar</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrinho de Compras</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={item.product.images[0]?.url || '/placeholder.png'}
                        alt={item.product.images[0]?.alt || item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>

                    <div className="flex-1">
                      <Link href={`/produto/${item.product.slug}`}>
                        <h3 className="font-semibold text-lg hover:text-blue-600">
                          {item.product.name}
                        </h3>
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-600">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        €{(item.variant?.price || item.product.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </button>

                      <div className="flex items-center gap-2 border rounded">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-3">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Resumo da Encomenda</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">€{calculateTotal().toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envio</span>
                    <span className="text-sm text-gray-500">Calculado no checkout</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>€{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Código de cupão"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <Button variant="outline" className="w-full" onClick={applyCoupon}>
                    Aplicar cupão
                  </Button>
                </div>

                <Button
                  className="w-full"
                  onClick={() => router.push('/checkout')}
                >
                  Finalizar compra
                </Button>

                <Link href="/ver-tudo">
                  <Button variant="ghost" className="w-full mt-2">
                    Continuar a comprar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
