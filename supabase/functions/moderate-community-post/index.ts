
// ABOUTME: Edge function for community post moderation actions (pin, lock, flair) with proper authorization checks.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(supabase, `moderate:${clientIP}`, 20, 60); // 20 actions per minute
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Authentication check - required for moderation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Authentication required for moderation actions',
            code: 'UNAUTHORIZED'
          }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid authentication token',
            code: 'UNAUTHORIZED'
          }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body: ModerationRequest = await req.json();
    
    if (!body.post_id || typeof body.post_id !== 'number') {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid post_id provided',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body.action_type) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'action_type is required',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
        return new Response(
          JSON.stringify({
            error: {
              message: 'Post not found',
              code: 'POST_NOT_FOUND'
            }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      if (moderationError.message.includes('FORBIDDEN')) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Insufficient permissions for this action',
              code: 'FORBIDDEN'
            }
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to execute moderation action',
            code: 'MODERATION_ERROR'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
        console.error('Error setting flair:', flairError);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Failed to set post flair',
              code: 'DATABASE_ERROR'
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in moderate-community-post function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
