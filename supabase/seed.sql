-- ABOUTME: Seed data for local development environment

-- Note: This file is executed automatically when running `supabase db reset`
-- It provides test data for local development but is NOT applied during production deployment

-- Test data will be added here as needed for local development testing
-- Currently empty - to be populated with mock data for Edge Function testing

-- Example test user (commented out - uncomment and modify as needed):
-- INSERT INTO auth.users (id, email) VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'test-admin@example.com')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public."Practitioners" (id, email, full_name, role, subscription_tier, banned, created_at) VALUES 
--   ('00000000-0000-0000-0000-000000000000', 'test-admin@example.com', 'Test Admin', 'admin', 'pro', false, now())
-- ON CONFLICT (id) DO NOTHING;