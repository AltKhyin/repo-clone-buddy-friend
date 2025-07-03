-- ABOUTME: Standardize access levels to 4-tier system (public < free < premium < editor_admin)

-- Step 1: Create enum type for access levels
CREATE TYPE access_level_enum AS ENUM ('public', 'free', 'premium', 'editor_admin');

-- Step 2: Update existing Reviews table to use new access levels
-- Map old values to new 4-tier system
UPDATE "Reviews" 
SET access_level = CASE
  WHEN access_level IN ('public', 'free_users_only') THEN 'free'
  WHEN access_level = 'premium' THEN 'premium'
  WHEN access_level = 'admin_editor' THEN 'editor_admin'
  ELSE 'public' -- Default fallback
END;

-- Step 3: Add check constraint for valid access levels
ALTER TABLE "Reviews" 
ADD CONSTRAINT reviews_access_level_check 
CHECK (access_level IN ('public', 'free', 'premium', 'editor_admin'));

-- Step 4: Set default value for access_level
ALTER TABLE "Reviews" 
ALTER COLUMN access_level SET DEFAULT 'public';

-- Step 5: Add index for access level queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_reviews_access_level ON "Reviews"(access_level);
CREATE INDEX IF NOT EXISTS idx_reviews_status_access_level ON "Reviews"(status, access_level);

-- Step 6: Update any existing data that might have invalid access levels
UPDATE "Reviews" 
SET access_level = 'public' 
WHERE access_level NOT IN ('public', 'free', 'premium', 'editor_admin');

-- Step 7: Ensure Practitioners table has consistent subscription_tier values
ALTER TABLE "Practitioners" 
ADD CONSTRAINT practitioners_subscription_tier_check 
CHECK (subscription_tier IN ('free', 'premium'));

-- Step 8: Update any invalid subscription tiers
UPDATE "Practitioners" 
SET subscription_tier = 'free' 
WHERE subscription_tier NOT IN ('free', 'premium') OR subscription_tier IS NULL;

-- Step 9: Set default value for subscription_tier
ALTER TABLE "Practitioners" 
ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Step 10: Add comment for documentation
COMMENT ON COLUMN "Reviews".access_level IS '4-tier access control: public (0) < free (1) < premium (2) < editor_admin (3)';
COMMENT ON COLUMN "Practitioners".subscription_tier IS 'User subscription level: free or premium';

-- Verification queries (can be run to check migration success)
-- SELECT access_level, COUNT(*) FROM "Reviews" GROUP BY access_level;
-- SELECT subscription_tier, COUNT(*) FROM "Practitioners" GROUP BY subscription_tier;