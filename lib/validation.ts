import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Base schemas
export const emailSchema = z.string().email('Formato de email inválido').min(1, 'Email é obrigatório')
export const passwordSchema = z.string()
  .min(8, 'A password deve ter pelo menos 8 caracteres')
  .max(128, 'A password deve ter menos de 128 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'A password deve conter pelo menos uma letra minúscula, uma maiúscula e um número')

export const nameSchema = z.string()
  .min(1, 'Nome é obrigatório')
  .max(100, 'O nome deve ter menos de 100 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'O nome contém caracteres inválidos')

export const slugSchema = z.string()
  .min(1, 'Slug é obrigatório')
  .max(100, 'O slug deve ter menos de 100 caracteres')
  .regex(/^[a-z0-9-]+$/, 'O slug só pode conter letras minúsculas, números e hífens')

// CUID/CUID2 validation (Prisma default ID format)
// CUID: starts with 'c', ~25 chars, lowercase alphanumeric
// CUID2: variable length, alphanumeric (can have uppercase)
export const cuidSchema = z.string()
  .min(1, 'ID is required')
  .max(50, 'Invalid ID format')

// User validation schemas
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  slug: slugSchema,
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  comparePrice: z.number().positive().optional(),
  sku: z.string().max(50, 'SKU too long').optional(),
  inventory: z.number().int().min(0, 'Inventory cannot be negative'),
  weight: z.number().positive().optional(),
  categoryId: cuidSchema,
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    alt: z.string().max(200, 'Alt text too long').optional(),
  })).optional(),
  variants: z.array(z.object({
    name: z.string().min(1, 'Variant name required').max(50, 'Variant name too long'),
    value: z.string().min(1, 'Variant value required').max(50, 'Variant value too long'),
    price: z.number().positive().optional(),
    sku: z.string().max(50, 'SKU too long').optional(),
    inventory: z.number().int().min(0, 'Inventory cannot be negative'),
  })).optional(),
})

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: cuidSchema,
    quantity: z.number().int().positive('Quantity must be positive').max(100, 'Quantity too high'),
  })).min(1, 'Order must have at least one item'),
  shippingAddressId: cuidSchema,
  billingAddressId: cuidSchema,
  discountId: cuidSchema.optional(),
  paymentMethod: z.string().max(50, 'Payment method name too long').optional(),
  shippingMethod: z.string().max(50, 'Shipping method name too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

// Address validation schemas
export const createAddressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING']),
  firstName: nameSchema,
  lastName: nameSchema,
  company: z.string().max(100, 'Company name too long').optional(),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200, 'Address line 1 too long'),
  addressLine2: z.string().max(200, 'Address line 2 too long').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(1, 'State is required').max(100, 'State name too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code too long'),
  country: z.string().min(2, 'Country is required').max(2, 'Use ISO country code'),
  phone: z.string().max(20, 'Phone number too long').optional(),
  vatNumber: z.string().max(50, 'VAT number too long').optional(),
  isDefault: z.boolean().optional(),
})

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: cuidSchema,
  variantId: cuidSchema.optional(),
  quantity: z.number().int().positive('Quantity must be positive').max(100, 'Quantity too high'),
})

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  slug: slugSchema,
  description: z.string().max(500, 'Description too long').optional(),
  image: z.string().url('Invalid image URL').optional(),
  parentId: cuidSchema.optional(),
})

// Pagination and query validation
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, 'Page must be positive').optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  search: z.string().max(200, 'Search query too long').optional(),
  category: cuidSchema.optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
})

// Validation middleware helper
export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      return { success: true, data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          response: NextResponse.json(
            {
              error: 'Erro de validação',
              details: error.issues.map((err: z.ZodIssue) => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            },
            { status: 400 },
          ),
        }
      }

      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 },
        ),
      }
    }
  }
}

// Query params validation helper
export function validateQueryParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const validatedData = schema.parse(params)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`),
      }
    }
    return {
      success: false,
      errors: ['Invalid query parameters'],
    }
  }
}