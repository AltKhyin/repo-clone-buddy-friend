-- Fix get_homepage_suggestions function to include avatar_url for proper avatar display
-- This resolves the issue where suggestions show initials instead of actual user avatars

CREATE OR REPLACE FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") 
RETURNS TABLE(
  "id" integer, 
  "title" "text", 
  "description" "text", 
  "upvotes" integer, 
  "created_at" timestamp with time zone, 
  "Practitioners" json, 
  "user_has_voted" boolean
)
LANGUAGE "plpgsql"
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.description,
    s.upvotes,
    s.created_at,
    json_build_object(
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as "Practitioners",
    EXISTS (
      SELECT 1
      FROM public."Suggestion_Votes" sv
      WHERE sv.suggestion_id = s.id AND sv.practitioner_id = p_user_id
    ) as user_has_voted
  FROM
    public."Suggestions" s
  LEFT JOIN
    public."Practitioners" p ON s.submitted_by = p.id
  ORDER BY s.upvotes DESC, s.created_at DESC
  LIMIT 10;
END;
$$;

-- Ensure proper permissions
GRANT ALL ON FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") TO "service_role";