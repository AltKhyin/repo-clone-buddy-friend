// ABOUTME: Admin Edge Function for managing community posts linked to reviews with advanced admin controls

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

// Type definitions for request/response
interface AdminCommunityPostRequest {
  operation: 'create' | 'update' | 'delete' | 'publish' | 'schedule' | 'hide' | 'unhide';
  review_id: number;
  data?: {
    title?: string;
    content?: string;
    post_type?: 'text' | 'image' | 'video' | 'poll' | 'link';
    category?: string;
    post_status?: 'draft' | 'published' | 'scheduled' | 'hidden';
    visibility_level?: 'public' | 'hidden';
    scheduled_publish_at?: string;
    admin_notes?: string;
    // Multimedia data
    image_url?: string;
    video_url?: string;
    poll_data?: Record<string, any>;
    link_url?: string;
    link_preview_data?: Record<string, any>;
  };
  post_id?: number;
}

interface AdminCommunityPostResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

serve(async req => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const origin = req.headers.get('Origin');

  // Only allow POST requests for this endpoint
  if (req.method !== 'POST') {
    return createErrorResponse(new Error('Method not allowed'), {}, origin);
  }

  try {
    console.log('Starting admin community post management operation...');

    // STEP 2: Manual Authentication (requires verify_jwt = false in config.toml)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(new Error('UNAUTHORIZED: Authorization header is required'), {}, origin);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return createErrorResponse(new Error('UNAUTHORIZED: Invalid token'), {}, origin);
    }

    console.log(`Authenticated user: ${user.id}`);

    // STEP 3: Role-based Authorization (Admin only)
    const { data: userClaims } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userClaims || userClaims.role !== 'admin') {
      return createErrorResponse(new Error('FORBIDDEN: Admin access required'), {}, origin);
    }

    // STEP 4: Input Parsing & Validation
    const requestBody = (await req.json()) as AdminCommunityPostRequest;

    if (!requestBody.operation) {
      return createErrorResponse(
        new Error('VALIDATION_FAILED: Missing required field: operation'),
        {},
        origin
      );
    }

    if (!requestBody.review_id && requestBody.operation !== 'delete') {
      return createErrorResponse(
        new Error('VALIDATION_FAILED: Missing required field: review_id'),
        {},
        origin
      );
    }

    // Validate review exists and user has access
    if (requestBody.review_id) {
      const { data: review, error: reviewError } = await supabase
        .from('Reviews')
        .select('id, title')
        .eq('id', requestBody.review_id)
        .single();

      if (reviewError || !review) {
        return createErrorResponse(
          new Error('VALIDATION_FAILED: Review not found or access denied'),
          {},
          origin
        );
      }
    }

    console.log(`Processing ${requestBody.operation} operation for review ${requestBody.review_id}`);

    // STEP 5: Core Business Logic Execution
    let result: AdminCommunityPostResponse;

    switch (requestBody.operation) {
      case 'create':
        result = await handleCreateCommunityPost(supabase, requestBody, user.id);
        break;
      case 'update':
        result = await handleUpdateCommunityPost(supabase, requestBody, user.id);
        break;
      case 'delete':
        result = await handleDeleteCommunityPost(supabase, requestBody, user.id);
        break;
      case 'publish':
        result = await handlePublishCommunityPost(supabase, requestBody, user.id);
        break;
      case 'schedule':
        result = await handleScheduleCommunityPost(supabase, requestBody, user.id);
        break;
      case 'hide':
        result = await handleHideCommunityPost(supabase, requestBody, user.id);
        break;
      case 'unhide':
        result = await handleUnhideCommunityPost(supabase, requestBody, user.id);
        break;
      default:
        return createErrorResponse(
          new Error(`VALIDATION_FAILED: Unsupported operation: ${requestBody.operation}`),
          {},
          origin
        );
    }

    console.log('Admin community post management operation completed successfully');

    // STEP 6: Standardized Success Response
    return createSuccessResponse({
      success: true,
      data: result.data,
      message: result.message,
    }, {}, origin);
  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Admin community post management error:', error);
    return createErrorResponse(error, {}, origin);
  }
});

// =============================================================================
// Community Post Creation Operation
// =============================================================================

async function handleCreateCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, data } = request;

  if (!data || !data.title) {
    throw new Error('Missing required fields: title');
  }

  // Check if review already has a community post
  const { data: existingPost } = await supabase
    .from('CommunityPosts')
    .select('id')
    .eq('review_id', review_id)
    .single();

  if (existingPost) {
    throw new Error('Review already has a community post. Use update operation instead.');
  }

  // Get review data for author and banner image
  const { data: review } = await supabase
    .from('Reviews')
    .select('id, title, cover_image_url, author_id, published_at')
    .eq('id', review_id)
    .single();

  if (!review) {
    throw new Error('Review not found');
  }

  // Validate category
  const validCategories = [
    'discussao-geral',
    'duvida-clinica', 
    'caso-clinico',
    'evidencia-cientifica',
    'tecnologia-saude',
    'carreira-medicina',
    'bem-estar-medico',
    'review'
  ];
  const category = data.category || 'review';
  if (!validCategories.includes(category)) {
    throw new Error(`Invalid category. Valid categories: ${validCategories.join(', ')}`);
  }

  // Prepare community post data
  const postData = {
    title: data.title,
    content: data.content || '',
    category,
    post_type: data.post_type || 'image', // Default to image for review banners
    author_id: review.author_id, // Post is authored by the review author
    review_id,
    // Admin fields
    post_status: data.post_status || 'draft',
    visibility_level: data.visibility_level || 'public',
    scheduled_publish_at: data.scheduled_publish_at || null,
    admin_created_by: adminUserId,
    admin_notes: data.admin_notes || null,
    // Multimedia fields
    image_url: data.image_url || review.cover_image_url, // Use review cover as default
    video_url: data.video_url || null,
    poll_data: data.poll_data || null,
    link_url: data.link_url || null,
    link_preview_data: data.link_preview_data || null,
  };

  // Create community post
  const { data: newPost, error: createError } = await supabase
    .from('CommunityPosts')
    .insert(postData)
    .select('*')
    .single();

  if (createError) {
    throw new Error(`Failed to create community post: ${createError.message}`);
  }

  // Update review to link to community post
  const { error: updateReviewError } = await supabase
    .from('Reviews')
    .update({ community_post_id: newPost.id })
    .eq('id', review_id);

  if (updateReviewError) {
    console.error('Failed to link review to community post:', updateReviewError);
    // Don't fail the operation, just log
  }

  return {
    success: true,
    data: newPost,
    message: 'Community post created successfully',
  };
}

// =============================================================================
// Community Post Update Operation
// =============================================================================

async function handleUpdateCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, data, post_id } = request;

  let communityPostId = post_id;

  // If no post_id provided, try to find by review_id
  if (!communityPostId && review_id) {
    const { data: existingPost } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('review_id', review_id)
      .single();

    if (!existingPost) {
      throw new Error('No community post found for this review');
    }
    communityPostId = existingPost.id;
  }

  if (!communityPostId) {
    throw new Error('Community post ID is required for update');
  }

  if (!data) {
    throw new Error('Update data is required');
  }

  // Prepare update data
  const updateData: any = {
    ...data,
  };

  // Validate category if provided
  if (data.category) {
    const validCategories = [
      'discussao-geral',
      'duvida-clinica', 
      'caso-clinico',
      'evidencia-cientifica',
      'tecnologia-saude',
      'carreira-medicina',
      'bem-estar-medico',
      'review'
    ];
    if (!validCategories.includes(data.category)) {
      throw new Error(`Invalid category. Valid categories: ${validCategories.join(', ')}`);
    }
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from('CommunityPosts')
    .update(updateData)
    .eq('id', communityPostId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to update community post: ${updateError.message}`);
  }

  return {
    success: true,
    data: updatedPost,
    message: 'Community post updated successfully',
  };
}

// =============================================================================
// Community Post Deletion Operation
// =============================================================================

async function handleDeleteCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, post_id } = request;

  let communityPostId = post_id;

  // If no post_id provided, try to find by review_id
  if (!communityPostId && review_id) {
    const { data: existingPost } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('review_id', review_id)
      .single();

    if (!existingPost) {
      throw new Error('No community post found for this review');
    }
    communityPostId = existingPost.id;
  }

  if (!communityPostId) {
    throw new Error('Community post ID is required for deletion');
  }

  // Get the post to find associated review
  const { data: post } = await supabase
    .from('CommunityPosts')
    .select('review_id')
    .eq('id', communityPostId)
    .single();

  // Delete community post
  const { error: deleteError } = await supabase
    .from('CommunityPosts')
    .delete()
    .eq('id', communityPostId);

  if (deleteError) {
    throw new Error(`Failed to delete community post: ${deleteError.message}`);
  }

  // Remove reference from review if exists
  if (post?.review_id) {
    await supabase
      .from('Reviews')
      .update({ community_post_id: null })
      .eq('id', post.review_id);
  }

  return {
    success: true,
    message: 'Community post deleted successfully',
  };
}

// =============================================================================
// Community Post Publishing Operations
// =============================================================================

async function handlePublishCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, post_id } = request;

  let communityPostId = post_id;
  if (!communityPostId && review_id) {
    const { data: existingPost } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('review_id', review_id)
      .single();
    
    if (!existingPost) {
      throw new Error('No community post found for this review');
    }
    communityPostId = existingPost.id;
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from('CommunityPosts')
    .update({
      post_status: 'published',
      visibility_level: 'public',
    })
    .eq('id', communityPostId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to publish community post: ${updateError.message}`);
  }

  return {
    success: true,
    data: updatedPost,
    message: 'Community post published successfully',
  };
}

async function handleScheduleCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, post_id, data } = request;

  if (!data?.scheduled_publish_at) {
    throw new Error('Scheduled publish date is required');
  }

  let communityPostId = post_id;
  if (!communityPostId && review_id) {
    const { data: existingPost } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('review_id', review_id)
      .single();
    
    if (!existingPost) {
      throw new Error('No community post found for this review');
    }
    communityPostId = existingPost.id;
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from('CommunityPosts')
    .update({
      post_status: 'scheduled',
      scheduled_publish_at: data.scheduled_publish_at,
    })
    .eq('id', communityPostId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to schedule community post: ${updateError.message}`);
  }

  return {
    success: true,
    data: updatedPost,
    message: 'Community post scheduled successfully',
  };
}

async function handleHideCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, post_id } = request;

  let communityPostId = post_id;
  if (!communityPostId && review_id) {
    const { data: existingPost } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('review_id', review_id)
      .single();
    
    if (!existingPost) {
      throw new Error('No community post found for this review');
    }
    communityPostId = existingPost.id;
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from('CommunityPosts')
    .update({
      post_status: 'hidden',
      visibility_level: 'hidden',
    })
    .eq('id', communityPostId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to hide community post: ${updateError.message}`);
  }

  return {
    success: true,
    data: updatedPost,
    message: 'Community post hidden successfully',
  };
}

async function handleUnhideCommunityPost(
  supabase: any,
  request: AdminCommunityPostRequest,
  adminUserId: string
): Promise<AdminCommunityPostResponse> {
  const { review_id, post_id } = request;

  let communityPostId = post_id;
  if (!communityPostId && review_id) {
    const { data: existingPost } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('review_id', review_id)
      .single();
    
    if (!existingPost) {
      throw new Error('No community post found for this review');
    }
    communityPostId = existingPost.id;
  }

  const { data: updatedPost, error: updateError } = await supabase
    .from('CommunityPosts')
    .update({
      post_status: 'published',
      visibility_level: 'public',
    })
    .eq('id', communityPostId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to unhide community post: ${updateError.message}`);
  }

  return {
    success: true,
    data: updatedPost,
    message: 'Community post unhidden successfully',
  };
}