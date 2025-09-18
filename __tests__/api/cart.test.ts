import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/cart/route'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    cartItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CacheKeys: {
    userCart: (userId: string) => `cart:user:${userId}`,
  },
  CacheTTL: {
    SHORT: 60,
  },
}))

jest.mock('@/lib/logger', () => ({
  log: {
    error: jest.fn(),
    businessEvent: jest.fn(),
  },
}))

jest.mock('@/lib/validation', () => ({
  validateRequestBody: jest.fn(() => async () => ({
    success: true,
    data: {
      productId: 'product-1',
      quantity: 2,
    },
  })),
  addToCartSchema: {},
}))

describe('/api/cart', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return unauthorized when user not authenticated', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return cached cart when available', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      const { cache } = require('@/lib/cache')

      const mockCart = {
        items: [],
        total: 0,
        count: 0,
      }

      getCurrentUser.mockResolvedValueOnce(mockUser)
      cache.get.mockResolvedValueOnce(mockCart)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCart)
      expect(cache.get).toHaveBeenCalledWith('cart:user:user-1')
    })

    it('should fetch and cache cart when not in cache', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      const { cache } = require('@/lib/cache')
      const { prisma } = require('@/lib/prisma')

      const mockCartItems = [
        {
          id: 'item-1',
          quantity: 2,
          product: {
            id: 'product-1',
            name: 'Test Product',
            price: 10.99,
            images: [{ url: 'image.jpg' }],
            category: { name: 'Category 1' },
          },
        },
      ]

      getCurrentUser.mockResolvedValueOnce(mockUser)
      cache.get.mockResolvedValueOnce(null)
      prisma.cartItem.findMany.mockResolvedValueOnce(mockCartItems)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toEqual(mockCartItems)
      expect(data.total).toBe(21.98) // 2 * 10.99
      expect(data.count).toBe(2)
      expect(cache.set).toHaveBeenCalledWith('cart:user:user-1', data, 120)
    })

    it('should handle database errors', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      const { cache } = require('@/lib/cache')
      const { prisma } = require('@/lib/prisma')

      getCurrentUser.mockResolvedValueOnce(mockUser)
      cache.get.mockResolvedValueOnce(null)
      prisma.cartItem.findMany.mockRejectedValueOnce(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch cart')
    })
  })

  describe('POST', () => {
    it('should return unauthorized when user not authenticated', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      getCurrentUser.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', quantity: 2 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create new cart item when not exists', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')
      const { cache } = require('@/lib/cache')

      const mockCartItem = {
        id: 'item-1',
        quantity: 2,
        product: {
          id: 'product-1',
          name: 'Test Product',
          images: [{ url: 'image.jpg' }],
        },
      }

      getCurrentUser.mockResolvedValueOnce(mockUser)
      prisma.cartItem.findUnique.mockResolvedValueOnce(null)
      prisma.cartItem.create.mockResolvedValueOnce(mockCartItem)

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', quantity: 2 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockCartItem)
      expect(cache.del).toHaveBeenCalledWith('cart:user:user-1')
    })

    it('should update existing cart item when exists', async () => {
      const { getCurrentUser } = require('@/lib/auth')
      const { prisma } = require('@/lib/prisma')

      const existingItem = {
        id: 'item-1',
        quantity: 1,
      }

      const updatedItem = {
        id: 'item-1',
        quantity: 3,
        product: {
          id: 'product-1',
          name: 'Test Product',
          images: [{ url: 'image.jpg' }],
        },
      }

      getCurrentUser.mockResolvedValueOnce(mockUser)
      prisma.cartItem.findUnique.mockResolvedValueOnce(existingItem)
      prisma.cartItem.update.mockResolvedValueOnce(updatedItem)

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', quantity: 2 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(updatedItem)
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 3 }, // 1 + 2
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { order: 'asc' } },
            },
          },
        },
      })
    })

    it('should handle validation errors', async () => {
      const { validateRequestBody } = require('@/lib/validation')
      const { getCurrentUser } = require('@/lib/auth')

      getCurrentUser.mockResolvedValueOnce(mockUser)
      validateRequestBody.mockReturnValueOnce(async () => ({
        success: false,
        response: new Response(JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'quantity', message: 'Quantity must be positive' }],
        }), { status: 400 }),
      }))

      const request = new NextRequest('http://localhost:3000/api/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: 'product-1', quantity: 0 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })
  })
})