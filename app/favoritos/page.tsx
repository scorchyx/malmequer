'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number
    images: { url: string; alt: string }[]
    status: string
  }
  notes?: string
  priority: number
  createdAt: string
}

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (status === 'authenticated') {
      loadWishlist()
    }
  }, [status, router])

  const loadWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      showToast('Erro ao carregar favoritos', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (itemId: string) => {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })

      if (response.ok) {
        loadWishlist()
        showToast('Removido dos favoritos', 'success')
      }
    } catch (error) {
      showToast('Erro ao remover item', 'error')
    }
  }

  const moveToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/wishlist/move-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      if (response.ok) {
        loadWishlist()
        showToast('Adicionado ao carrinho!', 'success')
      }
    } catch (error) {
      showToast('Erro ao adicionar ao carrinho', 'error')
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Os Meus Favoritos</h1>
            <p className="mt-2 text-gray-600">
              {items.length} {items.length === 1 ? 'produto' : 'produtos'}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <p className="text-gray-600 mb-4">Ainda não tem favoritos</p>
              <Link href="/ver-tudo">
                <Button>Explorar produtos</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Link href={`/produto/${item.product.slug}`}>
                      <div className="relative w-full h-64">
                        <Image
                          src={item.product.images[0]?.url || '/placeholder.png'}
                          alt={item.product.images[0]?.alt || item.product.name}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-gray-100"
                    >
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {item.product.status !== 'ACTIVE' && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                        Indisponível
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <Link href={`/produto/${item.product.slug}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 mb-2">
                        {item.product.name}
                      </h3>
                    </Link>

                    <div className="mb-3">
                      {item.product.comparePrice && (
                        <span className="text-sm text-gray-500 line-through mr-2">
                          €{Number(item.product.comparePrice).toFixed(2)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900">
                        €{Number(item.product.price).toFixed(2)}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-sm text-gray-600 mb-3 italic">"{item.notes}"</p>
                    )}

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => moveToCart(item.product.id)}
                      disabled={item.product.status !== 'ACTIVE'}
                    >
                      {item.product.status === 'ACTIVE'
                        ? 'Adicionar ao carrinho'
                        : 'Indisponível'}
                    </Button>
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
