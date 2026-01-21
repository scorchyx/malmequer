import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for address update
const addressUpdateSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().min(1, 'Apelido é obrigatório').optional(),
  phone: z.string().min(9, 'Telefone inválido').optional(),
  addressLine1: z.string().min(1, 'Morada é obrigatória').optional(),
  addressLine2: z.string().optional(),
  locality: z.string().min(1, 'Localidade é obrigatória').optional(),
  city: z.string().optional(),
  state: z.string().min(1, 'Distrito é obrigatório').optional(),
  postalCode: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal inválido (XXXX-XXX)').optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional(),
  label: z.string().optional(),
})

// GET - Get single address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Morada não encontrada' },
        { status: 404 },
      )
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error fetching address:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar morada' },
      { status: 500 },
    )
  }
}

// PATCH - Update address
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Morada não encontrada' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const validatedData = addressUpdateSchema.parse(body)

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: 'SHIPPING',
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(validatedData.firstName && { firstName: validatedData.firstName }),
        ...(validatedData.lastName && { lastName: validatedData.lastName }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.addressLine1 && { addressLine1: validatedData.addressLine1 }),
        ...(validatedData.addressLine2 !== undefined && { addressLine2: validatedData.addressLine2 || null }),
        ...(validatedData.locality && { city: validatedData.city || validatedData.locality }),
        ...(validatedData.state && { state: validatedData.state }),
        ...(validatedData.postalCode && { postalCode: validatedData.postalCode }),
        ...(validatedData.country && { country: validatedData.country }),
        ...(validatedData.isDefault !== undefined && { isDefault: validatedData.isDefault }),
      },
    })

    return NextResponse.json({ address })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 },
      )
    }
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar morada' },
      { status: 500 },
    )
  }
}

// DELETE - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    // Verify ownership
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Morada não encontrada' },
        { status: 404 },
      )
    }

    // Check if address is used in any orders
    const ordersUsingAddress = await prisma.order.count({
      where: {
        OR: [
          { shippingAddressId: id },
          { billingAddressId: id },
        ],
      },
    })

    if (ordersUsingAddress > 0) {
      return NextResponse.json(
        { error: 'Esta morada está associada a encomendas e não pode ser eliminada. Pode criar uma nova morada em vez disso.' },
        { status: 400 },
      )
    }

    await prisma.address.delete({
      where: { id },
    })

    // If deleted address was default, set another as default
    if (existingAddress.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: {
          userId: user.id,
          type: 'SHIPPING',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Erro ao eliminar morada' },
      { status: 500 },
    )
  }
}
