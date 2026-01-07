'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import RatingStars from './RatingStars'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useToast } from '../ui/Toast'

interface ReviewFormProps {
  productId: string
  onReviewSubmitted?: () => void
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      showToast('Faça login para deixar uma avaliação', 'error')
      return
    }

    if (formData.rating === 0) {
      showToast('Por favor, selecione uma classificação', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: formData.rating,
          title: formData.title,
          content: formData.content,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar avaliação')
      }

      showToast('Avaliação enviada com sucesso!', 'success')
      setFormData({ rating: 0, title: '', content: '' })
      onReviewSubmitted?.()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">Faça login para deixar uma avaliação</p>
        <Button onClick={() => (window.location.href = '/login')}>Entrar</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="text-lg font-semibold">Escrever uma avaliação</h3>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Classificação <span className="text-red-500">*</span>
        </label>
        <RatingStars
          rating={formData.rating}
          interactive
          size="lg"
          onRatingChange={(rating) => setFormData({ ...formData, rating })}
        />
      </div>

      {/* Title */}
      <Input
        label="Título (opcional)"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Resuma a sua experiência"
        maxLength={100}
      />

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Comentário (opcional)
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Conte-nos mais sobre a sua experiência com este produto"
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black placeholder:text-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.content.length}/1000 caracteres
        </p>
      </div>

      <Button type="submit" isLoading={isLoading}>
        Publicar avaliação
      </Button>
    </form>
  )
}
