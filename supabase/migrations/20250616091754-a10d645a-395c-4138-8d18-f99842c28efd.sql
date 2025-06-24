
-- Enable RLS on Suggestion_Votes table (if not already enabled)
ALTER TABLE "Suggestion_Votes" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Suggestion_Votes table
-- Policy 1: Users can view their own votes
CREATE POLICY "Users can view their own suggestion votes" 
  ON public."Suggestion_Votes" 
  FOR SELECT 
  USING (auth.uid() = practitioner_id);

-- Policy 2: Users can cast votes (INSERT)
CREATE POLICY "Users can cast suggestion votes" 
  ON public."Suggestion_Votes" 
  FOR INSERT 
  WITH CHECK (auth.uid() = practitioner_id);

-- Policy 3: Users can update their votes (for changing vote type if needed)
CREATE POLICY "Users can update their own suggestion votes" 
  ON public."Suggestion_Votes" 
  FOR UPDATE 
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

-- Policy 4: Users can delete their votes (for removing votes)
CREATE POLICY "Users can delete their own suggestion votes" 
  ON public."Suggestion_Votes" 
  FOR DELETE 
  USING (auth.uid() = practitioner_id);

-- Ensure the trigger is properly attached to update suggestion vote counts
-- (The function update_suggestion_vote_count() already exists)
DROP TRIGGER IF EXISTS update_suggestion_votes_trigger ON public."Suggestion_Votes";
CREATE TRIGGER update_suggestion_votes_trigger
  AFTER INSERT OR DELETE ON public."Suggestion_Votes"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suggestion_vote_count();

-- Add foreign key constraints for data integrity (if not already present)
DO $$
BEGIN
  -- Add foreign key to Suggestions table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'suggestion_votes_suggestion_id_fkey' 
    AND table_name = 'Suggestion_Votes'
  ) THEN
    ALTER TABLE "Suggestion_Votes" 
    ADD CONSTRAINT suggestion_votes_suggestion_id_fkey 
    FOREIGN KEY (suggestion_id) REFERENCES "Suggestions"(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key to Practitioners table if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'suggestion_votes_practitioner_id_fkey' 
    AND table_name = 'Suggestion_Votes'
  ) THEN
    ALTER TABLE "Suggestion_Votes" 
    ADD CONSTRAINT suggestion_votes_practitioner_id_fkey 
    FOREIGN KEY (practitioner_id) REFERENCES "Practitioners"(id) ON DELETE CASCADE;
  END IF;
END $$;
