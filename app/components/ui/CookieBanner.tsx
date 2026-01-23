'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'malmequer-cookie-consent'

type ConsentType = 'all' | 'essential' | null

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all')
    setShowBanner(false)
  }

  const handleAcceptEssential = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl border border-cloud">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-ink mb-2">
                Este website utiliza cookies
              </h3>
              <p className="text-stone text-sm leading-relaxed">
                Utilizamos cookies para melhorar a sua experiência, personalizar conteúdo e analisar o tráfego.
                Pode escolher aceitar todos os cookies ou apenas os essenciais para o funcionamento do site.
              </p>

              {showDetails && (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-ink mb-1">Cookies Essenciais</h4>
                    <p className="text-stone text-xs">
                      Necessários para o funcionamento básico do site (sessão, carrinho, autenticação).
                      Não podem ser desativados.
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-ink mb-1">Cookies de Análise</h4>
                    <p className="text-stone text-xs">
                      Ajudam-nos a entender como utiliza o site para podermos melhorá-lo.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-malmequer-gold text-sm mt-2 hover:underline"
              >
                {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>

              <p className="text-stone text-xs mt-2">
                Saiba mais na nossa{' '}
                <Link href="/cookies" className="text-malmequer-gold hover:underline">
                  Política de Cookies
                </Link>
                .
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 md:flex-col lg:flex-row">
              <button
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm font-medium text-ink border border-ink rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
              >
                Apenas Essenciais
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-ink rounded-lg hover:bg-gray-800 transition whitespace-nowrap"
              >
                Aceitar Todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para verificar consentimento em outros componentes
export function useCookieConsent(): ConsentType {
  const [consent, setConsent] = useState<ConsentType>(null)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored === 'all' || stored === 'essential') {
      setConsent(stored)
    }
  }, [])

  return consent
}
