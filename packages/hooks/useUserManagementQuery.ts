
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
  profession_flair?: string;
  display_hover_card?: boolean;
}

interface UserWithRoles {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  subscription_tier: string;
  profession_flair?: string;
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
      console.log('Fetching user list via Edge Function...');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.subscription_tier) params.append('subscription_tier', filters.subscription_tier);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      // Use GET request with query parameters
      const functionUrl = `admin-manage-users${params.toString() ? `?${params.toString()}` : ''}`;
      
      const { data, error } = await supabase.functions.invoke(functionUrl, {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error fetching user list:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return data as PaginatedUsers;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (users change less frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('User list query failed:', error);
      return failureCount < 2;
    }
  });
};

// Hook for getting a single user with detailed information
export const useUserDetailQuery = (userId: string) => {
  return useQuery({
    queryKey: ['admin-users', 'detail', userId],
    queryFn: async (): Promise<UserWithRoles> => {
      console.log('Fetching user detail via Edge Function...', { userId });
      
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: 'get',
          userId
        }
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
    }
  });
};

// Hook for updating user information
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, subscriptionTier }: { 
      userId: string; 
      role?: string; 
      subscriptionTier?: string; 
    }) => {
      console.log('Updating user via Edge Function...', { userId, role, subscriptionTier });
      
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        method: 'POST',
        body: {
          userId,
          role,
          subscriptionTier
        }
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
      console.log('User updated successfully:', data);
    },
    onError: (error) => {
      console.error('User update failed:', error);
    }
  });
};

// Hook for user status actions (activate/deactivate)
export const useUserStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'deactivate' | 'reactivate' }) => {
      console.log('Changing user status via Edge Function...', { userId, action });
      
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action,
          userId
        }
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
      console.log('User status changed successfully:', data);
    },
    onError: (error) => {
      console.error('User status change failed:', error);
    }
  });
};

// Hook for deleting users (admin only)
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('Deleting user via Edge Function...', { userId });
      
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: {
          action: 'delete',
          userId
        }
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
      console.log('User deleted successfully:', data);
    },
    onError: (error) => {
      console.error('User deletion failed:', error);
    }
  });
};
