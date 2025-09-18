import { GET } from '@/app/api/ready/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

describe('/api/ready', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables to known good state
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      NEXTAUTH_SECRET: 'test-secret',
      NEXTAUTH_URL: 'http://localhost:3000',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return ready status when all requirements are met', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ready')
    expect(data).toHaveProperty('timestamp')
  })

  it('should return not ready when database connection fails', async () => {
    const { prisma } = require('@/lib/prisma')
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Database connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('not_ready')
    expect(data.error).toContain('Database connection failed')
  })

  it('should return not ready when required environment variables are missing', async () => {
    delete process.env.DATABASE_URL

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('not_ready')
    expect(data.error).toContain('Missing required environment variables')
    expect(data.error).toContain('DATABASE_URL')
  })

  it('should return not ready when NEXTAUTH_SECRET is missing', async () => {
    delete process.env.NEXTAUTH_SECRET

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('not_ready')
    expect(data.error).toContain('NEXTAUTH_SECRET')
  })

  it('should return not ready when NEXTAUTH_URL is missing', async () => {
    delete process.env.NEXTAUTH_URL

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('not_ready')
    expect(data.error).toContain('NEXTAUTH_URL')
  })

  it('should return not ready when multiple environment variables are missing', async () => {
    delete process.env.DATABASE_URL
    delete process.env.NEXTAUTH_SECRET

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('not_ready')
    expect(data.error).toContain('DATABASE_URL')
    expect(data.error).toContain('NEXTAUTH_SECRET')
  })
})