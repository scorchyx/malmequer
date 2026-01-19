'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'
import { Plus, Trash2, RefreshCw } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface ProductImage {
  url: string
  alt: string
}

interface SizeVariant {
  label: string
  value: string
  sku: string
  priceExtra: string
}

interface ColorVariant {
  label: string
  colors: string[] // Array of hex codes
  sku: string
  priceExtra: string
}

interface StockItemData {
  sizeValue: string
  colorValue: string
  quantity: number
  sku: string
}

interface ProductFormData {
  name: string
  slug: string
  description: string
  price: string
  comparePrice: string
  weight: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  categoryId: string
  featured: boolean
  images: ProductImage[]
  sizes: SizeVariant[]
  colors: ColorVariant[]
  stockItems: StockItemData[]
}

interface ProductFormProps {
  productId?: string
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    comparePrice: '',
    weight: '',
    status: 'DRAFT',
    categoryId: '',
    featured: false,
    images: [],
    sizes: [],
    colors: [],
    stockItems: [],
  })

  useEffect(() => {
    loadCategories()
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const product = await response.json()

        // Group variants by type
        const sizeVariants = product.variants?.filter((v: any) => v.type === 'TAMANHO') || []
        const colorVariants = product.variants?.filter((v: any) => v.type === 'COR') || []

        // Convert to form format
        const sizes: SizeVariant[] = sizeVariants.map((v: any) => ({
          label: v.label,
          value: v.value,
          sku: v.sku || '',
          priceExtra: v.priceExtra ? String(v.priceExtra) : '',
        }))

        const colors: ColorVariant[] = colorVariants.map((v: any) => ({
          label: v.label,
          colors: v.value.split(','),
          sku: v.sku || '',
          priceExtra: v.priceExtra ? String(v.priceExtra) : '',
        }))

        // Convert stock items
        const stockItems: StockItemData[] = product.stockItems?.map((si: any) => ({
          sizeValue: si.sizeVariant.value,
          colorValue: si.colorVariant.value,
          quantity: si.quantity,
          sku: si.sku || '',
        })) || []

        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() || '',
          weight: product.weight?.toString() || '',
          status: product.status,
          categoryId: product.categoryId,
          featured: product.featured,
          images: product.images || [],
          sizes,
          colors,
          stockItems,
        })
      }
    } catch (error) {
      showToast('Erro ao carregar produto', 'error')
    }
  }

  // Generate all possible combinations
  const allCombinations = useMemo(() => {
    if (formData.sizes.length === 0 || formData.colors.length === 0) return []

    const combinations: { sizeValue: string; sizeLabel: string; colorValue: string; colorLabel: string }[] = []
    for (const size of formData.sizes) {
      for (const color of formData.colors) {
        const colorValue = color.colors.join(',')
        combinations.push({
          sizeValue: size.value,
          sizeLabel: size.label,
          colorValue,
          colorLabel: color.label,
        })
      }
    }
    return combinations
  }, [formData.sizes, formData.colors])

  const generateStockItems = () => {
    const newStockItems: StockItemData[] = allCombinations.map(combo => {
      // Keep existing quantity if found
      const existing = formData.stockItems.find(
        si => si.sizeValue === combo.sizeValue && si.colorValue === combo.colorValue
      )
      return {
        sizeValue: combo.sizeValue,
        colorValue: combo.colorValue,
        quantity: existing?.quantity || 0,
        sku: existing?.sku || '',
      }
    })
    setFormData({ ...formData, stockItems: newStockItems })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')

      const payload = {
        name: formData.name,
        slug,
        description: formData.description,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        status: formData.status,
        categoryId: formData.categoryId,
        featured: formData.featured,
        images: formData.images,
        sizes: formData.sizes.map(s => ({
          label: s.label,
          value: s.value,
          sku: s.sku || null,
          priceExtra: s.priceExtra ? parseFloat(s.priceExtra) : null,
        })),
        colors: formData.colors.map(c => ({
          label: c.label,
          value: c.colors.join(','),
          sku: c.sku || null,
          priceExtra: c.priceExtra ? parseFloat(c.priceExtra) : null,
        })),
        stockItems: formData.stockItems.map(si => ({
          sizeValue: si.sizeValue,
          colorValue: si.colorValue,
          quantity: si.quantity,
          sku: si.sku || null,
        })),
      }

      const url = productId ? `/api/products/${productId}` : '/api/products'
      const method = productId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast(
          productId ? 'Produto atualizado com sucesso' : 'Produto criado com sucesso',
          'success'
        )
        router.push('/admin/produtos')
      } else {
        const error = await response.json()
        showToast(error.error || 'Erro ao guardar produto', 'error')
      }
    } catch (error) {
      showToast('Erro ao guardar produto', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Image handlers
  const addImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: '', alt: '' }],
    })
  }

  const updateImage = (index: number, field: keyof ProductImage, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = { ...newImages[index], [field]: value }
    setFormData({ ...formData, images: newImages })
  }

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    })
  }

  // Size handlers
  const addSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { label: '', value: '', sku: '', priceExtra: '' }],
    })
  }

  const updateSize = (index: number, field: keyof SizeVariant, value: string) => {
    const newSizes = [...formData.sizes]
    newSizes[index] = { ...newSizes[index], [field]: value }
    setFormData({ ...formData, sizes: newSizes })
  }

  const removeSize = (index: number) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((_, i) => i !== index),
    })
  }

  // Color handlers
  const addColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { label: '', colors: ['#808080'], sku: '', priceExtra: '' }],
    })
  }

  const updateColor = (index: number, field: keyof ColorVariant, value: any) => {
    const newColors = [...formData.colors]
    newColors[index] = { ...newColors[index], [field]: value }
    setFormData({ ...formData, colors: newColors })
  }

  const addColorToVariant = (variantIndex: number) => {
    const newColors = [...formData.colors]
    newColors[variantIndex].colors.push('#808080')
    setFormData({ ...formData, colors: newColors })
  }

  const updateColorInVariant = (variantIndex: number, colorIndex: number, value: string) => {
    const newColors = [...formData.colors]
    newColors[variantIndex].colors[colorIndex] = value
    setFormData({ ...formData, colors: newColors })
  }

  const removeColorFromVariant = (variantIndex: number, colorIndex: number) => {
    const newColors = [...formData.colors]
    if (newColors[variantIndex].colors.length > 1) {
      newColors[variantIndex].colors = newColors[variantIndex].colors.filter((_, i) => i !== colorIndex)
      setFormData({ ...formData, colors: newColors })
    }
  }

  const removeColor = (index: number) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((_, i) => i !== index),
    })
  }

  // Stock handlers
  const updateStockItem = (index: number, field: keyof StockItemData, value: any) => {
    const newStockItems = [...formData.stockItems]
    newStockItems[index] = { ...newStockItems[index], [field]: value }
    setFormData({ ...formData, stockItems: newStockItems })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Informação Básica</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
              placeholder="Ex: Camisola Riscas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Slug (URL amigável)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
              placeholder="camisola-riscas (gerado automaticamente se vazio)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
              placeholder="Descrição detalhada do produto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Categoria *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativo</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="featured" className="ml-2 text-sm font-medium text-black">
              Produto em destaque
            </label>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Preços</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Preço Base *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-black">€</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Preço de Comparação
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-black">€</span>
              <input
                type="number"
                step="0.01"
                value={formData.comparePrice}
                onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Imagens</h2>
          <Button type="button" onClick={addImage} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Imagem
          </Button>
        </div>

        <div className="space-y-3">
          {formData.images.map((image, index) => (
            <div key={index} className="flex gap-3 items-start p-3 border rounded-md">
              <div className="flex-1">
                <input
                  type="url"
                  required
                  value={image.url}
                  onChange={(e) => updateImage(index, 'url', e.target.value)}
                  className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
                  placeholder="URL da imagem"
                />
                <input
                  type="text"
                  value={image.alt}
                  onChange={(e) => updateImage(index, 'alt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black/50"
                  placeholder="Texto alternativo"
                />
              </div>
              {image.url && (
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {formData.images.length === 0 && (
          <p className="text-black/60 text-center py-4">
            Nenhuma imagem adicionada.
          </p>
        )}
      </div>

      {/* Sizes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Tamanhos</h2>
          <Button type="button" onClick={addSize} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Tamanho
          </Button>
        </div>

        <div className="space-y-4">
          {formData.sizes.map((size, index) => (
            <div key={index} className="p-4 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={size.label}
                    onChange={(e) => updateSize(index, 'label', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Médio"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Valor *
                  </label>
                  <input
                    type="text"
                    required
                    value={size.value}
                    onChange={(e) => updateSize(index, 'value', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: M"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">SKU</label>
                  <input
                    type="text"
                    value={size.sku}
                    onChange={(e) => updateSize(index, 'sku', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU-M"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Preço Extra (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={size.priceExtra}
                    onChange={(e) => updateSize(index, 'priceExtra', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        {formData.sizes.length === 0 && (
          <p className="text-black/60 text-center py-4">
            Adicione pelo menos um tamanho.
          </p>
        )}
      </div>

      {/* Colors */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Cores</h2>
          <Button type="button" onClick={addColor} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Adicionar Cor
          </Button>
        </div>

        <div className="space-y-4">
          {formData.colors.map((color, variantIndex) => (
            <div key={variantIndex} className="p-4 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={color.label}
                    onChange={(e) => updateColor(variantIndex, 'label', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Azul e Branco"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">SKU</label>
                  <input
                    type="text"
                    value={color.sku}
                    onChange={(e) => updateColor(variantIndex, 'sku', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU-BLUE"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Preço Extra (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={color.priceExtra}
                    onChange={(e) => updateColor(variantIndex, 'priceExtra', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  Cores (hex) *
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {color.colors.map((hex, colorIndex) => (
                    <div key={colorIndex} className="flex items-center gap-1">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => updateColorInVariant(variantIndex, colorIndex, e.target.value)}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={hex}
                        onChange={(e) => updateColorInVariant(variantIndex, colorIndex, e.target.value)}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {color.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColorFromVariant(variantIndex, colorIndex)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addColorToVariant(variantIndex)}
                    className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded"
                  >
                    + Adicionar cor
                  </button>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeColor(variantIndex)}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        {formData.colors.length === 0 && (
          <p className="text-black/60 text-center py-4">
            Adicione pelo menos uma cor.
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Stock</h2>
          <Button
            type="button"
            onClick={generateStockItems}
            size="sm"
            disabled={formData.sizes.length === 0 || formData.colors.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Gerar Combinações
          </Button>
        </div>

        {formData.sizes.length === 0 || formData.colors.length === 0 ? (
          <p className="text-black/60 text-center py-4">
            Adicione tamanhos e cores primeiro para poder definir o stock.
          </p>
        ) : formData.stockItems.length === 0 ? (
          <p className="text-black/60 text-center py-4">
            Clique em "Gerar Combinações" para criar os itens de stock.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-black font-medium">Tamanho</th>
                  <th className="text-left py-2 px-2 text-black font-medium">Cor</th>
                  <th className="text-left py-2 px-2 text-black font-medium">Quantidade</th>
                  <th className="text-left py-2 px-2 text-black font-medium">SKU</th>
                </tr>
              </thead>
              <tbody>
                {formData.stockItems.map((item, index) => {
                  const sizeLabel = formData.sizes.find(s => s.value === item.sizeValue)?.label || item.sizeValue
                  const colorLabel = formData.colors.find(c => c.colors.join(',') === item.colorValue)?.label || item.colorValue
                  const colorHexes = item.colorValue.split(',')

                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-2 text-black">{sizeLabel}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {colorHexes.map((hex, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          <span className="text-black">{colorLabel}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateStockItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) => updateStockItem(index, 'sku', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="SKU"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {productId ? 'Atualizar Produto' : 'Criar Produto'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/produtos')}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
