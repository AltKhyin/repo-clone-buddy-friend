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

  // Refresh the session to ensure we have the latest JWT (simplified approach)
  try {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('[createReview] Failed to refresh session:', refreshError);
    }
  } catch (error) {
    console.warn('[createReview] Session refresh error:', error);
  }

  // Log current session and JWT claims for debugging
  const currentSession = await supabase.auth.getSession();
  console.log('[createReview] Current session:', {
    user: currentSession.data.session?.user?.id,
    email: currentSession.data.session?.user?.email,
    role: currentSession.data.session?.user?.role,
    app_metadata: currentSession.data.session?.user?.app_metadata,
    user_metadata: currentSession.data.session?.user?.user_metadata,
  });

  // Also try to get user claims directly
  const { data: userWithSession } = await supabase.auth.getUser();
  console.log('[createReview] User from getUser():', {
    id: userWithSession.user?.id,
    email: userWithSession.user?.email,
    app_metadata: userWithSession.user?.app_metadata,
    user_metadata: userWithSession.user?.user_metadata,
  });

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
