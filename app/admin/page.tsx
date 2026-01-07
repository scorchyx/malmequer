'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Loading from '../components/ui/Loading'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    inventory: number
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user && (session.user as any).role !== 'ADMIN') {
      router.push('/')
    }
    if (session?.user && (session.user as any).role === 'ADMIN') {
      loadDashboard()
    }
  }, [session, status, router])

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <Loading fullScreen />
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Receita Total',
      value: `€${stats.totalRevenue.toFixed(2)}`,
      icon: '💰',
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Encomendas',
      value: stats.totalOrders.toString(),
      icon: '📦',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Produtos',
      value: stats.totalProducts.toString(),
      icon: '🏷️',
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Utilizadores',
      value: stats.totalUsers.toString(),
      icon: '👥',
      color: 'bg-orange-100 text-orange-800',
    },
  ]

  const menuItems = [
    { title: 'Produtos', href: '/admin/produtos', icon: '🏷️' },
    { title: 'Encomendas', href: '/admin/encomendas', icon: '📦' },
    { title: 'Utilizadores', href: '/admin/utilizadores', icon: '👥' },
    { title: 'Categorias', href: '/admin/categorias', icon: '📁' },
    { title: 'Descontos', href: '/admin/descontos', icon: '🎫' },
    { title: 'Relatórios', href: '/admin/relatorios', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Painel de Administração</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← Voltar à loja
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{card.icon}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${card.color}`}>
                  Hoje
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Gestão Rápida</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-3xl mb-2">{item.icon}</span>
                <span className="text-sm font-medium text-center">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Encomendas Recentes</h2>
              <Link href="/admin/encomendas" className="text-blue-600 hover:text-blue-700 text-sm">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{order.totalAmount.toFixed(2)}</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Alertas de Stock</h2>
              <Link href="/admin/produtos" className="text-blue-600 hover:text-blue-700 text-sm">
                Ver todos →
              </Link>
            </div>
            {stats.lowStockProducts.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Sem alertas de stock</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <p className="font-medium">{product.name}</p>
                    <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      Stock: {product.inventory}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
