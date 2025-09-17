import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateRequestBody, validateQueryParams, createProductSchema, paginationSchema } from "@/lib/validation"
import { cache, CacheKeys, CacheTTL } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const validation = validateQueryParams(paginationSchema, searchParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.errors },
        { status: 400 }
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
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true,
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: "desc" },
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
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
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
      sku,
      inventory,
      weight,
      categoryId,
      images,
      variants,
    } = validation.data

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice,
        sku,
        inventory,
        weight,
        categoryId,
        images: {
          create: images?.map((image: any, index: number) => ({
            url: image.url,
            alt: image.alt,
            order: index,
          })) ?? [],
        },
        variants: {
          create: variants ?? [],
        },
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}