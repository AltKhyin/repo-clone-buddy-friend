
// ABOUTME: Data-fetching hook for comprehensive tag management with hierarchy and analytics

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

export interface TagWithStats {
  id: number;
  tag_name: string;
  parent_id: number | null;
  created_at: string;
  usage_count: number;
  direct_children: number;
  total_descendants: number;
  recent_usage: number;
  color?: string;
  description?: string;
}

export interface TagAnalytics {
  totalTags: number;
  popularTags: number;
  unusedTags: number;
  newThisMonth: number;
  hierarchyDepth: number;
  topUsedTags: TagWithStats[];
  orphanedTags: TagWithStats[];
  recentTags: TagWithStats[];
}

export interface TagOperationPayload {
  action: 'create' | 'update' | 'delete' | 'merge' | 'move' | 'cleanup';
  tagId?: number;
  parentId?: number | null;
  name?: string;
  description?: string;
  mergeTargetId?: number;
  bulkTagIds?: number[];
}

// Fetch comprehensive tag data with hierarchy and usage stats
const fetchTagsWithHierarchy = async (): Promise<TagWithStats[]> => {
  const { data, error } = await supabase
    .from('Tags')
    .select(`
      id,
      tag_name,
      parent_id,
      created_at,
      ReviewTags(count)
    `)
    .order('tag_name');

  if (error) throw new Error(`Failed to fetch tags: ${error.message}`);

  // Transform data to include usage statistics
  return (data || []).map(tag => ({
    id: tag.id,
    tag_name: tag.tag_name,
    parent_id: tag.parent_id,
    created_at: tag.created_at,
    usage_count: Array.isArray(tag.ReviewTags) ? tag.ReviewTags.length : 0,
    direct_children: 0, // Will be calculated client-side
    total_descendants: 0, // Will be calculated client-side
    recent_usage: 0 // Will be calculated client-side
  }));
};

// Fetch tag analytics and statistics
const fetchTagAnalytics = async (): Promise<TagAnalytics> => {
  const [tagsResponse, recentTagsResponse] = await Promise.all([
    supabase.from('Tags').select('id, tag_name, parent_id, created_at'),
    supabase
      .from('Tags')
      .select('id, tag_name, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  if (tagsResponse.error) throw new Error(`Failed to fetch tag analytics: ${tagsResponse.error.message}`);

  const allTags = tagsResponse.data || [];
  const recentTags = recentTagsResponse.data || [];

  // Calculate analytics
  const totalTags = allTags.length;
  const orphanedTags = allTags.filter(tag => !tag.parent_id && 
    !allTags.some(child => child.parent_id === tag.id));
  const maxDepth = calculateMaxDepth(allTags);

  return {
    totalTags,
    popularTags: 0, // Will be calculated with usage data
    unusedTags: orphanedTags.length,
    newThisMonth: recentTags.length,
    hierarchyDepth: maxDepth,
    topUsedTags: [],
    orphanedTags: orphanedTags.map(tag => ({
      id: tag.id,
      tag_name: tag.tag_name,
      parent_id: tag.parent_id,
      created_at: tag.created_at,
      usage_count: 0,
      direct_children: 0,
      total_descendants: 0,
      recent_usage: 0
    })),
    recentTags: recentTags.map(tag => ({
      id: tag.id,
      tag_name: tag.tag_name,
      parent_id: null,
      created_at: tag.created_at,
      usage_count: 0,
      direct_children: 0,
      total_descendants: 0,
      recent_usage: 0
    }))
  };
};

// Helper function to calculate hierarchy depth
const calculateMaxDepth = (tags: any[]): number => {
  const getDepth = (tagId: number, visited = new Set<number>()): number => {
    if (visited.has(tagId)) return 0; // Prevent infinite loops
    visited.add(tagId);
    
    const children = tags.filter(t => t.parent_id === tagId);
    if (children.length === 0) return 1;
    
    return 1 + Math.max(...children.map(child => getDepth(child.id, new Set(visited))));
  };

  const rootTags = tags.filter(t => !t.parent_id);
  return rootTags.length > 0 ? Math.max(...rootTags.map(tag => getDepth(tag.id))) : 0;
};

// Execute tag operations (create, update, delete, merge, etc.)
const executeTagOperation = async (payload: TagOperationPayload) => {
  const { data, error } = await supabase.functions.invoke('admin-tag-operations', {
    body: payload
  });

  if (error) throw new Error(`Tag operation failed: ${error.message}`);
  return data;
};

// Main hook for tag management
export const useTagManagementQuery = () => {
  return useQuery({
    queryKey: ['admin', 'tags', 'management'],
    queryFn: fetchTagsWithHierarchy,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for tag analytics
export const useTagAnalyticsQuery = () => {
  return useQuery({
    queryKey: ['admin', 'tags', 'analytics'],
    queryFn: fetchTagAnalytics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for tag operations
export const useTagOperationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeTagOperation,
    onSuccess: () => {
      // Invalidate all tag-related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] }); // General tag queries
    },
    onError: (error) => {
      console.error('Tag operation failed:', error);
    },
  });
};
