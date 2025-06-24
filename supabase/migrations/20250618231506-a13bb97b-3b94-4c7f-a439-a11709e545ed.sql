
-- Community Posts with threading support
CREATE TABLE "CommunityPosts" (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES "Reviews"(id) ON DELETE CASCADE,
  parent_post_id INTEGER REFERENCES "CommunityPosts"(id) ON DELETE CASCADE,
  author_id UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting system
CREATE TABLE "CommunityPost_Votes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id INTEGER REFERENCES "CommunityPosts"(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES "Practitioners"(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, practitioner_id)
);

-- Weekly polls
CREATE TABLE "Polls" (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  total_votes INTEGER DEFAULT 0
);

-- Poll options
CREATE TABLE "PollOptions" (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES "Polls"(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll votes tracking
CREATE TABLE "PollVotes" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id INTEGER REFERENCES "Polls"(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES "PollOptions"(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES "Practitioners"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, practitioner_id)
);

-- Performance indexes
CREATE INDEX "idx_community_posts_review_id" ON "CommunityPosts"(review_id);
CREATE INDEX "idx_community_posts_parent_id" ON "CommunityPosts"(parent_post_id);
CREATE INDEX "idx_community_posts_author_id" ON "CommunityPosts"(author_id);
CREATE INDEX "idx_community_posts_created_at" ON "CommunityPosts"(created_at DESC);
CREATE INDEX "idx_community_post_votes_post_id" ON "CommunityPost_Votes"(post_id);
CREATE INDEX "idx_poll_votes_poll_id" ON "PollVotes"(poll_id);

-- Enable RLS on all community tables
ALTER TABLE "CommunityPosts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityPost_Votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Polls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PollOptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PollVotes" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CommunityPosts
CREATE POLICY "Community posts are publicly readable"
ON "CommunityPosts" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON "CommunityPosts" FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

CREATE POLICY "Users can update their own posts"
ON "CommunityPosts" FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts; admins can delete any"
ON "CommunityPosts" FOR DELETE
USING (
  (auth.uid() = author_id) OR 
  (get_my_claim('role') IN ('editor', 'admin'))
);

-- RLS Policies for CommunityPost_Votes
CREATE POLICY "Vote records are publicly readable"
ON "CommunityPost_Votes" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON "CommunityPost_Votes" FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND practitioner_id = auth.uid());

CREATE POLICY "Users can update their own votes"
ON "CommunityPost_Votes" FOR UPDATE
USING (auth.uid() = practitioner_id)
WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Users can delete their own votes"
ON "CommunityPost_Votes" FOR DELETE
USING (auth.uid() = practitioner_id);

-- RLS Policies for Polls
CREATE POLICY "Polls are publicly readable"
ON "Polls" FOR SELECT
USING (true);

CREATE POLICY "Admins can manage polls"
ON "Polls" FOR ALL
USING (get_my_claim('role') IN ('editor', 'admin'))
WITH CHECK (get_my_claim('role') IN ('editor', 'admin'));

-- RLS Policies for PollOptions
CREATE POLICY "Poll options are publicly readable"
ON "PollOptions" FOR SELECT
USING (true);

CREATE POLICY "Admins can manage poll options"
ON "PollOptions" FOR ALL
USING (get_my_claim('role') IN ('editor', 'admin'))
WITH CHECK (get_my_claim('role') IN ('editor', 'admin'));

-- RLS Policies for PollVotes
CREATE POLICY "Poll vote records are publicly readable"
ON "PollVotes" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote on polls"
ON "PollVotes" FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND practitioner_id = auth.uid());

CREATE POLICY "Users can update their own poll votes"
ON "PollVotes" FOR UPDATE
USING (auth.uid() = practitioner_id)
WITH CHECK (auth.uid() = practitioner_id);

-- Trigger function to update post vote counts
CREATE OR REPLACE FUNCTION update_community_post_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  post_id_val INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    post_id_val := NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    post_id_val := OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    post_id_val := NEW.post_id;
  END IF;
  
  -- Update upvotes and downvotes counts
  UPDATE "CommunityPosts" 
  SET 
    upvotes = (
      SELECT COUNT(*) 
      FROM "CommunityPost_Votes" 
      WHERE post_id = post_id_val AND vote_type = 'up'
    ),
    downvotes = (
      SELECT COUNT(*) 
      FROM "CommunityPost_Votes" 
      WHERE post_id = post_id_val AND vote_type = 'down'
    )
  WHERE id = post_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vote count updates
CREATE TRIGGER community_post_vote_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "CommunityPost_Votes"
  FOR EACH ROW EXECUTE FUNCTION update_community_post_vote_count();

-- Trigger function to update poll vote counts
CREATE OR REPLACE FUNCTION update_poll_vote_count()
RETURNS TRIGGER AS $$
DECLARE
  option_id_val INTEGER;
  poll_id_val INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    option_id_val := NEW.option_id;
    poll_id_val := NEW.poll_id;
  ELSIF TG_OP = 'DELETE' THEN
    option_id_val := OLD.option_id;
    poll_id_val := OLD.poll_id;
  ELSIF TG_OP = 'UPDATE' THEN
    option_id_val := NEW.option_id;
    poll_id_val := NEW.poll_id;
  END IF;
  
  -- Update option vote count
  UPDATE "PollOptions" 
  SET vote_count = (
    SELECT COUNT(*) 
    FROM "PollVotes" 
    WHERE option_id = option_id_val
  )
  WHERE id = option_id_val;
  
  -- Update total poll vote count
  UPDATE "Polls" 
  SET total_votes = (
    SELECT COUNT(*) 
    FROM "PollVotes" 
    WHERE poll_id = poll_id_val
  )
  WHERE id = poll_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for poll vote count updates
CREATE TRIGGER poll_vote_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "PollVotes"
  FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();
