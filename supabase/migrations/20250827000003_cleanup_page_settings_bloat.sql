-- ABOUTME: Database cleanup migration to achieve Reddit-perfect simplicity by removing bloat columns

-- Remove bloat columns that prevent Reddit visual parity
ALTER TABLE "public"."page_settings" 
DROP COLUMN IF EXISTS "description",                    -- Reddit headers don't show descriptions
DROP COLUMN IF EXISTS "theme_color",                   -- Use hardcoded theme tokens instead
DROP COLUMN IF EXISTS "banner_urls",                   -- Simplify to single banner_url
DROP COLUMN IF EXISTS "reddit_style_config",           -- Remove config system bloat
DROP COLUMN IF EXISTS "typography_primary",            -- Remove typography system
DROP COLUMN IF EXISTS "typography_secondary",          -- Remove typography system
DROP COLUMN IF EXISTS "upload_metadata",               -- Simplify upload system
DROP COLUMN IF EXISTS "banner_storage_paths",          -- Single image approach
DROP COLUMN IF EXISTS "avatar_storage_path",           -- Simplify storage approach
DROP COLUMN IF EXISTS "created_by",                    -- Remove user tracking
DROP COLUMN IF EXISTS "updated_by";                    -- Remove user tracking

-- Drop triggers first to avoid dependency issues
DROP TRIGGER IF EXISTS page_settings_cleanup_trigger ON page_settings;
DROP TRIGGER IF EXISTS update_page_settings_updated_at ON page_settings;

-- Now drop functions (CASCADE to handle any remaining dependencies)
DROP FUNCTION IF EXISTS generate_responsive_variants(TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_page_assets() CASCADE;
DROP FUNCTION IF EXISTS get_page_settings_with_urls(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_page_settings_updated_at() CASCADE;

-- Create simple updated_at trigger
CREATE OR REPLACE FUNCTION update_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_page_settings_updated_at
  BEFORE UPDATE ON page_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_page_settings_updated_at();

-- Comment on remaining essential columns
COMMENT ON COLUMN page_settings.id IS 'Primary key';
COMMENT ON COLUMN page_settings.page_id IS 'Page identifier (homepage, acervo, comunidade)';
COMMENT ON COLUMN page_settings.title IS 'Reddit-style page title';
COMMENT ON COLUMN page_settings.banner_url IS 'Single banner image URL for Reddit parity';
COMMENT ON COLUMN page_settings.avatar_url IS 'Avatar image URL (80px Reddit style)';
COMMENT ON COLUMN page_settings.is_active IS 'Whether settings are active';
COMMENT ON COLUMN page_settings.created_at IS 'Creation timestamp';
COMMENT ON COLUMN page_settings.updated_at IS 'Last update timestamp';

-- Verify final schema contains only essential fields
-- Expected columns: id, page_id, title, banner_url, avatar_url, is_active, created_at, updated_at