import { createClient, RedisClientType } from 'redis'

let redis: RedisClientType | null = null

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
      },
    })

    redis.on('error', () => {
      // Redis Client Error logged
    })

    redis.on('connect', () => {
      // Redis Client Connected
    })

    redis.on('ready', () => {
      // Redis Client Ready
    })

    redis.on('end', () => {
      // Redis Client Disconnected
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
    this.redis ??= await getRedisClient()
    return this.redis
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient()
      const value = await client.get(key)
      return value ? JSON.parse(value) : null
    } catch {
      // Cache get error ignored
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<boolean> {
    try {
      const client = await this.getClient()
      await client.setEx(key, ttlSeconds, JSON.stringify(value))
      return true
    } catch {
      // Cache set error ignored
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      await client.del(key)
      return true
    } catch {
      // Cache delete error ignored
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
    } catch {
      // Cache invalidate pattern error ignored
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient()
      const result = await client.exists(key)
      return result === 1
    } catch {
      // Cache exists error ignored
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
    } catch {
      // Cache increment error ignored
      return 0
    }
  }

  // Cache with fallback - get from cache or execute function and cache result
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlSeconds: number = 300,
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
    } catch {
      // Cache getOrSet error ignored
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