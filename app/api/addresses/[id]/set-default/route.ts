import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }

    // If already default, nothing to do
    if (address.isDefault) {
      return NextResponse.json({
        message: "Address is already the default",
        address
      })
    }

    // Use transaction to ensure only one default per type
    const updatedAddress = await prisma.$transaction(async (tx) => {
      // Unset current default for this type
      await tx.address.updateMany({
        where: {
          userId: user.id,
          type: address.type,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })

      // Set this address as default
      return await tx.address.update({
        where: { id: params.id },
        data: { isDefault: true }
      })
    })

    return NextResponse.json({
      message: `Address set as default ${address.type.toLowerCase()} address`,
      address: updatedAddress
    })
  } catch (error) {
    console.error("Error setting default address:", error)
    return NextResponse.json(
      { error: "Failed to set default address" },
      { status: 500 }
    )
  }
}