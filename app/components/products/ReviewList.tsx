'use client'

import { useState } from 'react'
import RatingStars from './RatingStars'
import Image from 'next/image'

interface Review {
  id: string
  rating: number
  title?: string
  content?: string
  verified: boolean
  createdAt: string
  user: {
    name: string
    image?: string
  }
  images?: {
    url: string
    alt?: string
  }[]
  votes?: {
    helpful: number
    notHelpful: number
  }
}

interface ReviewListProps {
  reviews: Review[]
  productId: string
}

export default function ReviewList({ reviews, productId }: ReviewListProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent')

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sortBy === 'helpful') {
      return (b.votes?.helpful || 0) - (a.votes?.helpful || 0)
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating
    }
    return 0
  })

  const handleVote = async (reviewId: string, helpful: boolean) => {
    try {
      await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      })
      // Reload reviews
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Ainda não há avaliações para este produto</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort Controls */}
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-semibold">{reviews.length} Avaliações</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded text-black"
        >
          <option value="recent">Mais recentes</option>
          <option value="helpful">Mais úteis</option>
          <option value="rating">Melhor classificação</option>
        </select>
      </div>

      {/* Reviews */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <div key={review.id} className="border-b pb-6 last:border-b-0">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                {review.user.image ? (
                  <Image
                    src={review.user.image}
                    alt={review.user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {review.user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1">
                {/* Header */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{review.user.name}</span>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Compra verificada
                      </span>
                    )}
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                </div>

                {/* Content */}
                {review.title && (
                  <h4 className="font-semibold text-black mb-2">{review.title}</h4>
                )}
                {review.content && <p className="text-gray-700 mb-3">{review.content}</p>}

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.images.map((image, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <Image
                          src={image.url}
                          alt={image.alt || `Review image ${index + 1}`}
                          fill
                          className="object-cover rounded"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {new Date(review.createdAt).toLocaleDateString('pt-PT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>

                  {/* Helpful Votes */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(review.id, true)}
                      className="flex items-center gap-1 hover:text-green-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span>Útil ({review.votes?.helpful || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
