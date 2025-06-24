
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrendingPost {
  id: number;
  title: string | null;
  content: string;
  category: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  reply_count: number;
  engagement_score: number;
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
    )

    // Get user for rate limiting
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        userId = user.id;
      }
    }

    // Check rate limit (30 requests per 60 seconds)
    const rateLimitResult = await checkRateLimit(supabase, 'get-trending-discussions', userId, 30, 60);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...rateLimitHeaders(rateLimitResult)
        }
      });
    }

    console.log('Fetching trending discussions');

    // Get posts from last 48 hours with engagement calculation
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: posts, error: postsError } = await supabase
      .from('CommunityPosts')
      .select(`
        id,
        title,
        content,
        category,
        upvotes,
        downvotes,
        created_at,
        author:Practitioners!author_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .is('parent_post_id', null) // Only top-level posts
      .gte('created_at', twoDaysAgo)
      .limit(50); // Get more to calculate engagement scores

    if (postsError) {
      console.error('Posts fetch error:', postsError);
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    // Calculate engagement scores and get reply counts
    const postsWithEngagement = await Promise.all(
      (posts || []).map(async (post) => {
        // Get reply count
        const { count: replyCount } = await supabase
          .from('CommunityPosts')
          .select('id', { count: 'exact' })
          .eq('parent_post_id', post.id);

        // Calculate engagement score: (New Votes * 2) + (New Comments)
        // Since we're looking at posts from last 48h, all votes/comments are "new"
        const engagementScore = (post.upvotes * 2) + (replyCount || 0);

        return {
          ...post,
          reply_count: replyCount || 0,
          engagement_score: engagementScore
        };
      })
    );

    // Sort by engagement score and take top 5
    const trendingPosts = postsWithEngagement
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 5);

    console.log(`Successfully calculated trending discussions: ${trendingPosts.length} posts`);

    return new Response(JSON.stringify({
      posts: trendingPosts
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...rateLimitHeaders(rateLimitResult)
      }
    });

  } catch (error) {
    console.error('Trending discussions fetch error:', error);
    
    return new Response(JSON.stringify({
      error: {
        message: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
