
-- Performance indexes for Acervo queries
-- Optimizes tag-based filtering and review fetching

-- Index for Reviews status and published_at filtering (critical for Acervo)
CREATE INDEX IF NOT EXISTS "idx_reviews_status_published" 
ON "Reviews"("status", "published_at" DESC NULLS LAST);

-- Index for ReviewTags join performance
CREATE INDEX IF NOT EXISTS "idx_reviewtags_review_tag" 
ON "ReviewTags"("review_id", "tag_id");

-- Index for Tags hierarchy queries
CREATE INDEX IF NOT EXISTS "idx_tags_parent_name" 
ON "Tags"("parent_id", "tag_name");

-- Index for Reviews access_level filtering (RLS support)
CREATE INDEX IF NOT EXISTS "idx_reviews_access_level" 
ON "Reviews"("access_level");

-- Composite index for Reviews main query optimization
CREATE INDEX IF NOT EXISTS "idx_reviews_published_composite" 
ON "Reviews"("status", "access_level", "published_at" DESC) 
WHERE "status" = 'published' AND "published_at" IS NOT NULL;
