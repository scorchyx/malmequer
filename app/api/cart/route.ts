import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { order: "asc" } },
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const total = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0
    )

    return NextResponse.json({
      items: cartItems,
      total,
      count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { productId, quantity } = await request.json()

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    let cartItem
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
        },
      })
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity,
        },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
        },
      })
    }

    return NextResponse.json(cartItem, { status: 201 })
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    )
  }
}