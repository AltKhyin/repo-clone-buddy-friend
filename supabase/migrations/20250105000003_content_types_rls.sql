-- Migration: Add RLS policies for ContentTypes and ReviewContentTypes tables
-- Following established security patterns from Tags system

-- Enable Row Level Security
ALTER TABLE "ContentTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewContentTypes" ENABLE ROW LEVEL SECURITY;

-- ContentTypes policies (similar to Tags policies)
CREATE POLICY "ContentTypes are visible to authenticated users" ON "ContentTypes"
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Admins can insert content types" ON "ContentTypes"
  FOR INSERT TO authenticated 
  WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Admins can update content types" ON "ContentTypes"
  FOR UPDATE TO authenticated 
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Admins can delete non-system content types" ON "ContentTypes"
  FOR DELETE TO authenticated 
  USING (
    get_my_claim('role') = 'admin' 
    AND is_system = false
  );

-- ReviewContentTypes policies (similar to ReviewTags policies)
CREATE POLICY "ReviewContentTypes are visible to authenticated users" ON "ReviewContentTypes"
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage review content types" ON "ReviewContentTypes"
  FOR INSERT TO authenticated 
  WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Admins can update review content types" ON "ReviewContentTypes"
  FOR UPDATE TO authenticated 
  USING (get_my_claim('role') = 'admin')
  WITH CHECK (get_my_claim('role') = 'admin');

CREATE POLICY "Admins can delete review content types" ON "ReviewContentTypes"
  FOR DELETE TO authenticated 
  USING (get_my_claim('role') = 'admin');

-- Grant necessary permissions to authenticated users
GRANT SELECT ON "ContentTypes" TO authenticated;
GRANT SELECT ON "ReviewContentTypes" TO authenticated;

-- Grant full access to admins (handled by RLS policies)
GRANT ALL ON "ContentTypes" TO authenticated;
GRANT ALL ON "ReviewContentTypes" TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "ContentTypes are visible to authenticated users" ON "ContentTypes" 
  IS 'All authenticated users can view content types for selection';

COMMENT ON POLICY "Admins can delete non-system content types" ON "ContentTypes" 
  IS 'Prevents deletion of system content types while allowing admin management of custom types';