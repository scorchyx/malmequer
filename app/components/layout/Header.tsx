'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingCart, User, Search, Menu, Heart, Package, Settings, LogOut, LogIn, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import CartDrawer from '../cart/CartDrawer'

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

export default function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  // Fetch cart count
  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCartCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error)
    }
  }

  useEffect(() => {
    fetchCartCount()

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-cloud">
      {/* Main Header */}
      <div className="container-malmequer">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Left Side: Social Media (Desktop) / Menu (Mobile) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-ink hover:text-malmequer-gold touch-manipulation -ml-2 transition-colors duration-200"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Social Media Icons - Desktop Only */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <a
                href="https://www.facebook.com/malmequer.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-ink text-white flex items-center justify-center hover:bg-stone transition-colors duration-200"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/malmequer_insta/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-ink text-white flex items-center justify-center hover:bg-stone transition-colors duration-200"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@malmequer_tiktok"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-ink text-white flex items-center justify-center hover:bg-stone transition-colors duration-200"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex items-center justify-center flex-shrink-0">
            <div className="text-3xl sm:text-4xl lg:text-5xl text-ink font-display whitespace-nowrap">
              Malmequer
            </div>
          </Link>

          {/* Right Side: Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0 min-w-0">
            {/* Search */}
            <button
              onClick={() => router.push('/pesquisa')}
              className="p-2 text-ink hover:text-malmequer-gold touch-manipulation transition-colors duration-200"
              aria-label="Pesquisar"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Wishlist */}
            <Link
              href="/favoritos"
              className="p-2 text-ink hover:text-malmequer-gold touch-manipulation transition-colors duration-200"
              aria-label="Favoritos"
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>

            {/* User Account */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 text-ink hover:text-malmequer-gold touch-manipulation transition-colors duration-200"
                aria-label="Conta"
              >
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-cloud py-2 z-50">
                    {session ? (
                      <>
                        <div className="px-4 py-2 border-b border-cloud">
                          <p className="text-sm font-medium text-ink truncate">{session.user?.name}</p>
                          <p className="text-xs text-mist truncate">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/perfil"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone hover:bg-snow hover:text-ink transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Meu Perfil
                        </Link>
                        <Link
                          href="/encomendas"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone hover:bg-snow hover:text-ink transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Package className="h-4 w-4" />
                          Minhas Encomendas
                        </Link>
                        <Link
                          href="/favoritos"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone hover:bg-snow hover:text-ink transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4" />
                          Favoritos
                        </Link>
                        <Link
                          href="/definicoes"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone hover:bg-snow hover:text-ink transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Definições
                        </Link>
                        {(session.user as any)?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-malmequer-gold hover:bg-snow border-t border-cloud transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4" />
                            Painel Admin
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-snow w-full border-t border-cloud transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sair
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone hover:bg-snow hover:text-ink transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LogIn className="h-4 w-4" />
                          Entrar
                        </Link>
                        <Link
                          href="/registar"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-stone hover:bg-snow hover:text-ink transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Criar Conta
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="p-2 text-ink hover:text-malmequer-gold relative touch-manipulation transition-colors duration-200"
              aria-label="Carrinho"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-malmequer-gold text-[10px] font-bold text-ink flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="hidden md:block border-t border-cloud">
        <div className="container-malmequer">
          <nav className="flex items-center justify-center gap-8 h-12">
            <Link href="/ver-tudo" className="text-stone hover:text-malmequer-gold font-medium text-xs uppercase tracking-wider transition-colors duration-200">
              Ver Tudo
            </Link>
            <Link href="/pesquisa" className="text-stone hover:text-malmequer-gold font-medium text-xs uppercase tracking-wider transition-colors duration-200">
              Pesquisa
            </Link>
            <Link href="/favoritos" className="text-stone hover:text-malmequer-gold font-medium text-xs uppercase tracking-wider transition-colors duration-200">
              Favoritos
            </Link>
            {session && (
              <Link href="/encomendas" className="text-stone hover:text-malmequer-gold font-medium text-xs uppercase tracking-wider transition-colors duration-200">
                Encomendas
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-cloud md:hidden bg-white">
          <nav className="container-malmequer py-4 flex flex-col gap-2">
            {session && (
              <div className="pb-3 mb-3 border-b border-cloud">
                <p className="text-sm font-medium text-ink">{session.user?.name}</p>
                <p className="text-xs text-mist">{session.user?.email}</p>
              </div>
            )}
            <Link
              href="/ver-tudo"
              className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ver tudo
            </Link>
            <Link
              href="/pesquisa"
              className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pesquisa
            </Link>
            <Link
              href="/favoritos"
              className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Favoritos
            </Link>
            {session ? (
              <>
                <Link
                  href="/perfil"
                  className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Meu Perfil
                </Link>
                <Link
                  href="/encomendas"
                  className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Minhas Encomendas
                </Link>
                <Link
                  href="/definicoes"
                  className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Definições
                </Link>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-malmequer-gold hover:text-malmequer-amber font-medium py-2 text-sm border-t border-cloud pt-3 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Painel Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="text-error hover:opacity-80 font-medium py-2 text-sm text-left border-t border-cloud pt-3 transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-stone hover:text-ink font-medium py-2 text-sm border-t border-cloud pt-3 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/registar"
                  className="text-stone hover:text-ink font-medium py-2 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Criar Conta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}
