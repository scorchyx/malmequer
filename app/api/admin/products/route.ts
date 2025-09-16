import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, logAdminActivity } from "@/lib/admin-auth"

async function getHandler(request: NextRequest, context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    const where = {
      ...(category && { categoryId: category }),
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { take: 1, orderBy: { order: "asc" } },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

async function putHandler(request: NextRequest, context: { user: any }) {
  try {
    const {
      productId,
      name,
      description,
      price,
      comparePrice,
      sku,
      inventory,
      status,
      featured,
      categoryId,
    } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice
    if (sku !== undefined) updateData.sku = sku
    if (inventory !== undefined) updateData.inventory = inventory
    if (status !== undefined) updateData.status = status
    if (featured !== undefined) updateData.featured = featured
    if (categoryId !== undefined) updateData.categoryId = categoryId

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    })

    // Log inventory changes
    if (inventory !== undefined && inventory !== existingProduct.inventory) {
      const quantityDiff = inventory - existingProduct.inventory
      await prisma.inventoryLog.create({
        data: {
          type: "ADJUSTMENT",
          quantity: quantityDiff,
          reason: `Admin adjustment: ${existingProduct.inventory} → ${inventory}`,
          productId,
          userId: context.user.id,
        },
      })
    }

    // Log admin activity
    const changes = []
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== (existingProduct as any)[key]) {
        changes.push(`${key}: ${(existingProduct as any)[key]} → ${updateData[key]}`)
      }
    })

    if (changes.length > 0) {
      await logAdminActivity(
        context.user.id,
        "UPDATE_PRODUCT",
        "Product",
        productId,
        `Updated product ${existingProduct.name}: ${changes.join(", ")}`,
        existingProduct,
        updateData
      )
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(getHandler)
export const PUT = withAdminAuth(putHandler)