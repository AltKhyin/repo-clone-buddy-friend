-- Migration: Fix comment counting to include all nested replies recursively
-- This replaces the simple direct reply count with a recursive count that includes all descendants

-- Create a function to get the total comment count for a post (including all nested replies)
CREATE OR REPLACE FUNCTION get_total_comment_count(post_id INT)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE comment_tree AS (
    -- Base case: Direct comments to the post
    SELECT id 
    FROM "CommunityPosts" 
    WHERE parent_post_id = post_id
    
    UNION ALL
    
    -- Recursive case: Replies to comments
    SELECT cp.id
    FROM "CommunityPosts" cp
    JOIN comment_tree ct ON cp.parent_post_id = ct.id
  )
  SELECT COUNT(*) FROM comment_tree;
$$;

-- Update the community feed RPC function to use recursive comment counting
CREATE OR REPLACE FUNCTION get_community_feed_with_details(
  p_user_id UUID DEFAULT NULL,
  p_page INT DEFAULT 0,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id INT,
  title TEXT,
  content TEXT,
  category TEXT,
  upvotes INT,
  downvotes INT,
  created_at TIMESTAMPTZ,
  is_pinned BOOLEAN,
  is_locked BOOLEAN,
  flair_text TEXT,
  flair_color TEXT,
  image_url TEXT,
  video_url TEXT,
  poll_data JSONB,
  post_type TEXT,
  author_id UUID,
  author JSONB,
  user_vote TEXT,
  reply_count BIGINT,
  is_saved BOOLEAN
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.category,
    p.upvotes,
    p.downvotes,
    p.created_at,
    p.is_pinned,
    p.is_locked,
    p.flair_text,
    p.flair_color,
    p.image_url,
    p.video_url,
    p.poll_data,
    p.post_type,
    p.author_id,
    jsonb_build_object(
      'id', pr.id,
      'full_name', pr.full_name,
      'avatar_url', pr.avatar_url
    ) AS author,
    (
      SELECT v.vote_type
      FROM "CommunityPost_Votes" v
      WHERE v.post_id = p.id AND v.practitioner_id = p_user_id
    ) AS user_vote,
    get_total_comment_count(p.id) AS reply_count, -- Use recursive count
    (
      SELECT EXISTS(
        SELECT 1 FROM "SavedPosts" sp 
        WHERE sp.post_id = p.id AND sp.practitioner_id = p_user_id
      )
    ) AS is_saved
  FROM "CommunityPosts" p
  LEFT JOIN "Practitioners" pr ON p.author_id = pr.id
  WHERE p.parent_post_id IS NULL -- Only top-level posts
  ORDER BY 
    CASE WHEN p.is_pinned THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_page * p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update the get_comments_for_post function to also use recursive counting for individual comments
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
    reply_count BIGINT,
    nesting_level INT
)
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: Direct comments (level 1)
        SELECT
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            1 AS nesting_level
        FROM public."CommunityPosts" cp
        WHERE cp.parent_post_id = p_post_id

        UNION ALL

        -- Recursive step: Find replies to comments
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
        JOIN comment_tree ct ON cp.parent_post_id = ct.id
    )
    -- Return formatted results with author info and user votes
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
            'avatar_url', p.avatar_url
        ) AS author,
        (SELECT v.vote_type FROM public."CommunityPost_Votes" v WHERE v.post_id = t.id AND v.practitioner_id = p_user_id) AS user_vote,
        get_total_comment_count(t.id) AS reply_count, -- Use recursive count for each comment too
        t.nesting_level
    FROM comment_tree t
    LEFT JOIN public."Practitioners" p ON t.author_id = p.id
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;