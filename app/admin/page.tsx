'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Loading from '../components/ui/Loading'

interface DashboardData {
  stats: {
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  topProducts?: any[]
  revenueByDay?: any[]
  alerts?: any
  system?: any
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
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
        const dashboardData = await response.json()
        setData(dashboardData)
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

  if (!data) return null

  const statCards = [
    {
      title: 'Receita Total',
      value: `€${(data.stats.totalRevenue || 0).toFixed(2)}`,
      icon: '💰',
      color: 'bg-success/10 text-success',
    },
    {
      title: 'Encomendas',
      value: (data.stats.totalOrders || 0).toString(),
      icon: '📦',
      color: 'bg-malmequer-gold/10 text-malmequer-amber',
    },
    {
      title: 'Produtos',
      value: (data.stats.totalProducts || 0).toString(),
      icon: '🏷️',
      color: 'bg-ink/10 text-ink',
    },
    {
      title: 'Utilizadores',
      value: (data.stats.totalCustomers || 0).toString(),
      icon: '👥',
      color: 'bg-warning/10 text-warning',
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
    <div className="min-h-screen bg-snow">
      {/* Header */}
      <header className="bg-white border-b border-cloud">
        <div className="container-malmequer py-4">
          <div className="flex justify-between items-center">
            <h1 className="font-display text-2xl text-ink">Painel de Administração</h1>
            <Link href="/" className="text-malmequer-gold hover:text-malmequer-amber transition-colors duration-200">
              ← Voltar à loja
            </Link>
          </div>
        </div>
      </header>

      <main className="container-malmequer py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.title} className="bg-white border border-cloud p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{card.icon}</span>
                <span className={`px-3 py-1 text-xs font-medium ${card.color}`}>
                  Hoje
                </span>
              </div>
              <h3 className="text-stone text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-ink">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-cloud p-6 mb-8">
          <h2 className="text-lg font-semibold text-ink mb-4">Gestão Rápida</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-4 border border-cloud hover:bg-snow hover:border-malmequer-gold transition-colors duration-200"
              >
                <span className="text-3xl mb-2">{item.icon}</span>
                <span className="text-sm font-medium text-center text-ink">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white border border-cloud p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-ink">Encomendas Recentes</h2>
              <Link href="/admin/encomendas" className="text-malmequer-gold hover:text-malmequer-amber text-sm transition-colors duration-200">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-3">
              {data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex justify-between items-center py-2 border-b border-cloud">
                  <div>
                    <p className="font-medium text-ink">#{order.orderNumber}</p>
                    <p className="text-sm text-mist">
                      {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ink">€{order.totalAmount.toFixed(2)}</p>
                    <span className="text-xs bg-malmequer-gold/10 text-malmequer-amber px-2 py-1">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-cloud p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-ink">Produtos Mais Vendidos</h2>
              <Link href="/admin/produtos" className="text-malmequer-gold hover:text-malmequer-amber text-sm transition-colors duration-200">
                Ver todos →
              </Link>
            </div>
            {!data.topProducts || data.topProducts.length === 0 ? (
              <p className="text-mist text-center py-8">Sem dados disponíveis</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.slice(0, 5).map((item: any) => (
                  <div
                    key={item.productId}
                    className="flex justify-between items-center py-2 border-b border-cloud"
                  >
                    <p className="font-medium text-ink">{item.product?.name || 'Produto'}</p>
                    <span className="text-xs bg-success/10 text-success px-2 py-1">
                      Vendidos: {item._sum?.quantity || 0}
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
