
// ABOUTME: Centralized API helper functions for Edge Functions with consistent error handling and responses

import { corsHeaders } from './cors.ts';
import { RateLimitError } from './rate-limit.ts';

// Re-export for backward compatibility
export { RateLimitError };

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

// CORS preflight handler - re-exported for backward compatibility
export { handleCorsPreflightRequest } from './cors.ts';

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

// Backward compatibility aliases for functions expecting sendSuccess/sendError
export const sendSuccess = createSuccessResponse;
export const sendError = (message: string, status: number = 500, additionalHeaders: Record<string, string> = {}) => {
  return createErrorResponse(new Error(message), additionalHeaders);
};
