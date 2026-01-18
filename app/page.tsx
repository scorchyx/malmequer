import Link from 'next/link'
import { Heart, Sparkles, ShoppingBag } from 'lucide-react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HeroBanner from './components/home/HeroBanner'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-snow">
      <Header />

      <main className="flex-1">
        <HeroBanner
          imageUrl="https://res.cloudinary.com/dt1d75zg0/image/upload/v1754059915/malmequer-hero-banner-01_pyb8un.jpg"
        />

        {/* Features Section */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container-malmequer">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <div className="text-center p-5 sm:p-6 active:bg-snow sm:hover:bg-snow transition-colors duration-200">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cloud flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-malmequer-gold" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-ink">Qualidade Premium</h3>
                <p className="text-sm sm:text-base text-stone">Materiais cuidadosamente selecionados para o seu conforto</p>
              </div>

              <div className="text-center p-5 sm:p-6 active:bg-snow sm:hover:bg-snow transition-colors duration-200">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cloud flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-malmequer-gold" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-ink">Feito com Amor</h3>
                <p className="text-sm sm:text-base text-stone">Cada peça é criada com dedicação e atenção aos detalhes</p>
              </div>

              <div className="text-center p-5 sm:p-6 active:bg-snow sm:hover:bg-snow transition-colors duration-200">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-cloud flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-malmequer-gold" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-ink">Entrega Rápida</h3>
                <p className="text-sm sm:text-base text-stone">Receba as suas encomendas de forma rápida e segura</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-ink">
          <div className="container-malmequer text-center max-w-3xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-4 sm:mb-6">
              Descubra o Seu Estilo Único
            </h2>
            <p className="text-lg sm:text-xl text-white/80 mb-6 sm:mb-8">
              Explore a nossa coleção exclusiva e encontre peças que refletem a sua personalidade
            </p>
            <Link
              href="/ver-tudo"
              className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-malmequer-gold text-ink uppercase tracking-wider text-sm font-medium active:scale-95 sm:hover:bg-malmequer-amber transition-all shadow-xl touch-manipulation"
            >
              Ver Todas as Peças
            </Link>
          </div>
        </section>

        {/* Categories Preview */}
        <section className="py-16 sm:py-20 bg-snow">
          <div className="container-malmequer">
            <h2 className="font-display text-3xl sm:text-4xl text-center mb-8 sm:mb-12 text-ink">
              Compre por Categoria
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {['Vestidos', 'Parte de Cima', 'Parte de Baixo', 'Conjuntos'].map((category) => (
                <Link
                  key={category}
                  href="/ver-tudo"
                  className="group relative h-48 sm:h-64 overflow-hidden shadow-lg active:shadow-xl sm:hover:shadow-2xl transition-all touch-manipulation bg-ink"
                >
                  <div className="absolute inset-0 bg-ink group-hover:bg-stone transition-colors duration-200" />
                  <div className="relative h-full flex items-center justify-center">
                    <h3 className="text-xl sm:text-2xl font-display text-white">{category}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 sm:py-16 bg-cloud">
          <div className="container-malmequer max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl mb-3 sm:mb-4 text-ink">Fique por Dentro</h2>
            <p className="text-sm sm:text-base text-stone mb-6 sm:mb-8">
              Subscreva a nossa newsletter e receba novidades, promoções exclusivas e dicas de estilo
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="O seu email"
                className="flex-1 px-5 sm:px-6 py-3 border border-mist bg-white text-ink placeholder:text-mist focus:border-ink focus:outline-none text-base touch-manipulation transition-colors duration-200"
              />
              <button className="px-6 sm:px-8 py-3 bg-ink text-white uppercase tracking-wider text-sm font-medium active:bg-stone sm:hover:bg-stone transition-all touch-manipulation">
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
