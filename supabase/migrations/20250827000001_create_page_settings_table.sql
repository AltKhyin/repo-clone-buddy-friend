-- ABOUTME: Create page_settings table for customizable page headers (banner, avatar, title)

-- Create page_settings table following EVIDENS database patterns
CREATE TABLE IF NOT EXISTS "public"."page_settings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "page_id" TEXT NOT NULL UNIQUE, -- 'acervo', 'comunidade', etc.
    "title" TEXT,
    "description" TEXT,
    "banner_url" TEXT,
    "avatar_url" TEXT,
    "banner_urls" JSONB, -- Responsive banner URLs for different breakpoints
    "theme_color" TEXT DEFAULT '#0F172A',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_by" UUID REFERENCES auth.users(id),
    "updated_by" UUID REFERENCES auth.users(id),
    
    CONSTRAINT page_settings_page_id_check CHECK (page_id IN ('acervo', 'comunidade', 'homepage'))
);

-- Add RLS policies following existing patterns [C6.1]
ALTER TABLE "public"."page_settings" ENABLE ROW LEVEL SECURITY;

-- Public read access for all users (needed for page display)
CREATE POLICY "page_settings_public_read" ON "public"."page_settings"
    FOR SELECT USING (is_active = true);

-- Admin-only write access using existing get_my_claim function [C6.2]
CREATE POLICY "page_settings_admin_write" ON "public"."page_settings"
    FOR ALL USING (
        COALESCE((get_my_claim('role'::text))::text, 'practitioner'::text) = 'admin'::text
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS page_settings_page_id_idx ON "public"."page_settings"(page_id);
CREATE INDEX IF NOT EXISTS page_settings_active_idx ON "public"."page_settings"(is_active) WHERE is_active = true;

-- Insert default settings for main pages
INSERT INTO "public"."page_settings" (page_id, title, description, is_active) VALUES
    ('acervo', 'Acervo EVIDENS', 'Explore nossa coleção de reviews e conteúdo científico', true),
    ('comunidade', 'Comunidade EVIDENS', 'Participe das discussões e conecte-se com outros profissionais', true)
ON CONFLICT (page_id) DO NOTHING;

-- Update function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER page_settings_updated_at_trigger
    BEFORE UPDATE ON "public"."page_settings"
    FOR EACH ROW EXECUTE FUNCTION update_page_settings_updated_at();

COMMENT ON TABLE "public"."page_settings" IS 'Configurable page header settings for main application pages';
COMMENT ON COLUMN "public"."page_settings"."banner_urls" IS 'Responsive banner URLs: {"small": "url1", "medium": "url2", "large": "url3", "xlarge": "url4"}';
COMMENT ON COLUMN "public"."page_settings"."page_id" IS 'Unique identifier for each page (acervo, comunidade, homepage)';