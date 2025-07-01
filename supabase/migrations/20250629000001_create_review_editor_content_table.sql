-- Migration: Create review_editor_content table for Visual Composition Engine persistence
-- Author: Claude Code Assistant
-- Date: 2025-06-29
-- Purpose: Store structured content v2.0 for the Visual Composition Engine editor

-- Create review_editor_content table
CREATE TABLE IF NOT EXISTS public.review_editor_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id INTEGER NOT NULL,
    structured_content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_review_editor_content_review_id 
        FOREIGN KEY (review_id) 
        REFERENCES public."Reviews"(id) 
        ON DELETE CASCADE,
    
    -- Ensure only one editor content per review
    CONSTRAINT unique_review_editor_content 
        UNIQUE (review_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_editor_content_review_id 
    ON public.review_editor_content(review_id);

CREATE INDEX IF NOT EXISTS idx_review_editor_content_updated_at 
    ON public.review_editor_content(updated_at);

-- Enable Row Level Security
ALTER TABLE public.review_editor_content ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access editor content for reviews they created
CREATE POLICY "Users can view their own review editor content" 
    ON public.review_editor_content 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.created_by = auth.uid()
        )
    );

-- RLS Policy: Users can insert editor content for reviews they created
CREATE POLICY "Users can create editor content for their reviews" 
    ON public.review_editor_content 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.created_by = auth.uid()
        )
    );

-- RLS Policy: Users can update editor content for reviews they created
CREATE POLICY "Users can update their own review editor content" 
    ON public.review_editor_content 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.created_by = auth.uid()
        )
    );

-- RLS Policy: Users can delete editor content for reviews they created
CREATE POLICY "Users can delete their own review editor content" 
    ON public.review_editor_content 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public."Reviews" r 
            WHERE r.id = review_editor_content.review_id 
            AND r.created_by = auth.uid()
        )
    );

-- RLS Policy: Admins can access all editor content
CREATE POLICY "Admins can manage all review editor content" 
    ON public.review_editor_content 
    FOR ALL 
    USING (
        (SELECT get_my_claim('role')) IN ('admin', 'super_admin')
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_review_editor_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on changes
CREATE TRIGGER trigger_update_review_editor_content_updated_at
    BEFORE UPDATE ON public.review_editor_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_review_editor_content_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.review_editor_content IS 'Stores structured content v2.0 data for the Visual Composition Engine editor. Each review can have one editor content record containing the JSONB representation of the visual composition.';

COMMENT ON COLUMN public.review_editor_content.structured_content IS 'JSONB field containing the complete structured content v2.0 data including nodes, layouts, and metadata for the Visual Composition Engine.';

COMMENT ON COLUMN public.review_editor_content.review_id IS 'Foreign key reference to the review this editor content belongs to. Each review can have only one editor content record.';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_editor_content TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;