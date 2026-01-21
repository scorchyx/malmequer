import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for address
const addressSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Apelido é obrigatório'),
  phone: z.string().min(9, 'Telefone inválido'),
  addressLine1: z.string().min(1, 'Morada é obrigatória'),
  addressLine2: z.string().optional(),
  locality: z.string().min(1, 'Localidade é obrigatória'),
  city: z.string().optional(),
  state: z.string().min(1, 'Distrito é obrigatório'),
  postalCode: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal inválido (XXXX-XXX)'),
  country: z.string().default('Portugal'),
  isDefault: z.boolean().optional(),
  label: z.string().optional(), // e.g., "Casa", "Trabalho"
})

// GET - List user addresses
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
        type: 'SHIPPING',
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar moradas' },
      { status: 500 },
    )
  }
}

// POST - Create new address
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 },
      )
    }

    const body = await request.json()
    const validatedData = addressSchema.parse(body)

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          type: 'SHIPPING',
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    // Check if this is the first address (auto-set as default)
    const existingCount = await prisma.address.count({
      where: {
        userId: user.id,
        type: 'SHIPPING',
      },
    })

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2 || null,
        city: validatedData.city || validatedData.locality,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        isDefault: validatedData.isDefault || existingCount === 0,
        type: 'SHIPPING',
      },
    })

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 },
      )
    }
    console.error('Error creating address:', error)
    return NextResponse.json(
      { error: 'Erro ao criar morada' },
      { status: 500 },
    )
  }
}
