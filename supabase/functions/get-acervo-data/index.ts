
// ABOUTME: Optimized endpoint for fetching Acervo page data with reviews and tags in minimal queries

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import {
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  handleCorsPreflightRequest,
  RateLimitError
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Authentication (Optional for public content)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userId = 'anonymous';
    let userSubscriptionTier = 'free';

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const user = await authenticateUser(supabase, authHeader);
        userId = user.id;

        // Get user's subscription tier
        const { data: practitioner } = await supabase
          .from('Practitioners')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (practitioner) {
          userSubscriptionTier = practitioner.subscription_tier;
        }
      } catch (authError) {
        // Continue as anonymous user if auth fails
        console.log('Auth failed, continuing as anonymous:', authError);
      }
    }

    // STEP 3: Rate Limiting
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 100 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Input Validation
    if (req.method !== 'GET') {
      throw new Error('METHOD_NOT_ALLOWED: Only GET method is supported');
    }

    const url = new URL(req.url);
    const tagFilter = url.searchParams.get('tag');
    const searchQuery = url.searchParams.get('search');

    console.log(`Starting Acervo data fetch for user: ${userId}, subscription: ${userSubscriptionTier}`);

    // STEP 5: Core Business Logic (Optimized - No N+1 queries)
    
    // Query 1: Fetch all published reviews based on user's access level
    let reviewsQuery = supabase
      .from('Reviews')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        published_at,
        view_count,
        access_level
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Apply access level filtering
    if (userId === 'anonymous') {
      reviewsQuery = reviewsQuery.eq('access_level', 'public');
    } else if (userSubscriptionTier === 'free') {
      reviewsQuery = reviewsQuery.in('access_level', ['public', 'free_users_only']);
    }
    // Premium users can access all content

    const { data: reviews, error: reviewsError } = await reviewsQuery;
    if (reviewsError) {
      throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    // Query 2: Fetch ALL tag relationships and tags in a single query
    const { data: allReviewTags, error: reviewTagsError } = await supabase
      .from('ReviewTags')
      .select(`
        review_id,
        tag:Tags!inner(id, tag_name, parent_id)
      `);
    if (reviewTagsError) {
      throw new Error(`Failed to fetch review tags: ${reviewTagsError.message}`);
    }

    // Create a map for efficient lookup: review_id -> [tags]
    const reviewTagsMap = new Map<number, any[]>();
    for (const rt of allReviewTags || []) {
      if (!reviewTagsMap.has(rt.review_id)) {
        reviewTagsMap.set(rt.review_id, []);
      }
      reviewTagsMap.get(rt.review_id)?.push(rt.tag);
    }

    // Query 3: Fetch all tags for the side panel
    const { data: allTags, error: tagsError } = await supabase
      .from('Tags')
      .select('id, tag_name, parent_id')
      .order('tag_name');
    if (tagsError) {
      throw new Error(`Failed to fetch tags: ${tagsError.message}`);
    }
    const tagMap = new Map(allTags?.map(t => [t.id, t]) || []);

    // Assemble the final payload efficiently without N+1 queries
    let reviewsWithTags = (reviews || []).map(review => {
      const tagsForReview = reviewTagsMap.get(review.id) || [];
      const tagsJson: { [categoria: string]: string[] } = {};

      for (const tag of tagsForReview) {
        if (tag.parent_id === null) {
          // Parent tag
          if (!tagsJson[tag.tag_name]) {
            tagsJson[tag.tag_name] = [];
          }
        } else {
          // Child tag
          const parentTag = tagMap.get(tag.parent_id);
          if (parentTag) {
            if (!tagsJson[parentTag.tag_name]) {
              tagsJson[parentTag.tag_name] = [];
            }
            tagsJson[parentTag.tag_name].push(tag.tag_name);
          }
        }
      }
      return { ...review, tags_json: tagsJson };
    });

    // Apply client-side filtering if needed
    if (tagFilter) {
      reviewsWithTags = reviewsWithTags.filter(review => 
        Object.keys(review.tags_json).some(category => 
          category.toLowerCase().includes(tagFilter.toLowerCase()) ||
          review.tags_json[category].some(tag => 
            tag.toLowerCase().includes(tagFilter.toLowerCase())
          )
        )
      );
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      reviewsWithTags = reviewsWithTags.filter(review =>
        review.title.toLowerCase().includes(searchLower) ||
        (review.description && review.description.toLowerCase().includes(searchLower))
      );
    }

    console.log(`Fetched ${reviewsWithTags.length} reviews and ${allTags?.length || 0} tags in 3 optimized queries.`);

    const result = {
      reviews: reviewsWithTags,
      tags: allTags || [],
      user_access_level: userSubscriptionTier,
      total_reviews: reviewsWithTags.length
    };

    // STEP 6: Standardized Success Response
    return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Error in get-acervo-data:', error);
    return createErrorResponse(error);
  }
});
