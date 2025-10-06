'use client'

import Link from 'next/link'
import { ShoppingCart, User, Search, Menu, Heart } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Top Bar */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="hidden md:block text-gray-600">
              Envio grátis em compras superiores a 50€
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <Link href="/help" className="text-gray-600 hover:text-gray-900">
                Ajuda
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                Contactos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-gray-900">
              Malmequer
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-gray-700 hover:text-gray-900 font-medium">
              Produtos
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-gray-900 font-medium">
              Categorias
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
              Sobre Nós
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900 font-medium">
              Blog
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Procurar produtos..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {/* Search (Mobile) */}
            <button className="lg:hidden p-2 text-gray-700 hover:text-gray-900">
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="p-2 text-gray-700 hover:text-gray-900 relative">
              <Heart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Account */}
            <Link href="/account" className="p-2 text-gray-700 hover:text-gray-900">
              <User className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="p-2 text-gray-700 hover:text-gray-900 relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gray-900 text-[10px] font-bold text-white flex items-center justify-center">
                0
              </span>
            </Link>

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
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              href="/products"
              className="text-gray-700 hover:text-gray-900 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Produtos
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-gray-900 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categorias
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-gray-900 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sobre Nós
            </Link>
            <Link
              href="/blog"
              className="text-gray-700 hover:text-gray-900 font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
