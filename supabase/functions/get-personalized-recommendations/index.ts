
// ABOUTME: Edge Function to generate personalized review recommendations based on user interaction history.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReviewWithScore {
  id: number;
  title: string;
  description: string;
  cover_image_url: string;
  published_at: string;
  view_count: number;
  author_id: string;
  recommendationScore: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { practitionerId } = await req.json();

    if (!practitionerId) {
      return new Response(
        JSON.stringify({ error: { message: 'practitionerId is required', code: 'VALIDATION_FAILED' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating recommendations for practitioner: ${practitionerId}`);

    // Step 1: Get user's interaction history (last 20 viewed reviews)
    const { data: userHistory, error: historyError } = await supabase
      .from('Analytics_Events')
      .select('metadata')
      .eq('user_id', practitionerId)
      .eq('event_type', 'review_view')
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyError) {
      console.error('Error fetching user history:', historyError);
    }

    // Step 2: Extract review IDs from user history
    const viewedReviewIds = userHistory?.map(event => 
      event.metadata?.review_id
    ).filter(Boolean) || [];

    console.log(`User has viewed ${viewedReviewIds.length} reviews recently`);

    // Step 3: Get tags from reviews the user has interacted with
    const { data: userTags, error: tagsError } = await supabase
      .from('ReviewTags')
      .select('tag_id, Tags(name)')
      .in('review_id', viewedReviewIds);

    if (tagsError) {
      console.error('Error fetching user tags:', tagsError);
    }

    // Step 4: Create user preference vector (tag frequency map)
    const tagFrequency: Record<number, number> = {};
    userTags?.forEach(rt => {
      tagFrequency[rt.tag_id] = (tagFrequency[rt.tag_id] || 0) + 1;
    });

    console.log(`User preference vector:`, tagFrequency);

    // Step 5: Get candidate reviews (published, not recently viewed by user)
    const { data: candidateReviews, error: candidatesError } = await supabase
      .from('Reviews')
      .select(`
        id, title, description, cover_image_url, published_at, view_count, author_id,
        ReviewTags(tag_id)
      `)
      .eq('status', 'published')
      .not('id', 'in', `(${viewedReviewIds.join(',') || '0'})`)
      .order('published_at', { ascending: false })
      .limit(50);

    if (candidatesError) {
      console.error('Error fetching candidate reviews:', candidatesError);
      return new Response(
        JSON.stringify({ error: { message: 'Failed to fetch reviews', code: 'DATABASE_ERROR' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 6: Calculate recommendation scores
    const reviewsWithScores: ReviewWithScore[] = candidateReviews.map(review => {
      let score = 0;
      
      // Base score factors
      const daysSincePublish = (Date.now() - new Date(review.published_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyBonus = Math.max(0, 30 - daysSincePublish) / 30; // Bonus for recent content
      const popularityBonus = Math.log(review.view_count + 1) / 10; // Logarithmic popularity bonus

      // Tag similarity score
      const reviewTagIds = review.ReviewTags?.map(rt => rt.tag_id) || [];
      let tagSimilarityScore = 0;
      
      reviewTagIds.forEach(tagId => {
        if (tagFrequency[tagId]) {
          tagSimilarityScore += tagFrequency[tagId] * 2; // Weight user preferences highly
        }
      });

      // Combine all factors
      score = tagSimilarityScore + (recencyBonus * 5) + (popularityBonus * 2);

      return {
        ...review,
        recommendationScore: score
      };
    });

    // Step 7: Sort by recommendation score and return top 10
    const topRecommendations = reviewsWithScores
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10)
      .map(({ recommendationScore, ReviewTags, ...review }) => review);

    console.log(`Returning ${topRecommendations.length} recommendations`);

    return new Response(
      JSON.stringify(topRecommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-personalized-recommendations:', error);
    return new Response(
      JSON.stringify({ 
        error: { 
          message: 'Internal server error', 
          code: 'INTERNAL_ERROR' 
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
