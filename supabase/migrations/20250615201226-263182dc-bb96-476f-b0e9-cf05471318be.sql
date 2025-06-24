
-- [EVIDENS] Migration: Initialize User Identity Schema
-- Version: 1.0
-- Date: 2025-06-15
-- Tasks: 1.1, 1.2, 1.3
-- Docs: [DOC_3], [DOC_4], [Blueprint] 01

-- =================================================================
-- Task 1.1: Create Core Identity & Onboarding Tables
-- =================================================================

-- Create the Practitioners table to store public user profile data.
-- This table is linked 1:1 with auth.users.
CREATE TABLE "Practitioners" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "full_name" TEXT,
  "avatar_url" TEXT,
  "role" TEXT NOT NULL DEFAULT 'practitioner',
  "subscription_tier" TEXT NOT NULL DEFAULT 'free',
  "contribution_score" INT NOT NULL DEFAULT 0,
  "profession_flair" TEXT,
  "display_hover_card" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the OnboardingQuestions table to store questions for the new user wizard.
CREATE TABLE "OnboardingQuestions" (
    "id" SERIAL PRIMARY KEY,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL, -- e.g., 'multiple_choice', 'text_area', 'rating_scale'
    "options" JSONB, -- For multiple choice answers
    "order_index" INT NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the OnboardingAnswers table to store user responses.
CREATE TABLE "OnboardingAnswers" (
    "id" SERIAL PRIMARY KEY,
    "practitioner_id" UUID NOT NULL REFERENCES "Practitioners"(id) ON DELETE CASCADE,
    "question_id" INT NOT NULL REFERENCES "OnboardingQuestions"(id) ON DELETE CASCADE,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("practitioner_id", "question_id")
);

-- =================================================================
-- Task 1.2: Create JWT Claims Trigger & Helper Function
-- =================================================================

-- Create a helper function to easily access JWT claims within RLS policies.
-- As specified in [DOC_4].
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> claim, '')::TEXT;
$$ LANGUAGE sql STABLE;

-- Create the trigger function to automatically populate the Practitioners table
-- and, most importantly, set the custom JWT claims on the new user.
-- As specified by Rule S4 and [Blueprint] 01.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create a corresponding profile in public.Practitioners
  INSERT INTO public."Practitioners" (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  -- Set the custom claims in auth.users.raw_app_meta_data.
  -- This is CRITICAL for RLS policies and application logic to work correctly.
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
      'role', 'practitioner',
      'subscription_tier', 'free'
    )
  WHERE id = new.id;
  
  RETURN new;
END;
$$;

-- Activate the trigger to run after every new user is created in auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =================================================================
-- Task 1.3: Implement Row Level Security (RLS)
-- =================================================================

-- Enable RLS and define policies for the Practitioners table as per [DOC_4].
ALTER TABLE "Practitioners" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view their own profile, and admins can view all."
ON "Practitioners" FOR SELECT
USING (
  (auth.uid() = id) OR (get_my_claim('role') IN ('admin', 'editor'))
);

CREATE POLICY "Practitioners can update their own profile."
ON "Practitioners" FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Enable RLS and define policies for the Onboarding tables.
ALTER TABLE "OnboardingQuestions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view onboarding questions."
ON "OnboardingQuestions" FOR SELECT
USING ( auth.role() = 'authenticated' );

CREATE POLICY "Admins can manage onboarding questions."
ON "OnboardingQuestions" FOR ALL
USING ( get_my_claim('role') IN ('admin', 'editor') );


ALTER TABLE "OnboardingAnswers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own onboarding answers."
ON "OnboardingAnswers" FOR ALL
USING ( auth.uid() = practitioner_id )
WITH CHECK ( auth.uid() = practitioner_id );

CREATE POLICY "Admins can view all onboarding answers."
ON "OnboardingAnswers" FOR SELECT
USING ( get_my_claim('role') IN ('admin', 'editor') );

