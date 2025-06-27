import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { sendSuccess, sendError } from '../_shared/api-helpers.ts';
import { authenticateRequest } from '../_shared/auth.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // Verify authentication
    const authResult = await authenticateRequest(req);
    if (!authResult.success || !authResult.user) {
      return sendError('Unauthorized. Please log in to vote on polls.', 401);
    }
    const user = authResult.user;

    // Parse request body
    const { post_id, option_index } = await req.json();

    if (!post_id || option_index === undefined || option_index === null) {
      return sendError('Invalid request. post_id and option_index are required.', 400);
    }

    if (typeof option_index !== 'number' || option_index < 0) {
      return sendError('Invalid option_index. Must be a non-negative number.', 400);
    }

    console.log(`Processing poll vote: user=${user.id}, post=${post_id}, option=${option_index}`);

    // Get the post and verify it's a poll
    const { data: post, error: postError } = await supabase
      .from('CommunityPosts')
      .select('id, post_type, poll_data, author_id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      console.error('Post fetch error:', postError);
      return sendError('Post not found.', 404);
    }

    if (post.post_type !== 'poll' || !post.poll_data) {
      return sendError('This post is not a poll.', 400);
    }

    // Validate option_index against available options
    const pollData = post.poll_data as { options: any[], question: string, expiresAt?: string };
    if (option_index >= pollData.options.length) {
      return sendError(`Invalid option_index. Poll has ${pollData.options.length} options (0-${pollData.options.length - 1}).`, 400);
    }

    // Check if poll has expired
    if (pollData.expiresAt) {
      const expiryDate = new Date(pollData.expiresAt);
      if (expiryDate < new Date()) {
        return sendError('This poll has expired and no longer accepts votes.', 400);
      }
    }

    // Check if user has already voted on this poll
    const { data: existingVote } = await supabase
      .from('PollVotes')
      .select('id, option_index')
      .eq('post_id', post_id)
      .eq('practitioner_id', user.id)
      .single();

    let voteResult;

    if (existingVote) {
      // User is changing their vote
      console.log(`User ${user.id} changing vote from option ${existingVote.option_index} to ${option_index}`);
      
      const { data, error } = await supabase
        .from('PollVotes')
        .update({ 
          option_index: option_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) {
        console.error('Vote update error:', error);
        return sendError('Failed to update vote. Please try again.', 500);
      }

      voteResult = data;
    } else {
      // User is casting a new vote
      console.log(`User ${user.id} casting new vote for option ${option_index}`);
      
      const { data, error } = await supabase
        .from('PollVotes')
        .insert({
          post_id: post_id,
          practitioner_id: user.id,
          option_index: option_index,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Vote insert error:', error);
        return sendError('Failed to cast vote. Please try again.', 500);
      }

      voteResult = data;
    }

    // Get updated poll statistics
    const { data: voteStats, error: statsError } = await supabase
      .from('PollVotes')
      .select('option_index')
      .eq('post_id', post_id);

    if (statsError) {
      console.error('Vote stats error:', statsError);
      // Don't fail the request, just return basic success
      return sendSuccess({
        vote: voteResult,
        message: 'Vote recorded successfully'
      });
    }

    // Calculate vote counts per option
    const voteCounts: { [key: number]: number } = {};
    voteStats.forEach(vote => {
      voteCounts[vote.option_index] = (voteCounts[vote.option_index] || 0) + 1;
    });

    // Update the poll_data with new vote counts
    const updatedOptions = pollData.options.map((option: any, index: number) => ({
      ...option,
      votes: voteCounts[index] || 0
    }));

    const updatedPollData = {
      ...pollData,
      options: updatedOptions,
      total_votes: voteStats.length
    };

    // Update the post with new poll data
    const { error: updateError } = await supabase
      .from('CommunityPosts')
      .update({ poll_data: updatedPollData })
      .eq('id', post_id);

    if (updateError) {
      console.error('Poll data update error:', updateError);
      // Don't fail the request, vote was already recorded
    }

    console.log(`Poll vote successful: post=${post_id}, user=${user.id}, option=${option_index}`);

    return sendSuccess({
      vote: voteResult,
      poll_data: updatedPollData,
      user_vote: option_index,
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    console.error('Poll vote error:', error);
    return sendError('Internal server error. Please try again.', 500);
  }
});