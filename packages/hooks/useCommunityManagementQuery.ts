// ABOUTME: Comprehensive TanStack Query hooks for community management operations including sidebar data, admin operations, and online users tracking

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunctionPost, invokeFunctionGet } from '../../src/lib/supabase-functions';

// =============================================================================
// Type Definitions
// =============================================================================

export interface CommunitySidebarData {
  sections: CommunitySidebarSection[];
  categories: CommunityCategory[];
  announcements: CommunityAnnouncement[];
  recentMembers: OnlineUser[]; // Simplified to recent members instead of real-time online users
  memberStats: {
    totalMembers: number;
    onlineCount: number;
  };
  moderators: CommunityModerator[];
}

export interface CommunitySidebarSection {
  id: string;
  section_type:
    | 'about'
    | 'links'
    | 'rules'
    | 'moderators'
    | 'categories'
    | 'announcements'
    | 'custom';
  title: string;
  content: Record<string, any>;
  display_order: number;
  is_visible: boolean;
  is_system: boolean;
  computed_data?: Record<string, any>;
}

export interface CommunityCategory {
  id: number;
  name: string;
  label: string;
  description?: string;
  text_color: string;
  border_color: string;
  background_color: string;
  icon_name?: string;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'news' | 'changelog' | 'event';
  priority: number;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  expires_at?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
}

export interface OnlineUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface CommunityModerator {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'moderator';
  profession?: string;
}

export interface AdminCommunityRequest {
  operation: 'create' | 'update' | 'delete' | 'reorder' | 'toggle_visibility';
  resource: 'categories' | 'sidebar_sections' | 'announcements' | 'custom_sections';
  data?: any;
  id?: string | number;
  ids?: (string | number)[];
}

// =============================================================================
// Community Sidebar Data Hook
// =============================================================================

export const useCommunitySidebarDataQuery = () => {
  return useQuery({
    queryKey: ['community-sidebar-data'],
    queryFn: async () => {
      console.log('Fetching community sidebar data...');

      try {
        const data = await invokeFunctionGet<CommunitySidebarData>('get-community-sidebar-data');

        console.log('Community sidebar data fetched successfully:', data);
        console.log('Data structure:', {
          sections: data?.sections?.length || 0,
          categories: data?.categories?.length || 0,
          announcements: data?.announcements?.length || 0,
          recentMembers: data?.recentMembers?.length || 0,
          memberStats: data?.memberStats || {},
          moderators: data?.moderators?.length || 0,
        });

        return data;
      } catch (error) {
        console.error('Error fetching community sidebar data:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - sidebar data doesn't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: 'Failed to load community sidebar data',
    },
  });
};

// Admin-specific hook that fetches ALL sections (including hidden ones) for management
export const useAdminCommunitySidebarDataQuery = () => {
  return useQuery({
    queryKey: ['admin-community-sidebar-data'],
    queryFn: async () => {
      console.log('Fetching admin community sidebar data...');

      const data = await invokeFunctionGet<CommunitySidebarData>('get-community-sidebar-data', {
        admin: 'true',
      });

      console.log('Admin community sidebar data fetched successfully:', data);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - admin data needs more frequent updates
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    meta: {
      errorMessage: 'Failed to load admin community sidebar data',
    },
  });
};

// =============================================================================
// Admin Community Management Hooks
// =============================================================================

export const useAdminCommunityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AdminCommunityRequest) => {
      console.log('Executing admin community operation...', request);

      const data = await invokeFunctionPost<{
        success: boolean;
        data: any;
        message: string;
      }>('admin-community-management', request);

      console.log('Admin community operation completed successfully:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      // Only invalidate the queries that actually exist in this system
      // All community data is contained within the sidebar data queries
      queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
      queryClient.invalidateQueries({ queryKey: ['admin-community-sidebar-data'] });
    },
    meta: {
      errorMessage: 'Failed to execute admin community operation',
    },
  });
};

// =============================================================================
// Specialized Admin Operation Hooks (Generated via Hook Factory)
// =============================================================================

// Hook factory to generate mutation hooks with reduced duplication
const createAdminMutationHook = <TData = any>(
  operation: AdminCommunityRequest['operation'],
  resource: AdminCommunityRequest['resource'],
  errorMessage: string
) => {
  return () => {
    const adminMutation = useAdminCommunityMutation();

    return useMutation({
      mutationFn: async (params: TData) => {
        // Handle different parameter patterns
        if (operation === 'create') {
          return adminMutation.mutateAsync({
            operation,
            resource,
            data: params,
          });
        }

        if (operation === 'reorder') {
          return adminMutation.mutateAsync({
            operation,
            resource,
            ids: params as (string | number)[],
          });
        }

        if (operation === 'delete' || operation === 'toggle_visibility') {
          return adminMutation.mutateAsync({
            operation,
            resource,
            id: params as string | number,
          });
        }

        if (operation === 'update') {
          const { id, data } = params as { id: string | number; data: any };
          return adminMutation.mutateAsync({
            operation,
            resource,
            id,
            data,
          });
        }

        throw new Error(`Unsupported operation: ${operation}`);
      },
      meta: { errorMessage },
    });
  };
};

// Category mutations (generated via factory)
export const useCreateCategoryMutation = createAdminMutationHook<Partial<CommunityCategory>>(
  'create',
  'categories',
  'Failed to create category'
);

export const useUpdateCategoryMutation = createAdminMutationHook<{
  id: number;
  data: Partial<CommunityCategory>;
}>('update', 'categories', 'Failed to update category');

export const useDeleteCategoryMutation = createAdminMutationHook<number>(
  'delete',
  'categories',
  'Failed to delete category'
);

export const useReorderCategoriesMutation = createAdminMutationHook<number[]>(
  'reorder',
  'categories',
  'Failed to reorder categories'
);

export const useToggleCategoryVisibilityMutation = createAdminMutationHook<number>(
  'toggle_visibility',
  'categories',
  'Failed to toggle category visibility'
);

// Announcement mutations (generated via factory)
export const useCreateAnnouncementMutation = createAdminMutationHook<
  Partial<CommunityAnnouncement>
>('create', 'announcements', 'Failed to create announcement');

export const useUpdateAnnouncementMutation = createAdminMutationHook<{
  id: string;
  data: Partial<CommunityAnnouncement>;
}>('update', 'announcements', 'Failed to update announcement');

export const useDeleteAnnouncementMutation = createAdminMutationHook<string>(
  'delete',
  'announcements',
  'Failed to delete announcement'
);

// Sidebar section mutations (generated via factory)
export const useUpdateSidebarSectionMutation = createAdminMutationHook<{
  id: string;
  data: Partial<CommunitySidebarSection>;
}>('update', 'sidebar_sections', 'Failed to update sidebar section');

export const useReorderSidebarSectionsMutation = createAdminMutationHook<string[]>(
  'reorder',
  'sidebar_sections',
  'Failed to reorder sidebar sections'
);

export const useToggleSidebarSectionVisibilityMutation = createAdminMutationHook<string>(
  'toggle_visibility',
  'sidebar_sections',
  'Failed to toggle sidebar section visibility'
);

export const useCreateSidebarSectionMutation = createAdminMutationHook<
  Partial<CommunitySidebarSection>
>('create', 'sidebar_sections', 'Failed to create sidebar section');

export const useDeleteSidebarSectionMutation = createAdminMutationHook<string>(
  'delete',
  'sidebar_sections',
  'Failed to delete sidebar section'
);
