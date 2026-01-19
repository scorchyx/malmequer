'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useToast } from '../ui/Toast'

interface ProductVariant {
  id: string
  type: 'COR' | 'TAMANHO'
  label: string
  value: string
  priceExtra: number | null
}

interface StockItem {
  id: string
  sizeVariantId: string
  colorVariantId: string
  quantity: number
  sizeVariant: ProductVariant
  colorVariant: ProductVariant
}

interface ProductOptionsProps {
  productId: string
  variants: ProductVariant[]
  stockItems: StockItem[]
  basePrice: number
}

export default function ProductOptions({ productId, variants, stockItems, basePrice }: ProductOptionsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isAdding, setIsAdding] = useState(false)

  // Separate variants by type
  const sizeVariants = useMemo(() => variants.filter(v => v.type === 'TAMANHO'), [variants])
  const colorVariants = useMemo(() => variants.filter(v => v.type === 'COR'), [variants])

  // Initialize selected variants
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    sizeVariants.length > 0 ? sizeVariants[0].id : null
  )
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    colorVariants.length > 0 ? colorVariants[0].id : null
  )

  const [quantity, setQuantity] = useState(1)

  // Find current stock item based on selections
  const currentStockItem = useMemo(() => {
    if (!selectedSizeId || !selectedColorId) return null
    return stockItems.find(
      si => si.sizeVariantId === selectedSizeId && si.colorVariantId === selectedColorId
    ) || null
  }, [stockItems, selectedSizeId, selectedColorId])

  const currentInventory = currentStockItem?.quantity || 0

  // Calculate price with extras
  const currentPrice = useMemo(() => {
    let price = basePrice
    const selectedSize = sizeVariants.find(v => v.id === selectedSizeId)
    const selectedColor = colorVariants.find(v => v.id === selectedColorId)

    if (selectedSize?.priceExtra) price += selectedSize.priceExtra
    if (selectedColor?.priceExtra) price += selectedColor.priceExtra

    return price
  }, [basePrice, sizeVariants, colorVariants, selectedSizeId, selectedColorId])

  // Check if a combination has stock
  const hasStock = (sizeId: string, colorId: string) => {
    const item = stockItems.find(
      si => si.sizeVariantId === sizeId && si.colorVariantId === colorId
    )
    return item ? item.quantity > 0 : false
  }

  // Check if a size has any stock with any color
  const sizeHasAnyStock = (sizeId: string) => {
    return stockItems.some(si => si.sizeVariantId === sizeId && si.quantity > 0)
  }

  // Check if a color has any stock with any size
  const colorHasAnyStock = (colorId: string) => {
    return stockItems.some(si => si.colorVariantId === colorId && si.quantity > 0)
  }

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

  const handleAddToCart = async () => {
    if (!currentStockItem) {
      showToast('Selecione tamanho e cor', 'error')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          stockItemId: currentStockItem.id,
          quantity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cart API error:', response.status, errorData)
        throw new Error(errorData.error || 'Erro ao adicionar ao carrinho')
      }

      router.refresh()
      window.dispatchEvent(new Event('cartUpdated'))
      showToast('Produto adicionado ao carrinho!', 'success')
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error)
      showToast('Erro ao adicionar ao carrinho. Tente novamente.', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  // Render color circles (can be multiple colors for patterns)
  const renderColorCircle = (variant: ProductVariant, isSelected: boolean, isDisabled: boolean) => {
    const colors = variant.value.split(',')
    const size = colors.length > 1 ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-10 h-10 sm:w-12 sm:h-12'

    if (colors.length === 1) {
      const hex = colors[0]
      return (
        <button
          key={variant.id}
          onClick={() => setSelectedColorId(variant.id)}
          disabled={isDisabled}
          className={`
            ${size} rounded-full transition-all touch-manipulation cursor-pointer
            ${isSelected ? 'ring-2 ring-ink ring-offset-2' : ''}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={variant.label}
          style={{
            backgroundColor: hex,
            border: hex.toUpperCase() === '#FFFFFF' ? '2px solid #E5E7EB' : '2px solid transparent'
          }}
        />
      )
    }

    // Multiple colors - render as split circle
    const gradientStops = colors.map((color, i) => {
      const percent = (i / colors.length) * 100
      const nextPercent = ((i + 1) / colors.length) * 100
      return `${color} ${percent}%, ${color} ${nextPercent}%`
    }).join(', ')

    return (
      <button
        key={variant.id}
        onClick={() => setSelectedColorId(variant.id)}
        disabled={isDisabled}
        className={`
          ${size} rounded-full transition-all touch-manipulation cursor-pointer
          ${isSelected ? 'ring-2 ring-ink ring-offset-2' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={variant.label}
        style={{
          background: `conic-gradient(${gradientStops})`,
          border: '2px solid #E5E7EB'
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <p className="text-4xl font-bold text-gray-900">
          {currentPrice.toFixed(2)}€
        </p>
      </div>

      {/* Size Selection */}
      {sizeVariants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Tamanho
          </label>
          <div className="flex flex-wrap gap-2">
            {sizeVariants.map((variant) => {
              const isSelected = selectedSizeId === variant.id
              const isDisabled = !sizeHasAnyStock(variant.id)
              const hasExtra = variant.priceExtra && variant.priceExtra > 0

              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedSizeId(variant.id)}
                  disabled={isDisabled}
                  className={`
                    px-4 py-2 sm:px-6 sm:py-3 border-2 font-medium transition-all touch-manipulation cursor-pointer
                    ${isSelected
                      ? 'border-ink bg-ink text-white'
                      : 'border-cloud text-ink hover:border-stone'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className={isDisabled ? 'line-through' : ''}>
                    {variant.label}
                  </span>
                  {hasExtra && (
                    <span className="ml-1 text-xs">
                      (+{Number(variant.priceExtra).toFixed(2)}€)
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {colorVariants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Cor
          </label>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((variant) => {
              const isSelected = selectedColorId === variant.id
              const isDisabled = !colorHasAnyStock(variant.id)

              return renderColorCircle(variant, isSelected, isDisabled)
            })}
          </div>
          {selectedColorId && (
            <p className="text-sm text-gray-600 mt-2">
              {colorVariants.find(v => v.id === selectedColorId)?.label}
            </p>
          )}
        </div>
      )}

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
          <span className={`text-lg font-medium w-12 text-center ${quantity >= currentInventory ? 'opacity-50' : ''}`}>
            {quantity}
          </span>
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
        {currentInventory === 0 && selectedSizeId && selectedColorId && (
          <p className="text-sm text-red-600 mt-2">
            Esta combinação está esgotada
          </p>
        )}
      </div>

      {/* Add to Cart Button */}
      <div className="space-y-4">
        <button
          onClick={handleAddToCart}
          disabled={currentInventory === 0 || isAdding || !currentStockItem}
          className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding ? 'A adicionar...' : currentInventory === 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
        </button>
        <button className="w-full border-2 border-gray-300 text-gray-900 py-3 px-6 rounded-lg font-medium hover:border-gray-400 transition touch-manipulation cursor-pointer">
          Adicionar aos favoritos
        </button>
      </div>
    </div>
  )
}
