
-- Create analytics RPC functions as specified in Blueprint 09
-- These functions will aggregate data from existing tables

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM "Practitioners"),
        'activeToday', (SELECT COUNT(DISTINCT author_id) FROM "CommunityPosts" WHERE created_at >= CURRENT_DATE),
        'newThisWeek', (SELECT COUNT(*) FROM "Practitioners" WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'premiumUsers', (SELECT COUNT(*) FROM "Practitioners" WHERE subscription_tier = 'premium')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get content analytics
CREATE OR REPLACE FUNCTION get_content_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalReviews', (SELECT COUNT(*) FROM "Reviews"),
        'publishedReviews', (SELECT COUNT(*) FROM "Reviews" WHERE status = 'published'),
        'draftReviews', (SELECT COUNT(*) FROM "Reviews" WHERE status = 'draft'),
        'totalPosts', (SELECT COUNT(*) FROM "CommunityPosts")
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to get engagement analytics
CREATE OR REPLACE FUNCTION get_engagement_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    top_content JSON;
BEGIN
    -- Get top content (simplified version)
    SELECT json_agg(
        json_build_object(
            'id', id,
            'title', COALESCE(title, 'Untitled'),
            'views', upvotes + downvotes,
            'type', 'post'
        )
    ) INTO top_content
    FROM (
        SELECT id, title, upvotes, downvotes
        FROM "CommunityPosts"
        WHERE title IS NOT NULL
        ORDER BY (upvotes + downvotes) DESC
        LIMIT 5
    ) AS top_posts;
    
    SELECT json_build_object(
        'totalViews', (SELECT COALESCE(SUM(upvotes + downvotes), 0) FROM "CommunityPosts"),
        'totalVotes', (SELECT COUNT(*) FROM "CommunityPost_Votes"),
        'avgEngagement', (SELECT ROUND(AVG(upvotes + downvotes), 2) FROM "CommunityPosts"),
        'topContent', COALESCE(top_content, '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Function to export analytics data
CREATE OR REPLACE FUNCTION export_analytics_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'exportedAt', NOW(),
        'userStats', get_user_analytics(),
        'contentStats', get_content_analytics(),
        'engagementStats', get_engagement_analytics()
    ) INTO result;
    
    RETURN result;
END;
$$;
