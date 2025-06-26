
// ABOUTME: Edge Function for submitting new suggestions with rate limiting and validation.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

serve(async (req: Request) => {
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

    // STEP 4: Authentication (Required for suggestions)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authorization required for submitting suggestions');
    }

    const user = await authenticateUser(supabase, authHeader);

    // STEP 5: Input Validation
    const { title, description } = await req.json();

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('VALIDATION_FAILED: Title is required');
    }

    if (title.trim().length > 200) {
      throw new Error('VALIDATION_FAILED: Title must be 200 characters or less');
    }

    if (description && typeof description === 'string' && description.trim().length > 500) {
      throw new Error('VALIDATION_FAILED: Description must be 500 characters or less');
    }

    console.log(`Submitting suggestion "${title}" by user ${user.id}`);

    // STEP 6: Core Business Logic
    const { data: newSuggestion, error: insertError } = await supabase
      .from('Suggestions')
      .insert({
        title: title.trim(),
        description: description ? description.trim() : null,
        submitted_by: user.id,
        status: 'pending',
        upvotes: 0
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to submit suggestion: ${insertError.message}`);
    }

    const response = {
      message: 'Suggestion submitted successfully',
      suggestion: newSuggestion
    };

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in submit-suggestion:', error);
    return createErrorResponse(error);
  }
});
