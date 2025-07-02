// ABOUTME: TanStack Query mutation for creating new reviews

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

interface CreateReviewData {
  title: string;
  description: string;
  access_level: string;
}

interface CreateReviewResponse {
  id: number;
  title: string;
  description: string;
  access_level: string;
  status: string;
  created_at: string;
}

const createReview = async (data: CreateReviewData): Promise<CreateReviewResponse> => {
  // Get the current user's ID for author_id and refresh session to get latest JWT claims
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Must be authenticated to create a review');
  }

  // Refresh the session to ensure we have the latest JWT claims (role, subscription_tier)
  // This is important because JWT claims may have been updated in the database
  const {
    data: { session },
    error: refreshError,
  } = await supabase.auth.refreshSession();

  if (refreshError) {
    console.warn('Failed to refresh session, proceeding with current token:', refreshError);
  }

  // Log the data being inserted for debugging
  const insertData = {
    author_id: user.id,
    title: data.title,
    description: data.description,
    access_level: data.access_level,
    status: 'draft',
    structured_content: { nodes: [], layouts: { desktop: { items: {} }, mobile: { items: {} } } },
  };

  console.log('[createReview] Attempting to insert:', insertData);
  console.log('[createReview] User ID:', user.id);

  const { data: review, error } = await supabase
    .from('Reviews')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[createReview] Database error:', error);
    console.error('[createReview] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to create review: ${error.message}`);
  }

  return review;
};

export const useCreateReviewMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      // Invalidate content queue to show new review
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });
    },
    onError: error => {
      console.error('Create review failed:', error);
    },
  });
};
