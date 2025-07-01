-- Migration: Fix RLS policies for review_editor_content table
-- Author: Claude Code Assistant
-- Date: 2025-06-30
-- Purpose: Correct column name mismatch in RLS policies (created_by -> author_id)

-- CRITICAL FIX: The original RLS policies reference 'created_by' column which doesn't exist
-- The Reviews table actually has 'author_id' column, causing all policies to fail

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can view their own review editor content" ON public.review_editor_content;
DROP POLICY IF EXISTS "Users can create editor content for their reviews" ON public.review_editor_content;
DROP POLICY IF EXISTS "Users can update their own review editor content" ON public.review_editor_content;
DROP POLICY IF EXISTS "Users can delete their own review editor content" ON public.review_editor_content;

-- Create corrected policies with proper column names
CREATE POLICY "Users can view their own review editor content" 
    ON public.review_editor_content 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.author_id = auth.uid()  -- FIXED: author_id instead of created_by
        )
    );

CREATE POLICY "Users can create editor content for their reviews" 
    ON public.review_editor_content 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.author_id = auth.uid()  -- FIXED: author_id instead of created_by
        )
    );

CREATE POLICY "Users can update their own review editor content" 
    ON public.review_editor_content 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.author_id = auth.uid()  -- FIXED: author_id instead of created_by
        )
    );

CREATE POLICY "Users can delete their own review editor content" 
    ON public.review_editor_content 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.author_id = auth.uid()  -- FIXED: author_id instead of created_by
        )
    );

-- Note: Admin policy remains unchanged as it uses role-based access
-- The existing admin policy should still work correctly:
-- CREATE POLICY "Admins can manage all review editor content" 
--     ON public.review_editor_content 
--     FOR ALL 
--     USING (
--         (SELECT get_my_claim('role')) IN ('admin', 'super_admin')
--     );

-- Add helpful comment explaining the fix
COMMENT ON TABLE public.review_editor_content IS 'RLS policies corrected 2025-06-30: Fixed column reference from created_by to author_id to match actual Reviews table schema.';