
// ABOUTME: TanStack Query hook for fetching individual review details by slug with enhanced error handling and RLS enforcement.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface ReviewAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface ReviewDetail {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  structured_content: any;
  published_at: string;
  author: ReviewAuthor | null;
  access_level: string;
  community_post_id: number | null;
  view_count: number | null;
  edicao: string | null;
  tags: string[];
  // V3 Content Bridge metadata
  contentFormat: 'v3' | 'v2' | 'legacy' | 'unknown';
  nodeCount?: number;
  hasPositions?: boolean;
  hasMobilePositions?: boolean;
}

// Content format analyzer for V3 Content Bridge
const analyzeContentFormat = (data: any): ReviewDetail => {
  const content = data.structured_content;
  
  // Initialize metadata
  let contentFormat: 'v3' | 'v2' | 'legacy' | 'unknown' = 'unknown';
  let nodeCount = 0;
  let hasPositions = false;
  let hasMobilePositions = false;
  
  if (content) {
    // Check for V3 format (positions-based)
    if (content.version === '3.0.0' && content.nodes && Array.isArray(content.nodes)) {
      contentFormat = 'v3';
      nodeCount = content.nodes.length;
      hasPositions = Boolean(content.positions && Object.keys(content.positions).length > 0);
      hasMobilePositions = Boolean(content.mobilePositions && Object.keys(content.mobilePositions).length > 0);
    }
    // Check for V2 format (layouts-based)
    else if (content.layouts && (content.layouts.desktop || content.layouts.mobile)) {
      contentFormat = 'v2';
      // Count blocks in V2 layouts
      const desktopBlocks = content.layouts.desktop?.length || 0;
      const mobileBlocks = content.layouts.mobile?.length || 0;
      nodeCount = Math.max(desktopBlocks, mobileBlocks);
    }
    // Check for legacy formats
    else if (content.blocks || content.elements || Array.isArray(content)) {
      contentFormat = 'legacy';
      nodeCount = content.blocks?.length || content.elements?.length || 
                  (Array.isArray(content) ? content.length : 0);
    }
  }
  
  return {
    ...data,
    contentFormat,
    nodeCount,
    hasPositions,
    hasMobilePositions,
  };
};

const fetchReviewBySlug = async (slug: string): Promise<ReviewDetail> => {
  console.log('Fetching review detail for slug:', slug);
  
  const { data, error } = await supabase.functions.invoke('get-review-by-slug', {
    body: { slug }
  });

  if (error) {
    console.error('Review detail fetch error:', error);
    throw new Error(error.message || 'Failed to fetch review details');
  }

  // Handle edge function response structure: {success: true, data: {...}} or {error: {...}}
  if (data?.error) {
    console.error('Review detail API error:', data.error);
    
    if (data.error.code === 'REVIEW_NOT_FOUND') {
      throw new Error('Review not found');
    }
    
    if (data.error.code === 'ACCESS_DENIED') {
      throw new Error(`Access denied. This content requires: ${data.error.required_tier}`);
    }
    
    throw new Error(data.error.message || 'Failed to fetch review details');
  }

  // Extract the actual review data from the edge function response wrapper
  const reviewData = data?.data || data;
  
  if (!reviewData) {
    throw new Error('No review data received from server');
  }

  // Analyze content format and add metadata
  const enhancedData = analyzeContentFormat(reviewData);
  
  return enhancedData;
};

export const useReviewDetailQuery = (slug: string | undefined) => {
  return useQuery<ReviewDetail>({
    queryKey: ['review-detail', slug],
    queryFn: () => {
      if (!slug) {
        throw new Error('Review slug is required');
      }
      return fetchReviewBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - reviews don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403 errors
      if (error.message.includes('not found') || error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    }
  });
};
