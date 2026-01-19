import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { prisma } from '@/lib/prisma'
import { validateRequestBody, validateQueryParams, createProductSchema, paginationSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const validation = validateQueryParams(paginationSchema, searchParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.errors },
        { status: 400 },
      )
    }

    const { page = 1, limit = 10, search, category, status = 'ACTIVE' } = validation.data
    const skip = (page - 1) * limit

    // Create cache key based on parameters
    const cacheKey = CacheKeys.products(`${JSON.stringify({ page, limit, search, category, status })}`)

    // Try to get from cache first
    const cachedResult = await cache.get(cacheKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    const where = {
      status: status as any,
      ...(category && { categoryId: category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true,
          variants: true,
          stockItems: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const result = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }

    // Cache the result for 5 minutes
    await cache.set(cacheKey, result, CacheTTL.MEDIUM)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(createProductSchema)(request)
    if (!validation.success) {
      return validation.response
    }

    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      weight,
      categoryId,
      images,
      sizes,
      colors,
      stockItems,
    } = validation.data

    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const created = await tx.product.create({
        data: {
          name,
          slug,
          description,
          price,
          comparePrice,
          weight,
          categoryId,
          images: {
            create: images?.map((image: any, index: number) => ({
              url: image.url,
              alt: image.alt,
              order: index,
            })) ?? [],
          },
        },
      })

      // Create size variants
      const sizeVariants: { id: string; value: string }[] = []
      if (sizes && sizes.length > 0) {
        for (let i = 0; i < sizes.length; i++) {
          const size = sizes[i]
          const variant = await tx.productVariant.create({
            data: {
              productId: created.id,
              type: 'TAMANHO',
              label: size.label,
              value: size.value,
              sku: size.sku || null,
              priceExtra: size.priceExtra || null,
              position: i,
            },
          })
          sizeVariants.push({ id: variant.id, value: variant.value })
        }
      }

      // Create color variants
      const colorVariants: { id: string; value: string }[] = []
      if (colors && colors.length > 0) {
        for (let i = 0; i < colors.length; i++) {
          const color = colors[i]
          const variant = await tx.productVariant.create({
            data: {
              productId: created.id,
              type: 'COR',
              label: color.label,
              value: color.value,
              sku: color.sku || null,
              priceExtra: color.priceExtra || null,
              position: i,
            },
          })
          colorVariants.push({ id: variant.id, value: variant.value })
        }
      }

      // Create stock items
      if (stockItems && stockItems.length > 0 && sizeVariants.length > 0 && colorVariants.length > 0) {
        for (const item of stockItems) {
          const sizeVariant = sizeVariants.find(s => s.value === item.sizeValue)
          const colorVariant = colorVariants.find(c => c.value === item.colorValue)

          if (sizeVariant && colorVariant) {
            await tx.stockItem.create({
              data: {
                productId: created.id,
                sizeVariantId: sizeVariant.id,
                colorVariantId: colorVariant.id,
                quantity: item.quantity,
                sku: item.sku || null,
              },
            })
          }
        }
      }

      // Return product with relations
      return tx.product.findUnique({
        where: { id: created.id },
        include: {
          category: true,
          images: true,
          variants: true,
          stockItems: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
        },
      })
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 },
    )
  }
}