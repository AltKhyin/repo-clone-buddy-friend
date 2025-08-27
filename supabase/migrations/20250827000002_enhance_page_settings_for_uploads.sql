-- ABOUTME: Enhanced page_settings table for Reddit-perfect visual parity with image uploads and typography

-- Add new columns for Reddit-style visual parity and file management
ALTER TABLE "public"."page_settings" 
ADD COLUMN IF NOT EXISTS "avatar_storage_path" TEXT,           -- Supabase Storage path for uploaded avatar
ADD COLUMN IF NOT EXISTS "banner_storage_paths" JSONB,         -- Storage paths for responsive banners
ADD COLUMN IF NOT EXISTS "typography_primary" TEXT DEFAULT 'Inter',    -- Primary font family
ADD COLUMN IF NOT EXISTS "typography_secondary" TEXT DEFAULT 'Inter',  -- Secondary font family
ADD COLUMN IF NOT EXISTS "reddit_style_config" JSONB DEFAULT '{}',     -- Reddit-specific layout configs
ADD COLUMN IF NOT EXISTS "upload_metadata" JSONB DEFAULT '{}',         -- File upload metadata (sizes, formats)
ADD COLUMN IF NOT EXISTS "created_by" UUID REFERENCES auth.users(id),  -- User who created settings
ADD COLUMN IF NOT EXISTS "updated_by" UUID REFERENCES auth.users(id);  -- User who last updated

-- Create storage bucket for page assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'page-assets',
  'page-assets', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY IF NOT EXISTS "Public read access for page assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'page-assets');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload page assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'page-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('avatars', 'banners', 'temp')
);

CREATE POLICY IF NOT EXISTS "Authenticated users can update their page assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'page-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete page assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'page-assets' 
  AND auth.role() = 'authenticated'
);

-- Function to generate responsive image variants
CREATE OR REPLACE FUNCTION generate_responsive_variants(
  original_path TEXT,
  sizes TEXT[] DEFAULT ARRAY['small', 'medium', 'large', 'xlarge']
) RETURNS JSONB AS $$
DECLARE
  variants JSONB := '{}';
  size_config JSONB := '{
    "small": {"width": 320, "quality": 80},
    "medium": {"width": 768, "quality": 85}, 
    "large": {"width": 1200, "quality": 90},
    "xlarge": {"width": 1920, "quality": 95}
  }';
  size TEXT;
BEGIN
  FOREACH size IN ARRAY sizes LOOP
    variants := variants || jsonb_build_object(
      size, 
      jsonb_build_object(
        'path', original_path,
        'config', size_config->size,
        'url', concat('https://qjoxiowuiiupbvqlssgk.supabase.co/storage/v1/object/public/page-assets/', original_path)
      )
    );
  END LOOP;
  
  RETURN variants;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old page assets when updated
CREATE OR REPLACE FUNCTION cleanup_old_page_assets()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up old avatar if changed
  IF OLD.avatar_storage_path IS NOT NULL 
     AND OLD.avatar_storage_path != COALESCE(NEW.avatar_storage_path, '') THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'page-assets' 
    AND name = OLD.avatar_storage_path;
  END IF;
  
  -- Clean up old banner variants if changed  
  IF OLD.banner_storage_paths IS NOT NULL 
     AND OLD.banner_storage_paths != COALESCE(NEW.banner_storage_paths, '{}') THEN
    -- Extract paths from old JSONB and delete files
    PERFORM (
      SELECT DELETE FROM storage.objects 
      WHERE bucket_id = 'page-assets' 
      AND name = ANY(
        SELECT jsonb_array_elements_text(
          jsonb_path_query_array(OLD.banner_storage_paths, '$.*.path')
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cleanup
DROP TRIGGER IF EXISTS page_settings_cleanup_trigger ON page_settings;
CREATE TRIGGER page_settings_cleanup_trigger
  BEFORE UPDATE ON page_settings
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_page_assets();

-- Helper function to get optimized page settings with computed URLs
CREATE OR REPLACE FUNCTION get_page_settings_with_urls(p_page_id TEXT)
RETURNS TABLE (
  id UUID,
  page_id TEXT, 
  title TEXT,
  description TEXT,
  banner_url TEXT,
  avatar_url TEXT,
  banner_urls JSONB,
  theme_color TEXT,
  typography_primary TEXT,
  typography_secondary TEXT,
  reddit_style_config JSONB,
  computed_avatar_url TEXT,
  computed_banner_urls JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.page_id,
    ps.title,
    ps.description, 
    ps.banner_url,
    ps.avatar_url,
    ps.banner_urls,
    ps.theme_color,
    ps.typography_primary,
    ps.typography_secondary,
    ps.reddit_style_config,
    -- Computed avatar URL (prefer storage over direct URL)
    CASE 
      WHEN ps.avatar_storage_path IS NOT NULL THEN 
        concat('https://qjoxiowuiiupbvqlssgk.supabase.co/storage/v1/object/public/page-assets/', ps.avatar_storage_path)
      ELSE ps.avatar_url
    END as computed_avatar_url,
    -- Computed banner URLs with storage paths
    CASE
      WHEN ps.banner_storage_paths IS NOT NULL THEN ps.banner_storage_paths
      ELSE ps.banner_urls  
    END as computed_banner_urls,
    ps.is_active,
    ps.created_at,
    ps.updated_at
  FROM page_settings ps
  WHERE ps.page_id = p_page_id
  AND ps.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_page_settings_updated_at ON page_settings;
CREATE TRIGGER update_page_settings_updated_at
  BEFORE UPDATE ON page_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_page_settings_updated_at();

-- Comment on new columns for documentation
COMMENT ON COLUMN page_settings.avatar_storage_path IS 'Supabase Storage path for uploaded avatar image';
COMMENT ON COLUMN page_settings.banner_storage_paths IS 'JSONB object containing storage paths for responsive banner variants';
COMMENT ON COLUMN page_settings.typography_primary IS 'Primary font family (Google Fonts or system fonts)';
COMMENT ON COLUMN page_settings.typography_secondary IS 'Secondary font family for body text and descriptions';
COMMENT ON COLUMN page_settings.reddit_style_config IS 'Reddit-specific styling configuration (avatar size, spacing, etc.)';
COMMENT ON COLUMN page_settings.upload_metadata IS 'Metadata about uploaded files (original dimensions, file sizes, etc.)';