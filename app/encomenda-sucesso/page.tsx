'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Button from '../components/ui/Button'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 py-12">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Encomenda confirmada!
              </h1>
              <p className="text-gray-600">
                Obrigado pela sua compra. A sua encomenda foi processada com sucesso.
              </p>
            </div>

            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Número da encomenda:</p>
                <p className="text-2xl font-bold text-gray-900">{orderId}</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Enviámos um email de confirmação com os detalhes da sua encomenda.
              </p>
              <p className="text-sm text-gray-600">
                Pode acompanhar o estado da sua encomenda na área de cliente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/encomendas">
                <Button>Ver as minhas encomendas</Button>
              </Link>
              <Link href="/ver-tudo">
                <Button variant="outline">Continuar a comprar</Button>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 mt-6 text-left">
              <h3 className="font-semibold mb-3">O que acontece agora?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Processamento</p>
                    <p>Estamos a preparar a sua encomenda</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Envio</p>
                    <p>Receberá um email quando a encomenda for enviada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Entrega</p>
                    <p>A encomenda será entregue no prazo estimado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
