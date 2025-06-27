-- Debug and improve the community feed RPC function
-- Fix potential data type issues and add better error handling

-- Drop and recreate the function with better type handling and debugging
DROP FUNCTION IF EXISTS public.get_community_feed_with_details(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_community_feed_with_details(
    p_user_id uuid,
    p_limit integer,
    p_offset integer
)
RETURNS TABLE (
    id integer,
    title text,
    content text,
    category text,
    upvotes integer,
    downvotes integer,
    created_at timestamp with time zone,
    is_pinned boolean,
    is_locked boolean,
    flair_text text,
    flair_color text,
    post_type text,
    image_url text,
    video_url text,
    poll_data jsonb,
    author json,
    user_vote text,
    reply_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.title,
        cp.content,
        cp.category,
        COALESCE(cp.upvotes, 0) as upvotes,
        COALESCE(cp.downvotes, 0) as downvotes,
        cp.created_at,
        COALESCE(cp.is_pinned, false) as is_pinned,
        COALESCE(cp.is_locked, false) as is_locked,
        cp.flair_text,
        cp.flair_color,
        COALESCE(cp.post_type, 'text') as post_type,
        cp.image_url,
        cp.video_url,
        cp.poll_data,
        CASE 
            WHEN p.id IS NOT NULL THEN
                json_build_object(
                    'id', p.id,
                    'full_name', COALESCE(p.full_name, 'Anonymous'),
                    'avatar_url', p.avatar_url,
                    'role', COALESCE(p.role, 'practitioner')
                )
            ELSE
                json_build_object(
                    'id', null,
                    'full_name', 'Anonymous',
                    'avatar_url', null,
                    'role', 'practitioner'
                )
        END AS author,
        COALESCE(v.vote_type, 'none') AS user_vote,
        COALESCE(
            (SELECT COUNT(*) FROM "CommunityPosts" AS replies WHERE replies.parent_post_id = cp.id),
            0
        ) AS reply_count
    FROM
        "CommunityPosts" AS cp
    LEFT JOIN
        "Practitioners" AS p ON cp.author_id = p.id
    LEFT JOIN
        "CommunityPost_Votes" AS v ON v.post_id = cp.id AND v.practitioner_id = p_user_id
    WHERE
        cp.parent_post_id IS NULL  -- Only top-level posts, not replies
    ORDER BY
        COALESCE(cp.is_pinned, false) DESC, 
        cp.created_at DESC
    LIMIT
        p_limit
    OFFSET
        p_offset;
        
    -- Log the execution for debugging
    RAISE LOG 'get_community_feed_with_details executed: user_id=%, limit=%, offset=%', p_user_id, p_limit, p_offset;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.get_community_feed_with_details(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_feed_with_details(uuid, integer, integer) TO anon;

-- Create a simpler debug function to test data retrieval
CREATE OR REPLACE FUNCTION public.debug_community_posts()
RETURNS TABLE (
    id integer,
    title text,
    post_type text,
    image_url text,
    video_url text,
    poll_data jsonb,
    author_id uuid,
    author_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.title,
        COALESCE(cp.post_type, 'NULL') as post_type,
        cp.image_url,
        cp.video_url,
        cp.poll_data,
        cp.author_id,
        COALESCE(p.full_name, 'No Author') as author_name
    FROM
        "CommunityPosts" AS cp
    LEFT JOIN
        "Practitioners" AS p ON cp.author_id = p.id
    WHERE
        cp.parent_post_id IS NULL
    ORDER BY
        cp.created_at DESC
    LIMIT 10;
END;
$$;

-- Grant permissions for the debug function
GRANT EXECUTE ON FUNCTION public.debug_community_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_community_posts() TO anon;