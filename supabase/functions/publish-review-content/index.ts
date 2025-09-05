// ABOUTME: Edge function for publishing V3 editor content to main Reviews table

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

interface PublishReviewRequest {
  reviewId: number;
  updateMainContent?: boolean; // Whether to update structured_content in main table
}

interface PublishReviewResponse {
  success: boolean;
  reviewId: number;
  message: string;
  contentVersion?: string;
  nodeCount?: number;
}

serve(async req => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
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

    // STEP 4: Authentication (Required for publishing)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('AUTHENTICATION_REQUIRED: Authorization header required');
    }

    const user = await authenticateUser(supabase, authHeader);
    const userId = user.id;

    // STEP 5: Parse request body
    const body: PublishReviewRequest = await req.json();
    const { reviewId, updateMainContent = true } = body;

    if (!reviewId || typeof reviewId !== 'number') {
      throw new Error('VALIDATION_FAILED: reviewId is required and must be a number');
    }

    console.log(`Publishing review content for review ${reviewId} by user ${userId}`);

    // STEP 6: Verify user has permission to publish this review
    const { data: review, error: reviewError } = await supabase
      .from('Reviews')
      .select('id, title, author_id, status')
      .eq('id', reviewId)
      .single();

    if (reviewError) {
      throw new Error(`REVIEW_NOT_FOUND: ${reviewError.message}`);
    }

    if (review.author_id !== userId) {
      throw new Error('ACCESS_DENIED: You can only publish your own reviews');
    }

    // STEP 7: Fetch V3 content from review_editor_content
    const { data: editorContent, error: editorError } = await supabase
      .from('review_editor_content')
      .select('structured_content, updated_at')
      .eq('review_id', reviewId)
      .single();

    if (editorError) {
      if (editorError.code === 'PGRST116') {
        throw new Error('NO_EDITOR_CONTENT: No editor content found for this review');
      }
      throw new Error(`EDITOR_CONTENT_ERROR: ${editorError.message}`);
    }

    // STEP 8: Validate V3 content structure
    const structuredContent = editorContent.structured_content;
    
    if (!structuredContent || structuredContent.version !== '3.0.0') {
      throw new Error('INVALID_CONTENT: Editor content must be V3.0.0 format');
    }

    if (!structuredContent.nodes || !Array.isArray(structuredContent.nodes)) {
      throw new Error('INVALID_CONTENT: V3 content must have valid nodes array');
    }

    const nodeCount = structuredContent.nodes.length;
    console.log(`Publishing V3 content with ${nodeCount} nodes`);

    // STEP 9: Update main Reviews table with V3 content (if requested)
    if (updateMainContent) {
      const { error: updateError } = await supabase
        .from('Reviews')
        .update({
          structured_content: structuredContent,
          status: 'published', // Automatically publish when content is pushed
          published_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .eq('author_id', userId); // Double-check authorization

      if (updateError) {
        throw new Error(`PUBLISH_FAILED: Failed to update review content: ${updateError.message}`);
      }

      console.log(`Successfully published V3 content to main Reviews table for review ${reviewId}`);
    }

    // STEP 10: Build Response
    const response: PublishReviewResponse = {
      success: true,
      reviewId,
      message: updateMainContent 
        ? 'Review content published successfully to main table'
        : 'Review content validated and ready for publishing',
      contentVersion: structuredContent.version,
      nodeCount,
    };

    console.log(`Publish operation completed for review ${reviewId}`);

    // STEP 11: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));
  } catch (error) {
    // STEP 12: Centralized Error Handling
    console.error('Publish review content error:', error);
    return createErrorResponse(error);
  }
});