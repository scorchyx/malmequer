import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(address)
  } catch (error) {
    console.error("Error fetching address:", error)
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }

    const {
      type,
      firstName,
      lastName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      vatNumber,
      isDefault
    } = await request.json()

    // If changing to default, unset other defaults of the same type
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: type || existingAddress.type,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      })
    }

    // Validate VAT number for billing addresses
    const finalType = type || existingAddress.type
    if (finalType === 'BILLING' && vatNumber === undefined && !existingAddress.vatNumber) {
      return NextResponse.json(
        { error: "VAT number is required for billing addresses" },
        { status: 400 }
      )
    }

    // Update the address
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(company !== undefined && { company }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode && { postalCode }),
        ...(country && { country }),
        ...(phone !== undefined && { phone }),
        ...(vatNumber !== undefined && { vatNumber }),
        ...(isDefault !== undefined && { isDefault })
      }
    })

    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error("Error updating address:", error)
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    // Check if address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      )
    }

    // Check if this address is being used in any orders
    const ordersUsingAddress = await prisma.order.findFirst({
      where: {
        OR: [
          { shippingAddressId: id },
          { billingAddressId: id }
        ]
      }
    })

    if (ordersUsingAddress) {
      return NextResponse.json(
        { error: "Cannot delete address that is being used in orders" },
        { status: 400 }
      )
    }

    await prisma.address.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Address deleted successfully" })
  } catch (error) {
    console.error("Error deleting address:", error)
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    )
  }
}