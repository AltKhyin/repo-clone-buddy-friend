// ABOUTME: Consolidated homepage feed data with layout configuration and user personalization.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// Inline CORS headers (replacing problematic shared import)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// --- Define TypeScript interfaces for our data shapes for type safety ---
interface Review {
  id: number;
  title: string;
  description: string;
  cover_image_url: string;
  published_at: string;
  view_count: number;
  // Dynamic review card fields
  reading_time_minutes?: number | null;
  custom_author_name?: string | null;
  custom_author_avatar_url?: string | null;
  custom_author_description?: string | null;
  edicao?: string | null;
  // Author and content type data
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    profession?: string | null;
  } | null;
  content_types?: {
    id: number;
    label: string;
    text_color: string;
    border_color: string;
    background_color: string;
  }[];
}
interface Suggestion {
  id: number;
  title: string;
  description: string | null;
  upvotes: number;
  created_at: string;
  Practitioners: {
    full_name: string;
    avatar_url?: string | null;
  } | null;
  user_has_voted?: boolean;
}
interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_tier: string;
}
interface ConsolidatedHomepageData {
  layout: string[];
  featured: Review | null;
  recent: Review[];
  popular: Review[];
  recommendations: Review[];
  suggestions: Suggestion[];
  userProfile: UserProfile | null;
  notificationCount: number;
}

// Helper to safely extract data from settled promises
const getResultData = (result: PromiseSettledResult<any>, fallback: any = null) => {
  if (result.status === 'fulfilled' && result.value && result.value.data !== undefined) {
    return result.value.data;
  }
  if (result.status === 'rejected') {
    console.error('A promise failed:', result.reason);
  }
  return fallback;
};

// Helper to transform review data with proper content_types structure
const transformReviewData = (reviews: any[]): Review[] => {
  if (!Array.isArray(reviews)) return [];

  return reviews.map(review => ({
    ...review,
    content_types: review.content_types?.map((ctRel: any) => ctRel.content_type) || [],
  }));
};

// Helper to transform single review data
const transformSingleReview = (review: any): Review | null => {
  if (!review) return null;

  return {
    ...review,
    content_types: review.content_types?.map((ctRel: any) => ctRel.content_type) || [],
  };
};

// --- Main server logic ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- Robust User Identification ---
    const authHeader = req.headers.get('Authorization');
    let practitionerId: string | null = null;
    if (authHeader) {
      const userResponse = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (userResponse.data?.user) {
        practitionerId = userResponse.data.user.id;
      }
    }

    // --- Define all data queries ---
    const promises = [
      supabase.from('SiteSettings').select('value').eq('key', 'homepage_layout').single(),
      supabase.from('SiteSettings').select('value').eq('key', 'featured_review_id').single(),
      supabase
        .from('Reviews')
        .select(
          `
        id, title, description, cover_image_url, published_at, view_count,
        reading_time_minutes, custom_author_name, custom_author_avatar_url, custom_author_description, edicao,
        author:Practitioners!Reviews_author_id_fkey(id, full_name, avatar_url, profession),
        content_types:ReviewContentTypes(
          content_type:ContentTypes(id, label, text_color, border_color, background_color)
        )
      `
        )
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10),
      // Use the robust RPC function to get suggestions with user vote status and recency boost
      supabase.rpc('get_homepage_suggestions', { p_user_id: practitionerId }),
      supabase
        .from('Reviews')
        .select(
          `
        id, title, description, cover_image_url, published_at, view_count,
        reading_time_minutes, custom_author_name, custom_author_avatar_url, custom_author_description, edicao,
        author:Practitioners!Reviews_author_id_fkey(id, full_name, avatar_url, profession),
        content_types:ReviewContentTypes(
          content_type:ContentTypes(id, label, text_color, border_color, background_color)
        )
      `
        )
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(10),
      practitionerId
        ? supabase.functions.invoke('get-personalized-recommendations', {
            body: { practitionerId },
          })
        : Promise.resolve({ data: [] }),
      practitionerId
        ? supabase.from('Practitioners').select('*').eq('id', practitionerId).single()
        : Promise.resolve({ data: null }),
      practitionerId
        ? supabase
            .from('Notifications')
            .select('*', { count: 'exact', head: true })
            .eq('practitioner_id', practitionerId)
            .eq('is_read', false)
        : Promise.resolve({ data: null, count: 0 }),
    ];

    const results = await Promise.allSettled(promises);
    const [
      layoutResult,
      featuredReviewIdResult,
      recentResult,
      suggestionsResult,
      popularResult,
      recommendationsResult,
      userProfileResult,
      notificationCountResult,
    ] = results;

    // --- Featured Review Logic: Manual vs Automatic Selection ---
    let featuredReview: Review | null = null;
    const featuredReviewId = getResultData(featuredReviewIdResult, null)?.value;

    if (featuredReviewId && featuredReviewId !== 'null' && featuredReviewId !== null) {
      // Manual selection: try to fetch the specific review
      const { data: manualFeaturedReview } = await supabase
        .from('Reviews')
        .select(`
          id, title, description, cover_image_url, published_at, view_count,
          reading_time_minutes, custom_author_name, custom_author_avatar_url, custom_author_description, edicao,
          author:Practitioners!Reviews_author_id_fkey(id, full_name, avatar_url, profession),
          content_types:ReviewContentTypes(
            content_type:ContentTypes(id, label, text_color, border_color, background_color)
          )
        `)
        .eq('id', featuredReviewId)
        .eq('status', 'published')
        .maybeSingle();

      if (manualFeaturedReview) {
        featuredReview = transformSingleReview(manualFeaturedReview);
      }
    }

    // Fallback: if no manual selection or manual selection failed, use most recent
    if (!featuredReview) {
      const { data: autoFeaturedReview } = await supabase
        .from('Reviews')
        .select(`
          id, title, description, cover_image_url, published_at, view_count,
          reading_time_minutes, custom_author_name, custom_author_avatar_url, custom_author_description, edicao,
          author:Practitioners!Reviews_author_id_fkey(id, full_name, avatar_url, profession),
          content_types:ReviewContentTypes(
            content_type:ContentTypes(id, label, text_color, border_color, background_color)
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      featuredReview = transformSingleReview(autoFeaturedReview);
    }

    // --- CORRECTLY Assemble the final response object ---
    const responseData: ConsolidatedHomepageData = {
      // THE FIX: Directly access the 'value' property. It's already an array.
      layout: getResultData(layoutResult)?.value || [
        'featured',
        'recent',
        'suggestions',
        'popular',
      ],
      featured: featuredReview,
      // Filter out featured review from both recent and popular to avoid duplication
      recent: transformReviewData(getResultData(recentResult, [])).filter(
        review => featuredReview ? review.id !== featuredReview.id : true
      ),
      popular: transformReviewData(getResultData(popularResult, [])).filter(
        review => featuredReview ? review.id !== featuredReview.id : true
      ),
      suggestions: getResultData(suggestionsResult, []),
      recommendations: transformReviewData(getResultData(recommendationsResult, [])),
      userProfile: getResultData(userProfileResult, null),
      notificationCount:
        notificationCountResult.status === 'fulfilled' && notificationCountResult.value.count
          ? notificationCountResult.value.count
          : 0,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Critical error in get-homepage-feed:', error.message);
    return new Response(
      JSON.stringify({
        error: { message: error.message, code: 'INTERNAL_ERROR' },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
