import { Context, MiddlewareHandler } from 'hono';

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  message?: string;  // Error message
  keyGenerator?: (c: Context) => string; // Function to generate key
}

// Simple in-memory store (consider using KV or Durable Objects for production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * Limits the number of requests from a single IP address
 */
export const rateLimit = (options: RateLimitOptions): MiddlewareHandler => {
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100, // 100 requests per window default
    message = 'Too many requests, please try again later.',
    keyGenerator = (c) => c.req.header('CF-Connecting-IP') || 'unknown',
  } = options;

  return async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    
    // Clean up old entries
    for (const [k, v] of requestCounts.entries()) {
      if (v.resetTime < now) {
        requestCounts.delete(k);
      }
    }
    
    // Get or create request count for this key
    let requestCount = requestCounts.get(key);
    
    if (!requestCount || requestCount.resetTime < now) {
      requestCount = {
        count: 0,
        resetTime: now + windowMs,
      };
      requestCounts.set(key, requestCount);
    }
    
    requestCount.count++;
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - requestCount.count).toString());
    c.header('X-RateLimit-Reset', new Date(requestCount.resetTime).toISOString());
    
    // Check if limit exceeded
    if (requestCount.count > max) {
      c.header('Retry-After', Math.ceil((requestCount.resetTime - now) / 1000).toString());
      return c.json({ error: message }, 429);
    }
    
    await next();
  };
};

// Specific rate limiters for different endpoints
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many requests for this resource',
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per 15 minutes
  message: 'Too many authentication attempts',
});