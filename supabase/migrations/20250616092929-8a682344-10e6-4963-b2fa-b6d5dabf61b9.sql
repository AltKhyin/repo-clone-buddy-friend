
-- Fix Multiple Permissive Policies issue on Suggestion_Votes table
-- Drop existing policies to clean slate
DROP POLICY IF EXISTS "Users can view their own suggestion votes" ON public."Suggestion_Votes";
DROP POLICY IF EXISTS "Users can cast suggestion votes" ON public."Suggestion_Votes";
DROP POLICY IF EXISTS "Users can update their own suggestion votes" ON public."Suggestion_Votes";
DROP POLICY IF EXISTS "Users can delete their own suggestion votes" ON public."Suggestion_Votes";

-- Create single, comprehensive policy for Suggestion_Votes
CREATE POLICY "suggestion_votes_policy" ON public."Suggestion_Votes"
  FOR ALL
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

-- Create performance-optimized indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_notifications_practitioner_id ON public."Notifications"(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_practitioner_id ON public."OnboardingAnswers"(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_question_id ON public."OnboardingAnswers"(question_id);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON public."Reviews"(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_community_post_id ON public."Reviews"(community_post_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_submitted_by ON public."Suggestions"(submitted_by);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion_id ON public."Suggestion_Votes"(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_practitioner_id ON public."Suggestion_Votes"(practitioner_id);

-- Optimize the update_suggestion_vote_count function to be more efficient
CREATE OR REPLACE FUNCTION public.update_suggestion_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  suggestion_id_val INTEGER;
BEGIN
  -- Determine which suggestion_id to update
  IF TG_OP = 'INSERT' THEN
    suggestion_id_val := NEW.suggestion_id;
  ELSIF TG_OP = 'DELETE' THEN
    suggestion_id_val := OLD.suggestion_id;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Update suggestion vote count with a single query
  UPDATE public."Suggestions" 
  SET upvotes = (
    SELECT COUNT(*) 
    FROM public."Suggestion_Votes" 
    WHERE suggestion_id = suggestion_id_val
  )
  WHERE id = suggestion_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger with the optimized function
DROP TRIGGER IF EXISTS update_suggestion_votes_trigger ON public."Suggestion_Votes";
CREATE TRIGGER update_suggestion_votes_trigger
  AFTER INSERT OR DELETE ON public."Suggestion_Votes"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suggestion_vote_count();
