
-- Create transactional RPC for creating posts with automatic votes
-- This ensures data consistency by bundling post creation and auto-vote in a single transaction

create or replace function create_post_and_auto_vote(
  p_author_id uuid,
  p_title text,
  p_content text,
  p_category text
)
returns "CommunityPosts" as $$
declare
  new_post "CommunityPosts";
begin
  -- Insert the new post and store the entire new row in the `new_post` variable
  -- The `returning *` clause is crucial here
  insert into "CommunityPosts" (author_id, title, content, category, upvotes)
  values (p_author_id, p_title, p_content, p_category, 1)
  returning * into new_post;

  -- Insert the automatic upvote for the author, referencing the ID of the post we just created
  insert into "CommunityPost_Votes" (post_id, practitioner_id, vote_type)
  values (new_post.id, p_author_id, 'up');

  -- Return the complete post object, which now has an upvote count of 1
  return new_post;
end;
$$ language plpgsql volatile security definer;
-- `volatile` tells PostgreSQL that this function has side effects (it modifies data)
-- `security definer` ensures the function runs with the permissions of its owner (admin)
