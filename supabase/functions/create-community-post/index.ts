
// ABOUTME: Edge function for creating new community posts and comments with auto-upvote and comprehensive validation.

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

interface CreatePostRequest {
  title?: string;
  content: string;
  category: string;
  post_type?: 'text' | 'image' | 'video' | 'poll';
  image_url?: string;
  video_url?: string;
  poll_data?: Record<string, any>;
  review_id?: number;
  parent_post_id?: number; // This makes it a comment if provided
}

interface CreatePostResponse {
  success: boolean;
  post_id: number;
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
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 10 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication (Required for post creation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required to create posts');
    }

    const user = await authenticateUser(supabase, authHeader);

    // STEP 5: Input Validation
    const body: CreatePostRequest = await req.json();
    
    if (!body.content || body.content.trim().length === 0) {
      throw new Error('VALIDATION_FAILED: Post content is required');
    }

    if (!body.category || body.category.trim().length === 0) {
      throw new Error('VALIDATION_FAILED: Post category is required');
    }

    // Validate category
    const validCategories = ['general', 'review_discussion', 'question', 'announcement', 'comment'];
    if (!validCategories.includes(body.category)) {
      throw new Error('VALIDATION_FAILED: Invalid category provided');
    }

    // Content length validation
    if (body.content.length > 10000) {
      throw new Error('VALIDATION_FAILED: Post content exceeds maximum length (10,000 characters)');
    }

    // Title validation (if provided)
    if (body.title && body.title.length > 200) {
      throw new Error('VALIDATION_FAILED: Post title exceeds maximum length (200 characters)');
    }

    // STEP 6: Core Business Logic
    const { data: result, error: createError } = await supabase
      .rpc('create_post_and_auto_vote', {
        p_author_id: user.id,
        p_title: body.title || null,
        p_content: body.content,
        p_category: body.category,
        p_parent_id: body.parent_post_id || null // Support for comments
      });

    if (createError || !result || result.length === 0) {
      throw new Error(`Failed to create post: ${createError?.message || 'Unknown error'}`);
    }

    const newPostId = result[0].post_id;

    // Update post with multimedia fields if provided
    if (body.post_type || body.image_url || body.video_url || body.poll_data) {
      const updateData: any = {};
      
      if (body.post_type) updateData.post_type = body.post_type;
      if (body.image_url) updateData.image_url = body.image_url;
      if (body.video_url) updateData.video_url = body.video_url;
      if (body.poll_data) updateData.poll_data = body.poll_data;

      const { error: updateError } = await supabase
        .from('CommunityPosts')
        .update(updateData)
        .eq('id', newPostId);

      if (updateError) {
        console.error('Error updating post with multimedia:', updateError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Notification logic for comments
    if (body.parent_post_id) {
      // Get the parent post/comment to find its author
      const { data: parentContent } = await supabase
        .from('CommunityPosts')
        .select('author_id')
        .eq('id', body.parent_post_id)
        .single();

      // Ensure we don't notify a user for replying to themselves
      if (parentContent && parentContent.author_id !== user.id) {
        // Get user's full name for the notification
        const { data: userData } = await supabase
          .from('Practitioners')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const userName = userData?.full_name || 'Um usuário';

        // Insert the notification
        await supabase.from('Notifications').insert({
          practitioner_id: parentContent.author_id,
          content: `${userName} respondeu ao seu comentário.`,
          link: `/comunidade/${body.parent_post_id}#comment-${newPostId}`,
        });
      }
    }

    const response: CreatePostResponse = {
      success: true,
      post_id: newPostId,
      message: body.parent_post_id ? 'Comment created successfully' : 'Post created successfully'
    };

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in create-community-post:', error);
    return createErrorResponse(error);
  }
});
