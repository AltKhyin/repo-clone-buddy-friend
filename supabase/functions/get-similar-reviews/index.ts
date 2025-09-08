// ABOUTME: Edge function for fetching similar reviews based on tag overlap scoring with hierarchical access control

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Inline authentication helper
async function authenticateUser(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    return null; // Anonymous user
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return null; // Invalid token, continue as anonymous
    }

    return user;
  } catch (error) {
    console.warn('Authentication failed, continuing as anonymous:', error);
    return null;
  }
}

// Inline success response
function createSuccessResponse(data: any, additionalHeaders: Record<string, string> = {}, origin?: string) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
        ...additionalHeaders,
      },
    }
  );
}

// Inline error response
function createErrorResponse(error: any, additionalHeaders: Record<string, string> = {}, origin?: string) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    message = error.message;

    if (message.startsWith('VALIDATION_FAILED:')) {
      status = 400;
      code = 'VALIDATION_FAILED';
      message = message.replace('VALIDATION_FAILED: ', '');
    } else if (message.startsWith('RATE_LIMIT_EXCEEDED:')) {
      status = 429;
      code = 'RATE_LIMIT_EXCEEDED';
      message = message.replace('RATE_LIMIT_EXCEEDED: ', '');
    }
  }

  return new Response(
    JSON.stringify({
      error: { message, code },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
        ...additionalHeaders,
      },
    }
  );
}

// HomepageReview compatible interface
interface SimilarReview {
  id: number;
  title: string;
  description: string;
  cover_image_url: string | null;
  published_at: string;
  view_count: number;
  reading_time_minutes?: number | null;
  custom_author_name?: string | null;
  custom_author_avatar_url?: string | null;
  edicao?: string | null;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  content_types?: {
    id: number;
    label: string;
    text_color: string;
    border_color: string;
    background_color: string;
  }[];
}

serve(async req => {
  // STEP 1: CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const origin = req.headers.get('Origin');

  try {
    // STEP 2: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Parse request body
    let reviewId;
    try {
      const body = await req.json();
      reviewId = body.reviewId;
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('VALIDATION_FAILED: Invalid request format');
    }

    if (!reviewId || typeof reviewId !== 'number') {
      throw new Error('VALIDATION_FAILED: Review ID is required and must be a number');
    }

    console.log(`🔍 SIMILAR REVIEWS: Finding similar reviews for review ${reviewId}`);

    // STEP 4: Authentication (Optional)
    const authHeader = req.headers.get('Authorization');
    const user = await authenticateUser(supabase, authHeader);
    
    let userId = null;
    let userSubscriptionTier = 'free';
    let userRole = null;

    if (user) {
      userId = user.id;
      userSubscriptionTier = user.user_metadata?.subscription_tier || 'free';
      
      // Extract role from JWT claims for admin bypass
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          userRole = payload.app_metadata?.role || null;
        } catch (jwtError) {
          console.warn('Failed to decode JWT for role extraction:', jwtError);
        }
      }
    }

    console.log(`🔑 SIMILAR REVIEWS: User ${userId || 'anonymous'} - Role: ${userRole || 'none'}, Tier: ${userSubscriptionTier}`);

    // STEP 5: Fetch current review's tags
    const { data: currentReviewTags, error: currentTagsError } = await supabase
      .from('ReviewTags')
      .select('tag_id')
      .eq('review_id', reviewId);

    if (currentTagsError) {
      console.error('❌ SIMILAR REVIEWS: Error fetching current review tags:', currentTagsError);
      throw new Error('Failed to fetch review tags');
    }

    if (!currentReviewTags || currentReviewTags.length === 0) {
      console.log(`📝 SIMILAR REVIEWS: Review ${reviewId} has no tags, returning empty results`);
      return createSuccessResponse([], {}, origin);
    }

    const currentTagIds = currentReviewTags.map(rt => rt.tag_id);
    console.log(`🏷️ SIMILAR REVIEWS: Current review has ${currentTagIds.length} tags:`, currentTagIds);

    // STEP 6: Build hierarchical access filter
    let accessFilter = '';
    
    // Admin bypass - admins can see all published content
    const isAdmin = userRole === 'admin' || userRole === 'editor';
    
    if (isAdmin) {
      accessFilter = `status.eq.published`; // Admins see all published content
      console.log(`✅ SIMILAR REVIEWS: Admin access - showing all published content`);
    } else if (userId) {
      // Authenticated users: public + free + premium (if they have premium tier)
      if (userSubscriptionTier === 'premium') {
        accessFilter = `status.eq.published,access_level.in.(public,free,premium)`;
        console.log(`💎 SIMILAR REVIEWS: Premium user access - showing public, free, and premium content`);
      } else {
        accessFilter = `status.eq.published,access_level.in.(public,free)`;
        console.log(`🔓 SIMILAR REVIEWS: Free user access - showing public and free content`);
      }
    } else {
      // Anonymous users: only public content
      accessFilter = `status.eq.published,access_level.eq.public`;
      console.log(`🌍 SIMILAR REVIEWS: Anonymous access - showing only public content`);
    }

    // STEP 7: Find candidate reviews with tag overlap scoring
    const { data: candidateReviews, error: candidatesError } = await supabase
      .from('Reviews')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        published_at,
        view_count,
        reading_time_minutes,
        custom_author_name,
        custom_author_avatar_url,
        edicao,
        access_level,
        status,
        author:Practitioners!Reviews_author_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        content_types:ReviewContentTypes(
          content_type:ContentTypes(
            id,
            label,
            text_color,
            border_color,
            background_color
          )
        ),
        ReviewTags(tag_id)
      `)
      .neq('id', reviewId) // Exclude current review
      .or(accessFilter)
      .order('published_at', { ascending: false })
      .limit(100); // Get larger pool for better scoring

    if (candidatesError) {
      console.error('❌ SIMILAR REVIEWS: Error fetching candidate reviews:', candidatesError);
      throw new Error('Failed to fetch candidate reviews');
    }

    if (!candidateReviews || candidateReviews.length === 0) {
      console.log('📝 SIMILAR REVIEWS: No candidate reviews found');
      return createSuccessResponse([], {}, origin);
    }

    console.log(`🔍 SIMILAR REVIEWS: Found ${candidateReviews.length} candidate reviews`);

    // STEP 8: Calculate similarity scores and include ALL reviews (with/without tag overlap)
    const reviewsWithScores = candidateReviews
      .map(review => {
        const reviewTagIds = review.ReviewTags?.map((rt: any) => rt.tag_id) || [];
        const matchingTags = reviewTagIds.filter(tagId => currentTagIds.includes(tagId));
        
        // Calculate similarity score (0 for no matches, higher for more matches)
        const tagSimilarityScore = matchingTags.length * 2; // Base score for matching tags
        
        // Recency bonus (higher score for recent content)
        const daysSincePublish = (Date.now() - new Date(review.published_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 30 - daysSincePublish) / 30 * 5; // Up to 5 points for recent content
        
        // Popularity bonus (logarithmic to prevent extreme skewing)
        const popularityBonus = Math.log(review.view_count + 1) / 10 * 2; // Up to ~2 points for popular content
        
        const totalScore = tagSimilarityScore + recencyBonus + popularityBonus;
        
        return {
          ...review,
          similarityScore: totalScore,
          matchingTagCount: matchingTags.length
        };
      })
      .sort((a, b) => {
        // First sort by similarity score (reviews with tag matches first)
        if (b.similarityScore !== a.similarityScore) {
          return b.similarityScore - a.similarityScore;
        }
        // Then by publish date (more recent first)
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });

    console.log(`🎯 SIMILAR REVIEWS: Found ${reviewsWithScores.length} total reviews (${reviewsWithScores.filter(r => r.matchingTagCount > 0).length} with tag matches)`);

    // STEP 9: Format up to 15 results for HomepageReview compatibility
    const topSimilarReviews: SimilarReview[] = reviewsWithScores
      .slice(0, 15)
      .map(review => ({
        id: review.id,
        title: review.title,
        description: review.description,
        cover_image_url: review.cover_image_url,
        published_at: review.published_at,
        view_count: review.view_count || 0,
        reading_time_minutes: review.reading_time_minutes,
        custom_author_name: review.custom_author_name,
        custom_author_avatar_url: review.custom_author_avatar_url,
        edicao: review.edicao,
        author: review.author,
        content_types: review.content_types?.map((ct: any) => ct.content_type).filter(Boolean) || []
      }));

    console.log(`✅ SIMILAR REVIEWS: Returning ${topSimilarReviews.length} similar reviews`);
    console.log(`📊 SIMILAR REVIEWS: Score distribution:`, reviewsWithScores.slice(0, 5).map(r => ({ 
      id: r.id, 
      title: r.title.substring(0, 30), 
      score: r.similarityScore.toFixed(2),
      tags: r.matchingTagCount 
    })));

    // STEP 10: Return success response
    return createSuccessResponse(topSimilarReviews, {}, origin);

  } catch (error) {
    // STEP 11: Centralized Error Handling
    console.error('💥 SIMILAR REVIEWS: Error:', error);
    return createErrorResponse(error, {}, origin);
  }
});