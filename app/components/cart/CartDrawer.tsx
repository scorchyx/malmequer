'use client'

import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: Array<{ url: string; alt: string }>
  }
  variant?: {
    id: string
    name: string
    value: string
    price: number | null
  } | null
}

interface CartData {
  items: CartItem[]
  total: number
  count: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [cartData, setCartData] = useState<CartData>({ items: [], total: 0, count: 0 })
  const [isLoading, setIsLoading] = useState(false)

  // Fetch cart data
  const fetchCart = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCartData(data)
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Remove item from cart
  const removeItem = async (productId: string, variantId: string | null) => {
    try {
      console.log('Removing item:', { productId, variantId })

      const params = new URLSearchParams({ productId })
      if (variantId) {
        params.append('variantId', variantId)
      }

      console.log('DELETE URL:', `/api/cart?${params.toString()}`)

      const response = await fetch(`/api/cart?${params.toString()}`, {
        method: 'DELETE',
      })

      console.log('DELETE response status:', response.status)

      if (response.ok) {
        // Refresh cart data
        await fetchCart()
        // Update cart count in header
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        const error = await response.json()
        console.error('DELETE failed:', error)
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  // Fetch cart when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const cartItems = cartData.items

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-[100] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-[101] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cloud">
            <h2 className="text-lg font-semibold text-ink">Carrinho</h2>
            <button
              onClick={onClose}
              className="p-2 text-stone hover:text-ink transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="h-16 w-16 text-cloud mb-4" />
                <h3 className="text-lg font-medium text-ink mb-2">
                  O seu carrinho está vazio
                </h3>
                <p className="text-sm text-mist mb-6">
                  Adicione produtos para começar a comprar
                </p>
                <Link
                  href="/ver-tudo"
                  onClick={onClose}
                  className="px-6 py-3 bg-ink text-white text-sm font-medium uppercase tracking-wider hover:bg-stone transition-colors duration-200"
                >
                  Ver Produtos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemPrice = item.variant?.price || item.product.price
                  const itemTotal = Number(itemPrice) * item.quantity

                  return (
                    <div key={item.id} className="flex gap-4 border-b border-cloud pb-4">
                      {/* Product Image */}
                      {item.product.images[0] && (
                        <div className="relative w-20 h-20 flex-shrink-0 bg-cloud">
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.images[0].alt || item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-ink">
                          {item.product.name}
                        </h3>
                        {item.variant && (
                          <p className="text-xs text-mist mt-1">
                            {item.variant.name}: {item.variant.value}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-stone">
                            {item.quantity} x €{Number(itemPrice).toFixed(2)}
                          </p>
                          <p className="text-sm font-semibold text-ink">
                            €{itemTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeItem(item.product.id, item.variant?.id || null)}
                        className="text-mist hover:text-error transition-colors duration-200"
                        aria-label="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer with total and checkout button */}
          {cartItems.length > 0 && (
            <div className="border-t border-cloud p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-stone">Subtotal</span>
                <span className="text-xl font-bold text-ink">€{cartData.total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" onClick={onClose}>
                <button className="w-full bg-ink text-white py-3 px-6 text-sm font-medium uppercase tracking-wider hover:bg-stone transition-colors duration-200">
                  Finalizar Compra
                </button>
              </Link>
              <button
                onClick={onClose}
                className="w-full border border-ink text-ink py-3 px-6 text-sm font-medium uppercase tracking-wider hover:bg-ink hover:text-white transition-colors duration-200"
              >
                Continuar a Comprar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
