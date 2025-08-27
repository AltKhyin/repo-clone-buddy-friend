-- Migration: Add Featured Review Setting to SiteSettings
-- Author: Claude Code Assistant  
-- Date: 2025-08-27
-- Purpose: Add manual featured review selection capability for homepage
-- Follows EVIDENS LEVER Framework [C0.2.1]: Extend existing SiteSettings table instead of creating new schema

-- Add featured review configuration to existing SiteSettings table
INSERT INTO "SiteSettings" (key, value, description, category) VALUES
('featured_review_id', 'null'::jsonb, 'ID of the manually selected featured review for homepage. If null, defaults to most recent published review.', 'homepage');

-- Add helpful comment for documentation
COMMENT ON TABLE "SiteSettings" IS 'System-wide configuration settings including homepage featured review selection';

-- Log completion for deployment tracking
DO $$
BEGIN
    RAISE NOTICE 'Successfully added featured_review_id setting to SiteSettings table';
    RAISE NOTICE '- Key: featured_review_id';  
    RAISE NOTICE '- Purpose: Manual homepage featured review selection';
    RAISE NOTICE '- Default: null (auto-selects most recent published review)';
    RAISE NOTICE '- Admin can set specific review ID to override automatic selection';
END $$;