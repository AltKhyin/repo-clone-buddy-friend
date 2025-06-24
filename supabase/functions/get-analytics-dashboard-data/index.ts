
// ABOUTME: Analytics dashboard Edge Function using standardized pattern

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPrelight } from '../_shared/cors.ts';
import { checkAnalyticsRateLimit } from '../_shared/rate-limit.ts';
import { authenticateRequest, requireRole } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  // Step 1: Handle CORS preflight
  const corsResponse = handleCorsPrelight(req);
  if (corsResponse) return corsResponse;

  try {
    // Step 2: Rate limiting
    const rateLimitResult = await checkAnalyticsRateLimit(req);
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({ 
        error: rateLimitResult.error || 'Rate limit exceeded',
        details: 'Too many analytics requests'
      }), {
        status: 429,
        headers: { ...corsHeaders, ...rateLimitResult.headers, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Authentication
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return new Response(JSON.stringify({ 
        error: authResult.error || 'Authentication failed',
        details: 'Invalid or missing authentication'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 4: Authorization (admin or editor only)
    const roleCheck = requireRole(authResult.user, ['admin', 'editor']);
    if (!roleCheck.success) {
      return new Response(JSON.stringify({ 
        error: roleCheck.error || 'Insufficient permissions',
        details: 'Admin or editor role required for analytics access'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
    return new Response(JSON.stringify(analyticsData), {
      headers: { 
        ...corsHeaders, 
        ...rateLimitResult.headers,
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Analytics dashboard fetch failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
