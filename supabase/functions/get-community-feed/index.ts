
// ABOUTME: Optimized community feed endpoint using RPC to eliminate N+1 queries.

import { 
  serve,
  createClient,
  corsHeaders,
  handleCorsPreflightRequest,
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  checkRateLimit,
  rateLimitHeaders,
  RateLimitError
} from '../_shared/imports.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user ID for personalization and rate limiting
    const authHeader = req.headers.get('Authorization');
    let userId = '00000000-0000-0000-0000-000000000000'; // Default UUID for anonymous
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        userId = user.id;
      }
    }

    // Check rate limit (30 requests per 60 seconds)
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const offset = page * limit;

    console.log(`Fetching community feed via RPC: page=${page}, limit=${limit}, user=${userId}`);

    // *** THE FIX: Call the optimized RPC instead of building complex queries ***
    const { data: posts, error } = await supabase.rpc('get_community_feed_with_details', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    });
        
    if (error) {
      console.error('Community feed RPC error:', error);
      throw new Error(`Failed to fetch community posts: ${error.message}`);
    }

    console.log(`Successfully fetched ${(posts || []).length} community posts via RPC`);

    // The data is already in the correct shape, so we can return it directly
    return createSuccessResponse({
      posts: posts || [],
      pagination: {
        page,
        limit,
        hasMore: (posts || []).length === limit
      }
    }, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    console.error('Community feed fetch error:', error);
    return createErrorResponse(error);
  }
});
