// ABOUTME: Community online users tracking Edge Function for real-time presence updates

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

interface OnlineUserRequest {
  action: 'update' | 'get';
  is_viewing_community?: boolean;
}

// Centralized function to fetch online users data (eliminates duplication)
async function fetchOnlineUsersData(supabase: any) {
  const [onlineUsersResult, onlineCountResult] = await Promise.all([
    supabase.rpc('get_recent_online_users', { p_limit: 10 }),
    supabase.rpc('get_online_users_count'),
  ]);

  if (onlineUsersResult.error) {
    console.error('Online users fetch error:', onlineUsersResult.error);
    throw new Error('Failed to fetch online users');
  }

  if (onlineCountResult.error) {
    console.error('Online count fetch error:', onlineCountResult.error);
    throw new Error('Failed to fetch online count');
  }

  return {
    online_users: onlineUsersResult.data || [],
    online_count: onlineCountResult.data || 0,
  };
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    console.log('Processing online users request...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle GET requests (no auth required for reading online users)
    if (req.method === 'GET') {
      console.log('Fetching online users data...');

      const data = await fetchOnlineUsersData(supabase);

      return createSuccessResponse(data, {
        'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
      });
    }

    // Handle POST requests (requires authentication)
    if (req.method !== 'POST') {
      return createErrorResponse(new Error('Method not allowed'));
    }

    // Authenticate user for POST requests
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(new Error('UNAUTHORIZED: Authorization header is required'));
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return createErrorResponse(new Error('UNAUTHORIZED: Invalid token'));
    }

    console.log(`Authenticated user: ${user.id}`);

    // Parse request body
    const requestBody = (await req.json()) as OnlineUserRequest;

    if (!requestBody.action) {
      return createErrorResponse(new Error('VALIDATION_FAILED: Missing required field: action'));
    }

    switch (requestBody.action) {
      case 'update':
        // Update user's online status
        const { error: updateError } = await supabase.rpc('update_user_online_status', {
          p_user_id: user.id,
          p_is_viewing_community: requestBody.is_viewing_community ?? true,
        });

        if (updateError) {
          console.error('Update online status error:', updateError);
          throw new Error('Failed to update online status');
        }

        console.log(`Updated online status for user ${user.id}`);

        // Return updated online users data
        const updatedData = await fetchOnlineUsersData(supabase);

        return createSuccessResponse({
          ...updatedData,
          message: 'Online status updated successfully',
        });

      case 'get':
        // Get current online users (authenticated version)
        const authData = await fetchOnlineUsersData(supabase);
        return createSuccessResponse(authData);

      default:
        return createErrorResponse(
          new Error(`VALIDATION_FAILED: Unsupported action: ${requestBody.action}`)
        );
    }
  } catch (error) {
    console.error('Community online users error:', error);
    return createErrorResponse(error);
  }
});
