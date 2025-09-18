-- ABOUTME: Create institutional plan requests table for companies to request employee access packages

-- Step 1: Create institutional_plan_requests table
CREATE TABLE "institutional_plan_requests" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  business_name TEXT NOT NULL,
  specific_needs TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Add comments for documentation
COMMENT ON TABLE "institutional_plan_requests" IS 'Stores requests from companies for institutional access plans';
COMMENT ON COLUMN "institutional_plan_requests".name IS 'Contact person name';
COMMENT ON COLUMN "institutional_plan_requests".phone IS 'Contact phone number';
COMMENT ON COLUMN "institutional_plan_requests".email IS 'Contact email address';
COMMENT ON COLUMN "institutional_plan_requests".business_name IS 'Company/business name';
COMMENT ON COLUMN "institutional_plan_requests".specific_needs IS 'Details about their requirements (e.g., number of accounts)';
COMMENT ON COLUMN "institutional_plan_requests".status IS 'Request status: pending, reviewing, approved, rejected';
COMMENT ON COLUMN "institutional_plan_requests".reviewed_by IS 'Admin user who reviewed this request';
COMMENT ON COLUMN "institutional_plan_requests".admin_notes IS 'Internal notes from admin review';

-- Step 3: Create indexes for performance
CREATE INDEX idx_institutional_plan_requests_status ON "institutional_plan_requests"(status);
CREATE INDEX idx_institutional_plan_requests_created_at ON "institutional_plan_requests"(created_at DESC);
CREATE INDEX idx_institutional_plan_requests_email ON "institutional_plan_requests"(email);
CREATE INDEX idx_institutional_plan_requests_reviewed_by ON "institutional_plan_requests"(reviewed_by);

-- Step 4: Enable RLS and create policies
ALTER TABLE "institutional_plan_requests" ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage all requests
CREATE POLICY "Admin full access to institutional requests" ON "institutional_plan_requests"
  FOR ALL TO authenticated
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

-- Step 5: Create updated_at trigger (reusing existing function)
CREATE TRIGGER update_institutional_plan_requests_updated_at
  BEFORE UPDATE ON "institutional_plan_requests"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();