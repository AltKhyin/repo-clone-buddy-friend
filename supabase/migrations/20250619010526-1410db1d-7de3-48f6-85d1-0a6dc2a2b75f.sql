
-- Promote specified users to admin role
-- This updates both the Practitioners table and JWT custom claims

-- Update the Practitioners table role
UPDATE "Practitioners" 
SET role = 'admin'
WHERE id IN ('f0da55ea-d932-49bd-bd80-208eff09b947', 'aecf539b-8a87-4fd1-b65a-5dc0cc606399');

-- Update the JWT custom claims in auth.users.raw_app_meta_data
-- This is CRITICAL for RLS policies and application logic to work correctly
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
WHERE id IN ('f0da55ea-d932-49bd-bd80-208eff09b947', 'aecf539b-8a87-4fd1-b65a-5dc0cc606399');
