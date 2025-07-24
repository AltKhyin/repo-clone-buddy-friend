-- Migration: Add profession data to comment author information
-- This updates the get_comments_for_post RPC function to include profession and specialization
-- in the author object for all comments

-- Update the get_comments_for_post function to include profession data
CREATE OR REPLACE FUNCTION get_comments_for_post(p_post_id INT, p_user_id UUID)
RETURNS TABLE (
    id INT,
    content TEXT,
    created_at TIMESTAMPTZ,
    upvotes INT,
    downvotes INT,
    is_rewarded BOOLEAN,
    parent_post_id INT,
    author JSONB,
    user_vote TEXT,
    reply_count INT,
    nesting_level INT
)
AS $$
BEGIN
    -- Create a CTE that flattens the comment tree for a specific post
    -- Uses recursive query to determine nesting level
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: Get all top-level comments for the post
        SELECT 
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            0 as nesting_level
        FROM public."CommunityPosts" cp
        WHERE cp.parent_post_id = p_post_id
          AND cp.parent_post_id IS NOT NULL
        
        UNION ALL
        
        -- Recursive case: Get all nested replies 
        SELECT 
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            ct.nesting_level + 1
        FROM public."CommunityPosts" cp
        INNER JOIN comment_tree ct ON cp.parent_post_id = ct.id
        WHERE ct.nesting_level < 5  -- Prevent infinite recursion
    )
    -- Return formatted results with enhanced author info including profession data
    SELECT
        t.id,
        t.content,
        t.created_at,
        t.upvotes,
        t.downvotes,
        t.is_rewarded,
        t.parent_post_id,
        jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'role', p.role,
            'profession', p.profession
        ) AS author,
        (SELECT v.vote_type FROM public."CommunityPost_Votes" v WHERE v.post_id = t.id AND v.practitioner_id = p_user_id) AS user_vote,
        get_total_comment_count(t.id) AS reply_count, -- Use recursive count for each comment too
        t.nesting_level
    FROM comment_tree t
    LEFT JOIN public."Practitioners" p ON t.author_id = p.id
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;