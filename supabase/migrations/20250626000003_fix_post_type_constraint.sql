-- Fix post_type constraint to include 'video' as valid option
-- The current constraint only allows ['text', 'image', 'link', 'poll'] but the app expects 'video' support

ALTER TABLE "public"."CommunityPosts" 
DROP CONSTRAINT "communityposts_post_type_check";

ALTER TABLE "public"."CommunityPosts" 
ADD CONSTRAINT "communityposts_post_type_check" 
CHECK (("post_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'link'::"text", 'poll'::"text", 'video'::"text"])));