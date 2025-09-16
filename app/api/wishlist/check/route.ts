import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ inWishlist: false })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    return NextResponse.json({
      inWishlist: !!wishlistItem,
      wishlistItemId: wishlistItem?.id || null,
    })
  } catch (error) {
    console.error("Error checking wishlist:", error)
    return NextResponse.json(
      { error: "Failed to check wishlist" },
      { status: 500 }
    )
  }
}