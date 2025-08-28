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

// Unified role/tier tracking interfaces for precise cell-level management
interface RoleDataSource {
  value: string;
  source: string;
  editable: boolean;
  lastUpdated?: string;
}

interface RoleTrackingData {
  primaryRole: RoleDataSource; // Practitioners.role
  subscriptionTier: RoleDataSource; // Practitioners.subscription_tier
  additionalRoles: Array<RoleDataSource & {
    expires?: string;
    grantedBy?: string;
    grantedAt: string;
  }>; // UserRoles table entries
  jwtClaims: {
    role: RoleDataSource; // JWT app_metadata.role
    subscriptionTier: RoleDataSource; // JWT app_metadata.subscription_tier
  };
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

// Extended user interface with unified tracking
interface UnifiedUserData extends UserWithRoles {
  roleTracking: RoleTrackingData;
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

// Extended pagination with unified tracking
interface PaginatedUnifiedUsers {
  users: UnifiedUserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Bulk operation interfaces
interface BulkAdminOperationParams {
  userIds: string[];
  operation: 'grant_admin' | 'remove_admin' | 'update_subscription_tier';
  newSubscriptionTier?: string;
}

interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    userId: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Utility function to transform UserWithRoles into UnifiedUserData
const transformToUnifiedUserData = (user: UserWithRoles): UnifiedUserData => {
  return {
    ...user,
    roleTracking: {
      primaryRole: {
        value: user.role,
        source: 'Practitioners.role',
        editable: true,
        lastUpdated: user.created_at,
      },
      subscriptionTier: {
        value: user.subscription_tier,
        source: 'Practitioners.subscription_tier', 
        editable: true,
        lastUpdated: user.created_at,
      },
      additionalRoles: (user.roles || []).map(role => ({
        value: role.role_name,
        source: 'UserRoles',
        editable: true,
        expires: role.expires_at,
        grantedAt: role.granted_at,
      })),
      jwtClaims: {
        role: {
          value: user.role, // Assumed to be synced
          source: 'JWT.app_metadata.role',
          editable: false,
        },
        subscriptionTier: {
          value: user.subscription_tier, // Assumed to be synced
          source: 'JWT.app_metadata.subscription_tier',
          editable: false,
        },
      },
    },
  };
};

// Hook for unified user listing with role tracking
export const useUnifiedUserListQuery = (filters?: UserManagementFilters) => {
  return useQuery({
    queryKey: ['admin-users', 'unified-list', filters],
    queryFn: async (): Promise<PaginatedUnifiedUsers> => {
      // Use existing admin-manage-users endpoint
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
        console.error('Error fetching unified user list:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      // Extract and transform data
      let userData: PaginatedUsers;
      if (data?.success && data?.data) {
        userData = data.data as PaginatedUsers;
      } else {
        userData = data as PaginatedUsers;
      }

      // Transform to unified format
      return {
        users: userData.users.map(transformToUnifiedUserData),
        pagination: userData.pagination,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      console.error('Unified user list query failed:', error);
      return failureCount < 2;
    },
  });
};

// Bulk admin operations mutation
export const useBulkAdminOperationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BulkAdminOperationParams): Promise<BulkOperationResult> => {
      console.log('Performing bulk admin operation:', params);
      
      const results: BulkOperationResult = {
        successful: [],
        failed: [],
        summary: {
          total: params.userIds.length,
          successful: 0,
          failed: 0,
        },
      };

      // Process each user individually to track successes/failures
      for (const userId of params.userIds) {
        try {
          const payload: any = {
            targetUserId: userId,
          };

          switch (params.operation) {
            case 'grant_admin':
              payload.action = 'promote';
              payload.newRole = 'admin';
              if (params.newSubscriptionTier) {
                payload.subscriptionTier = params.newSubscriptionTier;
              }
              break;
            case 'remove_admin':
              payload.action = 'demote';
              payload.newRole = 'practitioner';
              break;
            case 'update_subscription_tier':
              payload.action = 'promote';
              payload.newRole = 'admin'; // Keep current role, just update tier
              payload.subscriptionTier = params.newSubscriptionTier;
              break;
          }

          const { data, error } = await supabase.functions.invoke('admin-manage-users', {
            body: payload,
          });

          if (error) {
            throw new Error(error.message);
          }

          results.successful.push(userId);
          results.summary.successful++;
        } catch (error) {
          console.error(`Bulk operation failed for user ${userId}:`, error);
          results.failed.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          results.summary.failed++;
        }
      }

      return results;
    },
    onSuccess: (result) => {
      console.log('Bulk admin operation completed:', result.summary);
      
      // Invalidate all user-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // If any operations were successful, also invalidate community data
      if (result.summary.successful > 0) {
        queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
      }
    },
    onError: (error) => {
      console.error('Bulk admin operation failed:', error);
    },
  });
};

// Hook for listing users with pagination and filtering (LEGACY - kept for backward compatibility)
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

// Cell-level update mutation for precise role/tier management
interface CellUpdateParams {
  userId: string;
  dataSource: 'primary_role' | 'subscription_tier' | 'additional_role';
  newValue: string;
  currentRole?: string; // Current role when updating subscription tier
  additionalRoleToRemove?: string; // For removing specific additional roles
  expiresAt?: string; // For additional roles with expiration
}

export const useCellUpdateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CellUpdateParams) => {
      console.log('Performing cell-level update:', params);

      let payload: any = {
        targetUserId: params.userId,
      };

      switch (params.dataSource) {
        case 'primary_role':
          payload.action = params.newValue === 'admin' ? 'promote' : 'demote';
          payload.newRole = params.newValue;
          break;

        case 'subscription_tier':
          payload.action = 'promote'; // Keep current role, update tier
          payload.newRole = params.currentRole || 'practitioner'; // Use current role or default
          payload.subscriptionTier = params.newValue;
          break;

        case 'additional_role':
          if (params.additionalRoleToRemove) {
            // Remove an additional role via admin-assign-roles endpoint
            const { data, error } = await supabase.functions.invoke('admin-assign-roles', {
              body: {
                action: 'revoke_role',
                userId: params.userId,
                roleName: params.additionalRoleToRemove,
              },
            });

            if (error) {
              throw new Error(`Failed to remove role: ${error.message}`);
            }

            return data;
          } else {
            // Add new additional role via admin-assign-roles endpoint
            const { data, error } = await supabase.functions.invoke('admin-assign-roles', {
              body: {
                action: 'assign_role',
                userId: params.userId,
                roleName: params.newValue,
                expiresAt: params.expiresAt,
              },
            });

            if (error) {
              throw new Error(`Failed to assign role: ${error.message}`);
            }

            return data;
          }
      }

      // For primary_role and subscription_tier updates via admin-manage-users
      const { data, error } = await supabase.functions.invoke('admin-manage-users', {
        body: payload,
      });

      if (error) {
        throw new Error(`Failed to update ${params.dataSource}: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, params) => {
      console.log(`Cell update successful for ${params.dataSource}:`, data);
      
      // Invalidate all user-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users', 'detail', params.userId] });
      
      // Invalidate role-specific queries if updating roles
      if (params.dataSource === 'additional_role' || params.dataSource === 'primary_role') {
        queryClient.invalidateQueries({ queryKey: ['admin', 'user-roles', params.userId] });
      }
      
      // Invalidate community data for profession/role changes
      queryClient.invalidateQueries({ queryKey: ['community-sidebar-data'] });
    },
    onError: (error, params) => {
      console.error(`Cell update failed for ${params.dataSource}:`, error);
    },
  });
};

// Export new interfaces for use in components
export type {
  UnifiedUserData,
  PaginatedUnifiedUsers,
  RoleTrackingData,
  RoleDataSource,
  BulkAdminOperationParams,
  BulkOperationResult,
  CellUpdateParams,
};
