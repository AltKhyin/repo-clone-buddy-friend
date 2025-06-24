
-- Create RPC function for community feed with all necessary details
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
    author json,
    user_vote text,
    reply_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.title,
        cp.content,
        cp.category,
        cp.upvotes,
        cp.downvotes,
        cp.created_at,
        cp.is_pinned,
        cp.is_locked,
        cp.flair_text,
        cp.flair_color,
        cp.post_type,
        cp.image_url,
        cp.video_url,
        json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'role', p.role
        ) AS author,
        COALESCE(v.vote_type, 'none') AS user_vote,
        (SELECT COUNT(*) FROM "CommunityPosts" AS replies WHERE replies.parent_post_id = cp.id) AS reply_count
    FROM
        "CommunityPosts" AS cp
    JOIN
        "Practitioners" AS p ON cp.author_id = p.id
    LEFT JOIN
        "CommunityPost_Votes" AS v ON v.post_id = cp.id AND v.practitioner_id = p_user_id
    WHERE
        cp.parent_post_id IS NULL
    ORDER BY
        cp.is_pinned DESC, cp.created_at DESC
    LIMIT
        p_limit
    OFFSET
        p_offset;
END;
$$;
