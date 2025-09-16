-- Change default subscription tier from 'free' to 'premium' for new accounts

-- Update the column default to premium
ALTER TABLE "public"."Practitioners"
ALTER COLUMN "subscription_tier" SET DEFAULT 'premium';

-- Update the handle_new_user function to set premium as default
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  INSERT INTO public."Practitioners" (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  -- Set the custom claims in auth.users.raw_app_meta_data.
  -- This is CRITICAL for RLS policies and application logic to work correctly.
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
      'role', 'practitioner',
      'subscription_tier', 'premium'
    )
  WHERE id = new.id;

  RETURN new;
END;
$$;

-- Update the get_my_claim function to default to premium instead of free
CREATE OR REPLACE FUNCTION get_my_claim(claim text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN NULL
      ELSE
        COALESCE(
          (auth.jwt() -> 'app_metadata' ->> claim)::text,
          CASE
            WHEN claim = 'subscription_tier' THEN 'premium'
            ELSE NULL
          END
        )
    END
$$;

-- Update comment to reflect new default
COMMENT ON COLUMN "public"."Practitioners"."subscription_tier" IS 'User subscription level: free or premium (default: premium)';