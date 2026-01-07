'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ShoppingCart, User, Search, Menu, Heart, Package, Settings, LogOut, LogIn, Shield } from 'lucide-react'
import { useState } from 'react'
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

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* Main Header - Logo Centered with Icons on Sides */}
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Social Media Icons - Top Left */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/malmequer.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/malmequer_insta/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@malmequer_tiktok"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Logo Centered */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="text-5xl text-gray-900 font-[family-name:var(--font-imperial-script)]">
              Malmequer
            </div>
          </Link>

          {/* Desktop Icons - Top Right */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => router.push('/pesquisa')}
              className="p-2 text-gray-700 hover:text-gray-900"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link href="/favoritos" className="p-2 text-gray-700 hover:text-gray-900">
              <Heart className="h-5 w-5" />
            </Link>

            {/* Account - Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 text-gray-700 hover:text-gray-900"
              >
                <User className="h-5 w-5" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {session ? (
                    <>
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/perfil"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Meu Perfil
                      </Link>
                      <Link
                        href="/encomendas"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4" />
                        Minhas Encomendas
                      </Link>
                      <Link
                        href="/favoritos"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4" />
                        Favoritos
                      </Link>
                      <Link
                        href="/definicoes"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Definições
                      </Link>
                      {(session.user as any)?.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t"
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
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t"
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LogIn className="h-4 w-4" />
                        Entrar
                      </Link>
                      <Link
                        href="/registar"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Criar Conta
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="p-2 text-gray-700 hover:text-gray-900 relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gray-900 text-[10px] font-bold text-white flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div>
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-center">
            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/ver-tudo" className="text-gray-700 hover:text-gray-900 font-medium uppercase text-sm">
                Ver tudo
              </Link>
              <Link href="/pesquisa" className="text-gray-700 hover:text-gray-900 font-medium uppercase text-sm">
                Pesquisa
              </Link>
              <Link href="/favoritos" className="text-gray-700 hover:text-gray-900 font-medium uppercase text-sm">
                Favoritos
              </Link>
              {session && (
                <Link href="/encomendas" className="text-gray-700 hover:text-gray-900 font-medium uppercase text-sm">
                  Encomendas
                </Link>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {session && (
              <div className="pb-3 mb-3 border-b">
                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.email}</p>
              </div>
            )}
            <Link
              href="/ver-tudo"
              className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ver tudo
            </Link>
            <Link
              href="/pesquisa"
              className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pesquisa
            </Link>
            <Link
              href="/favoritos"
              className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Favoritos
            </Link>
            {session ? (
              <>
                <Link
                  href="/perfil"
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Meu Perfil
                </Link>
                <Link
                  href="/encomendas"
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Minhas Encomendas
                </Link>
                <Link
                  href="/definicoes"
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Definições
                </Link>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-blue-600 hover:text-blue-700 font-medium py-2 text-sm border-t pt-3"
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
                  className="text-red-600 hover:text-red-700 font-medium py-2 text-sm text-left border-t pt-3"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm border-t pt-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/registar"
                  className="text-gray-700 hover:text-gray-900 font-medium py-2 text-sm"
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
