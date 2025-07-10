-- ABOUTME: Unify profession fields - migrate profession_flair data to profession field for consistency

-- Step 1: Backup existing data by creating a temporary audit table
CREATE TABLE IF NOT EXISTS profession_field_audit (
  id uuid PRIMARY KEY,
  profession_before text,
  profession_flair_before text,
  migration_timestamp timestamp DEFAULT now(),
  FOREIGN KEY (id) REFERENCES "Practitioners"(id)
);

-- Step 2: Record current state for audit purposes
INSERT INTO profession_field_audit (id, profession_before, profession_flair_before)
SELECT 
  id,
  profession,
  profession_flair
FROM "Practitioners" 
WHERE profession_flair IS NOT NULL 
   OR profession IS NOT NULL;

-- Step 3: Data migration strategy - preserve all existing data
-- Migrate profession_flair to profession field where profession is null or empty
UPDATE "Practitioners" 
SET profession = profession_flair
WHERE profession_flair IS NOT NULL 
  AND profession_flair != ''
  AND (profession IS NULL OR profession = '');

-- Step 4: Handle cases where both fields exist but differ (manual review needed)
-- For now, keep profession as the primary field (user-set data takes precedence)
-- Log cases where they differ for manual review
DO $$
BEGIN
  -- Check if there are conflicting cases
  IF EXISTS (
    SELECT 1 FROM "Practitioners" 
    WHERE profession IS NOT NULL 
      AND profession != ''
      AND profession_flair IS NOT NULL 
      AND profession_flair != ''
      AND profession != profession_flair
  ) THEN
    RAISE NOTICE 'WARNING: Found cases where profession and profession_flair differ. User-set profession field takes precedence.';
  END IF;
END $$;

-- Step 5: Add column comment for documentation
COMMENT ON COLUMN "Practitioners".profession IS 'Unified profession field - migrated from profession_flair on 2025-07-10. User-editable job title for profile display.';

-- Step 6: Ensure profession_flair is still available for gradual migration
-- DO NOT DROP profession_flair yet - this will be done in a separate migration after admin system is updated
COMMENT ON COLUMN "Practitioners".profession_flair IS 'DEPRECATED: Legacy profession field. Data migrated to profession field. Will be removed after admin system update.';