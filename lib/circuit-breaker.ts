/**
 * Circuit Breaker Pattern Implementation
 * Protects against cascading failures when external services are down
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

interface CircuitBreakerConfig {
  failureThreshold: number    // Number of failures before opening circuit
  recoveryTimeout: number     // Time to wait before trying again (ms)
  monitoringPeriod: number   // Time window for failure counting (ms)
  expectedErrors?: string[]   // Error types that should trip the circuit
}

interface CircuitBreakerStats {
  totalRequests: number
  failedRequests: number
  successfulRequests: number
  lastFailureTime: number | null
  lastSuccessTime: number | null
  state: CircuitState
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private lastFailureTime: number | null = null
  private lastSuccessTime: number | null = null
  private totalRequests: number = 0
  private config: CircuitBreakerConfig

  constructor(
    private name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      expectedErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
      ...config
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
      } else {
        throw new CircuitBreakerOpenError(
          `Circuit breaker is OPEN for ${this.name}. Service is unavailable.`
        )
      }
    }

    this.totalRequests++

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      // Service is back, close the circuit
      this.state = CircuitState.CLOSED
      this.failureCount = 0
    }
  }

  private onFailure(error: unknown): void {
    this.lastFailureTime = Date.now()

    // Only count expected errors towards circuit breaking
    if (this.isExpectedError(error)) {
      this.failureCount++

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed while testing, go back to OPEN
      this.state = CircuitState.OPEN
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.config.recoveryTimeout
    )
  }

  private isExpectedError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const errorCode = (error as any).code
    const errorMessage = (error as any).message || ''

    return this.config.expectedErrors!.some(expectedError =>
      errorCode === expectedError || errorMessage.includes(expectedError)
    )
  }

  getStats(): CircuitBreakerStats {
    return {
      totalRequests: this.totalRequests,
      failedRequests: this.failureCount,
      successfulRequests: this.totalRequests - this.failureCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      state: this.state
    }
  }

  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.lastFailureTime = null
  }

  forceOpen(): void {
    this.state = CircuitState.OPEN
  }

  forceClose(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CircuitBreakerOpenError'
  }
}

// Circuit breaker instances for different services
export const circuitBreakers = {
  stripe: new CircuitBreaker('stripe', {
    failureThreshold: 3,
    recoveryTimeout: 20000, // 20 seconds for payment service
  }),

  email: new CircuitBreaker('email', {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds for email service
  }),

  database: new CircuitBreaker('database', {
    failureThreshold: 3,
    recoveryTimeout: 10000, // 10 seconds for database
    expectedErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'CONNECTION_LOST']
  }),

  redis: new CircuitBreaker('redis', {
    failureThreshold: 5,
    recoveryTimeout: 15000, // 15 seconds for cache
  })
}

// Helper function to get circuit breaker stats for monitoring
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  return Object.entries(circuitBreakers).reduce((stats, [name, breaker]) => {
    stats[name] = breaker.getStats()
    return stats
  }, {} as Record<string, CircuitBreakerStats>)
}