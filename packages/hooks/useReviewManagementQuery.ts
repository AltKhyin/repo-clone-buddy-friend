// ABOUTME: TanStack Query hook for fetching complete review management data

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface ReviewManagementData {
  id: number;
  title: string;
  description: string;
  cover_image_url: string;
  structured_content: any;
  status: string;
  access_level: string;
  view_count: number;
  review_status: string;
  reviewer_id: string;
  scheduled_publish_at: string;
  publication_notes: string;
  created_at: string;
  published_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  tags: Array<{
    id: number;
    tag_name: string;
    color: string;
  }>;
}

const fetchReviewManagementData = async (reviewId: string): Promise<ReviewManagementData> => {
  const numericReviewId = parseInt(reviewId, 10);
  if (isNaN(numericReviewId)) {
    throw new Error(`Invalid reviewId: ${reviewId}`);
  }

  // Fetch review with author and tags
  const { data, error } = await supabase
    .from('Reviews')
    .select(
      `
      *,
      author:Practitioners(id, full_name, avatar_url),
      tags:ReviewTags(
        tag:Tags(id, tag_name, color)
      )
    `
    )
    .eq('id', numericReviewId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  // Transform tags data
  const transformedData = {
    ...data,
    tags: data.tags?.map((tagRel: any) => tagRel.tag) || [],
  };

  return transformedData;
};

export const useReviewManagementQuery = (reviewId: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'review-management', reviewId],
    queryFn: () => fetchReviewManagementData(reviewId!),
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
