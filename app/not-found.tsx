import Link from 'next/link'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center px-4 py-16">
          <h1 className="text-9xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Página não encontrada
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Desculpe, a página que procura não existe ou foi removida.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition"
          >
            Voltar à página inicial
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
