
-- Create efficient community feed RPC to eliminate N+1 queries
-- This function fetches a page of community posts with all necessary related data
-- in a single database call instead of multiple queries

create or replace function get_community_feed_with_details(
  p_user_id uuid, -- The ID of the currently logged-in user
  p_limit int,    -- The number of posts per page
  p_offset int    -- The starting point for the page (limit * page number)
)
returns table (
  -- Defines the shape of the data that will be returned for each post
  id int,
  title text,
  content text,
  category text,
  upvotes int,
  downvotes int,
  created_at timestamptz,
  is_pinned boolean,
  is_locked boolean,
  flair_text text,
  flair_color text,
  author jsonb,        -- Author details will be pre-packaged as a JSON object
  user_vote text,      -- The current user's vote ('up', 'down', or null)
  reply_count bigint   -- The total number of replies to the post
) as $$
begin
  -- The `return query` statement executes the SELECT query and returns its results
  return query
  select
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
    -- Build a JSON object for the author to match the frontend's expected structure
    jsonb_build_object(
      'id', author.id,
      'full_name', author.full_name,
      'avatar_url', author.avatar_url
    ) as author,
    -- Subquery to get the current user's vote on this specific post
    (
      select vote_type from "CommunityPost_Votes"
      where post_id = p.id and practitioner_id = p_user_id
    ) as user_vote,
    -- Subquery to count the number of replies for this post
    (
      select count(*) from "CommunityPosts"
      where parent_post_id = p.id
    ) as reply_count
  from
    "CommunityPosts" as p
  -- Join with the Practitioners table to get author details
  left join "Practitioners" as author on p.author_id = author.id
  where
    p.parent_post_id is null -- Only fetch top-level posts, not replies
  order by
    p.is_pinned desc, -- Always show pinned posts first
    p.created_at desc -- Then sort by the newest posts
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql stable;
