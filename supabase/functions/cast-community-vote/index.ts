
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoteRequest {
  post_id: number;
  vote_type: 'up' | 'down' | 'none';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: { message: 'Invalid authentication', code: 'UNAUTHORIZED' }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Check rate limit (30 votes per 60 seconds)
    const rateLimitResult = await checkRateLimit(supabase, 'cast-community-vote', user.id, 30, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...rateLimitHeaders(rateLimitResult)
        }
      });
    }

    const requestBody: VoteRequest = await req.json();
    const { post_id, vote_type } = requestBody;

    console.log('Processing community vote:', { post_id, vote_type, user_id: user.id });

    // Validate the post exists
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({
        error: { message: 'Post not found', code: 'NOT_FOUND' }
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (vote_type === 'none') {
      // Remove existing vote
      const { error: deleteError } = await supabase
        .from('CommunityPost_Votes')
        .delete()
        .eq('post_id', post_id)
        .eq('practitioner_id', user.id);

      if (deleteError) {
        console.error('Failed to remove vote:', deleteError);
        return new Response(JSON.stringify({
          error: { message: 'Failed to remove vote', code: 'DELETE_FAILED' }
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else {
      // Insert or update vote
      const { error: upsertError } = await supabase
        .from('CommunityPost_Votes')
        .upsert({
          post_id,
          practitioner_id: user.id,
          vote_type
        }, {
          onConflict: 'post_id,practitioner_id'
        });

      if (upsertError) {
        console.error('Failed to cast vote:', upsertError);
        return new Response(JSON.stringify({
          error: { message: 'Failed to cast vote', code: 'UPSERT_FAILED' }
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    console.log('Community vote cast successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Vote cast successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...rateLimitHeaders(rateLimitResult)
      }
    });

  } catch (error) {
    console.error('Community vote casting error:', error);
    
    return new Response(JSON.stringify({
      error: {
        message: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
