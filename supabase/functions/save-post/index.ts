
// ABOUTME: Edge function for saving/unsaving community posts with rate limiting and comprehensive error handling.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface SavePostRequest {
  post_id: number;
  is_saved?: boolean;
}

interface SavePostResponse {
  success: boolean;
  is_saved: boolean;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(supabase, `save-post:${clientIP}`, 30, 60); // 30 requests per minute
    
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

    // Authentication check
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
    const body: SavePostRequest = await req.json();
    
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

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('id', body.post_id)
      .single();

    if (postError || !post) {
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

    // Check current save status
    const { data: existingSave } = await supabase
      .from('SavedPosts')
      .select('id')
      .eq('post_id', body.post_id)
      .eq('practitioner_id', user.id)
      .single();

    let isSaved: boolean;

    if (existingSave) {
      // Post is currently saved, unsave it
      const { error: deleteError } = await supabase
        .from('SavedPosts')
        .delete()
        .eq('post_id', body.post_id)
        .eq('practitioner_id', user.id);

      if (deleteError) {
        console.error('Error unsaving post:', deleteError);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Failed to unsave post',
              code: 'DATABASE_ERROR'
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      isSaved = false;
    } else {
      // Post is not saved, save it
      const { error: insertError } = await supabase
        .from('SavedPosts')
        .insert({
          post_id: body.post_id,
          practitioner_id: user.id
        });

      if (insertError) {
        console.error('Error saving post:', insertError);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Failed to save post',
              code: 'DATABASE_ERROR'
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      isSaved = true;
    }

    const response: SavePostResponse = {
      success: true,
      is_saved: isSaved,
      message: isSaved ? 'Post saved successfully' : 'Post removed from saved'
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in save-post function:', error);
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
