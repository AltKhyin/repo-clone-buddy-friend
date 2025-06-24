
-- Enhanced community features based on reference UI
-- Add moderation and advanced features to CommunityPosts
ALTER TABLE "CommunityPosts" ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE "CommunityPosts" ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE "CommunityPosts" ADD COLUMN IF NOT EXISTS flair_text TEXT;
ALTER TABLE "CommunityPosts" ADD COLUMN IF NOT EXISTS flair_color TEXT;

-- Community moderation actions table
CREATE TABLE IF NOT EXISTS "CommunityModerationActions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id INTEGER REFERENCES "CommunityPosts"(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES "Practitioners"(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('pin', 'unpin', 'lock', 'unlock', 'delete', 'flair', 'hide')),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community statistics for sidebar display
CREATE TABLE IF NOT EXISTS "CommunityStats" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key TEXT UNIQUE NOT NULL,
  stat_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "idx_community_posts_pinned" ON "CommunityPosts"(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS "idx_community_posts_flair" ON "CommunityPosts"(flair_text) WHERE flair_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_moderation_actions_post" ON "CommunityModerationActions"(post_id);
CREATE INDEX IF NOT EXISTS "idx_moderation_actions_moderator" ON "CommunityModerationActions"(moderator_id);
CREATE INDEX IF NOT EXISTS "idx_community_stats_key" ON "CommunityStats"(stat_key);

-- Enable RLS on new tables
ALTER TABLE "CommunityModerationActions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityStats" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CommunityModerationActions
CREATE POLICY "Moderation actions are publicly readable"
ON "CommunityModerationActions" FOR SELECT
USING (true);

CREATE POLICY "Only editors and admins can create moderation actions"
ON "CommunityModerationActions" FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND 
  get_my_claim('role') IN ('editor', 'admin')
);

CREATE POLICY "Only moderators can update their own actions"
ON "CommunityModerationActions" FOR UPDATE
USING (
  auth.uid() = moderator_id AND 
  get_my_claim('role') IN ('editor', 'admin')
)
WITH CHECK (
  auth.uid() = moderator_id AND 
  get_my_claim('role') IN ('editor', 'admin')
);

-- RLS Policies for CommunityStats
CREATE POLICY "Community stats are publicly readable"
ON "CommunityStats" FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage community stats"
ON "CommunityStats" FOR ALL
USING (get_my_claim('role') IN ('editor', 'admin'))
WITH CHECK (get_my_claim('role') IN ('editor', 'admin'));

-- Function to update community stats
CREATE OR REPLACE FUNCTION update_community_stats()
RETURNS void AS $$
BEGIN
  -- Update total discussions count
  INSERT INTO "CommunityStats" (stat_key, stat_value, updated_at)
  VALUES (
    'total_discussions',
    jsonb_build_object('count', (SELECT COUNT(*) FROM "CommunityPosts" WHERE parent_post_id IS NULL)),
    NOW()
  )
  ON CONFLICT (stat_key) 
  DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    updated_at = EXCLUDED.updated_at;

  -- Update today's posts count
  INSERT INTO "CommunityStats" (stat_key, stat_value, updated_at)
  VALUES (
    'today_posts',
    jsonb_build_object('count', (
      SELECT COUNT(*) FROM "CommunityPosts" 
      WHERE created_at >= CURRENT_DATE
    )),
    NOW()
  )
  ON CONFLICT (stat_key) 
  DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    updated_at = EXCLUDED.updated_at;

  -- Update active users count (users who posted/commented in last 24h)
  INSERT INTO "CommunityStats" (stat_key, stat_value, updated_at)
  VALUES (
    'active_users_24h',
    jsonb_build_object('count', (
      SELECT COUNT(DISTINCT author_id) FROM "CommunityPosts" 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND author_id IS NOT NULL
    )),
    NOW()
  )
  ON CONFLICT (stat_key) 
  DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update stats when posts are created/deleted
CREATE OR REPLACE FUNCTION trigger_update_community_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_community_stats();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic stats updates
DROP TRIGGER IF EXISTS community_stats_trigger ON "CommunityPosts";
CREATE TRIGGER community_stats_trigger
  AFTER INSERT OR DELETE ON "CommunityPosts"
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_update_community_stats();

-- Insert initial stats
SELECT update_community_stats();
