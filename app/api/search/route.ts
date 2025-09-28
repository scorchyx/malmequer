import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

interface SearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
  rating?: number
  tags?: string[]
  brand?: string
  status?: 'ACTIVE' | 'DRAFT'
}

interface SortOption {
  field: 'name' | 'price' | 'createdAt' | 'rating' | 'popularity'
  direction: 'asc' | 'desc'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Search parameters
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    // Filters
    const filters: SearchFilters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true',
      onSale: searchParams.get('onSale') === 'true',
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
      tags: searchParams.get('tags')?.split(',').map(tag => tag.trim()) || undefined,
      brand: searchParams.get('brand') || undefined,
      status: (searchParams.get('status') as 'ACTIVE' | 'DRAFT') || 'ACTIVE',
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    // Create cache key
    const cacheKey = CacheKeys.search(
      `${query}_${JSON.stringify(filters)}_${sortBy}_${sortDir}`,
      page,
    )

    // Try to get from cache
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build where clause
    const where: any = {
      status: filters.status,
    }

    // Text search in name and description
    if (query.trim()) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Category filter
    if (filters.category) {
      where.categoryId = filters.category
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {}
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice
      }
    }

    // Stock filter
    if (filters.inStock) {
      where.inventory = {
        gt: 0,
      }
    }

    // Sale filter (products with comparePrice)
    if (filters.onSale) {
      where.comparePrice = {
        not: null,
      }
    }

    // Brand filter (using tags for now)
    if (filters.brand) {
      where.tags = {
        has: filters.brand,
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasEvery: filters.tags,
      }
    }

    // Build orderBy clause
    let orderBy: any = {}

    switch (sortBy) {
      case 'name':
        orderBy = { name: sortDir }
        break
      case 'price':
        orderBy = { price: sortDir }
        break
      case 'createdAt':
        orderBy = { createdAt: sortDir }
        break
      case 'popularity':
        // Sort by order count (simulating popularity)
        orderBy = { orderItems: { _count: sortDir } }
        break
      case 'rating':
        // Sort by average rating
        orderBy = { reviews: { _count: sortDir } }
        break
      case 'relevance':
      default:
        // For text search, prioritize exact matches
        if (query.trim()) {
          orderBy = [
            { name: 'asc' }, // Alphabetical as secondary sort
            { createdAt: 'desc' }, // Newest as tertiary sort
          ]
        } else {
          orderBy = { createdAt: 'desc' }
        }
        break
    }

    // Execute search with pagination
    const [products, totalCount, categories, priceRange] = await Promise.all([
      // Products with relations
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              url: true,
              alt: true,
            },
          },
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              inventory: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true,
            },
          },
        },
      }),

      // Total count for pagination
      prisma.product.count({ where }),

      // Available categories for filters
      prisma.category.findMany({
        where: {
          products: {
            some: where,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      }),

      // Price range for filters
      prisma.product.aggregate({
        where,
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      }),
    ])

    // Calculate average ratings
    const enrichedProducts = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0

      const isOnSale = product.comparePrice && Number(product.comparePrice) > Number(product.price)
      const discountPercentage = isOnSale
        ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
        : 0

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        isOnSale,
        discountPercentage,
        inventory: product.inventory,
        inStock: product.inventory > 0,
        sku: product.sku,
        tags: product.tags,
        category: product.category,
        images: product.images,
        variants: product.variants.map(v => ({
          id: v.id,
          name: v.name,
          price: Number(v.price),
          inventory: v.inventory,
        })),
        rating: {
          average: Math.round(avgRating * 10) / 10,
          count: product.reviews.length,
        },
        popularity: product._count.orderItems,
        createdAt: product.createdAt,
      }
    })

    // Extract unique brands from tags
    const allTags = products.flatMap(p => p.tags || [])
    const uniqueBrands = [...new Set(allTags)].sort()

    const result = {
      products: enrichedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      filters: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          productCount: cat._count.products,
        })),
        priceRange: {
          min: Number(priceRange._min.price) || 0,
          max: Number(priceRange._max.price) || 0,
        },
        availableBrands: uniqueBrands,
      },
      query: {
        searchTerm: query,
        appliedFilters: filters,
        sortBy,
        sortDirection: sortDir,
      },
      metadata: {
        searchTime: Date.now(),
        resultCount: totalCount,
        cached: false,
      },
    }

    // Cache the result
    await cache.set(cacheKey, result, CacheTTL.MEDIUM)

    log.info('Search executed successfully', {
      query,
      filters: JSON.stringify(filters),
      resultCount: totalCount,
      page,
      searchTime: Date.now(),
    })

    return NextResponse.json(result)
  } catch (error) {
    log.error('Error executing search', {
      error: error instanceof Error ? error.message : String(error),
      query: request.url,
    })
    return NextResponse.json(
      { error: 'Failed to execute search' },
      { status: 500 },
    )
  }
}

// Get search suggestions/autocomplete
export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json()

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const cacheKey = `search_suggestions:${query}:${limit}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get product name suggestions
    const [productSuggestions, categorySuggestions] = await Promise.all([
      prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              sku: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: {
            take: 1,
            select: {
              url: true,
            },
          },
        },
        take: Math.floor(limit * 0.7), // 70% products
        orderBy: {
          name: 'asc',
        },
      }),

      // Category suggestions
      prisma.category.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
        take: Math.floor(limit * 0.3), // 30% categories
        orderBy: {
          name: 'asc',
        },
      }),
    ])

    const suggestions = {
      products: productSuggestions.map(p => ({
        type: 'product',
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        image: p.images[0]?.url || null,
      })),
      categories: categorySuggestions.map(c => ({
        type: 'category',
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      })),
    }

    const result = {
      suggestions: [
        ...suggestions.products,
        ...suggestions.categories,
      ].slice(0, limit),
      query,
    }

    // Cache suggestions for a short time
    await cache.set(cacheKey, result, CacheTTL.SHORT)

    return NextResponse.json(result)
  } catch (error) {
    log.error('Error getting search suggestions', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 },
    )
  }
}