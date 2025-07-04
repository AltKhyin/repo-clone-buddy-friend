-- ABOUTME: Create tables and columns for private profile system - saved items and user biography

-- Step 1: Add biography column to Practitioners table
ALTER TABLE "Practitioners" 
ADD COLUMN biography text;

COMMENT ON COLUMN "Practitioners".biography IS 'User personal biography text for profile page';

-- Step 2: Create Saved_Items table for user saved content
CREATE TABLE public."Saved_Items" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  practitioner_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('review', 'community_post')),
  item_id uuid NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Saved_Items_pkey" PRIMARY KEY (id),
  CONSTRAINT "Saved_Items_practitioner_id_fkey" FOREIGN KEY (practitioner_id) REFERENCES public."Practitioners"(id) ON DELETE CASCADE,
  -- Ensure unique saves per user per item
  CONSTRAINT "Saved_Items_unique_save" UNIQUE (practitioner_id, item_type, item_id)
);

-- Add table and column comments
COMMENT ON TABLE public."Saved_Items" IS 'Stores user saved reviews and community posts';
COMMENT ON COLUMN public."Saved_Items".item_type IS 'Type of saved content: review or community_post';
COMMENT ON COLUMN public."Saved_Items".item_id IS 'ID of the saved review or community post';

-- Step 3: Create indexes for performance
CREATE INDEX idx_saved_items_practitioner_id ON "Saved_Items"(practitioner_id);
CREATE INDEX idx_saved_items_type_id ON "Saved_Items"(item_type, item_id);
CREATE INDEX idx_saved_items_saved_at ON "Saved_Items"(saved_at DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE public."Saved_Items" ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for private access only
CREATE POLICY "Users can view their own saved items"
ON public."Saved_Items"
FOR SELECT
USING (auth.uid() = practitioner_id);

CREATE POLICY "Users can insert their own saved items"
ON public."Saved_Items"
FOR INSERT
WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Users can delete their own saved items"
ON public."Saved_Items"
FOR DELETE
USING (auth.uid() = practitioner_id);

-- Step 6: Create function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_summary jsonb;
BEGIN
  -- Only allow users to see their own activity
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied: can only view your own activity';
  END IF;

  SELECT jsonb_build_object(
    'total_reviews_favorited', COALESCE(
      (SELECT COUNT(*) FROM "Saved_Items" 
       WHERE practitioner_id = user_id AND item_type = 'review'), 0
    ),
    'total_posts_saved', COALESCE(
      (SELECT COUNT(*) FROM "Saved_Items" 
       WHERE practitioner_id = user_id AND item_type = 'community_post'), 0
    ),
    'total_community_posts', COALESCE(
      (SELECT COUNT(*) FROM "CommunityPosts" 
       WHERE author_id = user_id), 0
    ),
    'total_votes_cast', COALESCE(
      (SELECT COUNT(*) FROM "Votes" 
       WHERE practitioner_id = user_id), 0
    ),
    'recent_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', 'saved_item',
          'item_type', item_type,
          'saved_at', saved_at
        ) ORDER BY saved_at DESC
      )
      FROM "Saved_Items"
      WHERE practitioner_id = user_id
      ORDER BY saved_at DESC
      LIMIT 10
    )
  ) INTO activity_summary;

  RETURN activity_summary;
END;
$$;

COMMENT ON FUNCTION get_user_activity_summary IS 'Returns private activity summary for authenticated user only';

-- Step 7: Create function to toggle saved items
CREATE OR REPLACE FUNCTION toggle_saved_item(
  p_item_type text,
  p_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  existing_save uuid;
  result jsonb;
BEGIN
  -- Get authenticated user ID
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to save items';
  END IF;

  -- Validate item_type
  IF p_item_type NOT IN ('review', 'community_post') THEN
    RAISE EXCEPTION 'Invalid item_type. Must be review or community_post';
  END IF;

  -- Check if item is already saved
  SELECT id INTO existing_save
  FROM "Saved_Items"
  WHERE practitioner_id = user_id 
    AND item_type = p_item_type 
    AND item_id = p_item_id;

  IF existing_save IS NOT NULL THEN
    -- Remove save
    DELETE FROM "Saved_Items" WHERE id = existing_save;
    result := jsonb_build_object(
      'success', true,
      'is_saved', false,
      'message', 'Item removed from saved list'
    );
  ELSE
    -- Add save
    INSERT INTO "Saved_Items" (practitioner_id, item_type, item_id)
    VALUES (user_id, p_item_type, p_item_id);
    result := jsonb_build_object(
      'success', true,
      'is_saved', true,
      'message', 'Item saved successfully'
    );
  END IF;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION toggle_saved_item IS 'Toggle save/unsave for reviews and community posts (private)';

-- Step 8: Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON "Saved_Items" TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_saved_item TO authenticated;