
// ABOUTME: Data-fetching hook for comprehensive tag management with hierarchy and analytics

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunctionGet, invokeFunctionPost } from '../../src/lib/supabase-functions';

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
  const data = await invokeFunctionGet<TagWithStats[]>('admin-tag-operations');
  return data || [];
};

// Fetch tag analytics and statistics
const fetchTagAnalytics = async (): Promise<TagAnalytics> => {
  const data = await invokeFunctionGet<TagAnalytics>('admin-tag-analytics');
  return data;
};

// Execute tag operations (create, update, delete, merge, etc.)
const executeTagOperation = async (payload: TagOperationPayload) => {
  return await invokeFunctionPost('admin-tag-operations', payload);
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
