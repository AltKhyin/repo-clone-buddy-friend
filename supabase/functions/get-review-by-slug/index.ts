// ABOUTME: Edge function for fetching individual review details by slug with access control.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';

interface ReviewDetailResponse {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  structured_content: any;
  published_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  access_level: string;
  community_post_id: number | null;
  view_count: number | null;
  tags: string[];
}

serve(async req => {
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
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 20 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Extract slug from request (support both GET params and POST body)
    let slug;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      slug = url.searchParams.get('slug');
    } else {
      try {
        const body = await req.json();
        slug = body.slug;
      } catch (error) {
        console.error('Failed to parse request body:', error);
        throw new Error('VALIDATION_FAILED: Invalid request format');
      }
    }

    if (!slug) {
      throw new Error('VALIDATION_FAILED: Review slug is required');
    }

    // STEP 5: Authentication (Optional for reviews)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    let userSubscriptionTier = 'free';

    if (authHeader) {
      try {
        const user = await authenticateUser(supabase, authHeader);
        userId = user.id;
        userSubscriptionTier = user.user_metadata?.subscription_tier || 'free';
      } catch (authError) {
        // Continue as anonymous user for public reviews
        console.log('Authentication failed, continuing as anonymous:', authError.message);
      }
    }

    console.log(`Fetching review with slug: ${slug} for user: ${userId}`);

    // Try to parse as ID first, then fall back to title-based lookup
    const parsedId = parseInt(slug, 10);
    const isNumericId = !isNaN(parsedId) && parsedId > 0;

    let basicReview = null;
    let basicError = null;

    if (isNumericId) {
      console.log(`Looking up review by ID: ${parsedId}`);
      // Try ID-based lookup first
      let query = supabase
        .from('Reviews')
        .select(
          `
          id,
          title,
          description,
          cover_image_url,
          structured_content,
          published_at,
          access_level,
          community_post_id,
          view_count,
          author_id,
          status,
          author:Practitioners!Reviews_author_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('id', parsedId);

      // Allow access to published reviews OR draft reviews by the author
      if (userId) {
        query = query.or(`status.eq.published,and(status.eq.draft,author_id.eq.${userId})`);
      } else {
        query = query.eq('status', 'published');
      }

      const result = await query.maybeSingle();

      basicReview = result.data;
      basicError = result.error;
    }

    // Fall back to title-based lookup if ID lookup failed or wasn't attempted
    if (!basicReview && !basicError) {
      const decodedSlug = decodeURIComponent(slug);
      console.log(`Looking up review by title: ${decodedSlug}`);

      let query = supabase
        .from('Reviews')
        .select(
          `
          id,
          title,
          description,
          cover_image_url,
          structured_content,
          published_at,
          access_level,
          community_post_id,
          view_count,
          author_id,
          status,
          author:Practitioners!Reviews_author_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq('title', decodedSlug);

      // Allow access to published reviews OR draft reviews by the author
      if (userId) {
        query = query.or(`status.eq.published,and(status.eq.draft,author_id.eq.${userId})`);
      } else {
        query = query.eq('status', 'published');
      }

      const result = await query.maybeSingle();

      basicReview = result.data;
      basicError = result.error;
    }

    if (basicError) {
      console.error('Basic review fetch error:', basicError);
      throw new Error(`Failed to fetch review: ${basicError.message}`);
    }

    if (!basicReview) {
      const decodedSlug = decodeURIComponent(slug);
      console.log(`No review found with title: ${decodedSlug}`);

      // Let's also try a LIKE search to be more flexible
      let fuzzyQuery = supabase
        .from('Reviews')
        .select(
          `
          id,
          title,
          description,
          cover_image_url,
          structured_content,
          published_at,
          access_level,
          community_post_id,
          view_count,
          author_id,
          status,
          author:Practitioners!Reviews_author_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .ilike('title', `%${decodedSlug.replace(/\[.*?\]\s*/, '')}%`); // Remove [mockdata] prefix and search

      // Allow access to published reviews OR draft reviews by the author
      if (userId) {
        fuzzyQuery = fuzzyQuery.or(
          `status.eq.published,and(status.eq.draft,author_id.eq.${userId})`
        );
      } else {
        fuzzyQuery = fuzzyQuery.eq('status', 'published');
      }

      const { data: fuzzyReview } = await fuzzyQuery.maybeSingle();

      if (!fuzzyReview) {
        throw new Error('REVIEW_NOT_FOUND: Review not found');
      }

      basicReview = fuzzyReview;
    }

    const review = basicReview;

    // Add fallback for missing author data
    if (!review.author) {
      review.author = {
        id: review.author_id || 'unknown',
        full_name: 'Autor removido',
        avatar_url: null,
      };
    }

    // STEP 6: Access Control Validation
    const isPublic = review.access_level === 'public';
    const isFreeUser = userId && review.access_level === 'free_users_only';
    const isPaying =
      userId && userSubscriptionTier === 'paying' && review.access_level === 'paying_users_only';
    const hasAccess = isPublic || isFreeUser || isPaying;

    if (!hasAccess) {
      throw new Error(`ACCESS_DENIED: This content requires ${review.access_level} access level`);
    }

    // STEP 7: Fetch Tags (Non-blocking)
    let tags: string[] = [];
    try {
      const { data: tagData } = await supabase
        .from('ReviewTags')
        .select(
          `
          Tags(tag_name)
        `
        )
        .eq('review_id', review.id);

      if (tagData) {
        tags = tagData.map((rt: any) => rt.Tags?.tag_name).filter(Boolean) || [];
      }
    } catch (tagError) {
      console.warn('Failed to fetch tags, continuing without them:', tagError);
      // Continue without tags rather than failing the entire request
    }

    // Asynchronously increment view count (fire and forget) - performance optimization
    if (userId) {
      supabase
        .from('Reviews')
        .update({ view_count: (review.view_count || 0) + 1 })
        .eq('id', review.id)
        .then(() => console.log(`View count incremented for review ${review.id}`))
        .catch(err => console.error('Failed to increment view count:', err));
    }

    // STEP 8: Build Response
    const response: ReviewDetailResponse = {
      id: review.id,
      title: review.title,
      description: review.description,
      cover_image_url: review.cover_image_url,
      structured_content: review.structured_content,
      published_at: review.published_at,
      author: review.author,
      access_level: review.access_level,
      community_post_id: review.community_post_id,
      view_count: review.view_count,
      tags,
    };

    console.log(`Successfully fetched review: ${review.title} with ${tags.length} tags`);

    // STEP 9: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));
  } catch (error) {
    // STEP 10: Centralized Error Handling
    console.error('Review detail fetch error:', error);
    return createErrorResponse(error);
  }
});
