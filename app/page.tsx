import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HeroBanner from './components/home/HeroBanner'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroBanner
          imageUrl="https://res.cloudinary.com/dt1d75zg0/image/upload/v1763593356/WhatsApp_Image_2025-11-19_at_23.01.52_psvn2m.jpg"
        />

        {/* Adiciona mais secções aqui conforme necessário */}
      </main>

      <Footer />
    </div>
  )
}
