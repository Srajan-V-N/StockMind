/**
 * Simple in-memory rate limiter for API routes
 * Tracks requests per client and enforces rate limits
 */

interface RateLimiterConfig {
  maxRequests: number;  // Maximum number of requests
  windowMs: number;     // Time window in milliseconds
}

export class RateLimiter {
  private requests: Map<string, number[]>;
  private maxRequests: number;
  private windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.requests = new Map();
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if a request is allowed for the given key (e.g., IP address)
   * Returns true if allowed, false if rate limit exceeded
   */
  check(key: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    // Remove old requests outside the time window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;  // Rate limit exceeded
    }

    // Add current request timestamp
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  /**
   * Get the remaining requests for a key
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];

    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clear(): void {
    this.requests.clear();
  }
}
