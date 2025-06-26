-- Fix comment creation by updating create_post_and_auto_vote to handle parent_post_id

DROP FUNCTION IF EXISTS create_post_and_auto_vote(uuid, text, text, text);

CREATE OR REPLACE FUNCTION create_post_and_auto_vote(
  p_author_id uuid,
  p_title text,
  p_content text,
  p_category text,
  p_parent_id integer DEFAULT NULL
)
RETURNS TABLE(post_id integer) AS $$
DECLARE
  new_post_id integer;
BEGIN
  -- Insert the new post with parent_post_id support
  INSERT INTO "CommunityPosts" (
    author_id, 
    title, 
    content, 
    category, 
    parent_post_id,
    upvotes
  )
  VALUES (
    p_author_id, 
    p_title, 
    p_content, 
    p_category, 
    p_parent_id,
    1
  )
  RETURNING id INTO new_post_id;

  -- Insert the automatic upvote for the author
  INSERT INTO "CommunityPost_Votes" (post_id, practitioner_id, vote_type)
  VALUES (new_post_id, p_author_id, 'up');

  -- Return the post ID
  RETURN QUERY SELECT new_post_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;