import Link from 'next/link'
import { Heart, Sparkles, ShoppingBag } from 'lucide-react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HeroBanner from './components/home/HeroBanner'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-pink-50/30">
      <Header />

      <main className="flex-1">
        <HeroBanner
          imageUrl="https://res.cloudinary.com/dt1d75zg0/image/upload/v1763593356/WhatsApp_Image_2025-11-19_at_23.01.52_psvn2m.jpg"
        />

        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6 rounded-2xl hover:bg-pink-50/50 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Qualidade Premium</h3>
                <p className="text-gray-600">Materiais cuidadosamente selecionados para o seu conforto</p>
              </div>

              <div className="text-center p-6 rounded-2xl hover:bg-pink-50/50 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Feito com Amor</h3>
                <p className="text-gray-600">Cada peça é criada com dedicação e atenção aos detalhes</p>
              </div>

              <div className="text-center p-6 rounded-2xl hover:bg-pink-50/50 transition-colors">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Entrega Rápida</h3>
                <p className="text-gray-600">Receba as suas encomendas de forma rápida e segura</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-500">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Descubra o Seu Estilo Único
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Explore a nossa coleção exclusiva e encontre peças que refletem a sua personalidade
            </p>
            <Link
              href="/ver-tudo"
              className="inline-block px-10 py-4 bg-white text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-all transform hover:scale-105 shadow-xl"
            >
              Ver Todas as Peças
            </Link>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              Compre por Categoria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {['Vestidos', 'Tops', 'Acessórios', 'Novidades'].map((category, index) => (
                <Link
                  key={category}
                  href="/ver-tudo"
                  className="group relative h-64 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    index === 0 ? 'from-pink-400 to-pink-600' :
                    index === 1 ? 'from-purple-400 to-purple-600' :
                    index === 2 ? 'from-rose-400 to-rose-600' :
                    'from-fuchsia-400 to-fuchsia-600'
                  }`} />
                  <div className="relative h-full flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white">{category}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Fique por Dentro</h2>
            <p className="text-gray-600 mb-8">
              Subscreva a nossa newsletter e receba novidades, promoções exclusivas e dicas de estilo
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="O seu email"
                className="flex-1 px-6 py-3 rounded-full border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-black"
              />
              <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg">
                Subscrever
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
