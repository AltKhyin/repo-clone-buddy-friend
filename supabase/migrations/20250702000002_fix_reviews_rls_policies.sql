-- ABOUTME: Fixes RLS policies for Reviews table after access_level constraint change
-- Migration: 20250702000002_fix_reviews_rls_policies

-- Drop the old SELECT policy that references 'public' access level
DROP POLICY IF EXISTS "Reviews are visible based on access level" ON "Reviews";

-- Create updated SELECT policy with new access level values
CREATE POLICY "Reviews are visible based on access level"
ON "Reviews" FOR SELECT
USING (
  -- Free content is visible to everyone when published
  (access_level = 'free' AND status = 'published') OR
  -- Premium content is visible to premium users and above when published
  (access_level = 'premium' AND status = 'published' AND get_my_claim('subscription_tier') IN ('premium')) OR
  -- Admin/editor only content is visible to admins and editors when published
  (access_level = 'admin_editor' AND status = 'published' AND get_my_claim('role') IN ('editor', 'admin')) OR
  -- Authors can always see their own reviews regardless of status/access level
  auth.uid() = author_id OR
  -- Editors and admins can see all reviews regardless of status/access level
  get_my_claim('role') IN ('editor', 'admin')
);

-- Ensure the INSERT policy allows creation with new access levels
-- The current policy should work, but let's verify it's comprehensive
DROP POLICY IF EXISTS "Practitioners and editors can create reviews" ON "Reviews";

CREATE POLICY "Practitioners and editors can create reviews"
ON "Reviews" FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.role() = 'authenticated' AND
  -- Must be the author
  auth.uid() = author_id AND
  -- Must have appropriate role
  get_my_claim('role') IN ('practitioner', 'editor', 'admin') AND
  -- Must use valid access level
  access_level IN ('free', 'premium', 'admin_editor')
);