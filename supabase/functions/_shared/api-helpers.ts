
// ABOUTME: Centralized API helper functions for Edge Functions with consistent error handling and responses

import { corsHeaders } from './cors.ts';

// Standard error types
export const RateLimitError = new Error('RATE_LIMIT_EXCEEDED: Rate limit exceeded. Please try again later.');

// Enhanced authentication helper
export async function authenticateUser(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    throw new Error('UNAUTHORIZED: Authorization header is required');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    throw new Error('UNAUTHORIZED: Invalid authentication token');
  }

  return user;
}

// CORS preflight handler
export function handleCorsPreflightRequest(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Standardized success response
export function createSuccessResponse(data: any, additionalHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...additionalHeaders
    }
  });
}

// Standardized error response with proper error handling
export function createErrorResponse(error: any, additionalHeaders: Record<string, string> = {}) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;
    
    // Extract status and code from structured error messages
    if (message.startsWith('UNAUTHORIZED:')) {
      status = 401;
      code = 'UNAUTHORIZED';
      message = message.replace('UNAUTHORIZED: ', '');
    } else if (message.startsWith('FORBIDDEN:')) {
      status = 403;
      code = 'FORBIDDEN';
      message = message.replace('FORBIDDEN: ', '');
    } else if (message.startsWith('VALIDATION_FAILED:')) {
      status = 400;
      code = 'VALIDATION_FAILED';
      message = message.replace('VALIDATION_FAILED: ', '');
    } else if (message.startsWith('RATE_LIMIT_EXCEEDED:')) {
      status = 429;
      code = 'RATE_LIMIT_EXCEEDED';
      message = message.replace('RATE_LIMIT_EXCEEDED: ', '');
    }
  }

  return new Response(JSON.stringify({
    error: { message, code }
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...additionalHeaders
    }
  });
}
