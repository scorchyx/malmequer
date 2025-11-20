import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

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

export default function Footer() {
  return (
    <footer className="bg-white text-gray-900">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-4">Malmequer</h3>
            <p className="text-sm text-gray-600 mb-4">
              A sua loja online de confiança para produtos de qualidade com entregas rápidas e seguras em todo o país.
            </p>
            <div className="flex gap-3">
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
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ver-tudo" className="hover:text-gray-900 transition">
                  Ver tudo
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-gray-900 transition">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gray-900 transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-900 transition">
                  Contactos
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-4">Apoio ao Cliente</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-gray-900 transition">
                  Centro de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-gray-900 transition">
                  Envios e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900 transition">
                  Termos e Condições
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900 transition">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gray-900 transition">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <a href="tel:+351123456789" className="hover:text-gray-900 transition">
                  +351 123 456 789
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-600 flex-shrink-0" />
                <a href="mailto:info@malmequer.pt" className="hover:text-gray-900 transition">
                  info@malmequer.pt
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-gray-900 font-bold mb-1">Subscreva a nossa newsletter</h3>
              <p className="text-sm text-gray-600">Receba as últimas novidades e ofertas exclusivas</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="O seu email"
                className="flex-1 md:w-64 px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400"
              />
              <button className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition">
                Subscrever
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2024 Malmequer. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-gray-700 transition">
                Termos
              </Link>
              <Link href="/privacy" className="hover:text-gray-700 transition">
                Privacidade
              </Link>
              <Link href="/cookies" className="hover:text-gray-700 transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
