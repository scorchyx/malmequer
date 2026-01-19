import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        variants: { orderBy: { position: 'asc' } },
        stockItems: {
          include: {
            sizeVariant: true,
            colorVariant: true,
          },
        },
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 },
    )
  }
}

interface SizeVariantInput {
  label: string
  value: string
  sku?: string
  priceExtra?: number
}

interface ColorVariantInput {
  label: string
  value: string // hex codes comma-separated
  sku?: string
  priceExtra?: number
}

interface StockItemInput {
  sizeValue: string
  colorValue: string
  quantity: number
  sku?: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      slug,
      description,
      price,
      comparePrice,
      weight,
      status,
      categoryId,
      featured,
      images,
      sizes,
      colors,
      stockItems,
    } = body

    // Update product with transaction to handle related records
    const product = await prisma.$transaction(async (tx) => {
      // Update main product fields
      await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          price,
          comparePrice,
          weight,
          status,
          categoryId,
          featured,
        },
      })

      // Update images if provided
      if (images !== undefined) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        })

        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img: { url: string; alt: string }, index: number) => ({
              productId: id,
              url: img.url,
              alt: img.alt || '',
              order: index,
            })),
          })
        }
      }

      // Update variants and stock if provided
      if (sizes !== undefined || colors !== undefined) {
        // First, delete all stock items (they reference variants)
        await tx.stockItem.deleteMany({
          where: { productId: id },
        })

        // Delete all cart items for this product (they reference stock items)
        await tx.cartItem.deleteMany({
          where: { productId: id },
        })

        // Delete existing variants
        await tx.productVariant.deleteMany({
          where: { productId: id },
        })

        // Create size variants
        const sizeVariants: { id: string; value: string }[] = []
        if (sizes && sizes.length > 0) {
          for (let i = 0; i < sizes.length; i++) {
            const size: SizeVariantInput = sizes[i]
            const created = await tx.productVariant.create({
              data: {
                productId: id,
                type: 'TAMANHO',
                label: size.label,
                value: size.value,
                sku: size.sku || null,
                priceExtra: size.priceExtra || null,
                position: i,
              },
            })
            sizeVariants.push({ id: created.id, value: created.value })
          }
        }

        // Create color variants
        const colorVariants: { id: string; value: string }[] = []
        if (colors && colors.length > 0) {
          for (let i = 0; i < colors.length; i++) {
            const color: ColorVariantInput = colors[i]
            const created = await tx.productVariant.create({
              data: {
                productId: id,
                type: 'COR',
                label: color.label,
                value: color.value,
                sku: color.sku || null,
                priceExtra: color.priceExtra || null,
                position: i,
              },
            })
            colorVariants.push({ id: created.id, value: created.value })
          }
        }

        // Create stock items for each combination
        if (stockItems && stockItems.length > 0 && sizeVariants.length > 0 && colorVariants.length > 0) {
          for (const item of stockItems as StockItemInput[]) {
            const sizeVariant = sizeVariants.find(s => s.value === item.sizeValue)
            const colorVariant = colorVariants.find(c => c.value === item.colorValue)

            if (sizeVariant && colorVariant) {
              await tx.stockItem.create({
                data: {
                  productId: id,
                  sizeVariantId: sizeVariant.id,
                  colorVariantId: colorVariant.id,
                  quantity: item.quantity,
                  sku: item.sku || null,
                },
              })
            }
          }
        }
      }

      // Return updated product with relations
      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: { orderBy: { order: 'asc' } },
          variants: { orderBy: { position: 'asc' } },
          stockItems: {
            include: {
              sizeVariant: true,
              colorVariant: true,
            },
          },
        },
      })
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error updating product:', error)
    console.error('Error details:', error?.message, error?.code)
    return NextResponse.json(
      { error: 'Failed to update product', details: error?.message },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 },
    )
  }
}
