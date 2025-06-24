
// ABOUTME: Centralized rate limiting utility with proper Deno Request handling

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (production would use Redis/external store)
const store: RateLimitStore = {};

export const checkRateLimit = async (
  req: Request, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): Promise<{ success: boolean; error?: string; headers?: Record<string, string> }> => {
  try {
    // Generate rate limit key (IP-based by default)
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean old entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < windowStart) {
        delete store[k];
      }
    });
    
    // Check current request count
    const current = store[key];
    if (!current) {
      store[key] = { count: 1, resetTime: now + config.windowMs };
      return { 
        success: true, 
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': (config.maxRequests - 1).toString(),
          'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
        }
      };
    }
    
    if (current.count >= config.maxRequests) {
      return { 
        success: false, 
        error: 'Rate limit exceeded',
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
        }
      };
    }
    
    // Increment count
    current.count++;
    
    return { 
      success: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': (config.maxRequests - current.count).toString(),
        'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
      }
    };
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    return { success: true };
  }
};

// Admin-specific rate limiting (more restrictive)
export const checkAdminRateLimit = (req: Request) => 
  checkRateLimit(req, { windowMs: 60000, maxRequests: 50 });

// Analytics-specific rate limiting (even more restrictive due to computational cost)
export const checkAnalyticsRateLimit = (req: Request) => 
  checkRateLimit(req, { windowMs: 60000, maxRequests: 20 });
