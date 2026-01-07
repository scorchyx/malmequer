'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ProductGrid from '../components/products/ProductGrid'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'

interface SearchFilters {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'newest'
  inStock?: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    sortBy: 'relevance',
  })

  useEffect(() => {
    performSearch()
  }, [searchParams])

  const performSearch = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.query) params.append('q', filters.query)
      if (filters.category) params.append('category', filters.category)
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.inStock) params.append('inStock', 'true')

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalResults(data.total || 0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    // Update URL
    const params = new URLSearchParams()
    if (updated.query) params.append('q', updated.query)
    if (updated.category) params.append('category', updated.category)
    if (updated.minPrice) params.append('minPrice', updated.minPrice.toString())
    if (updated.maxPrice) params.append('maxPrice', updated.maxPrice.toString())
    if (updated.sortBy) params.append('sortBy', updated.sortBy)

    router.push(`/pesquisa?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilters({
      query: filters.query,
      sortBy: 'relevance',
    })
    router.push(`/pesquisa?q=${filters.query}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-black">
              {filters.query ? `Resultados para "${filters.query}"` : 'Pesquisa'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isLoading ? 'A pesquisar...' : `${totalResults} produtos encontrados`}
            </p>
          </div>

          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Filtros</h2>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Limpar
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-medium mb-3">Preço</h3>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Mínimo"
                        value={filters.minPrice || ''}
                        onChange={(e) =>
                          updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full px-3 py-2 border rounded text-black placeholder:text-gray-500"
                      />
                      <input
                        type="number"
                        placeholder="Máximo"
                        value={filters.maxPrice || ''}
                        onChange={(e) =>
                          updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full px-3 py-2 border rounded text-black placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock || false}
                        onChange={(e) => updateFilters({ inStock: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Apenas em stock</span>
                    </label>
                  </div>

                  {/* Quick Price Filters */}
                  <div>
                    <h3 className="font-medium mb-3">Faixas de preço</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => updateFilters({ minPrice: 0, maxPrice: 25 })}
                        className="text-sm text-gray-700 hover:text-blue-600 block w-full text-left"
                      >
                        Até €25
                      </button>
                      <button
                        onClick={() => updateFilters({ minPrice: 25, maxPrice: 50 })}
                        className="text-sm text-gray-700 hover:text-blue-600 block w-full text-left"
                      >
                        €25 - €50
                      </button>
                      <button
                        onClick={() => updateFilters({ minPrice: 50, maxPrice: 100 })}
                        className="text-sm text-gray-700 hover:text-blue-600 block w-full text-left"
                      >
                        €50 - €100
                      </button>
                      <button
                        onClick={() => updateFilters({ minPrice: 100, maxPrice: undefined })}
                        className="text-sm text-gray-700 hover:text-blue-600 block w-full text-left"
                      >
                        Mais de €100
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Sort & Mobile Filter Toggle */}
              <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Filtros
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-black">Ordenar por:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      updateFilters({ sortBy: e.target.value as SearchFilters['sortBy'] })
                    }
                    className="px-3 py-2 border rounded text-black"
                  >
                    <option value="relevance">Relevância</option>
                    <option value="price-asc">Preço: Menor para Maior</option>
                    <option value="price-desc">Preço: Maior para Menor</option>
                    <option value="newest">Mais recentes</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {isLoading ? (
                <Loading />
              ) : products.length > 0 ? (
                <ProductGrid products={products} />
              ) : (
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-black mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros ou termos de pesquisa
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
