// ABOUTME: Content queue Edge Function using simplified pattern proven to work in production

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Set the auth header for this request
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user has admin or editor role
    const userRole = user.app_metadata?.role;
    if (!userRole || !['admin', 'editor'].includes(userRole)) {
      throw new Error('Insufficient permissions: Admin or editor role required');
    }

    // Parse request body or URL params
    let params;
    if (req.method === 'POST') {
      params = await req.json();
    } else {
      const url = new URL(req.url);
      params = {
        page: parseInt(url.searchParams.get('page') || '1'),
        limit: parseInt(url.searchParams.get('limit') || '20'),
        status: url.searchParams.get('status') || 'all',
        search: url.searchParams.get('search') || '',
        authorId: url.searchParams.get('authorId') || '',
        reviewerId: url.searchParams.get('reviewerId') || '',
        contentType: url.searchParams.get('contentType') || '',
      };
    }

    console.log('Content queue request:', params);

    // Build the base query including new metadata fields
    let query = supabase.from('Reviews').select(`
        id,
        title,
        description,
        cover_image_url,
        status,
        review_status,
        created_at,
        published_at,
        scheduled_publish_at,
        review_requested_at,
        reviewed_at,
        access_level,
        author_id,
        reviewer_id,
        publication_notes,
        view_count,
        edicao,
        original_article_title,
        original_article_authors,
        original_article_publication_date,
        study_type,
        Practitioners!Reviews_author_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        ReviewerProfile:Practitioners!Reviews_reviewer_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        ReviewContentTypes(
          ContentTypes(
            id,
            label,
            text_color,
            border_color,
            background_color
          )
        )
      `);

    // Apply filters
    if (params.status && params.status !== 'all') {
      if (params.status === 'under_review') {
        query = query.eq('review_status', 'under_review');
      } else {
        query = query.eq('status', params.status);
      }
    }

    if (params.search) {
      query = query.ilike('title', `%${params.search}%`);
    }

    if (params.authorId) {
      query = query.eq('author_id', params.authorId);
    }

    if (params.reviewerId) {
      query = query.eq('reviewer_id', params.reviewerId);
    }

    if (params.contentType && params.contentType !== 'all') {
      query = query.eq('ReviewContentTypes.content_type_id', params.contentType);
    }

    // Apply pagination
    const offset = (params.page - 1) * params.limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit - 1);

    // Execute query
    const { data: reviews, error: reviewError } = await query;

    if (reviewError) {
      console.error('Error fetching reviews:', reviewError);
      throw new Error(`Database error: ${reviewError.message}`);
    }

    // Get total count for pagination
    let countQuery = supabase.from('Reviews').select('id', { count: 'exact', head: true });

    // Apply same filters for count
    if (params.status && params.status !== 'all') {
      if (params.status === 'under_review') {
        countQuery = countQuery.eq('review_status', 'under_review');
      } else {
        countQuery = countQuery.eq('status', params.status);
      }
    }

    if (params.search) {
      countQuery = countQuery.ilike('title', `%${params.search}%`);
    }

    if (params.authorId) {
      countQuery = countQuery.eq('author_id', params.authorId);
    }

    if (params.reviewerId) {
      countQuery = countQuery.eq('reviewer_id', params.reviewerId);
    }

    if (params.contentType && params.contentType !== 'all') {
      countQuery = countQuery.eq('ReviewContentTypes.content_type_id', params.contentType);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
      throw new Error(`Count error: ${countError.message}`);
    }

    // Transform the reviews data to flatten content types
    const transformedReviews = (reviews || []).map(review => ({
      ...review,
      author: review.Practitioners ? {
        id: review.Practitioners.id,
        full_name: review.Practitioners.full_name,
        avatar_url: review.Practitioners.avatar_url
      } : null,
      reviewer: review.ReviewerProfile ? {
        id: review.ReviewerProfile.id,
        full_name: review.ReviewerProfile.full_name,
        avatar_url: review.ReviewerProfile.avatar_url
      } : null,
      content_types: (review.ReviewContentTypes || [])
        .map(rct => rct.ContentTypes)
        .filter(ct => ct !== null),
      // Remove the nested objects to clean up the response
      Practitioners: undefined,
      ReviewerProfile: undefined,
      ReviewContentTypes: undefined
    }));

    // Get summary statistics
    const { data: statusStats } = await supabase.rpc('get_content_analytics');

    // Prepare response
    const total = count || 0;
    const totalPages = Math.ceil(total / params.limit);
    const hasMore = params.page < totalPages;

    const response = {
      reviews: transformedReviews,
      posts: [], // For future community posts management
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasMore,
      },
      stats: statusStats || {
        totalReviews: 0,
        publishedReviews: 0,
        draftReviews: 0,
        totalPosts: 0,
      },
    };

    console.log('Content queue response:', {
      reviewCount: transformedReviews?.length || 0,
      total,
      page: params.page,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Content queue error:', error);

    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication')
      ? 401
      : errorMessage.includes('permissions')
        ? 403
        : 500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'Content queue fetch failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
