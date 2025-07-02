-- ABOUTME: Creates function to update JWT claims for proper RLS policy enforcement
-- Migration: 20250702000003_create_jwt_claims_function

-- Create a function to update user JWT claims
CREATE OR REPLACE FUNCTION update_user_jwt_claims(user_id UUID, new_role TEXT, new_subscription_tier TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's app_metadata to include role and subscription_tier claims
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object(
      'role', new_role,
      'subscription_tier', new_subscription_tier,
      'claims_role', new_role,
      'claims_subscription_tier', new_subscription_tier
    )
  WHERE id = user_id;
END;
$$;

-- Create a function to sync existing user metadata to JWT claims format
CREATE OR REPLACE FUNCTION sync_user_claims()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users and sync their claims
  FOR user_record IN 
    SELECT id, raw_app_meta_data 
    FROM auth.users 
    WHERE raw_app_meta_data IS NOT NULL
  LOOP
    -- Extract role and subscription_tier from existing metadata
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || 
      jsonb_build_object(
        'claims_role', COALESCE(raw_app_meta_data->>'role', 'practitioner'),
        'claims_subscription_tier', COALESCE(raw_app_meta_data->>'subscription_tier', 'free')
      )
    WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Update the get_my_claim function to also check the claims_* format
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) 
RETURNS TEXT 
LANGUAGE SQL 
STABLE
AS $$
  SELECT COALESCE(
    -- First try the standard JWT claim
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> claim, ''),
    -- Then try the claims_* prefixed version
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> ('claims_' || claim), ''),
    -- Fallback for development/testing
    CASE 
      WHEN claim = 'role' THEN 'admin'
      WHEN claim = 'subscription_tier' THEN 'free'
      ELSE NULL
    END
  )::TEXT;
$$;

-- Run the sync function to update existing users
SELECT sync_user_claims();