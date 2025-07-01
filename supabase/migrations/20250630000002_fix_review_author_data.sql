-- Migration: Fix null author_id values in Reviews table
-- Author: Claude Code Assistant  
-- Date: 2025-06-30
-- Purpose: Ensure all reviews have valid author_id values for RLS policies to work

-- CRITICAL FIX: Reviews table has null author_id values which cause RLS policies to fail
-- Even with correct column names, policies fail when author_id is null

-- First, let's check if we have any valid users in the system
-- If no users exist, we'll need to create a test user or handle this case

DO $$
DECLARE
    user_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count > 0 THEN
        -- Get the first available user ID
        SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
        
        -- Update all Reviews with null author_id to use the first user
        UPDATE public."Reviews" 
        SET author_id = first_user_id 
        WHERE author_id IS NULL;
        
        -- Log the fix
        RAISE NOTICE 'Fixed % reviews with null author_id, assigned to user %', 
            (SELECT COUNT(*) FROM public."Reviews" WHERE author_id = first_user_id),
            first_user_id;
    ELSE
        -- No users exist - this should be handled in the application
        RAISE WARNING 'No users found in auth.users table. Reviews with null author_id remain unfixed.';
        RAISE WARNING 'Please ensure users are properly created before using the editor.';
    END IF;
END $$;

-- Add a constraint to prevent future null author_id values (optional - uncomment if desired)
-- ALTER TABLE public."Reviews" 
-- ALTER COLUMN author_id SET NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN public."Reviews".author_id IS 'Fixed 2025-06-30: Null values updated to ensure RLS policies work correctly. Should reference auth.users.id.';

-- Verify the fix by checking for any remaining null values
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM public."Reviews" WHERE author_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE WARNING 'Still have % reviews with null author_id after migration', null_count;
    ELSE
        RAISE NOTICE 'All reviews now have valid author_id values';
    END IF;
END $$;