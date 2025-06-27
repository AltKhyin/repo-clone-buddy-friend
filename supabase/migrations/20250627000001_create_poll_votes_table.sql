-- Create PollVotes table for tracking poll votes
CREATE TABLE IF NOT EXISTS "PollVotes" (
    "id" SERIAL PRIMARY KEY,
    "post_id" INTEGER NOT NULL REFERENCES "CommunityPosts"("id") ON DELETE CASCADE,
    "practitioner_id" UUID NOT NULL REFERENCES "Practitioners"("id") ON DELETE CASCADE,
    "option_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one vote per user per poll
    UNIQUE("post_id", "practitioner_id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_poll_votes_post_id" ON "PollVotes"("post_id");
CREATE INDEX IF NOT EXISTS "idx_poll_votes_practitioner_id" ON "PollVotes"("practitioner_id");
CREATE INDEX IF NOT EXISTS "idx_poll_votes_created_at" ON "PollVotes"("created_at");

-- Enable RLS
ALTER TABLE "PollVotes" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PollVotes
-- Users can view all poll votes (for statistics)
CREATE POLICY "poll_votes_select_policy" ON "PollVotes"
    FOR SELECT USING (true);

-- Users can only insert their own votes
CREATE POLICY "poll_votes_insert_policy" ON "PollVotes"
    FOR INSERT WITH CHECK (
        "practitioner_id" = auth.uid()
    );

-- Users can only update their own votes
CREATE POLICY "poll_votes_update_policy" ON "PollVotes"
    FOR UPDATE USING (
        "practitioner_id" = auth.uid()
    ) WITH CHECK (
        "practitioner_id" = auth.uid()
    );

-- Users can only delete their own votes
CREATE POLICY "poll_votes_delete_policy" ON "PollVotes"
    FOR DELETE USING (
        "practitioner_id" = auth.uid()
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_poll_votes_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_poll_votes_updated_at_trigger
    BEFORE UPDATE ON "PollVotes"
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_votes_updated_at();