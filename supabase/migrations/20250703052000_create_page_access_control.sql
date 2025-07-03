-- ABOUTME: Create page access control table for centralized page-level permission management

-- Step 1: Create PageAccessControl table
CREATE TABLE "PageAccessControl" (
  id SERIAL PRIMARY KEY,
  page_path TEXT UNIQUE NOT NULL,
  required_access_level TEXT NOT NULL CHECK (required_access_level IN ('public', 'free', 'premium', 'editor_admin')),
  redirect_url TEXT NOT NULL DEFAULT '/login',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Add comments for documentation
COMMENT ON TABLE "PageAccessControl" IS 'Centralized page-level access control configuration';
COMMENT ON COLUMN "PageAccessControl".page_path IS 'React Router path (e.g., /admin/dashboard, /premium-content)';
COMMENT ON COLUMN "PageAccessControl".required_access_level IS 'Minimum access level required: public < free < premium < editor_admin';
COMMENT ON COLUMN "PageAccessControl".redirect_url IS 'Where to redirect unauthorized users (default: /login)';
COMMENT ON COLUMN "PageAccessControl".is_active IS 'Whether this access control rule is currently active';

-- Step 3: Create indexes for performance
CREATE INDEX idx_page_access_control_path ON "PageAccessControl"(page_path);
CREATE INDEX idx_page_access_control_level ON "PageAccessControl"(required_access_level);
CREATE INDEX idx_page_access_control_active ON "PageAccessControl"(is_active);

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_page_access_control_updated_at 
  BEFORE UPDATE ON "PageAccessControl" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Seed with existing admin routes
INSERT INTO "PageAccessControl" (page_path, required_access_level, redirect_url) VALUES
  ('/admin', 'editor_admin', '/acesso-negado'),
  ('/admin/dashboard', 'editor_admin', '/acesso-negado'),
  ('/admin/content-management', 'editor_admin', '/acesso-negado'),
  ('/admin/user-management', 'editor_admin', '/acesso-negado'),
  ('/admin/tag-management', 'editor_admin', '/acesso-negado'),
  ('/admin/layout-management', 'editor_admin', '/acesso-negado'),
  ('/admin/analytics', 'editor_admin', '/acesso-negado'),
  ('/admin/review/:id', 'editor_admin', '/acesso-negado'),
  ('/editor', 'editor_admin', '/acesso-negado'),
  ('/editor/:id', 'editor_admin', '/acesso-negado')
ON CONFLICT (page_path) DO NOTHING;

-- Step 6: Create RLS policies (admin access only)
ALTER TABLE "PageAccessControl" ENABLE ROW LEVEL SECURITY;

-- Allow admin and editor to read all page access rules
CREATE POLICY "page_access_read_admin" ON "PageAccessControl"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "Practitioners" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'editor')
    )
  );

-- Allow admin and editor to modify page access rules
CREATE POLICY "page_access_write_admin" ON "PageAccessControl"
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM "Practitioners" 
      WHERE id = auth.uid()::text 
      AND role IN ('admin', 'editor')
    )
  );

-- Public users can read only active rules for their own access checking
CREATE POLICY "page_access_read_public" ON "PageAccessControl"
  FOR SELECT 
  USING (is_active = true);

-- Verification query
-- SELECT page_path, required_access_level, redirect_url FROM "PageAccessControl" WHERE is_active = true;