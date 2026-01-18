'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'

interface Category {
  id: string
  name: string
}

interface ProductImage {
  url: string
  alt: string
}

interface ProductVariant {
  name: string
  value: string
  price?: number
  sku?: string
  inventory: number
  weight?: number
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
  variants: ProductVariant[]
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
    variants: [],
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
          variants: product.variants || [],
        })
      }
    } catch (error) {
      showToast('Erro ao carregar produto', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate slug if not provided
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
        variants: formData.variants.map((v) => ({
          name: v.name,
          value: v.value,
          price: v.price || null,
          sku: v.sku || null,
          inventory: v.inventory,
          weight: v.weight || null,
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

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { name: '', value: '', inventory: 0, sku: '', price: undefined, weight: undefined },
      ],
    })
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setFormData({ ...formData, variants: newVariants })
  }

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    })
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
              placeholder="Ex: Rosa Vermelha Premium"
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
              placeholder="rosa-vermelha-premium (gerado automaticamente se vazio)"
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
            <label className="block text-sm font-medium text-black mb-1">Preço *</label>
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
            + Adicionar Imagem
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
                className="text-red-600 hover:text-red-700 px-3 py-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {formData.images.length === 0 && (
          <p className="text-black text-center py-4">
            Nenhuma imagem adicionada. Clique em "Adicionar Imagem" para começar.
          </p>
        )}
      </div>

      {/* Variants */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Variantes</h2>
          <Button type="button" onClick={addVariant} size="sm">
            + Adicionar Variante
          </Button>
        </div>

        <div className="space-y-4">
          {formData.variants.map((variant, index) => (
            <div key={index} className="p-4 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Tamanho"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Valor *
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.value}
                    onChange={(e) => updateVariant(index, 'value', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Médio"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">SKU</label>
                  <input
                    type="text"
                    value={variant.sku || ''}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={variant.inventory}
                    onChange={(e) =>
                      updateVariant(index, 'inventory', parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Preço Extra (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variant.price || ''}
                    onChange={(e) =>
                      updateVariant(index, 'price', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={variant.weight || ''}
                    onChange={(e) =>
                      updateVariant(index, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remover variante
                </button>
              </div>
            </div>
          ))}
        </div>

        {formData.variants.length === 0 && (
          <p className="text-black text-center py-4">
            Nenhuma variante adicionada. Produtos sem variantes usam apenas o preço base.
          </p>
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
