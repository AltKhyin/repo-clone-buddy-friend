-- Fix missing post data in CommunityPosts table
-- Add post_type column and update existing records with missing data

-- First, add the post_type column if it doesn't exist
ALTER TABLE "CommunityPosts" 
ADD COLUMN IF NOT EXISTS "post_type" TEXT DEFAULT 'text';

-- Add constraint for post_type if it doesn't exist
DO $$
BEGIN
    -- Check if the constraint already exists before adding it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'communityposts_post_type_check' 
        AND table_name = 'CommunityPosts'
    ) THEN
        ALTER TABLE "CommunityPosts" 
        ADD CONSTRAINT "communityposts_post_type_check" 
        CHECK (("post_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'link'::"text", 'poll'::"text", 'video'::"text"])));
    END IF;
END $$;

-- Update existing posts with empty or null post_type
UPDATE "CommunityPosts" 
SET post_type = CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN 'image'
    WHEN video_url IS NOT NULL AND video_url != '' THEN 'video'
    WHEN poll_data IS NOT NULL THEN 'poll'
    ELSE 'text'
END
WHERE post_type IS NULL OR post_type = '';

-- Fix any null created_at timestamps
UPDATE "CommunityPosts" 
SET created_at = NOW()
WHERE created_at IS NULL;

-- Fix any null author_id (set to a default system user if available)
-- Note: This might need adjustment based on your system setup
-- UPDATE "CommunityPosts" 
-- SET author_id = (SELECT id FROM "Practitioners" WHERE role = 'admin' LIMIT 1)
-- WHERE author_id IS NULL;

-- Create index on post_type for better performance
CREATE INDEX IF NOT EXISTS "idx_community_posts_post_type" ON "CommunityPosts"(post_type);

-- Update the comment count function to handle potential null values better
CREATE OR REPLACE FUNCTION get_comment_count(post_id_param INTEGER)
RETURNS BIGINT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT COUNT(*) FROM "CommunityPosts" WHERE parent_post_id = post_id_param),
        0
    );
END;
$$ LANGUAGE plpgsql STABLE;