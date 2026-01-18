import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys } from '@/lib/cache'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { validateRequestBody, createCategorySchema } from '@/lib/validation'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate request body
    const validation = await validateRequestBody(createCategorySchema)(request)
    if (!validation.success) {
      return validation.response
    }

    const { name, slug, description, image, parentId } = validation.data

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        image,
        parentId: parentId || null,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    })

    // Invalidate categories cache
    await cache.del(CacheKeys.categories())

    log.businessEvent('Category updated successfully', {
      event: 'category_update',
      entityType: 'category',
      entityId: category.id,
      details: { name, slug },
    })

    return NextResponse.json(category)
  } catch (error) {
    log.error('Failed to update category', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has products
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Please reassign or delete products first.' },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    })

    // Invalidate categories cache
    await cache.del(CacheKeys.categories())

    log.businessEvent('Category deleted successfully', {
      event: 'category_deletion',
      entityType: 'category',
      entityId: id,
      details: { name: category.name },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    log.error('Failed to delete category', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    log.error('Failed to fetch category', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
  }
}
