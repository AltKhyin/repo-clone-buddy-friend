
// ABOUTME: Content analytics Edge Function for admin dashboard data following the simplified pattern that works

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
    const timeRange = url.searchParams.get('timeRange') || '30d';
    
    console.log('Content analytics request:', { timeRange, userRole });

    // Calculate date range
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch content stats
    const { data: contentStats } = await supabase.rpc('get_content_analytics');
    
    // Fetch recent content activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('Reviews')
      .select(`
        id,
        title,
        status,
        created_at,
        published_at,
        view_count,
        Practitioners!author_id(full_name)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    // Fetch status distribution
    const { data: statusDistribution, error: statusError } = await supabase
      .from('Reviews')
      .select('status')
      .gte('created_at', startDate.toISOString());

    if (statusError) {
      console.error('Error fetching status distribution:', statusError);
    }

    // Calculate status counts
    const statusCounts = (statusDistribution || []).reduce((acc: any, review: any) => {
      acc[review.status] = (acc[review.status] || 0) + 1;
      return acc;
    }, {});

    // Fetch top performing content
    const { data: topContent, error: topError } = await supabase
      .from('Reviews')
      .select(`
        id,
        title,
        view_count,
        status,
        published_at,
        Practitioners!author_id(full_name)
      `)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10);

    if (topError) {
      console.error('Error fetching top content:', topError);
    }

    const result = {
      summary: contentStats || {
        totalReviews: 0,
        publishedReviews: 0,
        draftReviews: 0,
        totalPosts: 0
      },
      recentActivity: recentActivity || [],
      statusDistribution: statusCounts,
      topPerforming: topContent || [],
      timeRange,
      generatedAt: new Date().toISOString()
    };

    console.log('Content analytics response:', {
      summaryKeys: Object.keys(result.summary),
      activityCount: result.recentActivity.length,
      timeRange: result.timeRange,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Content analytics error:', error);
    
    const errorMessage = error.message || 'Unknown error occurred';
    const statusCode = errorMessage.includes('authentication') ? 401 :
                      errorMessage.includes('permissions') ? 403 : 500;

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Content analytics fetch failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
