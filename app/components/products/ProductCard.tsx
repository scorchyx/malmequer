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
      className="group block bg-white overflow-hidden"
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] bg-cloud overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-mist text-sm">
            Sem imagem
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="py-4 space-y-1">
        <h3 className="text-sm text-ink tracking-wide line-clamp-2 group-hover:text-malmequer-gold transition-colors duration-200">
          {name}
        </h3>
        <p className="text-sm text-ink font-semibold tracking-wide">
          {Number(price).toFixed(2)}€
        </p>
      </div>
    </Link>
  )
}
