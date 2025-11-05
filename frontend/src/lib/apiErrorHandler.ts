/**
 * API Error Handler with Rate Limiting Support
 */

export interface ApiErrorResponse {
  error: string
  message: string
  details?: any[]
}

export class ApiError extends Error {
  readonly statusCode: number
  readonly errorCode: string
  readonly details?: any[]

  constructor(
    statusCode: number,
    errorCode: string,
    message: string,
    details?: any[]
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.details = details
  }
}

export class RateLimitError extends ApiError {
  readonly retryAfter: number

  constructor(retryAfter: number = 60) {
    super(429, 'RATE_LIMITED', `Too many requests. Please try again in ${retryAfter} seconds`)
    this.retryAfter = retryAfter
  }
}

/**
 * Exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on rate limit - let caller handle it
      if (error instanceof RateLimitError) {
        throw error
      }

      // Don't retry on client errors (4xx except 429)
      if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = initialDelayMs * Math.pow(2, attempt)
      const jitter = Math.random() * 1000 // Add jitter to prevent thundering herd

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay + jitter))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Parse API error response
 */
export function parseApiError(response: Response, data: any): ApiError {
  const statusCode = response.status
  const errorCode = data?.error || 'UNKNOWN_ERROR'
  const message = data?.message || `HTTP ${statusCode}`
  const details = data?.details

  if (statusCode === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
    return new RateLimitError(retryAfter)
  }

  return new ApiError(statusCode, errorCode, message, details)
}

