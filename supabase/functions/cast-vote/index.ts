
// ABOUTME: Consolidated voting system handling all vote types with standardized pattern

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import {
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  handleCorsPreflightRequest,
  RateLimitError
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

interface VoteRequest {
  entity_id: number;
  vote_type: 'up' | 'down' | 'none';
  entity_type: 'suggestion' | 'community_post' | 'poll';
}

serve(async (req: Request) => {
  // STEP 1: Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Create Supabase client and authenticate
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const user = await authenticateUser(supabase, req.headers.get('Authorization'));

    // STEP 3: Rate Limiting - FIXED: Pass full req object
    const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Parse and validate request body
    const requestBody: VoteRequest = await req.json();
    const { entity_id, vote_type, entity_type } = requestBody;

    // Validate input
    if (!entity_id || typeof entity_id !== 'number') {
      throw new Error('VALIDATION_FAILED: Invalid entity_id');
    }

    if (!vote_type || !['up', 'down', 'none'].includes(vote_type)) {
      throw new Error('VALIDATION_FAILED: Invalid vote_type. Must be "up", "down", or "none"');
    }

    if (!entity_type || !['suggestion', 'community_post', 'poll'].includes(entity_type)) {
      throw new Error('VALIDATION_FAILED: Invalid entity_type');
    }

    console.log(`Processing ${vote_type} vote for ${entity_type} ${entity_id} by user ${user.id}`);

    // STEP 5: Execute business logic based on entity type
    let result;
    
    switch (entity_type) {
      case 'suggestion':
        result = await handleSuggestionVote(supabase, entity_id, vote_type, user.id);
        break;
      case 'community_post':
        result = await handleCommunityPostVote(supabase, entity_id, vote_type, user.id);
        break;
      case 'poll':
        result = await handlePollVote(supabase, entity_id, vote_type, user.id);
        break;
      default:
        throw new Error('VALIDATION_FAILED: Unsupported entity type');
    }

    // STEP 6: Return standardized success response
    return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 7: Centralized error handling
    console.error('Critical error in cast-vote:', error);
    return createErrorResponse(error);
  }
});

async function handleSuggestionVote(supabase: any, suggestionId: number, voteType: string, userId: string) {
  if (voteType === 'none') {
    // Remove existing vote
    const { error: deleteError } = await supabase
      .from('Suggestion_Votes')
      .delete()
      .eq('suggestion_id', suggestionId)
      .eq('practitioner_id', userId);

    if (deleteError) {
      throw new Error(`Failed to remove vote: ${deleteError.message}`);
    }
  } else {
    // Insert or update vote (suggestions only support upvotes)
    if (voteType === 'up') {
      const { error: upsertError } = await supabase
        .from('Suggestion_Votes')
        .upsert({
          suggestion_id: suggestionId,
          practitioner_id: userId
        });

      if (upsertError) {
        throw new Error(`Failed to cast vote: ${upsertError.message}`);
      }
    }
  }

  // Get updated vote count
  const { data: suggestion } = await supabase
    .from('Suggestions')
    .select('upvotes')
    .eq('id', suggestionId)
    .single();

  return {
    message: 'Vote processed successfully',
    entity_id: suggestionId,
    entity_type: 'suggestion',
    new_vote_count: suggestion?.upvotes || 0
  };
}

async function handleCommunityPostVote(supabase: any, postId: number, voteType: string, userId: string) {
  // Validate the post exists
  const { data: post, error: postError } = await supabase
    .from('CommunityPosts')
    .select('id')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    throw new Error('Post not found');
  }

  if (voteType === 'none') {
    // Remove existing vote
    const { error: deleteError } = await supabase
      .from('CommunityPost_Votes')
      .delete()
      .eq('post_id', postId)
      .eq('practitioner_id', userId);

    if (deleteError) {
      throw new Error(`Failed to remove vote: ${deleteError.message}`);
    }
  } else {
    // Insert or update vote
    const { error: upsertError } = await supabase
      .from('CommunityPost_Votes')
      .upsert({
        post_id: postId,
        practitioner_id: userId,
        vote_type: voteType
      }, {
        onConflict: 'post_id,practitioner_id'
      });

    if (upsertError) {
      throw new Error(`Failed to cast vote: ${upsertError.message}`);
    }
  }

  // Get updated vote counts
  const { data: updatedPost } = await supabase
    .from('CommunityPosts')
    .select('upvotes, downvotes')
    .eq('id', postId)
    .single();

  return {
    message: 'Vote processed successfully',
    entity_id: postId,
    entity_type: 'community_post',
    upvotes: updatedPost?.upvotes || 0,
    downvotes: updatedPost?.downvotes || 0
  };
}

async function handlePollVote(supabase: any, optionId: number, voteType: string, userId: string) {
  // For polls, entity_id is the option_id, and we only support 'up' votes
  if (voteType !== 'up') {
    throw new Error('VALIDATION_FAILED: Polls only support upvotes');
  }

  // Validate the poll option exists and get poll_id
  const { data: option, error: optionError } = await supabase
    .from('PollOptions')
    .select('id, poll_id')
    .eq('id', optionId)
    .single();

  if (optionError || !option) {
    throw new Error('Invalid poll option');
  }

  // Check if poll is still active
  const { data: poll, error: pollError } = await supabase
    .from('Polls')
    .select('expires_at')
    .eq('id', option.poll_id)
    .single();

  if (pollError) {
    throw new Error('Poll not found');
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    throw new Error('Poll has expired');
  }

  // Insert or update vote
  const { error: upsertError } = await supabase
    .from('PollVotes')
    .upsert({
      poll_id: option.poll_id,
      option_id: optionId,
      practitioner_id: userId
    }, {
      onConflict: 'poll_id,practitioner_id'
    });

  if (upsertError) {
    throw new Error(`Failed to cast poll vote: ${upsertError.message}`);
  }

  return {
    message: 'Poll vote processed successfully',
    entity_id: optionId,
    entity_type: 'poll',
    poll_id: option.poll_id
  };
}
