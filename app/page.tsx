import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HeroBanner from './components/home/HeroBanner'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroBanner
          imageUrl="https://res.cloudinary.com/dt1d75zg0/image/upload/v1754059915/malmequer-hero-banner-01_pyb8un.jpg"
          title="Descobre a Nossa Nova Coleção"
          subtitle="Produtos de qualidade com entregas rápidas em todo o país"
          ctaText="Explorar Produtos"
          ctaLink="/products"
        />

        {/* Adiciona mais secções aqui conforme necessário */}
      </main>

      <Footer />
    </div>
  )
}
