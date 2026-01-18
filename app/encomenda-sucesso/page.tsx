'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')

  return (
    <div className="max-w-2xl mx-auto px-4 text-center">
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                Encomenda confirmada!
              </h1>
              <p className="text-black">
                Obrigado pela sua compra. A sua encomenda foi processada com sucesso.
              </p>
            </div>

            {orderNumber && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-black mb-1">Número da encomenda:</p>
                <p className="text-2xl font-bold text-black">{orderNumber}</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-black">
                Enviámos um email de confirmação com os detalhes da sua encomenda e informações de envio.
              </p>
              <p className="text-sm text-black">
                Pode acompanhar o estado da sua encomenda e ver as informações de envio na área de cliente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {orderNumber && (
                <Link href={`/encomendas/${orderNumber}`}>
                  <Button>Ver detalhes da encomenda</Button>
                </Link>
              )}
              <Link href="/ver-tudo">
                <Button variant="outline">Continuar a comprar</Button>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 mt-6 text-left">
              <h3 className="font-semibold text-black mb-3">O que acontece agora?</h3>
              <div className="space-y-3 text-sm text-black">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Processamento</p>
                    <p className="text-black">Estamos a preparar a sua encomenda</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Envio</p>
                    <p className="text-black">Receberá um email quando a encomenda for enviada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-black">Entrega</p>
                    <p className="text-black">A encomenda será entregue no prazo estimado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12">
        <Suspense fallback={
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-pulse space-y-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          </div>
        }>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
