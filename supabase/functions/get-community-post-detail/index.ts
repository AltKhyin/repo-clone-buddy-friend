// ABOUTME: Edge function for fetching individual community post details with user-specific data (votes, save status).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

interface PostDetailRequest {
  post_id: number;
}

serve(async req => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // STEP 2: Extract origin for CORS handling
  const origin = req.headers.get('Origin');

  try {
    // STEP 3: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 4: Rate Limiting
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 60 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 5: Authentication (optional for this endpoint)
    let user = null;
    const authHeader = req.headers.get('Authorization');

    if (authHeader) {
      try {
        user = await authenticateUser(supabase, authHeader);
      } catch (authError) {
        // Continue as anonymous user if auth fails
        console.log('Auth failed, continuing as anonymous:', authError);
      }
    }

    // STEP 6: Input Validation
    let postId: number;

    if (req.method === 'GET') {
      // Handle GET request with URL parameter
      const url = new URL(req.url);
      const postIdParam = url.searchParams.get('post_id');
      if (!postIdParam) {
        throw new Error('VALIDATION_FAILED: post_id query parameter is required');
      }
      postId = parseInt(postIdParam, 10);
      if (isNaN(postId)) {
        throw new Error('VALIDATION_FAILED: post_id must be a valid number');
      }
    } else {
      // Handle POST request with JSON body
      const body: PostDetailRequest = await req.json();
      if (!body.post_id || typeof body.post_id !== 'number') {
        throw new Error('VALIDATION_FAILED: Invalid post_id provided');
      }
      postId = body.post_id;
    }

    // STEP 7: Core Business Logic
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select(
        `
        *,
        author:Practitioners!CommunityPosts_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error('POST_NOT_FOUND: Post not found');
    }

    let userVote = null;
    let isSaved = false;
    let userCanModerate = false;

    if (user) {
      // Get user's vote on this post
      const { data: voteData } = await supabase
        .from('CommunityPost_Votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('practitioner_id', user.id)
        .single();

      userVote = voteData?.vote_type || null;

      // Check if post is saved by user
      const { data: savedData } = await supabase
        .from('SavedPosts')
        .select('id')
        .eq('post_id', postId)
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

    // Get recursive reply count for the post (includes all nested comments)
    const { data: replyCountData } = await supabase
      .rpc('get_total_comment_count', { post_id: postId });
    
    const replyCount = replyCountData || 0;

    // Format response with proper fallbacks
    const response = {
      id: post.id,
      title: post.title || 'Post sem título',
      content: post.content || '',
      category: post.category || 'geral',
      upvotes: post.upvotes || 0,
      downvotes: post.downvotes || 0,
      created_at: post.created_at,
      is_pinned: post.is_pinned || false,
      is_locked: post.is_locked || false,
      flair_text: post.flair_text || null,
      flair_color: post.flair_color || null,
      post_type: post.post_type || 'text',
      image_url: post.image_url || null,
      video_url: post.video_url || null,
      poll_data: post.poll_data || null,
      link_url: post.link_url || null,
      link_preview_data: post.link_preview_data || null,
      author: post.author || {
        id: post.author_id || null,
        full_name: 'Usuário removido',
        avatar_url: null,
      },
      user_vote: userVote,
      reply_count: replyCount || 0,
      is_saved: isSaved,
      user_can_moderate: userCanModerate,
    };

    // STEP 8: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult), origin);
  } catch (error) {
    // STEP 9: Centralized Error Handling
    console.error('Error in get-community-post-detail:', error);
    return createErrorResponse(error, {}, origin);
  }
});
