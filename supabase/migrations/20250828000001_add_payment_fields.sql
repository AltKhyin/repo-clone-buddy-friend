-- ABOUTME: Extend Practitioners table with payment fields and create payment events table for EVIDENS payment system
-- Version: 1.0
-- Date: 2025-08-28
-- Task: Milestone 1 - Database Extensions
-- Directive: [C2.1] Extend existing tables, never create new ones
-- CLAUDE.md Reference: [C2.1], [C6.1.1], [C6.1.3]

-- =================================================================
-- Task 1.1: Extend Practitioners Table with Payment Fields
-- =================================================================

-- Add optional payment fields to existing Practitioners table
-- Following [C2.1] directive to extend existing tables rather than create new ones
ALTER TABLE "Practitioners" 
ADD COLUMN IF NOT EXISTS "pagarme_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "subscription_status" TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS "subscription_plan" TEXT,
ADD COLUMN IF NOT EXISTS "subscription_id" TEXT,
ADD COLUMN IF NOT EXISTS "payment_metadata" JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "payment_method_preferred" TEXT;

-- Add comments to document the new payment fields
COMMENT ON COLUMN "Practitioners".pagarme_customer_id IS 'Pagar.me customer ID for payment processing';
COMMENT ON COLUMN "Practitioners".subscription_status IS 'Current subscription status: active, inactive, past_due, suspended, canceled';
COMMENT ON COLUMN "Practitioners".subscription_plan IS 'Current subscription plan type';
COMMENT ON COLUMN "Practitioners".subscription_id IS 'Pagar.me subscription ID';
COMMENT ON COLUMN "Practitioners".payment_metadata IS 'Flexible JSONB field for payment-related metadata';
COMMENT ON COLUMN "Practitioners".subscription_expires_at IS 'When the current subscription expires';
COMMENT ON COLUMN "Practitioners".payment_method_preferred IS 'User preferred payment method: pix, credit_card, boleto';

-- Create indexes for payment-related queries for performance
CREATE INDEX IF NOT EXISTS idx_practitioners_pagarme_customer ON "Practitioners"(pagarme_customer_id);
CREATE INDEX IF NOT EXISTS idx_practitioners_subscription_status ON "Practitioners"(subscription_status);
CREATE INDEX IF NOT EXISTS idx_practitioners_subscription_expires ON "Practitioners"(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_practitioners_subscription_id ON "Practitioners"(subscription_id);

-- =================================================================
-- Task 1.2: Create Payment Events Log Table
-- =================================================================

-- Create minimal payment events table for tracking payment history and webhook events
-- This table follows [C6.1.1] directive for RLS policies
CREATE TABLE "payment_events" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "Practitioners"(id) ON DELETE CASCADE,
  "event_type" TEXT NOT NULL,
  "event_data" JSONB DEFAULT '{}',
  "pagarme_transaction_id" TEXT,
  "webhook_id" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "processed_at" TIMESTAMPTZ,
  "processing_status" TEXT DEFAULT 'pending' -- pending, processed, failed
);

-- Add comments to document the payment events table
COMMENT ON TABLE payment_events IS 'Log of payment-related events from Pagar.me webhooks and internal operations';
COMMENT ON COLUMN payment_events.user_id IS 'Reference to the practitioner this event belongs to';
COMMENT ON COLUMN payment_events.event_type IS 'Type of payment event: payment_created, payment_paid, payment_failed, subscription_created, etc.';
COMMENT ON COLUMN payment_events.event_data IS 'Complete event payload from Pagar.me or internal data';
COMMENT ON COLUMN payment_events.pagarme_transaction_id IS 'Pagar.me transaction/order/subscription ID for correlation';
COMMENT ON COLUMN payment_events.webhook_id IS 'Pagar.me webhook delivery ID for deduplication';
COMMENT ON COLUMN payment_events.processing_status IS 'Whether this event has been processed by EVIDENS system';

-- Create indexes for payment events queries
CREATE INDEX idx_payment_events_user_id ON payment_events(user_id);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_created ON payment_events(created_at DESC);
CREATE INDEX idx_payment_events_transaction ON payment_events(pagarme_transaction_id);
CREATE INDEX idx_payment_events_webhook ON payment_events(webhook_id);
CREATE INDEX idx_payment_events_status ON payment_events(processing_status);

-- =================================================================
-- Task 1.3: Enable RLS for Payment Events Table
-- =================================================================

-- Enable Row Level Security on payment_events table following [C6.1.1]
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payment events following existing patterns
-- Users can view their own events, admins can view all events [C6.1.2]
CREATE POLICY "payment_events_user_access" ON payment_events
  FOR SELECT 
  USING (user_id = auth.uid() OR get_my_claim('role') IN ('admin', 'editor'));

-- Only system (via service key) and admins can insert payment events
CREATE POLICY "payment_events_system_insert" ON payment_events
  FOR INSERT 
  WITH CHECK (get_my_claim('role') IN ('admin', 'editor') OR auth.role() = 'service_role');

-- Only admins can update payment events (for manual corrections)
CREATE POLICY "payment_events_admin_update" ON payment_events
  FOR UPDATE 
  USING (get_my_claim('role') IN ('admin', 'editor'))
  WITH CHECK (get_my_claim('role') IN ('admin', 'editor'));

-- =================================================================
-- Verification and Data Integrity
-- =================================================================

-- Add constraint to ensure valid subscription statuses
ALTER TABLE "Practitioners" 
ADD CONSTRAINT subscription_status_check 
CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'inactive', 'past_due', 'suspended', 'canceled', 'trialing'));

-- Add constraint to ensure valid payment methods
ALTER TABLE "Practitioners"
ADD CONSTRAINT payment_method_check
CHECK (payment_method_preferred IS NULL OR payment_method_preferred IN ('pix', 'credit_card', 'boleto'));

-- Add constraint to ensure valid event processing status
ALTER TABLE payment_events
ADD CONSTRAINT processing_status_check
CHECK (processing_status IN ('pending', 'processed', 'failed'));

-- =================================================================
-- Success Verification
-- =================================================================

-- Verify that the existing RLS policies on Practitioners table automatically 
-- cover the new payment fields (this is the benefit of extending existing tables per [C2.1])
-- The existing policies should work without modification:
-- - "Practitioners can view their own profile, and admins can view all."
-- - "Practitioners can update their own profile."