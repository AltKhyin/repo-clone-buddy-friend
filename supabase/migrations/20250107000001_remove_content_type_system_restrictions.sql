-- Migration: Remove system type restrictions from all content types
-- All content types should be fully editable and deletable by admins

-- Update all content types to be non-system types (fully editable)
UPDATE "ContentTypes" SET "is_system" = false WHERE "is_system" = true;

-- Update table comment to reflect new behavior
COMMENT ON TABLE "ContentTypes" IS 'Fully customizable content type labels with styling for review categorization - all types are user-manageable';

-- Add comment explaining the change
COMMENT ON COLUMN "ContentTypes"."is_system" IS 'Legacy field - all content types are now fully manageable by administrators';