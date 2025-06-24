
// ABOUTME: Edge function for fetching individual community post details with user-specific data (votes, save status).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { rateLimit } from '../_shared/rate-limit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface PostDetailRequest {
  post_id: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(supabase, `get-post-detail:${clientIP}`, 60, 60); // 60 requests per minute
    
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

    // Get authenticated user (optional for this endpoint)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const { data: { user: authUser } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      user = authUser;
    }

    // Parse request body
    const body: PostDetailRequest = await req.json();
    
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

    // Fetch post with author details
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select(`
        *,
        author:Practitioners!author_id (
          id,
          full_name,
          avatar_url
        )
      `)
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

    let userVote = null;
    let isSaved = false;
    let userCanModerate = false;

    if (user) {
      // Get user's vote on this post
      const { data: voteData } = await supabase
        .from('CommunityPost_Votes')
        .select('vote_type')
        .eq('post_id', body.post_id)
        .eq('practitioner_id', user.id)
        .single();
      
      userVote = voteData?.vote_type || null;

      // Check if post is saved by user
      const { data: savedData } = await supabase
        .from('SavedPosts')
        .select('id')
        .eq('post_id', body.post_id)
        .eq('practitioner_id', user.id)
        .single();
      
      isSaved = !!savedData;

      // Check if user can moderate (admin/editor role)
      const { data: userData } = await supabase
        .from('Practitioners')
        .select('role')
        .eq('id', user.id)
        .single();
      
      userCanModerate = userData?.role === 'admin' || userData?.role === 'editor';
    }

    // Get reply count for the post
    const { count: replyCount } = await supabase
      .from('CommunityPosts')
      .select('id', { count: 'exact' })
      .eq('parent_post_id', body.post_id);

    // Format response
    const response = {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      created_at: post.created_at,
      is_pinned: post.is_pinned || false,
      is_locked: post.is_locked || false,
      flair_text: post.flair_text,
      flair_color: post.flair_color,
      post_type: post.post_type || 'text',
      image_url: post.image_url,
      video_url: post.video_url,
      poll_data: post.poll_data,
      author: post.author,
      user_vote: userVote,
      reply_count: replyCount || 0,
      is_saved: isSaved,
      user_can_moderate: userCanModerate
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in get-community-post-detail function:', error);
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
