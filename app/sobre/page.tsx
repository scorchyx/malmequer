import { Metadata } from 'next'
import Link from 'next/link'
import Footer from '../components/layout/Footer'
import Header from '../components/layout/Header'

export const metadata: Metadata = {
  title: 'Sobre Nós | Malmequer',
  description: 'Conheça a história da Malmequer. A nossa missão é oferecer moda de qualidade com um toque português.',
}

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="bg-cream py-16 md:py-24">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-4xl md:text-5xl text-ink mb-6">A Nossa História</h1>
              <p className="text-stone text-lg leading-relaxed">
                A Malmequer nasceu do desejo de criar uma marca que celebra a elegância portuguesa
                com um toque contemporâneo. Acreditamos que a moda deve ser acessível, sustentável e
                atemporal.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container-malmequer">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl text-ink mb-6">A Nossa Missão</h2>
                <p className="text-stone leading-relaxed mb-4">
                  Na Malmequer, acreditamos que cada peça de roupa conta uma história. A nossa missão
                  é criar peças que combinem qualidade superior, design intemporal e preços justos.
                </p>
                <p className="text-stone leading-relaxed mb-4">
                  Trabalhamos com fornecedores cuidadosamente selecionados que partilham os nossos
                  valores de qualidade e responsabilidade. Cada produto passa por um rigoroso controlo
                  de qualidade antes de chegar às suas mãos.
                </p>
                <p className="text-stone leading-relaxed">
                  O nosso compromisso é proporcionar-lhe uma experiência de compra excecional, desde
                  a navegação no nosso website até ao momento em que recebe a sua encomenda.
                </p>
              </div>
              <div className="bg-cream rounded-lg p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="font-display text-4xl text-malmequer-gold mb-2">+1000</p>
                    <p className="text-stone text-sm">Clientes Satisfeitos</p>
                  </div>
                  <div>
                    <p className="font-display text-4xl text-malmequer-gold mb-2">100%</p>
                    <p className="text-stone text-sm">Qualidade Garantida</p>
                  </div>
                  <div>
                    <p className="font-display text-4xl text-malmequer-gold mb-2">48h</p>
                    <p className="text-stone text-sm">Envio Rápido</p>
                  </div>
                  <div>
                    <p className="font-display text-4xl text-malmequer-gold mb-2">14</p>
                    <p className="text-stone text-sm">Dias para Devolução</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-gray-50 py-16">
          <div className="container-malmequer">
            <h2 className="font-display text-3xl text-ink text-center mb-12">Os Nossos Valores</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-malmequer-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink mb-3">Qualidade</h3>
                <p className="text-stone text-sm leading-relaxed">
                  Selecionamos cuidadosamente cada produto para garantir a melhor qualidade.
                  Acreditamos que peças bem feitas duram mais e são mais sustentáveis.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-malmequer-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink mb-3">Cuidado</h3>
                <p className="text-stone text-sm leading-relaxed">
                  Cada encomenda é preparada com carinho e atenção aos detalhes.
                  O nosso objetivo é que se sinta especial em cada compra.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-malmequer-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl text-ink mb-3">Comunidade</h3>
                <p className="text-stone text-sm leading-relaxed">
                  Valorizamos cada cliente e construímos relações duradouras.
                  A nossa comunidade é o coração da Malmequer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Promise Section */}
        <section className="py-16">
          <div className="container-malmequer">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl text-ink mb-6">O Nosso Compromisso</h2>
              <p className="text-stone leading-relaxed mb-8">
                Comprometemo-nos a oferecer-lhe a melhor experiência de compra online. Se por algum
                motivo não estiver satisfeito com a sua compra, estamos aqui para ajudar. A sua
                satisfação é a nossa prioridade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/ver-tudo"
                  className="inline-block px-8 py-3 bg-ink text-white font-medium rounded-lg hover:bg-gray-800 transition"
                >
                  Explorar Produtos
                </Link>
                <Link
                  href="/contacto"
                  className="inline-block px-8 py-3 border border-ink text-ink font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Contacte-nos
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
