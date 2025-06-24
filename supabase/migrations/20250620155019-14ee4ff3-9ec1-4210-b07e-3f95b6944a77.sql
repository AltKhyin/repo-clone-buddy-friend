
-- Migration 1: Add reward feature to CommunityPosts table
-- File: supabase/migrations/20250620120000_add_reward_feature.sql

-- Step 1: Add the 'is_rewarded' column to the CommunityPosts table.
-- This column will be a simple flag to indicate if a post or comment
-- has received a special award from an administrator.
-- It defaults to FALSE, ensuring no existing content is affected.
ALTER TABLE public."CommunityPosts"
ADD COLUMN IF NOT EXISTS is_rewarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Rationale: Adding "IF NOT EXISTS" makes the migration script idempotent,
-- meaning it can be run multiple times without causing errors.

-- Step 2: Add a comment to the column for future database introspection.
-- This helps other developers understand the purpose of the column.
COMMENT ON COLUMN public."CommunityPosts".is_rewarded IS 'Set to true if an admin has rewarded this content.';

-- Step 3: Create an index on this new column.
-- This is a performance optimization. It will make queries that specifically
-- look for rewarded content (e.g., for a special "Best Of" page) much faster.
-- The WHERE clause makes the index smaller and more efficient as it only
-- includes rows that are actually rewarded.
CREATE INDEX IF NOT EXISTS idx_community_posts_rewarded
ON public."CommunityPosts" (is_rewarded)
WHERE is_rewarded = TRUE;

-- Migration 2: Create comment-fetching RPC function
-- File: supabase/migrations/20250620120100_create_comment_fetch_rpc.sql

CREATE OR REPLACE FUNCTION get_comments_for_post(p_post_id INT, p_user_id UUID)
RETURNS TABLE (
    -- This defines the exact shape of the data returned for each comment.
    -- It matches the CommunityPost type and includes user-specific data.
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
    -- This is a recursive query. It starts with the direct children of the post
    -- and then repeatedly finds the children of those children, building the tree.
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: Select the direct comments (level 1)
        SELECT
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            1 AS nesting_level -- Start with nesting level 1
        FROM public."CommunityPosts" cp
        WHERE cp.parent_post_id = p_post_id

        UNION ALL

        -- Recursive step: Join the table with itself to find replies
        SELECT
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            ct.nesting_level + 1 -- Increment nesting level for each reply
        FROM public."CommunityPosts" cp
        JOIN comment_tree ct ON cp.parent_post_id = ct.id
    )
    -- Final SELECT statement to format the output
    SELECT
        t.id,
        t.content,
        t.created_at,
        t.upvotes,
        t.downvotes,
        t.is_rewarded,
        t.parent_post_id,
        -- Pre-build the author JSON object to reduce client-side processing
        jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS author,
        -- Subquery to get the current user's vote status for this comment
        (SELECT v.vote_type FROM public."CommunityPost_Votes" v WHERE v.post_id = t.id AND v.practitioner_id = p_user_id) AS user_vote,
        -- Subquery to get the reply count for this comment
        (SELECT count(*) FROM public."CommunityPosts" replies WHERE replies.parent_post_id = t.id) AS reply_count,
        t.nesting_level
    FROM comment_tree t
    -- Join to get the author's profile information
    LEFT JOIN public."Practitioners" p ON t.author_id = p.id
    ORDER BY t.created_at ASC; -- Order by oldest first to build the thread correctly
END;
$$ LANGUAGE plpgsql STABLE;

-- Migration 3: Update existing RPC to support parent_post_id
-- Modify the existing create_post_and_auto_vote function to handle comments

CREATE OR REPLACE FUNCTION create_post_and_auto_vote(
  p_author_id uuid, 
  p_title text, 
  p_content text, 
  p_category text,
  p_parent_id integer DEFAULT NULL  -- NEW PARAMETER for comment support
)
RETURNS TABLE (
  post_id integer,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_post_id integer;
BEGIN
  -- Insert the new post/comment
  INSERT INTO public."CommunityPosts" (
    author_id, 
    title, 
    content, 
    category, 
    parent_post_id,
    upvotes
  ) VALUES (
    p_author_id, 
    p_title, 
    p_content, 
    p_category,
    p_parent_id,  -- This makes it a comment if provided
    1  -- Auto-upvote
  ) RETURNING id INTO new_post_id;

  -- Insert the auto-upvote
  INSERT INTO public."CommunityPost_Votes" (
    post_id, 
    practitioner_id, 
    vote_type
  ) VALUES (
    new_post_id, 
    p_author_id, 
    'up'
  );

  -- Update the user's contribution score
  UPDATE public."Practitioners" 
  SET contribution_score = contribution_score + 1 
  WHERE id = p_author_id;

  -- Return the new post ID and success status
  RETURN QUERY SELECT new_post_id, true;
END;
$$;
