-- ABOUTME: Creates Supabase Storage bucket and RLS policies for review cover images
-- Migration: 20250702000001_create_review_images_storage

-- Create storage bucket for review cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects for the review-images bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to review cover images
CREATE POLICY "Allow public read access to review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- Allow authenticated users to upload review images
CREATE POLICY "Allow authenticated users to upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text -- Users can only upload to their own folder
);

-- Allow users to update their own review images
CREATE POLICY "Allow users to update their own review images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own review images
CREATE POLICY "Allow users to delete their own review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow editors and admins to manage all review images
CREATE POLICY "Allow editors and admins to manage all review images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'review-images'
  AND auth.role() = 'authenticated'
  AND get_my_claim('role') IN ('editor', 'admin')
);

-- Update Reviews table access_level constraint to match business requirements
-- Change from (public, premium, private) to (free, premium, admin_editor)
ALTER TABLE "Reviews" DROP CONSTRAINT IF EXISTS reviews_access_level_check;
ALTER TABLE "Reviews" ADD CONSTRAINT reviews_access_level_check 
  CHECK (access_level IN ('free', 'premium', 'admin_editor'));

-- Update existing access_level values to match new constraint
UPDATE "Reviews" 
SET access_level = CASE 
  WHEN access_level = 'public' THEN 'free'
  WHEN access_level = 'premium' THEN 'premium'
  WHEN access_level = 'private' THEN 'admin_editor'
  ELSE 'free'
END;