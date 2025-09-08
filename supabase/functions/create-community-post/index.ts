
// ABOUTME: Edge function for creating new community posts and comments with auto-upvote and comprehensive validation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

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
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 10 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 5: Authentication (Required for post creation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required to create posts');
    }

    const user = await authenticateUser(supabase, authHeader);

    // STEP 6: Input Validation
    const body: CreatePostRequest = await req.json();
    
    if (!body.content || body.content.trim().length === 0) {
      throw new Error('VALIDATION_FAILED: Post content is required');
    }

    if (!body.category || body.category.trim().length === 0) {
      throw new Error('VALIDATION_FAILED: Post category is required');
    }

    // Validate category - Support actual Portuguese categories used by frontend
    const validCategories = [
      // Current frontend categories (from CreatePostForm.tsx)
      'discussao-geral',
      'duvida-clinica', 
      'caso-clinico',
      'evidencia-cientifica',
      'tecnologia-saude',
      'carreira-medicina',
      'bem-estar-medico',
      // Legacy categories for backward compatibility
      'geral', 'discussao-review', 'pergunta', 'anuncio', 'comment',
      'general', 'review_discussion', 'review-discussion', 'question', 'announcement'
    ];
    if (!validCategories.includes(body.category)) {
      throw new Error('VALIDATION_FAILED: Categoria inválida fornecida. Categorias válidas: discussao-geral, duvida-clinica, caso-clinico, evidencia-cientifica, tecnologia-saude, carreira-medicina, bem-estar-medico');
    }

    // Content length validation
    if (body.content.length > 10000) {
      throw new Error('VALIDATION_FAILED: Post content exceeds maximum length (10,000 characters)');
    }

    // Title validation (if provided)
    if (body.title && body.title.length > 200) {
      throw new Error('VALIDATION_FAILED: Post title exceeds maximum length (200 characters)');
    }

    // STEP 7: Core Business Logic
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

    // Create notification for comment replies
    if (body.parent_post_id) {
      try {
        await createCommentReplyNotification(supabase, {
          parent_post_id: body.parent_post_id,
          new_comment_id: newPostId,
          commenter_id: user.id
        });
      } catch (notificationError) {
        // Log but don't fail the post creation if notification fails
        console.error('Failed to create comment reply notification:', notificationError);
      }
    }

    const response: CreatePostResponse = {
      success: true,
      post_id: newPostId,
      message: body.parent_post_id ? 'Comment created successfully' : 'Post created successfully'
    };

    // STEP 8: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult), origin);

  } catch (error) {
    // STEP 9: Centralized Error Handling
    console.error('Error in create-community-post:', error);
    return createErrorResponse(error, {}, origin);
  }
});

// Helper function for creating comment reply notifications
async function createCommentReplyNotification(supabase: any, payload: {
  parent_post_id: number;
  new_comment_id: number;
  commenter_id: string;
}) {
  // Get parent post/comment info and its author
  const { data: parentContent, error: parentError } = await supabase
    .from('CommunityPosts')
    .select(`
      id,
      title,
      author_id,
      parent_post_id,
      author:Practitioners!CommunityPosts_author_id_fkey(id, full_name)
    `)
    .eq('id', payload.parent_post_id)
    .single();

  if (parentError || !parentContent) {
    throw new Error('Parent post not found');
  }

  // Don't create notification for self-replies
  if (parentContent.author_id === payload.commenter_id) {
    return;
  }

  // Get commenter info
  const { data: commenterData } = await supabase
    .from('Practitioners')
    .select('full_name')
    .eq('id', payload.commenter_id)
    .single();

  const commenterName = commenterData?.full_name || 'Alguém';

  // Determine if this is a reply to a post or to a comment
  const isReplyToPost = !parentContent.parent_post_id;
  const contentType = isReplyToPost ? 'post' : 'comentário';
  const contentTitle = parentContent.title || 'Sem título';

  const notification = {
    operation: 'create',
    recipient_id: parentContent.author_id,
    type: 'comment_reply',
    title: `${commenterName} respondeu seu ${contentType}!`,
    message: `${commenterName} respondeu seu ${contentType} "${contentTitle}".`,
    metadata: {
      parent_post_id: payload.parent_post_id,
      new_comment_id: payload.new_comment_id,
      commenter_id: payload.commenter_id,
      commenter_name: commenterName,
      parent_title: contentTitle,
      is_reply_to_post: isReplyToPost
    }
  };

  // Call manage-notifications Edge Function
  const { error } = await supabase.functions.invoke('manage-notifications', {
    body: notification
  });

  if (error) {
    throw new Error(`Failed to create comment reply notification: ${error.message}`);
  }
}
