import { CacheService, CacheKeys, CacheTTL } from '@/lib/cache'

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  on: jest.fn()
}

jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}))

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    jest.clearAllMocks()
    cacheService = CacheService.getInstance()
  })

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { id: '1', name: 'Test' }
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(testData))

      const result = await cacheService.get('test-key')

      expect(result).toEqual(testData)
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key')
    })

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null)

      const result = await cacheService.get('non-existent-key')

      expect(result).toBeNull()
    })

    it('should return null on Redis error', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis connection failed'))

      const result = await cacheService.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should set value with TTL successfully', async () => {
      const testData = { id: '1', name: 'Test' }
      mockRedisClient.setEx.mockResolvedValueOnce('OK')

      const result = await cacheService.set('test-key', testData, 300)

      expect(result).toBe(true)
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(testData)
      )
    })

    it('should return false on Redis error', async () => {
      mockRedisClient.setEx.mockRejectedValueOnce(new Error('Redis connection failed'))

      const result = await cacheService.set('test-key', { data: 'test' }, 300)

      expect(result).toBe(false)
    })
  })

  describe('del', () => {
    it('should delete key successfully', async () => {
      mockRedisClient.del.mockResolvedValueOnce(1)

      const result = await cacheService.del('test-key')

      expect(result).toBe(true)
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key')
    })

    it('should return false on Redis error', async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error('Redis connection failed'))

      const result = await cacheService.del('test-key')

      expect(result).toBe(false)
    })
  })

  describe('invalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      const matchingKeys = ['user:1', 'user:2', 'user:3']
      mockRedisClient.keys.mockResolvedValueOnce(matchingKeys)
      mockRedisClient.del.mockResolvedValueOnce(3)

      const result = await cacheService.invalidatePattern('user:*')

      expect(result).toBe(true)
      expect(mockRedisClient.keys).toHaveBeenCalledWith('user:*')
      expect(mockRedisClient.del).toHaveBeenCalledWith(matchingKeys)
    })

    it('should handle empty pattern matches', async () => {
      mockRedisClient.keys.mockResolvedValueOnce([])

      const result = await cacheService.invalidatePattern('nonexistent:*')

      expect(result).toBe(true)
      expect(mockRedisClient.del).not.toHaveBeenCalled()
    })
  })

  describe('getOrSet', () => {
    it('should return cached value when available', async () => {
      const cachedData = { id: '1', name: 'Cached' }
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(cachedData))

      const fetchFunction = jest.fn()
      const result = await cacheService.getOrSet('test-key', fetchFunction, 300)

      expect(result).toEqual(cachedData)
      expect(fetchFunction).not.toHaveBeenCalled()
    })

    it('should execute function and cache result when not cached', async () => {
      const freshData = { id: '1', name: 'Fresh' }
      mockRedisClient.get.mockResolvedValueOnce(null)
      mockRedisClient.setEx.mockResolvedValueOnce('OK')

      const fetchFunction = jest.fn().mockResolvedValueOnce(freshData)
      const result = await cacheService.getOrSet('test-key', fetchFunction, 300)

      expect(result).toEqual(freshData)
      expect(fetchFunction).toHaveBeenCalled()
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(freshData)
      )
    })

    it('should execute function when cache fails', async () => {
      const freshData = { id: '1', name: 'Fresh' }
      mockRedisClient.get.mockRejectedValueOnce(new Error('Cache error'))

      const fetchFunction = jest.fn().mockResolvedValueOnce(freshData)
      const result = await cacheService.getOrSet('test-key', fetchFunction, 300)

      expect(result).toEqual(freshData)
      expect(fetchFunction).toHaveBeenCalled()
    })
  })

  describe('increment', () => {
    it('should increment existing key', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(5)

      const result = await cacheService.increment('counter', 300)

      expect(result).toBe(5)
      expect(mockRedisClient.incr).toHaveBeenCalledWith('counter')
      expect(mockRedisClient.expire).not.toHaveBeenCalled()
    })

    it('should set TTL for new key', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(1)
      mockRedisClient.expire.mockResolvedValueOnce(1)

      const result = await cacheService.increment('new-counter', 300)

      expect(result).toBe(1)
      expect(mockRedisClient.expire).toHaveBeenCalledWith('new-counter', 300)
    })
  })
})

describe('CacheKeys', () => {
  it('should generate correct cache keys', () => {
    expect(CacheKeys.product('123')).toBe('product:123')
    expect(CacheKeys.user('user-1')).toBe('user:user-1')
    expect(CacheKeys.userCart('user-1')).toBe('cart:user:user-1')
    expect(CacheKeys.categories()).toBe('categories:all')
    expect(CacheKeys.productsByCategory('cat-1', 2)).toBe('products:category:cat-1:page:2')
  })
})

describe('CacheTTL', () => {
  it('should have correct TTL values', () => {
    expect(CacheTTL.SHORT).toBe(60)
    expect(CacheTTL.MEDIUM).toBe(300)
    expect(CacheTTL.LONG).toBe(900)
    expect(CacheTTL.HOUR).toBe(3600)
    expect(CacheTTL.DAY).toBe(86400)
  })
})