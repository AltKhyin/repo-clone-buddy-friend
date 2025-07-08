
// ABOUTME: TanStack Query hook for fetching Acervo data with aggressive caching.

import { useQuery } from '@tanstack/react-query';
import { invokeFunctionGet } from '../../src/lib/supabase-functions';

export interface AcervoReview {
  review_id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  published_at: string;
  view_count: number;
  // Additional fields for parity with HomepageReview
  reading_time_minutes?: number | null;
  custom_author_name?: string | null;
  custom_author_avatar_url?: string | null;
  edicao?: string | null;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  content_types?: {
    id: number;
    label: string;
    text_color: string;
    border_color: string;
    background_color: string;
  }[];
  tags_json: { [categoria: string]: string[] };
}

export interface AcervoTag {
  id: number;
  tag_name: string;
  parent_id: number | null;
  created_at: string; // Added missing property
}

export interface AcervoData {
  reviews: AcervoReview[];
  tags: AcervoTag[];
}

export const useAcervoDataQuery = () => {
  return useQuery<AcervoData>({
    queryKey: ['acervo-data'],
    queryFn: async () => {
      console.log('Fetching acervo data via Edge Function...');
      
      const data = await invokeFunctionGet<AcervoData>('get-acervo-data');
      
      console.log('Acervo data fetched successfully:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
