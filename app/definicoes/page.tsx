'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState({
    orderConfirmations: true,
    orderUpdates: true,
    stockAlerts: false,
    promotionalEmails: false,
    accountUpdates: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    loadSettings()
  }, [status, router])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/notification-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Erro ao guardar definições')

      showToast('Definições guardadas com sucesso!', 'success')
    } catch (error) {
      showToast('Erro ao guardar definições', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem a certeza que deseja eliminar a sua conta? Esta ação é irreversível.')) {
      return
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao eliminar conta')

      showToast('Conta eliminada com sucesso', 'success')
      router.push('/')
    } catch (error) {
      showToast('Erro ao eliminar conta', 'error')
    }
  }

  if (status === 'loading') {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Definições</h1>

          <div className="space-y-6">
            {/* Notificações */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Preferências de Email</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Confirmações de encomenda</div>
                    <div className="text-sm text-gray-500">Receber emails quando fizer uma encomenda</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.orderConfirmations}
                    onChange={(e) => setSettings({ ...settings, orderConfirmations: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Atualizações de encomenda</div>
                    <div className="text-sm text-gray-500">Estado de envio e entrega</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.orderUpdates}
                    onChange={(e) => setSettings({ ...settings, orderUpdates: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Alertas de stock</div>
                    <div className="text-sm text-gray-500">Notificações quando produtos voltarem ao stock</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.stockAlerts}
                    onChange={(e) => setSettings({ ...settings, stockAlerts: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Emails promocionais</div>
                    <div className="text-sm text-gray-500">Ofertas, promoções e novidades</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.promotionalEmails}
                    onChange={(e) => setSettings({ ...settings, promotionalEmails: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Atualizações de conta</div>
                    <div className="text-sm text-gray-500">Alterações de segurança e conta</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.accountUpdates}
                    onChange={(e) => setSettings({ ...settings, accountUpdates: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div className="mt-6">
                <Button onClick={handleSaveSettings} isLoading={isLoading}>
                  Guardar preferências
                </Button>
              </div>
            </div>

            {/* Privacidade */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Privacidade e Dados</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Exportar os meus dados</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Descarregar uma cópia de todos os seus dados pessoais
                  </p>
                  <Button variant="outline" size="sm">
                    Solicitar exportação
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2 text-red-600">Eliminar conta</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Eliminar permanentemente a sua conta e todos os dados associados. Esta ação não pode ser revertida.
                  </p>
                  <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                    Eliminar a minha conta
                  </Button>
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
