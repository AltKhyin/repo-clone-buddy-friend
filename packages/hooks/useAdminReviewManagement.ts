// ABOUTME: TanStack Query hook for fetching complete review management data with extended metadata

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { ReviewMetadataExtended, ContentType } from '../../src/types';

export interface ReviewManagementData extends ReviewMetadataExtended {
  // This interface now extends the comprehensive metadata type
  structured_content: any;
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

  // Fetch review with author, tags, and content types (including all new metadata fields)
  const { data, error } = await supabase
    .from('Reviews')
    .select(
      `
      *,
      author:Practitioners!Reviews_author_id_fkey(id, full_name, avatar_url),
      tags:ReviewTags(
        tag:Tags(id, tag_name, color)
      ),
      content_types:ReviewContentTypes(
        content_type:ContentTypes(id, label, description, text_color, border_color, background_color, is_system)
      )
    `
    )
    .eq('id', numericReviewId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  // Transform tags and content types data
  const transformedData = {
    ...data,
    tags: data.tags?.map((tagRel: any) => tagRel.tag) || [],
    content_types: data.content_types?.map((ctRel: any) => ctRel.content_type) || [],
  };

  return transformedData;
};

export const useAdminReviewManagement = (reviewId: string | undefined) => {
  return useQuery({
    queryKey: ['admin', 'review', reviewId],
    queryFn: () => fetchReviewManagementData(reviewId!),
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
