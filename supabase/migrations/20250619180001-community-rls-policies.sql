
-- RLS policies for CommunityPosts table to ensure proper access control
-- This addresses the missing RLS policies identified in the codebase

-- Enable RLS on CommunityPosts if not already enabled
ALTER TABLE "CommunityPosts" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "All users can view community posts" ON "CommunityPosts";
DROP POLICY IF EXISTS "Authenticated users can create posts" ON "CommunityPosts";
DROP POLICY IF EXISTS "Users can update their own posts" ON "CommunityPosts";
DROP POLICY IF EXISTS "Users can delete their own posts; admins can delete any" ON "CommunityPosts";

-- Create comprehensive RLS policies for CommunityPosts
CREATE POLICY "All users can view community posts"
ON "CommunityPosts" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON "CommunityPosts" FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND author_id = auth.uid()
);

CREATE POLICY "Users can update their own posts"
ON "CommunityPosts" FOR UPDATE
USING (
  auth.uid() = author_id
)
WITH CHECK (
  auth.uid() = author_id
);

CREATE POLICY "Users can delete their own posts; admins can delete any"
ON "CommunityPosts" FOR DELETE
USING (
  (auth.uid() = author_id) OR
  (get_my_claim('role') IN ('editor', 'admin'))
);

-- Add RLS policies for CommunityPost_Votes table
ALTER TABLE "CommunityPost_Votes" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all votes" ON "CommunityPost_Votes";
DROP POLICY IF EXISTS "Authenticated users can vote" ON "CommunityPost_Votes";
DROP POLICY IF EXISTS "Users can update their own votes" ON "CommunityPost_Votes";
DROP POLICY IF EXISTS "Users can delete their own votes" ON "CommunityPost_Votes";

CREATE POLICY "Users can view all votes"
ON "CommunityPost_Votes" FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON "CommunityPost_Votes" FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND practitioner_id = auth.uid()
);

CREATE POLICY "Users can update their own votes"
ON "CommunityPost_Votes" FOR UPDATE
USING (
  auth.uid() = practitioner_id
)
WITH CHECK (
  auth.uid() = practitioner_id
);

CREATE POLICY "Users can delete their own votes"
ON "CommunityPost_Votes" FOR DELETE
USING (
  auth.uid() = practitioner_id
);
