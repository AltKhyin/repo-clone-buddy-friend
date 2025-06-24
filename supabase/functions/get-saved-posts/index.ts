
// ABOUTME: Edge Function for retrieving user's saved posts with pagination and proper data joins.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/api-helpers.ts";
import { checkRateLimit, rateLimitHeaders } from "../_shared/rate-limit.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createErrorResponse('Authentication required', 'UNAUTHORIZED', 401);
    }

    console.log(`Get saved posts request from user: ${user.id}`);

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(supabase, 'get-saved-posts', user.id);
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

    // Parse query parameters for pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50); // Cap at 50
    const offset = page * limit;

    console.log(`Fetching saved posts: page=${page}, limit=${limit}, offset=${offset}`);

    // Fetch saved posts with full post data and author information
    const { data: savedPosts, error: savedPostsError } = await supabase
      .from('SavedPosts')
      .select(`
        id,
        created_at,
        post_id,
        CommunityPosts!inner (
          id,
          title,
          content,
          category,
          upvotes,
          downvotes,
          created_at,
          is_pinned,
          is_locked,
          flair_text,
          flair_color,
          image_url,
          video_url,
          poll_data,
          post_type,
          author:Practitioners!CommunityPosts_author_id_fkey (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('practitioner_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (savedPostsError) {
      console.error('Error fetching saved posts:', savedPostsError);
      return createErrorResponse('Failed to fetch saved posts', 'FETCH_FAILED', 500);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('SavedPosts')
      .select('*', { count: 'exact', head: true })
      .eq('practitioner_id', user.id);

    if (countError) {
      console.error('Error getting saved posts count:', countError);
      return createErrorResponse('Failed to get posts count', 'COUNT_FAILED', 500);
    }

    // Transform the data to match the expected CommunityPost interface
    const posts = savedPosts?.map(savedPost => ({
      ...savedPost.CommunityPosts,
      user_vote: null, // Will be populated by frontend if needed
      reply_count: 0, // Will be populated by frontend if needed
      is_saved: true // All posts in this response are saved
    })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`Returning ${posts.length} saved posts, page ${page + 1} of ${totalPages}`);

    return createSuccessResponse({
      posts,
      pagination: {
        page,
        limit,
        total_count: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages - 1,
        has_previous: page > 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in get-saved-posts function:', error);
    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
});
