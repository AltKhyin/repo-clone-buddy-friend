
// ABOUTME: Analytics dashboard Edge Function using standardized pattern

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';
import { authenticateUser } from '../_shared/api-helpers.ts';
import { createSuccessResponse, createErrorResponse } from '../_shared/api-helpers.ts';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  
  // Step 1: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Step 2: Rate limiting
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 50 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // Step 3: Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required for analytics access');
    }

    // Step 4: Create Supabase client and authenticate
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const user = await authenticateUser(supabase, authHeader);

    // Step 5: Authorization (admin or editor only)
    const { data: adminCheck } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminCheck?.role || !['admin', 'editor'].includes(adminCheck.role)) {
      throw new Error('FORBIDDEN: Admin or editor role required for analytics access');
    }

    // Step 6: Execute business logic
    console.log('Fetching analytics dashboard data...');

    // Fetch analytics data using the RPC functions
    const [userStatsResult, contentStatsResult, engagementStatsResult] = await Promise.all([
      supabase.rpc('get_user_analytics'),
      supabase.rpc('get_content_analytics'),
      supabase.rpc('get_engagement_analytics')
    ]);

    if (userStatsResult.error) {
      console.error('Error fetching user analytics:', userStatsResult.error);
      throw new Error(`User analytics error: ${userStatsResult.error.message}`);
    }

    if (contentStatsResult.error) {
      console.error('Error fetching content analytics:', contentStatsResult.error);
      throw new Error(`Content analytics error: ${contentStatsResult.error.message}`);
    }

    if (engagementStatsResult.error) {
      console.error('Error fetching engagement analytics:', engagementStatsResult.error);
      throw new Error(`Engagement analytics error: ${engagementStatsResult.error.message}`);
    }

    // System stats (mock data as specified in Blueprint)
    const systemStats = {
      dbSize: '2.4 GB',
      apiCalls: 15420,
      errorRate: 0.02,
      uptime: '99.9%'
    };

    const analyticsData = {
      userStats: userStatsResult.data || {
        totalUsers: 0,
        activeToday: 0,
        newThisWeek: 0,
        premiumUsers: 0
      },
      contentStats: contentStatsResult.data || {
        totalReviews: 0,
        publishedReviews: 0,
        draftReviews: 0,
        totalPosts: 0
      },
      engagementStats: engagementStatsResult.data || {
        totalViews: 0,
        totalVotes: 0,
        avgEngagement: 0,
        topContent: []
      },
      systemStats
    };

    console.log('Analytics dashboard response prepared successfully');

    // Step 7: Return success response
    return createSuccessResponse(analyticsData, rateLimitHeaders(rateLimitResult), origin);

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return createErrorResponse(error, {}, origin);
  }
});
