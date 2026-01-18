'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useToast } from '../ui/Toast'

interface ProductVariant {
  id: string
  name: string
  value: string
  price: number | null
  inventory: number
}

interface ProductOptionsProps {
  productId: string
  variants: ProductVariant[]
  basePrice: number
  baseInventory?: number
}

export default function ProductOptions({ productId, variants, basePrice, baseInventory = 999 }: ProductOptionsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isAdding, setIsAdding] = useState(false)

  // Group variants by type (name)
  const variantGroups = variants.reduce((acc, variant) => {
    if (!acc[variant.name]) {
      acc[variant.name] = []
    }
    acc[variant.name].push(variant)
    return acc
  }, {} as Record<string, ProductVariant[]>)

  const variantTypes = Object.keys(variantGroups)

  // Initialize selected variants - one per type
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    variantTypes.forEach((type) => {
      if (variantGroups[type].length > 0) {
        initial[type] = variantGroups[type][0].id
      }
    })
    return initial
  })

  const [quantity, setQuantity] = useState(1)

  // Get current selected variant for each type
  const currentVariantValues = Object.entries(selectedVariants).map(([type, id]) => {
    return variants.find((v) => v.id === id)
  })

  // Calculate price and inventory based on all selected variants
  const currentPrice = currentVariantValues.reduce((price, variant) => {
    return variant?.price ?? price
  }, basePrice)

  const currentInventory = currentVariantValues.reduce((inventory, variant) => {
    if (!variant) return inventory
    return Math.min(inventory, variant.inventory)
  }, baseInventory)

  const incrementQuantity = () => {
    if (quantity < currentInventory) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleVariantChange = (type: string, id: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [type]: id,
    }))
  }

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      // Get the first selected variant ID (if any variants exist)
      const variantId = Object.values(selectedVariants)[0] || null

      const payload: any = {
        productId,
        quantity,
      }

      // Only include variantId if it's not null
      if (variantId) {
        payload.variantId = variantId
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cart API error:', response.status, errorData)
        throw new Error(errorData.error || 'Erro ao adicionar ao carrinho')
      }

      // Refresh to update cart count
      router.refresh()

      // Dispatch event to update cart count in header
      window.dispatchEvent(new Event('cartUpdated'))

      // Show success message
      showToast('Produto adicionado ao carrinho!', 'success')
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      showToast('Erro ao adicionar ao carrinho. Tente novamente.', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <p className="text-4xl font-bold text-gray-900">
          {Number(currentPrice).toFixed(2)}€
        </p>
      </div>

      {/* Variant Selection - One section per variant type */}
      {variantTypes.map((type) => (
        <div key={type}>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            {type}
          </label>
          <div className="flex flex-wrap gap-2">
            {variantGroups[type].map((variant) => {
              const isCor = type.toLowerCase() === 'cor'
              const colorMap: Record<string, string> = {
                'cinzenta': '#808080',
                'cinza': '#808080',
                'preto': '#000000',
                'branco': '#FFFFFF',
                'vermelho': '#DC2626',
                'azul': '#2563EB',
                'azul-marinho': '#1E3A5F',
                'verde': '#16A34A',
                'amarelo': '#EAB308',
                'rosa': '#EC4899',
                'laranja': '#EA580C',
                'roxo': '#9333EA',
                'castanho': '#92400E',
                'bege': '#D4A574',
              }
              const colorValue = colorMap[variant.value.toLowerCase()] || '#808080'

              if (isCor) {
                return (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(type, variant.id)}
                    disabled={variant.inventory === 0}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full p-1 transition-all touch-manipulation
                      ${selectedVariants[type] === variant.id ? 'ring-2 ring-ink ring-offset-2' : ''}
                      ${variant.inventory === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={variant.value}
                    style={{
                      backgroundColor: colorValue,
                      border: colorValue === '#FFFFFF' ? '2px solid #E5E7EB' : '2px solid transparent'
                    }}
                  />
                )
              }

              return (
                <button
                  key={variant.id}
                  onClick={() => handleVariantChange(type, variant.id)}
                  disabled={variant.inventory === 0}
                  className={`
                    px-4 py-2 sm:px-6 sm:py-3 border-2 font-medium transition-all touch-manipulation
                    ${
                      selectedVariants[type] === variant.id
                        ? 'border-ink bg-ink text-white'
                        : 'border-cloud text-ink hover:border-stone'
                    }
                    ${variant.inventory === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className={variant.inventory === 0 ? 'line-through' : ''}>
                    {variant.value}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Quantity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Quantidade
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-5 w-5 stroke-[3]" />
          </button>
          <span className={`text-lg font-medium w-12 text-center ${quantity >= currentInventory ? 'opacity-50' : ''}`}>{quantity}</span>
          <button
            onClick={incrementQuantity}
            disabled={quantity >= currentInventory}
            className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5 stroke-[3]" />
          </button>
        </div>
        {currentInventory < 10 && currentInventory > 0 && (
          <p className="text-sm text-orange-600 mt-2">
            Apenas {currentInventory} {currentInventory === 1 ? 'unidade disponível' : 'unidades disponíveis'}
          </p>
        )}
      </div>

      {/* Add to Cart Button */}
      <div className="space-y-4">
        <button
          onClick={handleAddToCart}
          disabled={currentInventory === 0 || isAdding}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding ? 'A adicionar...' : currentInventory === 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
        </button>
        <button className="w-full border-2 border-gray-300 text-gray-900 py-3 px-6 rounded-lg font-medium hover:border-gray-400 transition touch-manipulation">
          Adicionar aos favoritos
        </button>
      </div>
    </div>
  )
}
