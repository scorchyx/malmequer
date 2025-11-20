import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ProductGrid from '../components/products/ProductGrid'
import { prisma } from '@/lib/prisma'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      images: {
        orderBy: {
          order: 'asc',
        },
        take: 1,
      },
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Ver tudo</h1>
            <p className="text-gray-600 mt-2">
              Explore a nossa seleção de produtos de qualidade
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-12">
          <ProductGrid products={products} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
