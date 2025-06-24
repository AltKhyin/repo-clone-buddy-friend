
-- Optimize vote counting triggers to use incremental updates instead of full recalculation
-- This dramatically improves performance for voting operations

-- Update the suggestion vote count trigger to use incremental logic
create or replace function update_suggestion_vote_count()
returns trigger
language plpgsql
security definer
as $$
declare
  suggestion_id_val integer;
begin
  -- Determine which suggestion_id to update based on operation type
  if TG_OP = 'INSERT' then
    suggestion_id_val := NEW.suggestion_id;
    -- Increment vote count
    update public."Suggestions" 
    set upvotes = upvotes + 1
    where id = suggestion_id_val;
  elsif TG_OP = 'DELETE' then
    suggestion_id_val := OLD.suggestion_id;
    -- Decrement vote count, ensuring it doesn't go below 0
    update public."Suggestions" 
    set upvotes = greatest(upvotes - 1, 0)
    where id = suggestion_id_val;
  end if;
  
  return coalesce(NEW, OLD);
end;
$$;

-- Update the community post vote count trigger for better performance
create or replace function update_community_post_vote_count()
returns trigger
language plpgsql
security definer
as $$
declare
  post_id_val integer;
  old_vote_type text;
  new_vote_type text;
begin
  if TG_OP = 'INSERT' then
    post_id_val := NEW.post_id;
    new_vote_type := NEW.vote_type;
    
    -- Increment appropriate counter
    if new_vote_type = 'up' then
      update "CommunityPosts" set upvotes = upvotes + 1 where id = post_id_val;
    elsif new_vote_type = 'down' then
      update "CommunityPosts" set downvotes = downvotes + 1 where id = post_id_val;
    end if;
    
  elsif TG_OP = 'DELETE' then
    post_id_val := OLD.post_id;
    old_vote_type := OLD.vote_type;
    
    -- Decrement appropriate counter
    if old_vote_type = 'up' then
      update "CommunityPosts" set upvotes = greatest(upvotes - 1, 0) where id = post_id_val;
    elsif old_vote_type = 'down' then
      update "CommunityPosts" set downvotes = greatest(downvotes - 1, 0) where id = post_id_val;
    end if;
    
  elsif TG_OP = 'UPDATE' then
    post_id_val := NEW.post_id;
    old_vote_type := OLD.vote_type;
    new_vote_type := NEW.vote_type;
    
    -- Handle vote type changes (e.g., up to down, or vice versa)
    if old_vote_type != new_vote_type then
      -- Decrement old vote type
      if old_vote_type = 'up' then
        update "CommunityPosts" set upvotes = greatest(upvotes - 1, 0) where id = post_id_val;
      elsif old_vote_type = 'down' then
        update "CommunityPosts" set downvotes = greatest(downvotes - 1, 0) where id = post_id_val;
      end if;
      
      -- Increment new vote type
      if new_vote_type = 'up' then
        update "CommunityPosts" set upvotes = upvotes + 1 where id = post_id_val;
      elsif new_vote_type = 'down' then
        update "CommunityPosts" set downvotes = downvotes + 1 where id = post_id_val;
      end if;
    end if;
  end if;
  
  return coalesce(NEW, OLD);
end;
$$;
