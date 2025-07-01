-- Fix missing RLS policies for Reviews table
-- This addresses the 403 error when creating reviews due to missing INSERT policy

-- Ensure RLS is enabled on Reviews table
ALTER TABLE "Reviews" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Reviews are visible based on access level" ON "Reviews";
DROP POLICY IF EXISTS "Authors and editors can create reviews" ON "Reviews";
DROP POLICY IF EXISTS "Authors can update their own reviews; editors can update any" ON "Reviews";
DROP POLICY IF EXISTS "Editors and admins can delete reviews" ON "Reviews";

-- Create comprehensive RLS policies for Reviews table

-- 1. SELECT Policy: Reviews are visible based on access level and publication status
CREATE POLICY "Reviews are visible based on access level"
ON "Reviews" FOR SELECT
USING (
  -- Public reviews that are published are visible to everyone
  (access_level = 'public' AND status = 'published') OR
  -- Authors can see their own reviews regardless of status
  (auth.uid() = author_id) OR
  -- Editors and admins can see all reviews
  (get_my_claim('role') IN ('editor', 'admin'))
);

-- 2. INSERT Policy: Authors, editors, and admins can create reviews
CREATE POLICY "Authors and editors can create reviews"
ON "Reviews" FOR INSERT
WITH CHECK (
  -- Must be authenticated
  auth.role() = 'authenticated' AND
  -- Author ID must match authenticated user
  auth.uid() = author_id AND
  -- Must have appropriate role
  get_my_claim('role') IN ('author', 'editor', 'admin')
);

-- 3. UPDATE Policy: Authors can update their own reviews; editors can update any
CREATE POLICY "Authors can update their own reviews; editors can update any"
ON "Reviews" FOR UPDATE
USING (
  -- Authors can edit their own reviews
  (auth.uid() = author_id AND get_my_claim('role') = 'author') OR
  -- Editors and admins can edit any review
  (get_my_claim('role') IN ('editor', 'admin'))
)
WITH CHECK (
  -- Same conditions for the new row
  (auth.uid() = author_id AND get_my_claim('role') = 'author') OR
  (get_my_claim('role') IN ('editor', 'admin'))
);

-- 4. DELETE Policy: Editors and admins can delete reviews
CREATE POLICY "Editors and admins can delete reviews"
ON "Reviews" FOR DELETE
USING (
  get_my_claim('role') IN ('editor', 'admin')
);