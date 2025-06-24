
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

export const checkRateLimitRequest = async (
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
  checkRateLimitRequest(req, { windowMs: 60000, maxRequests: 50 });

// Analytics-specific rate limiting (even more restrictive due to computational cost)
export const checkAnalyticsRateLimit = (req: Request) => 
  checkRateLimitRequest(req, { windowMs: 60000, maxRequests: 20 });

// Database-based rate limiting (alternative pattern for user-specific limits)
export const checkRateLimitDB = async (
  supabase: any,
  action: string,
  userId: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; error?: string }> => {
  try {
    // For database-based pattern, simulate rate limiting check
    // In production, this would query a rate_limit_log table
    const key = `${action}:${userId}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Clean and check in-memory store (fallback)
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < windowStart) {
        delete store[k];
      }
    });
    
    const current = store[key];
    if (!current) {
      store[key] = { count: 1, resetTime: now + (windowSeconds * 1000) };
      return { allowed: true };
    }
    
    if (current.count >= maxRequests) {
      return { allowed: false, error: 'Rate limit exceeded' };
    }
    
    current.count++;
    return { allowed: true };
    
  } catch (error) {
    console.error('Database rate limiting error:', error);
    return { allowed: true }; // Fail open
  }
};

// Unified checkRateLimit function that handles both patterns
export async function checkRateLimit(
  supabaseOrReq: any,
  actionOrConfig: string | RateLimitConfig,
  userId?: string,
  maxRequests?: number,
  windowSeconds?: number
): Promise<{ success?: boolean; allowed?: boolean; error?: string; headers?: Record<string, string> }> {
  // Pattern 1: Modern request-based rate limiting
  if (supabaseOrReq instanceof Request || (supabaseOrReq && supabaseOrReq.headers && typeof actionOrConfig === 'object')) {
    const result = await checkRateLimitRequest(supabaseOrReq, actionOrConfig as RateLimitConfig);
    return { success: result.success, headers: result.headers };
  }
  
  // Pattern 2: Database-based rate limiting (legacy)
  if (typeof actionOrConfig === 'string') {
    const result = await checkRateLimitDB(supabaseOrReq, actionOrConfig, userId || 'anonymous', maxRequests, windowSeconds);
    return { allowed: result.allowed, error: result.error };
  }
  
  // Fallback
  return { success: true, allowed: true };
}

// Helper function for rate limit headers
export const rateLimitHeaders = (result: { success?: boolean; allowed?: boolean; headers?: Record<string, string> }) => {
  return result.headers || {};
};

// Compatibility alias for functions expecting 'rateLimit' import
export const rateLimit = checkRateLimit;
