import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

// Shipping zones and rates (configurable)
const SHIPPING_ZONES = {
  DOMESTIC: {
    name: 'Portugal Continental',
    countries: ['PT'],
    regions: ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Faro', 'Aveiro', 'Setúbal', 'Leiria'],
  },
  ISLANDS: {
    name: 'Ilhas (Açores e Madeira)',
    countries: ['PT'],
    regions: ['Açores', 'Madeira'],
  },
  EU: {
    name: 'União Europeia',
    countries: ['ES', 'FR', 'IT', 'DE', 'BE', 'NL', 'LU', 'AT', 'DK', 'SE', 'FI', 'IE', 'GR', 'CY', 'MT', 'SI', 'SK', 'CZ', 'HU', 'PL', 'LT', 'LV', 'EE', 'RO', 'BG', 'HR'],
  },
  INTERNATIONAL: {
    name: 'Internacional',
    countries: ['*'], // All other countries
  },
}

const SHIPPING_RATES = {
  DOMESTIC: {
    STANDARD: { name: 'Correios Standard', price: 3.99, days: '2-3', maxWeight: 20 },
    EXPRESS: { name: 'Correios Express', price: 6.99, days: '1-2', maxWeight: 20 },
    FREE: { name: 'Envio Grátis', price: 0, days: '3-5', minAmount: 50, maxWeight: 20 },
  },
  ISLANDS: {
    STANDARD: { name: 'Correios Ilhas', price: 8.99, days: '3-5', maxWeight: 15 },
    EXPRESS: { name: 'Correios Ilhas Express', price: 12.99, days: '2-3', maxWeight: 15 },
  },
  EU: {
    STANDARD: { name: 'EU Standard', price: 12.99, days: '5-7', maxWeight: 10 },
    EXPRESS: { name: 'EU Express', price: 19.99, days: '3-4', maxWeight: 10 },
  },
  INTERNATIONAL: {
    STANDARD: { name: 'International Standard', price: 24.99, days: '7-14', maxWeight: 5 },
    EXPRESS: { name: 'International Express', price: 39.99, days: '4-7', maxWeight: 5 },
  },
}

interface ShippingAddress {
  country: string
  state?: string
  city?: string
  postalCode?: string
}

interface CartItem {
  productId: string
  quantity: number
  weight?: number
  product?: {
    weight?: number
    length?: number
    width?: number
    height?: number
  }
}

function getShippingZone(address: ShippingAddress): keyof typeof SHIPPING_ZONES {
  const { country, state } = address

  if (country === 'PT') {
    if (state && ['Açores', 'Madeira'].includes(state)) {
      return 'ISLANDS'
    }
    return 'DOMESTIC'
  }

  if (SHIPPING_ZONES.EU.countries.includes(country)) {
    return 'EU'
  }

  return 'INTERNATIONAL'
}

function calculateCartWeight(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const itemWeight = item.weight ?? item.product?.weight ?? 0.5 // Default 500g per item
    return total + (itemWeight * item.quantity)
  }, 0)
}

function calculateCartDimensions(items: CartItem[]) {
  // Simple box packing simulation
  let totalVolume = 0

  items.forEach(item => {
    const length = item.product?.length ?? 20
    const width = item.product?.width ?? 15
    const height = item.product?.height ?? 5
    const volume = (length * width * height) / 1000000 // Convert to cubic meters
    totalVolume += volume * item.quantity
  })

  // Estimate box dimensions from total volume
  const side = Math.cbrt(totalVolume) * 100 // Convert back to cm
  return {
    length: Math.max(side, 20),
    width: Math.max(side, 15),
    height: Math.max(side * 0.5, 5),
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { address, items, cartSubtotal } = await request.json()

    if (!address?.country) {
      return NextResponse.json(
        { error: 'Shipping address country is required' },
        { status: 400 },
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 },
      )
    }

    // Get product details for weight calculation
    const productIds = items.map((item: CartItem) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        weight: true,
        length: true,
        width: true,
        height: true,
        name: true,
      },
    })

    // Enrich items with product data
    const enrichedItems = items.map((item: CartItem) => ({
      ...item,
      product: products.find(p => p.id === item.productId),
    }))

    // Calculate shipping zone
    const zone = getShippingZone(address as ShippingAddress)
    const availableRates = SHIPPING_RATES[zone]

    // Calculate cart weight and dimensions
    const totalWeight = calculateCartWeight(enrichedItems)
    const dimensions = calculateCartDimensions(enrichedItems)

    // Filter available shipping methods based on weight limits
    const shippingOptions = Object.entries(availableRates)
      .map(([key, rate]) => {
        // Check weight limit
        if (totalWeight > rate.maxWeight) {
          return null
        }

        // Check minimum amount for free shipping
        if ('minAmount' in rate && cartSubtotal < rate.minAmount!) {
          return null
        }

        // Calculate final price (could add weight-based surcharges here)
        let finalPrice = rate.price

        // Add weight surcharge for heavy items
        if (totalWeight > 10) {
          const surcharge = Math.ceil((totalWeight - 10) / 5) * 2.50
          finalPrice += surcharge
        }

        // Add dimension surcharge for large items
        const maxDimension = Math.max(dimensions.length, dimensions.width, dimensions.height)
        if (maxDimension > 100) {
          finalPrice += 10.00
        }

        return {
          id: `${zone}_${key}`,
          name: rate.name,
          price: finalPrice,
          estimatedDays: rate.days,
          zone: SHIPPING_ZONES[zone].name,
          maxWeight: rate.maxWeight,
          description: `${rate.name} - Entrega em ${rate.days} dias úteis`,
        }
      })
      .filter(Boolean)

    if (shippingOptions.length === 0) {
      return NextResponse.json(
        {
          error: 'No shipping options available for this destination and cart weight',
          details: {
            zone: SHIPPING_ZONES[zone].name,
            totalWeight,
            maxWeightAvailable: Math.max(...Object.values(availableRates).map(r => r.maxWeight)),
          },
        },
        { status: 400 },
      )
    }

    // Sort by price (cheapest first)
    shippingOptions.sort((a, b) => a!.price - b!.price)

    log.info('Shipping calculated successfully', {
      userId: user?.id,
      destination: `${address.country}${address.state ? `, ${address.state}` : ''}`,
      zone,
      totalWeight,
      dimensions,
      optionsCount: shippingOptions.length,
    })

    return NextResponse.json({
      destination: {
        country: address.country,
        state: address.state,
        zone: SHIPPING_ZONES[zone].name,
      },
      cart: {
        totalWeight,
        dimensions,
        itemCount: items.length,
      },
      shippingOptions,
      metadata: {
        calculatedAt: new Date().toISOString(),
        currency: 'EUR',
        weightUnit: 'kg',
        dimensionUnit: 'cm',
      },
    })
  } catch (error) {
    log.error('Error calculating shipping', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 },
    )
  }
}

// Get available shipping zones
export async function GET() {
  try {
    const zones = Object.entries(SHIPPING_ZONES).map(([key, zone]) => ({
      id: key,
      name: zone.name,
      countries: zone.countries,
      regions: zone.regions || [],
      rates: Object.entries(SHIPPING_RATES[key as keyof typeof SHIPPING_RATES]).map(([rateKey, rate]) => ({
        id: rateKey,
        name: rate.name,
        basePrice: rate.price,
        estimatedDays: rate.days,
        maxWeight: rate.maxWeight,
        minAmount: 'minAmount' in rate ? rate.minAmount : null,
      })),
    }))

    return NextResponse.json({
      zones,
      notes: [
        'Preços podem variar baseado no peso e dimensões',
        'Pesos superiores a 10kg têm sobretaxa de €2.50 por cada 5kg adicionais',
        'Encomendas com dimensões superiores a 100cm têm sobretaxa de €10',
        'Envio grátis disponível para Portugal Continental em compras superiores a €50',
      ],
    })
  } catch (error) {
    log.error('Error fetching shipping zones', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to fetch shipping zones' },
      { status: 500 },
    )
  }
}