
// ABOUTME: User analytics Edge Function for admin dashboard user insights following the simplified pattern that works

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

    // Check if user has admin role
    const userRole = user.app_metadata?.role;
    if (!userRole || userRole !== 'admin') {
      throw new Error('Insufficient permissions: Admin role required');
    }

    // Parse request parameters
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '30d';
    const includeDetails = url.searchParams.get('includeDetails') === 'true';
    
    console.log('User analytics request:', { timeRange, includeDetails });

    // Calculate date range
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch user stats from the database function
    const { data: userStats } = await supabase.rpc('get_user_analytics');

    // Fetch user registration trends
    const { data: registrationTrends, error: trendsError } = await supabase
      .from('Practitioners')
      .select(`
        created_at,
        role,
        subscription_tier
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (trendsError) {
      console.error('Error fetching registration trends:', trendsError);
    }

    // Calculate daily registration counts
    const dailyRegistrations = (registrationTrends || []).reduce((acc: any, user: any) => {
      const date = new Date(user.created_at).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Fetch user activity metrics
    const { data: recentActivity, error: activityError } = await supabase
      .from('CommunityPosts')
      .select(`
        author_id,
        created_at,
        Practitioners!author_id(
          full_name,
          role,
          subscription_tier,
          contribution_score
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    // Calculate user engagement metrics
    const activeUserIds = new Set((recentActivity || []).map((post: any) => post.author_id));
    const engagementByRole = (recentActivity || []).reduce((acc: any, post: any) => {
      const role = post.Practitioners?.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    // Fetch subscription distribution
    const { data: subscriptionData, error: subError } = await supabase
      .from('Practitioners')
      .select('subscription_tier')
      .gte('created_at', startDate.toISOString());

    if (subError) {
      console.error('Error fetching subscription data:', subError);
    }

    const subscriptionDistribution = (subscriptionData || []).reduce((acc: any, user: any) => {
      acc[user.subscription_tier] = (acc[user.subscription_tier] || 0) + 1;
      return acc;
    }, {});

    // Fetch top contributors if details requested
    let topContributors = null;
    if (includeDetails) {
      const { data: contributors, error: contributorsError } = await supabase
        .from('Practitioners')
        .select(`
          id,
          full_name,
          role,
          subscription_tier,
          contribution_score,
          created_at
        `)
        .order('contribution_score', { ascending: false })
        .limit(20);

      if (contributorsError) {
        console.error('Error fetching top contributors:', contributorsError);
      } else {
        topContributors = contributors;
      }
    }

    const result = {
      summary: userStats || {
        totalUsers: 0,
        activeToday: 0,
        newThisWeek: 0,
        premiumUsers: 0
      },
      trends: {
        dailyRegistrations: Object.entries(dailyRegistrations).map(([date, count]) => ({
          date,
          count
        })),
        totalInPeriod: (registrationTrends || []).length
      },
      engagement: {
        activeUsers: activeUserIds.size,
        activityByRole: engagementByRole,
        totalPosts: (recentActivity || []).length
      },
      subscriptions: subscriptionDistribution,
      topContributors,
      timeRange,
      generatedAt: new Date().toISOString()
    };

    console.log('User analytics response:', {
      summaryKeys: Object.keys(result.summary),
      trendsCount: result.trends.dailyRegistrations.length,
      activeUsers: result.engagement.activeUsers,
      timeRange: result.timeRange
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('User analytics error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'User analytics fetch failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
