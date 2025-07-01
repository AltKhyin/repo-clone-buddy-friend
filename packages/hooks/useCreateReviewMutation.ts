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
  // Get the current user's ID for author_id
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Must be authenticated to create a review');
  }

  const { data: review, error } = await supabase
    .from('Reviews')
    .insert({
      author_id: user.id,
      title: data.title,
      description: data.description,
      access_level: data.access_level,
      status: 'draft',
      structured_content: { nodes: [], layouts: { desktop: { items: {} }, mobile: { items: {} } } },
    })
    .select()
    .single();

  if (error) {
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
