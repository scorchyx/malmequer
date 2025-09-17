'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Failed to load API documentation')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Malmequer E-commerce API Documentation
          </h1>
          <p className="text-gray-600 mt-1">
            Complete API reference for the Malmequer e-commerce platform
          </p>
        </div>
      </div>

      {spec && (
        <SwaggerUI
          spec={spec}
          docExpansion="tag"
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          displayOperationId={false}
          tryItOutEnabled={true}
          requestInterceptor={(request) => {
            // Add any default headers here
            return request
          }}
          onComplete={() => {
            console.log('Swagger UI loaded successfully')
          }}
        />
      )}
    </div>
  )
}