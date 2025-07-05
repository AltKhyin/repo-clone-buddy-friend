// ABOUTME: TanStack Query hooks for content type management following established tag management patterns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import type { ContentType, ContentTypeOperation, ContentTypeOperationResponse } from '../../src/types';

// Fetch all content types
export const useContentTypeManagement = () => {
  return useQuery({
    queryKey: ['content-types'],
    queryFn: async (): Promise<ContentType[]> => {
      const { data, error } = await supabase
        .from('ContentTypes')
        .select('*')
        .order('label');

      if (error) {
        throw new Error(`Failed to fetch content types: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Content type operations mutation (create, update, delete)
export const useContentTypeOperationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operation: ContentTypeOperation): Promise<ContentTypeOperationResponse> => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-content-type-operations', {
          body: operation,
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(error.message || `Edge function error: ${JSON.stringify(error)}`);
        }

        if (!data.success) {
          console.error('Function returned error:', data);
          throw new Error(data.error || 'Content type operation failed');
        }

        return data;
      } catch (error) {
        console.error('Content type operation failed:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch content types
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      
      // Also invalidate review management queries since they include content types
      queryClient.invalidateQueries({ queryKey: ['admin', 'review'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-queue'] });

      console.log(`Content type operation ${variables.action} succeeded:`, data.message);
    },
    onError: (error, variables) => {
      console.error(`Content type operation ${variables.action} failed:`, error);
    },
    retry: (failureCount, error) => {
      // Don't retry on client errors (400-499)
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Get content type by ID (useful for editing)
export const useContentType = (contentTypeId?: number) => {
  return useQuery({
    queryKey: ['content-types', contentTypeId],
    queryFn: async (): Promise<ContentType | null> => {
      if (!contentTypeId) return null;

      const { data, error } = await supabase
        .from('ContentTypes')
        .select('*')
        .eq('id', contentTypeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        throw new Error(`Failed to fetch content type: ${error.message}`);
      }

      return data;
    },
    enabled: !!contentTypeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Helper function to get content type analytics (usage counts)
export const useContentTypeAnalytics = () => {
  return useQuery({
    queryKey: ['content-types', 'analytics'],
    queryFn: async () => {
      // Get content types with usage counts
      const { data, error } = await supabase
        .from('ContentTypes')
        .select(`
          *,
          usage_count:ReviewContentTypes(count)
        `);

      if (error) {
        throw new Error(`Failed to fetch content type analytics: ${error.message}`);
      }

      // Transform the data to include usage counts
      const analytics = data?.map(type => ({
        ...type,
        usage_count: Array.isArray(type.usage_count) ? type.usage_count.length : 0,
      })) || [];

      return {
        contentTypes: analytics,
        totalTypes: analytics.length,
        systemTypes: analytics.filter(t => t.is_system).length,
        customTypes: analytics.filter(t => !t.is_system).length,
        totalUsages: analytics.reduce((sum, t) => sum + t.usage_count, 0),
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Validate hex color helper function
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

// Default color presets for new content types
export const getDefaultContentTypeColors = () => {
  const colorPresets = [
    { text_color: '#1e40af', border_color: '#3b82f6', background_color: '#dbeafe' }, // Blue
    { text_color: '#065f46', border_color: '#10b981', background_color: '#d1fae5' }, // Green
    { text_color: '#9a3412', border_color: '#ea580c', background_color: '#fed7aa' }, // Orange
    { text_color: '#581c87', border_color: '#8b5cf6', background_color: '#e9d5ff' }, // Purple
    { text_color: '#be185d', border_color: '#ec4899', background_color: '#fce7f3' }, // Pink
    { text_color: '#0c4a6e', border_color: '#0284c7', background_color: '#e0f2fe' }, // Sky
    { text_color: '#166534', border_color: '#16a34a', background_color: '#dcfce7' }, // Emerald
    { text_color: '#7c2d12', border_color: '#dc2626', background_color: '#fecaca' }, // Red
  ];

  // Return a random preset
  return colorPresets[Math.floor(Math.random() * colorPresets.length)];
};