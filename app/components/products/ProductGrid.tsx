import ProductCard from './ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: Array<{
    url: string
    alt: string | null
  }>
}

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          slug={product.slug}
          price={product.price}
          imageUrl={product.images[0]?.url}
          imageAlt={product.images[0]?.alt || product.name}
        />
      ))}
    </div>
  )
}
