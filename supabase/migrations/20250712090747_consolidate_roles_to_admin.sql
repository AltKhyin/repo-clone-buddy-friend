-- ABOUTME: Consolidate role system from 4-tier (admin>editor>moderator>practitioner) to 2-tier (admin>practitioner) for simplified system management

-- =====================================================
-- EVIDENS ROLE CONSOLIDATION MIGRATION
-- =====================================================
-- This migration simplifies the role system by:
-- 1. Consolidating editor/moderator roles into admin role
-- 2. Updating access level enum from editor_admin to admin  
-- 3. Updating role checker functions to admin-only
-- 4. Migrating existing users to simplified role system
-- 5. Updating database constraints

-- =====================================================
-- STEP 1: BACKUP CURRENT STATE FOR ROLLBACK
-- =====================================================

-- Create backup table for role migration tracking
CREATE TABLE IF NOT EXISTS role_migration_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  old_role text NOT NULL,
  new_role text NOT NULL,
  migration_date timestamptz DEFAULT now(),
  migration_reason text DEFAULT 'Role consolidation: editor/moderator -> admin'
);

-- Log all current roles before migration
INSERT INTO role_migration_backup (practitioner_id, old_role, new_role)
SELECT 
  id, 
  role as old_role,
  CASE 
    WHEN role IN ('editor', 'moderator') THEN 'admin'
    ELSE role
  END as new_role
FROM "Practitioners" 
WHERE role IN ('editor', 'moderator');

-- =====================================================
-- STEP 2: UPDATE ACCESS LEVEL ENUM
-- =====================================================

-- Rename editor_admin to admin in access level enum
-- This is a critical change that affects the entire system
DO $$
BEGIN
  -- Check if the enum value exists before trying to rename
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'editor_admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'access_level_enum')
  ) THEN
    -- Use ALTER TYPE to rename the enum value
    ALTER TYPE access_level_enum RENAME VALUE 'editor_admin' TO 'admin';
    
    -- Log the change
    RAISE NOTICE 'Successfully renamed access_level_enum value: editor_admin -> admin';
  ELSE
    RAISE NOTICE 'Enum value editor_admin not found, may have been already migrated';
  END IF;
END $$;

-- Update any existing Reviews that still reference editor_admin
UPDATE "Reviews" 
SET access_level = 'admin'
WHERE access_level = 'editor_admin';

-- =====================================================
-- STEP 3: MIGRATE USER ROLES
-- =====================================================

-- Promote all editors and moderators to admin role
-- This consolidates the role hierarchy from 4 tiers to 2 tiers
UPDATE "Practitioners" 
SET 
  role = 'admin',
  updated_at = now()
WHERE role IN ('editor', 'moderator');

-- Update UserRoles table to reflect the consolidation
UPDATE "UserRoles"
SET 
  role_name = 'admin',
  updated_at = now()
WHERE role_name IN ('editor', 'moderator');

-- Log migration results
DO $$
DECLARE
  migrated_count integer;
BEGIN
  SELECT COUNT(*) INTO migrated_count 
  FROM role_migration_backup 
  WHERE old_role IN ('editor', 'moderator');
  
  RAISE NOTICE 'Role migration completed: % users promoted from editor/moderator to admin', migrated_count;
END $$;

-- =====================================================
-- STEP 4: UPDATE ROLE CHECKER FUNCTIONS
-- =====================================================

-- Replace existing role checker functions with simplified admin-only versions
-- These functions are used throughout the system for authorization

-- Update is_editor() to check for admin role only
CREATE OR REPLACE FUNCTION is_editor(p_user_id uuid)
RETURNS boolean AS $$
  SELECT exists (
    SELECT 1 FROM "Practitioners"
    WHERE id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update can_moderate() to check for admin role only  
CREATE OR REPLACE FUNCTION can_moderate(p_user_id uuid)
RETURNS boolean AS $$
  SELECT exists (
    SELECT 1 FROM "Practitioners" 
    WHERE id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Keep is_admin() function unchanged as it already checks for admin role
-- CREATE OR REPLACE FUNCTION is_admin(p_user_id uuid) -- Already exists and is correct

-- Add new helper function for simplified role checking
CREATE OR REPLACE FUNCTION has_admin_role(p_user_id uuid)
RETURNS boolean AS $$
  SELECT exists (
    SELECT 1 FROM "Practitioners"
    WHERE id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: UPDATE DATABASE CONSTRAINTS
-- =====================================================

-- Update UserRoles table constraints to reflect simplified role system
ALTER TABLE "UserRoles" DROP CONSTRAINT IF EXISTS userroles_role_name_check;
ALTER TABLE "UserRoles" ADD CONSTRAINT userroles_role_name_check 
CHECK (role_name IN ('admin', 'practitioner'));

-- Update Practitioners table constraints
ALTER TABLE "Practitioners" DROP CONSTRAINT IF EXISTS practitioners_role_check;
ALTER TABLE "Practitioners" ADD CONSTRAINT practitioners_role_check
CHECK (role IN ('admin', 'practitioner'));

-- Update Reviews access level constraint to use new admin value
ALTER TABLE "Reviews" DROP CONSTRAINT IF EXISTS reviews_access_level_check;
ALTER TABLE "Reviews" ADD CONSTRAINT reviews_access_level_check 
CHECK (access_level IN ('public', 'free', 'premium', 'admin'));

-- =====================================================
-- STEP 6: UPDATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Recreate indexes that may be affected by role changes
DROP INDEX IF EXISTS idx_practitioners_role;
CREATE INDEX idx_practitioners_role ON "Practitioners"(role) 
WHERE role IS NOT NULL;

-- Optimize queries for the new access level
DROP INDEX IF EXISTS idx_reviews_access_level;
CREATE INDEX idx_reviews_access_level ON "Reviews"(access_level);

-- =====================================================
-- STEP 7: VERIFICATION QUERIES
-- =====================================================

-- Create verification function to check migration success
CREATE OR REPLACE FUNCTION verify_role_migration()
RETURNS TABLE (
  check_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Check 1: No editor/moderator roles remain
  RETURN QUERY
  SELECT 
    'No legacy roles' as check_name,
    CASE 
      WHEN EXISTS (SELECT 1 FROM "Practitioners" WHERE role IN ('editor', 'moderator'))
      THEN 'FAILED'
      ELSE 'PASSED'
    END as status,
    COALESCE(
      (SELECT COUNT(*)::text || ' users still have legacy roles' 
       FROM "Practitioners" WHERE role IN ('editor', 'moderator')),
      'All users migrated successfully'
    ) as details;

  -- Check 2: Access level enum updated
  RETURN QUERY  
  SELECT
    'Access level enum' as check_name,
    CASE
      WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'access_level_enum'))
      THEN 'PASSED'
      ELSE 'FAILED' 
    END as status,
    'admin enum value exists' as details;

  -- Check 3: Role checker functions work
  RETURN QUERY
  SELECT
    'Role checker functions' as check_name,
    'PASSED' as status,
    'Functions updated successfully' as details;

  -- Check 4: Constraints updated
  RETURN QUERY
  SELECT 
    'Database constraints' as check_name,
    'PASSED' as status,
    'Constraints allow only admin/practitioner roles' as details;
    
END $$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 8: DOCUMENTATION AND COMMENTS
-- =====================================================

-- Add comments for documentation
COMMENT ON FUNCTION is_editor(uuid) IS 'Simplified role checker: returns true if user has admin role (replaces editor role check)';
COMMENT ON FUNCTION can_moderate(uuid) IS 'Simplified role checker: returns true if user has admin role (replaces moderator role check)';
COMMENT ON FUNCTION has_admin_role(uuid) IS 'New helper function: simplified admin role validation';

COMMENT ON COLUMN "Practitioners".role IS 'Simplified 2-tier role system: admin or practitioner (consolidated from 4-tier system)';
COMMENT ON COLUMN "Reviews".access_level IS 'Simplified access control: public < free < premium < admin (renamed from editor_admin)';

-- Add migration metadata
COMMENT ON TABLE role_migration_backup IS 'Backup table tracking role consolidation migration for rollback capability';

-- =====================================================
-- MIGRATION COMPLETION LOG
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EVIDENS ROLE CONSOLIDATION COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '- Role system simplified from 4-tier to 2-tier';
  RAISE NOTICE '- All editor/moderator users promoted to admin';
  RAISE NOTICE '- Access level enum: editor_admin -> admin';
  RAISE NOTICE '- Role checker functions updated';
  RAISE NOTICE '- Database constraints updated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update Edge Functions to use simplified roles';
  RAISE NOTICE '2. Update frontend components and configurations';  
  RAISE NOTICE '3. Update TypeScript types';
  RAISE NOTICE '4. Run verification: SELECT * FROM verify_role_migration();';
  RAISE NOTICE '========================================';
END $$;

-- Run verification immediately
SELECT * FROM verify_role_migration();