import { GET, POST } from '@/app/api/categories/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}))

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  },
  CacheKeys: {
    categories: () => 'categories:all'
  },
  CacheTTL: {
    LONG: 900
  }
}))

jest.mock('@/lib/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    businessEvent: jest.fn()
  }
}))

jest.mock('@/lib/validation', () => ({
  validateRequestBody: jest.fn(() => async () => ({
    success: true,
    data: {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test description'
    }
  })),
  createCategorySchema: {}
}))

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return cached categories when available', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', slug: 'category-1' },
        { id: '2', name: 'Category 2', slug: 'category-2' }
      ]

      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValueOnce(mockCategories)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCategories)
      expect(cache.get).toHaveBeenCalledWith('categories:all')
    })

    it('should fetch and cache categories when not in cache', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Category 1',
          slug: 'category-1',
          parent: null,
          children: [],
          _count: { products: 5 }
        }
      ]

      const { cache } = require('@/lib/cache')
      const { prisma } = require('@/lib/prisma')

      cache.get.mockResolvedValueOnce(null)
      prisma.category.findMany.mockResolvedValueOnce(mockCategories)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCategories)
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        include: {
          parent: true,
          children: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: "asc" },
      })
      expect(cache.set).toHaveBeenCalledWith('categories:all', mockCategories, 900)
    })

    it('should handle database errors', async () => {
      const { cache } = require('@/lib/cache')
      const { prisma } = require('@/lib/prisma')

      cache.get.mockResolvedValueOnce(null)
      prisma.category.findMany.mockRejectedValueOnce(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch categories')
    })
  })

  describe('POST', () => {
    it('should create category successfully', async () => {
      const mockCategory = {
        id: '1',
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        parent: null,
        children: []
      }

      const { prisma } = require('@/lib/prisma')
      const { cache } = require('@/lib/cache')

      prisma.category.create.mockResolvedValueOnce(mockCategory)

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test description'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockCategory)
      expect(cache.del).toHaveBeenCalledWith('categories:all')
    })

    it('should handle validation errors', async () => {
      const { validateRequestBody } = require('@/lib/validation')
      validateRequestBody.mockReturnValueOnce(async () => ({
        success: false,
        response: new Response(JSON.stringify({
          error: 'Validation failed',
          details: [{ field: 'name', message: 'Name is required' }]
        }), { status: 400 })
      }))

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('should handle database creation errors', async () => {
      const { prisma } = require('@/lib/prisma')
      prisma.category.create.mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Category',
          slug: 'test-category'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create category')
    })
  })
})