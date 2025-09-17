import { createClient, RedisClientType } from 'redis'

let redis: RedisClientType | null = null

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    })

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis Client Connected')
    })

    redis.on('ready', () => {
      console.log('Redis Client Ready')
    })

    redis.on('end', () => {
      console.log('Redis Client Disconnected')
    })

    await redis.connect()
  }

  return redis
}

export class CacheService {
  private static instance: CacheService
  private redis: RedisClientType | null = null

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  async getClient(): Promise<RedisClientType> {
    if (!this.redis) {
      this.redis = await getRedisClient()
    }
    return this.redis
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient()
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const client = await this.getClient()
      await client.setEx(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      await client.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(keys)
      }
      return true
    } catch (error) {
      console.error('Cache invalidate pattern error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  async increment(key: string, ttlSeconds: number = 300): Promise<number> {
    try {
      const client = await this.getClient()
      const value = await client.incr(key)
      if (value === 1) {
        await client.expire(key, ttlSeconds)
      }
      return value
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  // Cache with fallback - get from cache or execute function and cache result
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // If not in cache, execute function
      const result = await fetchFunction()

      // Cache the result
      await this.set(key, result, ttlSeconds)

      return result
    } catch (error) {
      console.error('Cache getOrSet error:', error)
      // If cache fails, still execute the function
      return await fetchFunction()
    }
  }
}

export const cache = CacheService.getInstance()

// Cache key generators
export const CacheKeys = {
  // Products
  product: (id: string) => `product:${id}`,
  products: (params: string) => `products:${params}`,
  productsByCategory: (categoryId: string, page: number = 1) => `products:category:${categoryId}:page:${page}`,
  featuredProducts: () => 'products:featured',

  // Categories
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  categoryHierarchy: () => 'categories:hierarchy',

  // Users
  user: (id: string) => `user:${id}`,
  userCart: (userId: string) => `cart:user:${userId}`,
  userOrders: (userId: string, page: number = 1) => `orders:user:${userId}:page:${page}`,

  // Orders
  order: (id: string) => `order:${id}`,
  orderByNumber: (orderNumber: string) => `order:number:${orderNumber}`,

  // Admin stats
  adminStats: () => 'admin:stats',
  recentOrders: () => 'admin:orders:recent',

  // Search
  search: (query: string, page: number = 1) => `search:${encodeURIComponent(query)}:page:${page}`,
} as const

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 900,          // 15 minutes
  HOUR: 3600,         // 1 hour
  DAY: 86400,         // 24 hours
  WEEK: 604800,       // 7 days
} as const