import { GET } from '@/app/api/health/route'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}))

jest.mock('@/lib/cache', () => ({
  cache: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue('test-value'),
    del: jest.fn().mockResolvedValue(true),
  },
}))

jest.mock('@/lib/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return healthy status when all checks pass', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('uptime')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('environment')
    expect(data).toHaveProperty('checks')
    expect(data.checks).toHaveProperty('database')
    expect(data.checks).toHaveProperty('redis')
    expect(data.checks).toHaveProperty('memory')
  })

  it('should return degraded status when non-critical services fail', async () => {
    // Mock Redis failure
    const { cache } = require('@/lib/cache')
    cache.set.mockRejectedValueOnce(new Error('Redis connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('degraded')
    expect(data.checks.redis.status).toBe('unhealthy')
    expect(data.checks.database.status).toBe('healthy')
  })

  it('should return unhealthy status when database fails', async () => {
    // Mock database failure
    const { prisma } = require('@/lib/prisma')
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Database connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('unhealthy')
    expect(data.checks.database.status).toBe('unhealthy')
    expect(data.checks.database.error).toContain('Database connection failed')
  })

  it('should include response times in health checks', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.checks.database).toHaveProperty('responseTime')
    expect(data.checks.redis).toHaveProperty('responseTime')
    expect(typeof data.checks.database.responseTime).toBe('number')
    expect(typeof data.checks.redis.responseTime).toBe('number')
  })

  it('should include memory usage information', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.checks.memory).toHaveProperty('usage')
    expect(data.checks.memory.usage).toHaveProperty('used')
    expect(data.checks.memory.usage).toHaveProperty('total')
    expect(data.checks.memory.usage).toHaveProperty('percentage')
    expect(typeof data.checks.memory.usage.used).toBe('number')
    expect(typeof data.checks.memory.usage.total).toBe('number')
    expect(typeof data.checks.memory.usage.percentage).toBe('number')
  })
})