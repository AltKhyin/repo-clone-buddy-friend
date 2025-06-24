
-- Create rate limiting log table for tracking API usage
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id BIGSERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_key_timestamp ON rate_limit_log(key, timestamp);

-- RLS policy - only service role can access
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Clean up old entries automatically (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_log()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM rate_limit_log 
    WHERE timestamp < EXTRACT(EPOCH FROM NOW() - INTERVAL '1 hour');
END;
$$;

-- Schedule cleanup every 15 minutes
SELECT cron.schedule('cleanup-rate-limit-log', '*/15 * * * *', 'SELECT cleanup_rate_limit_log();');
