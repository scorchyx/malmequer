'use client'

import { X, ShoppingBag } from 'lucide-react'
import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
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

  // Mock cart items - replace with real data later
  const cartItems: never[] = []

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Carrinho</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  O seu carrinho está vazio
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Adicione produtos para começar a comprar
                </p>
                <Link
                  href="/ver-tudo"
                  onClick={onClose}
                  className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition"
                >
                  Ver Produtos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart items will be mapped here */}
              </div>
            )}
          </div>

          {/* Footer with total and checkout button */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">0.00€</span>
              </div>
              <button className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition">
                Finalizar Compra
              </button>
              <button
                onClick={onClose}
                className="w-full border-2 border-gray-300 text-gray-900 py-3 px-6 rounded-lg font-medium hover:border-gray-400 transition"
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
