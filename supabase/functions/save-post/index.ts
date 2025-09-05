
// ABOUTME: Edge function for saving/unsaving community posts with rate limiting and comprehensive error handling.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

interface SavePostRequest {
  post_id: number;
  is_saved?: boolean;
}

interface SavePostResponse {
  success: boolean;
  is_saved: boolean;
  message?: string;
}

serve(async (req) => {
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
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication (Required for saving posts)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required for saving posts');
    }

    const user = await authenticateUser(supabase, authHeader);

    // STEP 5: Input Validation
    const body: SavePostRequest = await req.json();
    
    if (!body.post_id || typeof body.post_id !== 'number') {
      throw new Error('VALIDATION_FAILED: Invalid post_id provided');
    }

    // STEP 6: Core Business Logic
    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select('id')
      .eq('id', body.post_id)
      .single();

    if (postError || !post) {
      throw new Error('POST_NOT_FOUND: Post not found');
    }

    // Check current save status
    const { data: existingSave } = await supabase
      .from('SavedPosts')
      .select('id')
      .eq('post_id', body.post_id)
      .eq('practitioner_id', user.id)
      .single();

    let isSaved: boolean;

    if (existingSave) {
      // Post is currently saved, unsave it
      const { error: deleteError } = await supabase
        .from('SavedPosts')
        .delete()
        .eq('post_id', body.post_id)
        .eq('practitioner_id', user.id);

      if (deleteError) {
        throw new Error(`Failed to unsave post: ${deleteError.message}`);
      }
      
      isSaved = false;
    } else {
      // Post is not saved, save it
      const { error: insertError } = await supabase
        .from('SavedPosts')
        .insert({
          post_id: body.post_id,
          practitioner_id: user.id
        });

      if (insertError) {
        throw new Error(`Failed to save post: ${insertError.message}`);
      }
      
      isSaved = true;
    }

    const response: SavePostResponse = {
      success: true,
      is_saved: isSaved,
      message: isSaved ? 'Post saved successfully' : 'Post removed from saved'
    };

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in save-post:', error);
    return createErrorResponse(error);
  }
});
