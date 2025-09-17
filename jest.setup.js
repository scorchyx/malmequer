// Global test setup
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.REDIS_URL = 'redis://localhost:6379'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to hide certain logs during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Mock environment variables that might be missing in tests
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = 'test-key'
}

if (!process.env.FROM_EMAIL) {
  process.env.FROM_EMAIL = 'test@test.com'
}

if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_123'
}

// Increase timeout for database operations
jest.setTimeout(30000)