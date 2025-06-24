
// ABOUTME: Community page data Edge Function following [DOC_5] mandatory 7-step pattern

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

  // Only allow POST requests for this endpoint
  if (req.method !== 'POST') {
    return createErrorResponse(new Error('Method not allowed'), 405);
  }

  try {
    console.log('Starting community page data fetch...');
    
    // STEP 2: Manual Authentication (requires verify_jwt = false in config.toml)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID for personalization and rate limiting
    let userId = '00000000-0000-0000-0000-000000000000'; // Default UUID for anonymous
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const user = await authenticateUser(supabase, authHeader);
        userId = user.id;
        console.log(`Authenticated user: ${userId}`);
      } catch (authError) {
        console.warn('Auth verification failed, continuing as anonymous:', authError);
      }
    }

    // STEP 3: Rate Limiting Implementation
    const rateLimitResult = await checkRateLimit(supabase, 'get-community-page-data', userId, 30, 60);
    if (!rateLimitResult.allowed) {
      console.log('Rate limit exceeded for user:', userId);
      throw RateLimitError;
    }

    // STEP 4: Input Parsing & Validation
    let requestBody = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.warn('Failed to parse request body, using defaults:', parseError);
    }

    const { page = 0, limit = 20 } = requestBody as any;
    const actualLimit = Math.min(limit, 50); // Cap at 50 for performance
    const offset = page * actualLimit;

    console.log(`Fetching community page data: page=${page}, limit=${actualLimit}, user=${userId}`);

    // STEP 5: Core Business Logic Execution
    
    // Fetch main feed posts with fallback strategy
    let posts = [];
    try {
      console.log('Attempting to use optimized RPC function...');
      const { data: rpcPosts, error: rpcError } = await supabase.rpc('get_community_feed_with_details', {
        p_user_id: userId,
        p_limit: actualLimit,
        p_offset: offset,
      });
      
      if (rpcError) {
        console.warn('RPC function not available, falling back to manual query:', rpcError);
        throw new Error('RPC not available');
      }
      
      posts = rpcPosts || [];
      console.log(`Successfully fetched ${posts.length} community posts via RPC`);
    } catch (rpcError) {
      console.log('Using fallback query strategy...');
      
      // Fallback: Manual query with joins
      const { data: fallbackPosts, error: fallbackError } = await supabase
        .from('CommunityPosts')
        .select(`
          id,
          title,
          content,
          category,
          upvotes,
          downvotes,
          created_at,
          is_pinned,
          is_locked,
          flair_text,
          flair_color,
          author_id,
          Practitioners!author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .is('parent_post_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + actualLimit - 1);

      if (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        throw new Error(`Failed to fetch community posts: ${fallbackError.message}`);
      }

      // Transform fallback data to match RPC structure
      posts = (fallbackPosts || []).map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        upvotes: post.upvotes || 0,
        downvotes: post.downvotes || 0,
        created_at: post.created_at,
        is_pinned: post.is_pinned || false,
        is_locked: post.is_locked || false,
        flair_text: post.flair_text,
        flair_color: post.flair_color,
        author: post.Practitioners ? {
          id: post.Practitioners.id,
          full_name: post.Practitioners.full_name,
          avatar_url: post.Practitioners.avatar_url
        } : null,
        user_vote: null, // Will need separate query for user votes in fallback
        reply_count: 0 // Will need separate query for reply counts in fallback
      }));

      console.log(`Successfully fetched ${posts.length} community posts via fallback query`);
    }

    // Calculate trending discussions
    const trendingDiscussions = (posts || [])
      .filter(post => {
        if (!post.created_at) return false;
        const postDate = new Date(post.created_at);
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        return postDate > cutoff;
      })
      .sort((a, b) => {
        const scoreA = ((a.upvotes || 0) + (a.downvotes || 0)) * 2 + (a.reply_count || 0);
        const scoreB = ((b.upvotes || 0) + (b.downvotes || 0)) * 2 + (b.reply_count || 0);
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title || 'Discussão sem título',
        content: post.content || '',
        category: post.category || 'general',
        reply_count: post.reply_count || 0,
        upvotes: post.upvotes || 0,
        created_at: post.created_at,
        author: post.author || null,
        flair_text: post.flair_text || undefined,
        is_pinned: post.is_pinned || false
      }));

    // Fetch sidebar configuration
    const { data: sidebarSettings } = await supabase
      .from('SiteSettings')
      .select('value')
      .eq('key', 'community_sidebar_settings')
      .single();

    let sidebarConfig = {
      rules: [
        'Seja respeitoso com outros membros',
        'Mantenha discussões relevantes ao tema',
        'Não faça spam ou autopromoção',
        'Use linguagem apropriada'
      ],
      links: [
        { title: 'Guia da Comunidade', url: '/comunidade/info' },
        { title: 'FAQ', url: '/faq' }
      ],
      featuredPollId: null
    };

    if (sidebarSettings?.value) {
      try {
        sidebarConfig = { ...sidebarConfig, ...JSON.parse(JSON.stringify(sidebarSettings.value)) };
      } catch (e) {
        console.warn('Failed to parse sidebar settings, using defaults');
      }
    }

    // Fetch featured poll if configured
    let featuredPoll = null;
    if (sidebarConfig.featuredPollId) {
      const { data: poll } = await supabase
        .from('Polls')
        .select(`
          id,
          question,
          total_votes,
          PollOptions (
            id,
            option_text,
            vote_count
          )
        `)
        .eq('id', sidebarConfig.featuredPollId)
        .single();
      
      featuredPoll = poll;
    }

    // Fetch recent activity
    const { data: recentActivity } = await supabase
      .from('CommunityPosts')
      .select(`
        id,
        title,
        created_at,
        Practitioners!author_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(3);

    // Construct response
    const response = {
      posts: posts || [],
      pagination: {
        page,
        limit: actualLimit,
        hasMore: (posts || []).length === actualLimit
      },
      sidebarData: {
        rules: sidebarConfig.rules,
        links: sidebarConfig.links,
        trendingDiscussions,
        featuredPoll,
        recentActivity: recentActivity || []
      }
    };

    console.log('Successfully prepared community page data');

    // STEP 6: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Community page data fetch error:', error);
    return createErrorResponse(error);
  }
});
