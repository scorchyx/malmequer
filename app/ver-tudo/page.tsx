import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ProductGrid from '../components/products/ProductGrid'
import { prisma } from '@/lib/prisma'

export default async function ProductsPage() {
  const productsRaw = await prisma.product.findMany({
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

  // Convert Decimal to number for client components
  const products = productsRaw.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price.toNumber(),
    images: product.images,
  }))

  return (
    <div className="min-h-screen flex flex-col bg-snow">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-white border-b border-cloud">
          <div className="container-malmequer py-8">
            <h1 className="font-display text-3xl text-ink">Ver tudo</h1>
            <p className="text-stone mt-2">
              Explore a nossa seleção de produtos de qualidade
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container-malmequer py-12">
          <ProductGrid products={products} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
