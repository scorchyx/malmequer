import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Malmequer</h3>
            <p className="text-sm text-gray-400 mb-4">
              A sua loja online de confiança para produtos de qualidade com entregas rápidas e seguras em todo o país.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition">
                  Produtos
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contactos
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Apoio ao Cliente</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-white transition">
                  Centro de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition">
                  Envios e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Termos e Condições
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <span>
                  Rua Example, 123<br />
                  1000-001 Lisboa, Portugal
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <a href="tel:+351123456789" className="hover:text-white transition">
                  +351 123 456 789
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <a href="mailto:info@malmequer.pt" className="hover:text-white transition">
                  info@malmequer.pt
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold mb-1">Subscreva a nossa newsletter</h3>
              <p className="text-sm text-gray-400">Receba as últimas novidades e ofertas exclusivas</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="O seu email"
                className="flex-1 md:w-64 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
              <button className="px-6 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition">
                Subscrever
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2024 Malmequer. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-gray-300 transition">
                Termos
              </Link>
              <Link href="/privacy" className="hover:text-gray-300 transition">
                Privacidade
              </Link>
              <Link href="/cookies" className="hover:text-gray-300 transition">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
