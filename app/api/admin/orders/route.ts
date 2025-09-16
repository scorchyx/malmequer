import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAdminAuth, logAdminActivity } from "@/lib/admin-auth"

async function getHandler(request: NextRequest, context: { user: any }) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const status = searchParams.get("status")
    const paymentStatus = searchParams.get("paymentStatus")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    const where = {
      ...(status && { status: status as any }),
      ...(paymentStatus && { paymentStatus: paymentStatus as any }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" as const } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true, price: true } },
            },
          },
          payments: true,
          shippingAddress: true,
          billingAddress: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

async function putHandler(request: NextRequest, context: { user: any }) {
  try {
    const { orderId, status, paymentStatus, notes } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (notes !== undefined) updateData.notes = notes

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } },
          },
        },
        payments: true,
      },
    })

    // Log admin activity
    const changes = []
    if (status && status !== existingOrder.status) {
      changes.push(`status: ${existingOrder.status} → ${status}`)
    }
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      changes.push(`paymentStatus: ${existingOrder.paymentStatus} → ${paymentStatus}`)
    }
    if (notes !== undefined && notes !== existingOrder.notes) {
      changes.push(`notes updated`)
    }

    if (changes.length > 0) {
      await logAdminActivity(
        context.user.id,
        "UPDATE_ORDER",
        "Order",
        orderId,
        `Updated order ${existingOrder.orderNumber}: ${changes.join(", ")}`,
        {
          status: existingOrder.status,
          paymentStatus: existingOrder.paymentStatus,
          notes: existingOrder.notes,
        },
        updateData
      )
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(getHandler)
export const PUT = withAdminAuth(putHandler)