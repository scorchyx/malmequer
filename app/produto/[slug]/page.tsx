import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/app/components/layout/Header'
import Footer from '@/app/components/layout/Footer'
import ProductOptions from '@/app/components/products/ProductOptions'
import { prisma } from '@/lib/prisma'
import { ChevronRight } from 'lucide-react'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await prisma.product.findUnique({
    where: {
      slug: params.slug,
      status: 'ACTIVE',
    },
    include: {
      images: {
        orderBy: {
          order: 'asc',
        },
      },
      category: true,
      variants: {
        orderBy: {
          position: 'asc',
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-gray-900">
                Início
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/ver-tudo" className="hover:text-gray-900">
                Ver tudo
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/categories/${product.category.slug}`} className="hover:text-gray-900">
                {product.category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900">{product.name}</span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {product.images.length > 0 ? (
                <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
                  <Image
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-white rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Sem imagem</p>
                </div>
              )}

              {/* Thumbnail images if multiple */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.slice(1).map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square bg-white rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} - ${index + 2}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg p-6">
              <div className="mb-6">
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {product.category.name}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">
                  {product.name}
                </h1>
              </div>

              {product.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Descrição
                  </h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              <ProductOptions
                variants={product.variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  value: v.value,
                  price: v.price ? Number(v.price) : null,
                  inventory: v.inventory,
                }))}
                basePrice={Number(product.price)}
                baseInventory={1}
              />

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Informações do produto
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Categoria:</dt>
                    <dd className="text-gray-900">{product.category.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Disponibilidade:</dt>
                    <dd className="text-green-600">Em stock</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
