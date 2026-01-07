import RatingStars from './RatingStars'

interface RatingSummaryProps {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export default function RatingSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
}: RatingSummaryProps) {
  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0
    return Math.round((count / totalReviews) * 100)
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Classificação de Clientes</h3>

      <div className="flex items-center gap-6 mb-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <RatingStars rating={averageRating} size="md" />
          <p className="text-sm text-gray-600 mt-2">
            {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600 w-12">{stars} estrelas</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${getPercentage(ratingDistribution[stars as keyof typeof ratingDistribution])}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {ratingDistribution[stars as keyof typeof ratingDistribution]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Notice */}
      <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
        <strong>✓</strong> Apenas clientes verificados podem deixar avaliações
      </div>
    </div>
  )
}
