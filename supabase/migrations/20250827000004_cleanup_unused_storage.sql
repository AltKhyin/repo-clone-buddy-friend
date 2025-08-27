-- ABOUTME: Clean up unused page-assets storage bucket and related functions for simplified Reddit system

-- Remove all RLS policies for page-assets bucket
DROP POLICY IF EXISTS "Public read access for page assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload page assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their page assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete page assets" ON storage.objects;

-- Remove any objects in the page-assets bucket first
DELETE FROM storage.objects WHERE bucket_id = 'page-assets';

-- Remove the page-assets bucket (no longer needed for simplified URL system)
DELETE FROM storage.buckets WHERE id = 'page-assets';

-- Remove any remaining unused database functions if they exist
DROP FUNCTION IF EXISTS update_page_settings_updated_at() CASCADE;

-- Comment on cleanup
COMMENT ON TABLE page_settings IS 'Simplified page settings for Reddit-perfect headers - uses direct URLs instead of file uploads';