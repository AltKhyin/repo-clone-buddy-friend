
-- Milestone 1: Database Foundation for Community Enhancements
-- Create SavedPosts table for bookmarking functionality
CREATE TABLE IF NOT EXISTS "SavedPosts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "practitioner_id" UUID NOT NULL REFERENCES "Practitioners"("id") ON DELETE CASCADE,
  "post_id" INTEGER NOT NULL REFERENCES "CommunityPosts"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("practitioner_id", "post_id")
);

-- Performance indexes for SavedPosts
CREATE INDEX IF NOT EXISTS "idx_savedposts_practitioner_id" ON "SavedPosts"("practitioner_id");
CREATE INDEX IF NOT EXISTS "idx_savedposts_post_id" ON "SavedPosts"("post_id");
CREATE INDEX IF NOT EXISTS "idx_savedposts_created_at" ON "SavedPosts"("created_at");

-- Enhance CommunityPosts table for multimedia support
ALTER TABLE "CommunityPosts" 
ADD COLUMN IF NOT EXISTS "image_url" TEXT,
ADD COLUMN IF NOT EXISTS "video_url" TEXT,
ADD COLUMN IF NOT EXISTS "poll_data" JSONB;

-- RLS Policies for SavedPosts table
ALTER TABLE "SavedPosts" ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved posts
CREATE POLICY "Users can view their own saved posts"
ON "SavedPosts" FOR SELECT
USING (auth.uid() = practitioner_id);

-- Users can save posts (insert their own saved posts)
CREATE POLICY "Users can save posts"
ON "SavedPosts" FOR INSERT
WITH CHECK (auth.uid() = practitioner_id);

-- Users can unsave posts (delete their own saved posts)
CREATE POLICY "Users can unsave posts"
ON "SavedPosts" FOR DELETE
USING (auth.uid() = practitioner_id);

-- Create index for efficient saved post checking
CREATE INDEX IF NOT EXISTS "idx_savedposts_lookup" ON "SavedPosts"("practitioner_id", "post_id");

-- Update database schema version tracking
INSERT INTO "SiteSettings" ("key", "value", "created_at", "updated_at")
VALUES (
  'database_schema_version',
  '{"version": "1.4.0", "milestone": "Community Enhancement - Database Foundation", "date": "2025-06-19"}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT ("key") DO UPDATE SET
  "value" = EXCLUDED."value",
  "updated_at" = NOW();
