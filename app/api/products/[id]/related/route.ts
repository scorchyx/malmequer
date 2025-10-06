import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'RELATED'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '12'), 50)

    // Validate relation type
    const validTypes = ['RELATED', 'CROSS_SELL', 'UP_SELL', 'BUNDLE', 'ALTERNATIVE']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid relation type' },
        { status: 400 },
      )
    }

    const relations = await prisma.productRelation.findMany({
      where: {
        productId: id,
        type: type as any,
      },
      orderBy: { position: 'asc' },
      take: limit,
      include: {
        relatedProduct: {
          include: {
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
            category: {
              select: { name: true },
            },
            variants: {
              select: {
                id: true,
                inventory: true,
              },
            },
            _count: {
              select: { reviews: true },
            },
          },
        },
      },
    })

    const relatedProducts = relations.map(relation => ({
      ...relation.relatedProduct,
      totalInventory: relation.relatedProduct.variants.reduce(
        (sum, variant) => sum + variant.inventory,
        0,
      ),
      relationPosition: relation.position,
    }))

    return NextResponse.json({
      type,
      products: relatedProducts,
      count: relatedProducts.length,
    })
  } catch (error) {
    console.error('Error fetching related products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related products' },
      { status: 500 },
    )
  }
}