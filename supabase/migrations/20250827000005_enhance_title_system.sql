-- ABOUTME: Enhanced title system with prefix, colors, and font customization for Reddit-perfect headers

-- Add new columns for enhanced title system
ALTER TABLE "public"."page_settings" 
ADD COLUMN IF NOT EXISTS "title_prefix" TEXT,                    -- Prefix text like "R."
ADD COLUMN IF NOT EXISTS "title_color" TEXT,                     -- Title color (theme token or hex)
ADD COLUMN IF NOT EXISTS "prefix_color" TEXT,                    -- Prefix color (theme token or hex)
ADD COLUMN IF NOT EXISTS "font_family" TEXT DEFAULT 'Inter';     -- Font family for title/prefix

-- Comments for the new columns
COMMENT ON COLUMN page_settings.title_prefix IS 'Prefix text displayed before the title (e.g., "R.")';
COMMENT ON COLUMN page_settings.title_color IS 'Color for the main title text (theme token or hex)';
COMMENT ON COLUMN page_settings.prefix_color IS 'Color for the prefix text (theme token or hex)';
COMMENT ON COLUMN page_settings.font_family IS 'Font family for title and prefix rendering';

-- Update existing data with sensible defaults based on current titles
UPDATE page_settings 
SET 
  title_prefix = CASE 
    WHEN title LIKE 'R.%' THEN 'R.'
    ELSE NULL
  END,
  title = CASE 
    WHEN title LIKE 'R.%' THEN TRIM(SUBSTRING(title FROM 3))
    ELSE title
  END,
  title_color = NULL,  -- Will use default theme color
  prefix_color = NULL, -- Will use default theme color  
  font_family = 'Inter'
WHERE title IS NOT NULL;

-- Insert default settings for acervo and comunidade if they don't exist
INSERT INTO page_settings (page_id, title, title_prefix, font_family)
VALUES 
  ('acervo', 'Acervo', 'R.', 'Inter'),
  ('comunidade', 'Comunidade', 'R.', 'Inter')
ON CONFLICT (page_id) DO UPDATE SET
  title_prefix = COALESCE(EXCLUDED.title_prefix, page_settings.title_prefix),
  font_family = COALESCE(EXCLUDED.font_family, page_settings.font_family);

-- Verify the enhanced title system structure
-- Expected columns: id, page_id, title, title_prefix, title_color, prefix_color, font_family, banner_url, avatar_url, is_active, created_at, updated_at