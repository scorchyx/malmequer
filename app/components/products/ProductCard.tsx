import Link from 'next/link'
import Image from 'next/image'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  imageUrl?: string
  imageAlt?: string
}

export default function ProductCard({
  name,
  slug,
  price,
  imageUrl,
  imageAlt,
}: ProductCardProps) {
  return (
    <Link
      href={`/produto/${slug}`}
      className="group block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sem imagem
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-1">
        <h3 className="text-sm text-gray-800 font-light tracking-wide line-clamp-2 group-hover:text-gray-600 transition-colors uppercase">
          {name}
        </h3>
        <p className="text-sm text-gray-900 font-light tracking-wide">
          {Number(price).toFixed(2)}€
        </p>
      </div>
    </Link>
  )
}
