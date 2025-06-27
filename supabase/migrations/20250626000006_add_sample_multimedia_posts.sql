-- Add sample multimedia posts for debugging
-- Create test users and posts to verify multimedia functionality

-- Insert a test practitioner if not exists (for local development)
INSERT INTO "Practitioners" (id, full_name, avatar_url, role, subscription_tier, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test User',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    'practitioner',
    'free',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample multimedia posts for testing
INSERT INTO "CommunityPosts" (
    title, 
    content, 
    category, 
    author_id, 
    post_type, 
    image_url, 
    video_url, 
    poll_data,
    created_at
) VALUES 
-- Text post
(
    'Sample Text Post',
    'This is a sample text post for testing purposes.',
    'general',
    '11111111-1111-1111-1111-111111111111',
    'text',
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours'
),
-- Image post
(
    'Sample Image Post',
    'Check out this interesting chart about medical data trends.',
    'data',
    '11111111-1111-1111-1111-111111111111',
    'image',
    'https://picsum.photos/800/600?random=1',
    NULL,
    NULL,
    NOW() - INTERVAL '1 hour'
),
-- Video post
(
    'Sample Video Post',
    'Great educational video about clinical procedures.',
    'education',
    '11111111-1111-1111-1111-111111111111',
    'video',
    NULL,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    NULL,
    NOW() - INTERVAL '30 minutes'
),
-- Poll post
(
    'Sample Poll Post',
    'What is your preferred method for patient assessment?',
    'discussion',
    '11111111-1111-1111-1111-111111111111',
    'poll',
    NULL,
    NULL,
    '{
        "question": "What is your preferred method for patient assessment?",
        "options": [
            {"id": 1, "text": "Systematic approach", "votes": 5},
            {"id": 2, "text": "Intuitive assessment", "votes": 3},
            {"id": 3, "text": "Evidence-based protocols", "votes": 8},
            {"id": 4, "text": "Mixed approach", "votes": 12}
        ],
        "total_votes": 28,
        "multiple_choice": false,
        "expires_at": null
    }'::jsonb,
    NOW() - INTERVAL '15 minutes'
)
ON CONFLICT DO NOTHING;

-- Add some sample votes to make the data more realistic
INSERT INTO "CommunityPost_Votes" (post_id, practitioner_id, vote_type, created_at)
SELECT 
    cp.id,
    '11111111-1111-1111-1111-111111111111',
    'up',
    NOW()
FROM "CommunityPosts" cp 
WHERE cp.author_id = '11111111-1111-1111-1111-111111111111'
AND cp.title LIKE 'Sample%'
LIMIT 2
ON CONFLICT (post_id, practitioner_id) DO NOTHING;

-- Update vote counts for the sample posts
UPDATE "CommunityPosts"
SET upvotes = (
    SELECT COUNT(*) 
    FROM "CommunityPost_Votes" 
    WHERE post_id = "CommunityPosts".id AND vote_type = 'up'
),
downvotes = (
    SELECT COUNT(*) 
    FROM "CommunityPost_Votes" 
    WHERE post_id = "CommunityPosts".id AND vote_type = 'down'
)
WHERE author_id = '11111111-1111-1111-1111-111111111111';