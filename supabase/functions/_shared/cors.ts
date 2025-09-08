
// ABOUTME: CORS configuration and handling utilities for Edge Functions

// Dynamic network IP detection for development environments
const isValidDevelopmentOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const port = url.port;
    
    // Must be port 8080 or 8081 for development server
    if (port !== '8080' && port !== '8081') return false;
    
    // Localhost variants
    if (host === 'localhost' || host === '127.0.0.1') return true;
    
    // Private IP ranges for network development (RFC 1918)
    const privateIPRanges = [
      /^192\.168\.\d{1,3}\.\d{1,3}$/, // Home/office networks (192.168.0.0/16)
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // Corporate networks (10.0.0.0/8)  
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/ // Docker/cloud networks (172.16.0.0/12)
    ];
    
    return privateIPRanges.some(regex => regex.test(host));
  } catch {
    return false;
  }
};

// Secure CORS configuration with dynamic network IP support
const getAllowedOrigin = (requestOrigin?: string): string => {
  const staticAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',  
    'http://localhost:8080',
    'http://localhost:8081',
    // Production domains
    'https://reviews.igoreckert.com.br',
    'https://www.reviews.igoreckert.com.br',
    // Vercel deployment domains
    'https://evidens-reviews.vercel.app',
  ];
  
  // Environment variable override for additional origins
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    staticAllowedOrigins.push(...envOrigins.split(',').map(origin => origin.trim()));
  }
  
  // If no request origin provided, default to localhost
  if (!requestOrigin) {
    return staticAllowedOrigins[0];
  }
  
  // Check static allowed origins first
  if (staticAllowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Dynamic validation for development origins
  if (isValidDevelopmentOrigin(requestOrigin)) {
    return requestOrigin;
  }
  
  // Fallback to localhost if origin not allowed
  return staticAllowedOrigins[0];
};

export const getCorsHeaders = (requestOrigin?: string) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
});

// Legacy export for backward compatibility - now secure
export const corsHeaders = getCorsHeaders();

export function handleCorsPreflightRequest(req?: Request): Response {
  const origin = req?.headers.get('Origin');
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(origin)
  });
}
