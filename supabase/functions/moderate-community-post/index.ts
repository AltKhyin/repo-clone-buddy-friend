
// ABOUTME: Edge function for community post moderation actions (pin, lock, flair) with proper authorization checks.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

interface ModerationRequest {
  post_id: number;
  action_type: 'pin' | 'unpin' | 'lock' | 'unlock' | 'flair' | 'hide' | 'delete';
  reason?: string;
  flair_text?: string;
  flair_color?: string;
}

interface ModerationResponse {
  success: boolean;
  message: string;
}

serve(async (req) => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Rate Limiting
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 20 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication & Authorization (Required for moderation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required for moderation actions');
    }

    const user = await authenticateUser(supabase, authHeader);
    
    // Verify moderator privileges
    const { data: practitioner, error: practitionerError } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (practitionerError || !practitioner || !['admin', 'editor'].includes(practitioner.role)) {
      throw new Error('FORBIDDEN: Moderation privileges required');
    }

    // STEP 5: Input Validation
    const body: ModerationRequest = await req.json();
    
    if (!body.post_id || typeof body.post_id !== 'number') {
      throw new Error('VALIDATION_FAILED: Invalid post_id provided');
    }

    if (!body.action_type) {
      throw new Error('VALIDATION_FAILED: action_type is required');
    }

    // STEP 6: Core Business Logic
    // Use database function for moderation actions
    const { data: result, error: moderationError } = await supabase
      .rpc('handle_post_action', {
        p_post_id: body.post_id,
        p_user_id: user.id,
        p_action_type: body.action_type
      });

    if (moderationError) {
      console.error('Moderation error:', moderationError);
      
      // Handle specific error cases
      if (moderationError.message.includes('POST_NOT_FOUND')) {
        throw new Error('POST_NOT_FOUND: Post not found');
      }
      
      if (moderationError.message.includes('FORBIDDEN')) {
        throw new Error('FORBIDDEN: Insufficient permissions for this action');
      }
      
      throw new Error(`Moderation failed: ${moderationError.message}`);
    }

    // Handle flair actions separately (not covered by the database function)
    if (body.action_type === 'flair' && body.flair_text) {
      const { error: flairError } = await supabase
        .from('CommunityPosts')
        .update({
          flair_text: body.flair_text,
          flair_color: body.flair_color || null
        })
        .eq('id', body.post_id);

      if (flairError) {
        throw new Error(`Failed to update flair: ${flairError.message}`);
      }
    }

    // Log moderation action
    const { error: logError } = await supabase
      .from('CommunityModerationActions')
      .insert({
        post_id: body.post_id,
        moderator_id: user.id,
        action_type: body.action_type,
        reason: body.reason || null,
        metadata: {
          flair_text: body.flair_text || null,
          flair_color: body.flair_color || null
        }
      });

    if (logError) {
      console.error('Error logging moderation action:', logError);
      // Don't fail the operation, just log the error
    }

    const actionMessages = {
      pin: 'Post pinned successfully',
      unpin: 'Post unpinned successfully',
      lock: 'Post locked successfully',
      unlock: 'Post unlocked successfully',
      flair: 'Post flair updated successfully',
      hide: 'Post hidden successfully',
      delete: 'Post deleted successfully'
    };

    const response: ModerationResponse = {
      success: true,
      message: actionMessages[body.action_type] || 'Moderation action completed'
    };

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in moderate-community-post:', error);
    return createErrorResponse(error);
  }
});
