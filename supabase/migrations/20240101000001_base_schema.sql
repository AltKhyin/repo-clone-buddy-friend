

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."CommunityPosts" (
    "id" integer NOT NULL,
    "review_id" integer,
    "parent_post_id" integer,
    "author_id" "uuid",
    "title" "text",
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "upvotes" integer DEFAULT 0,
    "downvotes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_pinned" boolean DEFAULT false,
    "is_locked" boolean DEFAULT false,
    "flair_text" "text",
    "flair_color" "text",
    "post_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "structured_content" "jsonb",
    "community_id" "uuid" DEFAULT 'a7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2'::"uuid",
    "image_url" "text",
    "video_url" "text",
    "poll_data" "jsonb",
    "is_rewarded" boolean DEFAULT false NOT NULL,
    CONSTRAINT "communityposts_post_type_check" CHECK (("post_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'link'::"text", 'poll'::"text"])))
);


ALTER TABLE "public"."CommunityPosts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."CommunityPosts"."is_rewarded" IS 'Set to true if an admin has rewarded this content.';



CREATE OR REPLACE FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text") RETURNS "public"."CommunityPosts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_post "CommunityPosts";
begin
  -- Insert the new post and store the entire new row in the `new_post` variable
  -- The `returning *` clause is crucial here
  insert into "CommunityPosts" (author_id, title, content, category, upvotes)
  values (p_author_id, p_title, p_content, p_category, 1)
  returning * into new_post;

  -- Insert the automatic upvote for the author, referencing the ID of the post we just created
  insert into "CommunityPost_Votes" (post_id, practitioner_id, vote_type)
  values (new_post.id, p_author_id, 'up');

  -- Return the complete post object, which now has an upvote count of 1
  return new_post;
end;
$$;


ALTER FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text", "p_parent_id" integer DEFAULT NULL::integer) RETURNS TABLE("post_id" integer, "success" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_post_id integer;
BEGIN
  -- Insert the new post/comment
  INSERT INTO public."CommunityPosts" (
    author_id, 
    title, 
    content, 
    category, 
    parent_post_id,
    upvotes
  ) VALUES (
    p_author_id, 
    p_title, 
    p_content, 
    p_category,
    p_parent_id,  -- This makes it a comment if provided
    1  -- Auto-upvote
  ) RETURNING id INTO new_post_id;

  -- Insert the auto-upvote
  INSERT INTO public."CommunityPost_Votes" (
    post_id, 
    practitioner_id, 
    vote_type
  ) VALUES (
    new_post_id, 
    p_author_id, 
    'up'
  );

  -- Update the user's contribution score
  UPDATE public."Practitioners" 
  SET contribution_score = contribution_score + 1 
  WHERE id = p_author_id;

  -- Return the new post ID and success status
  RETURN QUERY SELECT new_post_id, true;
END;
$$;


ALTER FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text", "p_parent_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."export_analytics_data"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'exportedAt', NOW(),
        'userStats', get_user_analytics(),
        'contentStats', get_content_analytics(),
        'engagementStats', get_engagement_analytics()
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."export_analytics_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_comments_for_post"("p_post_id" integer, "p_user_id" "uuid") RETURNS TABLE("id" integer, "content" "text", "created_at" timestamp with time zone, "upvotes" integer, "downvotes" integer, "is_rewarded" boolean, "parent_post_id" integer, "author" "jsonb", "user_vote" "text", "reply_count" bigint, "nesting_level" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    -- This is a recursive query. It starts with the direct children of the post
    -- and then repeatedly finds the children of those children, building the tree.
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: Select the direct comments (level 1)
        SELECT
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            1 AS nesting_level -- Start with nesting level 1
        FROM public."CommunityPosts" cp
        WHERE cp.parent_post_id = p_post_id

        UNION ALL

        -- Recursive step: Join the table with itself to find replies
        SELECT
            cp.id,
            cp.content,
            cp.created_at,
            cp.upvotes,
            cp.downvotes,
            cp.is_rewarded,
            cp.parent_post_id,
            cp.author_id,
            ct.nesting_level + 1 -- Increment nesting level for each reply
        FROM public."CommunityPosts" cp
        JOIN comment_tree ct ON cp.parent_post_id = ct.id
    )
    -- Final SELECT statement to format the output
    SELECT
        t.id,
        t.content,
        t.created_at,
        t.upvotes,
        t.downvotes,
        t.is_rewarded,
        t.parent_post_id,
        -- Pre-build the author JSON object to reduce client-side processing
        jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
        ) AS author,
        -- Subquery to get the current user's vote status for this comment
        (SELECT v.vote_type FROM public."CommunityPost_Votes" v WHERE v.post_id = t.id AND v.practitioner_id = p_user_id) AS user_vote,
        -- Subquery to get the reply count for this comment
        (SELECT count(*) FROM public."CommunityPosts" replies WHERE replies.parent_post_id = t.id) AS reply_count,
        t.nesting_level
    FROM comment_tree t
    -- Join to get the author's profile information
    LEFT JOIN public."Practitioners" p ON t.author_id = p.id
    ORDER BY t.created_at ASC; -- Order by oldest first to build the thread correctly
END;
$$;


ALTER FUNCTION "public"."get_comments_for_post"("p_post_id" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_community_feed_with_details"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" integer, "title" "text", "content" "text", "category" "text", "upvotes" integer, "downvotes" integer, "created_at" timestamp with time zone, "is_pinned" boolean, "is_locked" boolean, "flair_text" "text", "flair_color" "text", "post_type" "text", "image_url" "text", "video_url" "text", "author" json, "user_vote" "text", "reply_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id,
        cp.title,
        cp.content,
        cp.category,
        cp.upvotes,
        cp.downvotes,
        cp.created_at,
        cp.is_pinned,
        cp.is_locked,
        cp.flair_text,
        cp.flair_color,
        cp.post_type,
        cp.image_url,
        cp.video_url,
        json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url,
            'role', p.role
        ) AS author,
        COALESCE(v.vote_type, 'none') AS user_vote,
        (SELECT COUNT(*) FROM "CommunityPosts" AS replies WHERE replies.parent_post_id = cp.id) AS reply_count
    FROM
        "CommunityPosts" AS cp
    JOIN
        "Practitioners" AS p ON cp.author_id = p.id
    LEFT JOIN
        "CommunityPost_Votes" AS v ON v.post_id = cp.id AND v.practitioner_id = p_user_id
    WHERE
        cp.parent_post_id IS NULL
    ORDER BY
        cp.is_pinned DESC, cp.created_at DESC
    LIMIT
        p_limit
    OFFSET
        p_offset;
END;
$$;


ALTER FUNCTION "public"."get_community_feed_with_details"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_content_analytics"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalReviews', (SELECT COUNT(*) FROM "Reviews"),
        'publishedReviews', (SELECT COUNT(*) FROM "Reviews" WHERE status = 'published'),
        'draftReviews', (SELECT COUNT(*) FROM "Reviews" WHERE status = 'draft'),
        'totalPosts', (SELECT COUNT(*) FROM "CommunityPosts")
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_content_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_engagement_analytics"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
    top_content JSON;
BEGIN
    -- Get top content (simplified version)
    SELECT json_agg(
        json_build_object(
            'id', id,
            'title', COALESCE(title, 'Untitled'),
            'views', upvotes + downvotes,
            'type', 'post'
        )
    ) INTO top_content
    FROM (
        SELECT id, title, upvotes, downvotes
        FROM "CommunityPosts"
        WHERE title IS NOT NULL
        ORDER BY (upvotes + downvotes) DESC
        LIMIT 5
    ) AS top_posts;
    
    SELECT json_build_object(
        'totalViews', (SELECT COALESCE(SUM(upvotes + downvotes), 0) FROM "CommunityPosts"),
        'totalVotes', (SELECT COUNT(*) FROM "CommunityPost_Votes"),
        'avgEngagement', (SELECT ROUND(AVG(upvotes + downvotes), 2) FROM "CommunityPosts"),
        'topContent', COALESCE(top_content, '[]'::json)
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_engagement_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") RETURNS TABLE("id" integer, "title" "text", "description" "text", "upvotes" integer, "created_at" timestamp with time zone, "Practitioners" json, "user_has_voted" boolean)
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
    json_build_object('full_name', p.full_name) as "Practitioners",
    EXISTS (
      SELECT 1
      FROM public."Suggestion_Votes" sv
      WHERE sv.suggestion_id = s.id AND sv.practitioner_id = p_user_id
    ) as user_has_voted
  FROM
    public."Suggestions" s
  LEFT JOIN
    public."Practitioners" p ON s.submitted_by = p.id
  WHERE
    s.status = 'pending'
  ORDER BY
    -- Boost suggestions from the last 24 hours
    (CASE WHEN s.created_at > (NOW() - INTERVAL '24 hours') THEN 0 ELSE 1 END),
    s.upvotes DESC,
    s.created_at DESC
  LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_claim"("claim" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> claim, '')::TEXT;
$$;


ALTER FUNCTION "public"."get_my_claim"("claim" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_analytics"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM "Practitioners"),
        'activeToday', (SELECT COUNT(DISTINCT author_id) FROM "CommunityPosts" WHERE created_at >= CURRENT_DATE),
        'newThisWeek', (SELECT COUNT(*) FROM "Practitioners" WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
        'premiumUsers', (SELECT COUNT(*) FROM "Practitioners" WHERE subscription_tier = 'premium')
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_user_analytics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles"("p_user_id" "uuid") RETURNS TABLE("role_name" "text", "granted_at" timestamp with time zone, "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.role_name,
        ur.granted_at,
        ur.expires_at
    FROM public."UserRoles" ur
    WHERE ur.practitioner_id = p_user_id 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY ur.granted_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_roles"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_post_action"("p_post_id" integer, "p_user_id" "uuid", "p_action_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    post_author_id UUID;
    is_authorized_moderator BOOLEAN;
    result_post "CommunityPosts";
BEGIN
    -- Fetch post author for permission checking
    SELECT author_id INTO post_author_id 
    FROM "CommunityPosts" 
    WHERE id = p_post_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'POST_NOT_FOUND: Post with ID % does not exist.', p_post_id;
    END IF;

    -- Check if user is authorized moderator
    SELECT is_editor(p_user_id) INTO is_authorized_moderator;

    -- Handle DELETE action (users can delete own posts, moderators can delete any)
    IF p_action_type = 'delete' THEN
        IF p_user_id = post_author_id OR is_authorized_moderator THEN
            DELETE FROM "CommunityPosts" WHERE id = p_post_id;
            RETURN jsonb_build_object('status', 'deleted', 'post_id', p_post_id);
        ELSE
            RAISE EXCEPTION 'FORBIDDEN: User does not have permission to delete this post.';
        END IF;
    END IF;

    -- For all other actions, require moderator privileges
    IF NOT is_authorized_moderator THEN
        RAISE EXCEPTION 'FORBIDDEN: Only editors or admins can perform this action.';
    END IF;

    -- Handle moderation actions
    CASE p_action_type
        WHEN 'pin' THEN
            UPDATE "CommunityPosts" SET is_pinned = true WHERE id = p_post_id RETURNING * INTO result_post;
        WHEN 'unpin' THEN
            UPDATE "CommunityPosts" SET is_pinned = false WHERE id = p_post_id RETURNING * INTO result_post;
        WHEN 'lock' THEN
            UPDATE "CommunityPosts" SET is_locked = true WHERE id = p_post_id RETURNING * INTO result_post;
        WHEN 'unlock' THEN
            UPDATE "CommunityPosts" SET is_locked = false WHERE id = p_post_id RETURNING * INTO result_post;
        ELSE
            RAISE EXCEPTION 'INVALID_ACTION: The action type "%" is not valid.', p_action_type;
    END CASE;

    RETURN to_jsonb(result_post);
END;
$$;


ALTER FUNCTION "public"."handle_post_action"("p_post_id" integer, "p_user_id" "uuid", "p_action_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit_event"("p_performed_by" "uuid", "p_action_type" "text", "p_resource_type" "text", "p_resource_id" "text" DEFAULT NULL::"text", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public."SystemAuditLog" (
        performed_by,
        action_type,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        p_performed_by,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_metadata
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;


ALTER FUNCTION "public"."log_audit_event"("p_performed_by" "uuid", "p_action_type" "text", "p_resource_type" "text", "p_resource_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_audit_log"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only log for authenticated users
    IF auth.uid() IS NOT NULL THEN
        PERFORM public.log_audit_event(
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id::TEXT, OLD.id::TEXT),
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
            jsonb_build_object('table_schema', TG_TABLE_SCHEMA)
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_audit_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_community_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM update_community_stats();
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_update_community_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_post_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  post_id_val INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    post_id_val := NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    post_id_val := OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    post_id_val := NEW.post_id;
  END IF;
  
  -- Update upvotes and downvotes counts
  UPDATE "CommunityPosts" 
  SET 
    upvotes = (
      SELECT COUNT(*) 
      FROM "CommunityPost_Votes" 
      WHERE post_id = post_id_val AND vote_type = 'up'
    ),
    downvotes = (
      SELECT COUNT(*) 
      FROM "CommunityPost_Votes" 
      WHERE post_id = post_id_val AND vote_type = 'down'
    )
  WHERE id = post_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_community_post_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_community_stats"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update total discussions count
    INSERT INTO "CommunityStats" (stat_key, stat_value, updated_at)
    VALUES (
        'total_discussions',
        jsonb_build_object('count', (SELECT COUNT(*) FROM "CommunityPosts" WHERE parent_post_id IS NULL)),
        NOW()
    )
    ON CONFLICT (stat_key) 
    DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        updated_at = EXCLUDED.updated_at;

    -- Update today's posts count
    INSERT INTO "CommunityStats" (stat_key, stat_value, updated_at)
    VALUES (
        'today_posts',
        jsonb_build_object('count', (
            SELECT COUNT(*) FROM "CommunityPosts" 
            WHERE created_at >= CURRENT_DATE
        )),
        NOW()
    )
    ON CONFLICT (stat_key) 
    DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        updated_at = EXCLUDED.updated_at;

    -- Update active authors count (renamed from active_users_24h for accuracy)
    INSERT INTO "CommunityStats" (stat_key, stat_value, updated_at)
    VALUES (
        'active_authors_24h',
        jsonb_build_object('count', (
            SELECT COUNT(DISTINCT author_id) FROM "CommunityPosts" 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            AND author_id IS NOT NULL
        )),
        NOW()
    )
    ON CONFLICT (stat_key) 
    DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        updated_at = EXCLUDED.updated_at;

    -- Update member count for default community
    UPDATE "Communities" 
    SET member_count = (
        SELECT COUNT(DISTINCT author_id) 
        FROM "CommunityPosts" 
        WHERE author_id IS NOT NULL
    )
    WHERE id = 'a7d8e9f0-a1b2-c3d4-e5f6-a7b8c9d0e1f2'::uuid;
END;
$$;


ALTER FUNCTION "public"."update_community_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_poll_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  option_id_val INTEGER;
  poll_id_val INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    option_id_val := NEW.option_id;
    poll_id_val := NEW.poll_id;
  ELSIF TG_OP = 'DELETE' THEN
    option_id_val := OLD.option_id;
    poll_id_val := OLD.poll_id;
  ELSIF TG_OP = 'UPDATE' THEN
    option_id_val := NEW.option_id;
    poll_id_val := NEW.poll_id;
  END IF;
  
  -- Update option vote count
  UPDATE "PollOptions" 
  SET vote_count = (
    SELECT COUNT(*) 
    FROM "PollVotes" 
    WHERE option_id = option_id_val
  )
  WHERE id = option_id_val;
  
  -- Update total poll vote count
  UPDATE "Polls" 
  SET total_votes = (
    SELECT COUNT(*) 
    FROM "PollVotes" 
    WHERE poll_id = poll_id_val
  )
  WHERE id = poll_id_val;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_poll_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_suggestion_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_suggestion_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("p_user_id" "uuid", "p_role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public."UserRoles" ur
        WHERE ur.practitioner_id = p_user_id 
        AND ur.role_name = p_role_name 
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$;


ALTER FUNCTION "public"."user_has_role"("p_user_id" "uuid", "p_role_name" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Communities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "avatar_url" "text",
    "banner_url" "text",
    "member_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."CommunityModerationActions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" integer,
    "moderator_id" "uuid",
    "action_type" "text" NOT NULL,
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "CommunityModerationActions_action_type_check" CHECK (("action_type" = ANY (ARRAY['pin'::"text", 'unpin'::"text", 'lock'::"text", 'unlock'::"text", 'delete'::"text", 'flair'::"text", 'hide'::"text"])))
);


ALTER TABLE "public"."CommunityModerationActions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."CommunityPost_Votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" integer,
    "practitioner_id" "uuid",
    "vote_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "CommunityPost_Votes_vote_type_check" CHECK (("vote_type" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."CommunityPost_Votes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."CommunityPosts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."CommunityPosts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."CommunityPosts_id_seq" OWNED BY "public"."CommunityPosts"."id";



CREATE TABLE IF NOT EXISTS "public"."CommunityStats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stat_key" "text" NOT NULL,
    "stat_value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."CommunityStats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "link" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."Notifications" IS 'Stores notifications for users.';



COMMENT ON COLUMN "public"."Notifications"."practitioner_id" IS 'The user who receives the notification.';



COMMENT ON COLUMN "public"."Notifications"."link" IS 'A URL to navigate to when the notification is clicked.';



CREATE TABLE IF NOT EXISTS "public"."OnboardingAnswers" (
    "id" integer NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "question_id" integer NOT NULL,
    "answer" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."OnboardingAnswers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."OnboardingAnswers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."OnboardingAnswers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."OnboardingAnswers_id_seq" OWNED BY "public"."OnboardingAnswers"."id";



CREATE TABLE IF NOT EXISTS "public"."OnboardingQuestions" (
    "id" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "options" "jsonb",
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."OnboardingQuestions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."OnboardingQuestions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."OnboardingQuestions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."OnboardingQuestions_id_seq" OWNED BY "public"."OnboardingQuestions"."id";



CREATE TABLE IF NOT EXISTS "public"."PollOptions" (
    "id" integer NOT NULL,
    "poll_id" integer,
    "option_text" "text" NOT NULL,
    "vote_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."PollOptions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."PollOptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."PollOptions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."PollOptions_id_seq" OWNED BY "public"."PollOptions"."id";



CREATE TABLE IF NOT EXISTS "public"."PollVotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "poll_id" integer,
    "option_id" integer,
    "practitioner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."PollVotes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Polls" (
    "id" integer NOT NULL,
    "question" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_featured" boolean DEFAULT false,
    "total_votes" integer DEFAULT 0
);


ALTER TABLE "public"."Polls" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Polls_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Polls_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Polls_id_seq" OWNED BY "public"."Polls"."id";



CREATE TABLE IF NOT EXISTS "public"."Practitioners" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'practitioner'::"text" NOT NULL,
    "subscription_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "contribution_score" integer DEFAULT 0 NOT NULL,
    "profession_flair" "text",
    "display_hover_card" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Practitioners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Publication_History" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "review_id" integer NOT NULL,
    "action" "text" NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "Publication_History_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'submitted_for_review'::"text", 'approved'::"text", 'rejected'::"text", 'scheduled'::"text", 'published'::"text", 'unpublished'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."Publication_History" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ReviewTags" (
    "id" integer NOT NULL,
    "review_id" integer NOT NULL,
    "tag_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ReviewTags" OWNER TO "postgres";


COMMENT ON TABLE "public"."ReviewTags" IS 'Many-to-many relationship between Reviews and Tags.';



CREATE SEQUENCE IF NOT EXISTS "public"."ReviewTags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ReviewTags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ReviewTags_id_seq" OWNED BY "public"."ReviewTags"."id";



CREATE TABLE IF NOT EXISTS "public"."Reviews" (
    "id" integer NOT NULL,
    "author_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "structured_content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "access_level" "text" DEFAULT 'public'::"text" NOT NULL,
    "view_count" integer DEFAULT 0 NOT NULL,
    "community_post_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "review_status" "text" DEFAULT 'draft'::"text",
    "reviewer_id" "uuid",
    "scheduled_publish_at" timestamp with time zone,
    "publication_notes" "text",
    "review_requested_at" timestamp with time zone,
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "Reviews_review_status_check" CHECK (("review_status" = ANY (ARRAY['draft'::"text", 'under_review'::"text", 'scheduled'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."Reviews" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Reviews_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Reviews_id_seq" OWNED BY "public"."Reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."SavedPosts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "post_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."SavedPosts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."SiteSettings" (
    "id" integer NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "is_public" boolean DEFAULT false,
    "description" "text"
);


ALTER TABLE "public"."SiteSettings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."SiteSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."SiteSettings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."SiteSettings_id_seq" OWNED BY "public"."SiteSettings"."id";



CREATE TABLE IF NOT EXISTS "public"."Suggestion_Votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "suggestion_id" integer NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Suggestion_Votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Suggestions" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "submitted_by" "uuid",
    "upvotes" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Suggestions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."Suggestions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Suggestions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Suggestions_id_seq" OWNED BY "public"."Suggestions"."id";



CREATE TABLE IF NOT EXISTS "public"."SystemAuditLog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."SystemAuditLog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Tags" (
    "id" integer NOT NULL,
    "tag_name" "text" NOT NULL,
    "parent_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."Tags" IS 'Stores the hierarchical tagging system (categorias and subtags).';



CREATE SEQUENCE IF NOT EXISTS "public"."Tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."Tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."Tags_id_seq" OWNED BY "public"."Tags"."id";



CREATE TABLE IF NOT EXISTS "public"."UserRoles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "role_name" "text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "UserRoles_role_name_check" CHECK (("role_name" = ANY (ARRAY['admin'::"text", 'editor'::"text", 'moderator'::"text", 'practitioner'::"text"])))
);


ALTER TABLE "public"."UserRoles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_log" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "timestamp" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limit_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rate_limit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rate_limit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rate_limit_log_id_seq" OWNED BY "public"."rate_limit_log"."id";



ALTER TABLE ONLY "public"."CommunityPosts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."CommunityPosts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."OnboardingAnswers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."OnboardingAnswers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."OnboardingQuestions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."OnboardingQuestions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."PollOptions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."PollOptions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Polls" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Polls_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ReviewTags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ReviewTags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."SiteSettings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."SiteSettings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Suggestions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Suggestions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."Tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rate_limit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rate_limit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Communities"
    ADD CONSTRAINT "Communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommunityModerationActions"
    ADD CONSTRAINT "CommunityModerationActions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommunityPost_Votes"
    ADD CONSTRAINT "CommunityPost_Votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommunityPost_Votes"
    ADD CONSTRAINT "CommunityPost_Votes_post_id_practitioner_id_key" UNIQUE ("post_id", "practitioner_id");



ALTER TABLE ONLY "public"."CommunityPosts"
    ADD CONSTRAINT "CommunityPosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommunityStats"
    ADD CONSTRAINT "CommunityStats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommunityStats"
    ADD CONSTRAINT "CommunityStats_stat_key_key" UNIQUE ("stat_key");



ALTER TABLE ONLY "public"."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OnboardingAnswers"
    ADD CONSTRAINT "OnboardingAnswers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."OnboardingAnswers"
    ADD CONSTRAINT "OnboardingAnswers_practitioner_id_question_id_key" UNIQUE ("practitioner_id", "question_id");



ALTER TABLE ONLY "public"."OnboardingQuestions"
    ADD CONSTRAINT "OnboardingQuestions_order_index_key" UNIQUE ("order_index");



ALTER TABLE ONLY "public"."OnboardingQuestions"
    ADD CONSTRAINT "OnboardingQuestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PollOptions"
    ADD CONSTRAINT "PollOptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PollVotes"
    ADD CONSTRAINT "PollVotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PollVotes"
    ADD CONSTRAINT "PollVotes_poll_id_practitioner_id_key" UNIQUE ("poll_id", "practitioner_id");



ALTER TABLE ONLY "public"."Polls"
    ADD CONSTRAINT "Polls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Practitioners"
    ADD CONSTRAINT "Practitioners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Publication_History"
    ADD CONSTRAINT "Publication_History_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ReviewTags"
    ADD CONSTRAINT "ReviewTags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ReviewTags"
    ADD CONSTRAINT "ReviewTags_review_id_tag_id_key" UNIQUE ("review_id", "tag_id");



ALTER TABLE ONLY "public"."Reviews"
    ADD CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SavedPosts"
    ADD CONSTRAINT "SavedPosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SavedPosts"
    ADD CONSTRAINT "SavedPosts_practitioner_id_post_id_key" UNIQUE ("practitioner_id", "post_id");



ALTER TABLE ONLY "public"."SiteSettings"
    ADD CONSTRAINT "SiteSettings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."SiteSettings"
    ADD CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Suggestion_Votes"
    ADD CONSTRAINT "Suggestion_Votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Suggestion_Votes"
    ADD CONSTRAINT "Suggestion_Votes_suggestion_id_practitioner_id_key" UNIQUE ("suggestion_id", "practitioner_id");



ALTER TABLE ONLY "public"."Suggestions"
    ADD CONSTRAINT "Suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Tags"
    ADD CONSTRAINT "Tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserRoles"
    ADD CONSTRAINT "UserRoles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserRoles"
    ADD CONSTRAINT "UserRoles_practitioner_id_role_name_key" UNIQUE ("practitioner_id", "role_name");



ALTER TABLE ONLY "public"."rate_limit_log"
    ADD CONSTRAINT "rate_limit_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_log_created_at" ON "public"."SystemAuditLog" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_performed_by" ON "public"."SystemAuditLog" USING "btree" ("performed_by");



CREATE INDEX "idx_audit_log_resource" ON "public"."SystemAuditLog" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_communities_name" ON "public"."Communities" USING "btree" ("name");



CREATE INDEX "idx_community_post_votes_post_id" ON "public"."CommunityPost_Votes" USING "btree" ("post_id");



CREATE INDEX "idx_community_posts_author_id" ON "public"."CommunityPosts" USING "btree" ("author_id");



CREATE INDEX "idx_community_posts_created_at" ON "public"."CommunityPosts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_community_posts_flair" ON "public"."CommunityPosts" USING "btree" ("flair_text") WHERE ("flair_text" IS NOT NULL);



CREATE INDEX "idx_community_posts_parent_id" ON "public"."CommunityPosts" USING "btree" ("parent_post_id");



CREATE INDEX "idx_community_posts_pinned" ON "public"."CommunityPosts" USING "btree" ("is_pinned") WHERE ("is_pinned" = true);



CREATE INDEX "idx_community_posts_review_id" ON "public"."CommunityPosts" USING "btree" ("review_id");



CREATE INDEX "idx_community_posts_rewarded" ON "public"."CommunityPosts" USING "btree" ("is_rewarded") WHERE ("is_rewarded" = true);



CREATE INDEX "idx_community_stats_key" ON "public"."CommunityStats" USING "btree" ("stat_key");



CREATE INDEX "idx_communityposts_community_id" ON "public"."CommunityPosts" USING "btree" ("community_id");



CREATE INDEX "idx_communityposts_post_type" ON "public"."CommunityPosts" USING "btree" ("post_type");



CREATE INDEX "idx_moderation_actions_moderator" ON "public"."CommunityModerationActions" USING "btree" ("moderator_id");



CREATE INDEX "idx_moderation_actions_post" ON "public"."CommunityModerationActions" USING "btree" ("post_id");



CREATE INDEX "idx_notifications_practitioner_id" ON "public"."Notifications" USING "btree" ("practitioner_id");



CREATE INDEX "idx_onboarding_answers_practitioner_id" ON "public"."OnboardingAnswers" USING "btree" ("practitioner_id");



CREATE INDEX "idx_onboarding_answers_question_id" ON "public"."OnboardingAnswers" USING "btree" ("question_id");



CREATE INDEX "idx_poll_votes_poll_id" ON "public"."PollVotes" USING "btree" ("poll_id");



CREATE INDEX "idx_publication_history_review_id" ON "public"."Publication_History" USING "btree" ("review_id");



CREATE INDEX "idx_rate_limit_log_key_timestamp" ON "public"."rate_limit_log" USING "btree" ("key", "timestamp");



CREATE INDEX "idx_review_tags_review_id" ON "public"."ReviewTags" USING "btree" ("review_id");



CREATE INDEX "idx_review_tags_tag_id" ON "public"."ReviewTags" USING "btree" ("tag_id");



CREATE INDEX "idx_reviews_author_id" ON "public"."Reviews" USING "btree" ("author_id");



CREATE INDEX "idx_reviews_community_post_id" ON "public"."Reviews" USING "btree" ("community_post_id");



CREATE INDEX "idx_reviews_review_status" ON "public"."Reviews" USING "btree" ("review_status");



CREATE INDEX "idx_reviews_reviewer_id" ON "public"."Reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_reviews_scheduled_publish" ON "public"."Reviews" USING "btree" ("scheduled_publish_at") WHERE ("scheduled_publish_at" IS NOT NULL);



CREATE INDEX "idx_savedposts_created_at" ON "public"."SavedPosts" USING "btree" ("created_at");



CREATE INDEX "idx_savedposts_lookup" ON "public"."SavedPosts" USING "btree" ("practitioner_id", "post_id");



CREATE INDEX "idx_savedposts_post_id" ON "public"."SavedPosts" USING "btree" ("post_id");



CREATE INDEX "idx_savedposts_practitioner_id" ON "public"."SavedPosts" USING "btree" ("practitioner_id");



CREATE INDEX "idx_site_settings_category" ON "public"."SiteSettings" USING "btree" ("category");



CREATE INDEX "idx_suggestion_votes_practitioner_id" ON "public"."Suggestion_Votes" USING "btree" ("practitioner_id");



CREATE INDEX "idx_suggestion_votes_suggestion_id" ON "public"."Suggestion_Votes" USING "btree" ("suggestion_id");



CREATE INDEX "idx_suggestions_submitted_by" ON "public"."Suggestions" USING "btree" ("submitted_by");



CREATE INDEX "idx_user_roles_practitioner_active" ON "public"."UserRoles" USING "btree" ("practitioner_id", "is_active");



CREATE INDEX "idx_user_roles_role_active" ON "public"."UserRoles" USING "btree" ("role_name", "is_active");



CREATE OR REPLACE TRIGGER "audit_practitioners_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."Practitioners" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_audit_log"();



CREATE OR REPLACE TRIGGER "audit_reviews_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."Reviews" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_audit_log"();



CREATE OR REPLACE TRIGGER "audit_user_roles_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."UserRoles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_audit_log"();



CREATE OR REPLACE TRIGGER "community_post_vote_count_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."CommunityPost_Votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_community_post_vote_count"();



CREATE OR REPLACE TRIGGER "community_stats_trigger" AFTER INSERT OR DELETE ON "public"."CommunityPosts" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_update_community_stats"();



CREATE OR REPLACE TRIGGER "poll_vote_count_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."PollVotes" FOR EACH ROW EXECUTE FUNCTION "public"."update_poll_vote_count"();



CREATE OR REPLACE TRIGGER "trigger_update_suggestion_vote_count_delete" AFTER DELETE ON "public"."Suggestion_Votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_suggestion_vote_count"();



CREATE OR REPLACE TRIGGER "trigger_update_suggestion_vote_count_insert" AFTER INSERT ON "public"."Suggestion_Votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_suggestion_vote_count"();



CREATE OR REPLACE TRIGGER "update_suggestion_votes_trigger" AFTER INSERT OR DELETE ON "public"."Suggestion_Votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_suggestion_vote_count"();



ALTER TABLE ONLY "public"."CommunityModerationActions"
    ADD CONSTRAINT "CommunityModerationActions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."Practitioners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."CommunityModerationActions"
    ADD CONSTRAINT "CommunityModerationActions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."CommunityPosts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."CommunityPost_Votes"
    ADD CONSTRAINT "CommunityPost_Votes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."CommunityPosts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."CommunityPost_Votes"
    ADD CONSTRAINT "CommunityPost_Votes_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."CommunityPosts"
    ADD CONSTRAINT "CommunityPosts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."Practitioners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."CommunityPosts"
    ADD CONSTRAINT "CommunityPosts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."Communities"("id");



ALTER TABLE ONLY "public"."CommunityPosts"
    ADD CONSTRAINT "CommunityPosts_parent_post_id_fkey" FOREIGN KEY ("parent_post_id") REFERENCES "public"."CommunityPosts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."CommunityPosts"
    ADD CONSTRAINT "CommunityPosts_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."Reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Notifications"
    ADD CONSTRAINT "Notifications_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OnboardingAnswers"
    ADD CONSTRAINT "OnboardingAnswers_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."OnboardingAnswers"
    ADD CONSTRAINT "OnboardingAnswers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."OnboardingQuestions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollOptions"
    ADD CONSTRAINT "PollOptions_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."Polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollVotes"
    ADD CONSTRAINT "PollVotes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."PollOptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollVotes"
    ADD CONSTRAINT "PollVotes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "public"."Polls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PollVotes"
    ADD CONSTRAINT "PollVotes_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Practitioners"
    ADD CONSTRAINT "Practitioners_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Publication_History"
    ADD CONSTRAINT "Publication_History_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."Practitioners"("id");



ALTER TABLE ONLY "public"."Publication_History"
    ADD CONSTRAINT "Publication_History_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."Reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ReviewTags"
    ADD CONSTRAINT "ReviewTags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."Reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ReviewTags"
    ADD CONSTRAINT "ReviewTags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."Tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Reviews"
    ADD CONSTRAINT "Reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."Practitioners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Reviews"
    ADD CONSTRAINT "Reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."Practitioners"("id");



ALTER TABLE ONLY "public"."SavedPosts"
    ADD CONSTRAINT "SavedPosts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."CommunityPosts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."SavedPosts"
    ADD CONSTRAINT "SavedPosts_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Suggestion_Votes"
    ADD CONSTRAINT "Suggestion_Votes_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Suggestion_Votes"
    ADD CONSTRAINT "Suggestion_Votes_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "public"."Suggestions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Suggestions"
    ADD CONSTRAINT "Suggestions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."Practitioners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."SystemAuditLog"
    ADD CONSTRAINT "SystemAuditLog_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."Practitioners"("id");



ALTER TABLE ONLY "public"."Tags"
    ADD CONSTRAINT "Tags_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."Tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."UserRoles"
    ADD CONSTRAINT "UserRoles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."Practitioners"("id");



ALTER TABLE ONLY "public"."UserRoles"
    ADD CONSTRAINT "UserRoles_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Suggestion_Votes"
    ADD CONSTRAINT "suggestion_votes_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."Practitioners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Suggestion_Votes"
    ADD CONSTRAINT "suggestion_votes_suggestion_id_fkey" FOREIGN KEY ("suggestion_id") REFERENCES "public"."Suggestions"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all site settings" ON "public"."SiteSettings" TO "authenticated" USING ("public"."user_has_role"("auth"."uid"(), 'admin'::"text")) WITH CHECK ("public"."user_has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can manage all user roles" ON "public"."UserRoles" TO "authenticated" USING (("public"."user_has_role"("auth"."uid"(), 'admin'::"text") OR "public"."user_has_role"("auth"."uid"(), 'editor'::"text"))) WITH CHECK (("public"."user_has_role"("auth"."uid"(), 'admin'::"text") OR "public"."user_has_role"("auth"."uid"(), 'editor'::"text")));



CREATE POLICY "Admins can manage onboarding questions." ON "public"."OnboardingQuestions" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'editor'::"text"])));



CREATE POLICY "Admins can manage poll options" ON "public"."PollOptions" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"])));



CREATE POLICY "Admins can manage polls" ON "public"."Polls" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"])));



CREATE POLICY "Admins can manage publication history" ON "public"."Publication_History" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'editor'::"text"])));



CREATE POLICY "Admins can manage review-tag links." ON "public"."ReviewTags" USING ((( SELECT (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'editor'::"text"]))) WITH CHECK ((( SELECT (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'editor'::"text"])));



CREATE POLICY "Admins can manage tags." ON "public"."Tags" USING ((( SELECT (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'editor'::"text"]))) WITH CHECK ((( SELECT (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text")) = ANY (ARRAY['admin'::"text", 'editor'::"text"])));



CREATE POLICY "Admins can view all audit logs" ON "public"."SystemAuditLog" FOR SELECT TO "authenticated" USING ("public"."user_has_role"("auth"."uid"(), 'admin'::"text"));



CREATE POLICY "Admins can view all onboarding answers." ON "public"."OnboardingAnswers" FOR SELECT USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'editor'::"text"])));



CREATE POLICY "All users can view suggestion votes" ON "public"."Suggestion_Votes" FOR SELECT USING (true);



CREATE POLICY "All users can view suggestions" ON "public"."Suggestions" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can cast votes" ON "public"."Suggestion_Votes" FOR INSERT WITH CHECK (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Authenticated users can create posts" ON "public"."CommunityPosts" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("author_id" = "auth"."uid"())));



CREATE POLICY "Authenticated users can submit suggestions" ON "public"."Suggestions" FOR INSERT WITH CHECK (("auth"."uid"() = "submitted_by"));



CREATE POLICY "Authenticated users can view onboarding questions." ON "public"."OnboardingQuestions" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can vote" ON "public"."CommunityPost_Votes" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("practitioner_id" = "auth"."uid"())));



CREATE POLICY "Authenticated users can vote on polls" ON "public"."PollVotes" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("practitioner_id" = "auth"."uid"())));



ALTER TABLE "public"."Communities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Communities are publicly viewable" ON "public"."Communities" FOR SELECT USING (true);



CREATE POLICY "Community posts are publicly readable" ON "public"."CommunityPosts" FOR SELECT USING (true);



CREATE POLICY "Community stats are publicly readable" ON "public"."CommunityStats" FOR SELECT USING (true);



ALTER TABLE "public"."CommunityModerationActions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."CommunityPost_Votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."CommunityPosts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."CommunityStats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Moderation actions are publicly readable" ON "public"."CommunityModerationActions" FOR SELECT USING (true);



ALTER TABLE "public"."Notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."OnboardingAnswers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."OnboardingQuestions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Only admins can manage communities" ON "public"."Communities" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'editor'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'editor'::"text"])));



CREATE POLICY "Only admins can manage community stats" ON "public"."CommunityStats" USING (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"]))) WITH CHECK (("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"])));



CREATE POLICY "Only editors and admins can create moderation actions" ON "public"."CommunityModerationActions" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"]))));



CREATE POLICY "Only moderators can update their own actions" ON "public"."CommunityModerationActions" FOR UPDATE USING ((("auth"."uid"() = "moderator_id") AND ("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"])))) WITH CHECK ((("auth"."uid"() = "moderator_id") AND ("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"]))));



CREATE POLICY "Poll options are publicly readable" ON "public"."PollOptions" FOR SELECT USING (true);



CREATE POLICY "Poll vote records are publicly readable" ON "public"."PollVotes" FOR SELECT USING (true);



ALTER TABLE "public"."PollOptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."PollVotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Polls" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Polls are publicly readable" ON "public"."Polls" FOR SELECT USING (true);



ALTER TABLE "public"."Practitioners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Practitioners can update their own notifications." ON "public"."Notifications" FOR UPDATE USING (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Practitioners can update their own profile." ON "public"."Practitioners" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Practitioners can view their own notifications." ON "public"."Notifications" FOR SELECT USING (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Practitioners can view their own profile, and admins can view a" ON "public"."Practitioners" FOR SELECT USING ((("auth"."uid"() = "id") OR ("public"."get_my_claim"('role'::"text") = ANY (ARRAY['admin'::"text", 'editor'::"text"]))));



CREATE POLICY "Public site settings are viewable by all" ON "public"."SiteSettings" FOR SELECT TO "authenticated" USING (("is_public" = true));



ALTER TABLE "public"."Publication_History" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ReviewTags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ReviewTags are publicly viewable." ON "public"."ReviewTags" FOR SELECT USING (true);



ALTER TABLE "public"."Reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Reviews are visible based on access level" ON "public"."Reviews" FOR SELECT USING ((("access_level" = 'public'::"text") OR (("status" = 'published'::"text") AND (( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"))));



ALTER TABLE "public"."SavedPosts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Site settings are publicly readable" ON "public"."SiteSettings" FOR SELECT USING (true);



ALTER TABLE "public"."SiteSettings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Suggestion_Votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Suggestions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "System can insert audit logs" ON "public"."SystemAuditLog" FOR INSERT TO "authenticated" WITH CHECK (("performed_by" = "auth"."uid"()));



ALTER TABLE "public"."SystemAuditLog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Tags are publicly viewable." ON "public"."Tags" FOR SELECT USING (true);



ALTER TABLE "public"."UserRoles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can delete their own posts; admins can delete any" ON "public"."CommunityPosts" FOR DELETE USING ((("auth"."uid"() = "author_id") OR ("public"."get_my_claim"('role'::"text") = ANY (ARRAY['editor'::"text", 'admin'::"text"]))));



CREATE POLICY "Users can delete their own votes" ON "public"."CommunityPost_Votes" FOR DELETE USING (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can manage their own onboarding answers." ON "public"."OnboardingAnswers" USING (("auth"."uid"() = "practitioner_id")) WITH CHECK (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can retract their own votes" ON "public"."Suggestion_Votes" FOR DELETE USING (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can save posts" ON "public"."SavedPosts" FOR INSERT WITH CHECK (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can unsave posts" ON "public"."SavedPosts" FOR DELETE USING (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can update their own poll votes" ON "public"."PollVotes" FOR UPDATE USING (("auth"."uid"() = "practitioner_id")) WITH CHECK (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can update their own posts" ON "public"."CommunityPosts" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their own suggestions" ON "public"."Suggestions" FOR UPDATE USING (("auth"."uid"() = "submitted_by")) WITH CHECK (("auth"."uid"() = "submitted_by"));



CREATE POLICY "Users can update their own votes" ON "public"."CommunityPost_Votes" FOR UPDATE USING (("auth"."uid"() = "practitioner_id")) WITH CHECK (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Users can view their own audit logs" ON "public"."SystemAuditLog" FOR SELECT TO "authenticated" USING (("performed_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own roles" ON "public"."UserRoles" FOR SELECT TO "authenticated" USING (("practitioner_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own saved posts" ON "public"."SavedPosts" FOR SELECT USING (("auth"."uid"() = "practitioner_id"));



CREATE POLICY "Vote records are publicly readable" ON "public"."CommunityPost_Votes" FOR SELECT USING (true);



ALTER TABLE "public"."rate_limit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suggestion_votes_policy" ON "public"."Suggestion_Votes" USING (("auth"."uid"() = "practitioner_id")) WITH CHECK (("auth"."uid"() = "practitioner_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON TABLE "public"."CommunityPosts" TO "anon";
GRANT ALL ON TABLE "public"."CommunityPosts" TO "authenticated";
GRANT ALL ON TABLE "public"."CommunityPosts" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text", "p_parent_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text", "p_parent_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_post_and_auto_vote"("p_author_id" "uuid", "p_title" "text", "p_content" "text", "p_category" "text", "p_parent_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."export_analytics_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."export_analytics_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."export_analytics_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_comments_for_post"("p_post_id" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_comments_for_post"("p_post_id" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_comments_for_post"("p_post_id" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_community_feed_with_details"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_community_feed_with_details"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_community_feed_with_details"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_content_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_engagement_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_engagement_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_engagement_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_homepage_suggestions"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_claim"("claim" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_claim"("claim" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_claim"("claim" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_analytics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_post_action"("p_post_id" integer, "p_user_id" "uuid", "p_action_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."handle_post_action"("p_post_id" integer, "p_user_id" "uuid", "p_action_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_post_action"("p_post_id" integer, "p_user_id" "uuid", "p_action_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_event"("p_performed_by" "uuid", "p_action_type" "text", "p_resource_type" "text", "p_resource_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_performed_by" "uuid", "p_action_type" "text", "p_resource_type" "text", "p_resource_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_event"("p_performed_by" "uuid", "p_action_type" "text", "p_resource_type" "text", "p_resource_id" "text", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_audit_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_audit_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_audit_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_community_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_community_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_community_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_post_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_post_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_post_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_community_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_community_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_community_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_poll_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_poll_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_poll_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_suggestion_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_suggestion_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_suggestion_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_role"("p_user_id" "uuid", "p_role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("p_user_id" "uuid", "p_role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("p_user_id" "uuid", "p_role_name" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."Communities" TO "anon";
GRANT ALL ON TABLE "public"."Communities" TO "authenticated";
GRANT ALL ON TABLE "public"."Communities" TO "service_role";



GRANT ALL ON TABLE "public"."CommunityModerationActions" TO "anon";
GRANT ALL ON TABLE "public"."CommunityModerationActions" TO "authenticated";
GRANT ALL ON TABLE "public"."CommunityModerationActions" TO "service_role";



GRANT ALL ON TABLE "public"."CommunityPost_Votes" TO "anon";
GRANT ALL ON TABLE "public"."CommunityPost_Votes" TO "authenticated";
GRANT ALL ON TABLE "public"."CommunityPost_Votes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."CommunityPosts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."CommunityPosts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."CommunityPosts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."CommunityStats" TO "anon";
GRANT ALL ON TABLE "public"."CommunityStats" TO "authenticated";
GRANT ALL ON TABLE "public"."CommunityStats" TO "service_role";



GRANT ALL ON TABLE "public"."Notifications" TO "anon";
GRANT ALL ON TABLE "public"."Notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."Notifications" TO "service_role";



GRANT ALL ON TABLE "public"."OnboardingAnswers" TO "anon";
GRANT ALL ON TABLE "public"."OnboardingAnswers" TO "authenticated";
GRANT ALL ON TABLE "public"."OnboardingAnswers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."OnboardingAnswers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."OnboardingAnswers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."OnboardingAnswers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."OnboardingQuestions" TO "anon";
GRANT ALL ON TABLE "public"."OnboardingQuestions" TO "authenticated";
GRANT ALL ON TABLE "public"."OnboardingQuestions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."OnboardingQuestions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."OnboardingQuestions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."OnboardingQuestions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."PollOptions" TO "anon";
GRANT ALL ON TABLE "public"."PollOptions" TO "authenticated";
GRANT ALL ON TABLE "public"."PollOptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."PollOptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."PollOptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."PollOptions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."PollVotes" TO "anon";
GRANT ALL ON TABLE "public"."PollVotes" TO "authenticated";
GRANT ALL ON TABLE "public"."PollVotes" TO "service_role";



GRANT ALL ON TABLE "public"."Polls" TO "anon";
GRANT ALL ON TABLE "public"."Polls" TO "authenticated";
GRANT ALL ON TABLE "public"."Polls" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Polls_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Polls_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Polls_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Practitioners" TO "anon";
GRANT ALL ON TABLE "public"."Practitioners" TO "authenticated";
GRANT ALL ON TABLE "public"."Practitioners" TO "service_role";



GRANT ALL ON TABLE "public"."Publication_History" TO "anon";
GRANT ALL ON TABLE "public"."Publication_History" TO "authenticated";
GRANT ALL ON TABLE "public"."Publication_History" TO "service_role";



GRANT ALL ON TABLE "public"."ReviewTags" TO "anon";
GRANT ALL ON TABLE "public"."ReviewTags" TO "authenticated";
GRANT ALL ON TABLE "public"."ReviewTags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ReviewTags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ReviewTags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ReviewTags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Reviews" TO "anon";
GRANT ALL ON TABLE "public"."Reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."Reviews" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."SavedPosts" TO "anon";
GRANT ALL ON TABLE "public"."SavedPosts" TO "authenticated";
GRANT ALL ON TABLE "public"."SavedPosts" TO "service_role";



GRANT ALL ON TABLE "public"."SiteSettings" TO "anon";
GRANT ALL ON TABLE "public"."SiteSettings" TO "authenticated";
GRANT ALL ON TABLE "public"."SiteSettings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."SiteSettings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."SiteSettings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."SiteSettings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Suggestion_Votes" TO "anon";
GRANT ALL ON TABLE "public"."Suggestion_Votes" TO "authenticated";
GRANT ALL ON TABLE "public"."Suggestion_Votes" TO "service_role";



GRANT ALL ON TABLE "public"."Suggestions" TO "anon";
GRANT ALL ON TABLE "public"."Suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."Suggestions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Suggestions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Suggestions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Suggestions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."SystemAuditLog" TO "anon";
GRANT ALL ON TABLE "public"."SystemAuditLog" TO "authenticated";
GRANT ALL ON TABLE "public"."SystemAuditLog" TO "service_role";



GRANT ALL ON TABLE "public"."Tags" TO "anon";
GRANT ALL ON TABLE "public"."Tags" TO "authenticated";
GRANT ALL ON TABLE "public"."Tags" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Tags_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."UserRoles" TO "anon";
GRANT ALL ON TABLE "public"."UserRoles" TO "authenticated";
GRANT ALL ON TABLE "public"."UserRoles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_log" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rate_limit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rate_limit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rate_limit_log_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
