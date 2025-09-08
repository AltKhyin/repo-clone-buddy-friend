-- ABOUTME: Database migration to add admin-controlled community post fields for review-to-community posting system

-- Add post status enum type
CREATE TYPE post_status AS ENUM ('draft', 'published', 'scheduled', 'hidden');

-- Add admin fields to community_posts table
ALTER TABLE community_posts 
ADD COLUMN post_status post_status DEFAULT 'published' NOT NULL,
ADD COLUMN visibility_level text DEFAULT 'public' CHECK (visibility_level IN ('public', 'hidden')),
ADD COLUMN scheduled_publish_at timestamp with time zone,
ADD COLUMN admin_created_by uuid REFERENCES users(id),
ADD COLUMN admin_notes text;

-- Add indexes for performance
CREATE INDEX idx_community_posts_post_status ON community_posts(post_status);
CREATE INDEX idx_community_posts_visibility_level ON community_posts(visibility_level);
CREATE INDEX idx_community_posts_scheduled_publish ON community_posts(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;
CREATE INDEX idx_community_posts_admin_created_by ON community_posts(admin_created_by) WHERE admin_created_by IS NOT NULL;

-- Update RLS policies to handle hidden posts
-- Drop existing SELECT policy and recreate with visibility rules
DROP POLICY IF EXISTS "Anyone can read community posts" ON community_posts;

CREATE POLICY "Users can read visible community posts" ON community_posts
FOR SELECT TO authenticated
USING (
  -- Regular users can only see published posts that are public
  (post_status = 'published' AND visibility_level = 'public')
  OR
  -- Admins can see all posts
  (get_my_claim('role') = 'admin')
  OR
  -- Post authors can see their own posts
  (user_id = auth.uid())
);

-- Allow admins to insert posts with admin fields
CREATE POLICY "Admins can create community posts" ON community_posts
FOR INSERT TO authenticated
WITH CHECK (
  get_my_claim('role') = 'admin'
  OR
  (user_id = auth.uid() AND admin_created_by IS NULL)
);

-- Allow admins to update posts they created or any post
CREATE POLICY "Admins can update community posts" ON community_posts
FOR UPDATE TO authenticated
USING (
  get_my_claim('role') = 'admin'
  OR
  (user_id = auth.uid() AND admin_created_by IS NULL)
)
WITH CHECK (
  get_my_claim('role') = 'admin'
  OR
  (user_id = auth.uid() AND admin_created_by IS NULL)
);

-- Add a function to handle scheduled post publishing
CREATE OR REPLACE FUNCTION publish_scheduled_community_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_posts
  SET post_status = 'published',
      updated_at = now()
  WHERE post_status = 'scheduled'
    AND scheduled_publish_at <= now()
    AND scheduled_publish_at IS NOT NULL;
END;
$$;

-- Add comments explaining the fields
COMMENT ON COLUMN community_posts.post_status IS 'Status of the post: draft, published, scheduled, or hidden';
COMMENT ON COLUMN community_posts.visibility_level IS 'Visibility level: public (shows in community feed) or hidden (only shows on review page)';
COMMENT ON COLUMN community_posts.scheduled_publish_at IS 'Timestamp when a scheduled post should be published';
COMMENT ON COLUMN community_posts.admin_created_by IS 'Admin user who created this post (NULL if created by regular user)';
COMMENT ON COLUMN community_posts.admin_notes IS 'Internal admin notes about this community post';