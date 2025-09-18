import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { validateRequestBody, createCategorySchema } from '@/lib/validation'

export async function GET() {
  try {
    // Try to get from cache first
    const cachedCategories = await cache.get(CacheKeys.categories())
    if (cachedCategories) {
      return NextResponse.json(cachedCategories)
    }

    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Cache categories for 15 minutes
    await cache.set(CacheKeys.categories(), categories, CacheTTL.LONG)

    log.info('Categories fetched successfully', {
      count: categories.length,
      type: 'api_request',
    })

    return NextResponse.json(categories)
  } catch (error) {
    log.error('Failed to fetch categories', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(createCategorySchema)(request)
    if (!validation.success) {
      return validation.response
    }

    const { name, slug, description, image, parentId } = validation.data

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    // Invalidate categories cache
    await cache.del(CacheKeys.categories())

    log.businessEvent('Category created successfully', {
      event: 'category_creation',
      entityType: 'category',
      entityId: category.id,
      details: { name, slug },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    log.error('Failed to create category', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 },
    )
  }
}