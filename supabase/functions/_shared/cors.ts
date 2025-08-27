
// ABOUTME: CORS configuration and handling utilities for Edge Functions

// Secure CORS configuration with environment-based origins
const getAllowedOrigin = (requestOrigin?: string): string => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',  
    'http://localhost:8080',
    // Network development access
    'http://192.168.0.97:8080',
    // Production domains
    'https://reviews.igoreckert.com.br',
    'https://www.reviews.igoreckert.com.br',
    // Vercel deployment domains (if any)
    'https://evidens-reviews.vercel.app',
  ];
  
  // Allow environment variable override for production
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    allowedOrigins.push(...envOrigins.split(',').map(origin => origin.trim()));
  }
  
  // Return specific origin if allowed, otherwise first allowed origin
  return requestOrigin && allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0];
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
