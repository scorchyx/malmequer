import swaggerJSDoc from 'swagger-jsdoc'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Malmequer E-commerce API',
      version: '1.0.0',
      description: `
        Complete e-commerce backend API with authentication, product management,
        order processing, and admin capabilities.

        ## Authentication
        This API uses NextAuth.js for authentication. Most endpoints require authentication.

        ## Rate Limiting
        - General API endpoints: 30 requests per minute
        - Authentication endpoints: 10 requests per 15 minutes

        ## Caching
        - Products and categories are cached for 5-15 minutes
        - User data is cached for 2 minutes

        ## Error Handling
        All endpoints return structured error responses with appropriate HTTP status codes.
      `,
      contact: {
        name: 'API Support',
        email: 'support@malmequer.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-production-domain.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        SessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              description: 'Validation error details',
            },
          },
          required: ['error'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', nullable: true },
            email: { type: 'string' },
            emailVerified: { type: 'string', format: 'date-time', nullable: true },
            image: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', format: 'decimal' },
            comparePrice: { type: 'number', format: 'decimal', nullable: true },
            sku: { type: 'string', nullable: true },
            inventory: { type: 'integer' },
            weight: { type: 'number', format: 'decimal', nullable: true },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
            featured: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            categoryId: { type: 'string' },
            category: { $ref: '#/components/schemas/Category' },
            images: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProductImage' },
            },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string' },
            alt: { type: 'string', nullable: true },
            order: { type: 'integer' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true },
            parentId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            parent: { $ref: '#/components/schemas/Category', nullable: true },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
            _count: {
              type: 'object',
              properties: {
                products: { type: 'integer' },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            },
            totalAmount: { type: 'number', format: 'decimal' },
            subtotalAmount: { type: 'number', format: 'decimal' },
            taxAmount: { type: 'number', format: 'decimal' },
            shippingAmount: { type: 'number', format: 'decimal' },
            discountAmount: { type: 'number', format: 'decimal', nullable: true },
            paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
            paymentMethod: { type: 'string', nullable: true },
            shippingMethod: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            quantity: { type: 'integer' },
            price: { type: 'number', format: 'decimal' },
            product: { $ref: '#/components/schemas/Product' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            quantity: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            product: { $ref: '#/components/schemas/Product' },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                    responseTime: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
                redis: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                    responseTime: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
                memory: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                    usage: {
                      type: 'object',
                      properties: {
                        used: { type: 'number' },
                        total: { type: 'number' },
                        percentage: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer' },
            pages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration',
      },
      {
        name: 'Products',
        description: 'Product catalog management',
      },
      {
        name: 'Categories',
        description: 'Product category management',
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations',
      },
      {
        name: 'Orders',
        description: 'Order management',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (requires ADMIN role)',
      },
      {
        name: 'Health',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: [
    './app/api/**/*.ts',
    './docs/swagger/*.yaml',
  ],
}

export const swaggerSpec = swaggerJSDoc(options)