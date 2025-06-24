
-- Phase 1.1: Database Schema Implementation
-- Add publication workflow fields to Reviews table
ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "review_status" TEXT DEFAULT 'draft' 
  CHECK (review_status IN ('draft', 'under_review', 'scheduled', 'published', 'archived'));
ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "reviewer_id" UUID REFERENCES "Practitioners"(id);
ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "scheduled_publish_at" TIMESTAMPTZ;
ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "publication_notes" TEXT;
ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "review_requested_at" TIMESTAMPTZ;
ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMPTZ;

-- Create Publication_History table
CREATE TABLE IF NOT EXISTS "Publication_History" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "review_id" INT NOT NULL REFERENCES "Reviews"(id) ON DELETE CASCADE,
  "action" TEXT NOT NULL CHECK (action IN ('created', 'submitted_for_review', 'approved', 'rejected', 'scheduled', 'published', 'unpublished', 'archived')),
  "performed_by" UUID NOT NULL REFERENCES "Practitioners"(id),
  "notes" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS "idx_reviews_review_status" ON "Reviews"("review_status");
CREATE INDEX IF NOT EXISTS "idx_reviews_reviewer_id" ON "Reviews"("reviewer_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_scheduled_publish" ON "Reviews"("scheduled_publish_at") 
  WHERE "scheduled_publish_at" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_publication_history_review_id" ON "Publication_History"("review_id");

-- Enable RLS and create policies
ALTER TABLE "Publication_History" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage publication history" 
  ON "Publication_History" FOR ALL 
  USING (get_my_claim('role') IN ('admin', 'editor'));
