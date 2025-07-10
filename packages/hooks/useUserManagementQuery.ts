// ABOUTME: TanStack Query hooks for user management operations via Edge Functions

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementFilters {
  role?: string;
  subscription_tier?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UserData {
  full_name?: string;
  avatar_url?: string;
  profession?: string;
  display_hover_card?: boolean;
}

interface UpdateUserParams {
  userId: string;
  role?: string;
  subscriptionTier?: string;
  profileData?: UserData;
}

interface UserWithRoles {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  subscription_tier: string;
  profession?: string;
  display_hover_card: boolean;
  contribution_score: number;
  created_at: string;
  roles?: Array<{
    role_name: string;
    granted_at: string;
    expires_at?: string;
  }>;
}

interface PaginatedUsers {
  users: UserWithRoles[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Hook for listing users with pagination and filtering
export const useUserListQuery = (filters?: UserManagementFilters) => {
  return useQuery({
    queryKey: ['admin-users', 'list', filters],
    queryFn: async (): Promise<PaginatedUsers> => {
      // Use POST with action-based payload
      const payload = {
        action: 'list',
        filters: {
          role: filters?.role,
          subscription_tier: filters?.subscription_tier,
          search: filters?.search,
          page: filters?.page || 1,
          limit: filters?.limit || 20,
        },
      };

      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: payload,
      });

      if (error) {
        console.error('Error fetching user list:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      // Extract data from standardized response wrapper
      if (data?.success && data?.data) {
        return data.data as PaginatedUsers;
      }

      return data as PaginatedUsers;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (users change less frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('User list query failed:', error);
      return failureCount < 2;
    },
  });
};

// Hook for getting a single user with detailed information
export const useUserDetailQuery = (userId: string) => {
  return useQuery({
    queryKey: ['admin-users', 'detail', userId],
    queryFn: async (): Promise<UserWithRoles> => {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: 'get',
          targetUserId: userId,
        },
      });

      if (error) {
        console.error('Error fetching user detail:', error);
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return data as UserWithRoles;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('User detail query failed:', error);
      return failureCount < 2;
    },
  });
};

// Hook for updating user information
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, subscriptionTier, profileData }: UpdateUserParams) => {
      // Determine action based on what's being updated
      let action: string;
      const payload: any = {
        targetUserId: userId,
      };

      if (role) {
        action = 'promote';
        payload.newRole = role;
        payload.subscriptionTier = subscriptionTier;
      } else if (profileData) {
        action = 'update_profile';
        payload.profileData = profileData;
      } else {
        throw new Error('Either role or profileData must be provided');
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action,
          ...payload,
        },
      });

      if (error) {
        console.error('Error updating user:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'detail', userId] });

      // CRITICAL FIX: Invalidate community sidebar cache when admin updates user data
      // This ensures profession changes appear immediately in community sidebar
      queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
    },
    onError: error => {
      console.error('User update failed:', error);
    },
  });
};

// Hook for user status actions (activate/deactivate)
export const useUserStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: string;
      action: 'deactivate' | 'reactivate';
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: action === 'deactivate' ? 'ban' : 'unban',
          targetUserId: userId,
        },
      });

      if (error) {
        console.error('Error changing user status:', error);
        throw new Error(`Failed to ${action} user: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, { userId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'detail', userId] });
    },
    onError: error => {
      console.error('User status change failed:', error);
    },
  });
};

// Hook for deleting users (admin only)
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: 'delete',
          targetUserId: userId,
        },
      });

      if (error) {
        console.error('Error deleting user:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.removeQueries({ queryKey: ['admin-users', 'detail', userId] });
    },
    onError: error => {
      console.error('User deletion failed:', error);
    },
  });
};
