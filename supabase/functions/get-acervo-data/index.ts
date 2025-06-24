
// ABOUTME: Acervo data Edge Function following [DOC_5] mandatory 7-step pattern

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  authenticateUser,
  RateLimitError
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Manual Authentication (requires verify_jwt = false in config.toml)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user for rate limiting and RLS (optional for this endpoint)
    let userId = 'anonymous';
    let userSubscriptionTier = 'free';
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const user = await authenticateUser(supabase, authHeader);
        userId = user.id;
        userSubscriptionTier = user.user_metadata?.subscription_tier || 'free';
      } catch (authError) {
        console.warn('Auth verification failed, continuing as anonymous:', authError);
      }
    }

    // STEP 3: Rate Limiting Implementation
    const rateLimitResult = await checkRateLimit(supabase, 'get-acervo-data', userId, 30, 60);
    if (!rateLimitResult.allowed) {
      throw RateLimitError;
    }

    // STEP 4: Input Parsing & Validation
    // No input validation needed for this GET-like endpoint

    console.log(`Starting Acervo data fetch for user: ${userId}`);

    // STEP 5: Core Business Logic Execution
    // Fetch published reviews with RLS applied through access_level filtering
    const reviewsQuery = supabase
      .from('Reviews')
      .select(`
        review_id:id,
        title,
        description,
        cover_image_url,
        published_at,
        view_count,
        access_level
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Apply access level filtering based on user subscription
    if (userId === 'anonymous') {
      reviewsQuery.eq('access_level', 'public');
    } else if (userSubscriptionTier === 'free') {
      reviewsQuery.in('access_level', ['public', 'free_users_only']);
    }
    // Paying users see all content (no additional filter needed)

    const { data: reviews, error: reviewsError } = await reviewsQuery;

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError);
      throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    // Fetch all tags with their hierarchy
    const { data: tags, error: tagsError } = await supabase
      .from('Tags')
      .select('id, tag_name, parent_id, created_at')
      .order('tag_name');

    if (tagsError) {
      console.error('Tags fetch error:', tagsError);
      throw new Error(`Failed to fetch tags: ${tagsError.message}`);
    }

    // For each review, fetch its tags and build the tags_json structure
    const reviewsWithTags = [];
    
    for (const review of reviews || []) {
      // Fetch tags for this review
      const { data: reviewTags } = await supabase
        .from('ReviewTags')
        .select(`
          Tags!inner(
            id,
            tag_name,
            parent_id
          )
        `)
        .eq('review_id', review.review_id);

      // Build tags_json structure: { categoria: [subtags] }
      const tagsJson: { [categoria: string]: string[] } = {};
      
      if (reviewTags) {
        reviewTags.forEach((rt: any) => {
          const tag = rt.Tags;
          if (tag.parent_id === null) {
            // This is a parent category
            if (!tagsJson[tag.tag_name]) {
              tagsJson[tag.tag_name] = [];
            }
          } else {
            // This is a subtag, find its parent
            const parentTag = tags?.find(t => t.id === tag.parent_id);
            if (parentTag) {
              if (!tagsJson[parentTag.tag_name]) {
                tagsJson[parentTag.tag_name] = [];
              }
              tagsJson[parentTag.tag_name].push(tag.tag_name);
            }
          }
        });
      }

      reviewsWithTags.push({
        ...review,
        tags_json: tagsJson
      });
    }

    console.log(`Fetched ${reviewsWithTags.length} reviews and ${tags?.length || 0} tags`);

    const response = {
      reviews: reviewsWithTags,
      tags: tags || []
    };

    // STEP 6: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 7: Centralized Error Handling
    return createErrorResponse(error);
  }
});
