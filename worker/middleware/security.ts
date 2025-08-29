import { MiddlewareHandler } from 'hono';

/**
 * Security headers middleware
 * Adds essential security headers to all responses
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  
  // Security headers for production
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - adjust based on your needs
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  c.header('Content-Security-Policy', csp);
  
  // Permissions Policy (formerly Feature Policy)
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
};