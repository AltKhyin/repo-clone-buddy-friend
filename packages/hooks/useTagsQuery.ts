// ABOUTME: Data-fetching hook for tags with hierarchical structure for review tag selection
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tag {
  id: number;
  tag_name: string;
  parent_id: number | null;
  color: string | null;
  description: string | null;
  created_at: string;
}

const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from('Tags')
    .select('id, tag_name, parent_id, color, description, created_at')
    .order('parent_id', { nullsFirst: true })
    .order('tag_name');

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  return data || [];
};

export const useTagsQuery = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
