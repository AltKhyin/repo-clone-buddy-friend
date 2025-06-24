
// ABOUTME: TanStack Query hook for fetching Acervo data with aggressive caching.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface AcervoReview {
  review_id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  published_at: string;
  view_count: number; // Added missing property
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
      
      const { data, error } = await supabase.functions.invoke('get-acervo-data', {
        body: {}
      });

      if (error) {
        console.error('Acervo data fetch error:', error);
        throw new Error(error.message || 'Failed to fetch acervo data');
      }

      if (data?.error) {
        console.error('Acervo data API error:', data.error);
        throw new Error(data.error.details || data.error || 'Failed to fetch acervo data');
      }

      console.log('Acervo data fetched successfully:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
