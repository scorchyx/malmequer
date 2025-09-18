import { NextRequest } from 'next/server'
import {
  registerSchema,
  createProductSchema,
  addToCartSchema,
  validateRequestBody,
  validateQueryParams,
  paginationSchema,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'StrongPass123',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email format')
      }
    })

    it('should reject weak password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password must be at least 8 characters')
      }
    })

    it('should reject password without required complexity', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'simpleallinlowercase',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter')
      }
    })

    it('should reject invalid name characters', () => {
      const invalidData = {
        name: 'John123Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('invalid characters')
      }
    })
  })

  describe('createProductSchema', () => {
    it('should validate correct product data', () => {
      const validData = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product',
        price: 29.99,
        inventory: 100,
        categoryId: 'clfx123456789',
      }

      const result = createProductSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative price', () => {
      const invalidData = {
        name: 'Test Product',
        slug: 'test-product',
        price: -10,
        inventory: 100,
        categoryId: 'clfx123456789',
      }

      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Price must be positive')
      }
    })

    it('should reject invalid slug format', () => {
      const invalidData = {
        name: 'Test Product',
        slug: 'Test Product With Spaces',
        price: 29.99,
        inventory: 100,
        categoryId: 'clfx123456789',
      }

      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase letters, numbers, and hyphens')
      }
    })

    it('should reject negative inventory', () => {
      const invalidData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 29.99,
        inventory: -5,
        categoryId: 'clfx123456789',
      }

      const result = createProductSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Inventory cannot be negative')
      }
    })
  })

  describe('addToCartSchema', () => {
    it('should validate correct cart data', () => {
      const validData = {
        productId: 'clfx123456789',
        quantity: 2,
      }

      const result = addToCartSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject zero quantity', () => {
      const invalidData = {
        productId: 'clfx123456789',
        quantity: 0,
      }

      const result = addToCartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Quantity must be positive')
      }
    })

    it('should reject excessive quantity', () => {
      const invalidData = {
        productId: 'clfx123456789',
        quantity: 150,
      }

      const result = addToCartSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Quantity too high')
      }
    })
  })

  describe('paginationSchema', () => {
    it('should validate correct pagination params', () => {
      const validParams = {
        page: '1',
        limit: '10',
        search: 'test query',
      }

      const result = paginationSchema.safeParse(validParams)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })

    it('should reject invalid page number', () => {
      const invalidParams = {
        page: '0',
        limit: '10',
      }

      const result = paginationSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Page must be positive')
      }
    })

    it('should reject excessive limit', () => {
      const invalidParams = {
        page: '1',
        limit: '200',
      }

      const result = paginationSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Limit must be between 1 and 100')
      }
    })
  })
})

describe('Validation Helpers', () => {
  describe('validateRequestBody', () => {
    it('should validate correct request body', async () => {
      const validBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongPass123',
      }

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        body: JSON.stringify(validBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const validator = validateRequestBody(registerSchema)
      const result = await validator(request)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validBody)
      }
    })

    it('should return error response for invalid body', async () => {
      const invalidBody = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'weak',
      }

      const request = new NextRequest('http://localhost:3000/test', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const validator = validateRequestBody(registerSchema)
      const result = await validator(request)

      expect(result.success).toBe(false)
      if (!result.success) {
        const responseData = await result.response.json()
        expect(responseData.error).toBe('Validation failed')
        expect(responseData.details).toBeInstanceOf(Array)
        expect(responseData.details.length).toBeGreaterThan(0)
      }
    })
  })

  describe('validateQueryParams', () => {
    it('should validate correct query parameters', () => {
      const searchParams = new URLSearchParams('page=1&limit=10&search=test')
      const result = validateQueryParams(paginationSchema, searchParams)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
        expect(result.data.search).toBe('test')
      }
    })

    it('should return errors for invalid query parameters', () => {
      const searchParams = new URLSearchParams('page=0&limit=200')
      const result = validateQueryParams(paginationSchema, searchParams)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeInstanceOf(Array)
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })
  })
})