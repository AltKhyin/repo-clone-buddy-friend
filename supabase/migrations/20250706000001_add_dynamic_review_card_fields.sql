-- Migration: Add Dynamic Review Card Fields
-- Author: Claude Code Assistant  
-- Date: 2025-07-06
-- Purpose: Add optional fields for enhanced review cards with reading time and custom author info
-- Follows EVIDENS LEVER Framework: Extend existing tables instead of creating new ones

-- Add new optional fields to Reviews table for dynamic card functionality
ALTER TABLE "Reviews" 
ADD COLUMN "reading_time_minutes" INTEGER,
ADD COLUMN "custom_author_name" TEXT,
ADD COLUMN "custom_author_avatar_url" TEXT;

-- Add helpful comments for documentation
COMMENT ON COLUMN "Reviews"."reading_time_minutes" IS 'Estimated reading time in minutes. If null, will be auto-calculated from content length.';
COMMENT ON COLUMN "Reviews"."custom_author_name" IS 'Optional custom author name override. If null, defaults to the creator''s name from Practitioners table.';
COMMENT ON COLUMN "Reviews"."custom_author_avatar_url" IS 'Optional custom author avatar URL override. If null, defaults to the creator''s avatar from Practitioners table.';

-- Create partial indexes for performance optimization (only index non-null values)
CREATE INDEX CONCURRENTLY "idx_reviews_custom_author_name" ON "Reviews"("custom_author_name") WHERE "custom_author_name" IS NOT NULL;
CREATE INDEX CONCURRENTLY "idx_reviews_reading_time" ON "Reviews"("reading_time_minutes") WHERE "reading_time_minutes" IS NOT NULL;

-- Add constraints to ensure data quality
ALTER TABLE "Reviews" 
ADD CONSTRAINT "check_reading_time_positive" CHECK ("reading_time_minutes" IS NULL OR "reading_time_minutes" > 0),
ADD CONSTRAINT "check_custom_author_name_not_empty" CHECK ("custom_author_name" IS NULL OR LENGTH(TRIM("custom_author_name")) > 0);

-- Note: RLS policies from existing Reviews table automatically apply to new optional fields
-- No additional RLS policies needed as per EVIDENS C2.2.1 pattern

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully added dynamic review card fields to Reviews table';
    RAISE NOTICE '- reading_time_minutes: For estimated reading time display';
    RAISE NOTICE '- custom_author_name: For author name override';
    RAISE NOTICE '- custom_author_avatar_url: For author avatar override';
    RAISE NOTICE 'All fields are optional and inherit existing RLS policies';
END $$;
