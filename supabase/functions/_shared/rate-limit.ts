
// ABOUTME: Rate limiting utilities for Edge Functions

export interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
  error?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Simple in-memory rate limiting (for demonstration - in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  req: Request, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const clientIp = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `${clientIp}:${Math.floor(now / config.windowMs)}`;
  
  // Clean up old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k);
    }
  }
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };
  
  if (current.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
      error: 'Rate limit exceeded'
    };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    success: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': (result.remaining || 0).toString(),
    'X-RateLimit-Reset': (result.resetTime || 0).toString(),
  };
}

// Standard rate limit error
export const RateLimitError = new Error('RATE_LIMIT_EXCEEDED: Rate limit exceeded. Please try again later.');
