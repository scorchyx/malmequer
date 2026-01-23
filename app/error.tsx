'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center px-4 py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Algo correu mal
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Pedimos desculpa pelo incómodo. Ocorreu um erro inesperado.
            Por favor, tente novamente ou volte à página inicial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => reset()}
              className="inline-block px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition"
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              className="inline-block px-8 py-3 border border-black text-black font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Voltar à página inicial
            </Link>
          </div>
          {error.digest && (
            <p className="text-gray-400 text-sm mt-8">
              Código de erro: {error.digest}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
