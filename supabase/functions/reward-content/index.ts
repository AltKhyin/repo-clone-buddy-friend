
// ABOUTME: Edge function for admins/editors to reward community content with comprehensive security checks.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface RewardRequest {
  content_id: number;
}

interface RewardResponse {
  success: boolean;
  rewarded_content: any;
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(supabase, `reward-content:${clientIP}`, 20, 60); // 20 rewards per minute
    
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

    // Authentication and Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED'
          }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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

    // Security check: Only admins and editors can reward content
    const userRole = user.app_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'editor') {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Forbidden: Insufficient permissions',
            code: 'FORBIDDEN'
          }
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Input validation
    const body: RewardRequest = await req.json();
    if (!body.content_id || typeof body.content_id !== 'number') {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid content_id provided',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Business logic: Update the content to be rewarded
    const { data, error: updateError } = await supabase
      .from('CommunityPosts')
      .update({ is_rewarded: true })
      .eq('id', body.content_id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // No rows returned
        return new Response(
          JSON.stringify({
            error: {
              message: 'Content not found',
              code: 'NOT_FOUND'
            }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw updateError;
    }

    // Return success response
    const response: RewardResponse = {
      success: true,
      rewarded_content: data,
      message: 'Content rewarded successfully'
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error in reward-content function:', error);
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
