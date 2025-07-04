-- ABOUTME: Update profile system schema - add profession and social fields, remove biography and saved items

-- Step 1: Remove the Saved_Items table (no longer needed)
DROP TABLE IF EXISTS public."Saved_Items";

-- Step 2: Remove biography column from Practitioners
ALTER TABLE "Practitioners" 
DROP COLUMN IF EXISTS biography;

-- Step 3: Add profession field
ALTER TABLE "Practitioners" 
ADD COLUMN profession text;

-- Step 4: Add social media fields
ALTER TABLE "Practitioners" 
ADD COLUMN linkedin_url text,
ADD COLUMN youtube_url text,
ADD COLUMN instagram_url text,
ADD COLUMN facebook_url text,
ADD COLUMN twitter_url text,
ADD COLUMN website_url text;

-- Step 5: Add column comments for documentation
COMMENT ON COLUMN "Practitioners".profession IS 'User profession/job title for profile display';
COMMENT ON COLUMN "Practitioners".linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN "Practitioners".youtube_url IS 'YouTube channel URL';
COMMENT ON COLUMN "Practitioners".instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN "Practitioners".facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN "Practitioners".twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN "Practitioners".website_url IS 'Personal website URL';

-- Step 6: Remove the functions that are no longer needed
DROP FUNCTION IF EXISTS get_user_activity_summary;
DROP FUNCTION IF EXISTS toggle_saved_item;

-- Step 7: Remove any existing profile metrics functions (no longer needed)
DROP FUNCTION IF EXISTS get_user_contributions(uuid);
DROP FUNCTION IF EXISTS get_profile_metrics(uuid);