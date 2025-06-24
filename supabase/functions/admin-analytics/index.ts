
// ABOUTME: Admin Edge Function for analytics dashboard data following the simplified pattern that works

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user has admin or editor role
    const userRole = user.app_metadata?.role;
    if (!userRole || !['admin', 'editor'].includes(userRole)) {
      throw new Error('Insufficient permissions: Admin or editor role required');
    }

    // Parse request parameters
    const url = new URL(req.url);
    const params = {
      timeframe: url.searchParams.get('timeframe') || '30d',
      metrics: url.searchParams.getAll('metrics') || ['overview']
    };

    console.log('Analytics request:', params);

    const analytics: any = {};

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (params.timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch overview metrics
    if (params.metrics.includes('overview')) {
      const [userStats, contentStats, engagementStats] = await Promise.all([
        supabase.rpc('get_user_analytics'),
        supabase.rpc('get_content_analytics'),
        supabase.rpc('get_engagement_analytics')
      ]);

      analytics.overview = {
        users: userStats.data || {},
        content: contentStats.data || {},
        engagement: engagementStats.data || {}
      };
    }

    // Fetch publication funnel metrics
    if (params.metrics.includes('publication_funnel')) {
      const { data: funnelData, error: funnelError } = await supabase
        .from('Reviews')
        .select('review_status, created_at')
        .gte('created_at', startDate.toISOString());

      if (!funnelError && funnelData) {
        const funnel = funnelData.reduce((acc: any, review: any) => {
          const status = review.review_status || 'draft';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        analytics.publication_funnel = funnel;
      }
    }

    // Fetch publication history trends
    if (params.metrics.includes('trends')) {
      const { data: historyData, error: historyError } = await supabase
        .from('Publication_History')
        .select('action, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (!historyError && historyData) {
        // Group by day and action type
        const trends = historyData.reduce((acc: any, item: any) => {
          const date = item.created_at.split('T')[0];
          if (!acc[date]) acc[date] = {};
          acc[date][item.action] = (acc[date][item.action] || 0) + 1;
          return acc;
        }, {});

        analytics.trends = trends;
      }
    }

    // Fetch user activity metrics
    if (params.metrics.includes('user_activity')) {
      const { data: activityData, error: activityError } = await supabase
        .from('CommunityPosts')
        .select('author_id, created_at')
        .gte('created_at', startDate.toISOString());

      if (!activityError && activityData) {
        const dailyActivity = activityData.reduce((acc: any, post: any) => {
          const date = post.created_at.split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        analytics.user_activity = {
          daily_posts: dailyActivity,
          unique_authors: [...new Set(activityData.map((p: any) => p.author_id))].length
        };
      }
    }

    const result = {
      timeframe: params.timeframe,
      generated_at: new Date().toISOString(),
      ...analytics
    };

    console.log('Analytics response:', {
      timeframe: result.timeframe,
      metricsIncluded: params.metrics,
      overviewKeys: analytics.overview ? Object.keys(analytics.overview) : []
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Analytics fetch failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
