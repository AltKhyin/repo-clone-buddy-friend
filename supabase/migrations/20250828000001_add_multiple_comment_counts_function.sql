-- Migration: Add function to get multiple comment counts efficiently for community feed fallback
-- This allows the fallback query to get recursive comment counts for multiple posts in one call

CREATE OR REPLACE FUNCTION get_multiple_comment_counts(post_ids INT[])
RETURNS TABLE (
    post_id INT,
    count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        post_id,
        get_total_comment_count(post_id) as count
    FROM unnest(post_ids) as post_id;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_multiple_comment_counts(INT[]) TO service_role;