'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Loading from '../components/ui/Loading'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import AddressManager from '../components/profile/AddressManager'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
      })
    }
  }, [session, status, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) throw new Error('Erro ao atualizar perfil')

      showToast('Perfil atualizado com sucesso!', 'success')
    } catch (error) {
      showToast('Erro ao atualizar perfil', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('As passwords não coincidem', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) throw new Error('Erro ao alterar password')

      showToast('Password alterada com sucesso!', 'success')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      showToast('Erro ao alterar password', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <Loading fullScreen />
  }

  const tabs = [
    { id: 'profile', label: 'Perfil' },
    { id: 'security', label: 'Segurança' },
    { id: 'notifications', label: 'Notificações' },
    { id: 'addresses', label: 'Moradas' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
            <p className="mt-2 text-gray-600">Gerir as suas informações pessoais e preferências</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1 bg-white rounded-lg shadow p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow p-6">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Informações do Perfil</h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <Input
                        label="Nome completo"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                      <Button type="submit" isLoading={isLoading}>
                        Guardar alterações
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Alterar Password</h2>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                      <Input
                        label="Password atual"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <Input
                        label="Nova password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        helperText="Mínimo 8 caracteres"
                      />
                      <Input
                        label="Confirmar nova password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                      <Button type="submit" isLoading={isLoading}>
                        Alterar password
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Preferências de Notificações</h2>
                    <p className="text-gray-600 mb-4">Em desenvolvimento...</p>
                  </div>
                )}

                {activeTab === 'addresses' && <AddressManager />}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
