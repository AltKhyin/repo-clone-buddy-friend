
// ABOUTME: Edge function for fetching individual community post details with user-specific data (votes, save status).

import { 
  serve,
  createClient,
  corsHeaders,
  handleCorsPreflightRequest,
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  checkRateLimit,
  rateLimitHeaders,
  RateLimitError
} from '../_shared/imports.ts';

interface PostDetailRequest {
  post_id: number;
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
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 60 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication (optional for this endpoint)
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

    // STEP 5: Input Validation
    const body: PostDetailRequest = await req.json();
    
    if (!body.post_id || typeof body.post_id !== 'number') {
      throw new Error('VALIDATION_FAILED: Invalid post_id provided');
    }

    // STEP 6: Core Business Logic
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

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in get-community-post-detail:', error);
    return createErrorResponse(error);
  }
});
