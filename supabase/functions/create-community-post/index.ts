
// ABOUTME: Edge function for creating new community posts and comments with auto-upvote and comprehensive validation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - required for post creation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Authentication required to create posts',
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

    // Rate limiting check - 10 posts per minute
    const rateLimitResult = await checkRateLimit(supabase, `create-post:${user.id}`, 10, 60);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Rate limit exceeded. Please wait before creating another post.',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
          }
        }
      );
    }

    // Parse request body
    const body: CreatePostRequest = await req.json();
    
    // Validation
    if (!body.content || body.content.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Post content is required',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body.category || body.category.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Post category is required',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate category
    const validCategories = ['general', 'review_discussion', 'question', 'announcement', 'comment'];
    if (!validCategories.includes(body.category)) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid category provided',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Content length validation
    if (body.content.length > 10000) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Post content exceeds maximum length (10,000 characters)',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Title validation (if provided)
    if (body.title && body.title.length > 200) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Post title exceeds maximum length (200 characters)',
            code: 'VALIDATION_ERROR'
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use database function for post/comment creation with auto-upvote
    const { data: result, error: createError } = await supabase
      .rpc('create_post_and_auto_vote', {
        p_author_id: user.id,
        p_title: body.title || null,
        p_content: body.content,
        p_category: body.category,
        p_parent_id: body.parent_post_id || null // Support for comments
      });

    if (createError || !result || result.length === 0) {
      console.error('Error creating post:', createError);
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to create post',
            code: 'DATABASE_ERROR'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-community-post function:', error);
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
