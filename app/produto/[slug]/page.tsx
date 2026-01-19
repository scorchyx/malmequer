import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/app/components/layout/Header'
import Footer from '@/app/components/layout/Footer'
import ProductOptions from '@/app/components/products/ProductOptions'
import { prisma } from '@/lib/prisma'
import { ChevronRight } from 'lucide-react'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: {
      slug: slug,
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
      stockItems: {
        include: {
          sizeVariant: true,
          colorVariant: true,
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Calculate total stock
  const totalStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen flex flex-col bg-snow">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-cloud">
          <div className="container-malmequer py-4">
            <div className="flex items-center gap-2 text-sm text-stone">
              <Link href="/" className="hover:text-malmequer-gold transition-colors duration-200">
                Início
              </Link>
              <ChevronRight className="h-4 w-4 text-mist" />
              <Link href="/ver-tudo" className="hover:text-malmequer-gold transition-colors duration-200">
                Ver tudo
              </Link>
              <ChevronRight className="h-4 w-4 text-mist" />
              <Link href={`/categories/${product.category.slug}`} className="hover:text-malmequer-gold transition-colors duration-200">
                {product.category.name}
              </Link>
              <ChevronRight className="h-4 w-4 text-mist" />
              <span className="text-ink">{product.name}</span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="container-malmequer py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {product.images.length > 0 ? (
                <div className="relative aspect-[3/4] bg-white overflow-hidden">
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
                <div className="aspect-[3/4] bg-cloud flex items-center justify-center">
                  <p className="text-mist">Sem imagem</p>
                </div>
              )}

              {/* Thumbnail images if multiple */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.slice(1).map((image, index) => (
                    <div
                      key={image.id}
                      className="relative aspect-square bg-white overflow-hidden cursor-pointer hover:opacity-75 transition-opacity duration-200"
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
            <div className="bg-white p-6 lg:p-8">
              <div className="mb-6">
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="text-xs uppercase tracking-wider text-mist hover:text-malmequer-gold transition-colors duration-200"
                >
                  {product.category.name}
                </Link>
                <h1 className="font-display text-3xl lg:text-4xl text-ink mt-2">
                  {product.name}
                </h1>
              </div>

              {product.description && (
                <div className="mb-6">
                  <h2 className="text-sm uppercase tracking-wider text-stone mb-2">
                    Descrição
                  </h2>
                  <p className="text-stone whitespace-pre-line leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              <ProductOptions
                productId={product.id}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  type: v.type,
                  label: v.label,
                  value: v.value,
                  priceExtra: v.priceExtra ? Number(v.priceExtra) : null,
                }))}
                stockItems={product.stockItems.map((si) => ({
                  id: si.id,
                  sizeVariantId: si.sizeVariantId,
                  colorVariantId: si.colorVariantId,
                  quantity: si.quantity,
                  sizeVariant: {
                    id: si.sizeVariant.id,
                    type: si.sizeVariant.type,
                    label: si.sizeVariant.label,
                    value: si.sizeVariant.value,
                    priceExtra: si.sizeVariant.priceExtra ? Number(si.sizeVariant.priceExtra) : null,
                  },
                  colorVariant: {
                    id: si.colorVariant.id,
                    type: si.colorVariant.type,
                    label: si.colorVariant.label,
                    value: si.colorVariant.value,
                    priceExtra: si.colorVariant.priceExtra ? Number(si.colorVariant.priceExtra) : null,
                  },
                }))}
                basePrice={Number(product.price)}
              />

              <div className="mt-8 pt-8 border-t border-cloud">
                <h3 className="text-sm uppercase tracking-wider text-stone mb-3">
                  Informações do produto
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-mist">Categoria:</dt>
                    <dd className="text-ink">{product.category.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-mist">Disponibilidade:</dt>
                    <dd className={totalStock > 0 ? 'text-success' : 'text-error'}>
                      {totalStock > 0 ? 'Em stock' : 'Esgotado'}
                    </dd>
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
